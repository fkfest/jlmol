function showXYZEditor() {
    const editorPanel = document.getElementById('editor-panel');
    editorPanel.style.display = 'block';
    
    try {
        // Get atom count first
        const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
        
        if (!atomCount || atomCount === 0) {
            document.getElementById('status').innerHTML = 'No structure data available';
            return;
        }
        
        // Build XYZ data with preserved atom names
        let xyzData = atomCount + '\n';
        xyzData += 'Structure with preserved atom names\n';
        
        // Get atom data individually to preserve numbered names
        const atomsData = [];
        for (let i = 0; i < atomCount; i++) {
            let atomName;
            
            // First try to use stored original names if available
            if (originalAtomNames && i < originalAtomNames.length) {
                atomName = originalAtomNames[i];
            } else {
                // Get atom name from JSmol (may be just element symbol)
                atomName = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.atomName`);
                
                // Check if we need to modify the atom name based on shouldUseNumberedAtoms flag
                if (!atomName || atomName === 'null' || atomName === '') {
                    // No atom name from JSmol, generate one
                    const element = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.element`);
                    if (shouldUseNumberedAtoms) {
                        atomName = element ? `${element}${i + 1}` : `X${i + 1}`;
                    } else {
                        atomName = element || 'X';
                    }
                } else if (!shouldUseNumberedAtoms && /^[A-Z][a-z]?\d+$/.test(atomName)) {
                    // Atom name has numbers but we don't want numbered atoms - extract just the element
                    const element = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.element`);
                    atomName = element || atomName.replace(/\d+/g, '');
                } else if (shouldUseNumberedAtoms && atomName.length <= 2 && !/\d/.test(atomName)) {
                    // Atom name is just element symbol but we want numbered atoms
                    atomName = `${atomName}${i + 1}`;
                }
            }
            
            // Get coordinates
            const x = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.x`);
            const y = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.y`);
            const z = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.z`);
            
            const atomData = {
                name: atomName,
                x: parseFloat(x).toFixed(6),
                y: parseFloat(y).toFixed(6),
                z: parseFloat(z).toFixed(6)
            };
            
            atomsData.push(atomData);
            xyzData += `${atomName}  ${atomData.x}  ${atomData.y}  ${atomData.z}\n`;
        }
        
        // Store the XYZ data with preserved names
        lastXYZData = xyzData;
        
        // Create the visual editor interface
        const xyzContent = document.getElementById('xyz-content');
        xyzContent.innerHTML = '';
        
        // Create table header
        const headerRow = document.createElement('div');
        headerRow.className = 'xyz-row header';
        headerRow.innerHTML = `
                    <div class="xyz-cell atom-symbol">Atom</div>
                    <div class="xyz-cell coordinate">X</div>
                    <div class="xyz-cell coordinate">Y</div>
                    <div class="xyz-cell coordinate">Z</div>
                `;
        xyzContent.appendChild(headerRow);
        
        // Add atom rows with preserved names
        for (let i = 0; i < atomsData.length; i++) {
            const atomData = atomsData[i];
            const row = document.createElement('div');
            row.className = 'xyz-row';
            // Cell-by-cell with textContent: atom names come from loaded
            // molecule files and must never be parsed as markup (issue #45).
            for (const [cls, value] of [['atom-symbol', atomData.name],
                                        ['coordinate', atomData.x],
                                        ['coordinate', atomData.y],
                                        ['coordinate', atomData.z]]) {
                const cell = document.createElement('div');
                cell.className = 'xyz-cell ' + cls;
                cell.textContent = value;
                row.appendChild(cell);
            }
            row.dataset.atomIndex = i;
            row.onclick = function() {
                toggleAtomSelection(this);
            };
            xyzContent.appendChild(row);
        }

        // Restore selection highlighting/halos for atoms that were already
        // selected (e.g. via clicking in the 3D structure) before the viewer
        // was (re)opened.
        reapplySelectionToRows();

        // Update textarea content
        const editArea = document.getElementById('xyz-content-edit');
        editArea.value = lastXYZData;
        initXYZEditHighlights();
        renderXYZEditHighlights();
        document.getElementById('xyz-edit-wrap').style.display = 'none';  // Ensure we start in selection mode
        xyzContent.style.display = 'block';
        document.getElementById('toggle-edit-mode').textContent = 'Switch to Edit Mode';
        
        // Update MOL file data for JSME integration when XYZ editor is opened
        // Do this LAST to ensure we get the current state without any modifications
        try {
            lastMolFile = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
            debugLog('XYZ', 'Updated lastMolFile when opening XYZ editor, length:', lastMolFile ? lastMolFile.length : 0);
        } catch (molError) {
            console.error('Error updating MOL file data in showXYZEditor:', molError);
        }
        
    } catch (err) {
        setStatusText('Error getting structure data: ' + err.message);
    }
}

