#!/usr/bin/env node

/**
 * Cross-check the hand-curated method registry (js/elemco-methods.js) against
 * the generated ElemCo.jl catalogs (js/elemco-macros.js, js/elemco-options.js).
 *
 * The registry is deliberately hand-maintained, so it can silently drift from
 * the backend: a registry entry can point at a macro or option group that no
 * longer exists in the pinned ElemCo version, and new backend macros can stay
 * unreachable from the UI without anyone noticing. This script makes the drift
 * loud:
 *
 *   errors (exit 1):
 *     - a registry macro missing from ELEMCO_MACROS
 *     - a referenced option group (per-method `groups`, ELEMCO_GLOBAL_GROUPS,
 *       ELEMCO_GLOBAL_EXCLUDE) missing from ELEMCO_OPTIONS
 *     - an ELEMCO_GLOBAL_EXCLUDE field missing from its group
 *     - the two generated catalogs pinned to different ElemCo versions
 *
 *   warnings (informational):
 *     - catalog macros not covered by any registry entry (curation candidates)
 *
 * Usage:
 *   node scripts/check-elemco-sync.js
 *   npm run check-elemco-sync
 */

'use strict';

const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '..', 'js');

// The catalog files assign to `window.*`; elemco-methods.js declares consts and
// copies them onto `window` when present. Evaluate all three against one shared
// fake window and read everything back from it.
global.window = {};
for (const f of ['elemco-macros.js', 'elemco-options.js', 'elemco-methods.js']) {
  // eslint-disable-next-line no-eval
  eval(fs.readFileSync(path.join(JS_DIR, f), 'utf8'));
}
const w = global.window;

const errors = [];
const warnings = [];

// ---- catalog version pins must agree -----------------------------------------
if (w.ELEMCO_MACROS.sourceRef !== w.ELEMCO_OPTIONS.sourceRef) {
  errors.push(
    `catalog version mismatch: elemco-macros.js @ ${w.ELEMCO_MACROS.sourceRef}, ` +
    `elemco-options.js @ ${w.ELEMCO_OPTIONS.sourceRef} — regenerate both with the same --ref`
  );
}

// ---- every registry macro must exist in the macros catalog -------------------
const catalogMacros = new Set(w.ELEMCO_MACROS.macros.map((m) => m.name));
const registryEntries = [
  ...(w.ELEMCO_METHODS.reference || []).map((m) => ({ where: `reference/${m.id}`, macro: m.macro, groups: m.groups })),
  ...w.ELEMCO_CORRELATION_GROUPS.flatMap((g) =>
    g.methods.map((m) => ({ where: `${g.group}/${m.id}`, macro: m.macro, groups: m.groups }))),
];
const usedMacros = new Set();
for (const e of registryEntries) {
  const name = (e.macro || '').replace(/^@/, '');
  usedMacros.add(name);
  if (!catalogMacros.has(name)) {
    errors.push(`${e.where}: macro ${e.macro} not in elemco-macros.js (${w.ELEMCO_MACROS.sourceRef})`);
  }
}

// ---- every referenced option group must exist in the options catalog ---------
const catalogGroups = w.ELEMCO_OPTIONS.groups;
const checkGroup = (where, gid) => {
  if (!catalogGroups[gid]) {
    errors.push(`${where}: option group '${gid}' not in elemco-options.js (${w.ELEMCO_OPTIONS.sourceRef})`);
  }
};
for (const e of registryEntries) (e.groups || []).forEach((gid) => checkGroup(e.where, gid));
(w.ELEMCO_GLOBAL_GROUPS || []).forEach((gid) => checkGroup('ELEMCO_GLOBAL_GROUPS', gid));
for (const [gid, fields] of Object.entries(w.ELEMCO_GLOBAL_EXCLUDE || {})) {
  checkGroup('ELEMCO_GLOBAL_EXCLUDE', gid);
  const known = catalogGroups[gid] ? catalogGroups[gid].options : null;
  for (const f of fields) {
    if (known && !known[f]) {
      errors.push(`ELEMCO_GLOBAL_EXCLUDE: field '${gid}.${f}' not in elemco-options.js (${w.ELEMCO_OPTIONS.sourceRef})`);
    }
  }
}

// ---- reverse direction: catalog macros the registry does not surface ---------
// Utility/IO macros are legitimately absent from the method registry; list the
// rest as curation candidates so a new backend method cannot stay invisible.
const UTILITY = new Set([
  'check_molproinfo', 'copyfile', 'copywf', 'deletefile', 'dummy', 'export_molden',
  'dfints', 'ints', 'moints', 'transform_ints', 'write_ints', 'import_matrix',
  'freeze_orbs', 'rotate_orbs', 'show_orbs', 'localize', 'region', 'loadfile',
  'loadwf', 'savefile', 'savewf', 'usewf', 'molpro_input', 'molpro_output',
  'opt', 'reset', 'run', 'set', 'set_default_eltype',
]);
for (const m of w.ELEMCO_MACROS.macros) {
  if (usedMacros.has(m.name) || UTILITY.has(m.name)) continue;
  // Documented aliases of a surfaced macro are covered by the original.
  const alias = /^Alias for @(\S+?)\.?(?:\s|$)/.exec(m.doc || '');
  if (alias && usedMacros.has(alias[1])) continue;
  warnings.push(`macro @${m.name} is in elemco-macros.js but not surfaced by the method registry`);
}

// ---- report ------------------------------------------------------------------
for (const m of warnings) console.warn(`warning: ${m}`);
if (errors.length) {
  for (const m of errors) console.error(`ERROR: ${m}`);
  console.error(`\ncheck-elemco-sync: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(
  `check-elemco-sync: OK — ${registryEntries.length} registry entries against ` +
  `${catalogMacros.size} macros / ${Object.keys(catalogGroups).length} option groups ` +
  `@ ${w.ELEMCO_OPTIONS.sourceRef}${warnings.length ? `, ${warnings.length} warning(s)` : ''}`
);
