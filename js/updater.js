// Update checker for the jlmol desktop app.
//
// jlmol is distributed as unsigned installers on GitHub Releases
// (Windows .exe, macOS .dmg, Linux .deb/.rpm/.AppImage). Because the app is
// unsigned and ships package formats that can't be updated in-place (.deb/.rpm),
// we do NOT attempt a silent in-app auto-install. Instead we:
//   1. Ask GitHub for the latest published release.
//   2. Compare its version to the running version (window.appVersion).
//   3. If newer, show a dialog and — only if the user agrees — open the
//      appropriate installer / release page in their browser to install manually.
//
// Two entry points:
//   - initUpdateChecker(): quiet check shortly after startup (respects the
//     "check on startup" preference and any version the user chose to skip).
//   - checkForUpdates({ silent }): the actual check. silent=false is the manual
//     "Check for updates" button in Settings, which always reports a result.
//
// The whole feature is inert in the browser build (app.jlmol.com): there is
// nothing to "install" there, so isElectronApp() gates every network call.

const JLMOL_GITHUB_REPO = 'fkfest/jlmol';
const JLMOL_LATEST_RELEASE_API = `https://api.github.com/repos/${JLMOL_GITHUB_REPO}/releases/latest`;
const JLMOL_RELEASES_PAGE = `https://github.com/${JLMOL_GITHUB_REPO}/releases/latest`;
const JLMOL_SKIPPED_VERSION_KEY = 'jlmol-skipped-update-version';

// Guard so the automatic startup check only ever fires once per session.
let jlmolStartupCheckDone = false;

// True only inside the packaged Electron app (where an install can actually
// happen). In a normal browser tab this stays false and the feature is disabled.
function isElectronApp() {
    return !!(window.jlmolNative && window.jlmolNative.isElectron);
}

// "v1.4.0" / "1.4.0-beta" -> [1, 4, 0]. Non-numeric suffixes on a component
// (e.g. "0-beta") are reduced to their leading integer; missing pieces are 0.
function parseVersion(v) {
    return String(v == null ? '' : v)
        .trim()
        .replace(/^v/i, '')
        .split('.')
        .map(part => parseInt(part, 10) || 0);
}

// Numeric, component-wise semver-ish compare. Returns 1 if a>b, -1 if a<b, 0 if
// equal. Handles differing lengths (1.4 vs 1.4.0) and large minors (1.10 > 1.9).
function compareVersions(a, b) {
    const A = parseVersion(a);
    const B = parseVersion(b);
    const len = Math.max(A.length, B.length);
    for (let i = 0; i < len; i++) {
        const x = A[i] || 0;
        const y = B[i] || 0;
        if (x > y) return 1;
        if (x < y) return -1;
    }
    return 0;
}

// The version this build reports (injected by main.js as window.appVersion, or
// loaded from package.json in the browser build).
function getCurrentVersion() {
    return (typeof window !== 'undefined' && window.appVersion) || 'unknown';
}

// Pick the best URL to send the user to for a given release. On Windows/macOS
// there is exactly one installer format, so we can deep-link straight to it; on
// Linux several formats ship (.deb/.rpm/.AppImage) so we send them to the
// release page to choose. Falls back to the release page whenever unsure.
function pickDownloadUrl(release) {
    const page = (release && release.html_url) || JLMOL_RELEASES_PAGE;
    const assets = (release && Array.isArray(release.assets)) ? release.assets : [];

    const platform = (window.jlmolNative && window.jlmolNative.platform) || '';

    const findAsset = (suffix) => {
        const match = assets.find(a =>
            a && typeof a.name === 'string' &&
            a.name.toLowerCase().endsWith(suffix) &&
            typeof a.browser_download_url === 'string' &&
            a.browser_download_url.startsWith('https://'));
        return match ? match.browser_download_url : null;
    };

    if (platform === 'win32') return findAsset('.exe') || page;
    if (platform === 'darwin') return findAsset('.dmg') || page;
    // Linux (deb/rpm/AppImage are ambiguous) and anything else: the release page.
    return page;
}

