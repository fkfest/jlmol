        var jsmeApplet;
        var is3D = true;
        var lastMolFile = null;

        // JSME initialization and conversion functions
        function convertJsmolToJSME(callback) {
            try {
                debugLog('Starting JSmol to JSME conversion');
                
                // Ensure we're working with the latest structure data
                Jmol.script(jmolApplet0, 'select all; set atomNameFormat user');
                
                // First try to get a 2D MOL file
                let molData = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                
                debugLog('Initial MOL data length:', molData ? molData.length : 0);
                
                // If we got valid MOL data, try to clean it up
                if (molData && molData.includes('V2000')) {
                    // Ensure proper line endings
                    molData = molData.replace(/\r?\n/g, '\n');
                    
                    // Add implicit hydrogens and clean up structure
                    Jmol.script(jmolApplet0, 'select all; set addHydrogens true');
                    let cleanMolData = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                    
                    // Use the cleaned version if it's valid
                    if (cleanMolData && cleanMolData.includes('V2000')) {
                        molData = cleanMolData;
                        debugLog('Using cleaned MOL data, length:', molData.length);
                    }
                    
                    callback(molData);
                } else {
                    console.error('Failed to get valid MOL data from JSmol');
                    document.getElementById('status').innerHTML = 'Error: Could not convert 3D structure to 2D';
                    debugLog('Conversion failed - no valid MOL data');
                }
            } catch (e) {
                console.error('Error converting JSmol to JSME:', e);
                document.getElementById('status').innerHTML = 'Error converting structure';
                debugLog('Conversion error:', e.message);
            }
        }

        function initJSME(container, width, height, molFile = null) {
            // Create new JSME instance with explicit size
            const jsmeInstance = new JSApplet.JSME(container, width + "px", height + "px", {
                "options": "oldlook,star"
            });

            // Define structure change handler
            const handleStructureChange = function() {
                if (jsmeInstance && typeof jsmeInstance.molFile === 'function' && !is3D) {
                    const currentMol = jsmeInstance.molFile();
                    if (currentMol && currentMol.includes('V2000')) {
                        lastMolFile = currentMol;
                        // Directly load into JSmol in background
                        Jmol.script(jmolApplet0, `set echo top left; echo "2D structure modified"`);
                        Jmol.script(jmolApplet0, `load inline "${currentMol}" background`);
                    }
                }
            };

            // Add direct event listener for structure changes
            jsmeInstance.options.onChange = handleStructureChange;
            
            // Store handler for cleanup
            jsmeInstance._changeHandler = handleStructureChange;

            // Load initial molecule if provided
            if (molFile && typeof jsmeInstance.readMolFile === 'function') {
                setTimeout(() => {
                    jsmeInstance.readMolFile(molFile);
                    // Store initial state
                    lastMolFile = jsmeInstance.molFile();
                }, 100);
            }

            return jsmeInstance;
        }

        // Cleanup function for JSME with better resource management
        function cleanupJSME() {
            if (jsmeApplet) {
                try {
                    if (jsmeApplet.options) {
                        jsmeApplet.options.onChange = null;
                    }
                    if (jsmeApplet._changeHandler) {
                        delete jsmeApplet._changeHandler;
                    }
                    // More thorough cleanup
                    if (typeof jsmeApplet.destroy === 'function') {
                        jsmeApplet.destroy();
                    }
                } catch (e) {
                    console.error('Error cleaning up JSME:', e);
                }
                
                // Clear the container
                const container = document.getElementById('jsmeContainer');
                if (container) {
                    container.innerHTML = '';
                }
                jsmeApplet = null;
            }
        }

        // Utility function to refresh JSME editor with current JSmol structure
        function refreshJSMEFromJSmol() {
            if (!is3D && jsmeApplet) {
                debugLog('Refreshing JSME editor with current JSmol structure');
                convertJsmolToJSME(molFile => {
                    if (molFile && jsmeApplet && typeof jsmeApplet.readMolFile === 'function') {
                        jsmeApplet.readMolFile(molFile);
                        lastMolFile = molFile;
                        debugLog('JSME editor refreshed with new structure data');
                    }
                });
            }
        }

        // Update toggle2D3D function
        function toggle2D3D() {
            // Check if there's a molecule loaded by getting XYZ data
            const xyzData = Jmol.evaluateVar(jmolApplet0, 'write("xyz")');
            const atomCount = xyzData ? parseInt(xyzData.split('\n')[0]) : 0;

            // If we're in 3D mode and there's no structure, just switch to 2D with empty editor
            if (is3D && atomCount === 0) {
                is3D = false;
                const viewer = document.getElementById('viewer');
                const jsmeContainer = document.getElementById('jsmeContainer');
                const button = document.getElementById('toggle2D3DButton');
                
                cleanupJSME();
                jsmeContainer.style.display = 'block';
                viewer.style.display = 'none';
                button.textContent = '3D Viewer';
                
                const width = jsmeContainer.offsetWidth;
                const height = jsmeContainer.offsetHeight;
                if (width > 0 && height > 0) {
                    jsmeApplet = initJSME("jsmeContainer", width, height);
                }
                return;
            }

            is3D = !is3D;
            const viewer = document.getElementById('viewer');
            const jsmeContainer = document.getElementById('jsmeContainer');
            const button = document.getElementById('toggle2D3DButton');

            if (is3D) {
                // Switch to 3D (JSmol)
                if (jsmeApplet && typeof jsmeApplet.molFile === 'function') {
                    let molFile = jsmeApplet.molFile();
                    if (molFile) {
                        cleanupJSME(); // Cleanup old JSME instance
                        jsmeContainer.style.display = 'none';
                        viewer.style.display = 'block';
                        
                        // Get dimensions before switching
                        const width = viewer.offsetWidth;
                        const height = viewer.offsetHeight;
                        
                        setTimeout(() => {
                            // Set canvas dimensions
                            const canvas = document.querySelector('#viewer-inner canvas');
                            if (canvas) {
                                canvas.style.width = width + 'px';
                                canvas.style.height = height + 'px';
                                canvas.width = width;
                                canvas.height = height;
                            }
                            
                            // Load the structure and optimize
                            lastMolFile = molFile;
                            Jmol.script(jmolApplet0, `load inline "${molFile}"; select all; minimize`);
                            
                            // Restore the last used display mode
                            setTimeout(() => {
                                setDisplayMode(displayMode || 'default');
                                
                                // Apply all JSmol preferences after 2D to 3D conversion
                                if (typeof applyJSmolPreferences === 'function') {
                                    applyJSmolPreferences();
                                    console.log('toggle2D3D: Applied JSmol preferences after 2D to 3D conversion');
                                }
                                
                                if (width > 0 && height > 0) {
                                    Jmol.resizeApplet(jmolApplet0, [width, height]);
                                }
                                document.getElementById('status').innerHTML = '3D structure generated successfully';
                            }, 100);
                        }, 100);
                    }
                }
            } else {
                // Switch to 2D (JSME) - only try to convert if there's a structure
                if (atomCount > 0) {
                    // Force refresh of JSmol structure to get latest data
                    Jmol.script(jmolApplet0, 'select all; refresh');
                    
                    // Always perform fresh conversion from current JSmol state
                    convertJsmolToJSME(molFile => {
                        debugLog('Converting to 2D with fresh MOL data length:', molFile ? molFile.length : 0);
                        
                        viewer.style.display = 'none';
                        jsmeContainer.style.display = 'block';
                        jsmeContainer.innerHTML = ''; // Clear old instance
                        
                        setTimeout(() => {
                            const width = jsmeContainer.offsetWidth;
                            const height = jsmeContainer.offsetHeight;
                            
                            if (width > 0 && height > 0) {
                                lastMolFile = molFile;
                                jsmeApplet = initJSME("jsmeContainer", width, height, molFile);
                                debugLog('JSME editor initialized with structure data');
                            }
                        }, 150);
                    });
                } else {
                    // No structure in JSmol, just show empty 2D editor
                    viewer.style.display = 'none';
                    jsmeContainer.style.display = 'block';
                    jsmeContainer.innerHTML = ''; // Clear old instance
                    
                    const width = jsmeContainer.offsetWidth;
                    const height = jsmeContainer.offsetHeight;
                    if (width > 0 && height > 0) {
                        jsmeApplet = initJSME("jsmeContainer", width, height);
                    }
                }
            }
            
            button.textContent = is3D ? '2D Editor' : '3D Viewer';
        }

        // Update window.jsmeOnLoad to use the new initJSME function
        window.jsmeOnLoad = function() {
            // Add delay and multiple retries for Electron with proper dependency checking
            let attempts = 0;
            const maxAttempts = 10;
            
            function tryInitJSME() {
                attempts++;
                const container = document.getElementById('jsmeContainer');
                
                if (!container) {
                    if (attempts < maxAttempts) {
                        setTimeout(tryInitJSME, 250);
                    }
                    return;
                }
                
                const width = container.offsetWidth;
                const height = container.offsetHeight;
                
                if (width > 0 && height > 0 && typeof JSApplet !== 'undefined' && JSApplet.JSME) {
                    try {
                        jsmeApplet = initJSME("jsmeContainer", width, height);
                        console.log("JSME initialized successfully");
                    } catch (e) {
                        console.error("JSME init error:", e);
                        if (attempts < maxAttempts) {
                            setTimeout(tryInitJSME, 250);
                        }
                    }
                } else {
                    if (attempts < maxAttempts) {
                        setTimeout(tryInitJSME, 250);
                    } else {
                        console.warn('JSME initialization failed: container not ready or JSApplet not loaded after', maxAttempts, 'attempts');
                    }
                }
            }

            // Initial delay for Electron to ensure DOM is ready
            tryInitJSME();
        };

