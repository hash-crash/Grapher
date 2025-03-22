




function setApplicationMode(mode, submodeL) {
    // Cleanup previous state
    window.Grapher.selectedEdges = [];
    
    // Update global state
    window.Grapher.state.mode = mode;
    submode = submodeL;

    
    // Update UI indicators
    document.querySelectorAll('.submode-btn').forEach(btn => {
        btn.classList.toggle('active', 
            btn.dataset.mode === mode && 
            btn.dataset.submode === submode
        );
    });
    
    // Update cursor and other visual feedback
    updateCursor();
    render();
    
    console.log(`Switched to ${mode} > ${submode}`);
}


function createModeSelector(currentMode, currentSubmode) {
    const container = document.createElement('div');
    container.className = 'mode-container';
    
    // Main Modes
    const mainModes = [
        { 
            id: 'edit',
            label: '✏️ Editing',
            submodes: [
                { id: 'free', label: 'Standard Editing' },
                { id: 'crossing-free', label: 'Non-Crossing Editing' }
            ]
        },
        {
            id: 'reconfigure',
            label: '🔄 Reconfigurations',
            submodes: [
                { id: 'pairings', label: 'Matchings' },
                { id: 'triangulations', label: 'Triangulations - todo' },
                { id: 'path', label: 'Spanning Paths - todo' },
                { id: 'tree', label: 'Spanning trees - todo'},
            ]
        }
    ];

    mainModes.forEach(mode => {
        const modeGroup = document.createElement('div');
        modeGroup.className = 'mode-group';
        
        // Main mode header
        const header = document.createElement('h3');
        header.textContent = mode.label;
        if(currentMode === mode.id) {
            header.classList.add('active-mode');
        }
        
        // Submode buttons
        const submodeContainer = document.createElement('div');
        submodeContainer.className = 'submode-container';
        
        mode.submodes.forEach(submode => {
            const btn = document.createElement('button');
            btn.className = `submode-btn ${currentSubmode === submode.id ? 'active' : ''}`;
            btn.textContent = submode.label;
            btn.dataset.mode = mode.id;
            btn.dataset.submode = submode.id;
            
            btn.addEventListener('click', () => {
                // Handle mode change here
                setApplicationMode(mode.id, submode.id);
                document.body.querySelector('.modal')?.remove();
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