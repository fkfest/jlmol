        // Initialize ElemCo panel elements
        function initElemCoPanel() {
            // Clean up any existing elements first
            const dfLabel = document.querySelector('.df-toggle-label');
            if (dfLabel) {
                // Remove existing content to prevent memory leaks
                dfLabel.innerHTML = '';
                dfLabel.innerHTML = `
                    <input type="checkbox" id="elemco-df" onchange="updateMethodOptions()">
                    <span>Use DF</span>
                `;
            }

            // Initialize method options
            updateMethodOptions();

            // Update input text
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
        
