// AUTO-GENERATED — do not edit by hand.
// Source: ElemCo.jl src/ElemCo.jl @ main
// Regenerate: node scripts/parse-elemco-macros.js [--ref <tag>]
window.ELEMCO_MACROS = {
  "sourceRepo": "fkfest/ElemCo.jl",
  "sourceRef": "main",
  "sourceUrl": "https://raw.githubusercontent.com/fkfest/ElemCo.jl/main/src/ElemCo.jl",
  "generated": "2026-07-19",
  "macros": [
    {
      "name": "bohf",
      "signature": "@bohf(opts_block=nothing)",
      "acceptsOptions": true,
      "doc": "Run bi-orthogonal HF calculation using FCIDUMP integrals.\n\n The orbital rotations are stored to WfOptions.dump.\n For open-shell systems (or UHF FCIDUMPs), the BO-UHF energy is calculated.\n\n Optionally, a begin...end block can be provided to set local options for this call.\n The options are reset after the call completes."
    },
    {
      "name": "bouhf",
      "signature": "@bouhf(opts_block=nothing)",
      "acceptsOptions": true,
      "doc": "Run bi-orthogonal UHF calculation using FCIDUMP integrals.\n\n Optionally, a begin...end block can be provided to set local options for this call.\n The options are reset after the call completes."
    },
    {
      "name": "cc",
      "signature": "@cc(method, args...)",
      "acceptsOptions": true,
      "doc": "Run coupled cluster calculation.\n\n The type of the method is determined by the first argument (ccsd/ccsd(t)/dcsd etc).\n The method can be specified as a string or as a variable, e.g., \n @cc CCSD or @cc \"CCSD\" or ccmethod=\"CCSD\"; @cc ccmethod.\n \n Optionally, a begin...end block can be provided as the last argument to set \n local options for this call. The options are reset after the call completes."
    },
    {
      "name": "check_molproinfo",
      "signature": "@check_molproinfo()",
      "acceptsOptions": false,
      "doc": "Check if MolproInterface.MolproInfo is initialized and return the files.\n If not initialized, throw an error."
    },
    {
      "name": "ciphi",
      "signature": "@ciphi(args...)",
      "acceptsOptions": true,
      "doc": "Run CIPHI (CIΦ - CI via Perturbative and Heat-Bath Iterative selection) calculation.\n\n Optionally, a begin...end block can be provided as the last argument to set \n local options for this call. The options are reset after the call completes."
    },
    {
      "name": "ciϕ",
      "signature": "@ciϕ(args...)",
      "acceptsOptions": true,
      "doc": "Alias for @ciphi. Run CIPHI (CIΦ - CI via Perturbative and Heat-Bath Iterative selection) calculation.\n\n Optionally, a begin...end block can be provided as the last argument to set \n local options for this call. The options are reset after the call completes."
    },
    {
      "name": "copyfile",
      "signature": "@copyfile(from_file, to_file, kwargs...)",
      "acceptsOptions": false,
      "doc": "Copy file from_file to to_file in EC.scr directory."
    },
    {
      "name": "copywf",
      "signature": "@copywf(args...)",
      "acceptsOptions": false,
      "doc": "Copy wavefunction data from the current trexio dump file to another dump file.\n\n If to_file is not provided, the wavefunction is copied to EC.options.wf.store file.\n Note: This does not check the contents of the files."
    },
    {
      "name": "deletefile",
      "signature": "@deletefile(filename)",
      "acceptsOptions": false,
      "doc": "Delete file filename from EC.scr directory."
    },
    {
      "name": "dfcc",
      "signature": "@dfcc(method=\"svd-dcsd\", opts_block=nothing)",
      "acceptsOptions": true,
      "doc": "Run coupled cluster calculation using density fitted integrals.\n\n The type of the method is determined by the first argument.\n The method can be specified as a string or as a variable, e.g., \n @dfcc SVD-DCSD or @dfcc \"SVD-DCSD\" or ccmethod=\"SVD-DCSD\"; @dfcc ccmethod.\n \n Optionally, a begin...end block can be provided to set local options for this call.\n The options are reset after the call completes."
    },
    {
      "name": "dfhf",
      "signature": "@dfhf(opts_block=nothing)",
      "acceptsOptions": true,
      "doc": "Run DF-HF calculation. The orbitals are stored to WfOptions.dump.\n\n Optionally, a begin...end block can be provided to set local options for this call.\n The options are reset after the call completes."
    },
    {
      "name": "dfints",
      "signature": "@dfints()",
      "acceptsOptions": false,
      "doc": "Generate 2 and 4-idx MO integrals using density fitting.\n The MO coefficients are read from WfOptions.dump."
    },
    {
      "name": "dfmcscf",
      "signature": "@dfmcscf(opts_block=nothing)",
      "acceptsOptions": true,
      "doc": "Run DF-MCSCF calculation. The orbitals are stored to WfOptions.dump.\n\n Optionally, a begin...end block can be provided to set local options for this call.\n The options are reset after the call completes."
    },
    {
      "name": "dfmp2",
      "signature": "@dfmp2(opts_block=nothing)",
      "acceptsOptions": true,
      "doc": "Run density-fitted MP2 calculation.\n\n If save is set in CcOptions.save, \n the MP2 doubles amplitudes are saved to save*\"_2\" file.\n\n Optionally, a begin...end block can be provided to set local options for this call.\n The options are reset after the call completes."
    },
    {
      "name": "dfuhf",
      "signature": "@dfuhf(opts_block=nothing)",
      "acceptsOptions": true,
      "doc": "Run DF-UHF calculation. The orbitals are stored to WfOptions.dump.\n\n Optionally, a begin...end block can be provided to set local options for this call.\n The options are reset after the call completes."
    },
    {
      "name": "dummy",
      "signature": "@dummy(atoms)",
      "acceptsOptions": false,
      "doc": "Set atoms as dummy atoms in the system.\n atoms is a list of atom indices or atomic symbols.\n\n After running the macro, only the atoms in the list are set as dummy atoms in the system."
    },
    {
      "name": "export_molden",
      "signature": "@export_molden(filename)",
      "acceptsOptions": false,
      "doc": "Export current orbitals to Molden file filename."
    },
    {
      "name": "fci",
      "signature": "@fci(args...)",
      "acceptsOptions": true,
      "doc": "Run FCI calculation.\n\n Optionally, a begin...end block can be provided as the last argument to set \n local options for this call. The options are reset after the call completes."
    },
    {
      "name": "freeze_orbs",
      "signature": "@freeze_orbs(freeze_orbs)",
      "acceptsOptions": false,
      "doc": "Freeze orbitals in the integrals according to an array or range \n freeze_orbs.\n\n Alternatively, the orbitals can be specified as a String with the +/- or :/; syntax, e.g.,\n \"1-5+7-8\", or \"1:5;7-8\"."
    },
    {
      "name": "import_matrix",
      "signature": "@import_matrix(filename)",
      "acceptsOptions": false,
      "doc": "Import matrix from file file.\n\n The type of the matrix is determined automatically."
    },
    {
      "name": "loadfile",
      "signature": "@loadfile(filename)",
      "acceptsOptions": false,
      "doc": "Read file filename from EC.scr directory."
    },
    {
      "name": "loadwf",
      "signature": "@loadwf(args...)",
      "acceptsOptions": false,
      "doc": "Load wavefunction data from the trexio dump file.\n\n The arguments what can be a vector of strings, a string variable or a list of arguments \n specifying what to load.\n Possible values are: \n\n - all: load everything available (overrides other options)\n - orbital_energies: molecular orbital energies\n - orbital_occupations: molecular orbital occupations\n - amplitudes: restricted CC amplitudes (T1, T2)\n - unrestricted_amplitudes: unrestricted CC amplitudes (T1a, T1b, T2a, T2b, T2ab)\n - determinants: selected CI determinants and coefficients\n\n The loaded data are returned as a dictionary with keys corresponding to the requested data.\n basis, orbitals and orbital_type are always included in the output."
    },
    {
      "name": "molpro_input",
      "signature": "@molpro_input(filename=\"elemcoil\")",
      "acceptsOptions": false,
      "doc": "Initialize the Molpro interface with the given filename.\n\n It relies on the Molpro XML file to set up the molecule and basis set.\n If the basis variable exists, it will be updated with the AO basis set from the XML file.\n\n See MolproInterface for more details on the Molpro interface."
    },
    {
      "name": "molpro_output",
      "signature": "@molpro_output(ecvariables, kwargs...)",
      "acceptsOptions": false,
      "doc": "Save key-value pairs from ecvariables to a ECVARIABLES file in the MolproInterface.MolproInfo object.\n \n The ecvariables is a dictionary with the variables to be included in the output.\n The keyword arguments are passed to the MolproInterface.save_ecvariables_to_file function.\n Possible keyword arguments include:\n - prefix::String: prefix for each variable in the output file (default: \"\")\n - new::Bool: if true, create a new file, otherwise append to the existing file (default: true)"
    },
    {
      "name": "opt",
      "signature": "@opt(opt, kwargs...)",
      "acceptsOptions": false,
      "doc": "Alias for @set. Set options for EC::ECInfo. \n \n The first argument opt is the name of the option (e.g., scf, cc, cholesky), see ECInfos.Options.\n The keyword arguments are the options to be set (e.g., thr=1.e-14, maxit=10).\n The current state of the options can be stored in a variable, e.g., opt_cc = @set cc.\n The state can then be restored by @set cc opt_cc.\n If EC is not already initialized, it will be done."
    },
    {
      "name": "reset",
      "signature": "@reset(opt)",
      "acceptsOptions": false,
      "doc": "Reset options for opt to default values."
    },
    {
      "name": "rotate_orbs",
      "signature": "@rotate_orbs(orb1, orb2, angle, kwargs...)",
      "acceptsOptions": false,
      "doc": "Rotate orbitals orb1 and orb2 from WfOptions.dump \n by angle (in degrees). For UHF, spin can be :α or :β (keyword argument).\n \n The orbitals are stored to WfOptions.store."
    },
    {
      "name": "run",
      "signature": "@run(method, kwargs...)",
      "acceptsOptions": true,
      "doc": "general runner"
    },
    {
      "name": "savefile",
      "signature": "@savefile(filename, arr, kwargs...)",
      "acceptsOptions": false,
      "doc": "Save array or tuple of arrays arr to file filename in EC.scr directory."
    },
    {
      "name": "savewf",
      "signature": "@savewf(args...)",
      "acceptsOptions": false,
      "doc": "Save wavefunction data to the trexio dump file.\n\n The argument wf is a dictionary with the data to be saved.\n Possible keys are:\n\n**Orbital data:**\n- \"basis\": basis set information\n- \"orbitals\": molecular orbitals\n- \"rotations\": orbital rotations (alternative to \"orbitals\")\n- \"orbital_type\": type of the orbitals (e.g., \"RHF\", \"UHF\", \"ROHF\", \"MCSCF\")\n- \"orbital_energies\": molecular orbital energies\n- \"orbital_occupations\": molecular orbital occupations\n\n**Restricted CC amplitudes:**\n- \"T1\": singles amplitudes (nvirt × nocc)\n- \"T2\": doubles amplitudes (nvirt × nvirt × nocc × nocc)\n\n**Unrestricted CC amplitudes:**\n- \"T1a\", \"T1b\": α and β singles amplitudes\n- \"T2a\", \"T2b\", \"T2ab\": αα, ββ, and αβ doubles amplitudes\n\n**Selected CI (CIPHI) data:**\n- \"determinants\": vector of determinants\n- \"ci_coefficients\": CI coefficients (vector for single state, matrix for multi-state)"
    },
    {
      "name": "sci",
      "signature": "@sci(args...)",
      "acceptsOptions": true,
      "doc": "Alias for @ciphi. Run CIPHI (CIΦ - CI via Perturbative and Heat-Bath Iterative selection) calculation.\n\n Optionally, a begin...end block can be provided as the last argument to set \n local options for this call. The options are reset after the call completes."
    },
    {
      "name": "set",
      "signature": "@set(opt, kwargs...)",
      "acceptsOptions": false,
      "doc": "Set options for EC::ECInfo. \n \n The first argument opt is the name of the option (e.g., scf, cc, cholesky), see ECInfos.Options.\n The keyword arguments are the options to be set (e.g., thr=1.e-14, maxit=10).\n The current state of the options can be stored in a variable, e.g., opt_cc = @set cc.\n The state can then be restored by @set cc opt_cc.\n If EC is not already initialized, it will be done."
    },
    {
      "name": "show_orbs",
      "signature": "@show_orbs(range=nothing)",
      "acceptsOptions": false,
      "doc": "Show orbitals in the integrals according to an array or range \n range."
    },
    {
      "name": "transform_ints",
      "signature": "@transform_ints()",
      "acceptsOptions": false,
      "doc": "Rotate FCIDump integrals using rotations from WfOptions.dump \n as transformation matrices.\n\n The orbital rotations are read from WfOptions.dump.\n If type of the rotations contains the word biorthogonal, \n the bi-orthogonal orbitals are used."
    },
    {
      "name": "write_ints",
      "signature": "@write_ints(file=\"FCIDUMP\", kwargs...)",
      "acceptsOptions": false,
      "doc": "Write FCIDump integrals to file file."
    }
  ]
};
