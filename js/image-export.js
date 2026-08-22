// Function to export the current view as an image
function exportImage() {
    try {
        // Get user preferences for export format and transparency
        const prefs = getPreferences();
        const exportFormat = prefs.exportFormat || 'png';
        const useTransparentBackground = prefs.exportTransparentBackground !== false;
        
        // Handle background setting for exports that need white background
        const needsWhiteBackground = exportFormat === 'jpg' || (exportFormat === 'png' && !useTransparentBackground);
        let currentBg = null;
        
        if (needsWhiteBackground) {
            currentBg = Jmol.evaluateVar(jmolApplet0, "background");
            Jmol.script(jmolApplet0, "background white");
        }
        
        // Get the image data from JSmol
        // Note: JSmol.getPropertyAsString with "image" returns JPEG data
        var imageData = Jmol.getPropertyAsString(jmolApplet0, "image");
        
        // Restore original background if it was changed
        if (currentBg !== null) {
            Jmol.script(jmolApplet0, `background ${currentBg}`);
        }
        
        // Convert to proper data URL if needed
        if (!imageData.startsWith('data:')) {
            imageData = 'data:image/jpeg;base64,' + imageData;
        }
        
        // Handle format conversion
        if (exportFormat === 'png') {
            // Convert JPEG to PNG for proper format and transparency support
            convertAndDownload(imageData, 'png', useTransparentBackground);
        } else {
            // Direct JPEG download
            downloadImage(imageData, 'molecule.jpg', 'jpg', false);
        }
        
    } catch (err) {
        setStatusText('Error exporting image: ' + err.message);
        console.error('Export error:', err);
    }
}

// Convert image format and handle transparency
function convertAndDownload(jpegDataUrl, targetFormat, useTransparent) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // For PNG with white background, fill canvas with white first
        if (targetFormat === 'png' && !useTransparent) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        // For transparent PNG, we leave canvas transparent (default)
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        // Convert to target format
        let outputData;
        if (targetFormat === 'png') {
            outputData = canvas.toDataURL('image/png');
        } else {
            outputData = canvas.toDataURL('image/jpeg', 0.9);
        }
        
        const filename = `molecule.${targetFormat}`;
        downloadImage(outputData, filename, targetFormat, useTransparent);
    };
    
    img.src = jpegDataUrl;
}

// Helper function to handle the actual download
function downloadImage(imageData, filename, format, transparent) {
    // Create a temporary link element
    var link = document.createElement('a');
    link.href = imageData;
    link.download = filename;
    
    // This is required for Firefox
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    
    // Small delay before removing the link to ensure the download starts
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
    
    const transparencyNote = (format === 'png' && transparent) ? ' with transparent background' : '';
    setStatusText(`${format.toUpperCase()} image exported successfully${transparencyNote}`);
}

