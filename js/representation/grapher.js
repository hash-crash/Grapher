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
        // just making sure we dont get the incorrect 
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



        this.dims = newdims;
        drawBackgroundCoordinateGrid();

        let i = 0;




       


        this.state.edges.forEach(e => {
            // console.log("e je " + e + " start je " + this.state.vertices[e[0]] + " end je " + this.state.vertices[e[1]]);

            if (selectedEdge === i) {
                drawSelectedEdge(e);
            } else if (highlightedEdge === i) {
                drawHighlightedEdge(e);
            } else if (edgeForRemoval === i) {
                drawEdgeForRemoval(e);
            } else {
                drawEdge(e);
            }

            i += 1;
        });

        ctx.restore();



        i = 0;
        this.state.vertices.forEach(v => {
            
            if (selectedVx === i) {
                
                drawSelectedVx(v);
                
            } else if (highlightedVx == i) {
                drawHighlighedVx(v);
            } else {
                drawVx(v);
            }

            i+= 1;
            
        });

        // todo replace this with the div items list
        //ctx.drawImage(moveIcon, 0.8 * this.dims.maxpx[0], 0.05 * this.dims.minpx[1], 50, 50);

        // if (this.state?.mode === MOVE || this.state?.mode === ADD) {
        //     // todo figure out what to do here
        // }

    }
}