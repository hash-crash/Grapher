/**
 * @fileoverview
 * This file contains the logic for handling the Paths Mode of the
 * application, specifically for the reconfiguration of crossing-free
 * spanning paths (CFSP). It includes the main click handler, state management,
 * and the logic for selecting edges and vertices to perform reconfigurations.
 */



/**
 * @see worker.js
 */
function allPossibleFlipsCFSP() {

    console.log("allPossibleFlipsCFSP called");

}



/**
 * Main click handler for matching reconfiguration
 */
function handleClickPathsMode(mousePos) {
    if (submode !== CFSP_RECONFIGURATION_MODE || !isCFSP()) {
        resetSelectionState();
        return;
    }

    const clickedItem = findAnyClickedItem(mousePos);

    if (reconfigState.isReady) {
        // State 3: Reconfiguration is ready, check if user clicked a flip indication
        handleFlipConfirmationPath(mousePos);

    } else if (reconfigState.mode === null) {
        // State 1: Nothing selected yet
        handleInitialClickPath(clickedItem);
    } else {
        // State 2: First item selected
        handleSecondClickPath(clickedItem);
    }

    wg.redraw();
}



function handleInitialClickPath(clickedItem) {

    if (clickedItem.vx !== -1) { // Vertex clicked

        reconfigState.mode = 'vertices';
        selectedVx = clickedItem.vx;

        // Find all vertices that can be validly connected to our start vertex.
        // This is the core logic for the vertex-first interaction.
        const possibleTargets = findValidSecondVertexForPath(selectedVx);

        if (possibleTargets.length > 0) {
            // SUCCESS: There are places to connect.
            reconfigState.picked_vertex = selectedVx;
            reconfigState.possibleTargets = possibleTargets; // Highlight these vertices
        } else {
            // FAILURE: No valid moves from this vertex.
            toast("No valid connections from this vertex.", false, 4);
            resetSelectionState();
        }

    } else if (clickedItem.edge !== -1) { // Edge clicked
        reconfigState.mode = 'edges';
        selectedEdge = clickedItem.edge;
        reconfigState.edges_to_remove = [clickedItem.edge];

        // Find all possible new edges that can be added if we remove this one.
        const possibleNewEdges = findValidReplacementEdgesPath(selectedEdge);

        if (possibleNewEdges.length > 0) {
            // SUCCESS: There are valid exchanges possible.
            // Store the potential new edges. The user will choose one in the next step.
            reconfigState.edges_to_add = possibleNewEdges.map(edge => [edge]); // e.g., [[[u1,v1]], [[u2,v2]]]

            if (settingsManager.get(INSTA_FLIP_TOGGLE) && possibleNewEdges.length === 1) {
                performTreeFlip();
            } else {
                reconfigState.isReady = true; // Go straight to confirmation state
            }
        } else {
            // FAILURE: This edge cannot be exchanged.
            toast("This edge cannot be part of a valid flip.", false, 4);
            resetSelectionState();
        }

    }

}

/**
 * Only vertices have the second click here,
 * if an edge was clicked, we know that it's the only one to remove, 
 * so the only remaining step is to confirm the flip
 */
function handleSecondClickPath(clickedItem) {
    if (reconfigState.mode !== 'vertices') {
        console.error("Should only be in vertices mode for 2nd click handler for trees");
        toast("Something went wrong", true);
        return;
    } 
    if (clickedItem.vx === -1) {
        return;
    }

    if (!reconfigState.possibleTargets.includes(clickedItem.vx)) {
        toast("Invalid target vertex.", true);
        resetSelectionState();
        return;
    }

    const startVxIdx = reconfigState.picked_vertex;
    const targetVxIdx = clickedItem.vx;

    if (startVxIdx === targetVxIdx) {
        toast("Cannot connect a vertex to itself.", true);
        resetSelectionState();
        return;
    }

    const newEdgeToAdd = [startVxIdx, targetVxIdx];
    reconfigState.edges_to_add = [[newEdgeToAdd]];

    const intersectedEdges = findIntersectedEdges(newEdgeToAdd);


    // Case A: The new edge crosses exactly one existing edge (simple swap).
    if (intersectedEdges.length === 1) {
        reconfigState.edges_to_remove = intersectedEdges;
        reconfigState.possibleTargets = [];

        if (settingsManager.get(INSTA_FLIP_TOGGLE)) {
            // This is an unambiguous, valid flip.
            performTreeFlip();
        } else {
            // This is a valid flip, but we need user confirmation.
            reconfigState.isReady = true; // Set state to await user input
            toast("Click the highlighted edge to confirm.");
        }

    // Case B: The new edge crosses no existing edges (cycle creation).
    } else if (intersectedEdges.length === 0) {
        // This is the complex case. Delegated to a dedicated function.
        resolveAndPerformFlip(newEdgeToAdd);

    // Case C: The new edge crosses multiple edges (invalid move).
    } else {
        toast("This move is invalid as it crosses multiple edges.", true, 4);
        resetSelectionState();
    }

}




