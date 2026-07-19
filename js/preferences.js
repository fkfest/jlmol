// User Preferences System - Core Functions
const DEFAULT_PREFERENCES = {
    // General settings
    theme: 'default',
    autoLoadLastMolecule: false,
    saveWindowPositions: true,
    showTooltips: true,
    confirmOverwrite: true,
    exportFormat: 'png',
    exportTransparentBackground: true,
    checkUpdatesOnStartup: true,
    
    // Display settings
    autoSpin: false,
    defaultDisplayMode: 'ball&stick',
    showLabels: false,
    bgColor: '#FFFFFF',
    antialiasing: true,
    zoomLevel: '100',
    
    // Advanced settings
    hardwareAcceleration: true,
    renderQuality: 'medium',
    memoryLimit: 2048,
    debugMode: false,
    detailedLogging: false,
    
    // ElemCo.jl settings
    defaultBasisSet: 'cc-pVDZ',
    defaultMethodMolecule: 'ccsd_t',
    defaultMethodFcidump: 'lambda_ccsd_t',
    juliaCommand: 'julia',
    calcTimeout: 5,
    useDF: false,
    autoClearOutput: true,
    saveOutput: false,

    // xtb (g-xTB) settings
    xtbCommand: 'xtb'
};

// Fill a default-method <select> with a leading "reference only" (HF) option and
// the grouped correlation methods from the ElemCo method registry.
function elcPopulateMethodPrefSelect(sel, refOnlyLabel) {
    if (!sel) return;
    sel.innerHTML = '';
    const none = document.createElement('option');
    none.value = 'HF';
    none.textContent = refOnlyLabel;
    sel.appendChild(none);
    ((typeof window !== 'undefined' && window.ELEMCO_CORRELATION_GROUPS) || []).forEach((g) => {
        const og = document.createElement('optgroup');
        og.label = g.group;
        g.methods.forEach((m) => {
            const o = document.createElement('option');
            o.value = m.id;
            o.textContent = m.label;
            og.appendChild(o);
        });
        sel.appendChild(og);
    });
}

// Switch between preference tabs
function switchPreferencesTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.preferences-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.preferences-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to clicked tab and corresponding content
    event.target.classList.add('active');
    document.getElementById(`preferences-${tabName}`).classList.add('active');
}

// Color picker handling
function openColorPicker(inputId) {
    document.getElementById(inputId).click();
}

function resetBackgroundColor() {
    const colorInput = document.getElementById('pref-bg-color');
    const colorPreview = document.getElementById('bg-color-preview');
    colorInput.value = '#FFFFFF';
    colorPreview.style.backgroundColor = '#FFFFFF';
    updateBackgroundColor('#FFFFFF');
}

function updateBackgroundColor(color) {
    if (jmolApplet0 && jmolApplet0._ready) {
        // Convert hex color to JSmol script format [xRRGGBB]
        const jsmolColor = '[x' + color.replace('#', '') + ']';
        Jmol.script(jmolApplet0, `background ${jsmolColor}`);
        console.log('Applied background color:', color, '->', jsmolColor);
        
        // Update the preference
        updatePreference('bgColor', color);
    }
}