// Open an external URL in the user's default browser. Only https URLs are
// allowed -- never hand an arbitrary scheme (file:, javascript:) onward.
// The preload bridge validates the scheme again in the main process.
function openExternalUrl(url) {
    if (typeof url !== 'string' || !url.startsWith('https://')) {
        console.warn('Refusing to open non-https update URL:', url);
        return;
    }
    if (window.jlmolNative) {
        window.jlmolNative.openExternal(url).catch((e) =>
            console.error('Could not open update URL:', e));
        return;
    }
    // Not in Electron -- fall back to a normal window.
    try {
        window.open(url, '_blank', 'noopener');
    } catch (e2) {
        console.error('Could not open update URL:', e2);
    }
}

// Small helper for the manual-check result line in Settings.
function setUpdateCheckResult(message, isError) {
    const el = document.getElementById('update-check-result');
    if (!el) return;
    el.textContent = message || '';
    el.style.color = isError ? '#c0392b' : '#2e7d32';
}

// Fetch the latest release from GitHub and decide what to do.
//   silent === true  -> automatic startup check: only speak up if there is an
//                        update the user hasn't chosen to skip.
//   silent === false -> manual check: always report (up to date / error / update).
async function checkForUpdates(options) {
    const opts = options || {};
    const silent = !!opts.silent;

    if (!isElectronApp()) {
        if (!silent) {
            setUpdateCheckResult('Update checks are only available in the desktop app.', false);
        }
        return;
    }

    if (!silent) setUpdateCheckResult('Checking for updates…', false);

    let release;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(JLMOL_LATEST_RELEASE_API, {
            method: 'GET',
            headers: { 'Accept': 'application/vnd.github+json' },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`GitHub API responded ${response.status}`);
        }
        release = await response.json();
    } catch (error) {
        console.warn('Update check failed:', error);
        if (!silent) {
            setUpdateCheckResult('Could not check for updates (network error). Please try again later.', true);
        }
        return;
    }

    const latestTag = release && release.tag_name;
    if (!latestTag) {
        if (!silent) setUpdateCheckResult('Could not determine the latest version.', true);
        return;
    }

    const current = getCurrentVersion();
    // Never present an update when we don't reliably know the running version
    // (e.g. window.appVersion ended up 'unknown'): parseVersion('unknown') is [0],
    // which would make every real release look newer and nag about a version the
    // user already has.
    if (current === 'unknown' || !parseVersion(current).some(n => n > 0)) {
        console.warn('Skipping update check: current version is unknown.');
        if (!silent) setUpdateCheckResult('Could not determine your current version.', true);
        return;
    }
    const isNewer = compareVersions(latestTag, current) > 0;

    if (!isNewer) {
        console.log(`jlmol is up to date (running ${current}, latest ${latestTag}).`);
        if (!silent) {
            setUpdateCheckResult(`You're on the latest version (v${parseVersion(current).join('.')}).`, false);
        }
        return;
    }

    // A newer release exists. On the silent startup check, honor a version the
    // user previously chose to skip; a manual check always shows it.
    if (silent) {
        let skipped = null;
        try {
            skipped = localStorage.getItem(JLMOL_SKIPPED_VERSION_KEY);
        } catch (e) {
            skipped = null;
        }
        if (skipped && compareVersions(skipped, latestTag) >= 0) {
            console.log(`Update ${latestTag} available but skipped by user.`);
            return;
        }
    } else {
        setUpdateCheckResult(`Update available: v${parseVersion(latestTag).join('.')}`, false);
    }

    showUpdateAvailableModal(release, current);
}

