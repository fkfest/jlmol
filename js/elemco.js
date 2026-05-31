        function showElemCoPanel() {
            debugLog('ElemCo', 'Opening panel');
            const panel = document.getElementById('elemcoPanel');
            if (panel) {
                panel.style.display = 'block';
                
                // Reinitialize panel elements to ensure they're set up properly
                debugLog('ElemCo', 'Initializing panel elements');
                initElemCoPanel();
                
                // Force refresh molecular data detection with multiple attempts
                debugLog('ElemCo', 'Starting molecular data refresh sequence');
                
                // Immediate attempt
                updateElemCoInput();
                
                // Delayed attempt 1 - sometimes JSmol needs time to update
                setTimeout(() => {
                    debugLog('ElemCo', 'First delayed attempt');
                    updateElemCoInput();
                }, 100);
                
                // Delayed attempt 2 - final fallback with force refresh
                setTimeout(() => {
                    console.log('showElemCoPanel: Second delayed attempt with force refresh');
                    
                    // Check if we still have the error message
                    const inputArea = document.getElementById('elemco-input');
                    if (inputArea && inputArea.value.includes('Please load a molecule first')) {
                        console.warn('showElemCoPanel: Still showing "Please load a molecule first", trying force refresh');
                        
                        const refreshSuccess = forceRefreshMolecularData();
                        
                        if (!refreshSuccess) {
                            // Try to diagnose the issue
                            try {
                                const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
                                console.log('showElemCoPanel: Diagnostic - JSmol atom count:', atomCount);
                                
                                if (atomCount > 0) {
                                    console.log('showElemCoPanel: Atoms exist but data retrieval failed. This suggests a JSmol communication issue.');
                                    inputArea.value = '# Molecular data detected but could not be retrieved.\n# Try closing and reopening the ElemCo panel, or reload the molecule.';
                                } else {
                                    console.log('showElemCoPanel: No atoms detected in JSmol');
                                    inputArea.value = '# No molecular structure detected.\n# Please load a molecule first.';
                                }
                            } catch (e) {
                                console.error('showElemCoPanel: Diagnostic failed:', e);
                                inputArea.value = '# Error communicating with molecular viewer.\n# Please reload the page and try again.';
                            }
                        }
                    } else {
                        console.log('showElemCoPanel: ElemCo input appears to be working correctly');
                    }
                }, 300);
            } else {
                console.error('showElemCoPanel: Could not find elemcoPanel element');
            }
        }

        function hideElemCoPanel() {
            document.getElementById('elemcoPanel').style.display = 'none';
        }

        function generateElemCoInput() {
            updateElemCoInput();
            document.getElementById('status').innerHTML = 'ElemCo.jl input reset to default';
        }

        // Insert the list of currently selected atoms (sorted, 1-based indices) at the
        // cursor position in the ElemCo input editor, e.g. for dummy atoms or active
        // regions. Falls back to appending at the end if no cursor position is known.
        function insertSelectedAtomsIntoElemCo() {
            const nums = getSelectedAtomNumbers();
            if (nums.length === 0) {
                document.getElementById('status').innerHTML =
                    'No atoms selected — click atoms in the structure or XYZ viewer first';
                return;
            }
            const textarea = document.getElementById('elemco-input');
            const listText = '[' + nums.join(', ') + ']';
            const hasCursor = typeof textarea.selectionStart === 'number';
            const start = hasCursor ? textarea.selectionStart : textarea.value.length;
            const end = hasCursor ? textarea.selectionEnd : textarea.value.length;
            textarea.value = textarea.value.slice(0, start) + listText + textarea.value.slice(end);
            const pos = start + listText.length;
            textarea.selectionStart = textarea.selectionEnd = pos;
            textarea.focus();
            document.getElementById('status').innerHTML =
                `Inserted ${nums.length} selected atom${nums.length === 1 ? '' : 's'}: ${listText}`;
        }

        function copyElemCoInput() {
            const input = document.getElementById('elemco-input');
            const text = input.value;
            
            // Use modern Clipboard API with fallback for older browsers
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    document.getElementById('status').innerHTML = 'Input copied to clipboard';
                }).catch(err => {
                    console.error('Clipboard API failed:', err);
                    fallbackCopyToClipboard(input);
                });
            } else {
                fallbackCopyToClipboard(input);
            }
        }
        
        // Fallback for browsers without Clipboard API
        function fallbackCopyToClipboard(textArea) {
            textArea.select();
            try {
                document.execCommand('copy');
                document.getElementById('status').innerHTML = 'Input copied to clipboard';
            } catch (err) {
                console.error('Fallback copy failed:', err);
                document.getElementById('status').innerHTML = 'Copy failed - please copy manually';
            }
        }

        // Remove previous event listeners and add new ones
        function initializeElemCoListeners() {
            const method = document.getElementById('elemco-method');
            const aoBasis = document.getElementById('elemco-basis');
            const jkfitBasis = document.getElementById('elemco-jkfit');
            const mpfitBasis = document.getElementById('elemco-mpfit');
            const charge = document.getElementById('elemco-charge');
            const multiplicity = document.getElementById('elemco-multiplicity');
            const moldenCheckbox = document.getElementById('elemco-molden');
            const moldenFile = document.getElementById('elemco-molden-file');

            // Store references to listeners for proper cleanup
            const elements = [
                { element: method, event: 'change', handler: updateElemCoInput },
                { element: aoBasis, event: 'change', handler: updateElemCoInput },
                { element: jkfitBasis, event: 'change', handler: updateElemCoInput },
                { element: mpfitBasis, event: 'change', handler: updateElemCoInput },
                { element: charge, event: 'input', handler: updateElemCoInput },
                { element: multiplicity, event: 'input', handler: updateElemCoInput },
                { element: moldenCheckbox, event: 'change', handler: updateElemCoInput },
                { element: moldenFile, event: 'input', handler: updateElemCoInput }
            ];

            // Remove old listeners if they exist
            elements.forEach(({ element, event, handler }) => {
                if (element && element._elemcoHandler) {
                    element.removeEventListener(event, element._elemcoHandler);
                }
            });

            // Add new listeners and store references
            elements.forEach(({ element, event, handler }) => {
                if (element) {
                    element._elemcoHandler = handler;
                    element.addEventListener(event, handler);
                }
            });
        }

        // Function to update method options based on DF toggle
        function updateMethodOptions() {
            const dfEnabled = document.getElementById('elemco-df').checked;
            const methodSelect = document.getElementById('elemco-method');
            const selectedMethod = methodSelect.value;
            
            // Store all available methods
            const allMethods = {
                standard: ['HF', 'MP2', 'DCSD', 'CCSD(T)', 'CCSDT', 'DC-CCSDT', 'SVD-DC-CCSDT'],
                df: ['HF', 'MP2', 'SVD-DCSD']
            };

            // Clear existing options
            methodSelect.innerHTML = '';

            // Add appropriate methods based on DF toggle
            const methods = dfEnabled ? allMethods.df : allMethods.standard;
            methods.forEach(method => {
                const option = document.createElement('option');
                option.value = method;
                option.text = method;
                methodSelect.appendChild(option);
            });

            // Try to maintain selected method if it's still available
            if (methods.includes(selectedMethod)) {
                methodSelect.value = selectedMethod;
            }

            // Update the input text
            updateElemCoInput();
        }
        
        // Function to generate meaningful comment line for XYZ files
        function generateXYZCommentLine() {
            // Check if we have database metadata
            if (window.databaseMetadata && window.databaseMetadata.source === 'PubChem') {
                const metadata = window.databaseMetadata;
                let commentParts = [];
                
                // Add PubChem source
                commentParts.push('PubChem');
                
                // Add CID if available
                if (metadata.cid) {
                    commentParts.push(`CID:${metadata.cid}`);
                }
                
                // Add compound name if available
                if (metadata.name) {
                    commentParts.push(`Name:"${metadata.name}"`);
                }
                
                // Add SMILES if available (truncate if too long)
                if (metadata.smiles) {
                    const smiles = metadata.smiles.length > 50 ? 
                        metadata.smiles.substring(0, 47) + '...' : 
                        metadata.smiles;
                    commentParts.push(`SMILES:${smiles}`);
                }
                
                // Add query info if different from what's already shown
                if (metadata.originalQuery && metadata.queryType) {
                    if (metadata.queryType === 'CID' && metadata.originalQuery !== metadata.cid) {
                        commentParts.push(`Query:${metadata.originalQuery}`);
                    } else if (metadata.queryType === 'Name' && metadata.originalQuery !== metadata.name) {
                        commentParts.push(`Query:"${metadata.originalQuery}"`);
                    } else if (metadata.queryType === 'SMILES' && metadata.originalQuery !== metadata.smiles) {
                        commentParts.push(`Query:${metadata.originalQuery}`);
                    } else if (metadata.queryType === 'Formula') {
                        commentParts.push(`Formula:${metadata.originalQuery}`);
                    }
                }
                
                return commentParts.join(', ');
            }
            
            // Fallback to original comment if no database metadata
            return 'Structure with numbered atoms';
        }
        
        // Function to generate XYZ content with numbered atoms if available
        function getXYZDataWithNumberedAtoms() {
            debugLog('XYZ', 'Starting data retrieval');
            debugLog('XYZ', `shouldUseNumberedAtoms flag: ${shouldUseNumberedAtoms}`);
            
            try {
                // First check if there are any atoms at all
                const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
                debugLog('XYZ', `Atom count from JSmol: ${atomCount}`);
                
                if (!atomCount || atomCount === 0) {
                    console.warn('No atoms found in JSmol');
                    return null;
                }
                
                // Strategy 1: Try to use preserved numbered atom names
                if (window.originalAtomNames && window.originalAtomNames.length > 0) {
                    console.log('getXYZDataWithNumberedAtoms: Found preserved atom names, count:', window.originalAtomNames.length);
                    try {
                        if (atomCount === window.originalAtomNames.length) {
                            let xyzContent = atomCount + '\n' + generateXYZCommentLine() + '\n';
                            
                            for (let i = 0; i < atomCount; i++) {
                                // Get atom coordinates from JSmol
                                const x = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.x`);
                                const y = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.y`);
                                const z = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.z`);
                                
                                // Validate coordinates
                                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                                    console.warn('Invalid coordinates for atom', i, 'falling back');
                                    break;
                                }
                                
                                // Use the preserved numbered atom name
                                const atomName = window.originalAtomNames[i];
                                xyzContent += `${atomName} ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
                            }
                            
                            // Validate the generated content
                            const lines = xyzContent.trim().split('\n');
                            if (lines.length >= atomCount + 2) {
                                console.log('getXYZDataWithNumberedAtoms: Successfully generated numbered XYZ data');
                                return xyzContent;
                            }
                        } else {
                            console.warn('Atom count mismatch: JSmol has', atomCount, 'but preserved names has', window.originalAtomNames.length);
                        }
                    } catch (error) {
                        console.error('Error generating numbered XYZ data:', error);
                        // Continue to next strategy
                    }
                }
                
                // Strategy 2: Try to get current atom names from JSmol and build XYZ
                console.log('getXYZDataWithNumberedAtoms: Trying to get current atom names from JSmol');
                try {
                    let xyzContent = atomCount + '\n' + generateXYZCommentLine() + '\n';
                    let validData = true;
                    
                    for (let i = 0; i < atomCount && validData; i++) {
                        try {
                            // Try to get current atom name from JSmol
                            let atomName = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.atomName`);
                            if (!atomName || atomName === 'null' || atomName === '') {
                                // Fallback based on whether we should use numbered atoms
                                const element = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.element`) || 'X';
                                atomName = shouldUseNumberedAtoms ? `${element}${i + 1}` : element;
                                console.log(`getXYZDataWithNumberedAtoms: Strategy 2 - Generated atom name for atom ${i}: ${atomName} (shouldUseNumberedAtoms: ${shouldUseNumberedAtoms})`);
                            }
                            
                            const x = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.x`);
                            const y = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.y`);
                            const z = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.z`);
                            
                            // Validate coordinates
                            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                                console.warn('Invalid coordinates for atom', i);
                                validData = false;
                                break;
                            }
                            
                            xyzContent += `${atomName} ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
                        } catch (atomError) {
                            console.warn('Error getting data for atom', i, ':', atomError);
                            validData = false;
                            break;
                        }
                    }
                    
                    if (validData) {
                        console.log('getXYZDataWithNumberedAtoms: Successfully generated XYZ from current JSmol state');
                        return xyzContent;
                    }
                } catch (error) {
                    console.error('Error building XYZ from current JSmol state:', error);
                }
                
                // Strategy 3: Try JSmol's built-in write function
                console.log('getXYZDataWithNumberedAtoms: Trying JSmol write function');
                try {
                    const xyzData = Jmol.evaluateVar(jmolApplet0, 'write("xyz")');
                    if (xyzData && xyzData.trim().length > 0) {
                        const lines = xyzData.trim().split('\n');
                        if (lines.length >= 3 && !isNaN(parseInt(lines[0]))) {
                            console.log('getXYZDataWithNumberedAtoms: Successfully got XYZ from JSmol write function');
                            return xyzData;
                        }
                    }
                } catch (error) {
                    console.error('JSmol write function failed:', error);
                }
                
                // Strategy 4: Manual XYZ building with element symbols (numbered only if appropriate)
                console.log('getXYZDataWithNumberedAtoms: Building manual XYZ with element symbols');
                try {
                    let manualXYZ = atomCount + '\n' + generateXYZCommentLine() + '\n';
                    let validManualData = true;
                    
                    for (let i = 0; i < atomCount && validManualData; i++) {
                        try {
                            const element = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.element`) || 'X';
                            const x = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.x`) || 0;
                            const y = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.y`) || 0;
                            const z = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.z`) || 0;
                            
                            // Use numbered atoms only if this came from an XYZ file
                            const atomName = shouldUseNumberedAtoms ? `${element}${i+1}` : element;
                            console.log(`getXYZDataWithNumberedAtoms: Strategy 4 - Generated atom name for atom ${i}: ${atomName} (shouldUseNumberedAtoms: ${shouldUseNumberedAtoms})`);
                            manualXYZ += `${atomName} ${parseFloat(x).toFixed(6)} ${parseFloat(y).toFixed(6)} ${parseFloat(z).toFixed(6)}\n`;
                        } catch (atomError) {
                            console.warn('Error in manual XYZ generation for atom', i, ':', atomError);
                            validManualData = false;
                            break;
                        }
                    }
                    
                    if (validManualData) {
                        console.log('getXYZDataWithNumberedAtoms: Successfully generated manual XYZ');
                        return manualXYZ;
                    }
                } catch (error) {
                    console.error('Manual XYZ generation failed:', error);
                }
                
                console.error('All XYZ generation strategies failed');
                return null;
                
            } catch (error) {
                console.error('Error in getXYZDataWithNumberedAtoms:', error);
                
                // Last resort: try to get any molecular data
                try {
                    console.log('getXYZDataWithNumberedAtoms: Last resort fallback attempt');
                    const fallbackData = Jmol.evaluateVar(jmolApplet0, 'write("xyz")');
                    if (fallbackData && fallbackData.trim().length > 0) {
                        console.log('getXYZDataWithNumberedAtoms: Fallback successful');
                        return fallbackData;
                    }
                } catch (fallbackError) {
                    console.error('Fallback XYZ generation also failed:', fallbackError);
                }
                
                console.error('All molecular data retrieval attempts failed');
                return null;
            }
        }

        function updateElemCoInput() {
            debugLog('ElemCo', 'Starting input generation');
            
            const dfEnabled = document.getElementById('elemco-df').checked;
            const method = document.getElementById('elemco-method').value;
            const aoBasis = document.getElementById('elemco-basis').value;
            const jkfitBasis = document.getElementById('elemco-jkfit').value;
            const mpfitBasis = document.getElementById('elemco-mpfit').value;
            const charge = parseInt(document.getElementById('elemco-charge').value) || 0;
            const multiplicity = parseInt(document.getElementById('elemco-multiplicity').value) || 0;
            const moldenEnabled = document.getElementById('elemco-molden').checked;
            const moldenFile = document.getElementById('elemco-molden-file').value.trim() || 'orbitals.molden';

            // Get current molecular structure from JSmol (with numbered atoms if available)
            debugLog('ElemCo', 'Calling getXYZDataWithNumberedAtoms');
            const xyzData = getXYZDataWithNumberedAtoms();
            
            if (!xyzData || xyzData.trim().length === 0) {
                debugLog('ElemCo', 'No XYZ data received', 'warning');
                document.getElementById('elemco-input').value = '# Please load a molecule first';
                return;
            }
            
            debugLog('ElemCo', `Received XYZ data, length: ${xyzData.length}`);
            
            // Double-check that we have valid XYZ data
            const lines = xyzData.trim().split('\n');
            if (lines.length < 3) {
                console.warn('updateElemCoInput: XYZ data has insufficient lines:', lines.length);
                document.getElementById('elemco-input').value = '# Invalid molecular structure - please reload molecule';
                return;
            }
            
            // Check if first line contains atom count
            const atomCount = parseInt(lines[0]);
            if (isNaN(atomCount) || atomCount <= 0) {
                console.warn('updateElemCoInput: Invalid atom count in first line:', lines[0]);
                document.getElementById('elemco-input').value = '# Invalid molecular structure - please reload molecule';
                return;
            }
            
            // Verify we have enough data lines for all atoms
            const dataLines = lines.slice(2); // Skip atom count and comment lines
            if (dataLines.length < atomCount) {
                console.warn('updateElemCoInput: Insufficient atom data lines. Expected:', atomCount, 'Found:', dataLines.length);
                document.getElementById('elemco-input').value = '# Incomplete molecular structure - please reload molecule';
                return;
            }
            
            // Validate that atom data lines have proper format
            let validAtomLines = 0;
            for (let i = 0; i < Math.min(dataLines.length, atomCount); i++) {
                const parts = dataLines[i].trim().split(/\s+/);
                if (parts.length >= 4) {
                    const x = parseFloat(parts[1]);
                    const y = parseFloat(parts[2]);
                    const z = parseFloat(parts[3]);
                    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                        validAtomLines++;
                    }
                }
            }
            
            if (validAtomLines < atomCount) {
                console.warn('updateElemCoInput: Not all atom lines are valid. Valid:', validAtomLines, 'Expected:', atomCount);
                document.getElementById('elemco-input').value = '# Malformed molecular structure - please reload molecule';
                return;
            }
            
            debugLog('ElemCo', `XYZ data validation passed. Atoms: ${atomCount}, Valid lines: ${validAtomLines}`);
        
            // Format ElemCo.jl input with complete XYZ specification
            let elemcoInput = `using ElemCo

function main()        
# Molecule specification
geometry = """
${xyzData.trim()}
"""
        
# Set basis set`;
        
            // Handle basis set configuration based on selected options
            if (jkfitBasis === 'auto' && mpfitBasis === 'auto') {
                // Use simple basis set specification if no auxiliary basis sets are selected
                elemcoInput += `\nbasis = "${aoBasis}"\n`;
            } else {
                // Build the basis dictionary with selected auxiliary basis sets
                elemcoInput += `\nbasis = Dict(\n    "ao" => "${aoBasis}"`;

                if (jkfitBasis !== 'auto') {
                    elemcoInput += `,\n    "jkfit" => "${jkfitBasis}"`;
                }

                if (mpfitBasis !== 'auto') {
                    elemcoInput += `,\n    "mpfit" => "${mpfitBasis}"`;
                }

                elemcoInput += "\n)\n";
            }
        
            // Add charge and multiplicity settings only if they are non-zero
            if (charge !== 0 || multiplicity !== 0) {
                elemcoInput += `\n# Set charge and multiplicity\n@set wf charge=${charge} ms2=${multiplicity}\n`;
            }
        
            // Add calculation commands
            elemcoInput += `\n# Run HF calculation first\n${dfEnabled ? '@dfhf' : '@dfhf'}\n`;
        
            // Add coupled cluster calculation if method is not HF
            if (method !== 'HF') {
                const ccCommand = dfEnabled ? '@dfcc' : '@cc';
                elemcoInput += `\n# Run ${method} calculation\n${ccCommand} ${method.toLowerCase()}\n`;
            }

            // Add molden export if enabled
            if (moldenEnabled) {
                elemcoInput += `\n# Export orbitals to Molden file\n@export_molden "${moldenFile}"\n`;
            }

            elemcoInput += `\nend\nmain()\n`;
        
            // Set the input text
            const inputArea = document.getElementById('elemco-input');
            if (inputArea) {
                inputArea.value = elemcoInput;
                debugLog('ElemCo', 'Successfully generated input');
            } else {
                console.error('updateElemCoInput: Could not find elemco-input textarea');
            }
        }

        // Function to run Julia calculation
        async function runJuliaCalculation() {
            const inputTextarea = document.getElementById('elemco-input');
            const outputTextarea = document.getElementById('julia-output');
            const outputSection = document.getElementById('julia-output-section');
            
            if (!inputTextarea || !outputTextarea || !outputSection) {
                document.getElementById('status').innerHTML = 'Error: Could not find required elements';
                return;
            }
            
            const juliaCode = inputTextarea.value.trim();
            if (!juliaCode || juliaCode === '# Please load a molecule first') {
                document.getElementById('status').innerHTML = 'Please generate valid input first';
                return;
            }
            
            // Show the output section
            outputSection.style.display = 'block';
            outputTextarea.value = 'Initializing Julia calculation...\n';
            document.getElementById('status').innerHTML = 'Preparing Julia calculation...';
            
            try {
                // Check if we're in Electron environment
                if (typeof require !== 'undefined') {
                    // Electron environment - use child_process to run Julia
                    await runJuliaInElectron(juliaCode);
                } else {
                    // Browser environment - show instructions for manual execution
                    showJuliaInstructions(juliaCode);
                }
            } catch (error) {
                console.error('Error running Julia calculation:', error);
                outputTextarea.value = `Error: ${error.message}\n\nTroubleshooting:\n- Ensure Julia is installed and accessible\n- Verify ElemCo.jl package is installed\n- Check file permissions\n- Try running Julia from command line first`;
                document.getElementById('status').innerHTML = 'Julia calculation failed - see output for details';
            }
        }
        
        // Function to run Julia in Electron environment
        async function runJuliaInElectron(juliaCode) {
            const { spawn } = require('child_process');
            const fs = require('fs');
            const path = require('path');
            const os = require('os');
            
            const outputTextarea = document.getElementById('julia-output');
            
            // Get the configured Julia command from user preferences
            const prefs = getPreferences();
            const juliaCommand = prefs.juliaCommand || 'julia';
            
            let tempFile = null;
            
            // Cleanup function to be called in all exit scenarios
            function cleanupTempFile() {
                if (tempFile) {
                    try {
                        fs.unlinkSync(tempFile);
                        console.log('Temporary file cleaned up:', tempFile);
                    } catch (e) {
                        console.warn('Could not delete temporary file:', tempFile, e);
                    }
                    tempFile = null;
                }
            }
            
            // Ensure cleanup happens even if process is terminated
            process.on('exit', cleanupTempFile);
            process.on('SIGINT', cleanupTempFile);
            process.on('SIGTERM', cleanupTempFile);
            
            try {
                // Parse Julia command to handle WSL and other complex commands with proper quote handling
                function parseCommand(cmd) {
                    const parts = [];
                    let current = '';
                    let inQuotes = false;
                    let quoteChar = '';
                    
                    for (let i = 0; i < cmd.length; i++) {
                        const char = cmd[i];
                        
                        if ((char === '"' || char === "'") && !inQuotes) {
                            inQuotes = true;
                            quoteChar = char;
                        } else if (char === quoteChar && inQuotes) {
                            inQuotes = false;
                            quoteChar = '';
                        } else if (char === ' ' && !inQuotes) {
                            if (current.trim()) {
                                parts.push(current.trim());
                                current = '';
                            }
                        } else {
                            current += char;
                        }
                    }
                    
                    if (current.trim()) {
                        parts.push(current.trim());
                    }
                    
                    return parts;
                }
                
                const commandParts = parseCommand(juliaCommand.trim());
                const isWSL = commandParts[0].toLowerCase() === 'wsl';
                
                // Create temporary file for Julia code
                const tempDir = os.tmpdir();
                tempFile = path.join(tempDir, `jlmol_calculation_${Date.now()}.jl`);
                fs.writeFileSync(tempFile, juliaCode);
                
                // For WSL, convert Windows path to WSL path
                let filePathForCommand = tempFile;
                if (isWSL) {
                    // Convert Windows path to WSL path format
                    // Handle both uppercase and lowercase drive letters
                    // e.g., C:\Users\... or c:\Users\... -> /mnt/c/Users/...
                    if (/^[A-Za-z]:/.test(tempFile)) {
                        const driveLetter = tempFile.charAt(0).toLowerCase();
                        filePathForCommand = tempFile.replace(/^[A-Za-z]:/, `/mnt/${driveLetter}`).replace(/\\/g, '/');
                    } else {
                        // If path doesn't start with drive letter, assume it's already Unix-style
                        filePathForCommand = tempFile.replace(/\\/g, '/');
                    }
                }
                
                outputTextarea.value = `=== JLMol Julia Calculation ===\nTimestamp: ${new Date().toISOString()}\nJulia command: ${juliaCommand}\nTemporary file: ${tempFile}\n${isWSL ? `WSL path: ${filePathForCommand}\n` : ''}Full command: ${juliaCommand} "${filePathForCommand}"\n\n--- Starting calculation ---\n`;
                document.getElementById('status').innerHTML = 'Starting Julia process...';
                
                // Prepare command and arguments for version check
                let baseCommand, versionCheckArgs;
                if (isWSL) {
                    baseCommand = 'wsl';
                    // The command is something like "wsl -d <distro> julia" or "wsl /path/to/julia"
                    // commandParts[0] is "wsl", the rest are arguments for wsl.
                    versionCheckArgs = [...commandParts.slice(1), '--version'];
                } else if (commandParts.length > 1) {
                    baseCommand = commandParts[0];
                    versionCheckArgs = [...commandParts.slice(1), '--version'];
                } else {
                    baseCommand = juliaCommand;
                    versionCheckArgs = ['--version'];
                }
                
                // Check if Julia is available first
                const juliaCheck = spawn(baseCommand, versionCheckArgs, { 
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: isWSL ? false : true
                });
                
                juliaCheck.on('error', (error) => {
                    throw new Error(`Julia not found at "${juliaCommand}": ${error.message}\n\nPlease check your Julia command in Settings or install Julia and ensure it's accessible from command line.`);
                });
                
                juliaCheck.on('close', (code) => {
                    if (code !== 0) {
                        throw new Error(`Julia version check failed with code ${code} for command "${juliaCommand}"`);
                    }
                    
                    // Julia is available, proceed with calculation
                    document.getElementById('status').innerHTML = 'Julia found, executing calculation...';
                    
                    // Prepare arguments for actual execution
                    let execArgs;
                    if (isWSL) {
                        // The command is something like "wsl -d <distro> julia" or "wsl julia"
                        // commandParts[0] is "wsl", the rest are arguments for wsl.
                        execArgs = [...commandParts.slice(1), filePathForCommand];
                    } else if (commandParts.length > 1) {
                        execArgs = [...commandParts.slice(1), tempFile];
                    } else {
                        execArgs = [tempFile];
                    }
                    
                    const juliaProcess = spawn(baseCommand, execArgs, {
                        cwd: process.cwd(),
                        stdio: ['pipe', 'pipe', 'pipe'],
                        timeout: 300000, // 5 minute timeout
                        shell: isWSL ? false : true
                    });
                    
                    let output = '';
                    let errorOutput = '';
                    let startTime = Date.now();
                    let outputBuffer = '';
                    let lastUpdateTime = Date.now();
                    
                    // Function to update UI with buffered output (throttled)
                    function updateOutput() {
                        if (outputBuffer.length > 0) {
                            outputTextarea.value += outputBuffer;
                            outputBuffer = '';
                            outputTextarea.scrollTop = outputTextarea.scrollHeight;
                        }
                    }
                    
                    juliaProcess.stdout.on('data', (data) => {
                        const text = data.toString();
                        output += text;
                        outputBuffer += text;
                        
                        // Update UI every 100ms to prevent freezing
                        const now = Date.now();
                        if (now - lastUpdateTime > 100) {
                            updateOutput();
                            lastUpdateTime = now;
                            
                            // Update status with progress indication
                            const elapsed = ((now - startTime) / 1000).toFixed(1);
                            document.getElementById('status').innerHTML = `Calculation running... (${elapsed}s)`;
                        }
                    });
                    
                    juliaProcess.stderr.on('data', (data) => {
                        const text = data.toString();
                        errorOutput += text;
                        
                        // Only show actual errors in STDERR, not just warnings
                        if (text.toLowerCase().includes('error') || text.toLowerCase().includes('exception')) {
                            outputTextarea.value += `\n[ERROR] ${text}`;
                        } else {
                            outputTextarea.value += `[INFO] ${text}`;
                        }
                        outputTextarea.scrollTop = outputTextarea.scrollHeight;
                    });
                    
                    juliaProcess.on('close', (code) => {
                        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                        
                        // Clean up temporary file
                        cleanupTempFile();
                        outputTextarea.value += `\n--- Cleanup: Temporary file deleted ---\n`;
                        
                        if (code === 0) {
                            outputTextarea.value += `\n=== CALCULATION COMPLETED SUCCESSFULLY ===\nElapsed time: ${elapsed} seconds\nExit code: ${code}`;
                            document.getElementById('status').innerHTML = `Julia calculation completed successfully (${elapsed}s)`;
                        } else {
                            outputTextarea.value += `\n=== CALCULATION FAILED ===\nElapsed time: ${elapsed} seconds\nExit code: ${code}\n\nCheck the output above for error details.`;
                            document.getElementById('status').innerHTML = `Julia calculation failed with exit code ${code}`;
                        }
                        outputTextarea.scrollTop = outputTextarea.scrollHeight;
                    });
                    
                    juliaProcess.on('error', (error) => {
                        // Clean up temporary file on error
                        cleanupTempFile();
                        
                        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                        outputTextarea.value += `\n=== PROCESS ERROR ===\nElapsed time: ${elapsed} seconds\nError: ${error.message}\n\nTroubleshooting:\n- Check if Julia is properly installed\n- Verify the Julia command path in Settings\n- Ensure Julia has necessary permissions`;
                        document.getElementById('status').innerHTML = `Julia process error: ${error.message}`;
                        outputTextarea.scrollTop = outputTextarea.scrollHeight;
                    });
                });
                
            } catch (error) {
                const isWSL = prefs.juliaCommand && prefs.juliaCommand.trim().toLowerCase().startsWith('wsl');
                const wslTroubleshooting = isWSL ? `\n\nWSL-specific troubleshooting:\n- Ensure WSL is installed and configured\n- Verify Julia is installed in your WSL distribution\n- Try running 'wsl julia --version' in Command Prompt/PowerShell\n- Make sure the WSL distribution has access to the temp directory\n- Consider using the full path to Julia in WSL (e.g., 'wsl /usr/local/bin/julia')` : '';
                
                outputTextarea.value = `=== EXECUTION ERROR ===\n${error.message}\n\nTroubleshooting:\n1. Install Julia from https://julialang.org/downloads/\n2. Add Julia to your system PATH or configure the correct path in Settings\n3. Current Julia command: "${prefs.juliaCommand}"\n4. Install ElemCo.jl package:\n   ${prefs.juliaCommand}> import Pkg; Pkg.add("ElemCo")\n5. Verify installation by running '${prefs.juliaCommand} --version' in terminal\n6. Ensure you have write permissions to temp directory${wslTroubleshooting}\n\nFor more help, see: https://docs.julialang.org/en/v1/manual/getting-started/`;
                document.getElementById('status').innerHTML = 'Julia execution failed - see output for troubleshooting';
            }
        }
        
        // Function to show instructions for browser environment
        function showJuliaInstructions(juliaCode) {
            const outputTextarea = document.getElementById('julia-output');
            
            outputTextarea.value = `=== JLMol Browser Mode ===
Running calculations directly from the browser is not supported for security reasons.

OPTION 1: Use the Desktop Version
Download and install the JLMol desktop application which includes integrated Julia execution.

OPTION 2: Manual Execution
Follow these steps to run the calculation manually:

1. Install Julia (if not already installed):
   Download from: https://julialang.org/downloads/

2. Install ElemCo.jl package:
   Open Julia and run:
   julia> import Pkg; Pkg.add("ElemCo")

3. Copy the generated code below and save it to a file (e.g., calculation.jl):

--- BEGIN JULIA CODE ---
${juliaCode}
--- END JULIA CODE ---

4. Run the calculation:
   From command line: julia calculation.jl
   Or from Julia REPL: include("calculation.jl")

5. The results will be displayed in your Julia terminal.

For detailed documentation, visit: https://elem.co.il

Note: The desktop version of JLMol provides seamless Julia integration
and eliminates the need for manual steps.`;

            document.getElementById('status').innerHTML = 'Manual execution instructions provided';
        }

        // Function to clear calculation output
        function clearJuliaOutput() {
            const outputTextarea = document.getElementById('julia-output');
            const outputSection = document.getElementById('julia-output-section');
            
            if (outputTextarea) {
                outputTextarea.value = '';
            }
            if (outputSection) {
                outputSection.style.display = 'none';
            }
            document.getElementById('status').innerHTML = 'Calculation output cleared';
        }

