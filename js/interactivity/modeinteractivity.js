




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
    selectedEdges = [];
    selectedEdge = -1;
    selectedVx = -1;
    
    // Update global state
    mode = modeL;
    submode = submodeL;

    
    // Update UI indicators
    document.querySelectorAll('.submode-btn').forEach(btn => {
        btn.classList.toggle('active', 
            btn.dataset.mode === mode && 
            btn.dataset.submode === submode
        );
    });
    
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
                { id: TRIANGULATION_RECONFIGURATION_MODE, label: 'Triangulations - todo' },
                { id: CFSP_RECONFIGURATION_MODE, label: 'Spanning Paths - todo' },
                { id: CFST_RECONFIGURATION_MODE, label: 'Spanning trees - todo'},
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

    document.addEventListener('mousedown', modalMouseDown);

    return container;
}

function modalMouseDown(event)  {
    let modalList = document.getElementsByClassName('modal-content');
    let openModal = document.querySelector('.modal.visible');
    console.l
    if (modalList.length > 0 && !modalList[0].contains(event.target)) {
        document.removeEventListener('mousedown', modalMouseDown);
        openModal.remove();
        return; // Stop further processing
    }
}