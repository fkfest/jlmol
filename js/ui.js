// Make editor panel draggable
function initDraggable() {
    // How far the header must stay inside the window so it's always grabbable.
    const EDGE = 8;            // min gap kept between a panel and the window edges
    const MIN_VISIBLE_X = 60;  // min px of the header kept reachable horizontally
    const MIN_PANEL = 120;     // never cap a panel smaller than this

    // Every panel we've wired up, so window resizes can re-clamp them all.
    const draggables = [];

    // Bumped each time a panel is clicked or shown so it comes to the front. The
    // base (10000) stays above the main window, so panels are always on top of it.
    let panelTopZ = 10000;

    function makeDraggable(panel, header) {
        if (!panel || !header) return;

        // Clicking (or opening) a panel raises it above the other panels.
        function bringToFront() { panel.style.zIndex = ++panelTopZ; }
        panel.addEventListener('mousedown', bringToFront);
        panel.addEventListener('touchstart', bringToFront, { passive: true });

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Touch support so panels can be dragged on mobile devices too.
        header.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', dragEnd);
        document.addEventListener('touchcancel', dragEnd);

        // Double-clicking the header snaps the panel back to its default spot
        // and default size — a quick escape hatch if it's been dragged somewhere
        // awkward or resized larger than the screen.
        header.addEventListener('dblclick', (e) => {
            if (isDragHandle(e.target)) resetPanel();
        });

        // Panels are opened by other modules simply setting display:block. Watch
        // for that so the size limit is applied as soon as a panel is shown, not
        // only after the first drag. Guarded on the display value so our own
        // style writes (transform / max-*) don't retrigger it.
        let lastDisplay = panel.style.display;
        new MutationObserver(() => {
            const display = panel.style.display;
            if (display !== lastDisplay) {
                lastDisplay = display;
                if (display !== 'none') { applySizeLimit(); bringToFront(); }
            }
        }).observe(panel, { attributes: true, attributeFilter: ['style'] });

        // Read the pointer position from either a mouse or a touch event.
        function getPoint(e) {
            if (e.touches && e.touches.length) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        // The header holds the title (and sometimes an icon and a Close button).
        // A drag or double-click reset should work from the header or any of its
        // non-interactive parts (title text, icon) — the whole bar, not just the
        // slivers around the children — but never from a control such as the Close
        // button, so those keep working normally.
        function isDragHandle(target) {
            if (!target || !header.contains(target)) return false;
            const control = target.closest && target.closest('button, a, input, select, textarea');
            if (control && header.contains(control)) return false;
            return true;
        }

        // Constrain a candidate translate so the header (the only drag handle)
        // always stays reachable: fully on screen vertically, and with at least
        // MIN_VISIBLE_X px within the window horizontally. Without this a panel
        // could be dragged past the top edge and become impossible to grab back.
        function clampToViewport(rawX, rawY) {
            const rect = header.getBoundingClientRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // Where the header would land if we applied (rawX, rawY).
            const predLeft = rect.left + (rawX - xOffset);
            const predTop = rect.top + (rawY - yOffset);

            const minLeft = MIN_VISIBLE_X - rect.width;
            const maxLeft = winW - MIN_VISIBLE_X;
            const minTop = EDGE;
            const maxTop = Math.max(EDGE, winH - rect.height - EDGE);

            const clampedLeft = Math.min(Math.max(predLeft, minLeft), maxLeft);
            const clampedTop = Math.min(Math.max(predTop, minTop), maxTop);

            // Convert the clamped screen position back into a translate value.
            return {
                x: xOffset + (clampedLeft - rect.left),
                y: yOffset + (clampedTop - rect.top),
            };
        }

        // Padding + border around the content box. max-width/height apply to the
        // content box under the default box-sizing: content-box, so we subtract
        // this chrome to keep the panel's outer edge (where the resize handle is)
        // at the intended margin. Measured once — it doesn't change.
        let chromeW = null;
        let chromeH = null;
        function measureChrome() {
            const cs = getComputedStyle(panel);
            const px = (v) => parseFloat(v) || 0;
            if (cs.boxSizing === 'border-box') {
                chromeW = 0;
                chromeH = 0;
                return;
            }
            chromeW = px(cs.paddingLeft) + px(cs.paddingRight)
                + px(cs.borderLeftWidth) + px(cs.borderRightWidth);
            chromeH = px(cs.paddingTop) + px(cs.paddingBottom)
                + px(cs.borderTopWidth) + px(cs.borderBottomWidth);
        }

        // Let the panel grow to fill the space right of / below where it now sits,
        // leaving only a small margin so the resize handle stays on screen. Using
        // the panel's live position (not a fixed 90vh/vw) means it neither wastes
        // visible space when near an edge nor lets the bottom-right handle run off
        // the screen when positioned lower down. Recomputed on move/resize/show.
        function applySizeLimit() {
            const rect = panel.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return; // not visible
            if (chromeW === null) measureChrome();
            const maxW = Math.max(MIN_PANEL, window.innerWidth - rect.left - EDGE - chromeW);
            const maxH = Math.max(MIN_PANEL, window.innerHeight - rect.top - EDGE - chromeH);
            panel.style.maxWidth = maxW + 'px';
            panel.style.maxHeight = maxH + 'px';
        }

        function apply(x, y) {
            currentX = x;
            currentY = y;
            xOffset = x;
            yOffset = y;
            panel.style.transform = `translate(${x}px, ${y}px)`;
            applySizeLimit();
        }

        // Restore the panel's default position and size (clearing the inline
        // width/height that the CSS resize handle writes reverts it to the size
        // defined in the stylesheet).
        function resetPanel() {
            panel.style.width = '';
            panel.style.height = '';
            apply(0, 0);
        }

        // Nudge a visible panel back into view (e.g. after the window shrinks).
        function clampIntoView() {
            const rect = header.getBoundingClientRect();
            // Skip panels that aren't currently rendered (getBoundingClientRect
            // returns zeros), otherwise we'd shove hidden panels around.
            if (rect.width === 0 && rect.height === 0) return;
            const c = clampToViewport(xOffset, yOffset);
            apply(c.x, c.y);
        }

        function dragStart(e) {
            // Only the left mouse button starts a drag (touchstart has no button).
            if (e.type === 'mousedown' && e.button !== 0) return;

            const point = getPoint(e);
            initialX = point.x - xOffset;
            initialY = point.y - yOffset;

            if (isDragHandle(e.target)) {
                isDragging = true;
                // While dragging, stop the JSmol viewer / 2D editor from capturing
                // mouse events. They handle (and swallow) mouseup, so a release over
                // them never reaches our document handler — which would leave the
                // drag "stuck" and the panel following the mouse afterwards.
                document.body.classList.add('dragging-panel');
                // Prevent the page from scrolling while dragging on touch.
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
            }
        }

        function drag(e) {
            if (!isDragging) return;

            // Safety net: a mousemove with no button held means the button was
            // released somewhere we couldn't see the mouseup (e.g. swallowed by the
            // viewer, or outside the window). Treat it as the end of the drag rather
            // than moving the panel. (touchmove has no `buttons`; touch ends cleanly
            // via touchend/touchcancel.)
            if (e.type === 'mousemove' && e.buttons === 0) {
                dragEnd();
                return;
            }

            e.preventDefault();
            const point = getPoint(e);
            const c = clampToViewport(point.x - initialX, point.y - initialY);
            apply(c.x, c.y);
        }

        function dragEnd(e) {
            // Ignore releases of a non-left mouse button, so pressing/releasing
            // another button mid-drag doesn't abort an in-progress left drag.
            // touchend/touchcancel and the internal buttons===0 call pass no mouse
            // button, so they still end the drag.
            if (e && e.type === 'mouseup' && e.button !== 0) return;
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            document.body.classList.remove('dragging-panel');
        }

        draggables.push({ clampIntoView });
    }

    // Make all panels draggable
    makeDraggable(
        document.getElementById('editor-panel'),
        document.getElementById('editor-header')
    );
    makeDraggable(
        document.getElementById('orbitalControls'),
        document.getElementById('orbital-header')
    );
    makeDraggable(
        document.getElementById('elemcoPanel'),
        document.getElementById('elemco-header')
    );
    makeDraggable(
        document.getElementById('preferencesPanel'),
        document.getElementById('preferences-header')
    );
    makeDraggable(
        document.getElementById('xtbPanel'),
        document.getElementById('xtb-header')
    );

    // If the window is resized smaller, pull any now-off-screen panel back so its
    // header stays reachable.
    window.addEventListener('resize', () => {
        draggables.forEach(d => d.clampIntoView());
    });
}

// Add page zoom functionality
let controlsZoom = 100;

document.addEventListener('wheel', function(e) {
    // Only zoom if Ctrl is pressed and mouse is over the controls panel
    if (e.ctrlKey && e.target.closest('#controls')) {
        e.preventDefault();  // Prevent default browser zoom
        
        const delta = e.deltaY < 0 ? 10 : -10;
        controlsZoom = Math.min(Math.max(40, controlsZoom + delta), 200);  // Limit zoom between 40% and 200%
        
        // Apply zoom only to controls panel
        document.getElementById('controls').style.transform = `scale(${controlsZoom / 100})`;
        
        // Update status to show current zoom level
        setStatusText(`Controls zoom: ${controlsZoom}%`);
    }
}, { passive: false });  // Required for preventDefault to work

function toggleDragMinimize() {
    isDragMinimize = !isDragMinimize;
    if (isDragMinimize) {
        Jmol.script(jmolApplet0, 'set modelkitmode; set picking dragMinimize');
    } else {
        Jmol.script(jmolApplet0, 'set modelkitmode false; set picking ident');
    }
    document.getElementById('dragMinButton').classList.toggle('active');
    document.getElementById('dragMinButton').textContent = '3D';
}

// Add resize observer for JSmol viewer with throttling
function initResizeObserver() {
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(entries => {
        // Throttle resize events to prevent excessive GPU calls
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                const height = entry.contentRect.height;
                // Update JSmol viewer size
                if (jmolApplet0 && jmolApplet0._ready) {
                    try {
                        Jmol.resizeApplet(jmolApplet0, [width, height]);
                    } catch (e) {
                        console.error('Error resizing JSmol:', e);
                    }
                }
            }
        }, 100); // Throttle to 100ms
    });

    // Start observing the viewer container
    const viewer = document.getElementById('viewer');
    resizeObserver.observe(viewer);
}

