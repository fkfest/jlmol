const { app, BrowserWindow, shell, ipcMain, protocol } = require('electron')

// --- smoke mode ------------------------------------------------------------
// `electron . --smoke` boots the app, waits for the JSmol applet to reach
// _ready (the same flag the app itself trusts, js/molecule-data.js), and
// exits 0 (SMOKE OK) or 1 (SMOKE FAIL). Any renderer console line carrying an
// error signature fails the run regardless of log level -- the criteria are
// distilled from the 2026-08-22 electron-41 verification, which caught a real
// regression (JSmol _evaluate TypeErrors) within a minute of Xvfb runtime.
const SMOKE = process.argv.includes('--smoke');
// `electron . --bridge-probe` boots the app and exercises the preload bridge
// end to end -- work-dir file roundtrip, path-escape rejection, spawn with
// streamed output -- printing BRIDGE OK/FAIL. The CI runs it beside --smoke,
// so a change to the preload surface or the IPC handlers cannot pass silently.
const BRIDGE_PROBE = process.argv.includes('--bridge-probe');
const SMOKE_TIMEOUT_MS = 30000;
const SMOKE_ERROR_RE = /Uncaught|TypeError|ReferenceError|is not defined|FATAL/;
// Network unavailability is not app ill-health: the update check may fail on
// an offline or rate-limited runner, and its console line contains
// "TypeError: Failed to fetch" -- the one observed flake in an otherwise
// deterministic gate.
const SMOKE_IGNORE_RE = /Failed to fetch|net::ERR|ERR_INTERNET|rate limit/i;
const path = require('path')
const fs = require('fs')
const { version } = require('./package.json')

// Console verbosity. A full log file (jsmol.log in userData) is ALWAYS kept for
// troubleshooting; this flag only controls how much is echoed to the terminal.
// Quiet by default; enable with `--verbose` / `--debug` or JLMOL_DEBUG=1
// (e.g. `npm run start-verbose`).
const VERBOSE_LOGGING = process.argv.includes('--verbose')
    || process.argv.includes('--debug')
    || process.env.JLMOL_DEBUG === '1'
    || process.env.JLMOL_VERBOSE === '1';

// Silence Chromium's own noisy GPU/init messages on the terminal unless logging
// was explicitly requested (the start-debug script passes --enable-logging).
if (!VERBOSE_LOGGING && !process.argv.includes('--enable-logging')) {
    app.commandLine.appendSwitch('log-level', '3'); // 3 = fatal only
}

// The app is served over app:// instead of raw file:// (see createWindow):
// a standard privileged scheme gives every platform the same origin, keeps
// webSecurity meaningful, and removes file-URL semantics (incl. hostful UNC
// origins) from the picture entirely. NB the CONFIRMED root cause of the
// 2026-08-22 empty-window-from-WSL episode was the renderer SANDBOX being
// unable to read a UNC bundle path (see webPreferences.sandbox below); a
// hostful-file-origin webSecurity effect was theorized but never confirmed.
protocol.registerSchemesAsPrivileged([{
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
}]);

// Add command line switches for stability on Windows 11.
// NOTE disable-gpu-sandbox must stay unconditional: gating it behind safe
// mode was tried (2026-08-22) and broke JSmol applet initialization on
// GPU-less environments (_evaluate TypeErrors) -- it is load-bearing for
// JSmol, not only a Windows 11 workaround.
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// Enhanced GPU debugging for Windows 11
if (process.platform === 'win32') {
    app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');
    app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
    app.commandLine.appendSwitch('disable-accelerated-jpeg-decoding');
    app.commandLine.appendSwitch('disable-accelerated-mjpeg-decode');
    app.commandLine.appendSwitch('disable-accelerated-video-decode');
}

// Check for specific GPU-related flags from command line
if (process.argv.includes('--disable-hardware-acceleration')) {
    app.disableHardwareAcceleration();
    console.log('Hardware acceleration disabled via command line');
}

// Enhanced logging with system info
const logFile = path.join(app.getPath('userData'), 'jsmol.log');
function log(message) {
    const timestamp = new Date().toISOString();
    const memUsage = process.memoryUsage();
    const logEntry = `${timestamp}: ${message} [Memory: RSS=${Math.round(memUsage.rss/1024/1024)}MB, Heap=${Math.round(memUsage.heapUsed/1024/1024)}MB]\n`;
    try {
        fs.appendFileSync(logFile, logEntry);
    } catch (e) {
        // Ignore log-file write errors so logging never breaks the app.
    }
    if (VERBOSE_LOGGING) {
        console.log(logEntry.trim());
    }
}

