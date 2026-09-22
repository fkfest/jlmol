// Where jlmol was started from, for a command-line start. Pure: no electron,
// so it can be unit-tested with plain node (see the self-test at the bottom).
//
// Sources, in order:
//   1. --workdir=PATH on the command line. The npm start scripts pass
//      $INIT_CWD (the directory `npm start` was typed in; npm itself chdirs
//      to the package root) plus --wsl-distro=$WSL_DISTRO_NAME. Under WSL
//      the Windows Electron binary may be running, so a POSIX path is mapped
//      to its Windows spelling (/mnt/c/x -> C:\x, else \\wsl.localhost\...).
//   2. A terminal on stdin/stdout/stderr: INIT_CWD if npm set it, else cwd.
//   3. Nothing: null, the caller keeps the temp-dir behaviour.
'use strict';
const path = require('path');

function argValue(argv, name) {
    const prefix = `--${name}=`;
    const hit = argv.find((a) => a.startsWith(prefix));
    return hit ? hit.slice(prefix.length) : null;
}

// Candidate spellings of a POSIX path for a win32 process started from WSL.
function windowsCandidates(posixPath, distro) {
    const out = [];
    const m = /^\/mnt\/([a-zA-Z])(\/.*)?$/.exec(posixPath);
    if (m) out.push(`${m[1].toUpperCase()}:${(m[2] || '/').replace(/\//g, '\\')}`);
    if (distro) {
        const rest = posixPath.replace(/\//g, '\\');
        out.push(`\\\\wsl.localhost\\${distro}${rest}`, `\\\\wsl$\\${distro}${rest}`);
    }
    return out;
}

function findLaunchDir({ argv, env, platform, isTTY, isDir, cwd }) {
    const P = platform === 'win32' ? path.win32 : path.posix;
    const explicit = argValue(argv, 'workdir');
    if (explicit) {
        const candidates = [explicit];
        if (platform === 'win32' && explicit.startsWith('/')) {
            candidates.push(...windowsCandidates(explicit, argValue(argv, 'wsl-distro') || env.WSL_DISTRO_NAME));
        }
        for (const c of candidates) {
            if (P.isAbsolute(c) && isDir(c)) return { dir: c, source: '--workdir' };
        }
        return { dir: null, source: `--workdir rejected (${explicit})` };
    }
    if (!isTTY()) return { dir: null, source: 'no terminal' };
    const init = env.INIT_CWD;
    if (init && P.isAbsolute(init) && isDir(init)) return { dir: init, source: 'terminal, INIT_CWD' };
    return { dir: cwd(), source: 'terminal, cwd' };
}

module.exports = { findLaunchDir, windowsCandidates };

if (require.main === module) {
    // node launchdir.js -- runs the self-test
    const assert = require('assert');
    const dirs = new Set(['/tmp/here', '/home/u/proj', 'C:\\Users\\u\\x', '\\\\wsl.localhost\\Ubuntu\\home\\u\\x']);
    const base = { env: {}, platform: 'linux', isTTY: () => false, isDir: (d) => dirs.has(d), cwd: () => '/home/u/proj' };
    const run = (o) => findLaunchDir({ ...base, ...o }).dir;
    assert.strictEqual(run({ argv: [] }), null);
    assert.strictEqual(run({ argv: [], isTTY: () => true }), '/home/u/proj');
    assert.strictEqual(run({ argv: [], isTTY: () => true, env: { INIT_CWD: '/tmp/here' } }), '/tmp/here');
    assert.strictEqual(run({ argv: [], isTTY: () => true, env: { INIT_CWD: '/nope' } }), '/home/u/proj');
    assert.strictEqual(run({ argv: ['--workdir=/tmp/here'] }), '/tmp/here');
    assert.strictEqual(run({ argv: ['--workdir=/nope'], isTTY: () => true }), null);
    assert.strictEqual(run({ argv: ['--workdir=$INIT_CWD'] }), null);           // cmd.exe left it unexpanded
    assert.strictEqual(run({ argv: ['--workdir='], isTTY: () => true }), '/home/u/proj');   // empty = not given
    assert.strictEqual(run({ argv: ['--workdir=/mnt/c/Users/u/x'], platform: 'win32' }), 'C:\\Users\\u\\x');
    assert.strictEqual(run({ argv: ['--workdir=/home/u/x', '--wsl-distro=Ubuntu'], platform: 'win32' }),
        '\\\\wsl.localhost\\Ubuntu\\home\\u\\x');
    assert.strictEqual(run({ argv: ['--workdir=/home/u/x'], platform: 'win32' }), null);   // no distro known
    assert.deepStrictEqual(windowsCandidates('/mnt/d', 'Deb'), ['D:\\', '\\\\wsl.localhost\\Deb\\mnt\\d', '\\\\wsl$\\Deb\\mnt\\d']);
    console.log('launchdir self-test ok');
}
