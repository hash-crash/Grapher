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

    if (selectedEdge === -1) {
        // todo: add a toggle for all possible flips
        this.drawAllEditMode();
        return;
    }


    this.state.edges.forEach(this.drawFlippingEdge);

    if (chosenFlipEdge !== -1 && selectedEdge !== -1) {
        drawFlipIndication(chosenFlipEdge, selectedEdge);
    }

    if (showColinearPoints) {
        this.drawColinearIndicators()
    }
    this.state.vertices.forEach(this.regularDrawVx);
}







drawAllEditMode() {
    // important: do edges first, then vertices, so that vertices would appear 'on top'
    this.state.edges.forEach(this.regularDrawEdge);

    if (showColinearPoints) {
        this.drawColinearIndicators()
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
}



function doaredraw() {
    if (!window.Grapher) {
        alert(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }
    window.Grapher.redraw();
}
