


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
 * Main click handler for matching reconfiguration
 */
function handleClickMatchingsMode(mousePos) {
    if (submode !== MATCHINGS_RECONFIGURATION_MODE || !isCFMatching()) {
        resetSelectionState();
        return;
    }

    const clickedItem = findAnyClickedItem(mousePos);

    if (reconfigState.isReady) {
        // State 3: Reconfiguration is ready, check if user clicked a flip indication
        handleFlipConfirmationMatching(mousePos);

    } else if (reconfigState.mode === null) {
        // State 1: Nothing selected yet
        handleInitialClick(clickedItem);
    } else {
        // State 2: First item selected
        handleSecondClick(clickedItem);
    }

    wg.redraw();
}

/**
 * Handles the initial click in the selection process
 */
function handleInitialClick(clickedItem) {
    if (clickedItem.vx !== -1) { // Vertex clicked
        reconfigState.mode = 'vertices';
        selectedVx = clickedItem.vx;
        const edgeIdx = findEdgeOfVxMatchings(clickedItem.vx);
        if (edgeIdx === -1) {
            resetSelectionState();
            return;
        }
        
        reconfigState.edges_to_remove = [edgeIdx];
        reconfigState.possibleTargets = verticesWithPossibleFlipsMatchingsFromVertex(selectedVx);
        
        if (reconfigState.possibleTargets.length === 0) {
            toast("No possible flips from this vertex.", false);
            resetSelectionState();
        }
    } else if (clickedItem.edge !== -1) { // Edge clicked
        reconfigState.mode = 'edges';
        selectedEdge = clickedItem.edge;
        reconfigState.edges_to_remove = [clickedItem.edge];
        reconfigState.possibleTargets = edgesWithPossibleFlipsMatchings(selectedEdge);
        
        if (reconfigState.possibleTargets.length === 0) {
            toast("No possible flips for this edge.", false);
            resetSelectionState();
        }
    }
}


/**
 * Handles the second click after initial selection
 */
function handleSecondClick(clickedItem) {
    if (reconfigState.mode === 'edges') {
        handleEdgeModeSecondClick(clickedItem);
    } else if (reconfigState.mode === 'vertices') {
        handleVertexModeSecondClick(clickedItem);
    }
    if (reconfigState.isReady && settingsManager.get(INSTA_FLIP_TOGGLE) && reconfigState.edges_to_add.length === 1) {

        if (reconfigState.edges_to_add.length !== 1) {
            console.error("Inconsistent state: Expected exactly one flip option to be ready.");
            resetSelectionState();
            return;
        }

        let selectedFlip = getFlipTypeFromEdges(reconfigState.edges_to_remove, reconfigState.edges_to_add[0]);

        if (selectedFlip) {
            flipMatching(selectedFlip, reconfigState.edges_to_remove[0], reconfigState.edges_to_remove[1]);
            return;
        }

    } else {
        console.log("Not ready yet, waiting for third click or confirmation.");
    }
}

/**
 * Handles second click in edge mode
 */
function handleEdgeModeSecondClick(clickedItem) {
    if (clickedItem.edge !== -1 && 
        reconfigState.possibleTargets.includes(clickedItem.edge)) {
        
        // Add second edge to removal list
        reconfigState.edges_to_remove.push(clickedItem.edge);
        
        const edge1 = wg.state.edges[reconfigState.edges_to_remove[0]];
        const edge2 = wg.state.edges[reconfigState.edges_to_remove[1]];
        const flipType = possibleFlipsMatching(edge1, edge2);



        // REFACTOR: This is the crucial change. We now handle the 'a', 'b', 'c' cases.
        if (flipType === 'a' || flipType === 'b') {
            // Unambiguous flip.
            reconfigState.edges_to_add = [getEdgesToAdd(edge1, edge2, flipType)];
        } else if (flipType === 'c') {
            // Ambiguous flip. We must store both options and let the user choose.
            reconfigState.edges_to_add = [
                getEdgesToAdd(edge1, edge2, 'a'),
                getEdgesToAdd(edge1, edge2, 'b')
            ];
        } else {
            console.error("Inconsistent state: Flip should be possible but no type was found.");
            resetSelectionState();
            return;
        }


        reconfigState.possibleTargets = [];
        reconfigState.isReady = true;

    }
}

/**
 * REFACTOR: A new helper to translate a flip type into an explicit edge payload.
 * @param {Array} e1 - The first edge vertex indices, e.g., [0, 1]
 * @param {Array} e2 - The second edge vertex indices, e.g., [2, 3]
 * @param {'a'|'b'} flipType - The type of flip to perform.
 * @returns {Array} The array of new edges to add, e.g., [[0, 2], [1, 3]]
 */
function getEdgesToAdd(e1, e2, flipType) {
    if (flipType === 'a') {
        return [[e1[0], e2[0]], [e1[1], e2[1]]];
    } else if (flipType === 'b') {
        return [[e1[0], e2[1]], [e1[1], e2[0]]];
    }
    return [];
}


/**
 * Handles second click in vertex mode
 */