// Enhanced preference loading and saving
function loadPreferencesIntoUI() {
    const prefs = getPreferences();
    
    // General settings
    const autoLoadCheckbox = document.getElementById('pref-auto-load');
    if (autoLoadCheckbox) autoLoadCheckbox.checked = prefs.autoLoadLastMolecule || false;
    
    const savePositionsCheckbox = document.getElementById('pref-save-positions');
    if (savePositionsCheckbox) savePositionsCheckbox.checked = prefs.saveWindowPositions !== false;
    
    const showTooltipsCheckbox = document.getElementById('pref-show-tooltips');
    if (showTooltipsCheckbox) showTooltipsCheckbox.checked = prefs.showTooltips !== false;
    
    const confirmOverwriteCheckbox = document.getElementById('pref-confirm-overwrite');
    if (confirmOverwriteCheckbox) confirmOverwriteCheckbox.checked = prefs.confirmOverwrite !== false;
    
    const exportFormatSelect = document.getElementById('pref-export-format');
    if (exportFormatSelect) exportFormatSelect.value = prefs.exportFormat || 'png';
    
    const exportTransparentCheckbox = document.getElementById('pref-export-transparent');
    if (exportTransparentCheckbox) exportTransparentCheckbox.checked = prefs.exportTransparentBackground !== false;

    const checkUpdatesCheckbox = document.getElementById('pref-check-updates');
    if (checkUpdatesCheckbox) checkUpdatesCheckbox.checked = prefs.checkUpdatesOnStartup !== false;

    // Clear any stale "Check for Updates" result from a previous time the panel was open.
    const updateResult = document.getElementById('update-check-result');
    if (updateResult) updateResult.textContent = '';

    // Display settings
    const autoSpinCheckbox = document.getElementById('pref-auto-spin');
    if (autoSpinCheckbox) autoSpinCheckbox.checked = prefs.autoSpin || false;
    
    const displayModeSelect = document.getElementById('pref-display-mode');
    if (displayModeSelect) {
        displayModeSelect.value = prefs.defaultDisplayMode || 'ball&stick';
        
        // Add change listener for immediate display mode update
        displayModeSelect.addEventListener('change', function() {
            applyDisplayMode(this.value);
            updatePreference('defaultDisplayMode', this.value);
        });
    }
    
    const showLabelsCheckbox = document.getElementById('pref-show-labels');
    if (showLabelsCheckbox) {
        showLabelsCheckbox.checked = prefs.showLabels || false;
        
        // Add change listener for immediate label update
        showLabelsCheckbox.addEventListener('change', function() {
            applyAtomLabels(this.checked);
        });
    }
    
    const bgColorInput = document.getElementById('pref-bg-color');
    const bgColorPreview = document.getElementById('bg-color-preview');
    if (bgColorInput && bgColorPreview) {
        bgColorInput.value = prefs.bgColor || '#FFFFFF';
        bgColorPreview.style.backgroundColor = prefs.bgColor || '#FFFFFF';
        
        // Add change listener for immediate background update
        bgColorInput.addEventListener('change', function() {
            bgColorPreview.style.backgroundColor = this.value;
            updateBackgroundColor(this.value);
        });
    }
    
    const antialiasingCheckbox = document.getElementById('pref-antialiasing');
    if (antialiasingCheckbox) {
        antialiasingCheckbox.checked = prefs.antialiasing !== false;
        
        // Add change listener for immediate antialiasing update
        antialiasingCheckbox.addEventListener('change', function() {
            if (jmolApplet0 && jmolApplet0._ready) {
                const antialiasingCmd = this.checked ? 'on' : 'off';
                Jmol.script(jmolApplet0, `set antialiasDisplay ${antialiasingCmd}`);
                updatePreference('antialiasing', this.checked);
            }
        });
    }
    
    const zoomLevelSelect = document.getElementById('pref-zoom-level');
    if (zoomLevelSelect) {
        zoomLevelSelect.value = prefs.zoomLevel || '100';
        
        // Add change listener for immediate zoom level update
        zoomLevelSelect.addEventListener('change', function() {
            applyZoomLevel(this.value);
        });
    }
    
    // Advanced settings
    const hardwareAccelCheckbox = document.getElementById('pref-hardware-acceleration');
    if (hardwareAccelCheckbox) hardwareAccelCheckbox.checked = prefs.hardwareAcceleration !== false;
    
    const renderQualitySelect = document.getElementById('pref-render-quality');
    if (renderQualitySelect) renderQualitySelect.value = prefs.renderQuality || 'medium';
    
    const memoryLimitInput = document.getElementById('pref-memory-limit');
    if (memoryLimitInput) memoryLimitInput.value = prefs.memoryLimit || 2048;
    
    const debugModeCheckbox = document.getElementById('pref-debug-mode');
    if (debugModeCheckbox) debugModeCheckbox.checked = prefs.debugMode || false;
    
    const detailedLoggingCheckbox = document.getElementById('pref-detailed-logging');
    if (detailedLoggingCheckbox) detailedLoggingCheckbox.checked = prefs.detailedLogging || false;
    
    // ElemCo.jl settings
    const basisSetSelect = document.getElementById('pref-basis-set');
    if (basisSetSelect) basisSetSelect.value = prefs.defaultBasisSet || 'cc-pVDZ';
    
    const molMethodSelect = document.getElementById('pref-method-molecule');
    const fciMethodSelect = document.getElementById('pref-method-fcidump');
    elcPopulateMethodPrefSelect(molMethodSelect, 'HF (reference only)');
    elcPopulateMethodPrefSelect(fciMethodSelect, 'BO-HF (reference only)');
    if (molMethodSelect) molMethodSelect.value = prefs.defaultMethodMolecule || 'ccsd_t';
    if (fciMethodSelect) fciMethodSelect.value = prefs.defaultMethodFcidump || 'lambda_ccsd_t';
    
    const juliaCommandInput = document.getElementById('pref-julia-command');
    if (juliaCommandInput) juliaCommandInput.value = prefs.juliaCommand || 'julia';

    const calcTimeoutInput = document.getElementById('pref-calc-timeout');
    if (calcTimeoutInput) calcTimeoutInput.value = prefs.calcTimeout || 5;

    // xtb settings
    const xtbCommandInput = document.getElementById('pref-xtb-command');
    if (xtbCommandInput) xtbCommandInput.value = prefs.xtbCommand || 'xtb';
    
    const useDFCheckbox = document.getElementById('pref-use-df');
    if (useDFCheckbox) useDFCheckbox.checked = prefs.useDF || false;
    
    const autoClearOutputCheckbox = document.getElementById('pref-auto-clear-output');
    if (autoClearOutputCheckbox) autoClearOutputCheckbox.checked = prefs.autoClearOutput !== false;
    
    const saveOutputCheckbox = document.getElementById('pref-save-output');
    if (saveOutputCheckbox) saveOutputCheckbox.checked = prefs.saveOutput || false;
}

