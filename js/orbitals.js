        var currentOrbitalIndex = 1;
        var orbitalsVisible = false;
        
        function toggleOrbitalControls() {
            var orbitalControls = document.getElementById('orbitalControls');
            if (orbitalControls.style.display === 'none' || !orbitalControls.style.display) {
                orbitalControls.style.display = 'block';
                // For molden files, ensure orbitals are loaded
                let fileName = Jmol.evaluateVar(jmolApplet0, '_modelFile.name');
                if (fileName && fileName.toLowerCase().endsWith('.molden')) {
                    Jmol.script(jmolApplet0, 'mo fill nomesh;');
                }
                // Initialize orbital visualization if not already visible
                if (!orbitalsVisible) {
                    Jmol.script(jmolApplet0, 'mo fill nomesh translucent 0.5');
                    getOrbitalInfo();
                }
            } else {
                orbitalControls.style.display = 'none';
                Jmol.script(jmolApplet0, 'mo delete');
                orbitalsVisible = false;
            }
        }
        
        function showOrbital(index) {
            if (index < 1 || (numOrbitals > 0 && index > numOrbitals)) return;
            currentOrbitalIndex = index;
            document.getElementById('currentOrbital').textContent = index;
            Jmol.script(jmolApplet0, 'mo ' + index + ' fill nomesh translucent 0.5');
            orbitalsVisible = true;
            updateOrbitalList();
        }
        
        function changeOrbital(delta) {
            if (orbitalsVisible) {
                showOrbital(currentOrbitalIndex + delta);
            }
        }
        
        document.addEventListener('keydown', function(event) {
            if (orbitalsVisible) {
                if (event.key === 'ArrowUp') {
                    changeOrbital(-1);
                    event.preventDefault();
                } else if (event.key === 'ArrowDown') {
                    changeOrbital(1);
                    event.preventDefault();
                }
            }
        });

        var homoOrbital = 0;
        var lumoOrbital = 0;
        var numOrbitals = 0;
        var orbitals = [];
        
        function getOrbitalInfo() {
            try {
                // Get orbital information
                Jmol.script(jmolApplet0, 'mo list');
                
                // Parse the orbital list response to get the real number of orbitals
                let moListResponse = Jmol.scriptWait(jmolApplet0, 'show mo list');
                let lines = moListResponse.split('\n');
                let maxOrbital = 0;
                homoOrbital = 0;
                lumoOrbital = 0;
                
                // Parse each line to find orbitals and their occupancies
                // Store them in order to properly identify HOMO/LUMO
                orbitals = [];
                
                for (let line of lines) {
                    let match = line.match(/mo\s+(\d+)\s+#\s+energy\s+([+-]?\d+\.?\d*)\s+occupancy\s+(\d+)/);
                    if (match) {
                        let orbitalNum = parseInt(match[1]);
                        let energy = parseFloat(match[2]);
                        let occupancy = parseInt(match[3]);
                        
                        orbitals.push({
                            number: orbitalNum,
                            energy: energy,
                            occupancy: occupancy
                        });
                        
                        maxOrbital = Math.max(maxOrbital, orbitalNum);
                    }
                }
                
                // Sort orbitals by number to process them in order
                orbitals.sort((a, b) => a.number - b.number);
                
                // Find HOMO (highest occupied) and LUMO (lowest unoccupied)
                let foundUnoccupied = false;
                for (let orbital of orbitals) {
                    if (orbital.occupancy > 0) {
                        homoOrbital = orbital.number;
                    } else if (!foundUnoccupied) {
                        lumoOrbital = orbital.number;
                        foundUnoccupied = true;
                    }
                }
                
                // Update orbital information
                numOrbitals = maxOrbital;
                
                // Set initial display parameters
                Jmol.script(jmolApplet0, 'mo fill nomesh translucent 0.5');
                
                // Update the interface
                let existingInfo = document.getElementById('orbitalInfoDisplay');
                if (existingInfo) existingInfo.remove();
                
                let orbitalInfo = document.createElement('div');
                orbitalInfo.id = 'orbitalInfoDisplay';
                orbitalInfo.innerHTML = `
                    <p>Total Orbitals: ${numOrbitals}</p>
                    <p>HOMO: ${homoOrbital}, LUMO: ${lumoOrbital}</p>
                `;
                document.getElementById('orbitalControls').insertBefore(
                    orbitalInfo,
                    document.getElementById('orbitalList')
                );
                
                // Update UI
                document.getElementById('status').innerHTML = 'Orbital visualization enabled';
                updateOrbitalList();
                
                // Show HOMO by default if none shown
                if (!orbitalsVisible) {
                    showOrbital(homoOrbital);
                }
                
            } catch (e) {
                console.error('Error getting orbital information:', e);
                document.getElementById('status').innerHTML = 'Error: Could not get orbital information. Make sure the file contains orbital data.';
                numOrbitals = 0;
                homoOrbital = 0;
                lumoOrbital = 0;
                updateOrbitalList();
            }
        }
        
        function updateOrbitalList() {
            const list = document.getElementById('orbitalList');
            list.innerHTML = '';
            
            if (numOrbitals === 0) {
                list.innerHTML = '<div>No orbital information available</div>';
                return;
            }
            
            // Create orbital entries in groups of 10 for better performance
            const fragment = document.createDocumentFragment();
            let selectedDiv = null;
            for (let i = 1; i <= numOrbitals; i++) {
                const div = document.createElement('div');
                // Find orbital energy from the stored orbitals array
                const orbital = orbitals.find(o => o.number === i);
                let label = `Orbital ${i}`;
                if (orbital) {
                    label += ` (${orbital.energy.toFixed(3)})`;
                }
                if (i === homoOrbital) {
                    label += ' (HOMO)';
                    div.style.fontWeight = 'bold';
                    div.style.color = '#0066cc';
                } else if (i === lumoOrbital) {
                    label += ' (LUMO)';
                    div.style.fontWeight = 'bold';
                    div.style.color = '#cc6600';
                }
                div.textContent = label;
                div.onclick = () => showOrbital(i);
                if (i === currentOrbitalIndex) {
                    div.className = 'selected';
                    selectedDiv = div;
                }
                fragment.appendChild(div);
            }
            list.appendChild(fragment);

            // Keep the selected orbital visible: scroll the list (only the list,
            // not the page) so the highlighted entry stays in view when navigating
            // with the arrow keys or HOMO/LUMO buttons.
            if (selectedDiv) {
                const itemRect = selectedDiv.getBoundingClientRect();
                const listRect = list.getBoundingClientRect();
                if (itemRect.top < listRect.top) {
                    list.scrollTop -= (listRect.top - itemRect.top);
                } else if (itemRect.bottom > listRect.bottom) {
                    list.scrollTop += (itemRect.bottom - listRect.bottom);
                }
            }
        }
        
        function showHOMO() {
            if (homoOrbital > 0) {
                showOrbital(homoOrbital);
            }
        }
        
        function showLUMO() {
            if (lumoOrbital > 0) {
                showOrbital(lumoOrbital);
            }
        }

