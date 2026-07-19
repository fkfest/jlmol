// Curated ElemCo.jl method registry (hand-maintained).
//
// This is deliberately shaped like machine-readable catalog data so it could
// later be *generated* from an ElemCo.jl-side method catalog (the way
// js/elemco-options.js is generated from options.jl) with no change to the UI.
//
// Model mirrors ElemCo.jl's ECMethod (src/infos/ecmethods.jl): a method name is
// `[prefixes…] + core`, where `core` is theory+excitation (CCSD, CCSD(T), DCD,
// DC-CCSDT, …) and prefixes are composable flags. U/R (spin) come from a separate
// selector; the remaining prefixes (Λ, EOM-, SVD-, QV-, O, …) are part of a named
// method. Prefixes are emitted in ElemCo's canonical order.

// References (first step): the SCF wavefunction. These are macros, not method
// strings (so no core/prefix composition).
const ELEMCO_METHODS = {
  reference: [
    { id: 'dfhf',    label: 'DF-HF (RHF)',      macro: '@dfhf',    groups: ['scf', 'int'] },
    { id: 'dfuhf',   label: 'DF-UHF',           macro: '@dfuhf',   groups: ['scf', 'int'] },
    { id: 'dfmcscf', label: 'DF-MCSCF',         macro: '@dfmcscf', groups: ['scf', 'wf'] },
    { id: 'bohf',    label: 'BO-HF (FCIDUMP)',  macro: '@bohf',    groups: ['scf'], advanced: true },
    { id: 'bouhf',   label: 'BO-UHF (FCIDUMP)', macro: '@bouhf',   groups: ['scf'], advanced: true },
  ],
};

// Canonical prefix order (ElemCo.jl Prefix4Methods). U/R are supplied by the spin
// selector; the rest are baked into named methods below.
const ELEMCO_PREFIX_ORDER = ['EOM-', 'SVD-', '2D-', 'FRS-', 'FRT-', 'Λ', 'U', 'R', 'O', 'QV-', 'SOS-'];

// Spin type -> prefix. Closed-shell adds nothing.
const ELEMCO_SPINS = [
  { id: '',  label: 'Closed-shell' },
  { id: 'U', label: 'Unrestricted (U)' },
  { id: 'R', label: 'Restricted-open (R)' },
];

