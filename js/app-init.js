// Initialize ElemCo panel elements
function initElemCoPanel() {
    // Build the builder state (seeded from preferences) and wire the fixed
    // System & basis controls, then render the step list and generate the input.
    if (typeof initElemCoState === 'function') initElemCoState();
    if (typeof initializeElemCoListeners === 'function') initializeElemCoListeners();
    if (typeof syncElemCoControlsFromState === 'function') syncElemCoControlsFromState();
    if (typeof renderElemCoSteps === 'function') renderElemCoSteps();
    if (typeof renderGlobalChips === 'function') renderGlobalChips();
    if (typeof elcAttachJuliaHighlight === 'function') {
        const ta = document.getElementById('elemco-input');
        if (ta) elcAttachJuliaHighlight(ta);
    }
    updateElemCoInput();
}

// Add initialization to both window.onload and document.ready
if (typeof window !== 'undefined') {
    window.addEventListener('load', function() {
        // Use a proper initialization sequence with dependency checking
        initializeApplication();
    });
}

// Proper initialization function with dependency checking
function initializeApplication() {
    let initAttempts = 0;
    const maxAttempts = 20; // Allow up to 2 seconds (20 * 100ms)
    
    function attemptInit() {
        initAttempts++;
        
        // Check if required DOM elements exist
        const elemcoPanel = document.getElementById('elemcoPanel');
        const searchInput = document.getElementById('pubchemInput');
        
        if (elemcoPanel && searchInput) {
            // All required elements are available, proceed with initialization
            try {
                initElemCoPanel();
                updateInputPlaceholder();
                setupDatabaseInputHandlers();
                initPreferences();
                if (typeof initUpdateChecker === 'function') {
                    initUpdateChecker();
                }
                console.log('Application initialized successfully');
            } catch (error) {
                console.warn('Error during initialization:', error);
                // Retry if we haven't exceeded max attempts
                if (initAttempts < maxAttempts) {
                    setTimeout(attemptInit, 100);
                }
            }
        } else {
            // Required elements not ready yet, retry if we haven't exceeded max attempts
            if (initAttempts < maxAttempts) {
                setTimeout(attemptInit, 100);
            } else {
                console.warn('Application initialization failed: required DOM elements not found after', maxAttempts, 'attempts');
            }
        }
    }
    
    // Start initialization
    attemptInit();
}

