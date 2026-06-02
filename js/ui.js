// Make editor panel draggable
function initDraggable() {
    function makeDraggable(panel, header) {
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

        // Read the pointer position from either a mouse or a touch event.
        function getPoint(e) {
            if (e.touches && e.touches.length) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
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
                currentX = point.x - initialX;
                currentY = point.y - initialY;
                xOffset = currentX;
                yOffset = currentY;

                panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
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

