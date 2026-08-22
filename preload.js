// Preload bridge (issue #45, item 3): the renderer's ONLY door to the system.
//
// With contextIsolation on and nodeIntegration off, the renderer no longer has
// require/fs/process. Everything the app legitimately needs from Node is this
// narrow, auditable surface:
//   - platform info (static strings),
//   - openExternal (http/https only, validated in the main process),
//   - work directories: created by main under the OS temp dir, addressed by
//     opaque tokens; file reads/writes are confined to those directories,
//   - process runs: spawn with streamed stdout/stderr and kill, for the
//     user-configured xtb and Julia commands.
// Running user-configured commands is the app's purpose, so spawn is not
// command-restricted -- the isolation win is that a compromised renderer gets
// exactly this API and nothing else (no fs outside work dirs, no require).
const { contextBridge, ipcRenderer } = require('electron');

const procListeners = new Map();   // procId -> { data, close, error }
// Events can arrive before spawn()'s invoke reply registers the handlers --
// the proc-event channel and the invoke reply are not mutually ordered, and a
// fast process can emit (or even close) first. Unknown procIds are buffered
// and replayed on registration, so no output or close is ever dropped.
const pendingEvents = new Map();   // procId -> [{type, payload}], capped

function deliver(l, procId, type, payload) {
    if (type === 'stdout' || type === 'stderr') l.data && l.data(type, payload);
    else if (type === 'close') { l.close && l.close(payload); procListeners.delete(procId); }
    else if (type === 'error') { l.error && l.error(payload); procListeners.delete(procId); }
}

ipcRenderer.on('jlmol-proc-event', (_event, procId, type, payload) => {
    const l = procListeners.get(procId);
    if (l) { deliver(l, procId, type, payload); return; }
    let queue = pendingEvents.get(procId);
    if (!queue) { queue = []; pendingEvents.set(procId, queue); }
    if (queue.length < 10000) queue.push({ type, payload });
});

contextBridge.exposeInMainWorld('jlmolNative', {
    isElectron: true,
    platform: process.platform,

    openExternal: (url) => ipcRenderer.invoke('jlmol-open-external', url),

    // --- scoped work directories -----------------------------------------
    mkWorkDir: (prefix) => ipcRenderer.invoke('jlmol-mk-workdir', prefix),
    writeFile: (dirToken, name, content) =>
        ipcRenderer.invoke('jlmol-write-file', dirToken, name, content),
    readFile: (dirToken, name) =>
        ipcRenderer.invoke('jlmol-read-file', dirToken, name),
    removeWorkDir: (dirToken) =>
        ipcRenderer.invoke('jlmol-rm-workdir', dirToken),
    workDirPath: (dirToken) =>
        ipcRenderer.invoke('jlmol-workdir-path', dirToken),

    // --- processes --------------------------------------------------------
    // handlers: { data(kind, text), close(code), error(message) }
    spawn: async (command, args, options, handlers) => {
        const procId = await ipcRenderer.invoke(
            'jlmol-spawn', command, args, options || {});
        procListeners.set(procId, handlers || {});
        const queued = pendingEvents.get(procId);
        if (queued) {
            pendingEvents.delete(procId);
            for (const { type, payload } of queued) {
                deliver(handlers || {}, procId, type, payload);
            }
        }
        return procId;
    },
    kill: (procId) => ipcRenderer.invoke('jlmol-kill', procId),
});
