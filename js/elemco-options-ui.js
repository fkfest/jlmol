// ElemCo.jl options browser — renders a searchable, grouped, typed editor for
// ElemCo.jl calculation options into a mount element. It reads the generated
// metadata (window.ELEMCO_OPTIONS) for names/types/defaults/descriptions and
// writes changed-from-default values into an option "bag" ({group:{name:value}})
// owned by the caller (a step, or the global settings). Helpers such as
// elcEl / optionMeta / setBagOption / formatJuliaValue live in js/elemco.js.

// Unique across every widget so multiple simultaneously-open browsers (e.g. two
// open step cards) never collide on a DOM id / label association.
var elcWidgetSeq = 0;

// Build the widget for a single option. Returns { el, id, reset }.
function elcBuildWidget(group, meta, bag, onChange) {
    const id = `elc-${group}-${meta.name}-${elcWidgetSeq++}`;
    const eff = () => optionEffectiveValue(bag, group, meta.name);
    const commit = (val) => { setBagOption(bag, group, meta.name, val); onChange(); };
    let el, reset;

    switch (meta.widget) {
        case 'bool': {
            el = elcEl('input', { type: 'checkbox', id });
            el.checked = !!eff();
            el.addEventListener('change', () => commit(el.checked));
            reset = () => { el.checked = !!meta.default; };
            break;
        }
        case 'int':
        case 'float': {
            el = elcEl('input', { type: 'number', id, class: 'elemco-opt-input' });
            if (meta.widget === 'float') el.step = 'any';
            el.value = eff();
            el.addEventListener('input', () => {
                const raw = el.value.trim();
                if (raw === '') { commit(undefined); return; }
                const num = meta.widget === 'int' ? parseInt(raw, 10) : parseFloat(raw);
                if (!isNaN(num)) commit(num);
            });
            reset = () => { el.value = meta.default; };
            break;
        }
        case 'symbol': {
            if (meta.choices && meta.choices.length >= 2) {
                el = elcEl('select', { id, class: 'elemco-opt-input' });
                meta.choices.forEach((c) => el.appendChild(elcEl('option', { value: c }, c)));
                el.value = eff();
                el.addEventListener('change', () => commit(el.value));
                reset = () => { el.value = meta.default; };
            } else {
                el = elcEl('input', { type: 'text', id, class: 'elemco-opt-input' });
                el.value = eff() != null ? eff() : '';
                el.addEventListener('input', () => { const v = el.value.trim(); commit(v === '' ? undefined : v); });
                reset = () => { el.value = meta.default != null ? meta.default : ''; };
            }
            break;
        }
        case 'vector-int':
        case 'vector-float': {
            el = elcEl('input', { type: 'text', id, class: 'elemco-opt-input', placeholder: 'comma-separated' });
            el.value = (eff() || []).join(', ');
            el.addEventListener('input', () => {
                const raw = el.value.trim();
                if (raw === '') { commit([]); return; }
                const parts = raw.split(',').map((s) => s.trim()).filter((s) => s !== '');
                const nums = parts.map((p) => meta.widget === 'vector-int' ? parseInt(p, 10) : parseFloat(p));
                if (!nums.some(isNaN)) commit(nums);
            });
            reset = () => { el.value = (meta.default || []).join(', '); };
            break;
        }
        case 'string':
        default: {
            el = elcEl('input', { type: 'text', id, class: 'elemco-opt-input' });
            el.value = eff() != null ? eff() : '';
            el.addEventListener('input', () => { commit(el.value); });
            reset = () => { el.value = meta.default != null ? meta.default : ''; };
            break;
        }
    }
    return { el, id, reset };
}

function elcOptionTooltip(meta) {
    const def = meta.defaultDoc != null ? meta.defaultDoc : meta.defaultLiteral;
    let t = meta.desc || '';
    t += `\n\n(type ${meta.type}, default ${def})`;
    return t.trim();
}

// One option row: name (hover = description), typed widget, default hint, reset.
function elcBuildOptionRow(group, meta, bag, afterChange) {
    const row = elcEl('div', { class: 'elemco-opt-row' });
    row.dataset.hay = (meta.name + ' ' + (meta.desc || '')).toLowerCase();
    const tip = elcOptionTooltip(meta);

    const nameEl = elcEl('label', { class: 'elemco-opt-name', title: tip }, meta.name);
    const widgetWrap = elcEl('span', { class: 'elemco-opt-widget' });
    const defHint = elcEl('span', { class: 'elemco-opt-default', title: tip }, 'def: ' + (meta.defaultDoc != null ? meta.defaultDoc : meta.defaultLiteral));
    const resetBtn = elcEl('button', { type: 'button', class: 'elemco-opt-reset', title: 'Reset to default' }, '×');

    const syncModified = () => {
        const mod = bagHasOption(bag, group, meta.name);
        row.classList.toggle('elemco-opt-modified', mod);
        resetBtn.style.display = mod ? '' : 'none';
    };
    const widget = elcBuildWidget(group, meta, bag, () => { syncModified(); afterChange(); });
    widgetWrap.appendChild(widget.el);
    nameEl.htmlFor = widget.id;
    resetBtn.addEventListener('click', () => {
        setBagOption(bag, group, meta.name, undefined);
        widget.reset();
        syncModified();
        afterChange();
    });

    row.appendChild(nameEl);
    row.appendChild(widgetWrap);
    row.appendChild(defHint);
    row.appendChild(resetBtn);
    syncModified();
    return row;
}

