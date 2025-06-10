// Check version immediately when script loads
(function checkVersion() {
    const versionElement = document.getElementById('version-number');
    if (versionElement && window.appVersion) {
        versionElement.textContent = window.appVersion;
    } else {
        // If element isn't ready yet or version not loaded, retry in 100ms
        setTimeout(checkVersion, 100);
    }
})();

function showElemCoPanel() {
    document.getElementById('elemcoPanel').style.display = 'block';
    updateElemCoInput(); // Remove initializeElemCoListeners call since we handle it in DOMContentLoaded
}

function hideElemCoPanel() {
    document.getElementById('elemcoPanel').style.display = 'none';
}

function generateElemCoInput() {
    updateElemCoInput();
    document.getElementById('status').innerHTML = 'ElemCo.jl input reset to default';
}

function copyElemCoInput() {
    const input = document.getElementById('elemco-input');
    input.select();
    document.execCommand('copy');
    document.getElementById('status').innerHTML = 'Input copied to clipboard';
}

// Add event listeners for input changes when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const method = document.getElementById('elemco-method');
    const aoBasis = document.getElementById('elemco-basis');
    const jkfitBasis = document.getElementById('elemco-jkfit');
    const mpfitBasis = document.getElementById('elemco-mpfit');
    const charge = document.getElementById('elemco-charge');
    const multiplicity = document.getElementById('elemco-multiplicity');
    const dfToggle = document.getElementById('elemco-df');

    // Add event listeners
    method?.addEventListener('change', updateElemCoInput);
    aoBasis?.addEventListener('change', updateElemCoInput);
    jkfitBasis?.addEventListener('change', updateElemCoInput);
    mpfitBasis?.addEventListener('change', updateElemCoInput);
    charge?.addEventListener('input', updateElemCoInput);
    multiplicity?.addEventListener('input', updateElemCoInput);
    dfToggle?.addEventListener('change', () => {
        updateMethodOptions();
        updateElemCoInput();
    });
});

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

    // Initialize ElemCo panel after a delay to ensure DOM is ready
    setTimeout(() => {
        if (typeof initElemCoPanel === 'function') {
            initElemCoPanel();
            initializeElemCoListeners();
        }
    }, 1000);

    // Re-initialize on visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && typeof initElemCoPanel === 'function') {
            initElemCoPanel();
            initializeElemCoListeners();
        }
    });
});

// Handle window resize events
window.addEventListener('resize', () => {
    // Reinitialize panels if they're visible
    const elemcoPanel = document.getElementById('elemcoPanel');
    if (elemcoPanel && elemcoPanel.style.display !== 'none') {
        if (typeof initElemCoPanel === 'function') {
            initElemCoPanel();
        }
    }
});