// Build and show the in-page "update available" dialog. Untrusted strings from
// the GitHub API (release name / notes) are inserted with textContent only.
function showUpdateAvailableModal(release, currentVersion) {
    // Remove a previous instance so repeated checks don't stack dialogs.
    const existing = document.getElementById('updateOverlay');
    if (existing) existing.remove();

    const latestTag = release.tag_name;
    const latestLabel = 'v' + parseVersion(latestTag).join('.');
    const currentLabel = 'v' + parseVersion(currentVersion).join('.');
    const downloadUrl = pickDownloadUrl(release);
    const releasePage = (release && release.html_url) || JLMOL_RELEASES_PAGE;

    const overlay = document.createElement('div');
    overlay.id = 'updateOverlay';

    const card = document.createElement('div');
    card.id = 'updateDialog';

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'update-dialog-header';
    header.innerHTML = '<h3>🔄 Update available</h3>';

    // --- Body ---
    const body = document.createElement('div');
    body.className = 'update-dialog-body';

    const summary = document.createElement('p');
    summary.className = 'update-summary';
    summary.textContent = `A new version of jlmol is available: ${latestLabel} (you have ${currentLabel}).`;
    body.appendChild(summary);

    // Release notes, if any — plain text, never rendered as HTML.
    const notes = (release && typeof release.body === 'string') ? release.body.trim() : '';
    if (notes) {
        const notesLabel = document.createElement('div');
        notesLabel.className = 'update-notes-label';
        notesLabel.textContent = "What's new:";
        body.appendChild(notesLabel);

        const pre = document.createElement('pre');
        pre.className = 'update-notes';
        // Cap very long release notes so the dialog stays manageable.
        pre.textContent = notes.length > 2000 ? notes.slice(0, 2000) + '\n…' : notes;
        body.appendChild(pre);
    }

    const link = document.createElement('a');
    link.className = 'update-releasepage-link';
    link.textContent = 'View release notes on GitHub';
    link.href = '#';
    link.addEventListener('click', (e) => {
        e.preventDefault();
        openExternalUrl(releasePage);
    });
    body.appendChild(link);

    // --- Footer buttons ---
    const footer = document.createElement('div');
    footer.className = 'update-dialog-footer';

    // Escape closes the dialog. The keydown listener is registered here and torn
    // down by closeOverlay(), so every dismissal path (buttons, backdrop, Escape)
    // cleans it up — otherwise repeated checks would leak listeners on document.
    const onKey = (e) => {
        if (e.key === 'Escape') closeOverlay();
    };
    const closeOverlay = () => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
    };
    document.addEventListener('keydown', onKey);

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'update-download-button';
    downloadBtn.textContent = 'Download update';
    downloadBtn.addEventListener('click', () => {
        openExternalUrl(downloadUrl);
        closeOverlay();
    });

    const laterBtn = document.createElement('button');
    laterBtn.className = 'update-later-button';
    laterBtn.textContent = 'Later';
    laterBtn.addEventListener('click', closeOverlay);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'update-skip-button';
    skipBtn.textContent = 'Skip this version';
    skipBtn.title = "Don't remind me about this version again";
    skipBtn.addEventListener('click', () => {
        try {
            localStorage.setItem(JLMOL_SKIPPED_VERSION_KEY, latestTag);
        } catch (e) {
            console.warn('Could not persist skipped version:', e);
        }
        closeOverlay();
    });

    footer.appendChild(skipBtn);
    footer.appendChild(laterBtn);
    footer.appendChild(downloadBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    overlay.appendChild(card);

    // Dismiss (as "Later") on backdrop click.
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
    });

    document.body.appendChild(overlay);
}

// Called once during app startup. Runs the quiet check a few seconds after
// launch (so it never competes with JSmol/UI initialization) if the user hasn't
// turned it off in preferences.
function initUpdateChecker() {
    if (jlmolStartupCheckDone) return;
    jlmolStartupCheckDone = true;

    if (!isElectronApp()) return;

    let enabled = true;
    try {
        if (typeof getPreferences === 'function') {
            enabled = getPreferences().checkUpdatesOnStartup !== false;
        }
    } catch (e) {
        enabled = true;
    }
    if (!enabled) return;

    setTimeout(() => {
        checkForUpdates({ silent: true });
    }, 4000);
}
