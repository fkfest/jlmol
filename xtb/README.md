# xTB Integration for JLMol

This directory contains platform-specific xTB executables for seamless integration with JLMol.

## About xTB

xTB (extended tight-binding) is a semiempirical quantum chemistry package developed by the Grimme group. It provides fast and reasonably accurate calculations for:

- Geometry optimizations
- Frequency calculations
- Molecular properties
- Conformer searches

## Directory Structure

```
xtb/
├── linux/          # Linux x64 executable (xTB v6.7.1)
├── win32/          # Windows executable (xTB v6.7.1-pre)  
├── darwin/         # macOS placeholder script
└── README.md       # This file
```

## Current Status

✅ **Linux**: xTB v6.7.1 binary installed and ready to use
✅ **Windows**: xTB v6.7.1-pre binary installed and ready to use  
ℹ️ **macOS**: No official binaries available - see alternative installation methods below

## Installation Status

The latest xTB binaries have been downloaded and installed:

- **Linux**: `xtb` v6.7.1 (63MB, downloaded July 3, 2025)
- **Windows**: `xtb.exe` v6.7.1-pre (59MB, downloaded July 3, 2025)
- **macOS**: Placeholder script with installation instructions

## macOS Users

Since official macOS binaries are not available in the latest release, macOS users can install xTB using:

1. **Conda**: `conda install -c conda-forge xtb`
2. **Homebrew**: `brew install grimme-lab/qc/xtb`  
3. **Build from source**: https://github.com/grimme-lab/xtb

After system installation, JLMol will automatically detect and use the system xTB.

## Manual Update

To update to newer versions, download the latest binaries from the [xTB releases page](https://github.com/grimme-lab/xtb/releases):

### For Linux:
```bash
# Download and extract latest Linux binary
wget https://github.com/grimme-lab/xtb/releases/download/v6.7.1/xtb-6.7.1-linux-x86_64.tar.xz
tar -xf xtb-6.7.1-linux-x86_64.tar.xz
cp xtb-dist/bin/xtb ./linux/
chmod +x ./linux/xtb
```

### For Windows:
```bash
# Download and extract latest Windows binary
wget https://github.com/grimme-lab/xtb/releases/download/v6.7.1/xtb-6.7.1pre-windows-x86_64.zip
unzip xtb-6.7.1pre-windows-x86_64.zip
cp xtb-6.7.1/bin/xtb.exe ./win32/
```

### For macOS:
Check conda-forge or Homebrew for the latest versions, or build from source using the [xTB documentation](https://xtb-docs.readthedocs.io/).

## License

xTB is licensed under the LGPL-3.0 License. See the [xTB repository](https://github.com/grimme-lab/xtb) for full license details.

## Citation

If you use xTB calculations through JLMol, please cite:

C. Bannwarth, E. Caldeweyher, S. Ehlert, A. Hansen, P. Pracht, J. Seibert, S. Spicher, S. Grimme
*WIREs Comput. Mol. Sci.*, **2020**, *11*, e01493.
DOI: [10.1002/wcms.1493](https://doi.org/10.1002/wcms.1493)

## Usage

Once xTB is available (either bundled or system-installed), you can:

1. Load a molecular structure in JLMol
2. Click the "xTB Optimize" button in the Edit section
3. Configure calculation parameters (method, charge, solvent, etc.)
4. Run the optimization
5. Load the optimized structure back into the viewer

## Troubleshooting

If xTB calculations fail:

1. Check that xTB executable exists and has proper permissions
2. Verify the molecular structure is valid
3. Check the calculation output for error messages
4. Ensure sufficient disk space for temporary files

For more help, see the [xTB documentation](https://xtb-docs.readthedocs.io/).
