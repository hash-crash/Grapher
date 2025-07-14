/**
 * @fileoverview
 * Handles reconfiguration of crossing-free spanning trees (CFST)
 * using 1-for-1 edge flips with the same state machine as paths
 */


/**
 * @see worker.js
 */
function allPossibleFlipsCFST() {

    console.log("allPossibleFlipsCFST called");

}



// Main handler for tree reconfiguration
function handleClickTreesMode(mousePos) {
    if (submode !== CFST_RECONFIGURATION_MODE) {
        resetSelectionState();
        return;
    }
    if (!isCFST()) {
        toast("Graph is not a valid tree, but app mode is tree", true, 5);
        resetSelectionState();
        return;
    }

    const clickedItem = findAnyClickedItem(mousePos);

    if (reconfigState.isReady) {
        // State 3: Reconfiguration is ready, check if user clicked a flip indication
        handleFlipConfirmationTree(mousePos);

    } else if (reconfigState.mode === null) {
        // State 1: Nothing selected yet
        handleInitialClickTree(clickedItem);
    } else {
        // State 2: First item selected
        handleSecondClickTree(clickedItem);
    }

    wg.redraw();
}

// First click handler for trees
function handleInitialClickTree(clickedItem) {

    if (clickedItem.vx !== -1) { // Vertex clicked

        reconfigState.mode = 'vertices';
        selectedVx = clickedItem.vx;
        
        const possibleTargets = findValidSecondVertexForTree(selectedVx);
        
        if (possibleTargets.length > 0) {
            reconfigState.picked_vertex = selectedVx;
            reconfigState.possibleTargets = possibleTargets;
        } else {
            toast("No valid connections from this vertex.", false, 4);
            resetSelectionState();
        }
        
    } else if (clickedItem.edge !== -1) { // Edge clicked
        reconfigState.mode = 'edges';
        selectedEdge = clickedItem.edge;
        reconfigState.edges_to_remove = [clickedItem.edge];
        
        const possibleNewEdges = findValidReplacementEdgesTree(selectedEdge);
        
        if (possibleNewEdges.length > 0) {
            reconfigState.edges_to_add = possibleNewEdges.map(edge => [edge]); // e.g., [[[u1,v1]], [[u2,v2]]]

            if (settingsManager.get(INSTA_FLIP_TOGGLE) && possibleNewEdges.length === 1) {
                performTreeFlip();
            } else {
                reconfigState.isReady = true; // Go straight to confirmation state
            }
        } else {
            toast("This edge cannot be part of a valid flip.", false, 4);
            resetSelectionState();
        }
    }
}

