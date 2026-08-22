const { app, BrowserWindow, shell } = require('electron')

// --- smoke mode ------------------------------------------------------------
// `electron . --smoke` boots the app, waits for the JSmol applet to reach
// _ready (the same flag the app itself trusts, js/molecule-data.js), and
// exits 0 (SMOKE OK) or 1 (SMOKE FAIL). Any renderer console line carrying an
// error signature fails the run regardless of log level -- the criteria are
// distilled from the 2026-08-22 electron-41 verification, which caught a real
// regression (JSmol _evaluate TypeErrors) within a minute of Xvfb runtime.
const SMOKE = process.argv.includes('--smoke');
const SMOKE_TIMEOUT_MS = 30000;
const SMOKE_ERROR_RE = /Uncaught|TypeError|ReferenceError|is not defined|FATAL/;
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

function runSmoke(win) {
    const badLines = [];
    // ('console-message', event, level, message, ...) through electron 41;
    // newer majors move to a details object -- accept either shape, so the
    // smoke test itself survives the bumps it exists to gate.
    win.webContents.on('console-message', (e, levelOrDetails, maybeMsg) => {
        const msg = typeof maybeMsg === 'string' ? maybeMsg
            : (levelOrDetails && levelOrDetails.message)
                || (e && e.message) || '';
        if (SMOKE_ERROR_RE.test(msg)) badLines.push(msg);
    });
    const started = Date.now();
    const finish = (code, why) => {
        console.log(code === 0 ? 'SMOKE OK' : `SMOKE FAIL: ${why}`);
        for (const line of badLines) console.log(`  renderer: ${line}`);
        app.exit(code);
    };
    const poll = () => {
        if (Date.now() - started > SMOKE_TIMEOUT_MS) {
            return finish(1, 'timeout waiting for JSmol applet _ready');
        }
        win.webContents
            .executeJavaScript(
                "typeof jmolApplet0 !== 'undefined' && !!jmolApplet0._ready")
            .then((ready) => {
                if (badLines.length) return finish(1, 'renderer error lines');
                if (ready) return finish(0, '');
                setTimeout(poll, 500);
            })
            .catch(() => setTimeout(poll, 500));
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
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
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

    win.loadFile('index.html');
    if (SMOKE) runSmoke(win);
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

app.whenReady().then(createWindow);

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