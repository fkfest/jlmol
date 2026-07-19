function showElemCoPanel() {
    debugLog('ElemCo', 'Opening panel');
    const panel = document.getElementById('elemcoPanel');
    if (panel) {
        panel.style.display = 'block';
        
        // Reinitialize panel elements to ensure they're set up properly
        debugLog('ElemCo', 'Initializing panel elements');
        initElemCoPanel();
        
        // Force refresh molecular data detection with multiple attempts
        debugLog('ElemCo', 'Starting molecular data refresh sequence');
        
        // Immediate attempt
        updateElemCoInput();
        
        // Delayed attempt 1 - sometimes JSmol needs time to update
        setTimeout(() => {
            debugLog('ElemCo', 'First delayed attempt');
            updateElemCoInput();
        }, 100);
        
        // Delayed attempt 2 - final fallback with force refresh
        setTimeout(() => {
            console.log('showElemCoPanel: Second delayed attempt with force refresh');
            
            // Check if we still have the error message
            const inputArea = document.getElementById('elemco-input');
            if (inputArea && inputArea.value.includes('Please load a molecule first')) {
                console.warn('showElemCoPanel: Still showing "Please load a molecule first", trying force refresh');
                
                const refreshSuccess = forceRefreshMolecularData();
                
                if (!refreshSuccess) {
                    // Try to diagnose the issue
                    try {
                        const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
                        console.log('showElemCoPanel: Diagnostic - JSmol atom count:', atomCount);
                        
                        if (atomCount > 0) {
                            console.log('showElemCoPanel: Atoms exist but data retrieval failed. This suggests a JSmol communication issue.');
                            inputArea.value = '# Molecular data detected but could not be retrieved.\n# Try closing and reopening the ElemCo panel, or reload the molecule.';
                        } else {
                            console.log('showElemCoPanel: No atoms detected in JSmol');
                            inputArea.value = '# No molecular structure detected.\n# Please load a molecule first.';
                        }
                    } catch (e) {
                        console.error('showElemCoPanel: Diagnostic failed:', e);
                        inputArea.value = '# Error communicating with molecular viewer.\n# Please reload the page and try again.';
                    }
                }
            } else {
                console.log('showElemCoPanel: ElemCo input appears to be working correctly');
            }
        }, 300);
    } else {
        console.error('showElemCoPanel: Could not find elemcoPanel element');
    }
}

function hideElemCoPanel() {
    document.getElementById('elemcoPanel').style.display = 'none';
}

function generateElemCoInput() {
    resetElemCoBuilder();
    document.getElementById('status').innerHTML = 'ElemCo.jl input reset to default';
}

// Remember the last editable field the user focused inside the ElemCo panel (an
// option text field, the custom-step editor, or the main input editor) so that
// "Insert Selected Atoms" targets wherever they were typing. Clicking the button
// itself moves focus to the button, which is not editable, so this value sticks.
var elemcoLastFocusedField = null;
function setupElemcoFocusTracking() {
    const panel = document.getElementById('elemcoPanel');
    if (!panel || panel._focusTrackWired) return;
    panel._focusTrackWired = true;
    panel.addEventListener('focusin', (e) => {
        const t = e.target;
        if (!t) return;
        const editable = t.tagName === 'TEXTAREA' ||
            (t.tagName === 'INPUT' && /^(text|search)$/i.test(t.type || 'text'));
        if (editable) elemcoLastFocusedField = t;
    });
}

// Insert the list of currently selected atoms (sorted, 1-based indices) at the
// cursor of whichever field the user last edited, falling back to the main input
// editor. Useful for dummy atoms, active regions, or option fields.
function insertSelectedAtomsIntoElemCo() {
    const nums = getSelectedAtomNumbers();
    if (nums.length === 0) {
        document.getElementById('status').innerHTML =
            'No atoms selected — click atoms in the structure or XYZ viewer first';
        return;
    }
    let field = elemcoLastFocusedField;
    if (!field || !document.contains(field)) field = document.getElementById('elemco-input');
    if (!field) return;
    const listText = '[' + nums.join(', ') + ']';
    const hasCursor = typeof field.selectionStart === 'number';
    const start = hasCursor ? field.selectionStart : field.value.length;
    const end = hasCursor ? field.selectionEnd : field.value.length;
    field.value = field.value.slice(0, start) + listText + field.value.slice(end);
    const pos = start + listText.length;
    try { field.selectionStart = field.selectionEnd = pos; } catch (_) { /* some inputs disallow selection */ }
    field.focus();
    // Let any state-backed field (option inputs, custom step) react to the edit.
    field.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('status').innerHTML =
        `Inserted ${nums.length} selected atom${nums.length === 1 ? '' : 's'}: ${listText}`;
}

function copyElemCoInput() {
    const input = document.getElementById('elemco-input');
    const text = input.value;
    
    // Use modern Clipboard API with fallback for older browsers
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            document.getElementById('status').innerHTML = 'Input copied to clipboard';
        }).catch(err => {
            console.error('Clipboard API failed:', err);
            fallbackCopyToClipboard(input);
        });
    } else {
        fallbackCopyToClipboard(input);
    }
}

// Fallback for browsers without Clipboard API
function fallbackCopyToClipboard(textArea) {
    textArea.select();
    try {
        document.execCommand('copy');
        document.getElementById('status').innerHTML = 'Input copied to clipboard';
    } catch (err) {
        console.error('Fallback copy failed:', err);
        document.getElementById('status').innerHTML = 'Copy failed - please copy manually';
    }
}

// Wire the fixed "System & basis" controls (basis sets, charge, ms2) to the
// state model. Per-method and per-option controls are wired as they are
// rendered (see renderElemCoSteps and the options browser), not here.
function initializeElemCoListeners() {
    const bind = (id, event, handler) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el._elemcoHandler) el.removeEventListener(event, el._elemcoHandler);
        el._elemcoHandler = handler;
        el.addEventListener(event, handler);
    };
    bind('elemco-basis', 'change', () => {
        elemcoState.basis.ao = document.getElementById('elemco-basis').value;
        updateElemCoInput();
    });
    bind('elemco-jkfit', 'change', () => {
        elemcoState.basis.jkfit = document.getElementById('elemco-jkfit').value;
        updateElemCoInput();
    });
    bind('elemco-mpfit', 'change', () => {
        elemcoState.basis.mpfit = document.getElementById('elemco-mpfit').value;
        updateElemCoInput();
    });
    bind('elemco-charge', 'input', () => {
        elemcoState.charge = parseInt(document.getElementById('elemco-charge').value) || 0;
        updateElemCoInput();
    });
    bind('elemco-multiplicity', 'input', () => {
        elemcoState.ms2 = parseInt(document.getElementById('elemco-multiplicity').value) || 0;
        updateElemCoInput();
    });
    bind('elemco-fcidump', 'input', () => {
        elemcoState.fcidump = document.getElementById('elemco-fcidump').value.trim() || 'FCIDUMP';
        updateElemCoInput();
    });
    setupElemcoFocusTracking();
}

