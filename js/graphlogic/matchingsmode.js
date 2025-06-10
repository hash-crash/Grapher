


function allPossibleFlipsMatchings() {
    return [];
}








































/**
 * 
 * @param {Number} index in the vertices array
 * @returns index in edges array of edge which it belongs to
 */
function findEdgeOfVxMatchings(index) {
    let relevantEdge = -1;
    wg.state.edges.forEach((e, i) => {
        if (e[0] === index || e[1] === index) {
            relevantEdge = i;
        }
    });
    if (relevantEdge === -1) {
        console.error(`Could not find edge of vx ${index}`)
        toast("Something went really wrong", true);
    }
    return relevantEdge;
}



/**
 * 
 * @param {Number} e1 index in edges array
 * @param {Number} e2 index in edges array
 * 
 * 
 */
function drawFlipIndicationMatching(e1, e2, specificType = null) {

    let edge1 = wg.state.edges[e1];
    let edge2 = wg.state.edges[e2];


    if (!isFlipPossibleMatching(edge1, edge2)) {
        console.log("cannot do anything here :(");
        return;
    }

    let p1 = wg.state.vertices[edge1[0]];
    let p2 = wg.state.vertices[edge1[1]];
    let p3 = wg.state.vertices[edge2[0]];
    let p4 = wg.state.vertices[edge2[1]];

    let edgesWithoutEither = wg.state.edges.filter((edge) => {
        return !pequals(edge, edge2) && !pequals(edge, edge2);
    });

    let flips = null;
    console.log(specificType);
    if (specificType !== null) {
        flips = specificType;
    } else {
        flips = possibleFlipsMatchingPoints(p1, p2, p3, p4, edgesWithoutEither);
    }

    if (flips === null) {
        console.error("isFlipPossibleMatching says yes, but possibleFlips says no. pick a struggle.");
        return;
    }

    if (flips === 'a' || flips === 'c') {
        drawFlipInsertEdgeA([edge1[0], edge2[0]]);
        drawFlipInsertEdgeA([edge1[1], edge2[1]]);
    }

    if (flips === 'b' || flips === 'c') {
        drawFlipInsertEdgeB([edge1[0], edge2[1]]);
        drawFlipInsertEdgeB([edge1[1], edge2[0]]);
    }

}








var currentFlipTypeToShow = null; // 'a', 'b', or 'c' (if 'c', both options are shown, else specific one)


function resetSelectionState() {
    selectedEdge = -1;
    chosenFlipEdge = -1;
    flipEdges = [];
    
    selectionMode = null;
    selectedVx = -1;
    chosenFlipVx = -1;
    flippableWithSelectedVx = [];
    currentFlipTypeToShow = null;
    tempFlipEdges = [];
    
    wg.redraw();
}

