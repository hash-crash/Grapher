/**
 * @see worker.js
 */
function allPossibleFlipsAPM() {
    console.log("allPossibleFlipsAPM called");
}

// Main handler for APM reconfiguration
function handleClickAPMMode(mousePos) {
    if (submode !== MATCHINGS_ALMOSTPERFECT_RECONFIGURATION_MODE) {
        resetSelectionState();
        return;
    }
    if (!isAPM()) {
        toast("Graph is not a valid almost-perfect matching", true, 5);
        resetSelectionState();
        return;
    }

    if (reconfigState.isReady) {
        // State 2: An edge or vertex has been selected, waiting for user to confirm which new edge to create.
        handleFlipConfirmationAPM(mousePos);
    } else if (reconfigState.mode === null) {
        // State 1: Nothing selected yet. Waiting for an edge or vertex to be clicked.
        handleInitialClickAPM(mousePos);
    } else {
        handleSecondClickAPM(mousePos);
    }

    wg.redraw();
}

// First click handler for APMs
function handleInitialClickAPM(mousePos) {
    const clickedItem = findAnyClickedItem(mousePos);

    if (clickedItem.edge !== -1) {

        const edgeToRemoveIdx = clickedItem.edge;
        selectedEdge = edgeToRemoveIdx;
        const possibleNewEdges = findValidFlipsForAPMEdge(edgeToRemoveIdx);

        if (possibleNewEdges.length === 0) {
            toast("This edge cannot be part of a valid flip.", false, 4);
            resetSelectionState();
            return;
        }

        reconfigState.edges_to_remove = [edgeToRemoveIdx];
        // The structure [[[u1,v1]], [[u2,v2]]] is kept for consistency
        reconfigState.edges_to_add = possibleNewEdges.map(edge => [edge]); 

        // If insta-flip is on and there's only one unambiguous choice, perform the flip immediately.
        if (settingsManager.get(INSTA_FLIP_TOGGLE) && possibleNewEdges.length === 1) {
            performAPMFlip();
        } else {
            // Otherwise, move to the confirmation state where the user will pick the new edge.
            reconfigState.isReady = true;
            toast("Select a highlighted edge to complete the flip.");
        }
    } else if (clickedItem.vx !== -1) {
        selectedVx = clickedItem.vx;
        const edgeOfVx = findEdgeOfVxMatchings(selectedVx);
        reconfigState.mode = 'vertices'

        if (edgeOfVx === -1) {
            // this means the solo vertex was clicked.

            const possibleTargetVx = [];
            const soloVertex = selectedVx;

            // Check all other vertices for possible flips
            for (let i = 0; i < wg.state.vertices.length; i++) {
                if (i === soloVertex) {
                    continue;
                }
                
                const targetEdgeIdx = findEdgeOfVxMatchings(i);
                if (targetEdgeIdx === -1) {
                    console.error("no edge found for a vertex that should be matched in APM initial click");
                    continue; // Shouldn't happen in valid matching
                }
                
                const newEdge = [i, soloVertex];

                // Check if this flip would be valid
                let ts = wg.state.copyConstructor();
                ts.edges[targetEdgeIdx] = newEdge;
                ts.updateAdjList();
                
                console.log("test");
                if (isAPM(ts)) {
                    console.log("yes");
                    possibleTargetVx.push(i);
                } else {
                    console.log("no");
                }
            }

            if (possibleTargetVx.length === 0) {
                toast("No valid flips available from this vertex", false, 4);
                resetSelectionState();
                return;
            } 

            reconfigState.picked_vertex = selectedVx;
            reconfigState.possibleTargets = possibleTargetVx;

        } else {
            const isolatedVx = wg.state.unf.findIndex(item => item.eiv.length === 0);

            let ts = wg.state.copyConstructor();
            ts.edges[edgeOfVx] = [clickedItem.vx, isolatedVx];
    
            ts.updateAdjList();
            
            if (!isAPM(ts)) {
                toast("This vertex cannot be part of a valid flip.", false, 4);
                resetSelectionState();
                return;
            }
    
    
            reconfigState.edges_to_remove = [edgeOfVx];
            reconfigState.edges_to_add = [[[clickedItem.vx, isolatedVx]]]
    
            if (settingsManager.get(INSTA_FLIP_TOGGLE)) {
                performAPMFlip();
            } else {
                // Otherwise, move to the confirmation state where the user will pick the new edge.
                reconfigState.isReady = true;
                toast("Select a highlighted edge to complete the flip.");
            }
        }
    }
}