// Second click handler for trees (vertex mode)
function handleSecondClickTree(clickedItem) {
    if (reconfigState.mode !== 'vertices') {
        console.error("Should only be in vertices mode for 2nd click handler for trees");
        toast("Something went wrong", true);
        return;
    } 
    if (clickedItem.vx === -1) {
        return;
    }
    
    if (!reconfigState.possibleTargets.includes(clickedItem.vx)) {
        toast("Invalid target vertex", true);
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
    
    const newEdge = [startVxIdx, targetVxIdx];
    reconfigState.edges_to_add = [[newEdge]];

    const intersectedEdges = findIntersectedEdges(newEdge);

    // Case A: The new edge crosses exactly one existing edge (simple swap).
    if (intersectedEdges.length === 1) {
        reconfigState.edges_to_remove = intersectedEdges;
        reconfigState.possibleTargets = [];
        
        if (settingsManager.get(INSTA_FLIP_TOGGLE)) {
            performTreeFlip();
        } else {
            reconfigState.isReady = true;
            toast("Click highlighted edge to confirm.");
        }

    // Case B: No crossings (cycle creation)
    } else if (intersectedEdges.length === 0) {
        resolveTreeFlip(newEdge);

    // Case C: Invalid move (multiple crossings)
    } else {
        toast("This move is invalid as it crosses multiple edges.", true, 4);
        resetSelectionState();
    }
}




// Handle flip confirmation for trees
function handleFlipConfirmationTree(mousePos) {
    const clickedItem = findAnyClickedItem(mousePos);
    
    // Edge-first mode: Choosing which new edge to add
    if (reconfigState.mode === 'edges') {
        const minDist = settingsManager.get(PROXIMITY_EDGE) || DEFAULT_EDGE_HOVER_PROXIMITY;
        
        for (const newEdgeSet of reconfigState.edges_to_add) {
            const newEdge = newEdgeSet[0];
            const p1 = wg.dims.toCanvas(wg.state.vertices[newEdge[0]]);
            const p2 = wg.dims.toCanvas(wg.state.vertices[newEdge[1]]);
            
            if (distanceToSegment(mousePos, p1, p2) < minDist) {
                reconfigState.edges_to_add = [[newEdge]];
                performTreeFlip();
                return;
            }
        }
        //otherwise, cancel

    } else if (reconfigState.mode === 'vertices') {

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

    toast("Flip cancelled", false);
    resetSelectionState();
}

// Find valid vertices to connect to for tree reconfig
function findValidSecondVertexForTree(startVxIdx) {
    const validTargets = new Set();
    const n = wg.state.vertices.length;

    let ts = wg.state.copyConstructor();

    
    for (let targetVxIdx = 0; targetVxIdx < n; targetVxIdx++) {
        if (targetVxIdx === startVxIdx || 
            wg.state.unf[startVxIdx].eiv.includes(targetVxIdx)
        ) {
            continue; // Skip self and existing neighbors
        }
        
        const newEdge = [startVxIdx, targetVxIdx];
        const intersectedEdges = findIntersectedEdges(newEdge);

        ts.edges.push(newEdge);
        ts.updateAdjList(); // Rebuild adjacency list with the new edge included
        
        // Case 1: Simple swap (crosses one edge)
        if (intersectedEdges.length === 1) {
            if (isValidTreeSwap(newEdge, intersectedEdges[0])) {
                validTargets.add(targetVxIdx);
            }
        
        // Case 2: No crossings (cycle creation)
        } else if (intersectedEdges.length === 0) {

            for (let i = 0; i < ts.edges.length - 1; i++) {
                let tts = ts.copyConstructor();
                tts.edges = tts.edges.filter((_, idx) => idx !== i); // Remove the edge at index i
                tts.updateAdjList(); // Rebuild adjacency list after removal
                if (isCFST(tts)) {
                    validTargets.add(targetVxIdx);
                    break; // Found a valid flip, no need to check further
                }
            }

        }
        // otherwise, multiple intersections mean this is not a valid flip

        ts.edges.pop();
        ts.updateAdjList();
    }
    
    return Array.from(validTargets);
}

// Find valid replacement edges when removing an edge
function findValidReplacementEdgesTree(edgeToRemoveIdx) {
    const validNewEdges = [];
    const originalEdge = [...wg.state.edges[edgeToRemoveIdx]];
    const n = wg.state.vertices.length;
    
    // Create temp state without the edge
    let ts = wg.state.copyConstructor();
    ts.edges.splice(edgeToRemoveIdx, 1);
    ts.updateAdjList();
    
    // Get the two components created by removal
    const components = findConnectedComponents(ts);
    if (components.length !== 2) return []; // Should always be 2 for trees
    
    // Try all connections between components
    for (const u of components[0]) {
        for (const v of components[1]) {
            if (u === v) {
                continue;
            }
            
            const newEdge = [u, v];
            // Skip same as original edge (no-op flip)
            if (pequals(newEdge, originalEdge) || 
                (u === originalEdge[1] && v === originalEdge[0])
            ) {
                continue;
            }
            
            // Check crossings in temp state
            if (findIntersectedEdges(newEdge, ts).length === 0) {
                // Temporarily add edge to validate
                ts.edges.push(newEdge);
                ts.updateAdjList();
                
                if (isCFST(ts)) {
                    validNewEdges.push(newEdge);
                }
                
                // Back to state before addition
                ts.edges.pop();
                ts.updateAdjList();
            }
        }
    }
    
    return validNewEdges;
}

// Handle cycle creation case for trees
function resolveTreeFlip(newEdge) {
    // Temporarily add new edge
    let ts = wg.state.copyConstructor();
    ts.edges.push(newEdge);
    ts.updateAdjList();

    const n = ts.edges.length;
    const candidateEdges = [];

    // we only go until n-1 because the last one is the one we just added
    for (let i = 0; i < n - 1; i++) {
        
        let tts = ts.copyConstructor();
        tts.edges.splice(i, 1);
        tts.updateAdjList();

        if (isCFST(tts)) {
            candidateEdges.push(i);
        }

    }

    if (candidateEdges.length > 0) {
        reconfigState.possibleTargets = candidateEdges;
        reconfigState.isReady = true;
        toast("Select edge to remove", false);
    } else {
        toast("No valid edge to remove", true);
        resetSelectionState();
    }

}


// Find connected components (BFS)
function findConnectedComponents(state) {
    const visited = new Array(state.vertices.length).fill(false);
    const components = [];
    
    for (let i = 0; i < state.vertices.length; i++) {
        if (!visited[i]) {
            const comp = [];
            const queue = [i];
            visited[i] = true;
            
            while (queue.length > 0) {
                const u = queue.shift();
                comp.push(u);
                
                for (const v of state.unf[u].eiv) {
                    if (!visited[v]) {
                        visited[v] = true;
                        queue.push(v);
                    }
                }
            }
            
            components.push(comp);
        }
    }
    
    return components;
}


// Validate tree swap
function isValidTreeSwap(edgeToAdd, edgeToRemoveIdx) {
    let ts = wg.state.copyConstructor();

    ts.edges[edgeToRemoveIdx] = [...edgeToAdd]; // Replace the edge to remove with the new edge

    ts.updateAdjList();

    return isCFST(ts);
}
