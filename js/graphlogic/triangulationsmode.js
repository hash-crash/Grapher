

/**
 * Main click handler for TRIANGULATION reconfiguration.
 * It follows the standard 3-state machine pattern for selection.
 */
function handleClickTriangulationMode(mousePos) {
    // We might add a check here later, e.g. isTriangulation()
    // if (!isTriangulation()) { resetSelectionState(); return; }

    const clickedItem = findAnyClickedItem(mousePos);

    if (reconfigState.isReady) {
        // State 3: A diagonal flip is ready, check if user clicked a confirmation indication
        handleConfirmationTriangulation(mousePos);

    } else if (reconfigState.mode === null) {
        // State 1: Nothing selected yet, handle the first click
        handleInitialClickTriangulation(clickedItem);

    } else {
        // State 2: First item selected, handle the second click
        handleSecondClickTriangulation(clickedItem);
    }

    wg.redraw();
}


/**
 * Handles the initial click for a TRIANGULATION reconfiguration.
 * This function sets up the state for either an edge flip or a new vertex connection.
 */
function handleInitialClickTriangulation(clickedItem) {

    console.log("handleInitialClickTriangulation called with:", clickedItem);
    
    // --- WORKFLOW 1: User clicks an EDGE to initiate a flip ---
    if (clickedItem.edge !== -1) {
        const clickedEdgeIdx = clickedItem.edge;

        // Rule #1: Check if the edge is on the convex hull.
        if (isConvexHullEdge(clickedEdgeIdx)) {
            toast("Cannot flip a convex hull edge.", false);
            resetSelectionState();
            return;
        }

        // Rule #2: Check if the internal edge is flippable (forms a convex quad).
        const newEdgeToAdd = getDiagonalFlipIfPossible(clickedEdgeIdx);

        if (newEdgeToAdd) {
            // SUCCESS: The edge is flippable. The outcome is unambiguous.
            reconfigState.mode = 'edges';
            reconfigState.edges_to_remove = [clickedEdgeIdx];
            reconfigState.edges_to_add = [newEdgeToAdd]; // Note: a single edge, not a set of sets
            reconfigState.isReady = true; // We can go straight to the confirmation state
            
        } else {
            // FAILURE: The quadrilateral is concave.
            toast("This edge cannot be flipped.", false);
            resetSelectionState();
        }
    } 
    // --- WORKFLOW 2: User clicks a VERTEX to initiate a connection ---
    else if (clickedItem.vx !== -1) {
        const clickedVxIdx = clickedItem.vx;

        // Rule #3: Find all vertices that we can connect to.
        // This is the most complex part of the logic.
        const possibleTargets = findFlippableTargetsForVertex(clickedVxIdx);

        if (possibleTargets.length > 0) {
            // SUCCESS: There are valid places to connect to.
            reconfigState.mode = 'vertices';
            reconfigState.picked_vertex = clickedVxIdx;
            reconfigState.possibleTargets = possibleTargets;

        } else {
            // FAILURE: This vertex has no valid connections it can make.
            toast("No valid flips from this vertex.", false);
            resetSelectionState();
        }
    }
    // If user clicked empty space, do nothing.
}


/**
 * Handles the second click for a TRIANGULATION reconfiguration.
 * This function is only called when the user has already picked a starting
 * vertex and is now selecting a valid target to connect to.
 *
 * @param {Object} clickedItem - The item clicked by the user {vx, edge}.
 */
function handleSecondClickTriangulation(clickedItem) {
    // --- 1. Validate the Click ---
    // Ensure the user clicked a vertex and that it was a valid highlighted target.
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

    // We now need to find the single edge that this new edge crosses.
    // Our previous logic guarantees that for a valid target, there is exactly one.
    const intersectedEdges = findIntersectedEdges(edge_to_add);

    // This check should theoretically always pass if possibleTargets was calculated correctly,
    // but it's good practice to include it for robustness.
    if (intersectedEdges.length !== 1) {
        console.error("Inconsistent State: A valid target connection should intersect exactly one edge.");
        toast("Something went wrong with this selection.", true);
        resetSelectionState();
        return;
    }

    const edge_to_remove_idx = intersectedEdges[0];

    // SUCCESS: We have everything we need for the diagonal flip.
    // Update the state to be ready for confirmation.
    reconfigState.edges_to_remove = [edge_to_remove_idx];
    reconfigState.edges_to_add = [edge_to_add];
    reconfigState.isReady = true;

    // Clear the intermediate state properties.
    reconfigState.possibleTargets = [];
    reconfigState.picked_vertex = -1;
}



/**
 * Handles the final confirmation click on a proposed diagonal flip for a triangulation.
 * This is called when reconfigState.isReady is true.
 *
 * @param {Array} mousePos - The [x, y] coordinates of the user's click.
 */
