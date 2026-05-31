function handleFileSelect(evt) {
    var files = evt.target.files;
    if (files.length > 0) {
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Save current display mode
                const currentDisplayMode = displayMode || 'default';
                
                const fileContent = e.target.result;
                const fileName = file.name.toLowerCase();
                
                // Check if it's an XYZ file and use custom loader
                if (fileName.endsWith('.xyz')) {
                    // Don't automatically set shouldUseNumberedAtoms to true
                    // Instead, let loadXYZWithNumberedAtoms detect if numbered atoms are present
                    loadXYZWithNumberedAtoms(fileContent);
                } else {
                    // Clear numbered atom names for non-XYZ files
                    clearOriginalAtomNames();
                    originalXYZContent = null;
                    shouldUseNumberedAtoms = false; // Non-XYZ files should not use numbered atoms
                    
                    // Clear database metadata since this is not a database load
                    window.databaseMetadata = null;
                    
                    // Use normal loading for other file types
                    Jmol.script(jmolApplet0, 'load inline "' + fileContent + '" filter "NOSORT"');
                    document.getElementById('status').innerHTML = 'File loaded successfully';
                    
                    // Refresh atom names to remove any numbered indices for non-XYZ files
                    setTimeout(() => {
                        refreshAtomNames();
                        console.log('handleFileSelect: Atom names refreshed for non-XYZ file');
                        
                        // Update MOL file data for JSME integration after file loading
                        try {
                            lastMolFile = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                            debugLog('File', 'Updated lastMolFile after loading non-XYZ file');
                        } catch (molError) {
                            console.error('Error updating MOL file data in handleFileSelect:', molError);
                        }
                    }, 100);
                }
                
                // Restore display mode after loading with a delay
                setTimeout(() => {
                    console.log('handleFileSelect: Restoring display mode:', currentDisplayMode);
                    setDisplayMode(currentDisplayMode);
                    
                    // Apply all JSmol preferences after loading
                    if (typeof applyJSmolPreferences === 'function') {
                        applyJSmolPreferences();
                        console.log('handleFileSelect: Applied JSmol preferences');
                    }
                }, 300);
                
            } catch (err) {
                document.getElementById('status').innerHTML = 'Error loading file: ' + err.message;
            }
        };
        reader.readAsText(file);
    }
}

function loadSample(filename) {
    try {
        // Save current display mode
        const currentDisplayMode = displayMode || 'default';
        
        // Clear any existing numbered atom names since this is a sample load
        clearOriginalAtomNames();
        originalXYZContent = null;
        shouldUseNumberedAtoms = false; // Sample loads should not use numbered atoms
        
        // Clear database metadata since this is not a database load
        window.databaseMetadata = null;
        
        Jmol.script(jmolApplet0, 'load "jsmol/data/' + filename + '"');
        document.getElementById('status').innerHTML = 'Sample loaded successfully';
        
        // Restore display mode after loading with a delay
        setTimeout(() => {
            console.log('loadSample: Restoring display mode:', currentDisplayMode);
            setDisplayMode(currentDisplayMode);
            
            // Apply all JSmol preferences after loading
            if (typeof applyJSmolPreferences === 'function') {
                applyJSmolPreferences();
                console.log('loadSample: Applied JSmol preferences');
            }
            
            // Refresh atom names to remove any numbered indices
            setTimeout(() => {
                refreshAtomNames();
                console.log('loadSample: Atom names refreshed to remove numbered indices');
                
                // Update MOL file data for JSME integration after sample loading
                try {
                    lastMolFile = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                    debugLog('Sample', 'Updated lastMolFile after loading sample');
                } catch (molError) {
                    console.error('Error updating MOL file data in loadSample:', molError);
                }
            }, 100);
        }, 200);
        
    } catch (err) {
        document.getElementById('status').innerHTML = 'Error loading sample: ' + err.message;
    }
}

