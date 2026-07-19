// AUTO-GENERATED — do not edit by hand.
// Source: ElemCo.jl src/infos/options.jl @ main
// Regenerate: node scripts/parse-elemco-options.js [--ref <tag>]
window.ELEMCO_OPTIONS = {
  "sourceRepo": "fkfest/ElemCo.jl",
  "sourceRef": "main",
  "sourceUrl": "https://raw.githubusercontent.com/fkfest/ElemCo.jl/main/src/infos/options.jl",
  "generated": "2026-07-18",
  "groupOrder": [
    "wf",
    "scf",
    "int",
    "cc",
    "eom",
    "fci",
    "ciphi",
    "dmrg",
    "cholesky",
    "laplace",
    "diis",
    "davidson",
    "print"
  ],
  "groups": {
    "wf": {
      "key": "wf",
      "struct": "WfOptions",
      "label": "Wavefunction/orbitals",
      "summary": "Wavefunction options (WfOptions).",
      "fields": {
        "ms2": {
          "name": "ms2",
          "type": "Int",
          "widget": "int",
          "default": -1,
          "defaultLiteral": "-1",
          "defaultDoc": "-1",
          "desc": "spin magnetic quantum number times two (2×mₛ) of the system."
        },
        "nelec": {
          "name": "nelec",
          "type": "Int",
          "widget": "int",
          "default": -1,
          "defaultLiteral": "-1",
          "defaultDoc": "-1",
          "desc": "number of electrons. If < 0, the number of electrons is read from the FCIDump file or guessed for the neutral system."
        },
        "charge": {
          "name": "charge",
          "type": "Int",
          "widget": "int",
          "default": 0,
          "defaultLiteral": "0",
          "defaultDoc": "0",
          "desc": "charge of the system (relative to nelec/FCIDump/neutral system!)."
        },
        "dump": {
          "name": "dump",
          "type": "String",
          "widget": "string",
          "default": "wf.h5",
          "defaultLiteral": "\"wf.h5\"",
          "defaultDoc": "\"wf.h5\"",
          "desc": "filename for wavefunction dump (stored in TREXIO format)."
        },
        "store": {
          "name": "store",
          "type": "String",
          "widget": "string",
          "default": "",
          "defaultLiteral": "\"\"",
          "defaultDoc": "\"\"",
          "desc": "filename to store the output wavefunction dump (stored in TREXIO format). If empty, dump will be used."
        },
        "start": {
          "name": "start",
          "type": "String",
          "widget": "string",
          "default": "",
          "defaultLiteral": "\"\"",
          "defaultDoc": "\"\"",
          "desc": "filename to read starting amplitudes from (TREXIO format). If empty, amplitudes are read from dump. If provided, amplitudes (and MOs/basis) are read from this file and projected to the current MO basis."
        },
        "npositron": {
          "name": "npositron",
          "type": "Int",
          "widget": "int",
          "default": 0,
          "defaultLiteral": "0",
          "defaultDoc": "0",
          "desc": "Number of positrons."
        },
        "core": {
          "name": "core",
          "type": "Symbol",
          "widget": "symbol",
          "default": "large",
          "defaultLiteral": ":large",
          "defaultDoc": ":large",
          "desc": "core type for frozen-core approximation: - :none no frozen-core approximation, - :small semi-core orbitals correlated, - :large semi-core orbitals frozen.",
          "choices": [
            "large",
            "none",
            "small"
          ]
        },
        "freeze_nocc": {
          "name": "freeze_nocc",
          "type": "Int",
          "widget": "int",
          "default": -1,
          "defaultLiteral": "-1",
          "defaultDoc": "-1",
          "desc": "number of occupied (core) orbitals to freeze (overwrites core)."
        },
        "freeze_nvirt": {
          "name": "freeze_nvirt",
          "type": "Int",
          "widget": "int",
          "default": 0,
          "defaultLiteral": "0",
          "defaultDoc": "0",
          "desc": "number of virtual (highest) orbitals to freeze."
        },
        "occa": {
          "name": "occa",
          "type": "String",
          "widget": "string",
          "default": "-",
          "defaultLiteral": "\"-\"",
          "defaultDoc": "\"-\"",
          "desc": "occupied α (or closed-shell) orbitals. The occupation strings can be given as a + separated list, e.g. occa = 1+2+3 or equivalently 1-3. Additionally, the spatial symmetry of the orbitals can be specified with the syntax orb.sym, e.g. occa = \"-5.1+-2.2+-4.3\"."
        },
        "occb": {
          "name": "occb",
          "type": "String",
          "widget": "string",
          "default": "-",
          "defaultLiteral": "\"-\"",
          "defaultDoc": "\"-\"",
          "desc": "occupied β orbitals. If occb::String is empty, the occupied β orbitals are the same as the occupied α orbitals (closed-shell case)."
        },
        "active": {
          "name": "active",
          "type": "String",
          "widget": "string",
          "default": "-",
          "defaultLiteral": "\"-\"",
          "defaultDoc": "\"-\"",
          "desc": "active space. The active space is defined by the occupation string (cf. occa) or in the (#elec, #orb) format."
        },
        "ignore_error": {
          "name": "ignore_error",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "ignore various errors in sanity checks."
        },
        "print_nlargest": {
          "name": "print_nlargest",
          "type": "Int",
          "widget": "int",
          "default": 5,
          "defaultLiteral": "5",
          "defaultDoc": "5",
          "desc": "number of largest orbitals to print."
        },
        "print_thr": {
          "name": "print_thr",
          "type": "Float64",
          "widget": "float",
          "default": 0.1,
          "defaultLiteral": "0.1",
          "defaultDoc": "0.1",
          "desc": "threshold for orbital coefficients to print."
        }
      }
    },
    "scf": {
      "key": "scf",
      "struct": "ScfOptions",
      "label": "SCF calculation",
      "summary": "SCF options (ScfOptions).",
      "fields": {
        "thr": {
          "name": "thr",
          "type": "Float64",
          "widget": "float",
          "default": 1e-10,
          "defaultLiteral": "1.e-10",
          "defaultDoc": "1.e-10",
          "desc": "convergence threshold."
        },
        "thren": {
          "name": "thren",
          "type": "Float64",
          "widget": "float",
          "default": -1,
          "defaultLiteral": "-1.0",
          "defaultDoc": "sqrt(thr)*0.1",
          "desc": "energy convergence threshold (used additionally to thr)."
        },
        "maxit": {
          "name": "maxit",
          "type": "Int",
          "widget": "int",
          "default": 50,
          "defaultLiteral": "50",
          "defaultDoc": "50",
          "desc": "maximum number of iterations."
        },
        "imagtol": {
          "name": "imagtol",
          "type": "Float64",
          "widget": "float",
          "default": 1e-8,
          "defaultLiteral": "1.e-8",
          "defaultDoc": "1.e-8",
          "desc": "tolerance for imaginary part of MO coefs (for biorthogonal)."
        },
        "direct": {
          "name": "direct",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "direct calculation without storing integrals."
        },
        "guess": {
          "name": "guess",
          "type": "Symbol",
          "widget": "symbol",
          "default": "SAD",
          "defaultLiteral": ":SAD",
          "defaultDoc": ":SAD",
          "desc": "orbital guess: - :HCORE from core Hamiltonian - :SAD from atomic densities - :GWH not implemented yet - :ORB from previous orbitals stored in dump file WfOptions.dump",
          "choices": [
            "SAD",
            "HCORE",
            "GWH",
            "ORB"
          ]
        },
        "guess_pos": {
          "name": "guess_pos",
          "type": "Symbol",
          "widget": "symbol",
          "default": "HCORE",
          "defaultLiteral": ":HCORE",
          "defaultDoc": ":HCORE",
          "desc": "positron orbital guess. Only :HCORE is implemented.",
          "choices": [
            "HCORE"
          ]
        },
        "bisecdamp": {
          "name": "bisecdamp",
          "type": "Float64",
          "widget": "float",
          "default": 0.5,
          "defaultLiteral": "0.5",
          "defaultDoc": "0.5",
          "desc": "damping factor for bisection search in augmented Hessian tuning."
        },
        "maxit4lambda": {
          "name": "maxit4lambda",
          "type": "Int",
          "widget": "int",
          "default": 3,
          "defaultLiteral": "3",
          "defaultDoc": "3",
          "desc": "maximum number of iterations for searching for lambda value to get a reasonalbe guess within trust radius for MCSCF."
        },
        "HessianType": {
          "name": "HessianType",
          "type": "Symbol",
          "widget": "symbol",
          "default": "SO_SCI",
          "defaultLiteral": ":SO_SCI",
          "defaultDoc": ":SO_SCI",
          "desc": "Hessian Type for MCSCF: - :SO Second Order Approximation - :SCI Super CI - :SO_SCI Second Order Approximation combing Super CI",
          "choices": [
            "SO_SCI",
            "SO",
            "SCI"
          ]
        },
        "initVecType": {
          "name": "initVecType",
          "type": "Symbol",
          "widget": "symbol",
          "default": "GRADIENT_SETPLUS",
          "defaultLiteral": ":GRADIENT_SETPLUS",
          "defaultDoc": ":GRADIENT_SETPLUS",
          "desc": "Initial Vectors Type for MCSCF: - :INHERIT from last macro/micro iterations - :GRADIENT_SET b0 as [1,0,0,...], b1 as gradient - :GRADIENT_SETPLUS b0, b1 as GRADIENT_SET, b2 as zeros but 1 at the first closed-virtual rotation parameter",
          "choices": [
            "GRADIENT_SETPLUS",
            "INHERIT",
            "GRADIENT_SET"
          ]
        },
        "temperature_guess": {
          "name": "temperature_guess",
          "type": "Float64",
          "widget": "float",
          "default": 0,
          "defaultLiteral": "0.0",
          "defaultDoc": "0.0",
          "desc": "Fermi-Dirac temperature for starting guess (at the moment works only for BO-HF)."
        },
        "gamaDavScale": {
          "name": "gamaDavScale",
          "type": "Float64",
          "widget": "float",
          "default": 0.1,
          "defaultLiteral": "0.1",
          "defaultDoc": "0.1",
          "desc": "the threshold of davidson convergence residure norm scaled to norm of g the gradient, for MCSCF."
        },
        "SO_SCI_origin": {
          "name": "SO_SCI_origin",
          "type": "(bool)",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "if true then use the original SO_SCI Hessian"
        },
        "trustScale": {
          "name": "trustScale",
          "type": "(float)",
          "widget": "float",
          "default": 0.8,
          "defaultLiteral": "0.8",
          "defaultDoc": "0.8",
          "desc": "the trust region of sqrt(sum(x.^2)) should be [trustScale,1] * trust"
        },
        "lambdaMax": {
          "name": "lambdaMax",
          "type": "(float)",
          "widget": "float",
          "default": 1000,
          "defaultLiteral": "1000.0",
          "defaultDoc": "1000.0",
          "desc": "the maximum number of lambda when adjusting the level shift"
        },
        "davErrorMin": {
          "name": "davErrorMin",
          "type": "(float)",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1e-6",
          "defaultDoc": "1e-6",
          "desc": "the minmum convergence threshold for davidson algorithm"
        },
        "iniDavMatSize": {
          "name": "iniDavMatSize",
          "type": "(int)",
          "widget": "int",
          "default": 200,
          "defaultLiteral": "200",
          "defaultDoc": "200",
          "desc": "the size of initial Davidson projected matrix"
        },
        "trustShrinkScale": {
          "name": "trustShrinkScale",
          "type": "(float)",
          "widget": "float",
          "default": 0.7,
          "defaultLiteral": "0.7",
          "defaultDoc": "0.7",
          "desc": "the shrink scale of trust region"
        },
        "trustExpandScale": {
          "name": "trustExpandScale",
          "type": "(float)",
          "widget": "float",
          "default": 1.2,
          "defaultLiteral": "1.2",
          "defaultDoc": "1.2",
          "desc": "the expand scale of trust region"
        },
        "enerQuotientLowerBound": {
          "name": "enerQuotientLowerBound",
          "type": "(float)",
          "widget": "float",
          "default": 0.25,
          "defaultLiteral": "0.25",
          "defaultDoc": "0.25",
          "desc": "when energy quotient is lower than this value, the trust value should be smaller"
        },
        "enerQuotientUpperBound": {
          "name": "enerQuotientUpperBound",
          "type": "(float)",
          "widget": "float",
          "default": 0.75,
          "defaultLiteral": "0.75",
          "defaultDoc": "0.75",
          "desc": "when energy quotient is higher than this value, the trust value should be larger"
        },
        "pseudo": {
          "name": "pseudo",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "Generate pseudo-canonical basis instead of solving the SCF problem, i.e., build and block-diagonalize the Fock matrix without changing the Fermi level. At the moment, it works only for BO-HF."
        }
      }
    },
    "int": {
      "key": "int",
      "struct": "IntOptions",
      "label": "Integral calculation",
      "summary": "Integral options (IntOptions).",
      "fields": {
        "df": {
          "name": "df",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "use density-fitted integrals."
        },
        "fcidump": {
          "name": "fcidump",
          "type": "String",
          "widget": "string",
          "default": "",
          "defaultLiteral": "\"\"",
          "defaultDoc": "\"\"",
          "desc": "store integrals in FCIDump format."
        },
        "cartesian": {
          "name": "cartesian",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "use Cartesian subshells instead of Spherical."
        },
        "target_batch_length": {
          "name": "target_batch_length",
          "type": "Int",
          "widget": "int",
          "default": 1000,
          "defaultLiteral": "1000",
          "defaultDoc": "1000",
          "desc": "target batch length for the integral transformation."
        },
        "use_fallback_basis": {
          "name": "use_fallback_basis",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "use fallback basis sets (in case of missing basis sets)."
        },
        "check_fit_basis": {
          "name": "check_fit_basis",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "sanity check of the fit basis (i.e., that it's not an AO basis)"
        },
        "split_ashells": {
          "name": "split_ashells",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "split independent angular shells (important for efficiency)."
        }
      }
    },
    "cc": {
      "key": "cc",
      "struct": "CcOptions",
      "label": "Coupled-Cluster calculation",
      "summary": "Coupled-Cluster options (CcOptions).",
      "fields": {
        "thr": {
          "name": "thr",
          "type": "Float64",
          "widget": "float",
          "default": 1e-10,
          "defaultLiteral": "1.e-10",
          "defaultDoc": "1.e-10",
          "desc": "convergence threshold."
        },
        "conven": {
          "name": "conven",
          "type": "Float64",
          "widget": "float",
          "default": 0.1,
          "defaultLiteral": "0.1",
          "defaultDoc": "0.1",
          "desc": "energy convergence factor. The energy convergence threshold is sqrt(thr) * conven."
        },
        "maxit": {
          "name": "maxit",
          "type": "Int",
          "widget": "int",
          "default": 50,
          "defaultLiteral": "50",
          "defaultDoc": "50",
          "desc": "maximum number of iterations."
        },
        "shifts": {
          "name": "shifts",
          "type": "Float64",
          "widget": "float",
          "default": 0.15,
          "defaultLiteral": "0.15",
          "defaultDoc": "0.15",
          "desc": "level shift for singles."
        },
        "shiftp": {
          "name": "shiftp",
          "type": "Float64",
          "widget": "float",
          "default": 0.2,
          "defaultLiteral": "0.2",
          "defaultDoc": "0.2",
          "desc": "level shift for doubles."
        },
        "shiftt": {
          "name": "shiftt",
          "type": "Float64",
          "widget": "float",
          "default": 0.2,
          "defaultLiteral": "0.2",
          "defaultDoc": "0.2",
          "desc": "level shift for triples."
        },
        "properties": {
          "name": "properties",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "calculate properties."
        },
        "ampsvdtol": {
          "name": "ampsvdtol",
          "type": "Float64",
          "widget": "float",
          "default": 0.00001,
          "defaultLiteral": "1.e-5",
          "defaultDoc": "1.e-5",
          "desc": "amplitude decomposition threshold."
        },
        "ampsvdfac": {
          "name": "ampsvdfac",
          "type": "Float64",
          "widget": "float",
          "default": 0.01,
          "defaultLiteral": "1.e-2",
          "defaultDoc": "1.e-2",
          "desc": "tightening amplitude decomposition factor (for the two-step decomposition)."
        },
        "use_kext": {
          "name": "use_kext",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "use kext for doubles residual."
        },
        "calc_d_vvvv": {
          "name": "calc_d_vvvv",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "calculate dressed <vv|vv>."
        },
        "calc_d_vvvo": {
          "name": "calc_d_vvvo",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "calculate dressed <vv|vo>."
        },
        "calc_d_vovv": {
          "name": "calc_d_vovv",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "calculate dressed <vo|vv>."
        },
        "calc_d_vvoo": {
          "name": "calc_d_vvoo",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "calculate dressed <vv|oo>."
        },
        "fock_diag_thr": {
          "name": "fock_diag_thr",
          "type": "Float64",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1.e-6",
          "defaultDoc": "1.e-6",
          "desc": "threshold for checking Fock matrix diagonality in (T). If negative, no check is performed."
        },
        "usedf": {
          "name": "usedf",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "use density fitting in SVD-DC-CCSDT instead of the integral decomposition."
        },
        "usecholesky": {
          "name": "usecholesky",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "use Cholesky decomposition in SVD-DC-CCSDT instead of SVD in the integral decomposition."
        },
        "calc_t3_for_decomposition": {
          "name": "calc_t3_for_decomposition",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "calculate (T) for decomposition."
        },
        "skip_pert_t": {
          "name": "skip_pert_t",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "skip (T) calculation in SVD-DC-CCSDT."
        },
        "project_t3iii": {
          "name": "project_t3iii",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "project out the T^iii contribution from the density matrix in decomposition in SVD-DC-CCSDT."
        },
        "project_voXL": {
          "name": "project_voXL",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "calculated V_{aX}^{iL} in SVD-DC-CCSDT using a projection to the X space as V_{XZ}^{L} U^{iZ}_{a}. This is an additional approximation, which reduces the scaling of the most expensive steps and is useful for large systems."
        },
        "space4voXL": {
          "name": "space4voXL",
          "type": "Symbol",
          "widget": "symbol",
          "default": "combined",
          "defaultLiteral": ":combined",
          "defaultDoc": ":combined",
          "desc": "type of space for project_voXL. Possible values are :combined, :symcombined, :triples, :full.",
          "choices": [
            "combined",
            "symcombined",
            "triples",
            "full"
          ]
        },
        "deco_ishiftp": {
          "name": "deco_ishiftp",
          "type": "Float64",
          "widget": "float",
          "default": 0,
          "defaultLiteral": "0.0",
          "defaultDoc": "0.0",
          "desc": "imaginary shift for denominator in doubles decomposition."
        },
        "deco_ishiftt": {
          "name": "deco_ishiftt",
          "type": "Float64",
          "widget": "float",
          "default": 0,
          "defaultLiteral": "0.0",
          "defaultDoc": "0.0",
          "desc": "imaginary shift for denominator in triples decomposition."
        },
        "use_projx": {
          "name": "use_projx",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "use a projected exchange for contravariant doubles amplitudes in SVD-DCSD, \\\\tilde T_{XY} = U^{†a}_{iX} U^{†b}_{jY} \\\\tilde T^{ij}_{ab}."
        },
        "use_full_t2": {
          "name": "use_full_t2",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "use full doubles amplitudes in SVD-DCSD. The decomposition is used only for N^6 scaling terms."
        },
        "project_vovo_t2": {
          "name": "project_vovo_t2",
          "type": "Int",
          "widget": "int",
          "default": 2,
          "defaultLiteral": "2",
          "defaultDoc": "2",
          "desc": "what to project in v_{ak}^{ci} T^{kj}_{cb} in SVD-DCSD: 0: both, 1: amplitudes, 2: residual, 3: robust fit."
        },
        "decompose_full_doubles": {
          "name": "decompose_full_doubles",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "decompose full doubles amplitudes in SVD-DCSD (slow)."
        },
        "start": {
          "name": "start",
          "type": "String",
          "widget": "string",
          "default": "cc_amplitudes",
          "defaultLiteral": "\"cc_amplitudes\"",
          "defaultDoc": "\"cc_amplitudes\"",
          "desc": "main part of filename for start amplitudes. For example, the singles amplitudes are read from start*\"_1\"."
        },
        "save": {
          "name": "save",
          "type": "String",
          "widget": "string",
          "default": "cc_amplitudes",
          "defaultLiteral": "\"cc_amplitudes\"",
          "defaultDoc": "\"cc_amplitudes\"",
          "desc": "main part of filename to save amplitudes. For example, the singles amplitudes are saved to save*\"_1\"."
        },
        "start_lm": {
          "name": "start_lm",
          "type": "String",
          "widget": "string",
          "default": "cc_multipliers",
          "defaultLiteral": "\"cc_multipliers\"",
          "defaultDoc": "\"cc_multipliers\"",
          "desc": "main part of filename for start Lagrange multipliers. For example, the singles Lagrange multipliers are read from start_lm*\"_1\"."
        },
        "save_lm": {
          "name": "save_lm",
          "type": "String",
          "widget": "string",
          "default": "cc_multipliers",
          "defaultLiteral": "\"cc_multipliers\"",
          "defaultDoc": "\"cc_multipliers\"",
          "desc": "main part of filename to save Lagrange multipliers. For example, the singles Lagrange multipliers are saved to save_lm*\"_1\"."
        },
        "nomp2": {
          "name": "nomp2",
          "type": "Int",
          "widget": "int",
          "default": 0,
          "defaultLiteral": "0",
          "defaultDoc": "0",
          "desc": "Don't use MP2 amplitudes as starting guess for the CC amplitudes."
        },
        "mp2_ssfac": {
          "name": "mp2_ssfac",
          "type": "Float64",
          "widget": "float",
          "default": 0.33,
          "defaultLiteral": "0.33",
          "defaultDoc": "0.33",
          "desc": "Factor for same-spin component in SCS-MP2."
        },
        "mp2_osfac": {
          "name": "mp2_osfac",
          "type": "Float64",
          "widget": "float",
          "default": 1.2,
          "defaultLiteral": "1.2",
          "defaultDoc": "1.2",
          "desc": "Factor for opposite-spin component in SCS-MP2."
        },
        "mp2_ofac": {
          "name": "mp2_ofac",
          "type": "Float64",
          "widget": "float",
          "default": 0,
          "defaultLiteral": "0.0",
          "defaultDoc": "0.0",
          "desc": "Factor for open-shell component in SCS-MP2."
        },
        "mp2_sosfac": {
          "name": "mp2_sosfac",
          "type": "Float64",
          "widget": "float",
          "default": 1.3,
          "defaultLiteral": "1.3",
          "defaultDoc": "1.3",
          "desc": "Factor for opposite-spin component in SOS-MP2."
        },
        "ccsd_ssfac": {
          "name": "ccsd_ssfac",
          "type": "Float64",
          "widget": "float",
          "default": 1.13,
          "defaultLiteral": "1.13",
          "defaultDoc": "1.13",
          "desc": "Factor for same-spin component in SCS-CCSD."
        },
        "ccsd_osfac": {
          "name": "ccsd_osfac",
          "type": "Float64",
          "widget": "float",
          "default": 1.27,
          "defaultLiteral": "1.27",
          "defaultDoc": "1.27",
          "desc": "Factor for opposite-spin component in SCS-CCSD."
        },
        "ccsd_ofac": {
          "name": "ccsd_ofac",
          "type": "Float64",
          "widget": "float",
          "default": 0,
          "defaultLiteral": "0.0",
          "defaultDoc": "0.0",
          "desc": "Factor for open-shell component in SCS-CCSD."
        },
        "dcsd_ssfac": {
          "name": "dcsd_ssfac",
          "type": "Float64",
          "widget": "float",
          "default": 1.15,
          "defaultLiteral": "1.15",
          "defaultDoc": "1.15",
          "desc": "Factor for same-spin component in SCS-DCSD."
        },
        "dcsd_osfac": {
          "name": "dcsd_osfac",
          "type": "Float64",
          "widget": "float",
          "default": 1.05,
          "defaultLiteral": "1.05",
          "defaultDoc": "1.05",
          "desc": "Factor for opposite-spin component in SCS-DCSD."
        },
        "dcsd_ofac": {
          "name": "dcsd_ofac",
          "type": "Float64",
          "widget": "float",
          "default": 0.15,
          "defaultLiteral": "0.15",
          "defaultDoc": "0.15",
          "desc": "Factor for open-shell component in SCS-DCSD."
        },
        "ignore_error": {
          "name": "ignore_error",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "ignore various errors in sanity checks."
        },
        "keepOQVorbitals": {
          "name": "keepOQVorbitals",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "keep the orbitals after rotations over iterations of orbital optimizations in the OQV-CCD/DCD."
        }
      }
    },
    "eom": {
      "key": "eom",
      "struct": "EomOptions",
      "label": "Excited states calculation",
      "summary": "EOM options (EomOptions).",
      "fields": {
        "thr": {
          "name": "thr",
          "type": "Float64",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1.e-6",
          "defaultDoc": "1.e-6",
          "desc": "convergence threshold."
        },
        "nstates": {
          "name": "nstates",
          "type": "Int",
          "widget": "int",
          "default": 1,
          "defaultLiteral": "1",
          "defaultDoc": "1",
          "desc": "number of states to calculate."
        },
        "maxit": {
          "name": "maxit",
          "type": "Int",
          "widget": "int",
          "default": 50,
          "defaultLiteral": "50",
          "defaultDoc": "50",
          "desc": "maximum number of iterations."
        },
        "shift": {
          "name": "shift",
          "type": "Float64",
          "widget": "float",
          "default": 0,
          "defaultLiteral": "0.0",
          "defaultDoc": "0.0",
          "desc": "level shift for the Davidson algorithm."
        },
        "start": {
          "name": "start",
          "type": "String",
          "widget": "string",
          "default": "eigenvectors",
          "defaultLiteral": "\"eigenvectors\"",
          "defaultDoc": "\"eigenvectors\"",
          "desc": "main part of filename for start eigenvectors. For example, the singles eigenvectors for state 2 are read from start*\"_1^2\"."
        },
        "save": {
          "name": "save",
          "type": "String",
          "widget": "string",
          "default": "eigenvectors",
          "defaultLiteral": "\"eigenvectors\"",
          "defaultDoc": "\"eigenvectors\"",
          "desc": "main part of filename to save eigenvectors. For example, the singles eigenvectors for state 2 are saved to save*\"_1^2\"."
        },
        "ampsvdtol": {
          "name": "ampsvdtol",
          "type": "Float64",
          "widget": "float",
          "default": 0.00001,
          "defaultLiteral": "1.e-5",
          "defaultDoc": "1.e-5",
          "desc": "amplitude decomposition threshold."
        },
        "svd_space_option": {
          "name": "svd_space_option",
          "type": "Int",
          "widget": "int",
          "default": 6,
          "defaultLiteral": "6",
          "defaultDoc": "6",
          "desc": "Choice how excited state SVD basis is generated. Default is decomposition of full U2."
        }
      }
    },
    "fci": {
      "key": "fci",
      "struct": "FCIOptions",
      "label": "FCI calculations",
      "summary": "FCI options (FCIOptions).",
      "fields": {
        "max_iter": {
          "name": "max_iter",
          "type": "Int",
          "widget": "int",
          "default": 50,
          "defaultLiteral": "50",
          "defaultDoc": "50",
          "desc": "Maximum number of iterations"
        },
        "shift": {
          "name": "shift",
          "type": "Float64",
          "widget": "float",
          "default": 0.1,
          "defaultLiteral": "0.1",
          "defaultDoc": "0.1",
          "desc": "Level shift to improve convergence"
        },
        "conv_tol": {
          "name": "conv_tol",
          "type": "Float64",
          "widget": "float",
          "default": 1e-8,
          "defaultLiteral": "1e-8",
          "defaultDoc": "1e-8",
          "desc": "Convergence tolerance for energy"
        },
        "res_tol": {
          "name": "res_tol",
          "type": "Float64",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1e-6",
          "defaultDoc": "1e-6",
          "desc": "Convergence tolerance for residual norm"
        },
        "nstates": {
          "name": "nstates",
          "type": "Int",
          "widget": "int",
          "default": 1,
          "defaultLiteral": "1",
          "defaultDoc": "1",
          "desc": "Number of states to compute"
        },
        "n_guess": {
          "name": "n_guess",
          "type": "Int",
          "widget": "int",
          "default": 2,
          "defaultLiteral": "2",
          "defaultDoc": "2",
          "desc": "Number of guess vectors to use"
        },
        "subspace_size": {
          "name": "subspace_size",
          "type": "Int",
          "widget": "int",
          "default": 10,
          "defaultLiteral": "10",
          "defaultDoc": "10",
          "desc": "Maximum subspace size for Davidson diagonalization"
        },
        "compute_rdms": {
          "name": "compute_rdms",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "Compute 1-RDMs after convergence"
        },
        "compute_2rdm": {
          "name": "compute_2rdm",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "Compute 2-RDM after convergence"
        },
        "jacobi_davidson": {
          "name": "jacobi_davidson",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "Use projected Jacobi-Davidson correction (prevents linear dependency)"
        },
        "max_pspace_size": {
          "name": "max_pspace_size",
          "type": "Int",
          "widget": "int",
          "default": 1000,
          "defaultLiteral": "1000",
          "defaultDoc": "1000",
          "desc": "Maximum P-space size (typically 100-1000)"
        },
        "pspace_selection_method": {
          "name": "pspace_selection_method",
          "type": "Symbol",
          "widget": "symbol",
          "default": "hybrid",
          "defaultLiteral": ":hybrid",
          "defaultDoc": ":hybrid",
          "desc": "Selection method for P-space generation (:hybrid, :excitation, :energy, :ciphi)",
          "choices": [
            "hybrid",
            "excitation",
            "energy",
            "ciphi"
          ]
        },
        "max_pspace_excitation": {
          "name": "max_pspace_excitation",
          "type": "Int",
          "widget": "int",
          "default": 4,
          "defaultLiteral": "4",
          "defaultDoc": "4",
          "desc": "Maximum excitation level from HF reference (0=HF, 1=S, 2=SD, etc.)"
        },
        "pspace_energy_threshold": {
          "name": "pspace_energy_threshold",
          "type": "Float64",
          "widget": "float",
          "default": 5,
          "defaultLiteral": "5.0",
          "defaultDoc": "5.0",
          "desc": "Energy cutoff for determinant inclusion"
        },
        "pspace_ciphi_epsilon": {
          "name": "pspace_ciphi_epsilon",
          "type": "Float64",
          "widget": "float",
          "default": 0.001,
          "defaultLiteral": "1e-3",
          "defaultDoc": "1e-3",
          "desc": "CIPHI selection threshold (epsilon_h) for P-space generation"
        },
        "print_level": {
          "name": "print_level",
          "type": "Int",
          "widget": "int",
          "default": 1,
          "defaultLiteral": "1",
          "defaultDoc": "1",
          "desc": "Level of printed output (0=none, 1=some, 2=detailed)"
        },
        "thr_negligible": {
          "name": "thr_negligible",
          "type": "Float64",
          "widget": "float",
          "default": 1e-12,
          "defaultLiteral": "1e-12",
          "defaultDoc": "1e-12",
          "desc": "Threshold for neglecting small Hamiltonian (etc) elements"
        }
      }
    },
    "ciphi": {
      "key": "ciphi",
      "struct": "CIPHIOptions",
      "label": "CIΦ (CIPHI) calculations - Selected CI via Perturbation, Heat-Bath and Iterations",
      "summary": "CIPHI options (CIPHIOptions).",
      "fields": {
        "target_selection": {
          "name": "target_selection",
          "type": "Int",
          "widget": "int",
          "default": 1000000,
          "defaultLiteral": "1_000_000",
          "defaultDoc": "1_000_000",
          "desc": "Target (i.e., maximum) number of determinants to select"
        },
        "epsilon": {
          "name": "epsilon",
          "type": "Float64",
          "widget": "float",
          "default": 0.0003,
          "defaultLiteral": "3e-4",
          "defaultDoc": "3e-4",
          "desc": "Selection threshold"
        },
        "epsilon_h": {
          "name": "epsilon_h",
          "type": "Float64",
          "widget": "float",
          "default": -1,
          "defaultLiteral": "-1.0",
          "defaultDoc": "epsilon/10",
          "desc": "CIPHI selection threshold. Note that a smaller value improves also the quality of the PT2 correction."
        },
        "epsilon_c": {
          "name": "epsilon_c",
          "type": "Float64",
          "widget": "float",
          "default": -1,
          "defaultLiteral": "-1.0",
          "defaultDoc": "epsilon_h",
          "desc": "instantaneous PT selection threshold."
        },
        "epsilon_p": {
          "name": "epsilon_p",
          "type": "Float64",
          "widget": "float",
          "default": -1,
          "defaultLiteral": "-1.0",
          "defaultDoc": "epsilon",
          "desc": "CIPSI selection threshold"
        },
        "tol": {
          "name": "tol",
          "type": "Float64",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1e-6",
          "defaultDoc": "1e-6",
          "desc": "Energy convergence threshold"
        },
        "res_tol": {
          "name": "res_tol",
          "type": "Float64",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1e-6",
          "defaultDoc": "1e-6",
          "desc": "Convergence tolerance for residual norm"
        },
        "max_iter": {
          "name": "max_iter",
          "type": "Int",
          "widget": "int",
          "default": 50,
          "defaultLiteral": "50",
          "defaultDoc": "50",
          "desc": "Maximum CIPHI iterations"
        },
        "shift": {
          "name": "shift",
          "type": "Float64",
          "widget": "float",
          "default": 0.1,
          "defaultLiteral": "0.1",
          "defaultDoc": "0.1",
          "desc": "Level shift to improve convergence"
        },
        "verbose": {
          "name": "verbose",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "Print iteration details"
        },
        "compute_pt2": {
          "name": "compute_pt2",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "Compute PT2 perturbative correction"
        },
        "epsilon_pt2": {
          "name": "epsilon_pt2",
          "type": "Float64",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1e-6",
          "defaultDoc": "1e-6",
          "desc": "Threshold for PT2 contributions"
        },
        "epsilon_pt2_c": {
          "name": "epsilon_pt2_c",
          "type": "Float64",
          "widget": "float",
          "default": -1,
          "defaultLiteral": "-1.0",
          "defaultDoc": "epsilon_pt2/2",
          "desc": "Threshold for instantaneous PT2 contributions"
        },
        "sort4pt2": {
          "name": "sort4pt2",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "Sort determinants by absolute value of coefficients before computing PT2 correction"
        },
        "pt2_shift": {
          "name": "pt2_shift",
          "type": "Float64",
          "widget": "float",
          "default": 1e-10,
          "defaultLiteral": "1e-10",
          "defaultDoc": "1e-10",
          "desc": "Small value added to denominators in PT2 to avoid divergences"
        },
        "use_mp2": {
          "name": "use_mp2",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "Use uncontracted MP2 instead of EN2"
        },
        "renorm_pt2": {
          "name": "renorm_pt2",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "Use renormalized PT2 correction: E_PT2 → E_PT2 / (1 + T2^2) with T2 being the PT2 amplitudes."
        },
        "nstates": {
          "name": "nstates",
          "type": "Int",
          "widget": "int",
          "default": 1,
          "defaultLiteral": "1",
          "defaultDoc": "1",
          "desc": "Number of states to compute (default: 1 = ground state only)"
        },
        "nsteps": {
          "name": "nsteps",
          "type": "Int",
          "widget": "int",
          "default": 2,
          "defaultLiteral": "2",
          "defaultDoc": "2",
          "desc": "Number of steps in the iterative CIPHI selection (if > 1, the selection process is repeated after convergence)"
        },
        "use_small_space_guess": {
          "name": "use_small_space_guess",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "Use small-space Hamiltonian for initial guess"
        },
        "small_space_size": {
          "name": "small_space_size",
          "type": "Int",
          "widget": "int",
          "default": 0,
          "defaultLiteral": "0",
          "defaultDoc": "0",
          "desc": "Size of small space (0 = auto: max(100, target÷10, 5*n_roots))"
        },
        "small_space_method": {
          "name": "small_space_method",
          "type": "Symbol",
          "widget": "symbol",
          "default": "hybrid",
          "defaultLiteral": ":hybrid",
          "defaultDoc": ":hybrid",
          "desc": "Selection method: :hybrid (energy + excitation)",
          "choices": [
            "hybrid"
          ]
        },
        "print_level": {
          "name": "print_level",
          "type": "Int",
          "widget": "int",
          "default": 1,
          "defaultLiteral": "1",
          "defaultDoc": "1",
          "desc": "Level of printed output (0=none, 1=some, 2=detailed)"
        },
        "pt2_only": {
          "name": "pt2_only",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "Skip variational CIPHI iterations and only compute PT2 correction (use with restart)"
        },
        "thr_negligible": {
          "name": "thr_negligible",
          "type": "Float64",
          "widget": "float",
          "default": 1e-10,
          "defaultLiteral": "1e-10",
          "defaultDoc": "1e-10",
          "desc": "Threshold for neglecting small Hamiltonian (etc) elements"
        }
      }
    },
    "dmrg": {
      "key": "dmrg",
      "struct": "DmrgOptions",
      "label": "DMRG calculation",
      "summary": "DMRG options (DmrgOptions).",
      "fields": {
        "nsweeps": {
          "name": "nsweeps",
          "type": "Int",
          "widget": "int",
          "default": 10,
          "defaultLiteral": "10",
          "defaultDoc": "10",
          "desc": "number of sweeps."
        },
        "maxdim": {
          "name": "maxdim",
          "type": "Vector{Int}",
          "widget": "vector-int",
          "default": [
            100,
            200
          ],
          "defaultLiteral": "[100, 200]",
          "defaultDoc": "[100, 200]",
          "desc": "maximum size for the bond dimension."
        },
        "cutoff": {
          "name": "cutoff",
          "type": "Float64",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1e-6",
          "defaultDoc": "1e-6",
          "desc": "cutoff for the singular value decomposition."
        },
        "noise": {
          "name": "noise",
          "type": "Vector{Float64}",
          "widget": "vector-float",
          "default": [
            0.000001,
            1e-7,
            1e-8,
            0
          ],
          "defaultLiteral": "[1e-6, 1e-7, 1e-8, 0.0]",
          "defaultDoc": "[1e-6, 1e-7, 1e-8, 0.0]",
          "desc": "strength of the noise term used to aid convergence."
        }
      }
    },
    "cholesky": {
      "key": "cholesky",
      "struct": "CholeskyOptions",
      "label": "Cholesky decomposition",
      "summary": "Cholesky options (CholeskyOptions).",
      "fields": {
        "thred": {
          "name": "thred",
          "type": "Float64",
          "widget": "float",
          "default": 0.000001,
          "defaultLiteral": "1.e-6",
          "defaultDoc": "1.e-6",
          "desc": "threshold for elimination of redundancies in the auxiliary basis."
        },
        "thr": {
          "name": "thr",
          "type": "Float64",
          "widget": "float",
          "default": 0.0001,
          "defaultLiteral": "1.e-4",
          "defaultDoc": "1.e-4",
          "desc": "threshold for integral decomposition."
        }
      }
    },
    "laplace": {
      "key": "laplace",
      "struct": "LaplaceOptions",
      "label": "Laplace quadrature",
      "summary": "Laplace options (LaplaceOptions).",
      "fields": {
        "npoints": {
          "name": "npoints",
          "type": "Int",
          "widget": "int",
          "default": 8,
          "defaultLiteral": "8",
          "defaultDoc": "8",
          "desc": "number of Laplace quadrature points."
        },
        "algo": {
          "name": "algo",
          "type": "Symbol",
          "widget": "symbol",
          "default": "minimax",
          "defaultLiteral": ":minimax",
          "defaultDoc": ":minimax",
          "desc": "algorithm for Laplace quadrature points. (:minimax or :simplex)",
          "choices": [
            "minimax",
            "simplex"
          ]
        }
      }
    },
    "diis": {
      "key": "diis",
      "struct": "DiisOptions",
      "label": "DIIS",
      "summary": "DIIS options (DiisOptions).",
      "fields": {
        "maxdiis": {
          "name": "maxdiis",
          "type": "Int",
          "widget": "int",
          "default": 6,
          "defaultLiteral": "6",
          "defaultDoc": "6",
          "desc": "maximum number of DIIS vectors."
        },
        "resthr": {
          "name": "resthr",
          "type": "Float64",
          "widget": "float",
          "default": 10,
          "defaultLiteral": "10.0",
          "defaultDoc": "10.0",
          "desc": "DIIS residual threshold."
        },
        "crop": {
          "name": "crop",
          "type": "Bool",
          "widget": "bool",
          "default": false,
          "defaultLiteral": "false",
          "defaultDoc": "false",
          "desc": "CROP-DIIS (see JCTC 11, 1518 (2015)). Usually the DIIS dimension maxcrop=3 is sufficient."
        },
        "maxcrop": {
          "name": "maxcrop",
          "type": "Int",
          "widget": "int",
          "default": 3,
          "defaultLiteral": "3",
          "defaultDoc": "3",
          "desc": "DIIS dimension for CROP-DIIS."
        }
      }
    },
    "davidson": {
      "key": "davidson",
      "struct": "DavidsonOptions",
      "label": "Davidson",
      "summary": "Davidson options (DavidsonOptions).",
      "fields": {
        "maxdav": {
          "name": "maxdav",
          "type": "Int",
          "widget": "int",
          "default": 10,
          "defaultLiteral": "10",
          "defaultDoc": "10",
          "desc": "maximum number of Davidson vectors per state."
        },
        "use_overlap": {
          "name": "use_overlap",
          "type": "Bool",
          "widget": "bool",
          "default": true,
          "defaultLiteral": "true",
          "defaultDoc": "true",
          "desc": "use overlap in hermitian Davidson."
        }
      }
    },
    "print": {
      "key": "print",
      "struct": "PrintOptions",
      "label": "Printing",
      "summary": "Print options (PrintOptions).",
      "fields": {
        "time": {
          "name": "time",
          "type": "Int",
          "widget": "int",
          "default": 2,
          "defaultLiteral": "2",
          "defaultDoc": "2",
          "desc": "verbosity level for printing timings."
        },
        "memory": {
          "name": "memory",
          "type": "Int",
          "widget": "int",
          "default": 2,
          "defaultLiteral": "2",
          "defaultDoc": "2",
          "desc": "verbosity level for printing memory usage."
        }
      }
    }
  }
};
