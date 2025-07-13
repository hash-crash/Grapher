/**
 * This file handles the majority of the logic for dealing with the user-interactions with the actual canvas
 * 
 * This includes clicking, hovering, dragging, etc logic. Right-click is handled in contextmenu.js
 */





// Global variables for dragging
let isDraggingCanvas = false;
let isDraggingVertex = false;
let draggedVertexIndex = -1;
let originalState = null;
let vertexDragOffset = { x: 0, y: 0 };
let offsetAtDragStart = { x: 0, y: 0 };
let maxDragPoint = {x: 0, y: 0};
let initialClickPosition = {x: 0, y: 0};


canvas.addEventListener('mousedown', (event) => {
    // Use left button only.
    if (event.button !== 0) {
        return;
    }
    let mousePos = getMousePos(event);

    initialClickPosition.x = mousePos[0];
    maxDragPoint.x = mousePos[0];
    initialClickPosition.y = mousePos[1];
    maxDragPoint.y = mousePos[1];

    if (mode === EDIT_MODE) {
    // Check if the click is near any vertex.
    for (let i = 0; i < window.Grapher.state.vertices.length; i++) {
        if (!isNearVertex(mousePos, wg.state.vertices[i])) {
            continue;
        }
        let canvasPos = wg.dims.toCanvas(wg.state.vertices[i]);
        isDraggingVertex = true;
        draggedVertexIndex = i;
        // Record the offset from the vertex center to the mouse position
        vertexDragOffset.x = canvasPos[0] - mousePos[0];
        vertexDragOffset.y = canvasPos[1] - mousePos[1];
        originalState = wg.state.copyConstructor();
        handleHover(event);
        return;
    }
    }

  
    // If no vertex was clicked, start dragging the canvas.
    isDraggingCanvas = true;
    // Record the starting offset relative to the mouse position.
    offsetAtDragStart.x = mousePos[0] - wg.dims.offset[0];
    offsetAtDragStart.y = mousePos[1] - wg.dims.offset[1];


    handleHover(event);
});

// Only dragging is handled in this listener:
canvas.addEventListener('mousemove', (event) => {
    let dims = window.Grapher.dims;
    let mousePos = getMousePos(event);

    if (mousePos === null) {
        console.log("Error: mouse position is null in mousemove handler");
        return;
    }


    let diff = Math.hypot(initialClickPosition.x - mousePos[0], initialClickPosition.y - mousePos[1]);
    let previousMaxDiff = Math.hypot(initialClickPosition.x - maxDragPoint.x, initialClickPosition.y - maxDragPoint.y);
    if (diff > previousMaxDiff) {
        maxDragPoint.x = mousePos[0];
        maxDragPoint.y = mousePos[1];
    }

    if (isDraggingCanvas) {
        // Update the camera offset based on mouse movement.
        dims.offset[0] = mousePos[0] - offsetAtDragStart.x;
        dims.offset[1] = mousePos[1] - offsetAtDragStart.y;
    } else if (isDraggingVertex && draggedVertexIndex !== -1) {
        // Adjust mouse position by the vertex drag offset.
        let adjustedX = mousePos[0] + vertexDragOffset.x;
        let adjustedY = mousePos[1] + vertexDragOffset.y;
        // Convert canvas coordinates to graph coordinates.
        let newGraphCoords = wg.dims.toCoords([adjustedX, adjustedY]);
        // Update the vertex in the state.
        window.Grapher.state.vertices[draggedVertexIndex] = newGraphCoords;
        window.Grapher.state.updateAdjList();
        updateFileView();   
    }
});


canvas.addEventListener('mouseup', (event) => {
    if (event.button !== 0) {
        return;
    }


    let mousePos = getMousePos(event);
    let clickTolerance = settingsManager.get(CLICK_TOLERANCE);
    if (!clickTolerance) {
        clickTolerance = MAX_DRAG_DISTANCE_FOR_CLICK;
    }
    if (Math.hypot(initialClickPosition.x - maxDragPoint.x, initialClickPosition.y - maxDragPoint.y) < clickTolerance) {
        handleClick(event);
    }



    if (isDraggingVertex && draggedVertexIndex !== -1 && originalState !== null) {
        let currentCoords = wg.state.vertices[draggedVertexIndex];
        let snappedCoords = closestGraphCoord;
        let originalCoords = originalState.vertices[draggedVertexIndex];


        // Only update if coordinates changed
        if (snappedCoords[0] !== originalCoords[0] || snappedCoords[1] !== originalCoords[1]) {
            let i = 0;
            for (vx of wg.state.vertices) {
                if (pequals(vx, snappedCoords) && i !== draggedVertexIndex) {
                    triggerShake();
                    toast("There is already a vertex there", true);
                    i = -1;
                    break;
                }
                i++;
            }
            if (i !== -1) {
                wg.state.vertices[draggedVertexIndex] = snappedCoords;
                wg.state.updateAdjList();
                updateFileView();
                console.log(`snapping ${currentCoords} to ${snappedCoords} and it started from ${originalCoords}`);
                addToHistory(wg.state.copyConstructor(), MOVE_VERTEX, originalCoords, snappedCoords);
                stateUpdated();
            } else {
                wg.state.vertices[draggedVertexIndex] = originalCoords;
                wg.redraw();
                updateFileView();
            }


        } else {
            wg.state.vertices[draggedVertexIndex] = originalCoords;
            wg.redraw();
            updateFileView();
        }

    }

    isDraggingCanvas = false;
    isDraggingVertex = false;
    draggedVertexIndex = -1;
    originalState = null;


    // call handlHover one more time here so that we get the correct 'reset' of the cursor
    handleHover(event);

});









