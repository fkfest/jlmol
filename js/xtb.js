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
        if (window.jlmolNative) {
            await runXtbInElectron(xyzData, mode);
        } else {
            showXtbBrowserMessage();
        }
    } catch (error) {
        console.error('Error running xtb calculation:', error);
        outputTextarea.value = `Error: ${error.message}\n\nTroubleshooting:\n- Ensure xtb is installed and accessible\n- Check the xtb command in Settings\n- For g-xTB, get the distribution from https://github.com/grimme-lab/g-xtb, extract it, and make sure its xtb binary is on your PATH (it bundles the parameters)`;
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

The desktop version runs xtb on your machine. You will also need the g-xTB
distribution from https://github.com/grimme-lab/g-xtb: download it, extract it,
and make sure its xtb binary is on your PATH (or set the full path in
Settings -> xtb). It bundles the parameters, so no separate download is needed.`;
    document.getElementById('status').innerHTML = 'Please install jlmol locally to run xtb';
}

// Run xtb in the Electron environment
async function runXtbInElectron(xyzData, mode) {
    // All system access goes through the preload bridge (issue #45 item 3):
    // scoped work directory, file writes/reads confined to it, spawn with
    // streamed output. No require() in the renderer.
    const native = window.jlmolNative;
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
    const workDir = await native.mkWorkDir('jlmol_xtb_');
    const workDirPath = await native.workDirPath(workDir);
    await native.writeFile(workDir, 'coord.xyz', xyzData);

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
                await native.writeFile(workDir, 'xtb.inp', xcontrol);
                inputFileArgs = ['--input', 'xtb.inp'];
                freezeSummary = `Relaxing ${selectedAtoms.size} selected atom(s); freezing ${fixed.length} atom(s) via xtb.inp:\n${xcontrol}`;
            }
        }
    }

    let cleanedUp = false;
    function cleanup() {
        if (cleanedUp) return;
        cleanedUp = true;
        native.removeWorkDir(workDir);   // main also reaps all work dirs on quit
    }

    // Build arguments. The geometry file is passed as a relative name; cwd is workDir.
    const calcArgs = [...cmdPrefixArgs, 'coord.xyz', ...inputFileArgs, '--gxtb', '--chrg', String(charge), '--uhf', String(uhf)];
    if (mode === 'opt') calcArgs.push('--opt');
    if (extraFlags) calcArgs.push(...parseXtbCommand(extraFlags));

    const fullCmd = `${xtbCommand} coord.xyz${inputFileArgs.length ? ' --input xtb.inp' : ''} --gxtb${mode === 'opt' ? ' --opt' : ''} --chrg ${charge} --uhf ${uhf}${extraFlags ? ' ' + extraFlags : ''}`;
    outputTextarea.value = `=== jlmol xtb (g-xTB) Calculation ===\nTimestamp: ${new Date().toISOString()}\nMode: ${mode === 'opt' ? 'Geometry optimization' : 'Single-point energy'}\nxtb command: ${xtbCommand}\nWorking directory: ${workDirPath}\nFull command: ${fullCmd}\n${freezeSummary ? '\n' + freezeSummary : ''}\n--- Checking xtb availability ---\n`;
    setStatusText('Checking xtb...');

    // Availability check first
    const versionArgs = [...cmdPrefixArgs, '--version'];
    await native.spawn(baseCommand, versionArgs, { cwd: workDir }, {
        error: (message) => {
            cleanup();
            const wslTip = isWSL ? `\n\nWSL tips:\n- Ensure WSL is installed and xtb exists inside your distribution\n- Try 'wsl xtb --version' in a terminal` : '';
            outputTextarea.value += `\n=== xtb NOT FOUND ===\nCould not run "${xtbCommand}": ${message}\n\nPlease check the xtb command in Settings -> xtb, or install xtb (with g-xTB support) from https://github.com/grimme-lab/g-xtb and make sure it is on your PATH.${wslTip}`;
            setStatusText('xtb not found - see output');
        },
        close: (code) => {
            if (code !== 0) {
                cleanup();
                outputTextarea.value += `\nxtb version check failed (exit code ${code}) for command "${xtbCommand}".\nPlease verify the command in Settings -> xtb.`;
                setStatusText('xtb not available - see output');
                return;
            }
            runXtbCalculation();
        },
    });

    async function runXtbCalculation() {
        outputTextarea.value += `xtb found.\n\n--- Starting calculation ---\n`;
        setStatusText(mode === 'opt' ? 'Optimizing geometry with xtb...' : 'Calculating energy with xtb...');

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

        await native.spawn(baseCommand, calcArgs, { cwd: workDir, timeoutMs }, {
            data: (kind, text) => {
                if (kind === 'stdout') {
                    stdout += text;
                    outputBuffer += text;
                    const now = Date.now();
                    if (now - lastUpdateTime > 100) {
                        flushOutput();
                        lastUpdateTime = now;
                        const elapsed = ((now - startTime) / 1000).toFixed(1);
                        setStatusText(`xtb running... (${elapsed}s)`);
                    }
                } else {
                    outputTextarea.value += text;
                    outputTextarea.scrollTop = outputTextarea.scrollHeight;
                }
            },
            error: (message) => {
                flushOutput();
                cleanup();
                outputTextarea.value += `\n=== PROCESS ERROR ===\n${message}`;
                setStatusText(`xtb process error: ${message}`);
            },
            close: async (exitCode) => {
                flushOutput();
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

                // NOTE: xtb returns exit code 0 even on failure (e.g. missing g-xTB
                // parameters), so success is detected from the produced output, not the code.
                if (mode === 'opt') {
                    const optXyz = await native.readFile(workDir, 'xtbopt.xyz');
                    if (optXyz && parseInt(optXyz.split('\n')[0]) > 0) {
                        applyOptimizedGeometry(optXyz);
                        outputTextarea.value += `\n\n=== OPTIMIZATION COMPLETED (${elapsed}s) ===\nThe geometry in the viewer has been replaced with the optimized structure.`;
                        setStatusText(`Geometry optimized with g-xTB (${elapsed}s)`);
                        cleanup();
                        return;
                    }
                    outputTextarea.value += `\n\n=== OPTIMIZATION FAILED ===\nNo optimized geometry (xtbopt.xyz) was produced. See the output above.\nIf this mentions missing g-xTB parameters, make sure the xtb being run is the one from the g-xtb distribution (https://github.com/grimme-lab/g-xtb), which bundles the parameters.`;
                    setStatusText('xtb optimization failed - see output');
                } else {
                    const match = stdout.match(/TOTAL ENERGY\s+(-?\d+\.\d+)/);
                    if (match) {
                        const energy = match[1];
                        outputTextarea.value += `\n\n=== ENERGY CALCULATION COMPLETED (${elapsed}s) ===\nTotal energy: ${energy} Eh`;
                        setStatusText(`g-xTB total energy: ${energy} Eh (${elapsed}s)`);
                    } else {
                        outputTextarea.value += `\n\n=== ENERGY CALCULATION FAILED ===\nNo total energy was found in the xtb output. See above.\nIf this mentions missing g-xTB parameters, make sure the xtb being run is the one from the g-xtb distribution (https://github.com/grimme-lab/g-xtb), which bundles the parameters.`;
                        setStatusText('xtb energy calculation failed - see output');
                    }
                }
                cleanup();
            },
        });
    }
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