function handleConfirmationTriangulation(mousePos) {
    // This function should only run when the state is ready with a single proposed flip.
    if (!reconfigState.isReady || reconfigState.edges_to_add.length !== 1 || reconfigState.edges_to_remove.length !== 1) {
        console.error("Confirmation handled in an invalid state.", reconfigState);
        resetSelectionState();
        return;
    }

    // There is only one new edge proposed in a triangulation flip.
    const newEdge = reconfigState.edges_to_add[0];

    // Get the coordinates of the new edge to check the distance.
    const p1 = wg.dims.toCanvas(wg.state.vertices[newEdge[0]]);
    const p2 = wg.dims.toCanvas(wg.state.vertices[newEdge[1]]);
    const minDist = settingsManager.get(PROXIMITY_EDGE) || DEFAULT_EDGE_HOVER_PROXIMITY;

    // Check if the user clicked close enough to the indication line.
    if (distanceToSegment(mousePos, p1, p2) < minDist) {
        // SUCCESS: The user confirmed the flip.
        performTriangulationFlip();
    } else {
        // The user clicked elsewhere, so cancel the operation.
        resetSelectionState();
    }
}


/**
 * Executes the 1-for-1 diagonal flip for a triangulation.
 * This replaces the edge to be removed with the new edge to be added.
 */
function performTriangulationFlip() {
    // Get the final operation details from the global state.
    const edgeToRemoveIdx = reconfigState.edges_to_remove[0];
    const edgeToAdd = reconfigState.edges_to_add[0];

    // For history purposes, we might want a copy of the edge before we change it.
    const originalEdgeRemoved = [...wg.state.edges[edgeToRemoveIdx]];

    console.log(`Flipping edge ${edgeToRemoveIdx}: removing [${originalEdgeRemoved}] and adding [${edgeToAdd}]`);

    // --- Perform the Swap ---
    // By replacing the edge at the same index, we avoid re-indexing all other edges,
    // which is safer and more efficient.
    wg.state.edges[edgeToRemoveIdx] = edgeToAdd;

    // --- Finalize ---
    // Update the history and reset the state machine for the next operation.
    addToHistory(wg.state.copyConstructor(), FLIP, originalEdgeRemoved, edgeToAdd);
    stateUpdated(); // This should handle redrawing and other necessary updates.
    resetSelectionState();
}




/**
 * A new, OPTIMIZED helper to find all valid vertex targets for a given starting vertex.
 * It uses the "2-hop neighbor" strategy to drastically reduce the search space
 * before performing more expensive geometric checks.
 *
 * @param {number} startVxIdx - The index of the vertex the user clicked.
 * @returns {Array} - An array of vertex indices that are valid targets.
 */
function findFlippableTargetsForVertex(startVxIdx) {
    const targets = new Set(); // Use a Set to automatically handle duplicates.

    // --- Phase 1: Candidate Generation (Your Optimization) ---
    // A target for a diagonal flip must be a 2-hop neighbor. Let's find them all.
    const candidates = new Set();
    const directNeighbors = new Set(wg.state.unf[startVxIdx].eiv);

    // Get neighbors of our neighbors
    for (const neighborIdx of directNeighbors) {
        for (const secondNeighborIdx of wg.state.unf[neighborIdx].eiv) {
            candidates.add(secondNeighborIdx);
        }
    }
    
    // A target cannot be the start vertex itself or one of its direct neighbors.
    candidates.delete(startVxIdx);
    for (const neighborIdx of directNeighbors) {
        candidates.delete(neighborIdx);
    }

    // --- Phase 2: Candidate Validation (Original Logic on a Smaller Set) ---
    // Now, loop through the much smaller candidate set instead of all vertices.
    for (const targetVxIdx of candidates) {
        const potentialEdge = [startVxIdx, targetVxIdx];

        // Find all edges that this potential new edge would cross
        const intersectedEdges = findIntersectedEdges(potentialEdge);

        // A valid connection for a flip must intersect exactly one existing edge.
        if (intersectedEdges.length === 1) {
            const edgeToFlipIdx = intersectedEdges[0];

            // That intersected edge must itself be a valid flippable internal edge.
            // Our existing helper is perfect for this check.
            if (getDiagonalFlipIfPossible(edgeToFlipIdx) !== null) {
                targets.add(targetVxIdx);
            }
        }
    }

    return Array.from(targets);
}





/**
 * Determines if an edge is part of the graph's convex hull by checking
 * the number of neighbors its endpoints have in common.
 *
 * In a triangulation:
 * - An internal edge's endpoints share exactly 2 common neighbors.
 * - A convex hull edge's endpoints share exactly 1 common neighbor.
 *
 * @param {number} edgeIdx - The index of the edge to check in wg.state.edges.
 * @returns {boolean} - True if the edge is on the convex hull, false otherwise.
 */
function isConvexHullEdge(edgeIdx) {
    if (edgeIdx < 0 || edgeIdx >= wg.state.edges.length) {
        console.error("Invalid edge index provided to isConvexHullEdge:", edgeIdx);
        return false;
    }

    // 1. Get the two vertex indices from the edge.
    const [v1_idx, v2_idx] = wg.state.edges[edgeIdx];

    // 2. Get the neighbor lists for these two vertices from the adjacency list.
    const neighbors_of_v1 = wg.state.unf[v1_idx].eiv;
    const neighbors_of_v2 = wg.state.unf[v2_idx].eiv;

    // 3. Find the number of common neighbors.
    // Using a Set provides a fast way to check for inclusion (O(1) average time).
    const neighbors_of_v1_set = new Set(neighbors_of_v1);
    
    let commonNeighborCount = 0;
    for (const neighbor of neighbors_of_v2) {
        if (neighbors_of_v1_set.has(neighbor)) {
            commonNeighborCount++;
        }
    }

    // 4. Apply the rule. A convex hull edge has exactly one common neighbor.
    return commonNeighborCount === 1;
}



