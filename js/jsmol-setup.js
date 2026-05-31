        var jmolApplet0;
        var isSpinning = false;
        var displayMode = 'default'; // Track current display mode
        var currentZoom = 100;
        var isDragMinimize = false; // Track drag-minimize state
        var Info = {
            width: "100%",
            height: "100%",
            debug: false,
            color: "0xFFFFFF",
            use: "HTML5",
            j2sPath: "jsmol/j2s",
            addSelectionOptions: true,
            serverURL: "https://jlmol.com/php/jsmol.php",
            disableJ2SLoadMonitor: true,
            disableInitialConsole: true,
            allowJavaScript: true,
            readyFunction: function(applet) {
                jmolApplet0._ready = true;
                console.log('JSmol initialization complete');
                
                // Set initial display mode after JSmol is ready
                setTimeout(() => {
                    if (displayMode === undefined || displayMode === null) {
                        displayMode = 'default';
                    }
                    console.log('JSmol ready: Setting initial display mode to', displayMode);
                    setDisplayMode(displayMode);
                    
                    // Apply JSmol preferences when ready
                    if (typeof applyJSmolPreferences === 'function') {
                        applyJSmolPreferences();
                    }
                    
                    // Initialize MOL file data if there's already a structure loaded
                    try {
                        const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
                        if (atomCount && atomCount > 0) {
                            lastMolFile = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                            debugLog('Init', 'Initialized lastMolFile on JSmol ready, length:', lastMolFile ? lastMolFile.length : 0);
                        }
                    } catch (initMolError) {
                        console.error('Error initializing MOL file data on JSmol ready:', initMolError);
                    }
                }, 500);
            },
            script: "set debugScript off; set antialiasDisplay; set zoomLarge false; set picking ON; set pickCallback 'onJmolAtomPicked'; set loadStructCallback 'onJmolStructureLoaded'"
        };

        /*
         * FIXES FOR ELEMCO.JL INTEGRATION WITH NUMBERED ATOMS
         * 
         * Problem: After using the XYZ editor with numbered atoms (N1, C2, C3, etc.), 
         * the ElemCo integration button shows "# Please load a molecule first" instead 
         * of generating proper Julia input code.
         * 
         * Root Cause: The getXYZDataWithNumberedAtoms() function was not properly 
         * handling the case where numbered atom names were used after XYZ editor operations.
         * 
         * Implemented Fixes:
         * 
         * 1. Enhanced getXYZDataWithNumberedAtoms() function:
         *    - Added comprehensive error handling and detailed logging
         *    - Implemented multiple fallback strategies (4 different approaches)
         *    - Added validation of coordinates and atom data at each step
         *    - Proper handling of window.originalAtomNames variable
         * 
         * 2. Improved updateElemCoInput() function:
         *    - Added detailed validation checks for XYZ data completeness
         *    - Enhanced error messages for different failure scenarios
         *    - Better logging for debugging molecular data issues
         *    - Validation of atom count vs actual data lines
         * 
         * 3. Updated showElemCoPanel() function:
         *    - Added multiple delayed molecular data refresh attempts
         *    - Integrated forceRefreshMolecularData() for comprehensive refresh
         *    - Enhanced diagnostic capabilities for troubleshooting
         *    - Better error reporting for different failure modes
         * 
         * 4. Added refreshAtomNames() function:
         *    - Maintains numbered atom names across operations
         *    - Detects and preserves numbered atom patterns
         *    - Reapplies atom names when needed
         * 
         * 5. Added forceRefreshMolecularData() function:
         *    - Comprehensive molecular data refresh capability
         *    - Combines atom name refresh with XYZ data retrieval
         *    - Enhanced debugging and diagnostic information
         * 
         * 6. Fixed variable scope issues:
         *    - Ensured originalAtomNames is accessible as window.originalAtomNames
         *    - Maintained consistency between local and global variables
         * 
         * 7. Enhanced XYZ editor integration:
         *    - updateStructure() now calls refreshAtomNames() after changes
         *    - loadXYZWithNumberedAtoms() maintains atom names properly
         *    - showXYZEditor() refreshes atom names before display
         * 
         * Test Workflow:
         * 1. Load a molecule with numbered atoms (e.g., caffeine with N1, C2, C3, etc.)
         * 2. Use the XYZ editor to modify coordinates
         * 3. Apply changes in the XYZ editor
         * 4. Open the ElemCo.jl integration panel
         * 5. Verify that proper Julia code is generated with numbered atom names
         */