// Non-dragging logic for correct drawing is handled here:
function handleHover(event) {
    // don't do anything if the user is dealing with the context menu or modal
    if (customMenu.style.display === 'block' || document.querySelector('.modal.visible')) {
        return;
    }

    if (!window.Grapher?.state?.vertices) {
        console.log("no state while handling hover");
        return;
    }

    mousePos = getMousePos(event);

    let graphCoords = window.Grapher.dims.toCoords(mousePos);
    closestGraphCoord = [
        Math.round(graphCoords[0]),
        Math.round(graphCoords[1])
    ];

    let found = false;
    if (mode === EDIT_MODE) {
        found = handleHoverEditMode(mousePos);
    } else if (mode === RECONFIGURATION_MODE) {
        found = handleHoverReconfigurationMode(mousePos);
    } else {
        console.error("Unknown mode while handling hover");
        return;
    }



    window.Grapher.redraw();


    // console.log("drawing coordintate");
    if (mode === EDIT_MODE &&
        ((!found && !isDraggingCanvas) || (isDraggingVertex && draggedVertexIndex !== -1))) {
        drawHihglightedCoordinate(mousePos);
    }

}












 
function handleClick(event) {
    if (!window.Grapher?.state?.vertices) {
        return;
    }

    const mousePos = getMousePos(event);

    // console.log("onclick handler called at " + mousePos[0] + " and " + mousePos[1]);
    


    if (mode === EDIT_MODE) {
        handleClickEditMode(mousePos);
    } else if (mode === RECONFIGURATION_MODE) {
        handleClickReconfigurationMode(mousePos);
    } else {
        console.error(`Main mode is something it shouldn't be: ${mode}`);
        toast("Problem with tool mode, please try to set a mode in the sidebar", true);
    }
}



var edgeForRemoval = -1;




/**
 * The specialized dispatcher for Reconfiguration Mode.
 * Its only job is to check the 'submode' and route to the correct logic file.
 * @param {Array} mousePos - The [x, y] coordinates of the click.
 */
function handleClickReconfigurationMode(mousePos) {
    switch (submode) {
        case MATCHINGS_RECONFIGURATION_MODE:
            handleClickMatchingsMode(mousePos);
            break;

        case TRIANGULATION_RECONFIGURATION_MODE:
            handleClickTriangulationMode(mousePos);
            break;

        case CFSP_RECONFIGURATION_MODE:
            handleClickPathsMode(mousePos);
            break;

        case CFST_RECONFIGURATION_MODE:
            handleClickTreesMode(mousePos);
            break;

       case MATCHINGS_ALMOSTPERFECT_RECONFIGURATION_MODE:
            console.log("TODO: Handle Almost-Perfect Matching Reconfiguration Click");
            break;
        
        default:
            console.error("Unknown reconfiguration submode:", submode);
            toast("Error: This reconfiguration type is not yet supported.", true);
            break;
    }
}



