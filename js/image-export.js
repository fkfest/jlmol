// Export the current view as an image, honouring the "Default export format"
// and "Export PNG with transparent background" preferences.
//
// JSmol renders the file itself: getProperty("image", "type=…") returns the
// base64 bytes of a JPG, PNG or PNGT (a PNG whose background colour is marked
// transparent through a tRNS chunk). Asking JSmol for PNG directly keeps the
// export lossless. The previous implementation took JSmol's default JPEG,
// drew it on a canvas and re-encoded it as PNG, so "molecule.png" was really
// a JPEG (artefacts included) and never transparent.
function exportImage() {
    try {
        const prefs = getPreferences();
        const format = prefs.exportFormat === 'jpg' ? 'jpg' : 'png';
        const transparent = format === 'png' && prefs.exportTransparentBackground !== false;
        if (transparent) {
            exportTransparentPng();
        } else {
            // Opaque exports always use a white background.
            const type = format === 'jpg' ? 'JPG' : 'PNG';
            deliverImage(captureImage(type, '[xffffff]'), format, false);
        }
    } catch (err) {
        setStatusText('Error exporting image: ' + err.message);
        console.error('Export error:', err);
    }
}

// Transparent PNG. JSmol's PNGT marks every pixel that has exactly the
// background colour as transparent, so keying on the real background punches
// holes wherever the picture itself contains that colour -- the specular
// highlight of a white hydrogen on the default white background, for
// instance. Instead, render the view once opaquely, collect the colours it
// uses, and key on the nearest colour to the user's background that does not
// occur in it. Edges still anti-alias towards (visually) the user's
// background, and nothing inside the molecule can match the key.
function exportTransparentPng() {
    const bg = currentBackground(getPreferences());
    const opaque = captureImage('PNG', bg);
    const img = new Image();
    img.onload = function () {
        try {
            const key = unusedColorNear(bg, img);
            deliverImage(captureImage('PNGT', key), 'png', true);
        } catch (err) {
            setStatusText('Error exporting image: ' + err.message);
            console.error('Export error:', err);
        }
    };
    img.onerror = function () {
        setStatusText('Error exporting image: could not decode the rendered PNG');
    };
    img.src = 'data:image/png;base64,' + opaque;
}

// Render the view on the given background and return JSmol's base64 bytes for
// `type` (JPG, PNG or PNGT). scriptWait runs synchronously, so the capture
// sees the requested background and the user's background is back before this
// returns.
function captureImage(type, background) {
    const originalBg = currentBackground(getPreferences());
    Jmol.scriptWait(jmolApplet0, `background ${background}`);
    let base64;
    try {
        base64 = Jmol.getPropertyAsString(jmolApplet0, 'image', `type=${type}`);
    } finally {
        Jmol.scriptWait(jmolApplet0, `background ${originalBg}`);
    }
    // JSmol returns an error message instead of image data on failure.
    const expectedPrefix = type === 'JPG' ? '/9j/' : 'iVBOR';
    if (typeof base64 !== 'string' || !base64.startsWith(expectedPrefix)) {
        throw new Error(`JSmol did not return a ${type} image` +
            (base64 ? `: ${String(base64).slice(0, 100)}` : ''));
    }
    return base64;
}

function deliverImage(base64, format, transparent) {
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    downloadImage(`data:${mime};base64,${base64}`, `molecule.${format}`, format, transparent);
}

// Current viewer background as a JSmol colour literal, e.g. "[xffffff]".
// Falls back to the background preference (and then to white) if JSmol does
// not answer, so the restore after a capture never leaves the viewer in an
// undefined state.
function currentBackground(prefs) {
    let bg = null;
    try {
        bg = Jmol.evaluateVar(jmolApplet0, 'backgroundColor');
    } catch (e) {
        console.warn('Could not read JSmol background colour:', e);
    }
    if (typeof bg === 'string' && /^\[x[0-9a-f]{6}\]$/i.test(bg)) return bg.toLowerCase();
    if (prefs && /^#[0-9a-f]{6}$/i.test(prefs.bgColor || '')) return '[x' + prefs.bgColor.slice(1).toLowerCase() + ']';
    return '[xffffff]';
}

// The colour closest to `bgLiteral` ("[xrrggbb]") that does not occur in the
// rendered image, searched outwards one step per channel at a time. Falls back
// to the background itself (plain PNGT behaviour) if everything nearby is in
// use.
function unusedColorNear(bgLiteral, img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const used = new Set();
    for (let i = 0; i < data.length; i += 4) {
        used.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    }
    const base = [0, 2, 4].map(i => parseInt(bgLiteral.slice(2 + i, 4 + i), 16));
    for (let d = 1; d <= 16; d++) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dg = -1; dg <= 1; dg++) {
                for (let db = -1; db <= 1; db++) {
                    if (!dr && !dg && !db) continue;
                    const c = [base[0] + d * dr, base[1] + d * dg, base[2] + d * db];
                    if (c.some(v => v < 0 || v > 255)) continue;
                    const rgb = (c[0] << 16) | (c[1] << 8) | c[2];
                    if (!used.has(rgb)) return '[x' + rgb.toString(16).padStart(6, '0') + ']';
                }
            }
        }
    }
    return bgLiteral;
}

// Helper function to handle the actual download
function downloadImage(imageData, filename, format, transparent) {
    // Create a temporary link element
    var link = document.createElement('a');
    link.href = imageData;
    link.download = filename;
    
    // This is required for Firefox
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    
    // Small delay before removing the link to ensure the download starts
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
    
    const transparencyNote = (format === 'png' && transparent) ? ' with transparent background' : '';
    setStatusText(`${format.toUpperCase()} image exported successfully${transparencyNote}`);
}