function handleSecondClickAPM(mousePos) {

    const clickedItem = findAnyClickedItem(mousePos);
    if (clickedItem.vx === -1 || !reconfigState.possibleTargets.includes(clickedItem.vx)) {
        // If the click is invalid (e.g., on empty space, or a non-highlighted item),
        // we cancel the entire operation.
        resetSelectionState();
        return;
    }


    const startVxIdx = reconfigState.picked_vertex;
    const targetVxIdx = clickedItem.vx;

    // The edge to add is unambiguously defined by the user's two clicks.
    const edge_to_add = [startVxIdx, targetVxIdx];

    let ts = wg.state.copyConstructor();
    ts.edges[findEdgeOfVxMatchings(targetVxIdx)] = edge_to_add;
    ts.updateAdjList();


    const edge_to_remove_idx = findEdgeOfVxMatchings(targetVxIdx);

    if (!isAPM(ts) || edge_to_remove_idx === -1) {
        console.error("Inconsistent State: A valid target connection should  result in an APM.");
        toast("Something went wrong with this selection.", true);
        resetSelectionState();
        return;
    }


    // SUCCESS: We have everything we need for the diagonal flip.
    // Update the state to be ready for confirmation.
    reconfigState.edges_to_remove = [edge_to_remove_idx];
    reconfigState.edges_to_add = [[edge_to_add]];
    reconfigState.isReady = true;

    // Clear the intermediate state properties.
    reconfigState.possibleTargets = [];
    reconfigState.picked_vertex = -1;

    if (settingsManager.get(INSTA_FLIP_TOGGLE)) {
        performAPMFlip();
    } else {
        // Otherwise, move to the confirmation state where the user will pick the new edge.
        toast("Select a highlighted edge to complete the flip.");
    }

} 

// Handle flip confirmation for APMs
function handleFlipConfirmationAPM(mousePos) {
    const minDist = settingsManager.get(PROXIMITY_EDGE) || DEFAULT_EDGE_HOVER_PROXIMITY;

    // The user must click near one of the potential new edges.
    for (const newEdgeSet of reconfigState.edges_to_add) {
        const newEdge = newEdgeSet[0]; // newEdgeSet is e.g., [[u,v]]
        const p1 = wg.dims.toCanvas(wg.state.vertices[newEdge[0]]);
        const p2 = wg.dims.toCanvas(wg.state.vertices[newEdge[1]]);

        if (distanceToSegment(mousePos, p1, p2) < minDist) {
            // The user has selected which new edge to add.
            reconfigState.edges_to_add = [[newEdge]];
            performAPMFlip();
            return;
        }
    }
    
    // If the user clicks anywhere else, cancel the operation.
    toast("Flip cancelled", false);
    resetSelectionState();
}

/**
 * Finds all valid new edges that can be created by removing a given edge.
 * A flip involves removing edge (u,v) and adding either (w,u) or (w,v),
 * where w is the isolated vertex, provided the new edge doesn't cross any others.
 * @param {number} edgeToRemoveIdx - The index of the edge to be removed.
 * @returns {Array<[number, number]>} An array of valid new edges.
 */
function findValidFlipsForAPMEdge(edgeToRemoveIdx) {
    const validNewEdges = [];
    const isolatedVx = wg.state.unf.findIndex(item => item.eiv.length === 0);

    if (isolatedVx === -1 || edgeToRemoveIdx === -1 || edgeToRemoveIdx >= wg.state.edges.length) {
        console.error("Could not find the isolated vertex in a supposed APM.");
        return [];
    }

    const [u, v] = wg.state.edges[edgeToRemoveIdx];

    // Create a temporary graph state without the edge being removed.
    // This is the set of edges we must not cross.

    // Candidate 1: Connect the isolated vertex to 'u'.
    const newEdge1 = [isolatedVx, u];
    let ts = wg.state.copyConstructor();
    ts.edges[edgeToRemoveIdx] = newEdge1;
    ts.updateAdjList();
    if (isAPM(ts)) {
        validNewEdges.push(newEdge1)
    }

    // Candidate 2: Connect the isolated vertex to 'v'.
    const newEdge2 = [isolatedVx, v];
    ts = wg.state.copyConstructor();
    ts.edges[edgeToRemoveIdx] = newEdge2;
    ts.updateAdjList();
    if (isAPM(ts)) {
        validNewEdges.push(newEdge2)
    }

    return validNewEdges;
}

/**
 * Executes the APM flip by modifying the graph state.
 */
function performAPMFlip() {
    if (reconfigState.edges_to_remove.length !== 1 || reconfigState.edges_to_add.length !== 1) {
        console.error("Invalid state for performing APM flip.");
        resetSelectionState();
        return;
    }

    const edgeToRemoveIdx = reconfigState.edges_to_remove[0];
    const edgeToAdd = reconfigState.edges_to_add[0][0];

    // Replace the old edge with the new one.
    // Splicing is safer if indices might change, but direct replacement is fine here.
    wg.state.edges[edgeToRemoveIdx] = edgeToAdd;
    wg.state.updateAdjList();

    toast("Flip successful!", false, 3);
    resetSelectionState();
    // No need to call wg.redraw() here if it's handled in the main click handler.
}


/**
 * Checks if the current graph is a valid crossing-free almost-perfect matching.
 * @param {object} [state=wg.state] - The graph state to validate.
 * @returns {boolean} True if the graph is a valid APM.
 */
function isAPM(state = wg.state) {
    const n = state.vertices.length;
    // An APM must have an odd number of vertices.
    if (n % 2 === 0) {
        console.log("even number");
        return false;
    }

    // 1. Check vertex degrees: Must be one vertex of degree 0, others of degree 1.
    const isolatedVx = state.unf.find(item => item.eiv.length === 0);
    if (!isolatedVx) {
        console.log("no isolated");
        return false; // Fails if there is not exactly one isolated vertex.
    }
    
    let countMatched = 0;
    for (let item of state.unf) {
        if (item.eiv.length === 1) {
            countMatched += 1;
        }
    }


    console.log(`n = ${n}, cm = ${countMatched}, isCF(s) = ${isCrossingFree(state)}`);
    return countMatched === n - 1 && isCrossingFree(state);

}