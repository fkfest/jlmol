// Debug script for GPU and graphics issues on Windows 11
const { app, BrowserWindow, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Enhanced GPU debugging information
function getSystemInfo() {
    const info = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        chromiumVersion: process.versions.chrome,
        v8Version: process.versions.v8,
        osVersion: os.release(),
        totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
        freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + 'GB',
        cpus: os.cpus().length + ' cores'
    };
    
    if (process.platform === 'win32') {
        info.windowsVersion = os.version();
    }
    
    return info;
}

// Get GPU information using app.getGPUFeatureStatus()
function getGPUInfo() {
    try {
        const gpuInfo = app.getGPUFeatureStatus();
        const gpuReport = app.getGPUInfo('complete');
        return { gpuInfo, gpuReport };
    } catch (error) {
        return { error: error.message };
    }
}

// Create debug log
function createDebugLog() {
    const logPath = path.join(app.getPath('userData'), 'gpu-debug.log');
    const systemInfo = getSystemInfo();
    const gpuData = getGPUInfo();
    
    let logContent = '=== GPU DEBUG LOG ===\n';
    logContent += 'Generated: ' + new Date().toISOString() + '\n\n';
    
    logContent += '=== SYSTEM INFORMATION ===\n';
    Object.entries(systemInfo).forEach(([key, value]) => {
        logContent += `${key}: ${value}\n`;
    });
    
    logContent += '\n=== GPU FEATURE STATUS ===\n';
    if (gpuData.gpuInfo) {
        Object.entries(gpuData.gpuInfo).forEach(([key, value]) => {
            logContent += `${key}: ${value}\n`;
        });
    }
    
    logContent += '\n=== GPU DETAILED INFO ===\n';
    if (gpuData.gpuReport) {
        logContent += JSON.stringify(gpuData.gpuReport, null, 2);
    }
    
    if (gpuData.error) {
        logContent += 'Error getting GPU info: ' + gpuData.error + '\n';
    }
    
    logContent += '\n=== COMMAND LINE ARGS ===\n';
    process.argv.forEach((arg, index) => {
        logContent += `${index}: ${arg}\n`;
    });
    
    logContent += '\n=== ENVIRONMENT VARIABLES ===\n';
    Object.entries(process.env).forEach(([key, value]) => {
        if (key.toLowerCase().includes('gpu') || key.toLowerCase().includes('graphic') || key.toLowerCase().includes('display')) {
            logContent += `${key}: ${value}\n`;
        }
    });
    
    fs.writeFileSync(logPath, logContent);
    console.log('Debug log created at:', logPath);
    console.log('\n' + logContent);
    
    return logPath;
}

// Test different hardware acceleration settings
function createTestWindow(config, testName) {
    return new Promise((resolve) => {
        const win = new BrowserWindow({
            width: 400,
            height: 300,
            show: false,
            title: `GPU Test: ${testName}`,
            webPreferences: {
                ...config,
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        
        win.loadURL('data:text/html,<h1>GPU Test: ' + testName + '</h1><p>Testing configuration...</p>');
        
        win.webContents.on('did-finish-load', () => {
            console.log(`✓ Test "${testName}" loaded successfully`);
            win.close();
            resolve(true);
        });
        
        win.on('unresponsive', () => {
            console.log(`✗ Test "${testName}" became unresponsive`);
            win.close();
            resolve(false);
        });
        
        setTimeout(() => {
            if (!win.isDestroyed()) {
                console.log(`⚠ Test "${testName}" timed out`);
                win.close();
                resolve(false);
            }
        }, 5000);
    });
}

async function runGPUTests() {
    console.log('Running GPU compatibility tests...\n');
    
    const tests = [
        { config: { hardwareAcceleration: true }, name: 'Hardware Acceleration Enabled' },
        { config: { hardwareAcceleration: false }, name: 'Hardware Acceleration Disabled' },
        { config: { hardwareAcceleration: true, webgl: false }, name: 'WebGL Disabled' },
        { config: { hardwareAcceleration: false, webgl: false }, name: 'All Acceleration Disabled' }
    ];
    
    const results = {};
    
    for (const test of tests) {
        try {
            const result = await createTestWindow(test.config, test.name);
            results[test.name] = result;
        } catch (error) {
            console.log(`✗ Test "${test.name}" failed with error:`, error.message);
            results[test.name] = false;
        }
    }
    
    console.log('\n=== TEST RESULTS ===');
    Object.entries(results).forEach(([name, success]) => {
        console.log(`${success ? '✓' : '✗'} ${name}: ${success ? 'PASS' : 'FAIL'}`);
    });
    
    // Recommend best configuration
    console.log('\n=== RECOMMENDATIONS ===');
    if (results['Hardware Acceleration Disabled']) {
        console.log('✓ Hardware acceleration disabled works - recommended for Windows 11');
    }
    if (!results['Hardware Acceleration Enabled']) {
        console.log('⚠ Hardware acceleration enabled fails - avoid this configuration');
    }
    
    return results;
}

app.whenReady().then(async () => {
    // Disable hardware acceleration for testing
    app.disableHardwareAcceleration();
    
    console.log('=== JLMOL GPU DEBUGGER ===\n');
    
    // Create system debug log
    const logPath = createDebugLog();
    
    // Run GPU tests
    const testResults = await runGPUTests();
    
    // Append test results to log
    let testLog = '\n\n=== GPU TEST RESULTS ===\n';
    Object.entries(testResults).forEach(([name, success]) => {
        testLog += `${name}: ${success ? 'PASS' : 'FAIL'}\n`;
    });
    
    fs.appendFileSync(logPath, testLog);
    
    console.log(`\nComplete debug information saved to: ${logPath}`);
    console.log('Please share this file when reporting graphics issues.');
    
    // Exit after testing
    app.quit();
});

app.on('window-all-closed', () => {
    app.quit();
});