function handleVertexModeSecondClick(clickedItem) {
    if (clickedItem.vx === -1 || 
        !reconfigState.possibleTargets.includes(clickedItem.vx)
    ) {
        resetSelectionState();
        return;
    }
        
    const edge2_idx = findEdgeOfVxMatchings(clickedItem.vx);
    
    if (edge2_idx === -1 || 
        reconfigState.edges_to_remove[0] === edge2_idx
    ) {
        resetSelectionState();
        return;
    }
    

    console.log(reconfigState.edges_to_remove);
    // Add second edge to removal list
    reconfigState.edges_to_remove.push(edge2_idx);

    console.log(reconfigState.edges_to_remove)
    
    // Determine specific flip type
    const flipType2 = possibleFlipsMatching(
        wg.state.edges[reconfigState.edges_to_remove[0]],
        wg.state.edges[reconfigState.edges_to_remove[1]]
    );
    
    if (flipType2 === null) {
        toast("Cannot perform this flip.", true);
        resetSelectionState();
        return;
    }


    let e1 = wg.state.edges[reconfigState.edges_to_remove[0]];
    let e2 = wg.state.edges[edge2_idx];

    if (e1[0] === selectedVx) {
        if (e2[0] === clickedItem.vx) {
            reconfigState.edges_to_add = [getEdgesToAdd(e1, e2, 'a')];
        } else if (e2[1] === clickedItem.vx) {
            reconfigState.edges_to_add = [getEdgesToAdd(e1, e2, 'b')];
        }
    } else if (e1[1] === selectedVx) {
        if (e2[0] === clickedItem.vx) {
            reconfigState.edges_to_add = [getEdgesToAdd(e1, e2, 'b')];
        } else if (e2[1] === clickedItem.vx) {
            reconfigState.edges_to_add = [getEdgesToAdd(e1, e2, 'a')];
        }
    } else {
        console.error("Inconsistent state: Selected vertex does not match either edge.");
        toast("Cannot perform this flip.", true);
        resetSelectionState();
        return;
    }
    

    // Prepare to show flip indications
    reconfigState.picked_vertex = clickedItem.vx;
    reconfigState.possibleTargets = [];
    reconfigState.isReady = true;
}


/**
 * Handles flip confirmation when user clicks on an indication
 */
function handleFlipConfirmationMatching(mousePos) {
    const [e1_idx, e2_idx] = reconfigState.edges_to_remove;
    const e1 = wg.state.edges[e1_idx];
    const e2 = wg.state.edges[e2_idx];
    
    const v1 = wg.state.vertices[e1[0]];
    const v2 = wg.state.vertices[e1[1]];
    const v3 = wg.state.vertices[e2[0]];
    const v4 = wg.state.vertices[e2[1]];
    
    const p1 = wg.dims.toCanvas(v1);
    const p2 = wg.dims.toCanvas(v2);
    const p3 = wg.dims.toCanvas(v3);
    const p4 = wg.dims.toCanvas(v4);
    
    const minDist = settingsManager.get(PROXIMITY_EDGE) || DEFAULT_EDGE_HOVER_PROXIMITY;
    
    // Check if click is near any of the potential new edges
    let clickedEdge = null;
    let edgeSetIdx = 0;
    
    // Check all potential edges in edges_to_add
    for (const edgeset of reconfigState.edges_to_add) {
        for (const edge of edgeset) {
            const startVx = wg.state.vertices[edge[0]];
            const endVx = wg.state.vertices[edge[1]];
            const pStart = wg.dims.toCanvas(startVx);
            const pEnd = wg.dims.toCanvas(endVx);
            
            const dist = distanceToSegment(mousePos, pStart, pEnd);
            if (dist < minDist) {
                clickedEdge = edge;
                break;
            }
        }
        if (clickedEdge) {
            break;
        }
        edgeSetIdx += 1;
    }
    
    if (clickedEdge) {
        // Find which flip option was selected
        let selectedFlip = getFlipTypeFromEdges(reconfigState.edges_to_remove, reconfigState.edges_to_add[edgeSetIdx]);

        if (selectedFlip) {
            flipMatching(selectedFlip, e1_idx, e2_idx);
        } else {
            console.error("Inconsistent state: Selected flip type is null.");
            toast("Cannot perform this flip.", true);
        }
    }
    
    // Clicked elsewhere - reset
    resetSelectionState();
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


/**
 * Determines the flip type ('a' or 'b') by comparing the edges that were
 * removed with the edges that are proposed to be added.
 * This is the "reverse-engineering" step.
 *
 * @param {Array} edgesToRemove - An array of the two original edge indices, e.g., [2, 5].
 * @param {Array} edgesToAdd - An array containing the two new edges, e.g., [[v1, v3], [v2, v4]].
 * @returns {'a' | 'b' | null} The determined flip type, or null if no match.
 */
function getFlipTypeFromEdges(edgesToRemove, edgesToAdd) {
    // Get the vertex indices from the original edges
    const e1 = wg.state.edges[edgesToRemove[0]];
    const e2 = wg.state.edges[edgesToRemove[1]];

    // Define the patterns for flip 'a' and 'b'
    const flipA_edges = [[e1[0], e2[0]], [e1[1], e2[1]]];
    const flipB_edges = [[e1[0], e2[1]], [e1[1], e2[0]]];

    // Check if the provided edgesToAdd match the 'a' pattern.
    // We must check both orderings since the array order isn't guaranteed.
    if ((areEdgesEqual(edgesToAdd[0], flipA_edges[0]) && areEdgesEqual(edgesToAdd[1], flipA_edges[1])) ||
        (areEdgesEqual(edgesToAdd[0], flipA_edges[1]) && areEdgesEqual(edgesToAdd[1], flipA_edges[0]))) {
        return 'a';
    }

    // Check if the provided edgesToAdd match the 'b' pattern.
    if ((areEdgesEqual(edgesToAdd[0], flipB_edges[0]) && areEdgesEqual(edgesToAdd[1], flipB_edges[1])) ||
        (areEdgesEqual(edgesToAdd[0], flipB_edges[1]) && areEdgesEqual(edgesToAdd[1], flipB_edges[0]))) {
        return 'b';
    }

    return null; // Should not happen in a consistent state
}