


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

    console.log("handleInitialClickPath called with:", clickedItem);

    if (clickedItem.vx !== -1) { // Vertex clicked

        reconfigState.mode = 'vertices';
        selectedVx = clickedItem.vx;



        // Find all vertices that can be validly connected to our start vertex.
        // This is the core logic for the vertex-first interaction.
        const possibleTargets = findValidPathPartners(selectedVx);

        if (possibleTargets.length > 0) {
            // SUCCESS: There are places to connect.
            reconfigState.mode = 'vertices';
            reconfigState.picked_vertex = selectedVx;
            reconfigState.possibleTargets = possibleTargets; // Highlight these vertices
        } else {
            // FAILURE: No valid moves from this vertex.
            toast("No valid connections can be made from this vertex.", false);
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
            reconfigState.mode = 'edges';
            reconfigState.edges_to_remove = [selectedEdge];
            // Store the potential new edges. The user will choose one in the next step.
            reconfigState.edges_to_add = possibleNewEdges.map(edge => [edge]); // e.g., [[[u1,v1]], [[u2,v2]]]
            reconfigState.isReady = true; // Go straight to confirmation state
        } else {
            // FAILURE: This edge cannot be exchanged.
            toast("This edge cannot be part of a valid flip.", false);
            resetSelectionState();
        }

    }

}

function handleSecondClickPath(clickedItem) {
    if (reconfigState.mode !== 'vertices' || clickedItem.vx === -1) {
        resetSelectionState();
        return;
    }

    if (!reconfigState.possibleTargets.includes(clickedItem.vx)) {
        toast("Invalid target vertex.", false);
        resetSelectionState();
        return;
    }

    const startVxIdx = reconfigState.picked_vertex;
    const targetVxIdx = clickedItem.vx;
    const newEdgeToAdd = [startVxIdx, targetVxIdx];

    const intersectedEdges = findIntersectedEdges(newEdgeToAdd);

    // Case A: The new edge crosses exactly one existing edge (simple swap).
    if (intersectedEdges.length === 1) {
        reconfigState.edges_to_remove = [intersectedEdges[0]];
        reconfigState.edges_to_add = [[newEdgeToAdd]];
        // This is unambiguous, so we can perform the flip directly.
        performPathFlip();

    // Case B: The new edge crosses no existing edges (cycle break).
    } else if (intersectedEdges.length === 0) {
        // Use our new, powerful helper to handle the entire operation.
        resolveAndPerformFlip(newEdgeToAdd);

    } else {
        console.error("Inconsistent State: Invalid connection selected.");
        resetSelectionState();
    }
}

function handleFlipConfirmationPath(mousePos) {
    // This function now only handles the 'edges' workflow, which is much simpler.
    if (!reconfigState.isReady || reconfigState.mode !== 'edges') {
        resetSelectionState();
        return;
    }

    const minDist = settingsManager.get(PROXIMITY_EDGE) || DEFAULT_EDGE_HOVER_PROXIMITY;

    // User chose an edge to remove, now must pick which NEW edge to add.
    for (const newEdgeSet of reconfigState.edges_to_add) {
        const newEdge = newEdgeSet[0];
        const p1 = wg.dims.toCanvas(wg.state.vertices[newEdge[0]]);
        const p2 = wg.dims.toCanvas(wg.state.vertices[newEdge[1]]);

        if (distanceToSegment(mousePos, p1, p2) < minDist) {
            // User picked this new edge. Finalize and perform the flip.
            reconfigState.edges_to_add = [[newEdge]];
            performPathFlip();
            return; // Exit after flip
        }
    }

    // If no proposed edge was clicked, cancel the operation.
    resetSelectionState();
}





/**
 * Handles the logic of adding a non-crossing edge, finding the correct
 * old edge to remove from the resulting cycle, and performing the flip.
 * This automates the cycle-breaking process.
 *
 * @param {Array<number>} edgeToAdd - The new edge, e.g., [u, v], that forms a cycle.
 */
