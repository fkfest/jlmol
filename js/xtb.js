// ============================================================
// xtb (g-xTB) integration
// ============================================================

function showXtbPanel() {
    const panel = document.getElementById('xtbPanel');
    if (panel) panel.style.display = 'block';
}

function hideXtbPanel() {
    const panel = document.getElementById('xtbPanel');
    if (panel) panel.style.display = 'none';
}

function clearXtbOutput() {
    const outputTextarea = document.getElementById('xtb-output');
    const outputSection = document.getElementById('xtb-output-section');
    if (outputTextarea) outputTextarea.value = '';
    if (outputSection) outputSection.style.display = 'none';
    document.getElementById('status').innerHTML = 'Output cleared';
}

// Quote-aware command parser (supports paths with spaces and 'wsl ...' commands)
function parseXtbCommand(cmd) {
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
            if (current.trim()) { parts.push(current.trim()); current = ''; }
        } else {
            current += char;
        }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
}

// Compress a sorted list of 1-based atom numbers into xtb range notation,
// e.g. [1,2,3,5,8,9] -> "1-3,5,8-9".
function formatAtomRanges(nums) {
    if (!nums.length) return '';
    const sorted = [...nums].sort((a, b) => a - b);
    const parts = [];
    let start = sorted[0], prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === prev + 1) {
            prev = sorted[i];
        } else {
            parts.push(start === prev ? `${start}` : `${start}-${prev}`);
            start = prev = sorted[i];
        }
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    return parts.join(',');
}

// Entry point for xtb calculations. mode = 'energy' | 'opt'
async function runXtb(mode) {
    const outputSection = document.getElementById('xtb-output-section');
    const outputTextarea = document.getElementById('xtb-output');
    if (!outputSection || !outputTextarea) {
        document.getElementById('status').innerHTML = 'Error: xtb panel not initialized';
        return;
    }

    // Ensure a molecule is loaded
    let xyzData = '';
    try {
        xyzData = Jmol.evaluateVar(jmolApplet0, 'write("xyz")') || '';
    } catch (e) {
        xyzData = '';
    }
    const atomCount = xyzData ? parseInt(xyzData.split('\n')[0]) : 0;
    if (!atomCount || isNaN(atomCount)) {
        document.getElementById('status').innerHTML = 'Please load a molecule first';
        return;
    }

    outputSection.style.display = 'block';
    outputTextarea.value = mode === 'opt'
        ? 'Initializing xtb geometry optimization...\n'
        : 'Initializing xtb energy calculation...\n';
    document.getElementById('status').innerHTML = 'Preparing xtb calculation...';

    try {
        if (typeof require !== 'undefined') {
            await runXtbInElectron(xyzData, mode);
        } else {
            showXtbBrowserMessage();
        }
    } catch (error) {
        console.error('Error running xtb calculation:', error);
        outputTextarea.value = `Error: ${error.message}\n\nTroubleshooting:\n- Ensure xtb is installed and accessible\n- Check the xtb command in Settings\n- For g-xTB, install the parameter files from https://github.com/grimme-lab/g-xtb into $XTBPATH or $HOME`;
        document.getElementById('status').innerHTML = 'xtb calculation failed - see output for details';
    }
}

// Browser fallback message
function showXtbBrowserMessage() {
    const outputTextarea = document.getElementById('xtb-output');
    outputTextarea.value = `=== jlmol Browser Mode ===
Running xtb directly from the browser is not supported.

Please install jlmol locally (the desktop application) to run xtb calculations.
Download: https://github.com/fkfest/jlmol/releases/latest

The desktop version runs xtb on your machine. You will also need:
1. xtb with g-xTB support installed and on your PATH (or set the command in Settings -> xtb).
2. The g-xTB parameter files from https://github.com/grimme-lab/g-xtb,
   placed in $XTBPATH or $HOME.`;
    document.getElementById('status').innerHTML = 'Please install jlmol locally to run xtb';
}

