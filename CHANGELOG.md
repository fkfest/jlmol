# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Update checker (desktop app): jlmol now checks GitHub for a newer release and, if one is available, shows a dialog with the new version and its release notes and asks whether to update. Choosing "Download update" opens the appropriate installer for your OS (or the release page) in your browser to install manually; "Later" defers until next launch and "Skip this version" suppresses reminders for that version. Checks run quietly once on startup (only prompting when an update exists) and can be triggered any time from **Settings → General → Check for Updates Now**. The automatic startup check can be turned off with "Automatically check for updates on startup" in the same section. The feature is desktop-only (the browser version is always up to date).

## [1.4.0] - 2026-05-31

### Added

- Atom selection by clicking in the 3D structure: clicking an atom in the viewer now selects/deselects it (toggle), with the selection mirrored in the XYZ viewer rows and vice versa (two-way sync). A shared selection state highlights selected atoms with halos in 3D and a highlight in the XYZ viewer, shows a selection count, and offers a "Clear Selection" button. The selected atoms can be inserted as a 1-based index list (e.g. `[1, 3, 5]`) into the ElemCo.jl input editor with one click ("Insert Selected Atoms"), e.g. to define dummy atoms or active regions. Selection is cleared automatically when a new structure is loaded, and clicking is disabled while the model-kit editor is active.
- xtb constrained optimization: a "Relax only selected atoms (freeze the rest)" option in the xtb panel. When enabled and atoms are selected, the optimization writes an xtb xcontrol file with a `$fix` block listing every non-selected atom (passed via `--input xtb.inp`), so only the selected atoms are relaxed while the rest stay fixed. Ignored if no atoms are selected.
- xtb (g-xTB) integration: calculate the energy (`xtb <coord.xyz> --gxtb`) or optimize the geometry (`xtb <coord.xyz> --gxtb --opt`) of the current structure. After an optimization the geometry in the viewer is replaced with the optimized structure. Runs only in the desktop app (the browser version shows a message to install jlmol locally), checks that xtb is accessible and reports a helpful message if not, and supports charge / unpaired-electron / extra-flag options. The xtb command is configurable in Settings → xtb (like the Julia command). g-xTB requires the g-xTB binary from https://github.com/grimme-lab/g-xtb — download and extract it, then put the `xtb` binary on `PATH` or set its full path in Settings (no separate xtb installation or parameter-file download is needed).

### Changed

- Quiet terminal output by default: the Electron main process no longer echoes its verbose per-event log (startup info, focus/blur, memory stats) or Chromium's GPU/init messages to the terminal. A full log is still written to `jsmol.log` in the user-data directory. Enable terminal logging with `npm run start-verbose`, `--verbose`/`--debug`, or `JLMOL_DEBUG=1`.
- Internal: split the monolithic `index.html` into `css/styles.css` and per-feature `js/` modules for maintainability (no user-facing behavior change).

## [1.3.0] - 2026-02-06

### Added

- **Molden Orbital Export**: New option in the ElemCo.jl input editor to dump the calculated orbitals in Molden format with customizable file naming
- **Enhanced Preferences System**: Tabbed interface for better organization of user preferences
- **Windows Start Script**: Added `npm run start:win` for direct Windows executable launch

### Changed

- Hide menu bar by default with auto-hide feature for cleaner interface
- Improved CSS overflow handling and box-sizing for input elements
- Refactored background color handling to use JSmol script format
- Improved clipboard functionality with better fallbacks
- Upgraded Electron to v40.2.1

### Fixed

- Fixed image export format mismatch: properly handle JSmol JPEG output and convert to PNG when needed
- Fixed export image transparency support
- Fixed JSmol settings persistence by applying preferences after all molecule loading operations
- Fixed JSmol initialization to prevent startup failures while maintaining settings integration
- Fixed JSmol settings integration to actually apply preferences to the viewer

## [1.2.1] - 2025-07-10

### Added

- Script for running ElemCo.jl calculations remotely on Linux machines via SSH.

### Fixed

- WSL command execution for Julia to correctly handle commands that do not explicitly contain the word "julia" (e.g., using a full path to the executable within WSL).

## [1.2.0] - 2025-07-09

### Added

- **User Preferences System**: Comprehensive settings panel for customizing application behavior
  - Persistent storage of user preferences using localStorage
  - Display preferences (startup display mode, spin animation)
  - ElemCo.jl defaults (method, basis set, density fitting)
  - Application settings (Julia command configuration)
- **ElemCo.jl Calculation Runner**: Integrated calculation execution directly from the application
  - Direct execution of ElemCo.jl calculations from generated input files
  - Real-time progress monitoring and output display
  - Automatic temporary file management
- **Julia Command Customization**: Flexible Julia executable configuration
  - Support for custom Julia installation paths
  - Command-line argument support for Julia invocation
  - Persistent storage of Julia command preferences
