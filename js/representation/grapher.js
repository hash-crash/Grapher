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
 * NEW HELPER: Draws the proposed new edges ("indications").
 * This function replaces the old 'drawFlipIndicationMatching'.
 * It reads directly from the reconfigState to know what to draw.
 */
drawReconfigurationIndications() {
    // Case 1: The flip is unambiguous and ready to be confirmed.
    if (!reconfigState.isReady || reconfigState.edges_to_add.length === 0) {
        return;
    }

    
    let a = true;
    for (const edgeset of reconfigState.edges_to_add) {
        for (const edge of edgeset) {
            if (a) {
                drawFlipInsertEdgeA(edge);
            } else {
                drawFlipInsertEdgeB(edge);
            }
        }
        a = !a; // Alternate between two styles for visual clarity
    }
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



/**
 * REFACTORED: The main drawing loop for reconfiguration mode.
 * It follows a strict order to ensure vertices are drawn on top of edges.
 * It reads from the single 'reconfigState' object to determine styles.
 */
drawAllReconfigurationMode() {
    // Exit if not in the correct mode (you can add other graph types here later)
    if (mode !== RECONFIGURATION_MODE) {
        // Fallback to a default drawing mode if necessary
        this.drawAllEditMode(); 
        return;
    }


    // ======================================================
    // == PASS 1: DRAW ALL EXISTING EDGES
    // ======================================================
    // We use the 'drawFlippingEdge' function
    // It contains all the logic for default, selected, target,
    // and for-removal styles based on the reconfigState.
    this.state.edges.forEach((e, i) => this.drawFlippingEdge(e, i));



    // ======================================================
    // == PASS 2: DRAW THE RECONFIGURATION INDICATIONS
    // ======================================================
    // If a selection is ready, we draw the proposed new "green" edges.
    // This happens *after* existing edges are drawn, but *before* vertices.
    this.drawReconfigurationIndications();



    // ======================================================
    // == PASS 3: DRAW ALL VERTICES
    // ======================================================
    // We use the 'drawFlippingVertex' function we designed.
    // It handles default, selected, target, and highlighted vertex styles.
    this.state.vertices.forEach((v, i) => this.drawFlippingVertex(v, i));


    // --- Optional Overlays ---
    if (settingsManager.get(SHOW_COLINEAR_TRIPLES_TOGGLE)) {
        this.drawColinearIndicators();
    }
    if (settingsManager.get(SHOW_CROSSINGS_TOGGLE)) {
        this.drawCrossingIndicators();
    }
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
 * It uses the central 'reconfigState' object to determine the drawing style.
 *
 * @param {[Number, Number]} e the edge object, consisting of the indexes in vertices array of the 2 vx it connects 
 * @param {Number} i the index of e in the edges array
 */
drawFlippingEdge(e, i) {
    if (reconfigState.isReady && reconfigState.edges_to_remove.includes(i)) {
        drawEdgeForRemoval(e);
        return;
    }

    if (highlightedEdge === i) {
        drawHighlightedEdge(e);
        return;
    }

    // --- State 3: An item has been selected, and we are awaiting the next action ---
    if (!reconfigState.isReady && reconfigState.mode !== null) {
        
        // Is this edge the FIRST one selected in 'edges' mode?
        if (reconfigState.mode === 'edges' &&
            reconfigState.edges_to_remove.length === 1 &&
            reconfigState.edges_to_remove[0] === i
        ) {
            drawSelectedEdge(e); // A special style for the primary selected item.
            return;
        }

        // Is this edge a potential target for the user to click next?
        if (reconfigState.mode === 'edges' &&
            reconfigState.possibleTargets.includes(i)) {
            // In the old code, these were drawn as "for removal", so we keep that.
            // A different style like `drawPossibleTargetEdge(e)` could be clearer.
            drawEdgeForRemoval(e);
            return;
        }
        
    } else if (reconfigState.isReady) {
        if (reconfigState.mode === 'vertices' && reconfigState.edges_to_add.length > 0) {
            // If we are in 'vertices' mode and a new edge is already defined
            // so all of the possible edges_to_remove are possible targets.

            console.log("isReady is true, mode is vertices, edges_to_add.length > 0");
            if (reconfigState.possibleTargets.includes(i)) {
                drawEdgeForRemoval(e);
                return;
            }
        }
    }

    // --- State 4: Default ---
    // If none of the above conditions are met, draw a normal edge.
    drawEdge(e);
}


/**
 * Draws a single vertex, determining its style based on the global 'reconfigState'.
 * This function defines the visual priority for different vertex states.
 *
 * @param {Array} v - The vertex data (e.g., its [x, y] coordinates).
 * @param {number} i - The index of the vertex in the main wg.state.vertices array.
 */
drawFlippingVertex(v, i) {
    
    // --- Priority 1: Hover State ---
    // The hover highlight should always be visible for immediate user feedback,
    // overriding any other selection state.
    if (highlightedVx === i) {
        drawHighlighedVx(v);
        return; // Style has been applied, so we are done with this vertex.
    }

    // --- Priority 2: Active Selection States ---
    // These styles only apply when a selection process is underway (`!isReady`)
    // and we are specifically in 'vertices' mode.
    if (!reconfigState.isReady && reconfigState.mode === 'vertices') {
        
        // Is this vertex the primary one that the user clicked first?
        if (reconfigState.picked_vertex === i) {
            drawSelectedVx(v);
            return;
        }

        // Is this vertex a valid target for the user's *next* click?
        if (reconfigState.possibleTargets.includes(i)) {
            // Assuming you have a style for potential vertex targets.
            drawHighlighedVx(v);
            return;
        }
    }

    // --- Priority 3: Default State ---
    // If none of the special conditions above are met, the vertex is not part of
    // the active selection. Draw it with the default style.
    drawVx(v);
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
    } else if(reconfigState.mode === 'vertex' && chosenFlipVx === i) {
        drawHighlighedVx(v);
    } else if (reconfigState.mode === 'vertex' && chosenFlipVx === -1 && flippableWithSelectedVx.includes(i)) {
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
