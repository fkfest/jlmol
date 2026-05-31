// Add toggle spin function with proper cleanup
function toggleSpin() {
    isSpinning = !isSpinning;
    try {
        Jmol.script(jmolApplet0, isSpinning ? 'spin on' : 'spin off');
        document.getElementById('spinButton').textContent = isSpinning ? 'Stop' : 'Spin';
    } catch (e) {
        console.error('Error toggling spin:', e);
        isSpinning = false;
        document.getElementById('spinButton').textContent = 'Spin';
    }
}

// Add function to set display mode
function setDisplayMode(mode) {
    try {
        console.log('setDisplayMode: Setting display mode to', mode);
        
        // Check if JSmol applet is ready
        if (!jmolApplet0 || typeof Jmol === 'undefined') {
            console.error('setDisplayMode: JSmol applet not ready');
            document.getElementById('status').innerHTML = 'JSmol not ready';
            return;
        }
        
        // First check if there are any atoms loaded
        const atomCount = Jmol.evaluateVar(jmolApplet0, '{*}.length');
        if (!atomCount || atomCount === 0) {
            console.warn('setDisplayMode: No atoms loaded');
            document.getElementById('status').innerHTML = 'No molecule loaded';
            return;
        }
        
        let script = '';
        let buttonText = '';
        
        switch(mode) {
            case 'wireframe':
                script = 'spacefill off; wireframe only; wireframe 0.1';
                buttonText = 'Wireframe';
                break;
            case 'spacefill':
                script = 'wireframe off; spacefill only; spacefill 100%';
                buttonText = 'Spacefill';
                break;
            case 'default':
            default:
                script = 'spacefill 23%; wireframe 0.15';
                buttonText = 'Ball & Stick';
                mode = 'default';
                break;
        }
        
        console.log('setDisplayMode: Executing script:', script);
        Jmol.script(jmolApplet0, script);
        
        // Update button text and store mode
        const displayButton = document.getElementById('displayButton');
        if (displayButton) {
            displayButton.textContent = buttonText;
        }
        
        displayMode = mode;
        
        console.log('setDisplayMode: Successfully set to', mode);
        
    } catch (error) {
        console.error('setDisplayMode: Error setting display mode:', error);
        document.getElementById('status').innerHTML = 'Error changing display mode';
    }
}

// Update toggleDisplayMode to use setDisplayMode
function toggleDisplayMode() {
    try {
        console.log('toggleDisplayMode: Current mode:', displayMode);
        
        switch(displayMode) {
            case 'default':
                setDisplayMode('wireframe');
                break;
            case 'wireframe':
                setDisplayMode('spacefill');
                break;
            case 'spacefill':
                setDisplayMode('default');
                break;
            default:
                // If mode is undefined or unknown, start with default
                setDisplayMode('default');
                break;
        }
    } catch (error) {
        console.error('toggleDisplayMode: Error toggling display mode:', error);
        document.getElementById('status').innerHTML = 'Error toggling display mode';
    }
}

// Add zoom control functions
function adjustZoom(direction) {
    if (direction === '+' && currentZoom < 200) {
        currentZoom += 20;
    } else if (direction === '-' && currentZoom > 40) {
        currentZoom -= 20;
    }
    Jmol.script(jmolApplet0, 'zoom ' + currentZoom);
}

function resetZoom() {
    currentZoom = 100;
    Jmol.script(jmolApplet0, 'zoom 100');
}