- **Windows Subsystem for Linux (WSL) Support**: Seamless integration with WSL environments
  - Automatic path translation for Windows temp files to WSL-compatible paths
  - Support for WSL Julia commands (e.g., `wsl julia`, `wsl --shell-type login julia`)
  - WSL-specific error handling and troubleshooting guidance
  - Support for WSL distribution-specific commands
- **Enhanced Error Handling**: Improved error reporting and troubleshooting
  - Detailed error messages for calculation failures
  - WSL-specific troubleshooting information
  - Julia installation and configuration guidance

### Changed

- **UI Layout**: Moved and renamed "Prefs" button to "Settings" and positioned it next to the "Console" button
- **Settings Access**: Centralized all user preferences in a single, organized settings panel
- **ElemCo.jl Workflow**: Enhanced from input generation only to full calculation execution capability

### Fixed

- Improved robustness of Julia command parsing and execution
- Enhanced error handling for various Julia installation scenarios
- Better handling of file paths in cross-platform and WSL environments

## [1.1.0] - 2025-01-10

### Added

- Database metadata integration in XYZ file generation: XYZ files now include meaningful database information in comment lines
- Smart comment line generation for database-loaded structures with PubChem CID, compound name, SMILES, and molecular formula
- Enhanced database search with combined interface: integrated search type selector within the input field for better user experience
- SMILES search enforcement capability: users can explicitly force SMILES search to override auto-detection
- Contextual input placeholders that update based on selected search type
- Modern dropdown interface with descriptions for each search type option

### Changed

- XYZ file comment lines now show database metadata (e.g., "PubChem, CID:2519, Name:Caffeine, SMILES:CN1C=NC2=C1C(=O)N(C(=O)N2C)C") instead of generic "Structure with numbered atoms" for database-loaded structures
- Redesigned database search UI from separate dropdown to integrated selector button
- Improved search type selection with click-to-select interface on the right side of input field
- Enhanced user experience with cleaner, more intuitive search interface

### Fixed

- Resolved issue where XYZ files generated from PubChem structures showed generic "Structure with numbered atoms" instead of meaningful database information

## [1.0.2] - 2025-06-10

### Fixed

- Fixed element symbol recognition in XYZ files: atom symbols written in lowercase letters are now properly capitalized for JSmol compatibility
- Enhanced XYZ file loading with custom loader that preserves numbered atom names (e.g., C1, H1, H2) while ensuring proper element recognition

## [1.0.1] - 2025-04-25

### Fixed

- Switched off the orbital sort feature in the JSmol viewer

## [1.0.0] - 2025-04-25

First stable release with all core features implemented:

### Features

- Advanced molecular visualization with JSmol integration
- Support for multiple file formats (XYZ, PDB, MOL, CIF, MOLDEN)
- Interactive 2D/3D structure editing:
  - JSME 2D molecular editor with real-time 3D sync
  - 3D structure manipulation with energy minimization
  - XYZ coordinate editor with optimization
- Orbital visualization capabilities:
  - HOMO/LUMO visualization
  - Interactive orbital navigation
  - Energy level display
- ElemCo.jl integration:
  - Support for advanced quantum chemistry methods
  - Flexible basis set configuration
  - Density fitting options
  - Input generation and export
- Cross-platform desktop application (Windows, macOS, Linux)
- Modern user interface with draggable panels
- Export capabilities for structures and visualizations

### Added

- Integrated ElemCo.jl input generation feature:
  - Support for HF, MP2, DCSD, CCSD(T), CCSDT, and DC-CCSDT methods
  - Density fitting (DF) options for supported methods
  - Flexible basis set configuration including auxiliary basis sets
  - Charge and multiplicity specification
  - Direct text editing of generated input
  - Copy to clipboard functionality

### Changed

- Renamed application from "JSmol Electron Viewer" to "jlmol"

## [0.1.4] - 2025-04-24

### Fixed

- The electron apps are now built correctly
- Better handling of window resizing

## [0.1.3] - 2025-04-14

### Added
- Integrated JSME 2D molecular structure editor

## [0.1.2] - 2025-04-11

### Fixed
- Reduced minimum viewer height to 200px to match minimum width
- Added `set zoomLarge false` to JSmol initialization to allow smaller viewer dimensions
- Fixed resizing behavior when reducing viewer dimensions

### Added
- Added drag&minimize functionality
- Export image feature for JSmol viewer
- Browser compatibility (a browser option)

## [0.1.1] - 2025-04-10

Initial release with basic functionality.

### Added
- JSmol molecular viewer integration
- Desktop application wrapper using Electron
- Support for multiple file formats (XYZ, PDB, MOL, CIF, MOLDEN)
- Orbital visualization features
- Structure editing capabilities
- Cross-platform support