// Run xtb in the Electron environment
async function runXtbInElectron(xyzData, mode) {
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const outputTextarea = document.getElementById('xtb-output');
    const prefs = getPreferences();
    const xtbCommand = (prefs.xtbCommand || 'xtb').trim();
    const timeoutMs = (parseInt(prefs.calcTimeout) || 5) * 60 * 1000;

    // Calculation options from the panel
    const charge = parseInt(document.getElementById('xtb-charge')?.value, 10) || 0;
    const uhf = Math.max(0, parseInt(document.getElementById('xtb-uhf')?.value, 10) || 0);
    const extraFlags = (document.getElementById('xtb-extra-flags')?.value || '').trim();

    const commandParts = parseXtbCommand(xtbCommand);
    if (commandParts.length === 0) {
        throw new Error('No xtb command configured. Set it in Settings -> xtb.');
    }
    const isWSL = commandParts[0].toLowerCase() === 'wsl';
    const baseCommand = isWSL ? 'wsl' : commandParts[0];
    const cmdPrefixArgs = commandParts.slice(1); // e.g. ['xtb'] for "wsl xtb", or [] for "xtb"

    // Dedicated working directory (xtb writes several output files into CWD)
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jlmol_xtb_'));
    fs.writeFileSync(path.join(workDir, 'coord.xyz'), xyzData);

    // Optionally freeze the non-selected atoms during optimization by writing
    // an xtb xcontrol file with a $fix block (passed via --input). The atoms
    // listed in $fix are removed from the optimization, so only the currently
    // selected atoms are relaxed.
    let inputFileArgs = [];
    let freezeSummary = '';
    const freezeUnselected = mode === 'opt' && document.getElementById('xtb-freeze-unselected')?.checked;
    if (freezeUnselected) {
        const totalAtoms = parseInt(xyzData.split('\n')[0], 10) || 0;
        if (selectedAtoms.size === 0) {
            freezeSummary = '"Relax only selected atoms" is enabled but no atoms are selected — optimizing all atoms.\n';
        } else {
            // selectedAtoms holds 0-based indices; xtb uses 1-based numbering.
            const fixed = [];
            for (let i = 0; i < totalAtoms; i++) {
                if (!selectedAtoms.has(i)) fixed.push(i + 1);
            }
            if (fixed.length === 0) {
                freezeSummary = 'All atoms are selected — nothing to freeze, optimizing all atoms.\n';
            } else {
                const ranges = formatAtomRanges(fixed);
                const xcontrol = `$fix\n   atoms: ${ranges}\n$end\n`;
                fs.writeFileSync(path.join(workDir, 'xtb.inp'), xcontrol);
                inputFileArgs = ['--input', 'xtb.inp'];
                freezeSummary = `Relaxing ${selectedAtoms.size} selected atom(s); freezing ${fixed.length} atom(s) via xtb.inp:\n${xcontrol}`;
            }
        }
    }

    let cleanedUp = false;
    function cleanup() {
        if (cleanedUp) return;
        cleanedUp = true;
        try {
            fs.rmSync(workDir, { recursive: true, force: true });
            console.log('xtb working directory cleaned up:', workDir);
        } catch (e) {
            console.warn('Could not remove xtb working directory:', workDir, e);
        }
    }
    process.once('exit', cleanup);

    // Build arguments. The geometry file is passed as a relative name; cwd is workDir.
    const calcArgs = [...cmdPrefixArgs, 'coord.xyz', ...inputFileArgs, '--gxtb', '--chrg', String(charge), '--uhf', String(uhf)];
    if (mode === 'opt') calcArgs.push('--opt');
    if (extraFlags) calcArgs.push(...parseXtbCommand(extraFlags));

    const fullCmd = `${xtbCommand} coord.xyz${inputFileArgs.length ? ' --input xtb.inp' : ''} --gxtb${mode === 'opt' ? ' --opt' : ''} --chrg ${charge} --uhf ${uhf}${extraFlags ? ' ' + extraFlags : ''}`;
    outputTextarea.value = `=== jlmol xtb (g-xTB) Calculation ===\nTimestamp: ${new Date().toISOString()}\nMode: ${mode === 'opt' ? 'Geometry optimization' : 'Single-point energy'}\nxtb command: ${xtbCommand}\nWorking directory: ${workDir}\nFull command: ${fullCmd}\n${freezeSummary ? '\n' + freezeSummary : ''}\n--- Checking xtb availability ---\n`;
    document.getElementById('status').innerHTML = 'Checking xtb...';

    // Availability check first
    const versionArgs = [...cmdPrefixArgs, '--version'];
    const check = spawn(baseCommand, versionArgs, {
        cwd: workDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: isWSL ? false : true
    });

    check.on('error', (error) => {
        cleanup();
        const wslTip = isWSL ? `\n\nWSL tips:\n- Ensure WSL is installed and xtb exists inside your distribution\n- Try 'wsl xtb --version' in a terminal` : '';
        outputTextarea.value += `\n=== xtb NOT FOUND ===\nCould not run "${xtbCommand}": ${error.message}\n\nPlease check the xtb command in Settings -> xtb, or install xtb (with g-xTB support) from https://github.com/grimme-lab/g-xtb and make sure it is on your PATH.${wslTip}`;
        document.getElementById('status').innerHTML = 'xtb not found - see output';
    });

    check.on('close', (code) => {
        if (code !== 0) {
            cleanup();
            outputTextarea.value += `\nxtb version check failed (exit code ${code}) for command "${xtbCommand}".\nPlease verify the command in Settings -> xtb.`;
            document.getElementById('status').innerHTML = 'xtb not available - see output';
            return;
        }

        outputTextarea.value += `xtb found.\n\n--- Starting calculation ---\n`;
        document.getElementById('status').innerHTML = mode === 'opt' ? 'Optimizing geometry with xtb...' : 'Calculating energy with xtb...';

        const proc = spawn(baseCommand, calcArgs, {
            cwd: workDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: timeoutMs,
            shell: isWSL ? false : true
        });

        let stdout = '';
        let outputBuffer = '';
        const startTime = Date.now();
        let lastUpdateTime = Date.now();

        function flushOutput() {
            if (outputBuffer.length > 0) {
                outputTextarea.value += outputBuffer;
                outputBuffer = '';
                outputTextarea.scrollTop = outputTextarea.scrollHeight;
            }
        }

        proc.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            outputBuffer += text;
            const now = Date.now();
            if (now - lastUpdateTime > 100) {
                flushOutput();
                lastUpdateTime = now;
                const elapsed = ((now - startTime) / 1000).toFixed(1);
                document.getElementById('status').innerHTML = `xtb running... (${elapsed}s)`;
            }
        });

        proc.stderr.on('data', (data) => {
            outputTextarea.value += data.toString();
            outputTextarea.scrollTop = outputTextarea.scrollHeight;
        });

        proc.on('error', (error) => {
            flushOutput();
            cleanup();
            outputTextarea.value += `\n=== PROCESS ERROR ===\n${error.message}`;
            document.getElementById('status').innerHTML = `xtb process error: ${error.message}`;
        });

        proc.on('close', (exitCode) => {
            flushOutput();
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            // NOTE: xtb returns exit code 0 even on failure (e.g. missing g-xTB
            // parameters), so success is detected from the produced output, not the code.
            if (mode === 'opt') {
                const optFile = path.join(workDir, 'xtbopt.xyz');
                if (fs.existsSync(optFile)) {
                    let optXyz = '';
                    try {
                        optXyz = fs.readFileSync(optFile, 'utf8');
                    } catch (e) {
                        optXyz = '';
                    }
                    if (optXyz && parseInt(optXyz.split('\n')[0]) > 0) {
                        applyOptimizedGeometry(optXyz);
                        outputTextarea.value += `\n\n=== OPTIMIZATION COMPLETED (${elapsed}s) ===\nThe geometry in the viewer has been replaced with the optimized structure.`;
                        document.getElementById('status').innerHTML = `Geometry optimized with g-xTB (${elapsed}s)`;
                        cleanup();
                        return;
                    }
                }
                outputTextarea.value += `\n\n=== OPTIMIZATION FAILED ===\nNo optimized geometry (xtbopt.xyz) was produced. See the output above.\nIf this mentions missing g-xTB parameters, install them from https://github.com/grimme-lab/g-xtb into $XTBPATH or $HOME.`;
                document.getElementById('status').innerHTML = 'xtb optimization failed - see output';
            } else {
                const match = stdout.match(/TOTAL ENERGY\s+(-?\d+\.\d+)/);
                if (match) {
                    const energy = match[1];
                    outputTextarea.value += `\n\n=== ENERGY CALCULATION COMPLETED (${elapsed}s) ===\nTotal energy: ${energy} Eh`;
                    document.getElementById('status').innerHTML = `g-xTB total energy: ${energy} Eh (${elapsed}s)`;
                } else {
                    outputTextarea.value += `\n\n=== ENERGY CALCULATION FAILED ===\nNo total energy was found in the xtb output. See above.\nIf this mentions missing g-xTB parameters, install them from https://github.com/grimme-lab/g-xtb into $XTBPATH or $HOME.`;
                    document.getElementById('status').innerHTML = 'xtb energy calculation failed - see output';
                }
            }
            cleanup();
        });
    });
}

// Replace the current geometry in the viewer with the optimized structure
function applyOptimizedGeometry(optXyz) {
    try {
        Jmol.script(jmolApplet0, `load inline "${optXyz}" filter "NOSORT"`);
        setTimeout(() => {
            if (typeof applyJSmolPreferences === 'function') {
                try { applyJSmolPreferences(); } catch (e) { console.warn('applyJSmolPreferences failed:', e); }
            }
            if (typeof refreshJSMEFromJSmol === 'function') {
                try { refreshJSMEFromJSmol(); } catch (e) { /* 2D editor not active */ }
            }
        }, 300);
    } catch (e) {
        console.error('Failed to load optimized geometry into viewer:', e);
    }
}

