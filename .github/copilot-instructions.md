# jlmol - Molecular Visualization Desktop Application

jlmol is an Electron-based desktop application for molecular visualization built with JSmol (JavaScript molecular viewer). It provides native desktop experience for powerful molecular visualization, structure editing, database search integration, and quantum chemistry calculations via ElemCo.jl. Additionally, the application also works in a browser as a website.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Setup
- Install dependencies:
  ```bash
  npm install
  ```
  Takes ~5-25 seconds. Dependencies include electron, electron-builder, and various utilities.

- Verify version management system:
  ```bash
  npm run check-version
  ```
  This ensures all files use dynamic version loading from package.json.

### Development and Testing
- Run the application in development mode:
  ```bash
  npm start
  ```
  Launches Electron app. On some CI environments, may encounter sandbox issues - this is normal for local development.

- Run with hardware acceleration disabled (for troubleshooting):
  ```bash
  npm run start-safe
  ```
  Use this if experiencing graphics issues on Windows 11 or other GPU-related problems.

- Run with enhanced debugging:
  ```bash
  npm run start-debug
  npm run start-safe-debug
  ```

- Debug GPU capabilities:
  ```bash
  npm run debug-gpu
  ```

### Building
- Build for Linux:
  ```bash
  npm run build:linux
  ```
  **CRITICAL TIMING**: Takes approximately 3 minutes. NEVER CANCEL. Set timeout to 5+ minutes.
  Creates AppImage, deb, and rpm packages in dist/ directory.

- Build for Windows:
  ```bash
  npm run build:windows
  ```
  **CRITICAL TIMING**: Similar 3+ minute duration. NEVER CANCEL. Set timeout to 5+ minutes.

- Build for macOS:
  ```bash
  npm run build:mac
  ```
  **CRITICAL TIMING**: Similar 3+ minute duration. NEVER CANCEL. Set timeout to 5+ minutes.

- Build for all platforms:
  ```bash
  npm run build
  ```
  **CRITICAL TIMING**: Takes 5-10 minutes for all platforms. NEVER CANCEL. Set timeout to 15+ minutes.

## Validation Scenarios

**ALWAYS test functionality after making changes by running through these scenarios:**

### Mandatory Build Verification
**After any code changes, ALWAYS verify the following before considering work complete:**

1. **Build Linux AppImage**:
   ```bash
   rm -rf dist && npm run build:linux
   ```
   Verify `dist/jlmol-*.AppImage` is created successfully. The rpm target may fail if `rpmbuild` is not installed - this is acceptable.

2. **Build Windows installer** (cross-compile from Linux):
   ```bash
   npm run build:windows
   ```
   Verify `dist/jlmol-*.exe` is created successfully.