// ===========================================================================
// ElemCo.jl input builder — state model
// ===========================================================================
// A calculation is a global "System & basis" section plus an ordered list of
// steps (building blocks). Each method step maps to an ElemCo.jl macro and
// carries only the options the user changed from their ElemCo.jl defaults; those
// are emitted as a local `@set` block (`@cc dcsd begin ... end`). Global options
// (wf/int/print) are emitted as top-level `@set` lines. See js/elemco-methods.js
// for the method→macro registry and js/elemco-options.js for option metadata.

var elemcoState = { _init: false };
var elcStepSeq = 0;
var elemcoGlobalOptsOpen = false;

// Back-compat shim: some callers (and older code paths) still invoke this.
function updateMethodOptions() {
    if (typeof renderElemCoSteps === 'function') renderElemCoSteps();
    updateElemCoInput();
}

// --- option metadata lookup -------------------------------------------------
function elcOptionsData() { return (typeof window !== 'undefined' && window.ELEMCO_OPTIONS) || null; }
function optionMeta(group, name) {
    const d = elcOptionsData();
    return (d && d.groups[group] && d.groups[group].fields[name]) || null;
}
function elcGroupOrder() {
    const d = elcOptionsData();
    return (d && d.groupOrder) || [];
}

// --- option value helpers (a "bag" is { group: { name: value } } of non-defaults)
function bagHasOption(bag, group, name) {
    return !!(bag && bag[group] && Object.prototype.hasOwnProperty.call(bag[group], name));
}
function optionEffectiveValue(bag, group, name) {
    if (bagHasOption(bag, group, name)) return bag[group][name];
    const meta = optionMeta(group, name);
    return meta ? meta.default : undefined;
}
// Store a value only when it differs from the ElemCo.jl default; otherwise drop
// it so the generated input stays minimal.
function setBagOption(bag, group, name, val) {
    const meta = optionMeta(group, name);
    const isDefault = meta && JSON.stringify(val) === JSON.stringify(meta.default);
    if (val === undefined || val === null || isDefault) {
        if (bag[group]) {
            delete bag[group][name];
            if (Object.keys(bag[group]).length === 0) delete bag[group];
        }
    } else {
        if (!bag[group]) bag[group] = {};
        bag[group][name] = val;
    }
}

// --- JS value -> Julia source literal --------------------------------------
function elcFormatFloat(v) {
    if (typeof v !== 'number' || !isFinite(v)) return String(v);
    if (Number.isInteger(v)) return v.toFixed(1); // keep it a Float literal, e.g. 100.0
    return String(v);
}
// Wrap a JS string as a Julia double-quoted literal. Julia requires escaping the
// backslash, the double-quote, and '$' (string interpolation); backslash first.
function elcJuliaStringLiteral(val) {
    return '"' + String(val).replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/"/g, '\\"') + '"';
}
function formatJuliaValue(meta, val) {
    const w = meta ? meta.widget : 'unknown';
    switch (w) {
        case 'bool': return val ? 'true' : 'false';
        case 'int': return String(val);
        case 'float': return elcFormatFloat(val);
        case 'symbol': return ':' + val;
        case 'string': return elcJuliaStringLiteral(val);
        case 'vector-int': return '[' + (val || []).join(', ') + ']';
        case 'vector-float': return '[' + (val || []).map(elcFormatFloat).join(', ') + ']';
        default: return String(val);
    }
}

// --- @set line generation ---------------------------------------------------
function bagSetLines(bag) {
    const lines = [];
    const order = elcGroupOrder();
    const groups = order.length ? order : Object.keys(bag);
    groups.forEach((group) => {
        const dict = bag[group];
        if (!dict) return;
        const parts = Object.keys(dict).map((name) => `${name}=${formatJuliaValue(optionMeta(group, name), dict[name])}`);
        if (parts.length) lines.push(`@set ${group} ${parts.join(' ')}`);
    });
    return lines;
}

// Top-level @set lines: global option groups, with charge/ms2 (dedicated inputs)
// folded into the wf group. Charge/ms2 preserve the legacy rule of emitting both
// whenever either is non-zero.
function globalSetLines() {
    const bag = {};
    for (const g in elemcoState.global) bag[g] = Object.assign({}, elemcoState.global[g]);
    if (elemcoState.charge !== 0 || elemcoState.ms2 !== 0) {
        bag.wf = Object.assign({ charge: elemcoState.charge, ms2: elemcoState.ms2 }, bag.wf || {});
    }
    return bagSetLines(bag);
}

