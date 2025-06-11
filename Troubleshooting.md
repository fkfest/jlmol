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

## Additional Support

For more detailed troubleshooting information and platform-specific fixes, see:

- [WINDOWS11-FIX-SUMMARY.md](WINDOWS11-FIX-SUMMARY.md) - Windows 11 specific solutions
- [DISPLAY_MODE_FIX_COMPLETE.md](DISPLAY_MODE_FIX_COMPLETE.md) - Display mode button fixes
- [ELEMCO_FIX_COMPLETE.md](ELEMCO_FIX_COMPLETE.md) - ElemCo.jl integration fixes

If you encounter issues not covered here, please check the GitHub issues or create a new issue with details about your system and the specific problem.
