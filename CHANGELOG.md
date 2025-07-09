# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