// Save preferences from UI - enhanced version
function savePreferencesFromUI() {
    const prefs = getPreferences();
    
    // General settings
    const autoLoadCheckbox = document.getElementById('pref-auto-load');
    if (autoLoadCheckbox) prefs.autoLoadLastMolecule = autoLoadCheckbox.checked;
    
    const savePositionsCheckbox = document.getElementById('pref-save-positions');
    if (savePositionsCheckbox) prefs.saveWindowPositions = savePositionsCheckbox.checked;
    
    const showTooltipsCheckbox = document.getElementById('pref-show-tooltips');
    if (showTooltipsCheckbox) prefs.showTooltips = showTooltipsCheckbox.checked;
    
    const confirmOverwriteCheckbox = document.getElementById('pref-confirm-overwrite');
    if (confirmOverwriteCheckbox) prefs.confirmOverwrite = confirmOverwriteCheckbox.checked;
    
    const exportFormatSelect = document.getElementById('pref-export-format');
    if (exportFormatSelect) prefs.exportFormat = exportFormatSelect.value;
    
    const exportTransparentCheckbox = document.getElementById('pref-export-transparent');
    if (exportTransparentCheckbox) prefs.exportTransparentBackground = exportTransparentCheckbox.checked;

    const checkUpdatesCheckbox = document.getElementById('pref-check-updates');
    if (checkUpdatesCheckbox) prefs.checkUpdatesOnStartup = checkUpdatesCheckbox.checked;

    // Display settings
    const autoSpinCheckbox = document.getElementById('pref-auto-spin');
    if (autoSpinCheckbox) prefs.autoSpin = autoSpinCheckbox.checked;
    
    const displayModeSelect = document.getElementById('pref-display-mode');
    if (displayModeSelect) prefs.defaultDisplayMode = displayModeSelect.value;
    
    const showLabelsCheckbox = document.getElementById('pref-show-labels');
    if (showLabelsCheckbox) prefs.showLabels = showLabelsCheckbox.checked;
    
    const bgColorInput = document.getElementById('pref-bg-color');
    if (bgColorInput) prefs.bgColor = bgColorInput.value;
    
    const antialiasingCheckbox = document.getElementById('pref-antialiasing');
    if (antialiasingCheckbox) prefs.antialiasing = antialiasingCheckbox.checked;
    
    const zoomLevelSelect = document.getElementById('pref-zoom-level');
    if (zoomLevelSelect) prefs.zoomLevel = zoomLevelSelect.value;
    
    // Advanced settings
    const hardwareAccelCheckbox = document.getElementById('pref-hardware-acceleration');
    if (hardwareAccelCheckbox) prefs.hardwareAcceleration = hardwareAccelCheckbox.checked;
    
    const renderQualitySelect = document.getElementById('pref-render-quality');
    if (renderQualitySelect) prefs.renderQuality = renderQualitySelect.value;
    
    const memoryLimitInput = document.getElementById('pref-memory-limit');
    if (memoryLimitInput) prefs.memoryLimit = parseInt(memoryLimitInput.value) || 2048;
    
    const debugModeCheckbox = document.getElementById('pref-debug-mode');
    if (debugModeCheckbox) {
        prefs.debugMode = debugModeCheckbox.checked;
        window.jlmolDebug = debugModeCheckbox.checked; // Apply immediately
    }
    
    const detailedLoggingCheckbox = document.getElementById('pref-detailed-logging');
    if (detailedLoggingCheckbox) prefs.detailedLogging = detailedLoggingCheckbox.checked;
    
    // ElemCo.jl settings
    const basisSetSelect = document.getElementById('pref-basis-set');
    if (basisSetSelect) prefs.defaultBasisSet = basisSetSelect.value;
    
    const molMethodSelect = document.getElementById('pref-method-molecule');
    if (molMethodSelect) prefs.defaultMethodMolecule = molMethodSelect.value;
    const fciMethodSelect = document.getElementById('pref-method-fcidump');
    if (fciMethodSelect) prefs.defaultMethodFcidump = fciMethodSelect.value;
    
    const juliaCommandInput = document.getElementById('pref-julia-command');
    if (juliaCommandInput) prefs.juliaCommand = juliaCommandInput.value.trim() || 'julia';

    const calcTimeoutInput = document.getElementById('pref-calc-timeout');
    if (calcTimeoutInput) prefs.calcTimeout = parseInt(calcTimeoutInput.value) || 5;

    // xtb settings
    const xtbCommandInput = document.getElementById('pref-xtb-command');
    if (xtbCommandInput) prefs.xtbCommand = xtbCommandInput.value.trim() || 'xtb';
    
    const useDFCheckbox = document.getElementById('pref-use-df');
    if (useDFCheckbox) prefs.useDF = useDFCheckbox.checked;
    
    const autoClearOutputCheckbox = document.getElementById('pref-auto-clear-output');
    if (autoClearOutputCheckbox) prefs.autoClearOutput = autoClearOutputCheckbox.checked;
    
    const saveOutputCheckbox = document.getElementById('pref-save-output');
    if (saveOutputCheckbox) prefs.saveOutput = saveOutputCheckbox.checked;
    
    // Save to storage
    window.userPreferences = prefs;
    savePreferences(prefs);
    
    // Apply preferences immediately
    applyPreferences();
    
    // Hide panel after saving
    hidePreferencesPanel();
}