function findAnyClickedItem(mousePos) {
    let i = 0;
    // Check each object for a click
    for (let obj of window.Grapher.state.vertices) {
        // for now doing nothing here
        if (isNearVertex(mousePos, obj)) {
            // console.log(`Clicked on object ${obj}`);
            return {vx: i, edge: -1}; // Stop checking further objects
        }
        i += 1;
    }

    let closestDistance = Number.POSITIVE_INFINITY;
    let likeliestEdge = -1;
    window.Grapher.state.edges.forEach((edge, j) => {
        
        const v1 = window.Grapher.dims.toCanvas(window.Grapher.state.vertices[edge[0]]);
        const v2 = window.Grapher.dims.toCanvas(window.Grapher.state.vertices[edge[1]]);
        
        
        if (isNearVertex(mousePos, window.Grapher.state.vertices[edge[0]])) {
            return {vx: edge[0], edge: -1}
        } else if(isNearVertex(mousePos, window.Grapher.state.vertices[edge[1]])) {
            return {vx: edge[1], edge: -1};
        }

        const dist = distanceToSegment(mousePos, v1, v2);
        let minDist = settingsManager.get(PROXIMITY_EDGE);
        if (!minDist) {
            minDist = DEFAULT_EDGE_HOVER_PROXIMITY;
        }
        if (dist < minDist && dist < closestDistance) {
            closestDistance = dist;
            likeliestEdge = j;
        }
    });
    return {vx: -1, edge: likeliestEdge}
}
























function keydownHandler(event) {
    let tagName = event.target.tagName.toLowerCase();
    if (tagName === 'form' ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        event.target.isContentEditable
    ) {
        return;
    }


    // Detect undo: Ctrl+Z or Cmd+Z or u or shift+U
    if ((event.key === 'u'  && !event.shiftKey) || (event.key === 'U' && EventTarget.shiftKey)
             || ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey)
    ) {
        resetSelectionState();
        undo();
        return;
    }

    // Detect redo: Ctrl+Shift+Z or Cmd+Shift+Z or shift+u or U
    else if ((event.shiftKey && (event.key === 'u' || ((event.ctrlKey || event.metaKey) && event.key === 'z'))) 
            || (event.key === 'U' && !event.shiftKey)
    ) {  
        resetSelectionState();
        redo();  
        return;
    } 

    //if no state, the rest doesn't make sense. At least undo and redo can (attempt to) recover state.
    if (!window.Grapher.state) {
        return;
    }
    
    if (event.key === 'n' || event.key === 'Escape' || event.key === 'Esc') {
        // First check if any modal is open
        const openModal = document.querySelector('.modal.visible');
        if (openModal) {
            openModal.remove();
            // Stop further processing
            return; 
        }

        if (customMenu.style.display === 'block') {
            hideCustomMenu();
            // Stop further processing
            return;
        }


        resetSelectionState();
        doaredraw();
        return;
    } else if (event.key === 'Delete' || event.key == 'Backspace') {
        if (mode === EDIT_MODE) {
            //delete
            deleteItem();
        }
        return;
    } 
    
    let modeL = null;
    let submodeL = null;

    if ((event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        clearFile();
        return;
    } else if (event.key === 'r' || event.key === 'R') {
        modeL = RECONFIGURATION_MODE;
        if (isCFSP()) {
            submodeL = CFSP_RECONFIGURATION_MODE; 
        } else if (isCFST()) {
            submodeL = CFST_RECONFIGURATION_MODE;
        } else if (isGeometricTriangulation()) {
            submodeL = TRIANGULATION_RECONFIGURATION_MODE;
        } else if (isPerfectMatching()) {
            submodeL = MATCHINGS_RECONFIGURATION_MODE; 
        } else if (isAlmostPerfectMatching()) {
            submodeL = MATCHINGS_ALMOSTPERFECT_RECONFIGURATION_MODE; 
        } else {
            console.error("Unknown reconfiguration mode while handling keydown");
            toast("This graph type is not yet supported.", true);
            return;
        }
    } else if (event.key === 'm' || event.key === 'M') {
        modeL = RECONFIGURATION_MODE;
        submodeL = MATCHINGS_RECONFIGURATION_MODE; // Default to matchings reconfiguration
    } else if (event.key === 'g' || event.key === 'G') {
        console.log("g pressed, setting mode to triangulation reconfiguration");
        modeL = RECONFIGURATION_MODE;
        submodeL = TRIANGULATION_RECONFIGURATION_MODE; // Default to triangulation reconfiguration
    } else if (event.key === 't' || event.key === 'T') {
        modeL = RECONFIGURATION_MODE;
        submodeL = CFST_RECONFIGURATION_MODE; // Default to path reconfiguration
    } else if (event.key === 'p' || event.key === 'P') {
        modeL = RECONFIGURATION_MODE;
        submodeL = CFSP_RECONFIGURATION_MODE; // Default to path reconfiguration
    } else if (event.key === 'e' || event.key === 'E') {
        modeL = EDIT_MODE;
        submodeL = DEFAULT_EDIT_MODE;
    } else {
        return;
    }
    let error = setApplicationMode(modeL, submodeL);
    if (error) {
        console.error("Error while setting application mode:", error);
        toast(error, true);
    }
}


canvas.addEventListener('mousemove', handleHover);
document.addEventListener('keydown', keydownHandler);