function resolveAndPerformFlip(edgeToAdd) {
    // --- Temporarily add the new edge to determine the cycle's structure ---
    wg.state.edges.push(edgeToAdd);
    wg.state.updateAdjList(); // Rebuild adjacency list with the new edge included

    let edgeToRemoveIdx = -1;
    const [u, v] = edgeToAdd;

    // --- Find the edge to remove ---
    const degreeThreeNodes = [];
    if (wg.state.unf[u].eiv.length === 3) degreeThreeNodes.push(u);
    if (wg.state.unf[v].eiv.length === 3) degreeThreeNodes.push(v);

    // Case 1: At least one vertex became degree 3.
    if (degreeThreeNodes.length > 0) {
        for (const node of degreeThreeNodes) {
            // Get the neighbors from BEFORE we added the new edge ("old neighbors").
            const oldNeighbors = wg.state.unf[node].eiv.filter(
                neighbor => neighbor !== u && neighbor !== v
            );

            for (const neighbor of oldNeighbors) {
                const potentialEdgeToRemoveIdx = findEdgeIndex(node, neighbor);
                // Test if removing this edge results in a valid CFSP.
                if (isValidSwap(edgeToAdd, potentialEdgeToRemoveIdx)) {
                    edgeToRemoveIdx = potentialEdgeToRemoveIdx;
                    break;
                }
            }
            if (edgeToRemoveIdx !== -1) break;
        }
    }
    // Case 2: No vertex is degree 3. This means we formed a Hamiltonian cycle.
    else {
        // Any original edge from the cycle can be removed. We can just pick one.
        // Let's deterministically pick the first edge involving one of the new endpoints.
        const neighborsOfU = wg.state.unf[u].eiv.filter(n => n !== v);
        edgeToRemoveIdx = findEdgeIndex(u, neighborsOfU[0]);
    }

    // --- Clean up the temporary state before the final flip ---
    wg.state.edges.pop(); // Remove the edgeToAdd we pushed at the start
    wg.state.updateAdjList(); // Restore the original adjacency list

    // --- Finalize and perform the flip ---
    if (edgeToRemoveIdx !== -1) {
        reconfigState.edges_to_remove = [edgeToRemoveIdx];
        reconfigState.edges_to_add = [[edgeToAdd]];
        performPathFlip(); // This function handles history and state updates
    } else {
        toast("Could not find a valid edge to remove from the cycle.", true);
        resetSelectionState();
    }
}




// HELPER: Builds a temporary adjacency list from an edge list.
function buildAdjacencyList(edges) {
    const n = wg.state.vertices.length;
    const unf = Array(n).fill(null).map(() => ({ eiv: [] }));
    for (const edge of edges) {
        unf[edge[0]].eiv.push(edge[1]);
        unf[edge[1]].eiv.push(edge[0]);
    }
    return unf;
}

// HELPER: Finds indices of edges incident to a vertex in a given edge list.
function findIncidentEdges(vxIdx, edgeList) {
    const indices = [];
    for (let i = 0; i < edgeList.length; i++) {
        if (edgeList[i].includes(vxIdx)) {
            indices.push(i);
        }
    }
    return indices;
}


/**
 * Finds all vertices that can be connected to `startVxIdx` to initiate
 * a valid CFSP edge exchange.
 * @param {number} startVxIdx - The index of the starting vertex.
 * @returns {Array} - An array of valid target vertex indices.
 */
function findValidPathPartners(startVxIdx) {
    const validTargets = new Set();
    const n = wg.state.vertices.length;

    // Iterate through all possible vertices to connect to
    for (let targetVxIdx = 0; targetVxIdx < n; targetVxIdx++) {
        // Don't connect to self or existing neighbors
        if (targetVxIdx === startVxIdx || wg.state.unf[startVxIdx].eiv.includes(targetVxIdx)) {
            continue;
        }

        const potentialEdge = [startVxIdx, targetVxIdx];
        const intersectedEdges = findIntersectedEdges(potentialEdge);

        // Test Case 1: Intersection flip
        if (intersectedEdges.length === 1) {
            if (isValidSwap(potentialEdge, intersectedEdges[0])) {
                validTargets.add(targetVxIdx);
            }
        }
        // Test Case 2: Cycle creation/destruction flip
        else if (intersectedEdges.length === 0) {
            const cycleEdges = findCycleEdges(potentialEdge);
            // Is there at least one edge in the cycle we can remove?
            for (const edgeToRemoveIdx of cycleEdges) {
                if (isValidSwap(potentialEdge, edgeToRemoveIdx)) {
                    validTargets.add(targetVxIdx);
                    break; // Found a valid removal, so target is valid.
                }
            }
        }
    }
    return Array.from(validTargets);
}



/**
 * Given an edge to remove, finds all possible non-crossing edges that can be
 * added to complete the graph back to a valid CFSP.
 * @param {number} edgeToRemoveIdx - The index of the edge being removed.
 * @returns {Array} - An array of valid edges to add, e.g., [[u1, v1], [u2, v2]].
 */
