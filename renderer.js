// Check version immediately when script loads
(function checkVersion(retryCount) {
    retryCount = retryCount || 0;
    const maxRetries = 50; // Max 5 seconds (50 * 100ms)

    const versionElement = document.getElementById('version-number');
    if (versionElement && window.appVersion) {
        versionElement.textContent = window.appVersion;
    } else if (retryCount < maxRetries) {
        // If element isn't ready yet or version not loaded, retry in 100ms
        setTimeout(() => checkVersion(retryCount + 1), 100);
    } else {
        // Give up after max retries, set fallback
        if (versionElement) {
            versionElement.textContent = 'unknown';
        }
        console.warn('Could not load version after', maxRetries, 'attempts');
    }
})();

// Note: the ElemCo / Julia / xtb panel handlers (showElemCoPanel, hideElemCoPanel,
// generateElemCoInput, copyElemCoInput, runJuliaCalculation, showXtbPanel, runXtb, …)
// are defined as globals in the js/ feature scripts (js/elemco.js, js/xtb.js), which
// load after this file. We do NOT redefine them here — earlier definitions would just
// be overridden, and the feature-script versions are authoritative.
//
// ElemCo panel initialization and its control listeners are owned by the builder:
// js/app-init.js (initializeApplication, on window load) and js/elemco.js
// (showElemCoPanel -> initElemCoPanel each time the panel opens). renderer.js no
// longer wires ElemCo controls, to avoid duplicate handlers and redundant re-inits.

// Wait for the window to load completely
window.addEventListener('load', () => {
    // Display version number
    const versionElement = document.getElementById('version-number');
    if (versionElement && window.appVersion) {
        versionElement.textContent = window.appVersion;
    }

    // Ensure JSME is properly initialized in Electron context
    if (window.jsmeOnLoad) {
        window.jsmeOnLoad();
    }
});
