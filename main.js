const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const { version } = require('./package.json')

// Add command line switches for stability on Windows 11
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
    fs.appendFileSync(logFile, logEntry);
    console.log(logEntry.trim());
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

    win.loadFile('index.html');
    win.setMenuBarVisibility(true);

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
                                    const content = \`${fileContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`;
                                    Jmol.script(jmolApplet0, 'set echo top left; echo "Loading molecule...";');
                                    setTimeout(() => {
                                        Jmol.script(jmolApplet0, 'load inline "' + content + '" filter "NOSORT";');
                                        Jmol.script(jmolApplet0, 'set echo top left; echo "";');
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

// Add periodic memory monitoring
setInterval(() => {
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
    log('Application closing - cleaning up resources');
    // Force cleanup on exit
    if (global.gc) {
        global.gc();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});