// Clear log file
fs.writeFileSync(logFile, '');
log('Application starting');
log('Working directory: ' + process.cwd());
log('Args: ' + JSON.stringify(process.argv));

let fileContent = null;

function getFileFromArgs() {
    const args = process.argv;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg.includes('electron') && !arg.endsWith('.exe')) {
            log('Found potential file arg: ' + arg);
            
            // For installed version, just use the current working directory
            const filePath = path.resolve(process.cwd(), arg);
            log('Trying path: ' + filePath);
            
            if (fs.existsSync(filePath)) {
                log('Found file at: ' + filePath);
                return filePath;
            }
            log('File not found: ' + filePath);
        }
    }
    return null;
}

const fileArg = getFileFromArgs();
if (fileArg) {
    try {
        fileContent = fs.readFileSync(fileArg, 'utf8');
        log('File loaded successfully, size: ' + fileContent.length);
    } catch (error) {
        log('Error reading file: ' + error.toString());
    }
}

// --- IPC backend for the preload bridge (issue #45, item 3) ---------------
// Work directories: created here, addressed by opaque tokens, every file
// operation resolved against the registered directory and refused on any
// path that escapes it. Processes: spawned here, streamed to the renderer,
// killed on demand and reaped on quit.
const fsNative = require('fs');
const osNative = require('os');
const crypto = require('crypto');
const { spawn: spawnNative } = require('child_process');

const workDirs = new Map();   // token -> absolute path under os.tmpdir()
const procs = new Map();      // procId -> ChildProcess

function resolveInWorkDir(dirToken, name) {
    const dir = workDirs.get(dirToken);
    if (!dir) throw new Error('unknown work directory');
    const target = path.resolve(dir, String(name));
    if (target !== dir && !target.startsWith(dir + path.sep)) {
        throw new Error('path escapes the work directory');
    }
    return target;
}

ipcMain.handle('jlmol-open-external', (_e, url) => {
    if (typeof url === 'string'
        && (url.startsWith('https://') || url.startsWith('http://'))) {
        return shell.openExternal(url);
    }
    throw new Error('only http(s) URLs may be opened externally');
});

ipcMain.handle('jlmol-mk-workdir', (_e, prefix) => {
    const safe = String(prefix || 'jlmol_').replace(/[^A-Za-z0-9_-]/g, '_');
    const dir = fsNative.mkdtempSync(path.join(osNative.tmpdir(), safe));
    const token = crypto.randomUUID();
    workDirs.set(token, dir);
    return token;
});
ipcMain.handle('jlmol-workdir-path', (_e, token) => {
    const dir = workDirs.get(token);
    if (!dir) throw new Error('unknown work directory');
    return dir;
});
ipcMain.handle('jlmol-write-file', (_e, token, name, content) => {
    fsNative.writeFileSync(resolveInWorkDir(token, name), String(content));
});
ipcMain.handle('jlmol-read-file', (_e, token, name) => {
    const target = resolveInWorkDir(token, name);
    if (!fsNative.existsSync(target)) return null;
    return fsNative.readFileSync(target, 'utf8');
});
ipcMain.handle('jlmol-rm-workdir', (_e, token) => {
    const dir = workDirs.get(token);
    if (!dir) return;
    workDirs.delete(token);
    try { fsNative.rmSync(dir, { recursive: true, force: true }); }
    catch (err) { log(`Could not remove work dir ${dir}: ${err.message}`); }
});

ipcMain.handle('jlmol-spawn', (event, command, args, options) => {
    // shell:false always -- the old renderer spawns used shell:true on
    // non-WSL, which let shell metacharacters in user-entered extra flags
    // reach a shell. Plain PATH lookup covers the legitimate cases.
    const opts = { shell: false };
    if (options && options.cwd) {
        const dir = workDirs.get(options.cwd);
        if (!dir) throw new Error('unknown work directory for spawn cwd');
        opts.cwd = dir;
    }
    // child_process.spawn DOES enforce `timeout` (Node >= 15.13; measured:
    // sleep 30 with timeout 800 is SIGTERMed after ~808 ms). On timeout the
    // close event carries code null + the signal, surfaced as a notice below.
    if (options && options.timeoutMs > 0) opts.timeout = Number(options.timeoutMs);
    const child = spawnNative(String(command), (args || []).map(String), opts);
    const procId = crypto.randomUUID();
    procs.set(procId, child);
    const wc = event.sender;
    const send = (type, payload) => {
        if (!wc.isDestroyed()) wc.send('jlmol-proc-event', procId, type, payload);
    };
    child.stdout && child.stdout.on('data', (d) => send('stdout', d.toString()));
    child.stderr && child.stderr.on('data', (d) => send('stderr', d.toString()));
    child.on('error', (err) => { procs.delete(procId); send('error', err.message); });
    child.on('close', (code, signal) => {
        procs.delete(procId);
        if (code === null && signal) {
            send('stderr', `[process terminated by ${signal} (timeout or kill)]\n`);
        }
        send('close', code);
    });
    return procId;
});
ipcMain.handle('jlmol-kill', (_e, procId) => {
    const child = procs.get(procId);
    if (child) { try { child.kill(); } catch (_) { /* already gone */ } }
});