// Render the full browser: a filter box plus one collapsible section per option
// group. Primary groups (relevant to the method) are expanded; the remaining
// groups follow, collapsed, so every one of ElemCo.jl's options stays reachable.
function renderOptionsBrowserInto(mount, primaryGroups, bag, afterChange, opts) {
    opts = opts || {};
    mount.innerHTML = '';
    const data = (typeof window !== 'undefined' && window.ELEMCO_OPTIONS) || null;
    if (!data) {
        mount.appendChild(elcEl('div', { class: 'preview-note' }, 'ElemCo.jl options metadata not loaded.'));
        return;
    }
    const exclude = opts.exclude || {};

    const search = elcEl('input', { type: 'text', class: 'elemco-opt-search', placeholder: 'Filter options by name or description…' });
    mount.appendChild(search);

    const groupsWrap = elcEl('div', { class: 'elemco-opt-groups' });
    mount.appendChild(groupsWrap);

    const primary = (primaryGroups || []).filter((g) => data.groups[g]);
    const rest = data.groupOrder.filter((g) => !primary.includes(g));

    const addGroup = (group, expanded) => {
        const gmeta = data.groups[group];
        if (!gmeta) return;
        const skip = exclude[group] || [];
        const names = Object.keys(gmeta.fields).filter((n) => skip.indexOf(n) < 0);
        if (names.length === 0) return;

        const sec = elcEl('div', { class: 'elemco-opt-group' });
        const body = elcEl('div', { class: 'elemco-opt-group-body' });
        body.style.display = expanded ? 'block' : 'none';

        const caret = elcEl('span', { class: 'elemco-caret' }, expanded ? '▾' : '▸');
        const countBadge = elcEl('span', { class: 'elemco-opt-group-count' }, '');
        const header = elcEl('button', { type: 'button', class: 'elemco-opt-group-head' }, [
            caret,
            elcEl('span', { class: 'elemco-opt-group-title', title: gmeta.summary || '' }, `${gmeta.label} (${group})`),
            countBadge,
        ]);
        const updateCount = () => {
            const c = names.filter((n) => bagHasOption(bag, group, n)).length;
            countBadge.textContent = c ? `${c} set` : '';
        };
        header.addEventListener('click', () => {
            const open = body.style.display === 'none';
            body.style.display = open ? 'block' : 'none';
            caret.textContent = open ? '▾' : '▸';
        });

        names.forEach((name) => {
            body.appendChild(elcBuildOptionRow(group, gmeta.fields[name], bag, () => { updateCount(); afterChange(); }));
        });
        updateCount();

        sec.appendChild(header);
        sec.appendChild(body);
        groupsWrap.appendChild(sec);
    };

    // Everything starts collapsed — some groups (e.g. cc has 45 options) are long,
    // so a compact list of group headers is friendlier. The filter box and the
    // group headers expand what the user actually wants.
    primary.forEach((g) => addGroup(g, false));
    if (rest.length) {
        groupsWrap.appendChild(elcEl('div', { class: 'elemco-opt-divider' }, 'All option groups'));
        rest.forEach((g) => addGroup(g, false));
    }

    // Filtering: show only rows matching the query and auto-expand their groups.
    search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        groupsWrap.querySelectorAll('.elemco-opt-group').forEach((sec) => {
            let anyVisible = false;
            sec.querySelectorAll('.elemco-opt-row').forEach((row) => {
                const vis = !q || row.dataset.hay.indexOf(q) >= 0;
                row.style.display = vis ? '' : 'none';
                if (vis) anyVisible = true;
            });
            const body = sec.querySelector('.elemco-opt-group-body');
            const caret = sec.querySelector('.elemco-caret');
            if (q) {
                body.style.display = anyVisible ? 'block' : 'none';
                if (caret) caret.textContent = anyVisible ? '▾' : '▸';
                sec.style.display = anyVisible ? '' : 'none';
            } else {
                sec.style.display = '';
            }
        });
    });
}

if (typeof window !== 'undefined') {
    window.renderOptionsBrowserInto = renderOptionsBrowserInto;
}
