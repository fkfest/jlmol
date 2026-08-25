#!/usr/bin/env node

/**
 * Parse ElemCo.jl's option definitions and emit js/elemco-options.js.
 *
 * ElemCo.jl declares every calculation option in src/infos/options.jl as a set
 * of `@kwdef mutable struct XxxOptions` blocks (one per option group: wf, scf,
 * cc, ...), plus a master `Options` struct that maps each group key to its
 * struct. Each field carries a triple-quoted docstring holding a `⟨default⟩`
 * marker and a human description. This script turns that into a static metadata
 * object the renderer consumes to build the options browser / method builder.
 *
 * Usage:
 *   node scripts/parse-elemco-options.js                 # fetch main from GitHub
 *   node scripts/parse-elemco-options.js --ref v0.14.0   # fetch a tag/branch/sha
 *   node scripts/parse-elemco-options.js --file path.jl  # parse a local file
 *   node scripts/parse-elemco-options.js --stdout        # print, don't write
 *
 * The generated js/elemco-options.js is committed so the build stays offline;
 * re-run this whenever ElemCo.jl's options change.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO = 'fkfest/ElemCo.jl';
const SRC_PATH = 'src/infos/options.jl';
const OUT_PATH = path.join(__dirname, '..', 'js', 'elemco-options.js');

function parseArgs(argv) {
  const args = { ref: 'main', file: null, stdout: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ref') args.ref = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--stdout') args.stdout = true;
    else if (a === '--help' || a === '-h') { args.help = true; }
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

async function getSource(args) {
  if (args.file) {
    return { text: fs.readFileSync(args.file, 'utf8'), ref: `file:${args.file}`, url: args.file };
  }
  const url = `https://raw.githubusercontent.com/${REPO}/${args.ref}/${SRC_PATH}`;
  if (typeof fetch !== 'function') {
    throw new Error('global fetch() unavailable; use Node >=18 or pass --file');
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return { text: await res.text(), ref: args.ref, url };
}

// ---------------------------------------------------------------------------
// Description cleanup: turn a Julia docstring into plain tooltip text and pull
// out the leading `⟨default⟩` marker.
// ---------------------------------------------------------------------------
function cleanDescription(raw) {
  let s = raw.replace(/\$\(TYPEDFIELDS\)/g, ' ').trim();
  // Documenter cross-references and markdown links -> just the link text.
  s = s.replace(/\[`?([^`\]]+?)`?\]\(@ref[^)]*\)/g, '$1');
  s = s.replace(/\[([^\]]+?)\]\([^)]*\)/g, '$1');
  s = s.replace(/`/g, '');              // drop inline-code backticks
  s = s.replace(/\s+/g, ' ').trim();    // collapse whitespace/newlines
  return s;
}

// The docstring convention is: `⟨<default>⟩` <description>. Pull the marker out
// (⟨ = U+27E8, ⟩ = U+27E9). The marker sometimes holds an expression such as
// `sqrt(thr)*0.1` that differs from the literal code default, so we keep it
// separately for display but never treat it as the parsed value.
function splitDefaultMarker(desc) {
  const m = desc.match(/^⟨([^⟩]*)⟩\s*/);
  if (m) return { defaultDoc: m[1].trim(), text: desc.slice(m[0].length).trim() };
  return { defaultDoc: null, text: desc };
}

// ---------------------------------------------------------------------------
// Julia default literal -> { value, jsType }. Returns value:undefined and
// jsType:'unknown' for anything we can't confidently interpret (expressions,
// function calls), so the UI falls back to a raw text field.
// ---------------------------------------------------------------------------
function parseLiteral(literal, declaredType) {
  const lit = literal.trim();

  if (lit === 'true' || lit === 'false') return { value: lit === 'true', jsType: 'bool' };

  // Symbol, e.g. :SAD, :SO_SCI
  let m = lit.match(/^:([A-Za-z_][A-Za-z0-9_]*)$/);
  if (m) return { value: m[1], jsType: 'symbol' };

  // String, e.g. "wf.h5", "", "-"
  m = lit.match(/^"((?:[^"\\]|\\.)*)"$/);
  if (m) return { value: m[1], jsType: 'string' };

  // Vector, e.g. [100, 200] or [1e-6, 1e-7, 0.0]
  if (/^\[.*\]$/.test(lit)) {
    const inner = lit.slice(1, -1).trim();
    if (inner === '') return { value: [], jsType: 'vector-float' };
    const parts = inner.split(',').map((p) => p.trim());
    const nums = parts.map(parseNumber);
    if (nums.every((n) => n !== null)) {
      const allInt = parts.every((p) => /^[+-]?[0-9_]+$/.test(p));
      return { value: nums, jsType: allInt ? 'vector-int' : 'vector-float' };
    }
    return { value: undefined, jsType: 'unknown' };
  }

  // Numbers (respect the declared type to distinguish Int vs Float64)
  const num = parseNumber(lit);
  if (num !== null) {
    const isFloat =
      declaredType === 'Float64' ||
      /[.eE]/.test(lit.replace(/_/g, '')) ||
      declaredType === undefined && /[.eE]/.test(lit);
    return { value: num, jsType: isFloat ? 'float' : 'int' };
  }

  return { value: undefined, jsType: 'unknown' };
}