app.on('will-quit', () => {
    for (const child of procs.values()) { try { child.kill(); } catch (_) {} }
    for (const dir of workDirs.values()) {
        try { fsNative.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
    }
});

function runBridgeProbe(win) {
    win.webContents.once('did-finish-load', () => {
        win.webContents.executeJavaScript(`(async () => {
            const n = window.jlmolNative;
            if (!n) return 'no bridge';
            const dir = await n.mkWorkDir('jlmol_probe_');
            await n.writeFile(dir, 'x.txt', 'roundtrip');
            const back = await n.readFile(dir, 'x.txt');
            let escape = 'not caught';
            try { await n.readFile(dir, '../escape.txt'); } catch (e) { escape = 'caught'; }
            await n.removeWorkDir(dir);
            const spawnResult = await new Promise((res) => {
                let text = '';
                n.spawn('echo', ['bridge-echo'], {}, {
                    data: (k, t) => { text += t; },
                    close: (code) => res(code === 0 && text.includes('bridge-echo')
                        ? 'spawn ok' : 'spawn failed ' + code + ' ' + text),
                    error: (m) => res('spawn error ' + m),
                });
            });
            return [back === 'roundtrip' ? 'file ok' : 'file bad',
                    'escape ' + escape, spawnResult].join(' | ');
        })()`).then((result) => {
            const ok = result === 'file ok | escape caught | spawn ok';
            console.log(ok ? 'BRIDGE OK' : `BRIDGE FAIL: ${result}`);
            app.exit(ok ? 0 : 1);
        }).catch((err) => {
            console.log(`BRIDGE FAIL: ${err.message}`);
            app.exit(1);
        });
    });
}

function runSmoke(win) {
    const badLines = [];
    // ('console-message', event, level, message, ...) through electron 41;
    // newer majors move to a details object -- accept either shape, so the
    // smoke test itself survives the bumps it exists to gate.
    win.webContents.on('console-message', (e, levelOrDetails, maybeMsg) => {
        const msg = typeof maybeMsg === 'string' ? maybeMsg
            : (levelOrDetails && levelOrDetails.message)
                || (e && e.message) || '';
        if (SMOKE_ERROR_RE.test(msg) && !SMOKE_IGNORE_RE.test(msg)) badLines.push(msg);
    });
    const started = Date.now();
    let finished = false;
    const finish = (code, why) => {
        if (finished) return;
        finished = true;
        console.log(code === 0 ? 'SMOKE OK' : `SMOKE FAIL: ${why}`);
        for (const line of badLines) console.log(`  renderer: ${line}`);
        app.exit(code);
    };
    // Hard deadline on its own timer: if the renderer main thread is blocked
    // (e.g. a deadlocked synchronous XHR), executeJavaScript never settles and
    // a deadline embedded in its callbacks never fires. Observed 2026-08-22.
    setTimeout(() => finish(1, 'hard deadline: renderer unresponsive or applet never ready'),
               SMOKE_TIMEOUT_MS + 15000);
    const poll = () => {
        if (Date.now() - started > SMOKE_TIMEOUT_MS) {
            return finish(1, 'timeout waiting for JSmol applet _ready');
        }
        win.webContents
            .executeJavaScript(
                "typeof jmolApplet0 !== 'undefined' && !!jmolApplet0._ready")
            .then((ready) => {
                if (badLines.length) return finish(1, 'renderer error lines');
                if (ready) return smokeLoadCheck();
                setTimeout(poll, 500);
            })
            .catch(() => setTimeout(poll, 500));
    };
    // Boot alone is not health: the 2026-08-22 empty-window regression (the
    // sandboxed renderer could not read the UNC bundle path) booted fine at
    // the main-process level and rendered nothing. The gate therefore also
    // loads a bundled sample and counts atoms.
    const smokeLoadCheck = () => {
        win.webContents
            .executeJavaScript(
                `new Promise((res) => {
                    try {
                        Jmol.script(jmolApplet0, 'load "jsmol/data/caffeine.mol"');
                    } catch (e) { return res('script threw: ' + e.message); }
                    let tries = 0;
                    const check = () => {
                        let n = 0;
                        try { n = Jmol.evaluateVar(jmolApplet0, '{*}.length'); }
                        catch (e) { return res('evaluate threw: ' + e.message); }
                        if (n > 0) return res(n);
                        if (++tries > 20) return res(0);
                        setTimeout(check, 500);
                    };
                    setTimeout(check, 500);
                })`)
            .then((atoms) => {
                if (badLines.length) return finish(1, 'renderer error lines');
                if (typeof atoms === 'number' && atoms > 0) return finish(0, '');
                finish(1, `sample molecule failed to load (${atoms})`);
            })
            .catch((err) => finish(1, `load check failed: ${err.message}`));
    };
    win.webContents.once('did-finish-load', () => setTimeout(poll, 500));
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        resizable: true,
        icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icons/512x512.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            // The renderer sandbox (default once nodeIntegration is off)
            // cannot read the app bundle over a UNC path on Windows -- the
            // Windows binary launched from WSL (\\wsl.localhost\...) gets a
            // renderer that dies before requesting a single resource: blank
            // window, empty logs (2026-08-22). The pre-#49 app was implicitly
            // unsandboxed via nodeIntegration; contextIsolation and the
            // preload bridge remain the isolation boundary.
            sandbox: false,
            // webSecurity was false for years; measured on 2026-08-22 it is
            // not needed: with same-origin enforcement ON, the app boots, the
            // JSmol applet loads local structures (327-atom 1crn.pdb probe,
            // identical to webSecurity:false), and the PubChem fetch passes
            // CORS from the file:// origin. Guarded by the CI smoke gate.
            webSecurity: true,
            // Disable hardware acceleration to prevent GPU conflicts on Windows 11
            hardwareAcceleration: false
        }
    });

    // Window-open and navigation guards: the renderer can never spawn a new
    // Electron window; external links go to the system browser, and the
    // window cannot navigate away from the bundled index.html. This is the
    // bug class of CVE-2026-70608 (popup restrictions bypassed via an OpenURL
    // navigation path) closed at the application level, independent of the
    // Electron version.
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (event, url) => {
        if (url !== win.webContents.getURL()) {
            event.preventDefault();
            if (url.startsWith('https://') || url.startsWith('http://')) {
                shell.openExternal(url);
            }
        }
    });

    // Renderer lifecycle on the record: a dead or dying renderer produces no
    // console and no did-fail-load, which cost a whole evening of guessing.
    win.webContents.on('render-process-gone', (_e, details) => {
        log(`render-process-gone: ${details.reason} (exitCode ${details.exitCode})`);
    });
    win.webContents.on('did-start-load', () => log('did-start-load'));
    win.webContents.on('did-finish-load', () => log('did-finish-load'));
    win.webContents.on('preload-error', (_e, preloadPath, error) => {
        log(`preload-error ${preloadPath}: ${error.message}`);
    });
    log(`preload exists: ${fs.existsSync(path.join(__dirname, 'preload.js'))}`);

    // A load failure must never be a silently empty window: show the error
    // in the window itself, so the screen IS the diagnostic.
    win.webContents.on('did-fail-load', (_e, code, description, failedUrl,
                                          isMainFrame) => {
        log(`did-fail-load ${code} ${description} for ${failedUrl}`
            + (isMainFrame ? ' (main frame)' : ' (subframe)'));
        // Only a MAIN-frame failure means the app did not come up. Subframe
        // failures are routine (the blocked JSmol tracker fires one under
        // app://) and replacing the app with the error page mid-initialization
        // was itself the bug that broke the applet (startHoverWatcher null,
        // 2026-08-22). ERR_ABORTED (-3) is navigation noise, not failure.
        if (!isMainFrame || code === -3) return;
        const msg = `jlmol failed to load its interface.\n\n`
            + `Error ${code}: ${description}\nURL: ${failedUrl}\n`
            + `App dir: ${__dirname}\nPlatform: ${process.platform}\n\n`
            + `Please report this text.`;
        win.loadURL('data:text/plain;charset=utf-8,' + encodeURIComponent(msg));
    });
    if (process.env.JLMOL_FILE_MODE) {
        win.loadFile('index.html');           // diagnostic fallback
    } else {
        win.loadURL('app://bundle/index.html');
    }
    if (SMOKE) runSmoke(win);
    if (BRIDGE_PROBE) runBridgeProbe(win);
    win.setMenuBarVisibility(false);
    win.setAutoHideMenuBar(true);

    // Add proper cleanup on window close
    win.on('closed', () => {
        log('Window closed - cleaning up resources');
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
    });

    // Handle app suspension/focus events for better resource management
    win.on('blur', () => {
        log('Window lost focus');
    });

    win.on('focus', () => {
        log('Window gained focus');
    });

    win.webContents.on('did-finish-load', () => {
        log('Window loaded, has file content: ' + !!fileContent);
        
        // Add error handling for uncaught exceptions
        win.webContents.executeJavaScript(`
            window.addEventListener('error', function(e) {
                console.error('Uncaught error:', e.error);
                return true; // Prevent default error handling
            });
            
            window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
                e.preventDefault(); // Prevent default error handling
            });
        `);
        
        // Pass version information to renderer
        win.webContents.executeJavaScript(`window.appVersion = "${version}";`);
        
        if (fileContent) {
            win.webContents.executeJavaScript(`
                (function loadMolecule() {
                    if (typeof Jmol !== 'undefined' && typeof jmolApplet0 !== 'undefined') {
                        console.log('Starting molecule load...');
                        const waitForReady = setInterval(() => {
                            if (jmolApplet0._ready) {
                                clearInterval(waitForReady);
                                console.log('JSmol ready, loading molecule...');
                                try {
                                    const content = \`${fileContent.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/\`/g, '\\\`')}\`;
                                    Jmol.script(jmolApplet0, 'set echo top left; echo "Loading molecule...";');
                                    setTimeout(() => {
                                        Jmol.script(jmolApplet0, 'load inline "' + content + '" filter "NOSORT";');
                                        Jmol.script(jmolApplet0, 'set echo top left; echo "";');
                                        
                                        // Apply JSmol preferences after loading
                                        setTimeout(() => {
                                            if (typeof applyJSmolPreferences === 'function') {
                                                applyJSmolPreferences();
                                                console.log('Command-line loading: Applied JSmol preferences');
                                            }
                                        }, 500);
                                    }, 100);
                                } catch (err) {
                                    console.error('Error loading molecule:', err);
                                }
                            }
                        }, 100);
                        // Set a shorter timeout to prevent memory leaks
                        setTimeout(() => {
                            clearInterval(waitForReady);
                            console.log('JSmol loading timeout - clearing interval');
                        }, 5000); // Reduced from 10s to 5s
                    } else {
                        setTimeout(loadMolecule, 100);
                    }
                })();
            `);
        }
    });
}

