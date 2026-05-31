        // Add variable to store XYZ data
        var lastXYZData = null;
        var originalAtomNames = null; // Store original numbered atom names
        var originalXYZContent = null; // Store original XYZ file content
        var shouldUseNumberedAtoms = false; // Flag to track if numbered atoms should be used (only for XYZ files)
        
        // Debug function to test MOL file export quality - call from console with: window.testMolExport()
        window.testMolExport = function() {
            console.log('=== MOL Export Test ===');
            if (jmolApplet0 && jmolApplet0._ready) {
                try {
                    const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
                    console.log('Atom count:', atomCount);
                    
                    if (atomCount > 0) {
                        console.log('Testing MOL export before refreshAtomNames...');
                        const molBefore = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                        console.log('MOL before - length:', molBefore ? molBefore.length : 'null');
                        console.log('MOL before - valid:', !!(molBefore && molBefore.includes('V2000')));
                        
                        console.log('Calling refreshAtomNames...');
                        refreshAtomNames();
                        
                        console.log('Testing MOL export after refreshAtomNames...');
                        const molAfter = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                        console.log('MOL after - length:', molAfter ? molAfter.length : 'null');
                        console.log('MOL after - valid:', !!(molAfter && molAfter.includes('V2000')));
                        
                        console.log('MOL data changed:', molBefore !== molAfter);
                        
                        if (molBefore !== molAfter) {
                            console.log('=== MOL DATA CHANGED! ===');
                            console.log('Before preview:', molBefore ? molBefore.substring(0, 200) : 'null');
                            console.log('After preview:', molAfter ? molAfter.substring(0, 200) : 'null');
                        }
                    }
                } catch (e) {
                    console.error('Error in MOL export test:', e);
                }
            } else {
                console.log('JSmol not ready');
            }
            console.log('=== End MOL Export Test ===');
        };
        
        // Utility function to manage atom names consistently
        function setOriginalAtomNames(names) {
            originalAtomNames = names;
            window.originalAtomNames = names; // Make sure it's accessible globally
        }
        
        function clearOriginalAtomNames() {
            originalAtomNames = null;
            window.originalAtomNames = null;
        }
        
        // Debug utility function
        function debugLog(category, message, data = null) {
            if (window.jlmolDebug) {
                const timestamp = new Date().toISOString().substr(14, 9);
                console.log(`[${timestamp}] ${category}: ${message}`, data ? data : '');
            }
        }
        
        // Add frame rate limiting to prevent excessive GPU usage
        var lastFrameTime = 0;
        var frameRateLimit = 60; // Max 60 FPS
        var minFrameInterval = 1000 / frameRateLimit;
        
        function throttledRepaint(callback) {
            var now = Date.now();
            if (now - lastFrameTime >= minFrameInterval) {
                lastFrameTime = now;
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }

        // Custom XYZ loader that preserves numbered atom names
        function loadXYZWithNumberedAtoms(xyzContent) {
            try {
                // Parse the XYZ content to extract atom names
                const lines = xyzContent.trim().split('\n');
                if (lines.length < 3) {
                    throw new Error('Invalid XYZ format');
                }
                
                const atomCount = parseInt(lines[0]);
                if (isNaN(atomCount) || atomCount <= 0) {
                    throw new Error('Invalid atom count');
                }
                
                // Extract original atom names and prepare modified content
                const extractedNames = [];
                let modifiedXYZ = lines[0] + '\n' + lines[1] + '\n';
                let hasNumberedAtoms = false;
                
                for (let i = 2; i < atomCount + 2 && i < lines.length; i++) {
                    const parts = lines[i].trim().split(/\s+/);
                    if (parts.length >= 4) {
                        const originalName = parts[0];
                        let elementSymbol = originalName.replace(/\d+/g, ''); // Remove numbers for JSmol
                        
                        // Check if this atom name contains numbers (indicating numbered atoms)
                        if (originalName !== elementSymbol && /\d/.test(originalName)) {
                            hasNumberedAtoms = true;
                        }
                        
                        // Capitalize the first letter and make the rest lowercase for proper element recognition
                        if (elementSymbol.length > 0) {
                            elementSymbol = elementSymbol.charAt(0).toUpperCase() + elementSymbol.slice(1).toLowerCase();
                        }
                        
                        extractedNames.push(originalName);
                        modifiedXYZ += `${elementSymbol}  ${parts[1]}  ${parts[2]}  ${parts[3]}\n`;
                    }
                }
                
                // Store the original data
                setOriginalAtomNames(extractedNames);
                originalXYZContent = xyzContent;
                
                // Clear database metadata since this is not a database load
                window.databaseMetadata = null;
                
                // Set the flag to indicate numbered atoms should be used
                shouldUseNumberedAtoms = hasNumberedAtoms;
                console.log('loadXYZWithNumberedAtoms: Detected numbered atoms:', hasNumberedAtoms, 'Setting shouldUseNumberedAtoms to:', shouldUseNumberedAtoms);
                
                // Save current display mode
                const currentDisplayMode = displayMode || 'default';
                
                // Load the structure with element symbols only
                Jmol.script(jmolApplet0, `load inline "${modifiedXYZ}"`);
                
                // Apply original atom names after a short delay to ensure structure is loaded
                setTimeout(() => {
                    applyOriginalAtomNames();
                    // Also refresh atom names to ensure they're properly maintained
                    setTimeout(() => {
                        refreshAtomNames();
                        console.log('loadXYZWithNumberedAtoms: Atom names refreshed after loading');
                        
                        // Update MOL file data for JSME integration after structure loading
                        try {
                            lastMolFile = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                            debugLog('XYZ', 'Updated lastMolFile after loading XYZ with numbered atoms');
                        } catch (molError) {
                            console.error('Error updating MOL file data in loadXYZWithNumberedAtoms:', molError);
                        }
                        
                        // Restore display mode after everything is loaded
                        setTimeout(() => {
                            console.log('loadXYZWithNumberedAtoms: Restoring display mode:', currentDisplayMode);
                            setDisplayMode(currentDisplayMode);
                            
                            // Apply all JSmol preferences after loading
                            if (typeof applyJSmolPreferences === 'function') {
                                applyJSmolPreferences();
                                console.log('loadXYZWithNumberedAtoms: Applied JSmol preferences');
                            }
                        }, 100);
                    }, 100);
                }, 100);
                
            } catch (error) {
                console.error('Error loading XYZ with numbered atoms:', error);
                // Save current display mode
                const currentDisplayMode = displayMode || 'default';
                
                // Fallback to normal loading
                Jmol.script(jmolApplet0, `load inline "${xyzContent}"`);
                
                // Restore display mode after fallback loading
                setTimeout(() => {
                    console.log('loadXYZWithNumberedAtoms fallback: Restoring display mode:', currentDisplayMode);
                    setDisplayMode(currentDisplayMode);
                    
                    // Apply all JSmol preferences after fallback loading
                    if (typeof applyJSmolPreferences === 'function') {
                        applyJSmolPreferences();
                        console.log('loadXYZWithNumberedAtoms fallback: Applied JSmol preferences');
                    }
                }, 200);
            }
        }
        
        // Apply the original numbered atom names to the loaded structure
        function applyOriginalAtomNames() {
            if (!originalAtomNames) return;
            
            try {
                for (let i = 0; i < originalAtomNames.length; i++) {
                    const atomName = originalAtomNames[i];
                    Jmol.script(jmolApplet0, `{atomIndex=${i}}.atomName = "${atomName}"`);
                }
                document.getElementById('status').innerHTML = 'Structure loaded with preserved numbered atom names';
            } catch (error) {
                console.error('Error applying atom names:', error);
            }
        }

        // Function to refresh and maintain numbered atom names
        let refreshAtomNamesTimeout = null;
        let lastRefreshTime = 0;
        const REFRESH_THROTTLE_MS = 1000; // Don't refresh more than once per second
        
        function refreshAtomNames() {
            // Throttle the function to prevent excessive calls
            const now = Date.now();
            if (now - lastRefreshTime < REFRESH_THROTTLE_MS) {
                // Clear any pending refresh and schedule a new one
                if (refreshAtomNamesTimeout) {
                    clearTimeout(refreshAtomNamesTimeout);
                }
                refreshAtomNamesTimeout = setTimeout(() => {
                    refreshAtomNamesImmediate();
                    lastRefreshTime = Date.now();
                }, REFRESH_THROTTLE_MS - (now - lastRefreshTime));
                return false;
            }
            
            lastRefreshTime = now;
            return refreshAtomNamesImmediate();
        }
        
        function refreshAtomNamesImmediate() {
            console.log('refreshAtomNames: Starting atom name refresh');
            
            try {
                const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
                if (!atomCount || atomCount === 0) {
                    console.warn('refreshAtomNames: No atoms found');
                    return false;
                }
                
                // If we have preserved atom names, reapply them
                if (window.originalAtomNames && window.originalAtomNames.length === atomCount) {
                    console.log('refreshAtomNames: Reapplying preserved atom names');
                    for (let i = 0; i < atomCount; i++) {
                        const atomName = window.originalAtomNames[i];
                        Jmol.script(jmolApplet0, `{atomIndex=${i}}.atomName = "${atomName}"`);
                    }
                    return true;
                } else {
                    // Try to extract current atom names and preserve them if they look numbered
                    console.log('refreshAtomNames: Extracting current atom names');
                    const currentNames = [];
                    let hasNumberedNames = false;
                    
                    for (let i = 0; i < atomCount; i++) {
                        let atomName = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.atomName`);
                        if (!atomName || atomName === 'null' || atomName === '') {
                            const element = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.element`) || 'X';
                            // Only generate numbered names if the flag indicates we should
                            atomName = shouldUseNumberedAtoms ? (element + (i + 1)) : element;
                        } else if (!shouldUseNumberedAtoms && /^[A-Z][a-z]?\d+$/.test(atomName)) {
                            // Atom name has numbers but we don't want numbered atoms - extract just the element
                            const element = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.element`) || 'X';
                            atomName = element;
                        } else if (shouldUseNumberedAtoms && atomName.length <= 2 && !/\d/.test(atomName)) {
                            // Atom name is just element symbol but we want numbered atoms
                            atomName = atomName + (i + 1);
                        }
                        
                        currentNames.push(atomName);
                        
                        // Check if this looks like a numbered atom name (element + number)
                        if (/^[A-Z][a-z]?\d+$/.test(atomName)) {
                            hasNumberedNames = true;
                        }
                    }
                    
                    if (hasNumberedNames) {
                        console.log('refreshAtomNames: Found numbered names, preserving them');
                        setOriginalAtomNames(currentNames);
                        return true;
                    } else {
                        // Apply the corrected non-numbered names back to JSmol if needed
                        let needsUpdate = false;
                        for (let i = 0; i < atomCount; i++) {
                            const currentJSmolName = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.atomName`);
                            if (currentJSmolName !== currentNames[i]) {
                                needsUpdate = true;
                                break;
                            }
                        }
                        
                        if (needsUpdate) {
                            console.log('refreshAtomNames: Applying corrected non-numbered names to JSmol');
                            for (let i = 0; i < atomCount; i++) {
                                Jmol.script(jmolApplet0, `{atomIndex=${i}}.atomName = "${currentNames[i]}"`);
                            }
                        }
                        
                        // Store the corrected names
                        setOriginalAtomNames(currentNames);
                        return true;
                    }
                }
                
                return false;
            } catch (error) {
                console.error('refreshAtomNames: Error refreshing atom names:', error);
                return false;
            }
        }

        // Function to force a complete refresh of molecular data
        function forceRefreshMolecularData() {
            console.log('forceRefreshMolecularData: Starting complete molecular data refresh');
            
            try {
                // Refresh atom names first
                const atomNamesRefreshed = refreshAtomNames();
                console.log('forceRefreshMolecularData: Atom names refreshed:', atomNamesRefreshed);
                
                // Try to get fresh XYZ data using multiple approaches
                const xyzData = getXYZDataWithNumberedAtoms();
                console.log('forceRefreshMolecularData: XYZ data retrieved:', xyzData ? 'Success' : 'Failed');
                
                if (xyzData) {
                    console.log('forceRefreshMolecularData: XYZ data preview:', xyzData.substring(0, 200) + '...');
                    
                    // Update ElemCo input with fresh data
                    updateElemCoInput();
                    
                    return true;
                } else {
                    console.warn('forceRefreshMolecularData: Could not retrieve XYZ data');
                    return false;
                }
                
            } catch (error) {
                console.error('forceRefreshMolecularData: Error during refresh:', error);
                return false;
            }
        }

        // Add initialization with better error handling and cleanup
        $(document).ready(function() {
            try {
                console.log('Initializing JSmol...');
                console.log('User Agent:', navigator.userAgent);
                console.log('WebGL Support:', !!window.WebGLRenderingContext);
                console.log('Hardware Concurrency:', navigator.hardwareConcurrency);
                console.log('Memory:', navigator.deviceMemory || 'unknown');
                
                // Check for graphics capabilities
                if (window.WebGLRenderingContext) {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        console.log('WebGL Renderer:', gl.getParameter(gl.RENDERER));
                        console.log('WebGL Vendor:', gl.getParameter(gl.VENDOR));
                        console.log('WebGL Version:', gl.getParameter(gl.VERSION));
                    }
                }
                
                Jmol.setDocument(0);
                // Create inner container for JSmol
                $("#viewer").html('<div id="viewer-inner"></div>');
                $("#viewer-inner").html(Jmol.getAppletHtml("jmolApplet0", Info));
                initDraggable();
                initResizeObserver();
                
                // Add performance monitoring
                let frameCount = 0;
                let lastTime = performance.now();
                function monitorPerformance() {
                    frameCount++;
                    const currentTime = performance.now();
                    if (currentTime - lastTime >= 5000) { // Every 5 seconds
                        const fps = (frameCount * 1000) / (currentTime - lastTime);
                        console.log(`Performance: ${fps.toFixed(1)} FPS, Memory: ${(performance.memory?.usedJSHeapSize/1024/1024 || 0).toFixed(1)}MB`);
                        frameCount = 0;
                        lastTime = currentTime;
                    }
                    requestAnimationFrame(monitorPerformance);
                }
                if (window.performance && window.performance.memory) {
                    monitorPerformance();
                }
                
                // Add window focus/blur handling for resource management
                window.addEventListener('focus', function() {
                    // Resume any paused operations when window gains focus
                    if (jmolApplet0 && jmolApplet0._ready) {
                        throttledRepaint(() => {
                            // Minimal repaint on focus
                        });
                    }
                });
                
                window.addEventListener('blur', function() {
                    // Pause intensive operations when window loses focus
                    isSpinning = false;
                    if (jmolApplet0 && jmolApplet0._ready) {
                        try {
                            Jmol.script(jmolApplet0, 'spin off');
                            const spinButton = document.getElementById('spinButton');
                            if (spinButton) {
                                spinButton.textContent = 'Spin';
                            }
                        } catch (e) {
                            console.error('Error stopping spin on blur:', e);
                        }
                    }
                });

                // Initialize database input handlers with retry
                setTimeout(() => {
                    setupDatabaseInputHandlers();
                }, 100);
                
            } catch (e) {
                console.error('Error during initialization:', e);
                document.getElementById('status').innerHTML = 'Error during initialization: ' + e.message;
            }
        });

