/**
 * 
 */
class Grapher {
    /**
     * 
     * @param {State} state 
     * @param {Dims} dims 
     * @param {CanvasRenderingContext2D} contextL 
     */
    constructor(state, dims, contextL) {
        this.context = contextL;
        this.state = state;
        this.dims = dims;
    }
    

/**
 * This is where the magic happens.
 *  Every time some event is spotted which should alter the presentation of the graph, 
 * this function should be called, completely clearing the canvas and redrawing everything from scratch.
 * 
 * It is very important that this function always be callable without messing anything up!
 */
redraw() {
    // just making sure we dont get the incorrect object somehow
    wg = this;
    if (!this.state?.vertices) {
        alert(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }

    // setup:
    let newdims = refreshDims();

    if (!newdims) {
        alert(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }

    this.context.clearRect(0, 0, window.Grapher.context.canvas.width, window.Grapher.context.canvas.height);

    drawBackgroundCoordinateGrid();

    if (mode === EDIT_MODE) {
        this.drawAllEditMode();
    } else if (mode === RECONFIGURATION_MODE) {
        this.drawAllReconfigurationMode();
    } else {
        console.error("Unkown mode set :(");
    }

}




drawAllReconfigurationMode() {
    if (submode !== MATCHINGS_RECONFIGURATION_MODE) {
        console.log("TODO :(");
        return;
    }


    this.state.edges.forEach(this.drawFlippingEdge);



    // --- Stage 1: Highlighting initial selection and potential next steps ---
    if (selectionMode === 'vertex' && selectedVx !== -1 && chosenFlipVx === -1) {
        console.log("vx type");
        // A vertex is selected, waiting for the user to pick a target vertex.
        flippableWithSelectedVx.forEach(v => {
            drawHighlighedVx(wg.state.vertices[v]);
        });
    } else if (selectionMode === 'edge' && selectedEdge !== -1 && chosenFlipEdge === -1) {
        console.log("edge type");
        // An edge is selected, waiting for the user to pick a compatible edge.
        flipEdges.forEach(e => {
            drawEdgeForRemoval(wg.state.edges[e])
        });
    }

    // --- Stage 2: Drawing the green flip indication lines ---
    // This is when two original edges are determined, and we know the flip type(s).
    if (selectedEdge !== -1 && chosenFlipEdge !== -1 && currentFlipTypeToShow !== null) {
        // Highlight the two original edges that will be removed/flipped
        // drawHighlightOnEdge(selectedEdge, 'color_for_edge_to_be_flipped_1'); // Example
        // drawHighlightOnEdge(chosenFlipEdge, 'color_for_edge_to_be_flipped_2'); // Example
        
        // Call the updated drawFlipIndicationMatching
        drawFlipIndicationMatching(selectedEdge, chosenFlipEdge, currentFlipTypeToShow);
    }




    if (chosenFlipEdge !== -1 && selectedEdge !== -1) {
        console.log("wtf man why here");
        drawFlipIndicationMatching(chosenFlipEdge, selectedEdge);
    } else if (currentFlipTypeToShow !== null) {
        console.log("screm for me");
        drawFlipIndicationMatching(tempFlipEdges[0], tempFlipEdges[1], currentFlipTypeToShow);
    } else {
        // todo: add a toggle for all possible flips
        console.log("what am i even dong?")
        this.drawAllEditMode();
    }

    if (settingsManager.get(SHOW_COLINEAR_TRIPLES_TOGGLE)) {
        this.drawColinearIndicators();
    }
    if (settingsManager.get(SHOW_CROSSINGS_TOGGLE)) {
        this.drawCrossingIndicators();
    }

    this.state.vertices.forEach(this.regularDrawVx);
}







drawAllEditMode() {
    // important: do edges first, then vertices, so that vertices would appear 'on top'
    this.state.edges.forEach(this.regularDrawEdge);

    if (settingsManager.get(SHOW_COLINEAR_TRIPLES_TOGGLE)) {
        this.drawColinearIndicators()
    }

    if (settingsManager.get(SHOW_CROSSINGS_TOGGLE)) {
        this.drawCrossingIndicators();
    }

    this.state.vertices.forEach(this.regularDrawVx);
}



/**
 * 
 * @param {[Number, Number]} e the edge object, consisting of the indexes in vertices array of the 2 vx it connects 
 * @param {Number} i the index of e in the edges array
 */
drawFlippingEdge(e, i) {
    if (selectedEdge === i) {
        chosenFlipEdge === -1 ? drawSelectedEdge(e) : drawEdgeForRemoval(e);
    } else if (highlightedEdge === i) {
        drawHighlightedEdge(e);
    } else if (chosenFlipEdge === i) {
        drawEdgeForRemoval(e);
    } else if (flipEdges.includes(i)) {
        chosenFlipEdge === -1 ? drawEdgeForRemoval(e) : drawEdge(e);
    } else {
        drawEdge(e);
    }
}


/**
 * 
 * @param {[Number, Number]} e the edge object, consisting of the indexes in vertices array of the 2 vx it connects 
 * @param {Number} i the index of e in the edges array
 */
regularDrawEdge(e, i) {
    if (selectedEdge === i) {
        drawSelectedEdge(e);
    } else if (highlightedEdge === i) {
        drawHighlightedEdge(e);
    } else {
        drawEdge(e);
    }
}


regularDrawVx(v, i) {
    if (selectedVx === i) {
        drawSelectedVx(v);
    } else if (highlightedVx == i) {
        drawHighlighedVx(v);
    } else if(selectionMode === 'vertex' && chosenFlipVx === i) {
        drawHighlighedVx(v);
    } else if (selectionMode === 'vertex' && chosenFlipVx === -1 && flippableWithSelectedVx.includes(i)) {
        drawHighlighedVx(v);
    } else {
        drawVx(v);
    }
}

drawColinearIndicators() {
    allColinearTriples.forEach((triple) => {
        if (triple[0] === draggedVertexIndex ||
            triple[1] === draggedVertexIndex ||
            triple[2] === draggedVertexIndex
        ) {
            return;
        }
        drawEdgeWithWarning([triple[0], triple[2]]);
    });
}

drawCrossingIndicators() {
    for (let i = 0; i < wg.state.edges.length; i++) {
        const e1 = wg.state.edges[i];
        for (let j = i + 1; j < wg.state.edges.length; j++) {
            const e2 = wg.state.edges[j];
            if (!edgeIntersect(e1, e2)) {
                continue;
            }
            let p1 = wg.state.vertices[e1[0]];
            let p2 = wg.state.vertices[e1[1]];
            let q1 = wg.state.vertices[e2[0]];
            let q2 = wg.state.vertices[e2[1]];
            let pt = getIntersectionPoint(p1, p2, q1, q2);
            if (pt !== null) {
                drawIntersectionWarningCircle(pt);
            }
        }
    }
}

}





function doaredraw() {
    if (!window.Grapher) {
        alert(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }
    window.Grapher.redraw();
}