app.whenReady().then(() => {
    // app:// serves the bundle directory, path-normalized and confined to it.
    // Served from fs STREAMS -- both constraints learned on 2026-08-22 the
    // hard way: (a) no file:// URLs anywhere (net.fetch of a hostful UNC file
    // URL -- Windows binary run from WSL -- hangs the load: empty window, no
    // did-fail-load, empty logs), and (b) streaming bodies, because a
    // buffered Response deadlocks JSmol's synchronous-XHR class loader.
    const MIME = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
        '.woff': 'font/woff', '.woff2': 'font/woff2', '.wasm': 'application/wasm',
    };
    const { Readable } = require('stream');
    protocol.handle('app', async (request) => {
        try {
            const url = new URL(request.url);
            const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
            const target = path.normalize(path.join(__dirname, rel || 'index.html'));
            if (target !== __dirname
                && !target.startsWith(path.normalize(__dirname + path.sep))) {
                log(`app:// forbidden: ${request.url}`);
                return new Response('forbidden', { status: 403 });
            }
            const stream = fsNative.createReadStream(target);
            await new Promise((resolve, reject) => {
                stream.once('open', resolve);
                stream.once('error', reject);
            });
            const mime = MIME[path.extname(target).toLowerCase()]
                || 'application/octet-stream';
            if (rel.endsWith('.html')) log(`app:// serving ${rel}`);
            return new Response(Readable.toWeb(stream),
                                { headers: { 'content-type': mime } });
        } catch (err) {
            log(`app:// ${request.url}: ${err.message}`);
            return new Response('not found', { status: 404 });
        }
    });
    log(`app:// handler registered; bundle dir: ${__dirname}`);
    createWindow();
});

// Add periodic memory monitoring with cleanup
let memoryMonitorInterval = setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        log(`High memory usage detected: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
        if (global.gc) {
            global.gc();
            log('Forced garbage collection');
        }
    }
}, 30000); // Check every 30 seconds

app.on('window-all-closed', () => {
    // Clear memory monitoring interval
    if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval);
        memoryMonitorInterval = null;
    }
    log('Application closing - cleaning up resources');
    // Force cleanup on exit
    if (global.gc) {
        global.gc();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});