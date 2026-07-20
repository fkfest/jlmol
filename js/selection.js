// ===== Central atom selection state =====
// Single source of truth shared by the XYZ viewer, the 3D structure (JSmol
// picking) and the ElemCo input editor. Holds 0-based atom indices.
var selectedAtoms = new Set();

// Update any UI that reflects how many atoms are currently selected.
function updateSelectionUI() {
    const countEl = document.getElementById('selection-count');
    if (countEl) {
        const n = selectedAtoms.size;
        countEl.textContent = n > 0 ? `${n} selected` : '';
    }
    refreshEditHighlightsIfVisible();
}

// When the XYZ editor's text edit mode is open, keep its highlight overlay in
// sync with the current selection (e.g. atoms picked in the 3D structure).
function refreshEditHighlightsIfVisible() {
    const wrap = document.getElementById('xyz-edit-wrap');
    if (wrap && wrap.style.display !== 'none' && typeof renderXYZEditHighlights === 'function') {
        renderXYZEditHighlights();
    }
}

// ===== Selection halo color =====
// The 3D halo has no color of its own, so Jmol falls back to each atom's CPK
// element color — white for hydrogen, which is invisible on the default white
// background. Give the halo an explicit warm-gold color instead, with its
// lightness flipped to the far end from the background luminance so it always
// stays visible (a dark amber on light backgrounds, pale gold on dark ones).
function elcHexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function elcRgbToHex(r, g, b) {
    const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return h(r) + h(g) + h(b);
}

function elcHslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

// Jmol color literal ([xRRGGBB]) for the halo, given a background hex color.
function haloColorForBackground(bgHex) {
    const rgb = elcHexToRgb(bgHex) || { r: 255, g: 255, b: 255 };
    // WCAG relative luminance decides whether the background is light or dark.
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const Y = 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
    // Warm gold halo: a fixed amber hue so the selection always reads as gold,
    // with the lightness flipped to the far end from the background so it stays
    // clearly visible (dark amber on light backgrounds, pale gold on dark ones).
    const HALO_HUE = 48;   // degrees — gold/amber (pure yellow is 60)
    const HALO_SAT = 0.55;
    const l = Y > 0.5 ? 0.32 : 0.82;
    const out = elcHslToRgb(HALO_HUE, HALO_SAT, l);
    return '[x' + elcRgbToHex(out.r, out.g, out.b) + ']';
}

// Current halo color, derived from the user's background-color preference.
function currentHaloColor() {
    let bg = '#FFFFFF';
    try {
        const prefs = (typeof getPreferences === 'function') ? getPreferences() : null;
        if (prefs && prefs.bgColor) bg = prefs.bgColor;
    } catch (e) { /* fall back to white */ }
    return haloColorForBackground(bg);
}

// Turn the 3D halo on/off for a single atom (atomIndex is 0-based).
// Always restores the full selection afterwards: halo flags persist
// independently of the selection set, and leaving a partial selection
// behind would break features that read the geometry via write("xyz")
// (xtb, ElemCo), which only export the currently selected atoms.
function applyHaloForAtom(atomIndex, on) {
    try {
        const sel = `select atomno=${atomIndex + 1};`;
        const cmd = on
            ? `${sel} color halos ${currentHaloColor()}; halos on; select all`
            : `${sel} halos off; select all`;
        Jmol.script(jmolApplet0, cmd);
    } catch (e) {
        console.error('Error updating halo for atom', atomIndex, e);
    }
}

// Select or deselect an atom and keep every view in sync (state Set,
// XYZ-viewer row highlight, 3D halo, selection counter).
function setAtomSelected(atomIndex, selected) {
    if (selected) {
        selectedAtoms.add(atomIndex);
    } else {
        selectedAtoms.delete(atomIndex);
    }
    // Sync the matching XYZ-viewer row, if the viewer is rendered.
    const row = document.querySelector(`#xyz-content .xyz-row[data-atom-index="${atomIndex}"]`);
    if (row) row.classList.toggle('selected', selected);
    // Sync the 3D structure halo.
    applyHaloForAtom(atomIndex, selected);
    updateSelectionUI();
}