3. **Test browser version**:
   - Open `index.html` directly in a browser (file:// or via local server)
   - Verify JSmol viewer loads correctly
   - Test basic functionality (load sample molecule, rotate, change display mode)
   - Check browser console for errors
   - Ensure version number displays (may show "unknown" without server due to package.json fetch)

**NOTE**: This application must work in BOTH Electron AND browser environments. Any changes to JavaScript code must use feature detection (e.g., `typeof require !== 'undefined'`) when using Node.js-specific APIs.

### Basic Molecular Viewer Testing
1. Start the application: `npm start`
2. Load a sample molecule from jsmol/data/ directory (drag and drop or file menu)
3. Test rotation: Click and drag to rotate the molecule
4. Test display modes: Switch between ball&stick, wireframe, spacefill
5. Test spin animation: Enable/disable spin controls
6. Verify UI responsiveness and no console errors

### Database Search Testing
1. Test PubChem search by CID: Enter `1983` (caffeine) and click Load
2. Test name search: Enter `aspirin` and verify structure loads
3. Test SMILES search: Enter `C6H6` (benzene) and verify
4. Test search type selector: Click dropdown to force specific search types
5. Verify Enter key functionality for quick loading
6. Check status messages for successful/failed loads

### Structure Editor Testing
1. Open JSME 2D editor (structure editing panel)
2. Draw a simple molecule (e.g., methane)
3. Switch between 2D and 3D views
4. Verify synchronization between editors
5. Test ModelKit 3D editor for atom manipulation
6. Test XYZ structure editor for coordinate editing

### ElemCo.jl Integration Testing
1. Load a molecule and open ElemCo.jl panel
2. Configure calculation settings (method, basis set)
3. Generate input file and verify syntax
4. If Julia is available, test calculation execution
5. Verify file handling and temp file management

## File Structure and Key Locations

### Critical Files
- `package.json` - Single source of truth for version, dependencies, scripts
- `main.js` - Electron main process, handles window creation and app lifecycle  
- `index.html` - Main UI with JSmol integration, molecular viewer interface
- `renderer.js` - Renderer process logic, UI interactions, ElemCo.jl functions
- `.github/workflows/release.yml` - Automated build and release pipeline

### Important Directories
- `jsmol/` - JSmol molecular viewer library and sample data files
- `jsmol/data/` - Sample molecular structure files (PDB, XYZ, CIF, etc.)
- `build/` - Application icons and build resources
- `scripts/` - Utility scripts including `runremote` for remote Julia execution
- `legacy/` - Legacy test files and older JSmol implementations
- `dist/` - Build output directory (created after running build commands)

### Configuration Files
- `.gitignore` - Git ignore patterns
- `VERSION-MANAGEMENT.md` - Documentation for version management system
- `Troubleshooting.md` - User troubleshooting guide
- `CHANGELOG.md` - Project change history

## Common Tasks and Patterns

### Version Management
- Version is defined ONLY in package.json
- All other files use dynamic version loading
- Run `npm run check-version` to verify consistency
- Never hardcode versions in HTML, JS, or other files

### Julia/ElemCo.jl Integration
- Supports custom Julia commands via user preferences
- WSL integration with automatic path translation
- Remote execution via SSH (scripts/runremote)
- Always test calculation generation before execution

### Troubleshooting Graphics Issues
- Windows 11 users may need hardware acceleration disabled
- Use `npm run start-safe` for GPU-related problems
- Use `npm run debug-gpu` for comprehensive GPU analysis
- Check WINDOWS11-FIX-SUMMARY.md for platform-specific solutions

### Database Integration
- PubChem integration requires internet connection
- Search supports CID, names, SMILES, and molecular formulas
- Auto-detection of search types with manual override
- Network timeouts are handled gracefully

## Technology Stack
- **Electron** - Desktop application framework
- **JSmol** - JavaScript-based molecular viewer
- **Node.js** - Runtime environment
- **jQuery** - DOM manipulation (via JSmol)
- **JSME** - 2D structure editor
- **electron-builder** - Application packaging and distribution

## No Testing or Linting Infrastructure
This project does not have:
- Automated test suites
- Linting configuration (ESLint, etc.)
- Code formatting tools (Prettier, etc.)
- CI testing beyond builds

**Manual validation is REQUIRED** - always run through the "Mandatory Build Verification" section and relevant validation scenarios above after making changes.

## Build Distribution
- Windows: .exe installer via NSIS
- Linux: AppImage, .deb, and .rpm packages  
- macOS: .dmg package
- Automated releases via GitHub Actions when tags are pushed
- Draft releases require manual publication

## Platform-Specific Notes
- **Windows**: WSL support for Julia integration, GPU troubleshooting common
- **Linux**: Primary development platform, all package formats supported
- **macOS**: Supported but may require code signing for distribution
- **Electron**: Version 28.x, supports modern web standards and ES6+
- **Browser**: Works as standalone webpage, must not use Node.js APIs without feature detection

Always ensure compatibility across platforms when making changes affecting the main process or native integrations.

## Dual Environment Compatibility (CRITICAL)

This application **MUST** work in both environments:
1. **Electron desktop app** - Has access to Node.js APIs (`require`, `fs`, `child_process`, etc.)
2. **Browser webpage** - No Node.js, only standard Web APIs available

### Best Practices for Dual Compatibility:
- Always use feature detection before Node.js APIs:
  ```javascript
  if (typeof require !== 'undefined') {
      // Electron-specific code
      const fs = require('fs');
  } else {
      // Browser fallback
  }
  ```
- Use modern Web APIs with fallbacks (e.g., Clipboard API with `document.execCommand` fallback)
- Never assume `process`, `require`, or `__dirname` exist without checking
- Test both environments after changes: `npm start` for Electron, open `index.html` in browser