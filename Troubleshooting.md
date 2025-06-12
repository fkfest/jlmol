# Troubleshooting

This document provides solutions for common issues encountered while using jlmol.

## System-wide Graphics Issues (Windows 11)

If you experience system-wide graphics problems or other Electron apps start blinking after running jlmol, try these solutions:

### Option 1: Disable Hardware Acceleration

```bash
npm run start-safe
```

or run with command line flag:

```bash
jlmol.exe --disable-hardware-acceleration
```

### Option 2: Update Graphics Drivers

- Update your graphics card drivers to the latest version
- Consider switching between integrated and discrete graphics

### Option 3: Run GPU Debug Tool

For comprehensive system analysis:

```bash
npm run debug-gpu
```

This will generate a detailed report of your GPU capabilities and test different configurations.

### Option 4: Run in Safe Mode

For debugging issues:

```bash
npm run start-safe-debug
```

### Option 5: Check System Resources

- Close other graphics-intensive applications
- Monitor memory usage (Task Manager)
- Restart your computer if issues persist

## Performance Issues

- Disable spin animation when not needed
- Close unused panels (Orbitals, XYZ Editor)
- Use wireframe mode for large molecules
- Limit window size for complex structures

## File Loading Issues

- Ensure file format is supported (.xyz, .pdb, .mol, .cif, .molden)
- Check file encoding (UTF-8 recommended)
- Verify file structure and syntax

## Database Search

jlmol supports loading structures directly from the PubChem database:

### PubChem Database

- **By Compound ID (CID)**: `:1983`, `:5280343`
- **By Name**: `:caffeine`, `:aspirin`, `:glucose`
- **By SMILES**: `:smiles:CC/C=C/CC`, `:smiles:C6H6`
- **Search Type Control**: Use the dropdown to force specific search types
- Loads 3D structures when available

### Usage Tips

- Enter the compound identifier in the search box and click "Load"
- Press Enter after typing to load quickly
- Click the search type selector on the right side of the input to override auto-detection:
  - **Auto-detect**: Smart detection (default)
  - **CID**: Force CID search
  - **Name**: Force name search  
  - **SMILES**: Force SMILES search (recommended for SMILES queries)
- Use the example buttons for common structures
- Check the status message for loading confirmation or errors

### Troubleshooting Database Loading

- Ensure internet connection is active
- Some structures may take time to download
- If loading fails, try alternative search terms or identifiers
- For SMILES issues, try clicking the search type selector and choosing "SMILES" instead of auto-detection
- Large molecules may require more memory

## Database Search Issues

### Connection Problems

- Check internet connection for database searches
- PubChem may be temporarily unavailable
- Try different search terms if one fails

### Search Tips

- **PubChem**: Search by CID number, chemical name, or SMILES string
- Use common chemical names (e.g., "aspirin" instead of "acetylsalicylic acid")
- For SMILES searches, ensure proper formatting

### Common Database Search Errors

- Chemical name not found in PubChem database
- Network timeout (try again)
- SMILES syntax errors (check for proper formatting)
- CID number does not exist

## Additional Support

For more detailed troubleshooting information and platform-specific fixes, see:

- [WINDOWS11-FIX-SUMMARY.md](WINDOWS11-FIX-SUMMARY.md) - Windows 11 specific solutions
- [DISPLAY_MODE_FIX_COMPLETE.md](DISPLAY_MODE_FIX_COMPLETE.md) - Display mode button fixes
- [ELEMCO_FIX_COMPLETE.md](ELEMCO_FIX_COMPLETE.md) - ElemCo.jl integration fixes

If you encounter issues not covered here, please check the GitHub issues or create a new issue with details about your system and the specific problem.