function handleClickMatchingsMode(mousePos) {
    if (submode !== MATCHINGS_RECONFIGURATION_MODE || !isCFMatching()) { // Ensure it's a valid matching
        console.warn("Not in matching reconfiguration mode or graph is not a valid matching.");
        resetSelectionState();
        return;
    }

    let clickedItem = findAnyClickedItem(mousePos);

    // --- Stage 0: If a flip indication is active and clicked ---
    // This needs to check if a click is on a green line *before* other logic if indications are visible.
    // This is handled by `seeIfClickOnFlip` if it's called appropriately.
    // If `currentFlipTypeToShow` is set, it means indications are (or should be) visible.
    if (currentFlipTypeToShow) {
        if (true) { // Clicked on empty space (potential flip indication)
            // Pass the specific type if vertex mode determined it, otherwise seeIfClickOnFlip will figure it out
            const specificTypeForFlip = (selectionMode === 'vertex') ? currentFlipTypeToShow : null;

            seeIfClickOnFlip(mousePos, specificTypeForFlip); // This will call flipMatching and reset if successful
            // If seeIfClickOnFlip doesn't cause a flip, it means the click was not on an indication.
            // The current logic below might reset selection; consider if that's desired or if indications should persist.
            // For now, if it wasn't a flip, let the logic proceed to potentially reset or change selection.
            if (wg.state.edgeJustFlipped) { // A flag flipMatching could set
                 wg.state.edgeJustFlipped = false; // Reset flag
                 return; // Flip handled, selection was reset by flipMatching
            }
        }
    }


    // --- Stage 1: Nothing is selected, or starting a new selection ---
    if (selectionMode === null) {
        if (clickedItem.vx !== -1) { // User clicked a vertex first
            selectionMode = 'vertex';
            selectedVx = clickedItem.vx;
            const edgeOfSelectedVx = findEdgeOfVxMatchings(selectedVx);
            if (edgeOfSelectedVx === -1) {
                console.error("Clicked vertex in matching mode is isolated or error finding its edge.");
                resetSelectionState();
                return;
            }
            // selectedEdge = edgeOfSelectedVx; // This is the first edge to be removed
            flippableWithSelectedVx = verticesWithPossibleFlipsMatchingsFromVertex(selectedVx);
            if (flippableWithSelectedVx.length === 0) {
                toast("No possible flips from this vertex.", false);
                resetSelectionState(); // Or just selectedVx = -1, selectionMode = null to allow new selection
                return;
            }



            // Highlight vertices in flippableWithSelectedVx (in redraw)
        } else if (clickedItem.edge !== -1) { // User clicked an edge first
            selectionMode = 'edge';
            selectedEdge = clickedItem.edge;
            flipEdges = edgesWithPossibleFlipsMatchings(selectedEdge);
            if (flipEdges.length === 0) {
                toast("No possible flips for this edge.", false);
                resetSelectionState();
                return;
            }
            // Highlight edges in flipEdges (in redraw)
        } else {
            // Clicked on empty space and nothing was selected: do nothing.
        }
        wg.redraw();
        return;
    }

    // --- Stage 2: Something is already selected ---

    // Case 2.1: Edge selection mode
    if (selectionMode === 'edge') {
        if (selectedEdge === -1) { // Should not happen if selectionMode is 'edge'
             resetSelectionState(); return;
        }

        if (clickedItem.edge !== -1 && flipEdges.includes(clickedItem.edge)) {
            // User clicked a valid second edge
            chosenFlipEdge = clickedItem.edge;
            currentFlipTypeToShow = possibleFlipsMatching(wg.state.edges[selectedEdge], wg.state.edges[chosenFlipEdge]);
            if (currentFlipTypeToShow === null) {
                console.error("Inconsistent: edge was in flipEdges but possibleFlipsMatching says no flip.");
                toast("Cannot perform this flip.", true);
                // chosenFlipEdge = -1; // Keep selectedEdge, allow picking another flipEdge
                resetSelectionState(); // Or reset fully
            } else {
                if (settingsManager.get(INSTA_FLIP_TOGGLE)) {
                    //do it here
                }
            }
            // Redraw will show flip indications ('a', 'b', or 'c')
        } else if (clickedItem.edge === selectedEdge) {
            // Clicked the already selected edge: Deselect or do nothing. Let's deselect.
            resetSelectionState();
        }
         else if (clickedItem.vx !== -1) {
            // Clicked a vertex while an edge was selected. Could mean trying to switch to vertex mode or deselect.
            // For simplicity, let's reset.
            resetSelectionState();
            // Call again to process this vertex click as a new selection if desired:
            // handleClickMatchingsMode(mousePos); // Be careful with recursion or immediate re-entry.
        }
        else { // Clicked on empty space (and indications not clicked, or no indications yet) or an invalid edge
            resetSelectionState();
        }
        wg.redraw();
        return;


    // Case 2.2: Vertex selection mode
    } else if (selectionMode === 'vertex') {
        if (selectedVx === -1) { // Should not happen
            resetSelectionState(); return;
        }

        if (clickedItem.vx !== -1 && flippableWithSelectedVx.includes(clickedItem.vx)) {
            // User clicked a valid target vertex
            chosenFlipVx = clickedItem.vx;
            const originalEdgeOfChosenFlipVx = findEdgeOfVxMatchings(chosenFlipVx);
            const orignalSelectedEdge = findEdgeOfVxMatchings(selectedVx);

            if (orignalSelectedEdge === -1 || originalEdgeOfChosenFlipVx === -1 || areEdgesEqual(wg.state.edges[selectedEdge], wg.state.edges[originalEdgeOfChosenFlipVx])) {
                console.error("Error: Chosen target vertex's edge is same as selected vertex's edge or not found.");
                resetSelectionState(); // chosenFlipVx = -1; // Allow picking another target vertex
                return;
            }
            chosenFlipEdge = originalEdgeOfChosenFlipVx; // This is the second edge to be removed

            // Determine the *specific* flip type ('a' or 'b') that connects selectedVx to chosenFlipVx
            const e1_indices = wg.state.edges[orignalSelectedEdge];    // Edge of selectedVx
            const e2_indices = wg.state.edges[chosenFlipEdge]; // Edge of chosenFlipVx

            console.log("got to here :)");

            let determinedType = null;
            const overallPossible = possibleFlipsMatching(e1_indices, e2_indices); // Should not be null if chosenFlipVx was valid

            if (overallPossible === null) {
                 console.error("Logic error: chosenFlipVx implies a flip, but possibleFlipsMatching says null.");
                 resetSelectionState(); wg.redraw(); return;
            }



            console.log("got to here 2 :)");


            // Check if (selectedVx, chosenFlipVx) is formed by flip 'a' pattern
            // Flip 'a' connects e1_indices[0]-e2_indices[0] and e1_indices[1]-e2_indices[1]
            if ( (wg.state.vertices[e1_indices[0]] === wg.state.vertices[selectedVx] && wg.state.vertices[e2_indices[0]] === wg.state.vertices[chosenFlipVx]) ||
                 (wg.state.vertices[e1_indices[1]] === wg.state.vertices[selectedVx] && wg.state.vertices[e2_indices[1]] === wg.state.vertices[chosenFlipVx]) ) {
                if (overallPossible === 'a' || overallPossible === 'c') {
                    determinedType = 'a';
                }
            }

            // Check if (selectedVx, chosenFlipVx) is formed by flip 'b' pattern (if not already type 'a')
            // Flip 'b' connects e1_indices[0]-e2_indices[1] and e1_indices[1]-e2_indices[0]
            if (determinedType === null &&
                ((wg.state.vertices[e1_indices[0]] === wg.state.vertices[selectedVx] && wg.state.vertices[e2_indices[1]] === wg.state.vertices[chosenFlipVx]) ||
                 (wg.state.vertices[e1_indices[1]] === wg.state.vertices[selectedVx] && wg.state.vertices[e2_indices[0]] === wg.state.vertices[chosenFlipVx])) ) {
                if (overallPossible === 'b' || overallPossible === 'c') {
                    determinedType = 'b';
                }
            }

            console.log("got to here  3 :)");


            if (determinedType) {
                currentFlipTypeToShow = determinedType; // Will be 'a' or 'b'
                tempFlipEdges = [orignalSelectedEdge, originalEdgeOfChosenFlipVx];
                console.log("got to here 4 :)");
            } else {
                console.error("Could not determine specific flip type for vertex-vertex selection. This indicates a mismatch.");
                toast("Cannot perform this flip.", true);
                resetSelectionState(); // chosenFlipVx = -1; // Or reset chosenFlipVx to allow picking another
            }
        } else if (clickedItem.vx === selectedVx) {
            // Clicked the already selected vertex: Deselect.
            resetSelectionState();
        } else { // Clicked on empty space, an invalid vertex, or an edge
            resetSelectionState();
        }
        wg.redraw();

        return;
    }
    canvas.style.cursor = "auto"; // Reset cursor if not handled by hover logic
}















