// Database loading functions
async function loadFromDatabase(identifier) {
    try {
        // Handle PubChem database queries
        let statusMessage = 'Loading from PubChem...';
        let loadCommand = identifier;
        
        // Store database metadata for XYZ generation
        let dbMetadata = {
            source: 'PubChem',
            originalQuery: identifier,
            queryType: null,
            cid: null,
            name: null,
            smiles: null,
            formula: null
        };
        
        if (identifier.startsWith(':smiles:')) {
            const smiles = identifier.substring(8);
            statusMessage = `Loading SMILES "${smiles}" from PubChem...`;
            dbMetadata.queryType = 'SMILES';
            dbMetadata.smiles = smiles;
        } else if (identifier.startsWith(':formula:')) {
            const formula = identifier.substring(9);
            statusMessage = `Loading molecular formula "${formula}" from PubChem...`;
            dbMetadata.queryType = 'Formula';
            dbMetadata.formula = formula;
            
            // Two-step process for formula searches:
            // Step 1: Get CIDs for the formula
            document.getElementById('status').innerHTML = `Step 1: Finding compounds with formula "${formula}"...`;
            
            try {
                const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/${encodeURIComponent(formula)}/cids/TXT`;
                console.log('Fetching CIDs from:', cidUrl);
                
                const cidResponse = await fetch(cidUrl);
                if (!cidResponse.ok) {
                    throw new Error(`No compounds found for formula "${formula}" (Status: ${cidResponse.status})`);
                }
                
                const cidText = await cidResponse.text();
                const cids = cidText.trim().split('\n').filter(line => line.trim());
                
                if (cids.length === 0) {
                    throw new Error(`No compounds found for formula "${formula}"`);
                }
                
                const firstCid = cids[0];
                console.log(`Found ${cids.length} compounds for formula "${formula}", using CID: ${firstCid}`);
                dbMetadata.cid = firstCid;
                
                // Step 2: Get SDF for the first CID (try 3D first, fallback to 2D)
                document.getElementById('status').innerHTML = `Step 2: Loading structure for CID ${firstCid}...`;
                
                // Try 3D first
                let sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${firstCid}/SDF?record_type=3d`;
                try {
                    const sdfTest = await fetch(sdfUrl);
                    if (!sdfTest.ok) {
                        // Fallback to 2D if 3D not available
                        console.log(`3D structure not available for CID ${firstCid}, using 2D structure`);
                        sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${firstCid}/SDF`;
                    }
                } catch (e) {
                    // Fallback to 2D if 3D fails
                    console.log(`3D structure test failed for CID ${firstCid}, using 2D structure`);
                    sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${firstCid}/SDF`;
                }
                
                loadCommand = sdfUrl;
                statusMessage = `Loading molecular formula "${formula}" (CID: ${firstCid}) from PubChem...`;
                
            } catch (formulaError) {
                console.error('Formula search error:', formulaError);
                document.getElementById('status').innerHTML = `Error: ${formulaError.message}`;
                return;
            }
        } else if (identifier.startsWith(':')) {
            const query = identifier.substring(1);
            // Check if it's a number (CID) or name
            if (/^\d+$/.test(query)) {
                statusMessage = `Loading CID ${query} from PubChem...`;
                dbMetadata.queryType = 'CID';
                dbMetadata.cid = query;
            } else {
                statusMessage = `Loading "${query}" by name from PubChem...`;
                dbMetadata.queryType = 'Name';
                dbMetadata.name = query;
            }
        }
        
        document.getElementById('status').innerHTML = statusMessage;
        
        // Save current display mode
        const currentDisplayMode = displayMode || 'default';
        
        // Clear any existing numbered atom names since this is a database load
        clearOriginalAtomNames();
        shouldUseNumberedAtoms = false; // Database loads should not use numbered atoms
        console.log('loadFromDatabase: Set shouldUseNumberedAtoms to false for database load');
        
        // Store metadata globally for XYZ generation
        window.databaseMetadata = dbMetadata;
        console.log('Stored database metadata:', dbMetadata);
        
        console.log('Loading with command:', loadCommand);
        Jmol.script(jmolApplet0, 'load "' + loadCommand + '"');
        
        // Restore display mode after loading with a delay
        setTimeout(() => {
            setDisplayMode(currentDisplayMode);
            document.getElementById('status').innerHTML = 'Structure loaded successfully from PubChem';
            
            // Apply all JSmol preferences after loading
            if (typeof applyJSmolPreferences === 'function') {
                applyJSmolPreferences();
                console.log('loadFromDatabase: Applied JSmol preferences');
            }
            
            // Refresh atom names to remove any numbered indices
            setTimeout(() => {
                refreshAtomNames();
                console.log('loadFromDatabase: Atom names refreshed to remove numbered indices');
                
                // Update MOL file data for JSME integration after database loading
                try {
                    lastMolFile = Jmol.evaluateVar(jmolApplet0, 'write("mol")').trim();
                    debugLog('Database', 'Updated lastMolFile after loading from database');
                } catch (molError) {
                    console.error('Error updating MOL file data in loadFromDatabase:', molError);
                }
            }, 100);
        }, 1000);
        
    } catch (err) {
        console.error('loadFromDatabase error:', err);
        document.getElementById('status').innerHTML = 'Error loading from PubChem: ' + err.message;
    }
}

// Helper function to detect if a string looks like a molecular formula
function isMolecularFormula(str) {
    // Molecular formula pattern: starts with capital letter, contains only element symbols and numbers
    // Examples: H2O, C6H12O6, NaCl, C8H10N4O2, CH4, CO2, LiH, BeH2, MgO
    const formulaPattern = /^[A-Z][a-z]?\d*([A-Z][a-z]?\d*)*$/;
    
    // Must match the pattern and contain at least one element symbol
    if (!formulaPattern.test(str)) {
        return false;
    }
    
    // Additional check: should not contain SMILES-specific characters
    if (/[=@#\[\]()]/.test(str)) {
        return false;
    }
    
    // Check if it contains valid element symbols
    // Common elements include H, He, Li, Be, B, C, N, O, F, Ne, Na, Mg, Al, Si, P, S, Cl, Ar, K, Ca, etc.
    const validElements = [
        'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
        'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
        'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
        'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
        'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
        'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
        'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
        'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
        'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn'
    ];
    
    // Extract all element symbols from the formula
    const elements = str.match(/[A-Z][a-z]?/g) || [];
    
    // Check if all extracted elements are valid
    for (const element of elements) {
        if (!validElements.includes(element)) {
            return false;
        }
    }
    
    // Must contain at least one element
    if (elements.length === 0) {
        return false;
    }
    
    // If it looks like a molecular formula and contains valid elements, treat it as a formula
    return true;
}

function looksLikeChemicalName(str) {
    if (!/^[A-Za-z0-9\s,()-]+$/.test(str) || !/[A-Za-z]/.test(str)) {
        return false;
    }

    // IUPAC-style names often use comma-separated locants such as "3,4-" or "N,N-"
    if (str.includes(',')) {
        return true;
    }

    // Numeric locants followed by a hyphen and a word are more likely names than SMILES
    return /\d+(?:,\d+)*[A-Za-z]?-[A-Za-z]*[a-z]{2,}/.test(str);
}

async function loadFromPubChem() {
    const query = document.getElementById('pubchemInput').value.trim();
    if (!query) {
        document.getElementById('status').innerHTML = 'Please enter a search term';
        return;
    }
    
    const searchType = getCurrentSearchType();
    let prefix = ':';
    
    // Use explicit search type if selected, otherwise auto-detect
    if (searchType === 'cid') {
        prefix = ':';
    } else if (searchType === 'name') {
        prefix = ':';
    } else if (searchType === 'formula') {
        prefix = ':formula:';
    } else if (searchType === 'smiles') {
        prefix = ':smiles:';
    } else if (searchType === 'auto') {
        // Auto-detect query type based on input (existing logic)
        // Check if it's a pure number (CID)
        if (/^\d+$/.test(query)) {
            prefix = ':';
        }
        // Check if it's a molecular formula
        else if (isMolecularFormula(query)) {
            prefix = ':formula:';
        }
        // Chemical names with locants such as "3,4-" or "2-" should stay name searches
        else if (looksLikeChemicalName(query)) {
            prefix = ':';
        }
        // Check if it's a SMILES string (more specific patterns)
        else if (/[=@#]|[\[\]()]|[cC][cC]|[nN][oO]|[sS][iI]|[pP][hH]|\d[nNcCoOsS]|[nNcCoOsS]\d|\+|-/.test(query) && 
                 !/^[a-zA-Z\s\-_()]+$/.test(query)) {
            prefix = ':smiles:';
        }
        // Otherwise treat as name (default)
        else {
            prefix = ':';
        }
    }
    
    await loadFromDatabase(prefix + query);
}

// Test function for molecular formula search
function testFormulaSearch(formula) {
    const input = document.getElementById('pubchemInput');
    input.value = formula;
    
    // Set search type to formula
    currentSearchType = 'formula';
    updateInputPlaceholder();
    
    // Update dropdown UI to show formula is selected
    const options = document.querySelectorAll('.search-type-option');
    options.forEach(option => option.classList.remove('selected'));
    const formulaOption = document.querySelector('.search-type-option[data-value="formula"]');
    if (formulaOption) {
        formulaOption.classList.add('selected');
    }
    
    // Perform the search
    loadFromPubChem();
}

// Debug function to test dropdown (can be called from console)
window.testDropdown = function() {
    console.log('Testing dropdown...');
    const button = document.getElementById('searchTypeSelectorButton');
    const dropdown = document.getElementById('searchTypeDropdown');
    
    console.log('Elements:', { button: !!button, dropdown: !!dropdown });
    
    if (button && dropdown) {
        console.log('Button click listeners:', button.onclick, button.addEventListener ? 'has addEventListener' : 'no addEventListener');
        console.log('Attempting to toggle dropdown...');
        toggleSearchTypeDropdown();
        return 'Dropdown toggle attempted';
    } else {
        return 'Elements not found';
    }
};

// Add keyboard event handlers for database inputs
function setupDatabaseInputHandlers() {
    console.log('setupDatabaseInputHandlers called');
    
    const pubchemInput = document.getElementById('pubchemInput');
    const searchTypeButton = document.getElementById('searchTypeSelectorButton');
    const dropdown = document.getElementById('searchTypeDropdown');
    
    // Check if elements exist
    if (!pubchemInput || !searchTypeButton || !dropdown) {
        console.error('Database input elements not found:', {
            pubchemInput: !!pubchemInput,
            searchTypeButton: !!searchTypeButton,
            dropdown: !!dropdown
        });
        // Retry after a short delay
        setTimeout(() => {
            console.log('Retrying setupDatabaseInputHandlers...');
            setupDatabaseInputHandlers();
        }, 500);
        return;
    }
    
    // Check if already initialized to prevent duplicate listeners
    if (pubchemInput._handlersInitialized) {
        console.log('Database input handlers already initialized, skipping...');
        return;
    }
    
    console.log('Setting up event handlers...');
    
    // Enter key handler
    const keypressHandler = function(e) {
        if (e.key === 'Enter') {
            loadFromPubChem();
        }
    };
    pubchemInput.addEventListener('keypress', keypressHandler);
    
    // Search type selector click handler (remove onclick to avoid conflicts)
    searchTypeButton.removeAttribute('onclick');
    const clickHandler = function(e) {
        console.log('Search type button clicked via event listener!');
        e.stopPropagation();
        toggleSearchTypeDropdown();
    };
    searchTypeButton.addEventListener('click', clickHandler);
    
    // Store handlers for cleanup if needed
    searchTypeButton._clickHandler = clickHandler;
    pubchemInput._keypressHandler = keypressHandler;
    
    // Dropdown option click handlers
    const options = dropdown.querySelectorAll('.search-type-option');
    options.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const label = this.querySelector('.option-label').textContent;
            selectSearchType(value, label);
            hideSearchTypeDropdown();
            updateInputPlaceholder();
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchTypeButton.contains(e.target) && !dropdown.contains(e.target)) {
            hideSearchTypeDropdown();
        }
    });
    
    // Mark as initialized
    pubchemInput._handlersInitialized = true;
    console.log('Database input handlers initialized successfully');
    
    // Initialize selected state
    updateSelectedOption();
}