function handleFlipConfirmationPath(mousePos) {
    // Check if the user clicked on a valid, highlighted edge.
    const clickedItem = findAnyClickedItem(mousePos);

    if (reconfigState.mode === 'edges') {
        const minDist = settingsManager.get(PROXIMITY_EDGE) || DEFAULT_EDGE_HOVER_PROXIMITY;

        // User chose an edge to remove, now must pick which NEW edge to add.
        for (const newEdgeSet of reconfigState.edges_to_add) {
            const newEdge = newEdgeSet[0];
            const p1 = wg.dims.toCanvas(wg.state.vertices[newEdge[0]]);
            const p2 = wg.dims.toCanvas(wg.state.vertices[newEdge[1]]);
    
            if (distanceToSegment(mousePos, p1, p2) < minDist) {
                // User picked this new edge. Finalize and perform the flip.
                reconfigState.edges_to_add = [[newEdge]];
                performTreeFlip();
                return; // Exit after flip
            }
        }
        //otherwise, cancel

    } else if (reconfigState.mode === 'vertices') {

        // existing edge clicked, and it's one of the 'possible targets', and vertices were picked to make a new edge
        // and isReady is true (implied because we are in handleFlipConfirmation)
        if (clickedItem.edge !== -1) {

            if (reconfigState.edges_to_remove.length !== 1 && 
                reconfigState.possibleTargets.includes(clickedItem.edge)
            ) {
                reconfigState.edges_to_remove = [clickedItem.edge];
            }
            performTreeFlip();
            return;
        }  
        // otherwise, cancel    

    }


    toast("Flip cancelled.", false);
    resetSelectionState();
   
}






/**
 * Handles the logic of adding a non-crossing edge, finding the correct
 * old edge to remove from the resulting cycle, and performing the flip.
 * This automates the cycle-breaking process.
 *
 * @param {[Number, Number]} edgeToAdd - The new edge, e.g., [u, v], that forms a cycle.
 */
function resolveAndPerformFlip(edgeToAdd) {
    // --- Temporarily add the new edge to determine the cycle's structure ---
    let ts = wg.state.copyConstructor();
    ts.edges.push(edgeToAdd);
    ts.updateAdjList(); // Rebuild adjacency list with the new edge included
    const adj = ts.unf;

    let edgeToRemoveIdx = -1;
    const [v1, v2] = edgeToAdd;


    // Check if both vertices are endpoints (degree 1). This forms a Hamiltonian cycle.
    if (adj[v1].eiv.length === 2 && adj[v2].eiv.length === 2) {
        console.log("Hamiltonian cycle detected. Awaiting user confirmation.");
        reconfigState.isReady = true; // Set state to await user input
        reconfigState.edges_to_add = [[edgeToAdd]];
        
        // Mark all original edges as potential removal targets for highlighting
        reconfigState.possibleTargets = wg.state.edges.map((_, i) => i);
        
        // 'confirmation' click will be needed.
        toast("Cycle created. Click any highlighed edge to remove it.", false, 5);

        return;
    }


    // One or both vertices are internal (degree 2), creating at least one degree-3 vertex.
    // We must find a single edge to remove that results in a valid CFSP.
    console.log("Degree-3 vertex cycle detected. Attempting to resolve automatically.");

    const oldEdgesOfV1 = ts.edges
            .map((e, i) => { 
                return {edge: e, idx: i}
            })
            .filter(e => e.edge.includes(v1));

    const oldEdgesOfV2 = ts.edges
            .map((e, i) => {
                return {edge: e, idx: i}
            })
            .filter(e => e.edge.includes(v2));

    // Create a unique list of candidate edges to test for removal.
    // These are the "old" edges connected to the new edge's endpoints.
    const candidateEdges = [...new Set([...oldEdgesOfV1, ...oldEdgesOfV2])].filter(e => !pequals(e.edge, edgeToAdd));

    console.log("Candidate edges for removal:", JSON.stringify(candidateEdges));
    reconfigState.possibleTargets = [];

    candidateEdges.forEach((edgeToRemove) => {
        // Create a temporary state to test the flip
        const tts = ts.copyConstructor();
        const tempEdges = tts.edges
                .filter(e => !pequals(e, edgeToRemove.edge));

        tts.edges = tempEdges;
        tts.updateAdjList(); // Rebuild adjacency list for the temporary state

        // If removing this edge results in a valid CFSP, we've found our flip.
        if (isCFSP(tts)) {
            console.log("Found valid resolution. Removing edge:", edgeToRemove);
            reconfigState.possibleTargets.push(edgeToRemove.idx);
        }
    });

    if (reconfigState.possibleTargets.length > 0) {
        // SUCCESS: We found at least one valid edge to remove.
        reconfigState.isReady = true; // Set state to await user confirmation
        console.log("Valid edges to remove found:", reconfigState.possibleTargets);

        if (reconfigState.possibleTargets.length === 1) {

            if (settingsManager.get(INSTA_FLIP_TOGGLE)) {
                // If instant flip is enabled and only one valid edge to remove, perform the flip immediately.
                console.log("Instant flip enabled. Performing flip immediately.");
                reconfigState.edges_to_remove = [reconfigState.possibleTargets[0]];
                reconfigState.edges_to_add = [[edgeToAdd]];
                performTreeFlip();
                return;
            } else {
                toast("Click the highlighted edge to confirm the flip.", false);
            }


        } else {
            console.error("This should not happen - if there are multiple removable edges, we should have been in the hamiltonian path section.");
            toast("Something went wrong", true);
            resetSelectionState();
        }


        return;
    }
    
    toast("This connection creates a cycle that cannot be resolved into a valid path.", true);
    resetSelectionState();
    
}