/**
 * 
 * @param {[Number, Number]} mousePos mouse position in canvas (so, not in graph coordinates)
 * @returns 
 */
function seeIfClickOnFlip(mousePos, setMode) {


    let e1idx = null;
    let e2idx = null;
    let e1 = null;
    let e2 = null; 
    if (selectionMode === 'edge') {
        e1 = wg.state.edges[selectedEdge];
        e2 = wg.state.edges[chosenFlipEdge];
        e1idx = selectedEdge;
        e2idx = chosenFlipEdge;
    } else if (selectionMode === 'vertex') {
        console.log('hello hello');
        e1 =  wg.state.edges[tempFlipEdges[0]];
        e2 =  wg.state.edges[tempFlipEdges[1]];
        e1idx = tempFlipEdges[0];
        e2idx = tempFlipEdges[1];
    }


    let flips = null;
    if (setMode !== null) {
        console.log(`flips ${setMode}`);
        flips = setMode;
    } else {

        console.log("EIOQUYWRIOUWYEQOIUYWEROIQR2W ");
        flips = possibleFlipsMatching(e1, e2);
    }

    if (flips === null) {
        toast("Something went really wrong. Can't find possible flips", true);
        return;
    }

    let v1 = wg.state.vertices[e1[0]];
    let v2 = wg.state.vertices[e1[1]];
    let v3 = wg.state.vertices[e2[0]];
    let v4 = wg.state.vertices[e2[1]];
    let p1 = wg.dims.toCanvas(v1);
    let p2 = wg.dims.toCanvas(v2);
    let p3 = wg.dims.toCanvas(v3);
    let p4 = wg.dims.toCanvas(v4);
    let minDist = settingsManager.get(PROXIMITY_EDGE);
    if (!minDist) {
        minDist = DEFAULT_EDGE_HOVER_PROXIMITY;
    }

    if (flips === 'a' || flips === 'c') {
        const dist1 = distanceToSegment(mousePos, p1, p3);
        const dist2 = distanceToSegment(mousePos, p2, p4);
        console.log(`v1 ${v1} v2 ${v2}, v3 ${v3}, v4 ${v4}`);
        console.log(dist1);
        console.log(dist2);
        if (dist1 < minDist || dist2 < minDist) {
            flipMatching('a', e1idx, e2idx);


            return;
        }
    }

    if (flips === 'b' || flips === 'c') {
        const dist1 = distanceToSegment(mousePos, p1, p4);
        const dist2 = distanceToSegment(mousePos, p2, p3);
        if (dist1 < minDist || dist2 < minDist) {

            flipMatching('b',  e1idx, e2idx);

            return;
        }
    }
    return;
}