/**
 * REVISED: Checks if an edge flip is valid. This version correctly handles
 * cases with more than two common neighbors by finding the "innermost" pair
 * that forms the adjacent empty triangles.
 *
 * @param {number} edgeIdx - The index of the edge to flip.
 * @returns {Array|null} - The new diagonal edge as [v1, v2], or null if not possible.
 */
function getDiagonalFlipIfPossible(edgeIdx) {
    if (edgeIdx < 0 || edgeIdx >= wg.state.edges.length || isConvexHullEdge(edgeIdx)) {
        return null;
    }

    const [v1_idx, v2_idx] = wg.state.edges[edgeIdx];
    const p1 = wg.state.vertices[v1_idx];
    const p2 = wg.state.vertices[v2_idx];

    // 1. Find all common neighbors
    const neighbors_of_v1 = new Set(wg.state.unf[v1_idx].eiv);
    const commonNeighbors = wg.state.unf[v2_idx].eiv.filter(n => neighbors_of_v1.has(n));

    // 2. Partition common neighbors into two groups based on which side they are on.
    const sideA_candidates = [];
    const sideB_candidates = [];
    for (const neighborIdx of commonNeighbors) {
        const p_neighbor = wg.state.vertices[neighborIdx];
        const determinant = det(p1, p2, p_neighbor);
        if (determinant > 0) sideA_candidates.push(neighborIdx);
        else if (determinant < 0) sideB_candidates.push(neighborIdx);
    }
    
    // 3. For each side, find the single "innermost" neighbor.
    const v_A_idx = findInnermostNeighbor([v1_idx, v2_idx], sideA_candidates);
    const v_B_idx = findInnermostNeighbor([v1_idx, v2_idx], sideB_candidates);

    // If we couldn't find exactly one innermost neighbor on each side, it's not a simple flip.
    if (v_A_idx === -1 || v_B_idx === -1) {
        return null;
    }

    // 4. We now have our true quadrilateral. Perform the convexity check.
    const p_A = wg.state.vertices[v_A_idx];
    const p_B = wg.state.vertices[v_B_idx];
    const det1 = det(p_A, p_B, p1);
    const det2 = det(p_A, p_B, p2);
    const isConvex = (det1 * det2) < 0;

    return isConvex ? [v_A_idx, v_B_idx] : null;
}

/**
 * HELPER: Given a set of candidate neighbors on one side of an edge,
 * finds the "innermost" one that forms an empty triangle.
 * @param {Array} edge - The base edge [v1, v2].
 * @param {Array} candidates - Array of vertex indices, all on the same side of the edge.
 * @returns {number} The index of the innermost vertex, or -1 if none is found.
 */
function findInnermostNeighbor(edge, candidates) {
    if (candidates.length === 0) {
        return -1;
    }
    if (candidates.length === 1) {
        return candidates[0];
    }

    // If there are multiple candidates, find the one that forms a triangle
    // which does NOT contain any of the other candidates.
    for (const c1_idx of candidates) {
        const p1 = wg.state.vertices[edge[0]];
        const p2 = wg.state.vertices[edge[1]];
        const pc1 = wg.state.vertices[c1_idx];
        
        let isInnermost = true;
        for (const c2_idx of candidates) {
            if (c1_idx === c2_idx) continue;
            const pc2 = wg.state.vertices[c2_idx];

            // If another candidate c2 is inside the triangle formed by the edge and c1,
            // then c1 is not the innermost neighbor.
            if (isPointInTriangle(pc2, p1, p2, pc1)) {
                isInnermost = false;
                break;
            }
        }

        if (isInnermost) {
            return c1_idx; // Found it.
        }
    }

    return -1; // Should not be reached in a valid triangulation, but good for safety.
}

/**
 * HELPER: Checks if a point p is inside the triangle formed by a, b, and c.
 * Uses the barycentric coordinate method.
 * @param {[number, number]} p - The point to check.
 * @param {[number, number]} a, b, c - The vertices of the triangle.
 * @returns {boolean}
 */
function isPointInTriangle(p, a, b, c) {
    const dX = p[0] - c[0];
    const dY = p[1] - c[1];
    const dX21 = c[0] - b[0];
    const dY12 = b[1] - c[1];
    const D = dY12 * (a[0] - c[0]) + dX21 * (a[1] - c[1]);

    const s = dY12 * dX + dX21 * dY;
    const t = (c[1] - a[1]) * dX + (a[0] - c[0]) * dY;

    if (D < 0) return s <= 0 && t <= 0 && s + t >= D;
    return s >= 0 && t >= 0 && s + t <= D;
}