function findValidReplacementEdgesPath(edgeToRemoveIdx) {
    const validNewEdges = [];
    const originalEdge = wg.state.edges[edgeToRemoveIdx];
    const n = wg.state.vertices.length;
    
    // Create a temporary graph state WITHOUT the edge
    const tempEdges = wg.state.edges.filter((_, i) => i !== edgeToRemoveIdx);
    const originalEdges = wg.state.edges;
    wg.state.edges = tempEdges; // Temporarily modify state

    // Find all non-existent, non-crossing edges
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            // Check if edge [i,j] already exists in the temp graph
            if (wg.state.unf[i].eiv.includes(j)) continue;

            const newEdge = [i, j];
            if (findIntersectedEdges(newEdge).length === 0) {
                // Now, check if adding this edge makes a valid CFSP
                wg.state.edges.push(newEdge);
                if (isCFSP()) {
                    validNewEdges.push(newEdge);
                }
                wg.state.edges.pop(); // Backtrack
            }
        }
    }

    wg.state.edges = originalEdges; // Restore original state
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
function isValidSwap(edgeToAdd, edgeToRemoveIdx) {
    // 1. Store the original state components that will be modified.
    const originalEdges = wg.state.edges;
    const originalUnf = wg.state.unf; // unf = "utility neighborhood finder" (adjacency list)

    // 2. Create the proposed new list of edges.
    // We create a new array to avoid issues with modifying the array while iterating elsewhere.
    const tempEdges = originalEdges.filter((_, index) => index !== edgeToRemoveIdx);
    tempEdges.push(edgeToAdd);

    // 3. Temporarily apply the new state.
    wg.state.edges = tempEdges;
    wg.state.updateAdjList(); // Assumes a helper exists to rebuild the adjacency list from wg.state.edges.
                     // If not, you'd need to implement one. It's crucial for isCFSP().

    // 4. Perform the check on the temporary state.
    const isValid = isCFSP();

    // 5. CRITICAL: Restore the original state.
    wg.state.edges = originalEdges;
    wg.state.unf = originalUnf;

    // 6. Return the result of the check.
    return isValid;
}


/**
 * Finds the indices of edges forming a cycle when a new edge is added to a spanning path.
 * It uses BFS to find the existing path between the new edge's endpoints.
 *
 * @param {Array<number>} newlyAddedEdge - The edge being added, e.g., [u, v].
 * @returns {Array<number>} - An array of edge indices that form the cycle (excluding the new edge).
 */
function findCycleEdges(newlyAddedEdge) {
    const [startNode, endNode] = newlyAddedEdge;
    const q = [startNode];
    const visited = new Set([startNode]);

    // A map to reconstruct the path: key = child, value = parent
    const parentMap = new Map();

    // 1. Perform BFS to find the path from startNode to endNode
    let pathFound = false;
    while (q.length > 0) {
        const u = q.shift();

        if (u === endNode) {
            pathFound = true;
            break;
        }

        // Search through existing neighbors
        for (const v of wg.state.unf[u].eiv) {
            if (!visited.has(v)) {
                visited.add(v);
                parentMap.set(v, u);
                q.push(v);
            }
        }
    }

    if (!pathFound) {
        // This case should not be reached if the graph was a valid path to begin with.
        console.error("Could not find a path to form a cycle.");
        return [];
    }

    // 2. Backtrack from endNode to startNode to reconstruct the path's edges.
    const cycleEdgeIndices = [];
    let curr = endNode;

    while (curr !== startNode) {
        const parent = parentMap.get(curr);
        // Find the index of the edge [curr, parent] in the global edge list.
        const edgeIdx = findEdgeIndex(curr, parent);
        if (edgeIdx !== -1) {
            cycleEdgeIndices.push(edgeIdx);
        }
        curr = parent;
    }

    return cycleEdgeIndices;
}

/**
 * HELPER: Finds the index of an edge in wg.state.edges given its two vertices.
 * @param {number} v1 - The first vertex index.
 * @param {number} v2 - The second vertex index.
 * @returns {number} - The index of the edge, or -1 if not found.
 */
function findEdgeIndex(v1, v2) {
    for (let i = 0; i < wg.state.edges.length; i++) {
        const edge = wg.state.edges[i];
        if ((edge[0] === v1 && edge[1] === v2) || (edge[0] === v2 && edge[1] === v1)) {
            return i;
        }
    }
    return -1;
}



