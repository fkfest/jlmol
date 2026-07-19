// Lightweight Julia syntax highlighting for the ElemCo.jl editors.
//
// Same overlay technique as the XYZ editor (js/xyz-editor.js): a transparent
// textarea sits on top of a backdrop <div> that renders the same text with
// colored token spans. Both share identical metrics (see .elemco-code-* in
// css/styles.css) so the highlighted text lines up exactly under the caret.

// Tokenize Julia into HTML with token spans. Order matters: strings and comments
// are matched before keywords so their contents aren't recolored.
function elcHighlightJulia(code) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const re = /("""[\s\S]*?"""|"(?:[^"\\]|\\.)*")|(#[^\n]*)|(@[A-Za-z_][\w!]*)|\b(function|end|begin|using|import|export|module|return|if|elseif|else|for|while|do|in|struct|mutable|const|let|global|local|quote|where)\b|\b(true|false|nothing|missing)\b|(\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(code)) !== null) {
        out += esc(code.slice(last, m.index));
        let cls = 'j-num';
        if (m[1]) cls = 'j-str';
        else if (m[2]) cls = 'j-com';
        else if (m[3]) cls = 'j-macro';
        else if (m[4]) cls = 'j-key';
        else if (m[5]) cls = 'j-lit';
        out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
        last = re.lastIndex;
    }
    out += esc(code.slice(last));
    return out;
}

// Native scrollbar thickness (0 on overlay-scrollbar platforms). Measured once.
let _elcScrollbarSize = null;
function elcScrollbarSize() {
    if (_elcScrollbarSize != null) return _elcScrollbarSize;
    _elcScrollbarSize = 0;
    try {
        const d = document.createElement('div');
        d.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll;';
        document.body.appendChild(d);
        _elcScrollbarSize = d.offsetWidth - d.clientWidth;
        document.body.removeChild(d);
    } catch (e) { _elcScrollbarSize = 0; }
    return _elcScrollbarSize;
}

// Wire a textarea + its backdrop/highlights so the overlay tracks edits & scroll.
// Exposes ta._elcHighlight() to refresh after programmatic value changes.
function elcWireHighlight(ta, backdrop, highlights) {
    // A textarea's scrollbars reserve space and shrink its client area, so it can
    // scroll further than the (scrollbar-less) backdrop — at the very bottom/right
    // the overlay would clamp short and the last line drifts. Pad the highlights by
    // the scrollbar thickness so both scroll ranges match exactly.
    const sb = elcScrollbarSize();
    if (sb > 0) { highlights.style.paddingBottom = sb + 'px'; highlights.style.paddingRight = sb + 'px'; }
    const refresh = () => { highlights.innerHTML = elcHighlightJulia(ta.value || ''); };
    const sync = () => { backdrop.scrollTop = ta.scrollTop; backdrop.scrollLeft = ta.scrollLeft; };
    ta.addEventListener('input', () => { refresh(); sync(); });
    ta.addEventListener('scroll', sync);
    // After a programmatic value change (e.g. generating the input) the textarea's
    // scroll position settles on a later frame, so an immediate sync can latch a
    // stale scrollTop and the overlay drifts. Re-sync on the next frame(s) too.
    ta._elcHighlight = () => {
        refresh();
        sync();
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(sync);
        setTimeout(sync, 0);
    };
    refresh();
}

// Build a fresh highlighted Julia editor. Returns { wrap, textarea }.
function elcMakeJuliaEditor(extraClass) {
    const wrap = document.createElement('div');
    wrap.className = 'elemco-code-wrap';
    const backdrop = document.createElement('div');
    backdrop.className = 'elemco-code-backdrop';
    const highlights = document.createElement('div');
    highlights.className = 'elemco-code-highlights';
    backdrop.appendChild(highlights);
    const ta = document.createElement('textarea');
    ta.className = 'elemco-code-input' + (extraClass ? ' ' + extraClass : '');
    ta._elcHl = true;
    wrap.appendChild(backdrop);
    wrap.appendChild(ta);
    elcWireHighlight(ta, backdrop, highlights);
    return { wrap, textarea: ta };
}

// Wrap an existing (already in-DOM) textarea in the highlight overlay in place.
function elcAttachJuliaHighlight(ta) {
    if (!ta || ta._elcHl || !ta.parentNode) return;
    ta._elcHl = true;
    const wrap = document.createElement('div');
    wrap.className = 'elemco-code-wrap';
    const backdrop = document.createElement('div');
    backdrop.className = 'elemco-code-backdrop';
    const highlights = document.createElement('div');
    highlights.className = 'elemco-code-highlights';
    backdrop.appendChild(highlights);
    ta.parentNode.insertBefore(wrap, ta);
    wrap.appendChild(backdrop);
    wrap.appendChild(ta);
    ta.classList.add('elemco-code-input');
    elcWireHighlight(ta, backdrop, highlights);
}

if (typeof window !== 'undefined') {
    window.elcHighlightJulia = elcHighlightJulia;
    window.elcMakeJuliaEditor = elcMakeJuliaEditor;
    window.elcAttachJuliaHighlight = elcAttachJuliaHighlight;
}
