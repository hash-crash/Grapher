
function handleHoverReconfigurationMode(mousePos) {
    let found = false;
    highlightedEdge = -1;

    // Check proximity to all vertices
    window.Grapher.state.vertices.forEach((v, i) => {
        if (isNearVertex(mousePos, v)) {
            highlightedVx = i;
            found = true;
            if (isDraggingCanvas) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'pointer';
            }
        }
    });

    if (!found) {
        highlightedVx = -1;
        let closestDistance = Infinity;

        window.Grapher.state.edges.forEach((edge, i) => {
            
            const v1 = window.Grapher.dims.toCanvas(window.Grapher.state.vertices[edge[0]]);
            const v2 = window.Grapher.dims.toCanvas(window.Grapher.state.vertices[edge[1]]);
            
            // I think this is redundant, but I'd rather be safe than sorry
            if (isNearVertex(mousePos, window.Grapher.state.vertices[edge[0]]) || 
                isNearVertex(mousePos, window.Grapher.state.vertices[edge[1]])) {
                return;
            }

            const dist = distanceToSegment(mousePos, v1, v2);
            let minDist = settingsManager.get(PROXIMITY_EDGE);
            if (!minDist) {
                minDist = DEFAULT_EDGE_HOVER_PROXIMITY;
            }
            if (dist < minDist && dist < closestDistance) {
                closestDistance = dist;
                highlightedEdge = i;
            }
        });

        if (isDraggingCanvas) {
            canvas.style.cursor = 'move';
        } else if (highlightedEdge !== -1) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }
    }
    return found;
}






function createInitialSelection(graph) {
    return {
        // The user interaction mode (can be different for each graph type)
        mode: null,          // Either 'edges' or 'vertices'

        isReady: false,   // True when a valid reconfiguration is ready to be shown
        
        edges_to_remove: [], // An array of edge indices to be removed - size 2 for perfect matchings, size 1 otherwise
        edges_to_add: [],    // An array of new edges to be added (as vertex index pairs)
                             // e.g., [[v1, v2], [v3, v4]]

        picked_vertex: -1, // The index of the vertex that is currently selected for flipping
        // Data for the UI and intermediate steps
        possibleTargets: [], // Array of indices (edges or vertices) to highlight
    };
}


/**
 * Resets the reconfiguration state
 */
function resetSelectionState() {
    reconfigState = createInitialSelection(wg);
    selectedEdge = -1;
    selectedVx = -1;
    wg.redraw();
}






/**
 * 
 * @returns 
 */
function getAllPossibleFlips() {
    switch (submode) {
        case MATCHINGS_RECONFIGURATION_MODE:
            return allPossibleFlipsMatchings();
        case TRIANGULATION_RECONFIGURATION_MODE:
            return []; // todo;
        case CFSP_RECONFIGURATION_MODE:
            return []; // todo;
        case CFST_RECONFIGURATION_MODE:
            return []; // todo;
        default:
            console.error("unkown submode");
            break;
    }
}