function toggleEditMode() {
    const selectionView = document.getElementById('xyz-content');
    const editView = document.getElementById('xyz-edit-wrap');
    const editButton = document.getElementById('toggle-edit-mode');

    if (selectionView.style.display !== 'none') {
        // Switch to edit mode. Keep the current selection so the chosen atoms
        // stay highlighted in the textarea, making them easy to edit.
        selectionView.style.display = 'none';
        editView.style.display = 'block';
        editButton.textContent = 'Switch to Selection Mode';
        renderXYZEditHighlights();
    } else {
        // Switch to selection mode
        selectionView.style.display = 'block';
        editView.style.display = 'none';
        editButton.textContent = 'Switch to Edit Mode';
        // Re-draw halos for any atoms selected via the 3D structure
        reapplySelectionToRows();
    }
}

// Escape text so user-entered atom names/coordinates can't inject markup into
// the highlight overlay.
function escapeHtmlForHighlight(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Mirror the textarea's scroll onto the highlight layer with a transform. Setting
// the backdrop's own scrollTop clamps to its scroll range, and a textarea's
// scrollbars shrink its client area so it can scroll a hair further than the
// scrollbar-less backdrop — at the very bottom/right the clamped band drifted
// above its line. A transform is never clamped, so it tracks the textarea exactly.
function syncXYZEditScroll(textarea, highlights) {
    highlights.style.transform =
        'translate(' + (-textarea.scrollLeft) + 'px, ' + (-textarea.scrollTop) + 'px)';
}

// Re-draw the edit-mode highlight overlay: tint the textarea lines that belong
// to currently selected atoms. Atom i (0-based) lives on text line i + 2
// (line 0 = atom count, line 1 = comment).
function renderXYZEditHighlights() {
    const textarea = document.getElementById('xyz-content-edit');
    const backdrop = document.getElementById('xyz-edit-backdrop');
    const highlights = document.getElementById('xyz-edit-highlights');
    if (!textarea || !backdrop || !highlights) return;

    const selectedLines = new Set(Array.from(selectedAtoms).map(i => i + 2));
    const lines = textarea.value.split('\n');
    highlights.innerHTML = lines.map((line, idx) => {
        const safe = escapeHtmlForHighlight(line);
        return selectedLines.has(idx) ? `<span class="xyz-edit-hl">${safe}</span>` : safe;
    }).join('\n');

    // Keep the overlay scroll-aligned with the textarea.
    syncXYZEditScroll(textarea, highlights);
}

// Attach the textarea listeners that keep the highlight overlay in sync. Runs
// once; guarded by a data flag so repeated showXYZEditor() calls don't stack
// listeners.
function initXYZEditHighlights() {
    const textarea = document.getElementById('xyz-content-edit');
    if (!textarea || textarea.dataset.hlInit) return;
    textarea.dataset.hlInit = '1';

    const highlights = document.getElementById('xyz-edit-highlights');
    textarea.addEventListener('input', renderXYZEditHighlights);
    textarea.addEventListener('scroll', function() {
        if (highlights) syncXYZEditScroll(textarea, highlights);
    });
}

function updateStructure() {
    const editView = document.getElementById('xyz-content-edit');
    try {
        const xyzData = editView.value.trim();
        const lines = xyzData.split('\n');
        
        if (lines.length < 3) {
            throw new Error('Invalid XYZ format');
        }
        
        const atomCount = parseInt(lines[0]);
        if (isNaN(atomCount) || atomCount <= 0) {
            throw new Error('Invalid atom count');
        }
        
        // Parse the atom data to extract names and coordinates
        const atomsData = [];
        const newOriginalNames = [];
        for (let i = 2; i < atomCount + 2 && i < lines.length; i++) {
            const parts = lines[i].trim().split(/\s+/);
            if (parts.length >= 4) {
                const atomName = parts[0];
                let elementSymbol = atomName.replace(/\d+/g, ''); // Extract element symbol
                
                // Capitalize the first letter and make the rest lowercase for proper element recognition
                if (elementSymbol.length > 0) {
                    elementSymbol = elementSymbol.charAt(0).toUpperCase() + elementSymbol.slice(1).toLowerCase();
                }
                
                newOriginalNames.push(atomName);
                atomsData.push({
                    name: atomName,
                    element: elementSymbol,
                    x: parseFloat(parts[1]),
                    y: parseFloat(parts[2]),
                    z: parseFloat(parts[3])
                });
            }
        }
        
        // Load the structure with coordinates only first (using element symbols)
        let tempXyzData = atomCount + '\n' + lines[1] + '\n';
        for (const atom of atomsData) {
            tempXyzData += `${atom.element}  ${atom.x}  ${atom.y}  ${atom.z}\n`;
        }
        
        // Load the structure
        Jmol.script(jmolApplet0, 'load inline "' + tempXyzData + '"');
        
        // Update stored original names
        setOriginalAtomNames(newOriginalNames);
        originalXYZContent = xyzData;
        
        // Apply the numbered atom names after a short delay
        setTimeout(() => {
            for (let i = 0; i < atomsData.length; i++) {
                const atomName = atomsData[i].name;
                Jmol.script(jmolApplet0, `{atomIndex=${i}}.atomName = "${atomName}"`);
            }
            
            // Refresh atom names to ensure they're properly maintained
            setTimeout(() => {
                refreshAtomNames();
                console.log('updateStructure: Atom names refreshed after update');
                
                // Apply all JSmol preferences after structure update
                if (typeof applyJSmolPreferences === 'function') {
                    applyJSmolPreferences();
                    console.log('updateStructure: Applied JSmol preferences');
                }
                
                // Update MOL file data for JSME integration after structure changes
                try {
                    lastMolFile = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                    debugLog('XYZ', 'Updated lastMolFile for JSME integration');
                    
                    // If JSME editor is currently visible, refresh it with the new structure
                    if (!is3D && jsmeApplet) {
                        refreshJSMEFromJSmol();
                    }
                } catch (molError) {
                    console.error('Error updating MOL file data:', molError);
                }
            }, 100);
            
            document.getElementById('status').innerHTML = 'Structure updated successfully with preserved atom names';
        }, 100);
        
        showXYZEditor(); // Refresh the selection view with updated data
    } catch (err) {
        setStatusText('Error updating structure: ' + err.message);
    }
}

function optimizeStructure() {
    try {
        Jmol.script(jmolApplet0, 'minimize');
        document.getElementById('status').innerHTML = 'Structure optimization started';
        // Update the XYZ editor after a short delay to allow optimization to complete
        setTimeout(() => {
            showXYZEditor();
            document.getElementById('status').innerHTML = 'Structure optimization completed';
        }, 1000);
    } catch (err) {
        setStatusText('Error optimizing structure: ' + err.message);
    }
}

