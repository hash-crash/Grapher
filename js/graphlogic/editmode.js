



function handleClickEditMode(mousePos) {

    let result = findAnyClickedItem(mousePos);

    selectedVx = result.vx;
    selectedEdge = result.edge;

    window.Grapher.redraw();
    
}






function handleHoverEditMode(mousePos) {
    let found = false;
    highlightedEdge = -1;

    // Check proximity to all vertices
    window.Grapher.state.vertices.forEach((v, i) => {
        if (isNearVertex(mousePos, v)) {
            highlightedVx = i;
            found = true;
            if (isDraggingVertex) {
                canvas.style.cursor = 'grabbing'
            } else {
                canvas.style.cursor = 'grab';
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