// Correlation methods, grouped for the dropdown. `core` = theory+excitation;
// `prefixes` = the fixed flags that define this named method; `macro` = the macro
// that runs it; `spins` = whether the U/R selector applies; `groups` = option
// groups surfaced first. Emitted string = canonical(prefixes + spin) + core.
const ELEMCO_CORRELATION_GROUPS = [
  { group: 'Møller–Plesset', methods: [
    { id: 'mp2', label: 'MP2', core: 'MP2', prefixes: [], macro: '@dfmp2', spins: false, groups: ['cc'] },
  ] },
  { group: 'Coupled cluster', methods: [
    { id: 'ccd',           label: 'CCD',      core: 'CCD',     prefixes: [],    macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'ccsd',          label: 'CCSD',     core: 'CCSD',    prefixes: [],    macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'ccsd_t',        label: 'CCSD(T)',  core: 'CCSD(T)', prefixes: [],    macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'lambda_ccsd_t', label: 'ΛCCSD(T)', core: 'CCSD(T)', prefixes: ['Λ'], macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'ccsdt',         label: 'CCSDT',    core: 'CCSDT',   prefixes: [],    macro: '@cc', spins: true, groups: ['cc'] },
  ] },
  { group: 'Distinguishable cluster', methods: [
    { id: 'dcd',      label: 'DCD',      core: 'DCD',      prefixes: [], macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'dcsd',     label: 'DCSD',     core: 'DCSD',     prefixes: [], macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'dc_ccsdt', label: 'DC-CCSDT', core: 'DC-CCSDT', prefixes: [], macro: '@cc', spins: true, groups: ['cc'] },
  ] },
  { group: 'Quasi-variational', methods: [
    { id: 'qv_ccd',  label: 'QV-CCD',  core: 'CCD', prefixes: ['QV-'],      macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'qv_dcd',  label: 'QV-DCD',  core: 'DCD', prefixes: ['QV-'],      macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'oqv_ccd', label: 'OQV-CCD', core: 'CCD', prefixes: ['O', 'QV-'], macro: '@cc', spins: true, groups: ['cc'] },
    { id: 'oqv_dcd', label: 'OQV-DCD', core: 'DCD', prefixes: ['O', 'QV-'], macro: '@cc', spins: true, groups: ['cc'] },
  ] },
  { group: 'Factorized (SVD)', methods: [
    { id: 'svd_dcsd',     label: 'SVD-DCSD',     core: 'DCSD',     prefixes: ['SVD-'], macro: '@dfcc', spins: false, groups: ['cc'] },
    { id: 'svd_dc_ccsdt', label: 'SVD-DC-CCSDT', core: 'DC-CCSDT', prefixes: ['SVD-'], macro: '@cc',   spins: false, groups: ['cc'] },
  ] },
  { group: 'Excited states (EOM)', methods: [
    { id: 'eom_ccsd', label: 'EOM-CCSD', core: 'CCSD', prefixes: ['EOM-'], macro: '@cc', spins: true, groups: ['cc', 'eom'] },
    { id: 'eom_dcsd', label: 'EOM-DCSD', core: 'DCSD', prefixes: ['EOM-'], macro: '@cc', spins: true, groups: ['cc', 'eom'] },
  ] },
  { group: 'Full CI', methods: [
    { id: 'fci',   label: 'FCI',         core: '', prefixes: [], macro: '@fci',   spins: false, groups: ['fci', 'davidson'] },
    { id: 'ciphi', label: 'CIPHI / SCI', core: '', prefixes: [], macro: '@ciphi', spins: false, groups: ['ciphi'] },
  ] },
];

// Option groups shown on the global "System & basis" card (top-level @set).
const ELEMCO_GLOBAL_GROUPS = ['wf', 'int', 'print'];
const ELEMCO_GLOBAL_EXCLUDE = { wf: ['charge', 'ms2'] };

// Flatten correlation methods for id lookup.
const ELEMCO_CORRELATION_BY_ID = {};
ELEMCO_CORRELATION_GROUPS.forEach((g) => g.methods.forEach((m) => { ELEMCO_CORRELATION_BY_ID[m.id] = m; }));

function elemcoCorrelationDef(id) { return ELEMCO_CORRELATION_BY_ID[id] || null; }

function elemcoMethodDef(category, id) {
  if (category === 'reference') return (ELEMCO_METHODS.reference || []).find((m) => m.id === id) || null;
  if (category === 'correlation') return elemcoCorrelationDef(id);
  return null;
}

// (built-in prefixes + spin) in canonical order, then core -> ElemCo.jl method string.
function elemcoComposeMethod(def, spin) {
  if (!def) return '';
  const all = (def.prefixes || []).slice();
  if (spin) all.push(spin);
  all.sort((a, b) => ELEMCO_PREFIX_ORDER.indexOf(a) - ELEMCO_PREFIX_ORDER.indexOf(b));
  return all.join('') + (def.core || '');
}

if (typeof window !== 'undefined') {
  window.ELEMCO_METHODS = ELEMCO_METHODS;
  window.ELEMCO_CORRELATION_GROUPS = ELEMCO_CORRELATION_GROUPS;
  window.ELEMCO_SPINS = ELEMCO_SPINS;
  window.ELEMCO_PREFIX_ORDER = ELEMCO_PREFIX_ORDER;
  window.ELEMCO_GLOBAL_GROUPS = ELEMCO_GLOBAL_GROUPS;
  window.ELEMCO_GLOBAL_EXCLUDE = ELEMCO_GLOBAL_EXCLUDE;
}
