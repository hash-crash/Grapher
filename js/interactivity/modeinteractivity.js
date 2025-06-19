/******************************************************************************
 * This file contains the interactivity for the mode selection in the application.
 * It allows users to switch between different modes such as editing and reconfiguration,
 * and handles the necessary checks and updates to the application state.
 *****************************************************************************/






/**
 * Here we sets the application mode and submode.
 * 
 * @param {RECONFIGURATION_MODE | EDIT_MODE} modeL the mode to switch to
 * @param {DEFAULT_EDIT_MODE | CROSSING_FREE_EDIT_MODE | CFSP_RECONFIGURATION_MODE | ...} submodeL the submode to switch to
 * @returns {String|undefined} error message if the mode change is not allowed, undefined in the success case
 */
function setApplicationMode(modeL, submodeL) {

    if (modeL === EDIT_MODE) {
        if (submodeL === CROSSING_FREE_EDIT_MODE && !isCrossingFree()) {
            return "Trying to do crossing-free edit mode but graph has crossings";
        }
    } else if (modeL === RECONFIGURATION_MODE) {
        if (submodeL === MATCHINGS_RECONFIGURATION_MODE) {
            if (!isCFMatching()) {
                return "Not a cf matching";
            }
        } else if (submodeL === CFSP_RECONFIGURATION_MODE) {
            if (!isCFSP()) {
                return "Not a cfsp";
            }
        } else if (submodeL === CFST_RECONFIGURATION_MODE) {
            if (!isCFST()) {
                return "Not a cfst";
            }
        }else if (submodeL === TRIANGULATION_RECONFIGURATION_MODE) {
            if (!isGeometricTriangulation()) {
                return "Not a geometric triangulation";
            } 
        } else {
            return "Uknown submode";
        }
    } else {
        return "Unknown mode";
    }



    // Cleanup previous state
    selectedVx = -1;
    selectedEdge = -1;
    flipEdges = [];
    chosenFlipEdge = -1;
    
    // Update global state
    mode = modeL;
    submode = submodeL;
    if (submode === MATCHINGS_RECONFIGURATION_MODE && almostPerfectMatching) {
        submode = MATCHINGS_ALMOSTPERFECT_RECONFIGURATION_MODE;
    }


    // Update UI indicators
    document.querySelectorAll('.submode-btn').forEach(btn => {
        btn.classList.toggle('active', 
            btn.dataset.mode === mode && 
            btn.dataset.submode === submode
        );
    });


    let possibleFlipsButton = document.getElementById('showflipsid');
    let explodeButton = document.getElementById('explodeid');
    let clearButton = document.getElementById('clearFile');
    if (mode === EDIT_MODE) {
        clearButton.classList.remove('hidden-controlbutton');
        explodeButton.classList.remove('hidden-controlbutton');
        possibleFlipsButton.classList.add('hidden-controlbutton');
    } else if (mode === RECONFIGURATION_MODE) {
        clearButton.classList.add('hidden-controlbutton');
        explodeButton.classList.add('hidden-controlbutton');
        possibleFlipsButton.classList.remove('hidden-controlbutton');
    }
    
    // Update cursor and other visual feedback
    doaredraw();
    
    console.log(`Switched to ${mode} > ${submode}`);
}



function createModeSelector() {
    const container = document.createElement('div');
    container.className = 'mode-container';
    
    // Main Modes
    const mainModes = [
        { 
            id: EDIT_MODE,
            label: '✏️ Editing',
            submodes: [
                { id: DEFAULT_EDIT_MODE, label: 'Standard Editing' },
                { id: CROSSING_FREE_EDIT_MODE, label: 'Non-Crossing Editing' }
            ]
        },
        {
            id: RECONFIGURATION_MODE,
            label: '🔄 Reconfigurations',
            submodes: [
                { id: MATCHINGS_RECONFIGURATION_MODE, label: 'Matchings' },
                { id: TRIANGULATION_RECONFIGURATION_MODE, label: 'Triangulations' },
                { id: CFSP_RECONFIGURATION_MODE, label: 'Spanning Paths' },
                { id: CFST_RECONFIGURATION_MODE, label: 'Spanning trees'},
            ]
        }
    ];

    mainModes.forEach(mainMode => {
        const modeGroup = document.createElement('div');
        modeGroup.className = 'mode-group';
        
        // Main mode header
        const header = document.createElement('h3');
        header.textContent = mainMode.label;
        if(mode === mainMode.id) {
            header.classList.add('active-mode');
        }
        
        // Submode buttons
        const submodeContainer = document.createElement('div');
        submodeContainer.className = 'submode-container';
        
        mainMode.submodes.forEach(s => {
            const btn = document.createElement('button');
            btn.className = `submode-btn ${submode === s.id ? 'active' : ''}`;
            btn.textContent = s.label;
            btn.dataset.mode = mainMode.id;
            btn.dataset.submode = s.id;
            
            btn.addEventListener('click', () => {
                // Handle mode change here
                const error = setApplicationMode(mainMode.id, s.id);
                if (error) {
                    triggerShake();
                    toast(error, true);
                } else{
                    document.body.querySelector('.modal')?.remove();
                }
            });
            
            submodeContainer.appendChild(btn);
        });

        modeGroup.appendChild(header);
        modeGroup.appendChild(submodeContainer);
        container.appendChild(modeGroup);
    });

    return container;
}
