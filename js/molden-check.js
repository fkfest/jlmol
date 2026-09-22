// Consistency check for Molden files before they go to JSmol.
//
// Known producer bug: tblite (the g-xTB binary's molden writer) puts the
// valence electron count in the atomic-number column of [Atoms] (N 5, C 4,
// O 6). JSmol trusts that column over the element label, so the molecule
// shows up as boron/beryllium/carbon with garbled bonds. The check compares
// the column with the label and offers a fixed copy. A second, report-only
// check compares the MO coefficient count with the basis size, which is
// what goes wrong when [5D]/[7F] flags are missing.

const MOLDEN_ELEMENTS = ['X', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al',
    'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu',
    'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru',
    'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr',
    'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W',
    'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac',
    'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf',
    'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'];

function moldenElementNumber(label) {
    // Labels may carry an index or charge (C1, N_2, O-): symbol letters only.
    const m = /^([A-Za-z]{1,2})/.exec(label);
    if (!m) return 0;
    const sym = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    let z = MOLDEN_ELEMENTS.indexOf(sym);
    if (z < 0 && sym.length === 2) z = MOLDEN_ELEMENTS.indexOf(sym.charAt(0));
    return z < 0 ? 0 : z;
}

// Returns { issues: [{ message, fixable }], fixedText } -- fixedText is null
// when nothing fixable was found.
function checkMoldenFile(text) {
    const lines = text.split(/\r?\n/);
    const issues = [];
    let section = '';
    let wrongZ = 0;
    let firstWrong = '';
    const fixed = lines.slice();
    let cart = 0, sph = 0;          // basis size counted both ways
    let coeffCounts = new Set();    // coefficients per MO
    let inMO = false, count = 0, mos = 0;
    const flags = { '5d': false, '7f': false, '9g': false };
    const shellSize = { s: [1, 1], p: [3, 3], sp: [4, 4], d: [6, 5], f: [10, 7], g: [15, 9] };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const t = line.trim();
        if (t.startsWith('[')) {
            if (inMO && count > 0) { coeffCounts.add(count); mos++; }
            inMO = false;
            const tag = t.slice(1, t.indexOf(']')).toLowerCase();
            section = tag;
            if (tag in flags) flags[tag] = true;
            if (tag === '5d7f') { flags['5d'] = true; flags['7f'] = true; }
            if (tag === '5d10f') { flags['5d'] = true; }
            if (tag === 'mo') inMO = true;
            continue;
        }
        if (section === 'atoms') {
            const tok = t.split(/\s+/);
            if (tok.length >= 6) {
                const z = moldenElementNumber(tok[0]);
                const col = parseInt(tok[2], 10);
                if (z > 0 && col !== z) {
                    wrongZ++;
                    if (!firstWrong) firstWrong = `${tok[0]} listed as ${tok[2]} instead of ${z}`;
                    tok[2] = String(z);
                    fixed[i] = tok.join('  ');
                }
            }
        } else if (section === 'gto') {
            const m = /^(sp|[spdfg])\s+\d+/i.exec(t);
            if (m) {
                const sz = shellSize[m[1].toLowerCase()];
                cart += sz[0]; sph += sz[1];
            }
        } else if (section === 'mo') {
            if (/^(Sym|Ene|Spin|Occup)\s*=/i.test(t)) {
                if (/^Sym\s*=/i.test(t) && count > 0) { coeffCounts.add(count); mos++; count = 0; }
                if (/^Occup\s*=/i.test(t)) count = 0;
            } else if (/^\d+\s+[-+0-9.EeDd]+$/.test(t)) {
                count++;
            }
        }
    }
    if (inMO && count > 0) { coeffCounts.add(count); mos++; }

    if (wrongZ > 0) {
        issues.push({
            message: `${wrongZ} atom line(s) in [Atoms] carry an atomic number that contradicts the element label (${firstWrong}). JSmol uses the number, so elements, colours and bonds come out wrong.`,
            fixable: true,
        });
    }
    if (mos > 0 && cart > 0) {
        const useSph = flags['5d'];
        const expected = useSph ? sph : cart;
        const counts = [...coeffCounts];
        if (counts.length !== 1 || counts[0] !== expected) {
            const alt = useSph ? `${cart} for Cartesian` : `${sph} for spherical`;
            issues.push({
                message: `MO coefficient count (${counts.join(', ')}) does not match the basis size (${expected} for ${useSph ? 'spherical' : 'Cartesian'} d/f functions; ${alt}). Orbitals will be wrong. A missing [5D] flag is the usual cause.`,
                fixable: false,
            });
        }
    }
    return { issues, fixedText: wrongZ > 0 ? fixed.join('\n') : null };
}

// Modal: shows the issues; resolves with 'fix', 'fix-save' or 'asis'.
function showMoldenCheckDialog(fileName, result) {
    return new Promise((resolve) => {
        const existing = document.getElementById('moldenCheckOverlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'moldenCheckOverlay';
        const card = document.createElement('div');
        card.id = 'moldenCheckDialog';

        const header = document.createElement('div');
        header.className = 'update-dialog-header';
        const h3 = document.createElement('h3');
        h3.textContent = 'Molden file check';
        header.appendChild(h3);

        const body = document.createElement('div');
        body.className = 'update-dialog-body';
        const intro = document.createElement('div');
        intro.className = 'update-summary';
        intro.textContent = `${fileName} has problems:`;
        body.appendChild(intro);
        const list = document.createElement('ul');
        list.className = 'molden-check-issues';
        for (const issue of result.issues) {
            const li = document.createElement('li');
            li.textContent = issue.message + (issue.fixable ? '' : ' (not fixable here)');
            list.appendChild(li);
        }
        body.appendChild(list);

        const footer = document.createElement('div');
        footer.className = 'update-dialog-footer';
        const choose = (choice) => { overlay.remove(); resolve(choice); };
        const asIs = document.createElement('button');
        asIs.className = 'update-skip-button';
        asIs.textContent = 'Load as is';
        asIs.addEventListener('click', () => choose('asis'));
        footer.appendChild(asIs);
        if (result.fixedText !== null) {
            const fixSave = document.createElement('button');
            fixSave.className = 'update-later-button';
            fixSave.textContent = 'Fix, load and save…';
            fixSave.title = 'Load the corrected file and save a copy';
            fixSave.addEventListener('click', () => choose('fix-save'));
            footer.appendChild(fixSave);
            const fix = document.createElement('button');
            fix.className = 'update-download-button';
            fix.textContent = 'Fix and load';
            fix.addEventListener('click', () => choose('fix'));
            footer.appendChild(fix);
        }

        card.appendChild(header);
        card.appendChild(body);
        card.appendChild(footer);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
    });
}

// Offer the corrected text as a download (save dialog in the desktop app).
function saveFixedMolden(fileName, text) {
    const base = fileName.replace(/\.molden$/i, '');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}-fixed.molden`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkMoldenFile, moldenElementNumber };
}