let currentSearchType = 'auto';

function getCurrentSearchType() {
    return currentSearchType;
}

function selectSearchType(value, label) {
    currentSearchType = value;
    updateSelectedOption();
}

function updateSelectedOption() {
    const options = document.querySelectorAll('.search-type-option');
    options.forEach(option => {
        option.classList.remove('selected');
        if (option.getAttribute('data-value') === currentSearchType) {
            option.classList.add('selected');
        }
    });
}

function toggleSearchTypeDropdown() {
    const dropdown = document.getElementById('searchTypeDropdown');
    const button = document.getElementById('searchTypeSelectorButton');
    
    if (dropdown.style.display === 'block') {
        hideSearchTypeDropdown();
    } else {
        showSearchTypeDropdown();
    }
}

function showSearchTypeDropdown() {
    const dropdown = document.getElementById('searchTypeDropdown');
    const button = document.getElementById('searchTypeSelectorButton');
    
    dropdown.style.display = 'block';
    button.classList.add('active');
    updateSelectedOption();
}

function hideSearchTypeDropdown() {
    const dropdown = document.getElementById('searchTypeDropdown');
    const button = document.getElementById('searchTypeSelectorButton');
    
    dropdown.style.display = 'none';
    button.classList.remove('active');
}

function updateInputPlaceholder() {
    const searchType = getCurrentSearchType();
    const input = document.getElementById('pubchemInput');
    
    switch(searchType) {
        case 'cid':
            input.placeholder = 'Enter PubChem CID (e.g., 1983 for caffeine)';
            break;
        case 'name':
            input.placeholder = 'Enter chemical name (e.g., caffeine, aspirin, benzene)';
            break;
        case 'formula':
            input.placeholder = 'Enter molecular formula (e.g., C8H10N4O2, H2O, C6H12O6)';
            break;
        case 'smiles':
            input.placeholder = 'Enter SMILES string (e.g., C6H6, CC=O, CCO)';
            break;
        case 'auto':
        default:
            input.placeholder = 'PubChem: CID, name, formula, or SMILES (e.g., 1983, aspirin, H2O, CC=O)';
            break;
    }
}

