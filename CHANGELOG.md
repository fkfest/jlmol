# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