// Julia numeric literal -> Number (handles 1_000_000, 1.e-10, 1e-6, .5).
function parseNumber(s) {
  const t = s.replace(/_/g, '');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

// Map a Julia declared type (or, if absent, the inferred jsType) to a widget hint.
function widgetType(declaredType, inferred) {
  switch (declaredType) {
    case 'Bool': return 'bool';
    case 'Int': return 'int';
    case 'Float64': return 'float';
    case 'String': return 'string';
    case 'Symbol': return 'symbol';
    case 'Vector{Int}': return 'vector-int';
    case 'Vector{Float64}': return 'vector-float';
    default: return inferred; // no annotation: trust the literal
  }
}

// Collect `:Choice` tokens mentioned in a docstring (backticked or not). Best
// effort: Symbol options list their allowed values in prose. Always include the
// default so the resulting set is never empty for a real choice.
function extractChoices(desc, defaultValue) {
  const found = [];
  const re = /:([A-Za-z_][A-Za-z0-9_]*)/g;
  let m;
  while ((m = re.exec(desc)) !== null) {
    if (!found.includes(m[1])) found.push(m[1]);
  }
  if (defaultValue != null && !found.includes(defaultValue)) found.unshift(defaultValue);
  return found;
}

// ---------------------------------------------------------------------------
// Core parser: line state machine over options.jl.
// ---------------------------------------------------------------------------
function parseOptions(text) {
  const lines = text.split('\n');

  const structDocs = {};   // StructName -> cleaned struct docstring
  const structFields = {}; // StructName -> { field -> meta }
  const structOrder = [];  // struct declaration order
  let masterGroups = null; // from the `Options` struct: [{ key, struct, doc }]

  let inDoc = false;
  let docBuf = [];
  let pendingDoc = null;   // last completed docstring, awaiting a struct/field
  let currentStruct = null;

  const STRUCT_RE = /^\s*@kwdef\s+mutable\s+struct\s+([A-Za-z_][A-Za-z0-9_]*)/;
  const FIELD_RE = /^\s*([A-Za-z_][A-Za-z0-9_!]*)\s*(?:::\s*([^=]+?))?\s*=\s*(.+?)\s*$/;

  const finishDoc = () => {
    pendingDoc = docBuf.join('\n').trim();
    docBuf = [];
  };

  for (const line of lines) {
    const quoteCount = (line.match(/"""/g) || []).length;

    if (inDoc) {
      if (quoteCount % 2 === 1) {
        docBuf.push(line.slice(0, line.indexOf('"""')));
        inDoc = false;
        finishDoc();
      } else {
        docBuf.push(line);
      }
      continue;
    }

    if (quoteCount >= 2) {
      // Opens and closes on one line.
      const first = line.indexOf('"""');
      const last = line.lastIndexOf('"""');
      docBuf.push(line.slice(first + 3, last));
      finishDoc();
      continue;
    }
    if (quoteCount === 1) {
      docBuf.push(line.slice(line.indexOf('"""') + 3));
      inDoc = true;
      continue;
    }

    // --- plain code line ---
    const structM = line.match(STRUCT_RE);
    if (structM) {
      const name = structM[1];
      structDocs[name] = cleanDescription(pendingDoc || '');
      structFields[name] = {};
      structOrder.push(name);
      currentStruct = name;
      pendingDoc = null;
      continue;
    }

    if (/^\s*end\b/.test(line)) {
      currentStruct = null;
      pendingDoc = null;
      continue;
    }

    if (currentStruct) {
      const fieldM = line.match(FIELD_RE);
      if (fieldM) {
        const [, fname, rawType, rawDefault] = fieldM;
        const declaredType = rawType ? rawType.trim() : undefined;

        if (currentStruct === 'Options') {
          // Master struct: `wf::WfOptions = WfOptions()` etc.
          if (!masterGroups) masterGroups = [];
          masterGroups.push({
            key: fname,
            struct: declaredType,
            doc: cleanDescription(pendingDoc || ''),
          });
          pendingDoc = null;
          continue;
        }

        const descRaw = cleanDescription(pendingDoc || '');
        const { defaultDoc, text: descText } = splitDefaultMarker(descRaw);
        const { value, jsType: inferred } = parseLiteral(rawDefault, declaredType);
        const wtype = widgetType(declaredType, inferred);
        const meta = {
          name: fname,
          type: declaredType || `(${inferred})`,
          widget: wtype,
          default: value,
          defaultLiteral: rawDefault.trim(),
          defaultDoc,
          desc: descText,
        };
        if (wtype === 'symbol') meta.choices = extractChoices(descRaw, value);
        structFields[currentStruct][fname] = meta;
        pendingDoc = null;
        continue;
      }
    }

    // Anything else (blank, comment, stray code) drops any dangling doc only if
    // it's clearly unrelated; keep pendingDoc across blank lines.
    if (line.trim() !== '' && !/^\s*#/.test(line)) {
      // non-field, non-doc code inside/after a struct: leave pendingDoc as-is
    }
  }

  if (!masterGroups) throw new Error('Could not find master `Options` struct — parser out of date?');

  // Assemble groups in the master struct's declared order.
  const groups = {};
  const groupOrder = [];
  for (const g of masterGroups) {
    const fields = structFields[g.struct];
    if (!fields) throw new Error(`Master group '${g.key}' references unknown struct '${g.struct}'`);
    const label = cleanLabel(structDocs[g.struct] || g.doc || g.key);
    groups[g.key] = {
      key: g.key,
      struct: g.struct,
      label,
      summary: g.doc,
      fields,
    };
    groupOrder.push(g.key);
  }

  return { groups, groupOrder };
}

// "Options for wavefunction/orbitals." -> "Wavefunction/orbitals"
function cleanLabel(structDoc) {
  let s = (structDoc || '').split(/[.\n]/)[0].trim();
  // Some docstrings arrive with the signature line glued on ("MemoryOptions
  // Options for …") and a long parenthetical before the first period. The
  // label is a group header; both go — the full text stays in `summary`.
  s = s.replace(/^[A-Z][A-Za-z0-9]*Options\s+/, '');
  s = s.replace(/^Options?\s+for\s+/i, '').replace(/^Option\s+for\s+/i, '');
  s = s.replace(/\s*\([^()]*\)$/, '');
  if (!s) return structDoc;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function render(meta, source) {
  const generated = new Date().toISOString().slice(0, 10);
  const header =
`// AUTO-GENERATED — do not edit by hand.
// Source: ElemCo.jl ${SRC_PATH} @ ${source.ref}
// Regenerate: node scripts/parse-elemco-options.js [--ref <tag>]
`;
  const payload = {
    sourceRepo: REPO,
    sourceRef: source.ref,
    sourceUrl: source.url,
    generated,
    groupOrder: meta.groupOrder,
    groups: meta.groups,
  };
  return `${header}window.ELEMCO_OPTIONS = ${JSON.stringify(payload, null, 2)};\n`;
}

(async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node scripts/parse-elemco-options.js [--ref <tag>] [--file <path>] [--stdout]');
    return;
  }
  const source = await getSource(args);
  const meta = parseOptions(source.text);

  const numGroups = meta.groupOrder.length;
  const numFields = meta.groupOrder.reduce((n, k) => n + Object.keys(meta.groups[k].fields).length, 0);
  if (numGroups < 5 || numFields < 50) {
    throw new Error(`Sanity check failed: parsed only ${numGroups} groups / ${numFields} fields — refusing to write a likely-broken metadata file.`);
  }

  const out = render(meta, source);
  if (args.stdout) {
    process.stdout.write(out);
  } else {
    fs.writeFileSync(OUT_PATH, out);
    console.log(`Wrote ${path.relative(path.join(__dirname, '..'), OUT_PATH)} — ${numGroups} groups, ${numFields} options (ElemCo.jl @ ${source.ref}).`);
  }
})().catch((err) => {
  console.error(`parse-elemco-options: ${err.message}`);
  process.exit(1);
});