function verticesWithPossibleFlipsMatchingsFromVertex(v) {
    const edgeIdx = findEdgeOfVxMatchings(v);
    if (edgeIdx === -1) {
        return [];
    }
    
    const originalEdge = wg.state.edges[edgeIdx];
    const flippableEdges = edgesWithPossibleFlipsMatchings(edgeIdx);
    const targetVertices = new Set();

    flippableEdges.forEach(flipEdgeIdx => {
        const flipEdge = wg.state.edges[flipEdgeIdx];
        const flipType = possibleFlipsMatching(originalEdge, flipEdge);

        console.log(flipType);
        
        // Get the specific vertices based on flip type
        const [v3, v4] = flipEdge;
        let originalVx = wg.state.vertices[v];
        if (pequals(wg.state.vertices[originalEdge[0]], originalVx)) {
            if (flipType === 'a' || flipType === 'c') {
                // For flip type 'a' connections: p1->p3
                targetVertices.add(v3);
            }
            if (flipType === 'b' || flipType === 'c') {
                // For flip type 'b' connections: p1-> p4, p2->p3
                targetVertices.add(v4);
            }
        } else if (pequals(wg.state.vertices[originalEdge[1]], originalVx)) {
            if (flipType === 'a' || flipType === 'c') {
                // For flip type 'a' connections: p2->p4
                targetVertices.add(v4);
            }
            if (flipType === 'b' || flipType === 'c') {
                // For flip type 'b' connections: p2->p3
                targetVertices.add(v3);
            }
        } else {
            console.error("Something went really wrong, originalVx canot be found in either vertex of edge")
        }
    });

    // Remove original edge's vertices
    const originalVertices = new Set(originalEdge);
    return Array.from(targetVertices).filter(v => !originalVertices.has(v));
}






