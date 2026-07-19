// Curated ElemCo.jl method registry (hand-maintained).
//
// The per-option metadata in js/elemco-options.js is generated from ElemCo.jl's
// options.jl, but the mapping of a user-facing *method* to the macro that runs
// it — and which option groups are most relevant to that method — is editorial
// and lives here. Each method knows the macro it emits, an optional method-name
// argument, and the option groups surfaced first in its options browser (the
// full set of 13 groups is always reachable via "show all groups").
//
// Macro facts are taken from ElemCo.jl src/ElemCo.jl (public @-macros):
//   references : @dfhf (RHF), @dfuhf, @dfmcscf, @bohf, @bouhf
//   correlation: @cc <method>, @dfcc <method>, @dfmp2, @fci, @ciphi
// A method macro may be followed by a `begin ... end` block of local `@set`
// lines; those options are automatically reset by ElemCo.jl after the call.

const ELEMCO_METHODS = {
  // First step of a calculation: the reference wavefunction.
  reference: [
    { id: 'dfhf',    label: 'DF-HF (RHF)',      macro: '@dfhf',    arg: null, groups: ['scf', 'int'] },
    { id: 'dfuhf',   label: 'DF-UHF',           macro: '@dfuhf',   arg: null, groups: ['scf', 'int'] },
    { id: 'dfmcscf', label: 'DF-MCSCF',         macro: '@dfmcscf', arg: null, groups: ['scf', 'wf'] },
    { id: 'bohf',    label: 'BO-HF (FCIDUMP)',  macro: '@bohf',    arg: null, groups: ['scf'], advanced: true },
    { id: 'bouhf',   label: 'BO-UHF (FCIDUMP)', macro: '@bouhf',   arg: null, groups: ['scf'], advanced: true },
  ],
  // Correlation / post-HF methods run on top of a reference.
  correlation: [
    { id: 'mp2',          label: 'MP2 (DF)',          macro: '@dfmp2', arg: null,           groups: ['cc'] },
    { id: 'ccsd',         label: 'CCSD',              macro: '@cc',    arg: 'ccsd',          groups: ['cc'] },
    { id: 'ccsd(t)',      label: 'CCSD(T)',           macro: '@cc',    arg: 'ccsd(t)',       groups: ['cc'] },
    { id: 'dcsd',         label: 'DCSD',              macro: '@cc',    arg: 'dcsd',          groups: ['cc'] },
    { id: 'ccsdt',        label: 'CCSDT',             macro: '@cc',    arg: 'ccsdt',         groups: ['cc'] },
    { id: 'dc-ccsdt',     label: 'DC-CCSDT',          macro: '@cc',    arg: 'dc-ccsdt',      groups: ['cc'] },
    { id: 'svd-dcsd',     label: 'SVD-DCSD (DF)',     macro: '@dfcc',  arg: 'svd-dcsd',      groups: ['cc'] },
    { id: 'svd-dc-ccsdt', label: 'SVD-DC-CCSDT',      macro: '@cc',    arg: 'svd-dc-ccsdt',  groups: ['cc'] },
    { id: 'fci',          label: 'FCI',               macro: '@fci',   arg: null,            groups: ['fci', 'davidson'] },
    { id: 'ciphi',        label: 'CIPHI / SCI',       macro: '@ciphi', arg: null,            groups: ['ciphi'] },
  ],
};

// Option groups shown on the global "System & basis" card (apply to the whole
// run, emitted as top-level @set). charge/ms2 have dedicated inputs, so they are
// excluded from the wf group here to avoid duplication.
const ELEMCO_GLOBAL_GROUPS = ['wf', 'int', 'print'];
const ELEMCO_GLOBAL_EXCLUDE = { wf: ['charge', 'ms2'] };

function elemcoMethodDef(category, id) {
  const list = ELEMCO_METHODS[category];
  if (!list) return null;
  return list.find((m) => m.id === id) || null;
}

if (typeof window !== 'undefined') {
  window.ELEMCO_METHODS = ELEMCO_METHODS;
  window.ELEMCO_GLOBAL_GROUPS = ELEMCO_GLOBAL_GROUPS;
  window.ELEMCO_GLOBAL_EXCLUDE = ELEMCO_GLOBAL_EXCLUDE;
}
