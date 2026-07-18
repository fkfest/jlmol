// Make editor panel draggable
function initDraggable() {
    // How far the header must stay inside the window so it's always grabbable.
    const EDGE = 8;            // min gap kept between the header and the top edge
    const MIN_VISIBLE_X = 60;  // min px of the header kept reachable horizontally

    // Every panel we've wired up, so window resizes can re-clamp them all.
    const draggables = [];

    function makeDraggable(panel, header) {
        if (!panel || !header) return;

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
            if (e.target === header) resetPanel();
        });

        // Read the pointer position from either a mouse or a touch event.
        function getPoint(e) {
            if (e.touches && e.touches.length) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
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

        function apply(x, y) {
            currentX = x;
            currentY = y;
            xOffset = x;
            yOffset = y;
            panel.style.transform = `translate(${x}px, ${y}px)`;
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
            const point = getPoint(e);
            initialX = point.x - xOffset;
            initialY = point.y - yOffset;

            if (e.target === header) {
                isDragging = true;
                // Prevent the page from scrolling while dragging on touch.
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                const point = getPoint(e);
                const c = clampToViewport(point.x - initialX, point.y - initialY);
                apply(c.x, c.y);
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
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
        document.getElementById('status').innerHTML = `Controls zoom: ${controlsZoom}%`;
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