/**
 * @param {Number} e index in main edges array 
 * @returns {[Number]} all indices in edges array which can be flipped WRT e
 */
function edgesWithPossibleFlipsMatchings(e) {
    if (almostPerfectMatching) {
        console.error("This shouldn't be happening here.");
        return [];
    }

    if (e < 0 || e >= wg.state.edges.length) {
        console.log("Edge index out of bounds when finding all possible flips for an edge.");
        return [];
    }

    let inputEdge = wg.state.edges[e];

    let flippable = [];
    wg.state.edges.forEach((edgeToCheck, i) => {

        if (i === e) {
            return;
        }

        if (!isFlipPossibleMatching(inputEdge, edgeToCheck)) {
            return; // @ foreach
        } 

        flippable.push(i);

    });

    return flippable;
}


/**
 * 
 * @param {[Number, Number]} e1 
 * @param {[Number, Number]} e2 
 * @returns {boolean} 
 */
function isFlipPossibleMatching(e1, e2) {
    return possibleFlipsMatching(e1, e2) !== null;
}

/**
 * @param {[Number, Number]} e1 
 * @param {[Number, Number]} e2 
 * @returns 'a' if p1-p3, p2-p4 is only possible
 *          'b' if p1-p4, p2-p3 is only possible
 *          'c' if both are possible
 *          null if none is possible
 */
function possibleFlipsMatching(e1, e2) {
    if (almostPerfectMatching) {
        console.log("TODO");
        return null;
    }

    if (areEdgesEqual(e1, e2)) {
        return null;
    }

    let p1 = wg.state.vertices[e1[0]];
    let p2 = wg.state.vertices[e1[1]];
    let p3 = wg.state.vertices[e2[0]];
    let p4 = wg.state.vertices[e2[1]];

    let edgesWithoutEither = wg.state.edges.filter((edge) => {
        return !pequals(edge, e1) && !pequals(edge, e1);
    });

    return possibleFlipsMatchingPoints(p1, p2, p3, p4, edgesWithoutEither);
}


/**
 * @param {[Number, Number]} p1 coords 1 of e1
 * @param {[Number, Number]} p2 coords 2 of e1
 * @param {[Number, Number]} p3 coords 1 of e2
 * @param {[Number, Number]} p4 coords 2 of e2
 * @param {[[Number, Number]]} otherEdges edges list, same as wg.state.edges, but without the edge connecting p1-p2 and p3-p4 
 * 
 * @see possibleFlipsMatching
 */
function possibleFlipsMatchingPoints(p1, p2, p3, p4, otherEdges) {

    let a = true;
    if (intersects(p1, p3, p2, p4) || intersectsAny(p1, p3, null, otherEdges) || intersectsAny(p2, p4, null, otherEdges)) {
        a = false;
    }

    let b = true;
    if (intersects(p1, p4, p2, p3) || intersectsAny(p1, p4, null, otherEdges) || intersectsAny(p2, p3, null, otherEdges)) {
        b = false;
    }

    return a && b ? 'c' : 
                a ? 'a' :
                b ? 'b' :
                null;

}