// --- DOM helper -------------------------------------------------------------
function elcEl(tag, props, children) {
    const e = document.createElement(tag);
    if (props) {
        for (const k in props) {
            const v = props[k];
            if (k === 'class') e.className = v;
            else if (k === 'html') e.innerHTML = v;
            else if (k in e) { try { e[k] = v; } catch (_) { e.setAttribute(k, v); } }
            else e.setAttribute(k, v);
        }
    }
    if (children != null) {
        const kids = Array.isArray(children) ? children : [children];
        kids.forEach((c) => { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    }
    return e;
}

// --- state init / reset -----------------------------------------------------
function elcMapDefaultMethod(m) {
    if (!m || m === 'HF') return null;
    const map = { MP2: 'mp2', DCSD: 'dcsd', 'CCSD(T)': 'ccsd_t', CCSD: 'ccsd' };
    return map[m] || 'dcsd';
}
function makeMethodStep(category, methodId) {
    const step = { id: 's' + (elcStepSeq++), kind: 'method', category, method: methodId, options: {}, _optsOpen: false };
    if (category === 'correlation') { step.spin = ''; step.custom = ''; }
    return step;
}
function initElemCoState() {
    if (elemcoState && elemcoState._init) return;
    const prefs = (typeof getPreferences === 'function') ? getPreferences() : {};
    const ao = prefs.defaultBasisSet || 'cc-pVDZ';
    const steps = [makeMethodStep('reference', 'dfhf')];
    const corr = elcMapDefaultMethod(prefs.defaultMethod);
    if (corr) steps.push(makeMethodStep('correlation', corr));
    elemcoState = { _init: true, mode: 'molecule', modeUserSet: false, fcidump: 'FCIDUMP', basis: { ao, jkfit: 'auto', mpfit: 'auto' }, charge: 0, ms2: 0, global: {}, steps };
}

// Show the basis-set fields (molecule mode) or the FCIDUMP field, and update the
// mode selector + card title to match elemcoState.mode.
function applyElemCoModeUI() {
    const fci = elemcoState.mode === 'fcidump';
    const molFields = document.getElementById('elemco-molecule-fields');
    const fciFields = document.getElementById('elemco-fcidump-fields');
    const modeSel = document.getElementById('elemco-mode');
    const title = document.getElementById('elemco-global-titletext');
    if (molFields) molFields.style.display = fci ? 'none' : '';
    if (fciFields) fciFields.style.display = fci ? '' : 'none';
    if (modeSel) modeSel.value = elemcoState.mode;
    if (title) title.textContent = fci ? 'System & FCIDUMP' : 'System & basis';
}

// User picked a mode explicitly (so stop auto-switching from molecule presence).
function setElemCoMode(mode) {
    initElemCoState();
    elemcoState.mode = mode === 'fcidump' ? 'fcidump' : 'molecule';
    elemcoState.modeUserSet = true;
    applyElemCoModeUI();
    renderElemCoSteps();
    updateElemCoInput();
}
function resetElemCoBuilder() {
    elemcoState = { _init: false };
    elemcoGlobalOptsOpen = false;
    initElemCoState();
    syncElemCoControlsFromState();
    renderElemCoSteps();
    const gm = document.getElementById('elemco-global-options');
    if (gm) { gm.style.display = 'none'; gm.innerHTML = ''; }
    const gb = document.getElementById('elemco-global-optbtn');
    if (gb) gb.textContent = 'Global options ▸';
    renderGlobalChips();
    updateElemCoInput();
}
function syncElemCoControlsFromState() {
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val; };
    set('elemco-basis', elemcoState.basis.ao);
    set('elemco-jkfit', elemcoState.basis.jkfit);
    set('elemco-mpfit', elemcoState.basis.mpfit);
    set('elemco-charge', elemcoState.charge);
    set('elemco-multiplicity', elemcoState.ms2);
    set('elemco-fcidump', elemcoState.fcidump);
    applyElemCoModeUI();
    const note = document.getElementById('elemco-source-note');
    const d = elcOptionsData();
    if (note && d) note.textContent = `Options from ElemCo.jl @ ${d.sourceRef} (${d.groupOrder.length} groups, generated ${d.generated})`;
}

// Apply relevant preferences to the live state (basis default). Called on load
// and after saving preferences; must not clobber user-built steps.
function syncElemCoBasisFromPrefs() {
    const prefs = (typeof getPreferences === 'function') ? getPreferences() : {};
    if (!elemcoState || !elemcoState._init) return;
    if (prefs.defaultBasisSet) {
        elemcoState.basis.ao = prefs.defaultBasisSet;
        const sel = document.getElementById('elemco-basis');
        if (sel) sel.value = prefs.defaultBasisSet;
    }
    updateElemCoInput();
}

// --- step CRUD --------------------------------------------------------------
function addElemCoStep(type) {
    initElemCoState();
    let step;
    if (type === 'reference') step = makeMethodStep('reference', 'dfhf');
    else if (type === 'correlation') step = makeMethodStep('correlation', 'dcsd');
    else if (type === 'export') step = { id: 's' + (elcStepSeq++), kind: 'export', filename: 'orbitals.molden' };
    else if (type === 'custom') step = { id: 's' + (elcStepSeq++), kind: 'custom', label: '', code: '', _codeOpen: true };
    else return;
    elemcoState.steps.push(step);
    renderElemCoSteps();
    updateElemCoInput();
}
function removeElemCoStep(id) {
    elemcoState.steps = elemcoState.steps.filter((s) => s.id !== id);
    renderElemCoSteps();
    updateElemCoInput();
}
function moveElemCoStep(id, dir) {
    const s = elemcoState.steps;
    const i = s.findIndex((x) => x.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    renderElemCoSteps();
    updateElemCoInput();
}
// Move the dragged step next to the target step (before it, or after when the
// pointer was dropped on the target's lower half).
function reorderElemCoStep(draggedId, targetId, after) {
    if (draggedId === targetId) return;
    const s = elemcoState.steps;
    const from = s.findIndex((x) => x.id === draggedId);
    if (from < 0) return;
    const [moved] = s.splice(from, 1);
    let to = s.findIndex((x) => x.id === targetId);
    if (to < 0) { s.splice(from, 0, moved); return; }
    if (after) to += 1;
    s.splice(to, 0, moved);
    renderElemCoSteps();
    updateElemCoInput();
}

// --- rendering: step list ---------------------------------------------------
function elcStepBadge(step) {
    if (step.kind === 'export') return 'Export';
    if (step.kind === 'custom') return 'Custom';
    return step.category === 'reference' ? 'Reference' : 'Method';
}
function renderElemCoSteps() {
    const host = document.getElementById('elemco-steps');
    if (!host) return;
    host.innerHTML = '';
    if (!elemcoState.steps || elemcoState.steps.length === 0) {
        host.appendChild(elcEl('div', { class: 'preview-note' }, 'No steps yet — add a reference and a method below.'));
        return;
    }
    elemcoState.steps.forEach((step) => host.appendChild(renderStepCard(step)));

    // Nudge the user to add a reference (SCF) step — correlation methods need one.
    // Skipped in FCIDUMP mode, where the reference/integrals come from the file.
    const hasReference = elemcoState.steps.some((s) => s.kind === 'method' && s.category === 'reference');
    if (elemcoState.mode !== 'fcidump' && !hasReference) {
        const warn = elcEl('div', { class: 'elemco-suggest' });
        warn.appendChild(elcEl('span', {}, '⚠ No reference (SCF) step — correlation methods need one to run. '));
        const b = elcEl('button', { type: 'button' }, 'Add reference');
        b.addEventListener('click', () => {
            initElemCoState();
            elemcoState.steps.unshift(makeMethodStep('reference', 'dfhf'));
            renderElemCoSteps();
            updateElemCoInput();
        });
        warn.appendChild(b);
        host.appendChild(warn);
    }
}
var elcDraggingStepId = null;
function renderStepCard(step) {
    const card = elcEl('div', { class: 'elemco-step-card' });
    card.dataset.stepId = step.id;
    const head = elcEl('div', { class: 'elemco-step-head' });

    // Drag-to-reorder: only the grip starts a drag (so the select/inputs stay
    // usable); the whole card is a drop target.
    const grip = elcEl('span', { class: 'elemco-step-grip', title: 'Drag to reorder', draggable: 'true' }, '⠿');
    grip.addEventListener('dragstart', (e) => {
        elcDraggingStepId = step.id;
        if (e.dataTransfer) { e.dataTransfer.setData('text/plain', step.id); e.dataTransfer.effectAllowed = 'move'; }
        card.classList.add('elemco-dragging');
    });
    grip.addEventListener('dragend', () => { elcDraggingStepId = null; card.classList.remove('elemco-dragging'); });
    card.addEventListener('dragover', (e) => {
        if (!elcDraggingStepId || elcDraggingStepId === step.id) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        card.classList.add('elemco-drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('elemco-drag-over'));
    card.addEventListener('drop', (e) => {
        card.classList.remove('elemco-drag-over');
        const draggedId = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || elcDraggingStepId;
        if (!draggedId) return;
        e.preventDefault();
        const rect = card.getBoundingClientRect();
        const after = (e.clientY - rect.top) > rect.height / 2;
        reorderElemCoStep(draggedId, step.id, after);
    });
    head.appendChild(grip);

    head.appendChild(elcEl('span', { class: 'elemco-badge' }, elcStepBadge(step)));

    if (step.kind === 'method' && step.category === 'reference') {
        const sel = elcEl('select', { class: 'elemco-step-method' });
        (ELEMCO_METHODS.reference || []).forEach((m) => sel.appendChild(elcEl('option', { value: m.id }, m.label)));
        sel.value = step.method;
        sel.addEventListener('change', () => {
            step.method = sel.value;
            updateElemCoInput();
            if (step._optsOpen) renderStepOptions(step);
        });
        head.appendChild(sel);
    } else if (step.kind === 'method' && step.category === 'correlation') {
        const sel = elcEl('select', { class: 'elemco-step-method' });
        ELEMCO_CORRELATION_GROUPS.forEach((g) => {
            const og = elcEl('optgroup', { label: g.group });
            g.methods.forEach((m) => og.appendChild(elcEl('option', { value: m.id }, m.label)));
            sel.appendChild(og);
        });
        sel.appendChild(elcEl('option', { value: 'custom' }, 'Custom…'));
        sel.value = step.method;
        sel.addEventListener('change', () => {
            step.method = sel.value;
            renderElemCoSteps(); // spin selector / readout / option groups depend on the base
            updateElemCoInput();
        });
        head.appendChild(sel);
    } else if (step.kind === 'export') {
        const fn = elcEl('input', { type: 'text', class: 'elemco-step-file', title: 'Molden filename' });
        fn.value = step.filename || 'orbitals.molden';
        fn.addEventListener('input', () => { step.filename = fn.value.trim() || 'orbitals.molden'; updateElemCoInput(); });
        head.appendChild(fn);
    } else {
        const lbl = elcEl('input', { type: 'text', class: 'elemco-step-file', placeholder: 'Custom Julia (used as a comment)', title: 'Label — added as a comment line above the code' });
        lbl.value = step.label || '';
        lbl.addEventListener('input', () => { step.label = lbl.value; updateElemCoInput(); });
        head.appendChild(lbl);
    }

    const actions = elcEl('span', { class: 'elemco-step-actions' });
    let optsMount = null;
    let codeMount = null;
    if (step.kind === 'method') {
        const optCaret = elcEl('span', { class: 'elemco-caret' }, step._optsOpen ? '▾' : '▸');
        const optBtn = elcEl('button', { type: 'button', class: 'elemco-step-optbtn', title: 'Set options for this method' }, [optCaret, ' Options']);
        optBtn.addEventListener('click', () => {
            step._optsOpen = !step._optsOpen;
            optCaret.textContent = step._optsOpen ? '▾' : '▸';
            if (optsMount) optsMount.style.display = step._optsOpen ? 'block' : 'none';
            if (step._optsOpen) renderStepOptions(step);
        });
        actions.appendChild(optBtn);
    } else if (step.kind === 'custom') {
        const codeCaret = elcEl('span', { class: 'elemco-caret' }, step._codeOpen !== false ? '▾' : '▸');
        const codeBtn = elcEl('button', { type: 'button', class: 'elemco-step-optbtn', title: 'Show or hide the code' }, [codeCaret, ' Code']);
        codeBtn.addEventListener('click', () => {
            step._codeOpen = !(step._codeOpen !== false);
            codeCaret.textContent = step._codeOpen ? '▾' : '▸';
            if (codeMount) codeMount.style.display = step._codeOpen ? 'block' : 'none';
        });
        actions.appendChild(codeBtn);
    }
    const up = elcEl('button', { type: 'button', class: 'elemco-step-move', title: 'Move up' }, '▲');
    up.addEventListener('click', () => moveElemCoStep(step.id, -1));
    const down = elcEl('button', { type: 'button', class: 'elemco-step-move', title: 'Move down' }, '▼');
    down.addEventListener('click', () => moveElemCoStep(step.id, 1));
    const del = elcEl('button', { type: 'button', class: 'elemco-step-del', title: 'Remove step' }, '✕');
    del.addEventListener('click', () => removeElemCoStep(step.id));
    actions.appendChild(up); actions.appendChild(down); actions.appendChild(del);
    head.appendChild(actions);
    card.appendChild(head);

    if (step.kind === 'method') {
        if (step.category === 'correlation') card.appendChild(renderCorrelationDetail(step));
        const chipsEl = elcEl('div', { class: 'elemco-chips' });
        optsMount = elcEl('div', { class: 'elemco-step-options' });
        optsMount.style.display = step._optsOpen ? 'block' : 'none';
        card.appendChild(chipsEl);
        card.appendChild(optsMount);
        step._chipsEl = chipsEl;
        step._optsMount = optsMount;
        renderStepChips(step);
        if (step._optsOpen) renderStepOptions(step);
    } else if (step.kind === 'custom') {
        codeMount = elcEl('textarea', { class: 'elemco-step-code', title: 'Raw Julia inserted verbatim', placeholder: '# your Julia here' });
        codeMount.value = step.code || '';
        codeMount.style.display = step._codeOpen !== false ? 'block' : 'none';
        codeMount.addEventListener('input', () => { step.code = codeMount.value; updateElemCoInput(); });
        card.appendChild(codeMount);
    }
    return card;
}
// The ElemCo.jl call a method step emits (macro + optional method-string arg),
// without the local-options block. Used both for generation and the live readout.
function elemcoStepHeadString(step) {
    if (step.category === 'reference') {
        const def = elemcoMethodDef('reference', step.method);
        return def ? def.macro : '';
    }
    // correlation
    let macro, methodStr;
    if (step.method === 'custom') {
        macro = '@cc';
        methodStr = (step.custom || '').trim();
    } else {
        const def = elemcoCorrelationDef(step.method);
        if (!def) return '';
        macro = def.macro;
        methodStr = elemcoComposeMethod(def, step.spin);
    }
    const takesArg = (macro === '@cc' || macro === '@dfcc');
    return macro + (takesArg && methodStr ? ' ' + elcJuliaStringLiteral(methodStr) : '');
}

// The detail line under a correlation step's header: a spin selector (for methods
// that support U/R) plus a live readout of the emitted call, or a free-text field
// for the Custom… method.
function renderCorrelationDetail(step) {
    const detail = elcEl('div', { class: 'elemco-method-detail' });
    if (step.method === 'custom') {
        detail.appendChild(elcEl('span', { class: 'elemco-detail-label' }, 'method:'));
        const inp = elcEl('input', { type: 'text', class: 'elemco-step-file', placeholder: 'e.g. UCCSD(T)', title: 'Method string passed to @cc' });
        inp.value = step.custom || '';
        inp.addEventListener('input', () => { step.custom = inp.value; updateElemCoInput(); });
        detail.appendChild(inp);
        return detail;
    }
    const def = elemcoCorrelationDef(step.method);
    const readout = elcEl('span', { class: 'elemco-method-readout', title: 'Emitted ElemCo.jl call' }, elemcoStepHeadString(step));
    if (def && def.spins) {
        const spinSel = elcEl('select', { class: 'elemco-spin-select', title: 'Spin type (adds the U or R prefix)' });
        (window.ELEMCO_SPINS || []).forEach((sp) => spinSel.appendChild(elcEl('option', { value: sp.id }, sp.label)));
        spinSel.value = step.spin || '';
        spinSel.addEventListener('change', () => {
            step.spin = spinSel.value;
            readout.textContent = elemcoStepHeadString(step);
            updateElemCoInput();
        });
        detail.appendChild(spinSel);
    }
    detail.appendChild(readout);
    return detail;
}
function renderStepOptions(step) {
    if (!step._optsMount || typeof renderOptionsBrowserInto !== 'function') return;
    const def = elemcoMethodDef(step.category, step.method);
    const groups = def ? def.groups : ['cc'];
    renderOptionsBrowserInto(step._optsMount, groups, step.options, () => {
        renderStepChips(step);
        updateElemCoInput();
    }, {});
}

// --- rendering: option chips ------------------------------------------------
function renderBagChips(bag, chipsEl, afterRemove) {
    if (!chipsEl) return;
    chipsEl.innerHTML = '';
    let any = false;
    elcGroupOrder().forEach((group) => {
        const dict = bag[group];
        if (!dict) return;
        Object.keys(dict).forEach((name) => {
            any = true;
            const meta = optionMeta(group, name);
            const chip = elcEl('span', { class: 'elemco-chip', title: `${group}.${name}${meta ? ' — ' + meta.desc : ''}` });
            chip.appendChild(elcEl('span', { class: 'elemco-chip-text' }, `${group}.${name}=${formatJuliaValue(meta, dict[name])}`));
            const x = elcEl('button', { type: 'button', class: 'elemco-chip-x', title: 'Remove (reset to default)' }, '×');
            x.addEventListener('click', () => {
                setBagOption(bag, group, name, undefined);
                renderBagChips(bag, chipsEl, afterRemove);
                updateElemCoInput();
                if (afterRemove) afterRemove();
            });
            chip.appendChild(x);
            chipsEl.appendChild(chip);
        });
    });
    chipsEl.style.display = any ? 'flex' : 'none';
}
function renderStepChips(step) {
    renderBagChips(step.options, step._chipsEl, () => { if (step._optsOpen) renderStepOptions(step); });
}

// --- rendering: global options card ----------------------------------------
function toggleGlobalOptions() {
    const mount = document.getElementById('elemco-global-options');
    const caret = document.getElementById('elemco-global-optcaret');
    elemcoGlobalOptsOpen = !elemcoGlobalOptsOpen;
    if (caret) caret.textContent = elemcoGlobalOptsOpen ? '▾' : '▸';
    if (mount) {
        mount.style.display = elemcoGlobalOptsOpen ? 'block' : 'none';
        if (elemcoGlobalOptsOpen) renderGlobalOptions();
    }
}
function renderGlobalOptions() {
    const mount = document.getElementById('elemco-global-options');
    if (!mount || typeof renderOptionsBrowserInto !== 'function') return;
    renderOptionsBrowserInto(mount, window.ELEMCO_GLOBAL_GROUPS || ['wf', 'int', 'print'], elemcoState.global, () => {
        renderGlobalChips();
        updateElemCoInput();
    }, { exclude: window.ELEMCO_GLOBAL_EXCLUDE || {} });
}
function renderGlobalChips() {
    const el = document.getElementById('elemco-global-chips');
    if (!el) return;
    renderBagChips(elemcoState.global, el, () => { if (elemcoGlobalOptsOpen) renderGlobalOptions(); });
}
// Fold/unfold the whole System & basis card.
function toggleElemCoGlobalCard() {
    const body = document.getElementById('elemco-global-body');
    const caret = document.getElementById('elemco-global-caret');
    if (!body) return;
    const open = body.style.display === 'none';
    body.style.display = open ? 'block' : 'none';
    if (caret) caret.textContent = open ? '▾' : '▸';
}

// Function to generate meaningful comment line for XYZ files
function generateXYZCommentLine() {
    // Check if we have database metadata
    if (window.databaseMetadata && window.databaseMetadata.source === 'PubChem') {
        const metadata = window.databaseMetadata;
        let commentParts = [];
        
        // Add PubChem source
        commentParts.push('PubChem');
        
        // Add CID if available
        if (metadata.cid) {
            commentParts.push(`CID:${metadata.cid}`);
        }
        
        // Add compound name if available
        if (metadata.name) {
            commentParts.push(`Name:"${metadata.name}"`);
        }
        
        // Add SMILES if available (truncate if too long)
        if (metadata.smiles) {
            const smiles = metadata.smiles.length > 50 ? 
                metadata.smiles.substring(0, 47) + '...' : 
                metadata.smiles;
            commentParts.push(`SMILES:${smiles}`);
        }
        
        // Add query info if different from what's already shown
        if (metadata.originalQuery && metadata.queryType) {
            if (metadata.queryType === 'CID' && metadata.originalQuery !== metadata.cid) {
                commentParts.push(`Query:${metadata.originalQuery}`);
            } else if (metadata.queryType === 'Name' && metadata.originalQuery !== metadata.name) {
                commentParts.push(`Query:"${metadata.originalQuery}"`);
            } else if (metadata.queryType === 'SMILES' && metadata.originalQuery !== metadata.smiles) {
                commentParts.push(`Query:${metadata.originalQuery}`);
            } else if (metadata.queryType === 'Formula') {
                commentParts.push(`Formula:${metadata.originalQuery}`);
            }
        }
        
        return commentParts.join(', ');
    }
    
    // Fallback to original comment if no database metadata
    return 'Structure with numbered atoms';
}

// Function to generate XYZ content with numbered atoms if available
function getXYZDataWithNumberedAtoms() {
    debugLog('XYZ', 'Starting data retrieval');
    debugLog('XYZ', `shouldUseNumberedAtoms flag: ${shouldUseNumberedAtoms}`);
    
    try {
        // First check if there are any atoms at all
        const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
        debugLog('XYZ', `Atom count from JSmol: ${atomCount}`);
        
        if (!atomCount || atomCount === 0) {
            console.warn('No atoms found in JSmol');
            return null;
        }
        
        // Strategy 1: Try to use preserved numbered atom names
        if (window.originalAtomNames && window.originalAtomNames.length > 0) {
            console.log('getXYZDataWithNumberedAtoms: Found preserved atom names, count:', window.originalAtomNames.length);
            try {
                if (atomCount === window.originalAtomNames.length) {
                    let xyzContent = atomCount + '\n' + generateXYZCommentLine() + '\n';
                    
                    for (let i = 0; i < atomCount; i++) {
                        // Get atom coordinates from JSmol
                        const x = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.x`);
                        const y = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.y`);
                        const z = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.z`);
                        
                        // Validate coordinates
                        if (isNaN(x) || isNaN(y) || isNaN(z)) {
                            console.warn('Invalid coordinates for atom', i, 'falling back');
                            break;
                        }
                        
                        // Use the preserved numbered atom name
                        const atomName = window.originalAtomNames[i];
                        xyzContent += `${atomName} ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
                    }
                    
                    // Validate the generated content
                    const lines = xyzContent.trim().split('\n');
                    if (lines.length >= atomCount + 2) {
                        console.log('getXYZDataWithNumberedAtoms: Successfully generated numbered XYZ data');
                        return xyzContent;
                    }
                } else {
                    console.warn('Atom count mismatch: JSmol has', atomCount, 'but preserved names has', window.originalAtomNames.length);
                }
            } catch (error) {
                console.error('Error generating numbered XYZ data:', error);
                // Continue to next strategy
            }
        }
        
        // Strategy 2: Try to get current atom names from JSmol and build XYZ
        console.log('getXYZDataWithNumberedAtoms: Trying to get current atom names from JSmol');
        try {
            let xyzContent = atomCount + '\n' + generateXYZCommentLine() + '\n';
            let validData = true;
            
            for (let i = 0; i < atomCount && validData; i++) {
                try {
                    // Try to get current atom name from JSmol
                    let atomName = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.atomName`);
                    if (!atomName || atomName === 'null' || atomName === '') {
                        // Fallback based on whether we should use numbered atoms
                        const element = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.element`) || 'X';
                        atomName = shouldUseNumberedAtoms ? `${element}${i + 1}` : element;
                        console.log(`getXYZDataWithNumberedAtoms: Strategy 2 - Generated atom name for atom ${i}: ${atomName} (shouldUseNumberedAtoms: ${shouldUseNumberedAtoms})`);
                    }
                    
                    const x = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.x`);
                    const y = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.y`);
                    const z = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.z`);
                    
                    // Validate coordinates
                    if (isNaN(x) || isNaN(y) || isNaN(z)) {
                        console.warn('Invalid coordinates for atom', i);
                        validData = false;
                        break;
                    }
                    
                    xyzContent += `${atomName} ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
                } catch (atomError) {
                    console.warn('Error getting data for atom', i, ':', atomError);
                    validData = false;
                    break;
                }
            }
            
            if (validData) {
                console.log('getXYZDataWithNumberedAtoms: Successfully generated XYZ from current JSmol state');
                return xyzContent;
            }
        } catch (error) {
            console.error('Error building XYZ from current JSmol state:', error);
        }
        
        // Strategy 3: Try JSmol's built-in write function
        console.log('getXYZDataWithNumberedAtoms: Trying JSmol write function');
        try {
            const xyzData = Jmol.evaluateVar(jmolApplet0, 'write("xyz")');
            if (xyzData && xyzData.trim().length > 0) {
                const lines = xyzData.trim().split('\n');
                if (lines.length >= 3 && !isNaN(parseInt(lines[0]))) {
                    console.log('getXYZDataWithNumberedAtoms: Successfully got XYZ from JSmol write function');
                    return xyzData;
                }
            }
        } catch (error) {
            console.error('JSmol write function failed:', error);
        }
        
        // Strategy 4: Manual XYZ building with element symbols (numbered only if appropriate)
        console.log('getXYZDataWithNumberedAtoms: Building manual XYZ with element symbols');
        try {
            let manualXYZ = atomCount + '\n' + generateXYZCommentLine() + '\n';
            let validManualData = true;
            
            for (let i = 0; i < atomCount && validManualData; i++) {
                try {
                    const element = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.element`) || 'X';
                    const x = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.x`) || 0;
                    const y = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.y`) || 0;
                    const z = Jmol.evaluateVar(jmolApplet0, `{atomIndex=${i}}.z`) || 0;
                    
                    // Use numbered atoms only if this came from an XYZ file
                    const atomName = shouldUseNumberedAtoms ? `${element}${i+1}` : element;
                    console.log(`getXYZDataWithNumberedAtoms: Strategy 4 - Generated atom name for atom ${i}: ${atomName} (shouldUseNumberedAtoms: ${shouldUseNumberedAtoms})`);
                    manualXYZ += `${atomName} ${parseFloat(x).toFixed(6)} ${parseFloat(y).toFixed(6)} ${parseFloat(z).toFixed(6)}\n`;
                } catch (atomError) {
                    console.warn('Error in manual XYZ generation for atom', i, ':', atomError);
                    validManualData = false;
                    break;
                }
            }
            
            if (validManualData) {
                console.log('getXYZDataWithNumberedAtoms: Successfully generated manual XYZ');
                return manualXYZ;
            }
        } catch (error) {
            console.error('Manual XYZ generation failed:', error);
        }
        
        console.error('All XYZ generation strategies failed');
        return null;
        
    } catch (error) {
        console.error('Error in getXYZDataWithNumberedAtoms:', error);
        
        // Last resort: try to get any molecular data
        try {
            console.log('getXYZDataWithNumberedAtoms: Last resort fallback attempt');
            const fallbackData = Jmol.evaluateVar(jmolApplet0, 'write("xyz")');
            if (fallbackData && fallbackData.trim().length > 0) {
                console.log('getXYZDataWithNumberedAtoms: Fallback successful');
                return fallbackData;
            }
        } catch (fallbackError) {
            console.error('Fallback XYZ generation also failed:', fallbackError);
        }
        
        console.error('All molecular data retrieval attempts failed');
        return null;
    }
}

// Is the molecular XYZ from JSmol usable? Returns the trimmed data or null.
function elcValidMoleculeXYZ() {
    const xyzData = getXYZDataWithNumberedAtoms();
    if (!xyzData || xyzData.trim().length === 0) return null;
    const lines = xyzData.trim().split('\n');
    if (lines.length < 3) return null;
    const atomCount = parseInt(lines[0]);
    if (isNaN(atomCount) || atomCount <= 0) return null;
    const dataLines = lines.slice(2);
    if (dataLines.length < atomCount) return null;
    let valid = 0;
    for (let i = 0; i < Math.min(dataLines.length, atomCount); i++) {
        const p = dataLines[i].trim().split(/\s+/);
        if (p.length >= 4 && !isNaN(parseFloat(p[1])) && !isNaN(parseFloat(p[2])) && !isNaN(parseFloat(p[3]))) valid++;
    }
    return valid >= atomCount ? xyzData.trim() : null;
}

function updateElemCoInput() {
    debugLog('ElemCo', 'Starting input generation');
    initElemCoState();
    const inputArea = document.getElementById('elemco-input');
    if (!inputArea) return;

    const xyz = elcValidMoleculeXYZ();

    // Auto-select the calculation mode from molecule presence, unless the user
    // has explicitly chosen one (no molecule loaded -> FCIDUMP mode).
    if (!elemcoState.modeUserSet) {
        const auto = xyz ? 'molecule' : 'fcidump';
        if (auto !== elemcoState.mode) { elemcoState.mode = auto; applyElemCoModeUI(); renderElemCoSteps(); }
    }

    // Emit a single calculation step (building block) as its ElemCo.jl macro,
    // with any changed options as a local `begin ... end` @set block.
    function elcStepComment(step) {
        if (step.kind === 'export') return 'Export orbitals (Molden)';
        if (step.kind === 'custom') return (step.label || '').trim();
        if (step.category === 'correlation') {
            if (step.method === 'custom') return (step.custom || '').trim();
            const def = elemcoCorrelationDef(step.method);
            if (!def) return step.method;
            return elemcoComposeMethod(def, step.spin) || def.label;
        }
        const def = elemcoMethodDef(step.category, step.method);
        return def ? def.label : step.method;
    }
    // The method name is emitted as a string literal (ElemCo.jl accepts `@cc "CCSD"`
    // / `@dfcc "SVD-DCSD"`); bare forms like ccsd(t) or svd-dcsd would parse as a
    // call / subtraction in Julia. Composition happens in elemcoStepHeadString.
    function elcStepEmit(step) {
        if (step.kind === 'export') return `@export_molden ${elcJuliaStringLiteral(step.filename || 'orbitals.molden')}`;
        if (step.kind === 'custom') return (step.code || '').replace(/\s+$/, '');
        const head = elemcoStepHeadString(step);
        if (!head) return `# unknown method: ${step.method}`;
        const lines = bagSetLines(step.options || {});
        if (lines.length === 0) return head;
        return head + ' begin\n' + lines.map((l) => '  ' + l).join('\n') + '\nend';
    }

    const parts = ['using ElemCo', '', 'function main()'];

    if (elemcoState.mode === 'fcidump') {
        // FCIDUMP mode: read integrals from a file, no geometry/basis.
        parts.push('# Integrals from FCIDUMP', `fcidump = ${elcJuliaStringLiteral(elemcoState.fcidump || 'FCIDUMP')}`);
    } else {
        // Molecule mode: geometry from the viewer + basis set.
        if (!xyz) {
            inputArea.value = '# Please load a molecule first (or switch to FCIDUMP mode in System & basis)';
            return;
        }
        const b = elemcoState.basis;
        parts.push('# Molecular geometry', 'geometry = """', xyz, '"""', '', '# Basis set');
        if (b.jkfit === 'auto' && b.mpfit === 'auto') {
            parts.push(`basis = "${b.ao}"`);
        } else {
            let d = `basis = Dict(\n    "ao" => "${b.ao}"`;
            if (b.jkfit !== 'auto') d += `,\n    "jkfit" => "${b.jkfit}"`;
            if (b.mpfit !== 'auto') d += `,\n    "mpfit" => "${b.mpfit}"`;
            d += '\n)';
            parts.push(d);
        }
    }

    const gl = globalSetLines();
    if (gl.length) { parts.push('', '# Global settings'); gl.forEach((l) => parts.push(l)); }
    (elemcoState.steps || []).forEach((step) => {
        const comment = elcStepComment(step);
        parts.push('');
        if (comment) parts.push('# ' + comment);
        parts.push(elcStepEmit(step));
    });
    parts.push('', 'end', 'main()', '');

    inputArea.value = parts.join('\n');
    debugLog('ElemCo', 'Successfully generated input');
}

// Function to run Julia calculation
async function runJuliaCalculation() {
    const inputTextarea = document.getElementById('elemco-input');
    const outputTextarea = document.getElementById('julia-output');
    const outputSection = document.getElementById('julia-output-section');
    
    if (!inputTextarea || !outputTextarea || !outputSection) {
        document.getElementById('status').innerHTML = 'Error: Could not find required elements';
        return;
    }
    
    const juliaCode = inputTextarea.value.trim();
    if (!juliaCode || juliaCode === '# Please load a molecule first') {
        document.getElementById('status').innerHTML = 'Please generate valid input first';
        return;
    }
    
    // Show the output section
    outputSection.style.display = 'block';
    outputTextarea.value = 'Initializing Julia calculation...\n';
    document.getElementById('status').innerHTML = 'Preparing Julia calculation...';
    
    try {
        // Check if we're in Electron environment
        if (typeof require !== 'undefined') {
            // Electron environment - use child_process to run Julia
            await runJuliaInElectron(juliaCode);
        } else {
            // Browser environment - show instructions for manual execution
            showJuliaInstructions(juliaCode);
        }
    } catch (error) {
        console.error('Error running Julia calculation:', error);
        outputTextarea.value = `Error: ${error.message}\n\nTroubleshooting:\n- Ensure Julia is installed and accessible\n- Verify ElemCo.jl package is installed\n- Check file permissions\n- Try running Julia from command line first`;
        document.getElementById('status').innerHTML = 'Julia calculation failed - see output for details';
    }
}

// Function to run Julia in Electron environment
async function runJuliaInElectron(juliaCode) {
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const outputTextarea = document.getElementById('julia-output');
    
    // Get the configured Julia command from user preferences
    const prefs = getPreferences();
    const juliaCommand = prefs.juliaCommand || 'julia';
    
    let tempFile = null;
    
    // Cleanup function to be called in all exit scenarios
    function cleanupTempFile() {
        if (tempFile) {
            try {
                fs.unlinkSync(tempFile);
                console.log('Temporary file cleaned up:', tempFile);
            } catch (e) {
                console.warn('Could not delete temporary file:', tempFile, e);
            }
            tempFile = null;
        }
    }
    
    // Ensure cleanup happens even if process is terminated
    process.on('exit', cleanupTempFile);
    process.on('SIGINT', cleanupTempFile);
    process.on('SIGTERM', cleanupTempFile);
    
    try {
        // Parse Julia command to handle WSL and other complex commands with proper quote handling
        function parseCommand(cmd) {
            const parts = [];
            let current = '';
            let inQuotes = false;
            let quoteChar = '';
            
            for (let i = 0; i < cmd.length; i++) {
                const char = cmd[i];
                
                if ((char === '"' || char === "'") && !inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar && inQuotes) {
                    inQuotes = false;
                    quoteChar = '';
                } else if (char === ' ' && !inQuotes) {
                    if (current.trim()) {
                        parts.push(current.trim());
                        current = '';
                    }
                } else {
                    current += char;
                }
            }
            
            if (current.trim()) {
                parts.push(current.trim());
            }
            
            return parts;
        }
        
        const commandParts = parseCommand(juliaCommand.trim());
        const isWSL = commandParts[0].toLowerCase() === 'wsl';
        
        // Create temporary file for Julia code
        const tempDir = os.tmpdir();
        tempFile = path.join(tempDir, `jlmol_calculation_${Date.now()}.jl`);
        fs.writeFileSync(tempFile, juliaCode);
        
        // For WSL, convert Windows path to WSL path
        let filePathForCommand = tempFile;
        if (isWSL) {
            // Convert Windows path to WSL path format
            // Handle both uppercase and lowercase drive letters
            // e.g., C:\Users\... or c:\Users\... -> /mnt/c/Users/...
            if (/^[A-Za-z]:/.test(tempFile)) {
                const driveLetter = tempFile.charAt(0).toLowerCase();
                filePathForCommand = tempFile.replace(/^[A-Za-z]:/, `/mnt/${driveLetter}`).replace(/\\/g, '/');
            } else {
                // If path doesn't start with drive letter, assume it's already Unix-style
                filePathForCommand = tempFile.replace(/\\/g, '/');
            }
        }
        
        outputTextarea.value = `=== JLMol Julia Calculation ===\nTimestamp: ${new Date().toISOString()}\nJulia command: ${juliaCommand}\nTemporary file: ${tempFile}\n${isWSL ? `WSL path: ${filePathForCommand}\n` : ''}Full command: ${juliaCommand} "${filePathForCommand}"\n\n--- Starting calculation ---\n`;
        document.getElementById('status').innerHTML = 'Starting Julia process...';
        
        // Prepare command and arguments for version check
        let baseCommand, versionCheckArgs;
        if (isWSL) {
            baseCommand = 'wsl';
            // The command is something like "wsl -d <distro> julia" or "wsl /path/to/julia"
            // commandParts[0] is "wsl", the rest are arguments for wsl.
            versionCheckArgs = [...commandParts.slice(1), '--version'];
        } else if (commandParts.length > 1) {
            baseCommand = commandParts[0];
            versionCheckArgs = [...commandParts.slice(1), '--version'];
        } else {
            baseCommand = juliaCommand;
            versionCheckArgs = ['--version'];
        }
        
        // Check if Julia is available first
        const juliaCheck = spawn(baseCommand, versionCheckArgs, { 
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: isWSL ? false : true
        });
        
        juliaCheck.on('error', (error) => {
            throw new Error(`Julia not found at "${juliaCommand}": ${error.message}\n\nPlease check your Julia command in Settings or install Julia and ensure it's accessible from command line.`);
        });
        
        juliaCheck.on('close', (code) => {
            if (code !== 0) {
                throw new Error(`Julia version check failed with code ${code} for command "${juliaCommand}"`);
            }
            
            // Julia is available, proceed with calculation
            document.getElementById('status').innerHTML = 'Julia found, executing calculation...';
            
            // Prepare arguments for actual execution
            let execArgs;
            if (isWSL) {
                // The command is something like "wsl -d <distro> julia" or "wsl julia"
                // commandParts[0] is "wsl", the rest are arguments for wsl.
                execArgs = [...commandParts.slice(1), filePathForCommand];
            } else if (commandParts.length > 1) {
                execArgs = [...commandParts.slice(1), tempFile];
            } else {
                execArgs = [tempFile];
            }
            
            const juliaProcess = spawn(baseCommand, execArgs, {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 300000, // 5 minute timeout
                shell: isWSL ? false : true
            });
            
            let output = '';
            let errorOutput = '';
            let startTime = Date.now();
            let outputBuffer = '';
            let lastUpdateTime = Date.now();
            
            // Function to update UI with buffered output (throttled)
            function updateOutput() {
                if (outputBuffer.length > 0) {
                    outputTextarea.value += outputBuffer;
                    outputBuffer = '';
                    outputTextarea.scrollTop = outputTextarea.scrollHeight;
                }
            }
            
            juliaProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                outputBuffer += text;
                
                // Update UI every 100ms to prevent freezing
                const now = Date.now();
                if (now - lastUpdateTime > 100) {
                    updateOutput();
                    lastUpdateTime = now;
                    
                    // Update status with progress indication
                    const elapsed = ((now - startTime) / 1000).toFixed(1);
                    document.getElementById('status').innerHTML = `Calculation running... (${elapsed}s)`;
                }
            });
            
            juliaProcess.stderr.on('data', (data) => {
                const text = data.toString();
                errorOutput += text;
                
                // Only show actual errors in STDERR, not just warnings
                if (text.toLowerCase().includes('error') || text.toLowerCase().includes('exception')) {
                    outputTextarea.value += `\n[ERROR] ${text}`;
                } else {
                    outputTextarea.value += `[INFO] ${text}`;
                }
                outputTextarea.scrollTop = outputTextarea.scrollHeight;
            });
            
            juliaProcess.on('close', (code) => {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                
                // Clean up temporary file
                cleanupTempFile();
                outputTextarea.value += `\n--- Cleanup: Temporary file deleted ---\n`;
                
                if (code === 0) {
                    outputTextarea.value += `\n=== CALCULATION COMPLETED SUCCESSFULLY ===\nElapsed time: ${elapsed} seconds\nExit code: ${code}`;
                    document.getElementById('status').innerHTML = `Julia calculation completed successfully (${elapsed}s)`;
                } else {
                    outputTextarea.value += `\n=== CALCULATION FAILED ===\nElapsed time: ${elapsed} seconds\nExit code: ${code}\n\nCheck the output above for error details.`;
                    document.getElementById('status').innerHTML = `Julia calculation failed with exit code ${code}`;
                }
                outputTextarea.scrollTop = outputTextarea.scrollHeight;
            });
            
            juliaProcess.on('error', (error) => {
                // Clean up temporary file on error
                cleanupTempFile();
                
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                outputTextarea.value += `\n=== PROCESS ERROR ===\nElapsed time: ${elapsed} seconds\nError: ${error.message}\n\nTroubleshooting:\n- Check if Julia is properly installed\n- Verify the Julia command path in Settings\n- Ensure Julia has necessary permissions`;
                document.getElementById('status').innerHTML = `Julia process error: ${error.message}`;
                outputTextarea.scrollTop = outputTextarea.scrollHeight;
            });
        });
        
    } catch (error) {
        const isWSL = prefs.juliaCommand && prefs.juliaCommand.trim().toLowerCase().startsWith('wsl');
        const wslTroubleshooting = isWSL ? `\n\nWSL-specific troubleshooting:\n- Ensure WSL is installed and configured\n- Verify Julia is installed in your WSL distribution\n- Try running 'wsl julia --version' in Command Prompt/PowerShell\n- Make sure the WSL distribution has access to the temp directory\n- Consider using the full path to Julia in WSL (e.g., 'wsl /usr/local/bin/julia')` : '';
        
        outputTextarea.value = `=== EXECUTION ERROR ===\n${error.message}\n\nTroubleshooting:\n1. Install Julia from https://julialang.org/downloads/\n2. Add Julia to your system PATH or configure the correct path in Settings\n3. Current Julia command: "${prefs.juliaCommand}"\n4. Install ElemCo.jl package:\n   ${prefs.juliaCommand}> import Pkg; Pkg.add("ElemCo")\n5. Verify installation by running '${prefs.juliaCommand} --version' in terminal\n6. Ensure you have write permissions to temp directory${wslTroubleshooting}\n\nFor more help, see: https://docs.julialang.org/en/v1/manual/getting-started/`;
        document.getElementById('status').innerHTML = 'Julia execution failed - see output for troubleshooting';
    }
}

// Function to show instructions for browser environment
function showJuliaInstructions(juliaCode) {
    const outputTextarea = document.getElementById('julia-output');
    
    outputTextarea.value = `=== JLMol Browser Mode ===
Running calculations directly from the browser is not supported for security reasons.

OPTION 1: Use the Desktop Version
Download and install the JLMol desktop application which includes integrated Julia execution.

OPTION 2: Manual Execution
Follow these steps to run the calculation manually:

1. Install Julia (if not already installed):
   Download from: https://julialang.org/downloads/

2. Install ElemCo.jl package:
   Open Julia and run:
   julia> import Pkg; Pkg.add("ElemCo")

3. Copy the generated code below and save it to a file (e.g., calculation.jl):

--- BEGIN JULIA CODE ---
${juliaCode}
--- END JULIA CODE ---

4. Run the calculation:
   From command line: julia calculation.jl
   Or from Julia REPL: include("calculation.jl")

5. The results will be displayed in your Julia terminal.

For detailed documentation, visit: https://elem.co.il

Note: The desktop version of JLMol provides seamless Julia integration
and eliminates the need for manual steps.`;

    document.getElementById('status').innerHTML = 'Manual execution instructions provided';
}

// Function to clear calculation output
function clearJuliaOutput() {
    const outputTextarea = document.getElementById('julia-output');
    const outputSection = document.getElementById('julia-output-section');
    
    if (outputTextarea) {
        outputTextarea.value = '';
    }
    if (outputSection) {
        outputSection.style.display = 'none';
    }
    document.getElementById('status').innerHTML = 'Calculation output cleared';
}

