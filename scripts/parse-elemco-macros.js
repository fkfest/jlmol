#!/usr/bin/env node

/**
 * Parse ElemCo.jl's exported macros and emit js/elemco-macros.js.
 *
 * ElemCo.jl's public macros are declared in src/ElemCo.jl as `export @name, …`
 * lines followed by `"""docstring""" macro name(sig) … end` definitions. This
 * script collects the exported macros with their signature, a cleaned docstring
 * (for hover help), and whether they accept a local `begin…end` options block, so
 * the renderer can offer a "Macro" building block.
 *
 * Usage:
 *   node scripts/parse-elemco-macros.js                 # fetch main from GitHub
 *   node scripts/parse-elemco-macros.js --ref v0.14.0   # fetch a tag/branch/sha
 *   node scripts/parse-elemco-macros.js --file path.jl  # parse a local file
 *   node scripts/parse-elemco-macros.js --stdout        # print, don't write
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO = 'fkfest/ElemCo.jl';
const SRC_PATH = 'src/ElemCo.jl';
const OUT_PATH = path.join(__dirname, '..', 'js', 'elemco-macros.js');

// Internal setup/util macros that aren't useful as user-facing building blocks.
const SKIP = new Set(['ECinit', 'tryECinit', 'setupEC', 'var2string', 'mainname', 'print_input']);

function parseArgs(argv) {
  const args = { ref: 'main', file: null, stdout: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ref') args.ref = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--stdout') args.stdout = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

async function getSource(args) {
  if (args.file) return { text: fs.readFileSync(args.file, 'utf8'), ref: `file:${args.file}`, url: args.file };
  const url = `https://raw.githubusercontent.com/${REPO}/${args.ref}/${SRC_PATH}`;
  if (typeof fetch !== 'function') throw new Error('global fetch() unavailable; use Node >=18 or pass --file');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return { text: await res.text(), ref: args.ref, url };
}

// Turn a docstring into concise hover text: drop the leading signature line and
// everything from the first section header / code fence, then strip markdown.
function cleanDoc(raw) {
  const lines = raw.replace(/\r/g, '').split('\n');
  const kept = [];
  let started = false;
  for (const line of lines) {
    const t = line.trim();
    if (!started) {
      if (t === '') continue;           // leading blanks
      if (t.startsWith('@')) { started = true; continue; } // signature line
      started = true;                    // no signature line; description starts
    }
    if (t.startsWith('```') || t.startsWith('# ')) break; // stop at examples/sections
    kept.push(line);
  }
  let s = kept.join('\n');
  s = s.replace(/\[`?([^`\]]+?)`?\]\(@ref[^)]*\)/g, '$1'); // cross-refs -> text
  s = s.replace(/\[([^\]]+?)\]\([^)]*\)/g, '$1');
  s = s.replace(/`/g, '');
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

function parseMacros(text) {
  const lines = text.split('\n');

  // 1) exported macro names.
  const exported = new Set();
  for (const line of lines) {
    const m = line.match(/^\s*export\s+(.+)$/);
    if (!m) continue;
    const names = m[1].match(/@[A-Za-z_][\w!ϕΛ]*/g) || [];
    names.forEach((n) => exported.add(n.slice(1)));
  }

  // 2) walk with a triple-quote state machine, capturing each macro def's doc.
  const defs = []; // { name, sig, doc, line }
  const aliases = []; // { name, target }
  let inDoc = false;
  let docBuf = [];
  let pendingDoc = null;

  const finishDoc = () => { pendingDoc = docBuf.join('\n'); docBuf = []; };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const quotes = (line.match(/"""/g) || []).length;

    if (inDoc) {
      if (quotes % 2 === 1) { docBuf.push(line.slice(0, line.indexOf('"""'))); inDoc = false; finishDoc(); }
      else docBuf.push(line);
      continue;
    }
    if (quotes >= 2) { docBuf.push(line.slice(line.indexOf('"""') + 3, line.lastIndexOf('"""'))); finishDoc(); continue; }
    if (quotes === 1) { docBuf.push(line.slice(line.indexOf('"""') + 3)); inDoc = true; continue; }

    const md = line.match(/^\s*macro\s+([A-Za-z_][\w!ϕΛ]*)\s*\(([^)]*)\)/);
    if (md) {
      defs.push({ name: md[1], sig: md[2].trim(), doc: cleanDoc(pendingDoc || ''), line: i });
      pendingDoc = null;
      continue;
    }
    const al = line.match(/^\s*var"@([A-Za-z_][\w!ϕΛ]*)"\s*=\s*var"@([A-Za-z_][\w!ϕΛ]*)"/);
    if (al) { aliases.push({ name: al[1], target: al[2] }); pendingDoc = null; continue; }
    // A docstring attaches only to an immediately-following macro/alias (blank
    // lines allowed). Any intervening code ends the association so a docstring
    // can't leak onto a later definition.
    if (line.trim() !== '') pendingDoc = null;
  }

  // 3) acceptsOptions: does the macro body use an options block?
  const OPT_RE = /opts_block|is_options_block|with_local_options/;
  const byName = {};
  defs.forEach((d, idx) => {
    const end = idx + 1 < defs.length ? defs[idx + 1].line : Math.min(lines.length, d.line + 80);
    const body = lines.slice(d.line, end).join('\n');
    d.acceptsOptions = OPT_RE.test(body);
    byName[d.name] = d;
  });

  // 4) resolve aliases to their target's metadata.
  aliases.forEach((a) => {
    const t = byName[a.target];
    if (t && !byName[a.name]) {
      defs.push({ name: a.name, sig: t.sig, doc: `Alias for @${a.target}. ${t.doc}`.trim(), acceptsOptions: t.acceptsOptions, line: t.line });
      byName[a.name] = byName[a.target];
    }
  });

  // 5) keep exported, non-internal macros; sort by name.
  const macros = defs
    .filter((d) => exported.has(d.name) && !SKIP.has(d.name))
    .map((d) => ({ name: d.name, signature: `@${d.name}(${d.sig})`, acceptsOptions: !!d.acceptsOptions, doc: d.doc }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return macros;
}

function render(macros, source) {
  const generated = new Date().toISOString().slice(0, 10);
  const header =
`// AUTO-GENERATED — do not edit by hand.
// Source: ElemCo.jl ${SRC_PATH} @ ${source.ref}
// Regenerate: node scripts/parse-elemco-macros.js [--ref <tag>]
`;
  const payload = { sourceRepo: REPO, sourceRef: source.ref, sourceUrl: source.url, generated, macros };
  return `${header}window.ELEMCO_MACROS = ${JSON.stringify(payload, null, 2)};\n`;
}

(async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log('Usage: node scripts/parse-elemco-macros.js [--ref <tag>] [--file <path>] [--stdout]'); return; }
  const source = await getSource(args);
  const macros = parseMacros(source.text);
  if (macros.length < 15) throw new Error(`Sanity check failed: parsed only ${macros.length} macros — refusing to write.`);
  const out = render(macros, source);
  if (args.stdout) process.stdout.write(out);
  else { fs.writeFileSync(OUT_PATH, out); console.log(`Wrote ${path.relative(path.join(__dirname, '..'), OUT_PATH)} — ${macros.length} macros (ElemCo.jl @ ${source.ref}).`); }
})().catch((err) => { console.error(`parse-elemco-macros: ${err.message}`); process.exit(1); });