function toggleAtomSelectionByIndex(atomIndex) {
    setAtomSelected(atomIndex, !selectedAtoms.has(atomIndex));
}

// Clear all selections everywhere.
function clearAtomSelection() {
    selectedAtoms.clear();
    document.querySelectorAll('#xyz-content .xyz-row.selected')
        .forEach(r => r.classList.remove('selected'));
    try {
        // Turn off every halo, then leave the full molecule selected so
        // write("xyz") (xtb / ElemCo) still sees all atoms.
        Jmol.script(jmolApplet0, 'select all; halos off');
    } catch (e) {
        console.error('Error clearing halos:', e);
    }
    updateSelectionUI();
}

// After the XYZ viewer rebuilds its rows, restore selection highlighting
// and re-draw the 3D halos for the currently selected atoms.
function reapplySelectionToRows() {
    document.querySelectorAll('#xyz-content .xyz-row').forEach(row => {
        const idx = parseInt(row.dataset.atomIndex);
        row.classList.toggle('selected', selectedAtoms.has(idx));
    });
    if (selectedAtoms.size > 0) {
        const list = Array.from(selectedAtoms).map(i => 'atomno=' + (i + 1)).join(' or ');
        try {
            Jmol.script(jmolApplet0, `select ${list}; color halos ${currentHaloColor()}; halos on; select all`);
        } catch (e) {
            console.error('Error re-applying halos:', e);
        }
    }
    updateSelectionUI();
}

// Re-tint the halos of the current selection — e.g. after the viewer background
// color changed, so the derived halo color stays visible. No-op when nothing is
// selected.
function reapplyHaloColor() {
    if (selectedAtoms.size === 0) return;
    const list = Array.from(selectedAtoms).map(i => 'atomno=' + (i + 1)).join(' or ');
    try {
        Jmol.script(jmolApplet0, `select ${list}; color halos ${currentHaloColor()}; select all`);
    } catch (e) {
        console.error('Error recoloring halos:', e);
    }
}

// Selected atom numbers as sorted 1-based indices (for ElemCo / external use).
function getSelectedAtomNumbers() {
    return Array.from(selectedAtoms).map(i => i + 1).sort((a, b) => a - b);
}

// Fired by JSmol when an atom is clicked in the 3D structure. JSmol passes
// (appletName, label, atomIndex) with a 0-based atomIndex. Toggles that
// atom's selection (disabled while the model-kit editor is active so clicks
// there keep editing the geometry instead of selecting).
function onJmolAtomPicked(app, label, atomIndex) {
    if (isDragMinimize) return;
    try {
        const idx = parseInt(atomIndex);
        if (isNaN(idx) || idx < 0) return;
        toggleAtomSelectionByIndex(idx);
    } catch (e) {
        console.error('Error handling atom pick:', e);
    }
}

// Fired by JSmol whenever a new structure is loaded. Atom indices from a
// previous structure are no longer valid, so drop any stale selection.
function onJmolStructureLoaded() {
    if (selectedAtoms.size === 0) return;
    selectedAtoms.clear();
    document.querySelectorAll('#xyz-content .xyz-row.selected')
        .forEach(r => r.classList.remove('selected'));
    updateSelectionUI();
}

// XYZ-viewer row click -> route through the central selection state.
function toggleAtomSelection(row) {
    const atomIndex = parseInt(row.dataset.atomIndex);
    toggleAtomSelectionByIndex(atomIndex);
}

function hideXYZEditor() {
    // Don't clear the data when hiding the editor
    document.getElementById('editor-panel').style.display = 'none';
    // Clear selections when closing editor - COMMENTED OUT as it corrupts JSmol state
    // Jmol.script(jmolApplet0, 'select none; halos off');
    debugLog('XYZ', 'XYZ editor hidden without clearing selections');
}

function saveXYZ() {
    const xyzData = document.getElementById('xyz-content-edit').value;
    const blob = new Blob([xyzData], { type: 'chemical/x-xyz' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'molecule.xyz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