// Enhanced apply preferences function
function applyPreferences() {
    const prefs = getPreferences();
    
    // Apply auto-spin preference if enabled
    if (prefs.autoSpin && !isSpinning) {
        toggleSpin();
    }
    
    // Apply background color
    if (prefs.bgColor && jmolApplet0 && jmolApplet0._ready) {
        updateBackgroundColor(prefs.bgColor);
    }
    
    // Apply debug mode
    window.jlmolDebug = prefs.debugMode || false;
    
    // Apply display mode if set
    if (prefs.defaultDisplayMode) {
        try {
            if (displayMode !== prefs.defaultDisplayMode) {
                console.log('Applying preferred display mode:', prefs.defaultDisplayMode);
            }
        } catch (e) {
            console.warn('Could not apply display mode preference:', e);
        }
    }
    
    // Apply the default basis set to the ElemCo builder state. The default
    // method only seeds the initial steps (in initElemCoState), so it is not
    // re-applied here — that would clobber steps the user has built.
    try {
        if (typeof syncElemCoBasisFromPrefs === 'function') {
            syncElemCoBasisFromPrefs();
        }
    } catch (e) {
        console.warn('Could not apply ElemCo preferences:', e);
    }
}

// Load preferences from localStorage
function loadPreferences() {
    try {
        const saved = localStorage.getItem('jlmol-preferences');
        if (saved) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.warn('Error loading preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
}

// Save preferences to localStorage
function savePreferences(preferences) {
    try {
        localStorage.setItem('jlmol-preferences', JSON.stringify(preferences));
        document.getElementById('status').innerHTML = 'Preferences saved';
        return true;
    } catch (error) {
        console.error('Error saving preferences:', error);
        document.getElementById('status').innerHTML = 'Error saving preferences';
        return false;
    }
}

// Get current preferences
function getPreferences() {
    return window.userPreferences || loadPreferences();
}

// Apply JSmol-specific preferences to the viewer
function applyJSmolPreferences() {
    if (!jmolApplet0 || !jmolApplet0._ready) {
        console.log('JSmol not ready, skipping preference application');
        return;
    }
    
    const prefs = getPreferences();
    
    try {
        // Apply background color
        if (prefs.bgColor) {
            const jsmolColor = '[x' + prefs.bgColor.replace('#', '') + ']';
            Jmol.script(jmolApplet0, `background ${jsmolColor}`);
            console.log('Applied background color:', prefs.bgColor, '->', jsmolColor);
        }
        
        // Apply antialiasing
        if (prefs.antialiasing !== undefined) {
            const antialiasingCmd = prefs.antialiasing ? 'on' : 'off';
            Jmol.script(jmolApplet0, `set antialiasDisplay ${antialiasingCmd}`);
            console.log('Applied antialiasing:', prefs.antialiasing);
        }
        
        // Apply atom labels
        if (prefs.showLabels) {
            Jmol.script(jmolApplet0, 'label %e');
            console.log('Applied atom labels: ON');
        } else {
            Jmol.script(jmolApplet0, 'label off');
        }
        
        // Apply display mode
        if (prefs.defaultDisplayMode) {
            applyDisplayMode(prefs.defaultDisplayMode);
            console.log('Applied display mode:', prefs.defaultDisplayMode);
        }
        
        // Apply zoom level
        if (prefs.zoomLevel && prefs.zoomLevel !== '100') {
            const zoom = parseInt(prefs.zoomLevel);
            Jmol.script(jmolApplet0, `zoom ${zoom}`);
            console.log('Applied zoom level:', zoom);
        }
        
        // Apply auto-spin
        if (prefs.autoSpin && !isSpinning) {
            Jmol.script(jmolApplet0, 'spin on');
            isSpinning = true;
            console.log('Applied auto-spin: ON');
        }
        
    } catch (error) {
        console.error('Error applying JSmol preferences:', error);
    }
}

// Helper function to apply display mode
function applyDisplayMode(mode) {
    if (!jmolApplet0 || !jmolApplet0._ready) return;
    
    try {
        switch (mode) {
            case 'wireframe':
                Jmol.script(jmolApplet0, 'wireframe only');
                break;
            case 'ball&stick':
                Jmol.script(jmolApplet0, 'wireframe 0.15; spacefill 20%');
                break;
            case 'spacefill':
                Jmol.script(jmolApplet0, 'spacefill only');
                break;
            default:
                Jmol.script(jmolApplet0, 'wireframe 0.15; spacefill 20%');
        }
        displayMode = mode;
    } catch (error) {
        console.error('Error applying display mode:', error);
    }
}

// Helper function to apply zoom level
function applyZoomLevel(zoomLevel) {
    if (!jmolApplet0 || !jmolApplet0._ready) return;
    
    try {
        const zoom = parseInt(zoomLevel);
        Jmol.script(jmolApplet0, `zoom ${zoom}`);
        updatePreference('zoomLevel', zoomLevel);
    } catch (error) {
        console.error('Error applying zoom level:', error);
    }
}

// Helper function to apply atom labels
function applyAtomLabels(showLabels) {
    if (!jmolApplet0 || !jmolApplet0._ready) return;
    
    try {
        if (showLabels) {
            Jmol.script(jmolApplet0, 'label %e');
        } else {
            Jmol.script(jmolApplet0, 'label off');
        }
        updatePreference('showLabels', showLabels);
    } catch (error) {
        console.error('Error applying atom labels:', error);
    }
}

// Update a specific preference
function updatePreference(key, value) {
    const preferences = getPreferences();
    preferences[key] = value;
    window.userPreferences = preferences;
    savePreferences(preferences);
}

// Initialize preferences
function initPreferences() {
    // Load preferences
    window.userPreferences = loadPreferences();
    
    // Apply preferences
    applyPreferences();
    
    console.log('User preferences initialized');
}

// Convert the always-visible per-option descriptions into hover help (an ⓘ icon
// next to the label, description as its tooltip) so preference rows stay compact.
// Standalone notes and dynamic result messages (no label) are left visible. Once.
function elcCompactPreferenceDescriptions() {
    const panel = document.getElementById('preferencesPanel');
    if (!panel || panel._descsCompacted) return;
    panel._descsCompacted = true;
    panel.querySelectorAll('.preference-item').forEach((item) => {
        const desc = item.querySelector('.preference-description');
        const label = item.querySelector('.preference-label, .preference-checkbox-label');
        if (!desc || !label) return;
        const text = desc.textContent.trim();
        if (!text) return;
        const info = document.createElement('span');
        info.className = 'preference-help';
        info.textContent = 'ⓘ';
        info.title = text;
        label.appendChild(info);
        desc.style.display = 'none';
    });
}

// Show preferences panel
function showPreferencesPanel() {
    const panel = document.getElementById('preferencesPanel');
    if (panel) {
        panel.style.display = 'block';
        // Reset transform to avoid it appearing in a strange location if previously dragged
        panel.style.transform = 'translate(0px, 0px)';
        loadPreferencesIntoUI();
        elcCompactPreferenceDescriptions();
    }
}

// Hide preferences panel
function hidePreferencesPanel() {
    const panel = document.getElementById('preferencesPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Reset preferences to defaults
function resetPreferencesToDefaults() {
    if (confirm('Reset all preferences to default values?')) {
        window.userPreferences = { ...DEFAULT_PREFERENCES };
        savePreferences(window.userPreferences);
        loadPreferencesIntoUI();
        applyPreferences();
        document.getElementById('status').innerHTML = 'Preferences reset to defaults';
    }
}
