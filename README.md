# jlmol

A desktop application for molecular visualization built with Electron and JSmol. This application provides a native desktop experience for the powerful JSmol molecular viewer.

Try it online: [Browser Version](https://fkfest.github.io/jlmol)

Download: [Latest Release Executables](https://github.com/fkfest/jlmol/releases/latest)

## Features

### Visualization

- Powerful JSmol molecular visualization capabilities:
  - 3D structure visualization with multiple display styles (ball&stick, wireframe, spacefill)
  - Support for multiple file formats (XYZ, PDB, MOL, CIF, MOLDEN)
  - Interactive controls for rotation and zoom
  - Spin animation
  - Drag and drop file loading

### Database Search

- **PubChem Database Integration**: Direct access to molecular structures from PubChem without needing to download files locally
  - **Combined Search Interface**: Modern unified input field with integrated search type selector
  - **Compound ID (CID)**: Search by PubChem compound identifier (e.g., `1983` for caffeine)
  - **Chemical Name**: Search by common or systematic names (e.g., `caffeine`, `aspirin`, `glucose`)
  - **SMILES**: Search using SMILES notation (e.g., `C6H6` for benzene, `CC=O` for acetaldehyde)
  - **Search Type Enforcement**: Click selector to force specific search types (CID, Name, SMILES)
  - **Auto-detection**: Intelligent query type detection based on input format
  - **Enter Key Support**: Quick loading by pressing Enter in the search field
  - **Network Error Handling**: Robust error handling for connection issues

### Structure Editing

- Integrated JSME 2D structure editor:
  - Toggle between 3D (JSmol) and 2D (JSME) views
  - Draw and edit molecular structures in intuitive 2D interface
  - Real-time synchronization between 2D and 3D views
  - Standard molecular drawing tools (atoms, bonds, rings)
  - Clean up structure layout

- ModelKit 3D editor:
  - Interactive atom manipulation in 3D space
  - Automatic structure optimization during atom movement
  - Add/delete atoms and modify bonds
  - Bond order modification
  - Right-click menu for advanced editing options
  - Automatic geometry optimization

- Enhanced XYZ structure editor:
  - Direct coordinate editing
  - Live preview of changes
  - Structure optimization
  - Atom selection mode
  - Save edited structures
  - Draggable and resizable editor window

### ElemCo.jl Input Generation

- Built-in support for generating ElemCo.jl input files
- Direct conversion of molecular structures to ElemCo.jl input format
- Support for common quantum chemistry methods (HF, MP2, CCSD, etc.)
- Basis set selection
- Density fitting toggle for supported methods

## Troubleshooting

For troubleshooting guides and solutions to common issues, see [Troubleshooting.md](Troubleshooting.md).

## Advanced Features

- Orbital visualization:
  - Advanced orbital visualization with HOMO/LUMO identification
  - Easy orbital navigation with arrow keys
  - Orbital energy level display
  - Quick HOMO/LUMO switching
  - Visual distinction between HOMO and LUMO
  - Interactive orbital list

- General features:
  - Cross-platform support (Windows, macOS, Linux)
  - Native desktop application experience
  - Multi-format file support
  - Structure optimization capabilities

## Installation

### Pre-built Executables

Executables for Windows and Linux are automatically generated for each release on GitHub. You can:

1. Download the latest version for your platform from the [releases page](https://github.com/fkfest/jsmol_viewer/releases/latest)
2. Run the installer for your platform
   - Windows: `.exe` installer
   - Linux: `.AppImage` or `.deb`/`.rpm` package

### From Source

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

1. Run the application:

```bash
npm start
```

### Building

To build the application:

```bash
npm run build
```

This will create installers in the `dist` directory.

## Development

This application is built with:

- Electron
- JSmol (JavaScript-based molecular viewer)
- Node.js

## Credits

- Electron application wrapper developed as JSmol Viewer
- JSmol is part of the Jmol project:
  - Original Jmol code conversion to JavaScript by Bob Hanson
  - Java2Script written by Zhou Renjian, et al.
- JSME (JavaScript Molecular Editor):
  - Developed by Peter Ertl and Bruno Bienfait
  - Original publication: B. Bienfait, P. Ertl, JSME: a free molecule editor in JavaScript, J. Cheminform. 5:24 (2013)

## License

This project is licensed under LGPL-2.1.

## Documentation

For more information about the underlying JSmol viewer:

- [Jmol Documentation](http://jmol.sourceforge.net)
- [JSmol Documentation](http://jsmol.sourceforge.net)

## Using the XYZ Editor

The application includes a draggable XYZ structure editor that allows you to:

- View and edit molecular coordinates in XYZ format
- Switch between selection and edit modes
- Select individual atoms in the structure
- Optimize molecular geometry using JSmol's built-in minimization
- Preview changes in real-time in the 3D viewer
- Save edited structures to XYZ files
- Move the editor window anywhere on screen by dragging its header
- Resize the editor window by dragging its bottom-right corner

To use the editor:

1. Load a molecular structure
2. Click the "Edit XYZ" button
3. Use Selection mode to highlight specific atoms
4. Switch to Edit mode to modify coordinates
5. Click "Optimize Structure" to improve geometry
6. Click "Update Structure" to apply your changes
7. Click "Save XYZ File" to save the current structure

## Orbital Visualization

The orbital viewer provides enhanced visualization of molecular orbitals:

- Interactive orbital list showing energy levels
- Color-coded HOMO and LUMO identifiers
- Keyboard navigation (↑/↓ arrow keys)
- Quick HOMO/LUMO access buttons
- Translucent orbital surface display
- Draggable and resizable control panel

To visualize orbitals:

1. Load a structure with orbital data (e.g., MOLDEN format)
2. Click "Show/Hide Orbitals" button
3. Use arrow keys or buttons to navigate orbitals
4. Click HOMO or LUMO buttons for quick access
5. Select specific orbitals from the energy-sorted list

## 2D Structure Editor (JSME)

The application includes JSME (JavaScript Molecular Editor), providing an integrated 2D structure editing experience:

- Toggle between 3D (JSmol) and 2D (JSME) views with a single click
- Draw and edit molecular structures in a familiar 2D interface
- Automatic conversion between 2D and 3D structures
- Real-time synchronization of changes between editors
- Support for standard molecular drawing tools:
  - Add/remove atoms and bonds
  - Change atom types
  - Adjust bond orders
  - Ring templates
  - Clean up structure layout

To use the 2D editor:

1. Click the "2D Editor" button to switch to JSME
2. Draw or edit your structure using the JSME tools
3. Changes are automatically synchronized with the 3D view
4. Click "3D Viewer" to return to JSmol visualization
5. Use the "Ball & Stick" or other display styles to view your structure in 3D

The 2D editor is particularly useful for:

- Creating new molecular structures from scratch
- Quick structural modifications
- Drawing complex molecular scaffolds
- Teaching and presentation purposes

## ModelKit - 3D Structure Editor

The application includes JSmol's built-in ModelKit for interactive 3D structure editing:

- Click the "3D" button in the Edit section to activate ModelKit mode
- Default mode - Drag & Minimize:
  - Click and drag atoms to move them in 3D space
  - Structure is automatically optimized after each movement
  - Helps in quick structure refinement and conformation exploration

Advanced ModelKit features (activated via right-click menu):

- Add/Delete atoms
  - Right-click to access the atom menu
  - Choose from common elements (H, C, N, O, etc.)
  - Click on existing atoms to add new ones
  - Delete atoms using the delete option
- Bond manipulation
  - Change bond orders (single, double, triple)
  - Add/remove bonds between atoms
  - Adjust bond angles and lengths
- Structure cleaning
  - Automatic geometry optimization
  - Bond length normalization
  - Angle adjustment to standard values

To use ModelKit:

1. Click the "3D" button to activate
2. Left-click and drag atoms to move them (default mode)
3. Right-click for additional editing options
4. Changes are applied in real-time
5. Click "3D" again to exit ModelKit mode

This feature complements the XYZ editor and 2D JSME editor, providing a complete set of molecular editing tools.

## ElemCo.jl Integration

The application includes built-in support for generating ElemCo.jl input files for quantum chemistry calculations:

### ElemCo.jl Features

- Direct conversion of molecular structures to ElemCo.jl input format
- Support for common quantum chemistry methods:
  - Hartree-Fock (HF)
  - Second-order Møller-Plesset perturbation theory (MP2)
  - Distinguishable Cluster Singles and Doubles (DCSD)
  - Coupled Cluster with Singles, Doubles, and perturbative Triples (CCSD(T))
  - Coupled Cluster with Singles, Doubles, and Triples (CCSDT)
  - Distinguishable Cluster CCSDT (DC-CCSDT)
  - SVD-Distinguishable Cluster methods (SVD-DCSD)

### Available Options

- Basis Sets:
  - Correlation-consistent basis sets (cc-pVDZ, cc-pVTZ)
  - Augmented correlation-consistent basis sets (aug-cc-pVDZ, aug-cc-pVTZ)
  - Automatic or manual selection of auxiliary basis sets for:
    - JK-fitting (cc-pVXZ-jkfit, def2-universal-jkfit)
    - MP2-fitting (cc-pVXZ-mpfit, aug-cc-pVXZ-mpfit)
- Density Fitting (DF) toggle for supported methods
- Charge and multiplicity specification
- Direct text editing of generated input

### Using ElemCo.jl Integration

1. Load or create a molecular structure in the viewer
2. Click the ElemCo.jl logo button in the control panel
3. Select desired calculation options:
   - Choose quantum chemistry method
   - Select basis sets
   - Toggle density fitting if desired
   - Set charge and multiplicity if needed
4. Review the generated input in the text editor
5. Copy the input directly to clipboard
6. Use the input with ElemCo.jl for calculations

The integration provides a convenient way to prepare quantum chemistry calculations while visualizing the molecular structure. For more information about ElemCo.jl and its capabilities, visit [elem.co.il](https://elem.co.il).

## Database Search and Molecule Loading

The application includes comprehensive database search functionality for loading molecular structures directly from online databases.

### PubChem Database

PubChem integration allows direct access to over 100 million chemical structures without requiring local file downloads.

#### Search Methods

1. **Compound ID (CID) Search**
   - Enter numeric PubChem compound identifier
   - Example: `1983` (loads caffeine)
   - Most reliable method for known compounds

2. **Chemical Name Search**
   - Search by common names, systematic names, or trade names
   - Examples: `caffeine`, `aspirin`, `benzene`, `glucose`
   - Case-insensitive matching

3. **SMILES Search**
   - Use SMILES notation for precise structure specification
   - Examples: `C6H6` (benzene), `CC=O` (acetaldehyde), `CC(=O)OC1=CC=CC=C1C(=O)O` (aspirin)
   - Useful for specific structural queries

#### Quick Access Buttons

The application provides one-click access to common molecules:

- **Educational Examples**: Caffeine, aspirin, glucose, benzene, ethanol
- **Research Compounds**: Quercetin (flavonoid)
- **SMILES Examples**: C6H6 (benzene), CC=O (acetaldehyde)
- **Reliable CID Examples**: 1983 (caffeine), 2244 (aspirin), 5793 (glucose)

#### Using Database Search

1. **Locate the Database Search Section** in the control panel
2. **Select Search Method** (optional):
   - Click the search type selector on the right side of the input field
   - Choose from: **Auto-detect** (default), **CID**, **Name**, or **SMILES**
   - The input placeholder text will update to show relevant examples
3. **Enter Query** in the input field
4. **Execute Search**:
   - Click "Load from PubChem" button
   - Or press Enter for quick loading
5. **Quick Examples**: Click any example button for instant loading

#### Search Tips

- **Search Type Selection**: Click the selector on the right side of the input field to override auto-detection:
  - **Auto-detect**: Smart detection based on input patterns (default)
  - **CID**: Force search by compound identifier (most reliable)
  - **Name**: Force search by chemical name (reliable for common names)
  - **SMILES**: Force SMILES search (useful when auto-detection fails or for complex SMILES)
- **Auto-Detection**: When using auto-detect mode, the application automatically detects query type:
  - Pure numbers are treated as CIDs
  - Text with chemical patterns is treated as names
  - Strings with SMILES-specific characters are detected as SMILES
- **Reliability**: For best results, use this order of preference:
  1. **CID numbers** (most reliable - unique identifiers)
  2. **Chemical names** (reliable - use common or systematic names)
  3. **SMILES** (least reliable for auto-detection - use explicit SMILES mode for better results)
- **Error Handling**: Network issues and invalid queries show helpful error messages
- **Display Mode**: Loaded structures automatically use your current display mode preference
- **Integration**: Database-loaded structures work with all editing and analysis features

#### Troubleshooting Database Search

- **Connection Issues**: Check internet connectivity if searches fail
- **Name Not Found**: Try alternative names or systematic nomenclature
- **SMILES Issues**: 
  - Auto-detected SMILES searches may return unexpected compounds due to database indexing
  - **Solution**: Click the search type selector on the right and choose "SMILES" for more predictable results
  - Multiple compounds may match the same SMILES pattern
  - For ethanol, use the name `ethanol` instead of SMILES `CCO`
  - Use chemical names or CID numbers for more predictable results
- **Invalid SMILES**: Verify SMILES syntax using online validators
- **Slow Loading**: Large molecules may take longer to load and render

The database search feature enhances jlmol's educational and research capabilities by providing instant access to PubChem's vast molecular database, making it ideal for:

- **Educational Use**: Quick access to textbook molecules
- **Research Planning**: Loading known compounds for analysis
- **Structure Comparison**: Loading reference structures
- **Method Development**: Testing with diverse molecular structures
