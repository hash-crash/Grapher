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

        }

        // important: do edges first, then vertices, so that vertices would appear 'on top'
        this.state.edges.forEach(this.regularDrawEdge);

        if (showColinearPoints) {
            this.drawColinearIndicators()
        }

        this.state.vertices.forEach(this.regularDrawVx);



        // if (this.state?.mode === MOVE || this.state?.mode === ADD) {
        //     // todo figure out what to do here
        // }

    }

    regularDrawEdge(e, i) {
        if (selectedEdge === i) {
            drawSelectedEdge(e);
        } else if (highlightedEdge === i) {
            drawHighlightedEdge(e);
        } else if (edgeForRemoval === i) {
            drawEdgeForRemoval(e);
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