/**
 * Finds all vertices that can be connected to `startVxIdx` to initiate
 * a valid CFSP edge exchange.
 * @param {number} startVxIdx - The index of the starting vertex.
 * @returns {Array} - An array of valid target vertex indices.
 */
function findValidSecondVertexForPath(startVxIdx) {
    const validTargets = new Set();
    const n = wg.state.vertices.length;

    let ts = wg.state.copyConstructor();

    // Iterate through all possible vertices to connect to
    for (let targetVxIdx = 0; targetVxIdx < n; targetVxIdx++) {
        // Don't connect to self or existing neighbors
        if (targetVxIdx === startVxIdx ||
            wg.state.unf[startVxIdx].eiv.includes(targetVxIdx)
        ) {
            continue;
        }

        const potentialEdge = [startVxIdx, targetVxIdx];
        const intersectedEdges = findIntersectedEdges(potentialEdge);

        ts.edges.push(potentialEdge);
        ts.updateAdjList(); // Rebuild adjacency list with the new edge included
        
        // Case 1: Intersection flip
        if (intersectedEdges.length === 1) {
            if (isValidSwapPath(potentialEdge, intersectedEdges[0])) {
                validTargets.add(targetVxIdx);
            }

        // Case 2: Cycle creation/destruction flip
        } else if (intersectedEdges.length === 0) {

            for (let i = 0; i < ts.edges.length - 1; i++) {
                let tts= ts.copyConstructor();
                tts.edges = tts.edges.filter((_, idx) => idx !== i); // Remove the edge at index i
                tts.updateAdjList(); // Rebuild adjacency list after removal
                if (isCFSP(tts)) {
                    validTargets.add(targetVxIdx);
                    break; // Found a valid flip, no need to check further
                }
            }

        }
        //otherwise, multiple intersections mean this is not a valid flip

        ts.edges.pop();
        ts.updateAdjList();
    }
    return Array.from(validTargets);
}



/**
 * Given an edge to remove, finds all possible edges that can be
 * added to complete the graph back to a valid CFSP.
 * @param {number} edgeToRemoveIdx - The index of the edge being removed.
 * @returns {Array} - An array of valid edges to add, e.g., [[u1, v1], [u2, v2]].
 */
function findValidReplacementEdgesPath(edgeToRemoveIdx) {
    const validNewEdges = [];
    const originalEdge = [...wg.state.edges[edgeToRemoveIdx]];
    const n = wg.state.vertices.length;
    
    // Create a temporary graph state WITHOUT the edge
    let ts = wg.state.copyConstructor();
    ts.edges.splice(edgeToRemoveIdx, 1);
    ts.updateAdjList();

    // Find all non-existent, non-crossing edges
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {

            const newEdge = [i, j];

            // Check if edge [i,j] already exists in the temp graph, or if it's the edge we're trying to remove
            if (ts.unf[i].eiv.includes(j) ||
                pequals(newEdge, originalEdge) ||
                (newEdge[0] === originalEdge[1] && newEdge[1] === originalEdge[0])
            ) {
                continue;
            }

            if (findIntersectedEdges(newEdge, ts).length === 0) {
                // Now, check if adding this edge makes a valid CFSP
                ts.edges.push(newEdge);
                ts.updateAdjList();
                if (isCFSP(ts)) {
                    validNewEdges.push(newEdge);
                }
                ts.edges.pop(); // Backtrack
                ts.updateAdjList();
            }
        }
    }

    return validNewEdges;
}



/**
 * Checks if swapping an edge for another results in a valid CFSP without
 * permanently altering the graph state.
 *
 * @param {Array<number>} edgeToAdd - The new edge to be added, e.g., [v1, v2].
 * @param {number} edgeToRemoveIdx - The index of the edge to be removed from wg.state.edges.
 * @returns {boolean} - True if the resulting graph is a valid CFSP, false otherwise.
 */
function isValidSwapPath(edgeToAdd, edgeToRemoveIdx) {

    let ts = wg.state.copyConstructor(); // Create a temporary state copy

    ts.edges[edgeToRemoveIdx] = [...edgeToAdd]; // Replace the edge to remove with the new edge

    ts.updateAdjList();

    return isCFSP(ts);
}
