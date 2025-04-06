/**
 * Responsible for conversions between the virtual graph coordinates and the 'physical' canvas coordinates.
 * Handles y-axis inversion
 */
class Dims {
    /**
     * 
     * @param {Number} canvasWidth 
     * @param {Number} canvasHeight 
     * @param {Number} zoom 
     * @param {[Number, Number]} offset the canvas coordinates of graph origin (0,0) would be (even if it's outside the renderable canvas)
     */
    constructor(canvasWidth, canvasHeight, zoom, offset) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.zoom = zoom;         // pixels per graph unit (e.g., 50 means 1 graph unit = 50 pixels)
        this.offset = offset;     // [offsetX, offsetY] in canvas pixels
    }

    /**
     * Converts graph coordinates to canvas coordinates.
     * For example, if offset is [100, 100] and zoom = 50,
     * then graph coordinate [2,3] becomes [100 + 2*50, 100 + 3*50] = [200, 250].
     * @param {[Number, Number]} coords to be converted to canvas pixel position
     */
    toCanvas(coords) {
        if (!coords) {
            return [this.canvasWidth / 2, this.canvasHeight / 2];
        }
        return [
            this.offset[0] + coords[0] * this.zoom,
            this.offset[1] - coords[1] * this.zoom
        ];
    }

    /**
     * Converts canvas coordinates to graph coordinates.
     * 
     * @param {[Number, Number]} canvasPos to be converted to graph coordinates. WIll not perform any rounding.
     */
    toCoords(canvasPos) {
        if (!canvasPos) {
            return [0,0];
        }
        return [
            (canvasPos[0] - this.offset[0]) / this.zoom,
            (this.offset[1] - canvasPos[1]) / this.zoom
        ];
    }

    /**
     * Update the stored canvas dimensions.
     */
    updateCanvasSize(width, height, zoom = null, offset = null) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        if (zoom != null) {
            this.zoom = zoom;
        }
        if (offset != null) {
            this.offset = offset;
        }
    }
}


/**
 * find the x coordinate of the right-most vertex and the y coordinate of the highest vertex
 */
function getMaxCoords() {
    xmax = Number.NEGATIVE_INFINITY;
    ymax = Number.NEGATIVE_INFINITY;
    if (!wg.state?.vertices) {
        alert(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }
    wg.state.vertices.forEach(v => {
        if (v[0] > xmax) {
            xmax = v[0];
        }
        if (v[1] > ymax) {
            ymax = v[1];
        }
    });
    return [xmax + 1, ymax + 1];
}

/**
 * find the x coordinate of the left-most vertex and the y coordinate of the lowest vertex
 */
function getMinCoords() {
    xmin = Number.POSITIVE_INFINITY;
    ymin = Number.POSITIVE_INFINITY;
    if (!wg.state?.vertices) {
        alert(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }
    wg.state.vertices.forEach(v => {
        if (v[0] < xmin) {
            xmin = v[0];
        }
        if (v[1] < ymin) {
            ymin = v[1];
        }
    });
    return [xmin - 1, ymin - 1];
}







/**
 * Resize the canvas according to window dimensions.
 * Adjust this logic as needed.
 */
function resizeCanvas() {
    let width, height;
    if (window.innerWidth > 768) {
        // For desktops, use 80% of window width.

        s.mobileScreen = false;
        height = window.innerHeight;
        width = Math.round(window.innerWidth * 0.8);
    } else {
        // For smaller screens (if ever needed)

        s.mobileScreen = true;
        height = Math.round(window.innerHeight * 0.8);
        width = window.innerWidth;
    }
    canvas.width = width;
    canvas.height = height;
    return [width, height];
}

/**
 * Refresh the camera dims.
 * This function should be called whenever the canvas is resized.
 *
 * In this version, we don’t compute min/max coordinates based on your graph;
 * instead, we just update the canvas dimensions.
 *
 * The camera offset and zoom remain unchanged so that the “view” stays consistent.
 *
 * @returns {Dims} representing the new, updated view. 
 */
function refreshDims(zoom = null, offset = null) {
    let [w, h] = resizeCanvas();
    // Assume we already have a global dims (or set defaults if not)
    if (!window.Grapher.dims) {
        // Initialize with a default zoom and center the origin roughly in the middle.
        window.Grapher.dims = new Dims(w, h, 20, [w / 2, h / 2]);
    } else {
        window.Grapher.dims.updateCanvasSize(w, h, zoom, offset);
    }
    return window.Grapher.dims;
}







canvas.addEventListener('wheel', (event) => {
    if (!wg || !wg.state || !wg.dims) {
        return;
    }

    event.preventDefault();
    let zoomIntensity = 0.002; // Adjust sensitivity here
    // Compute the new zoom level.
    let delta = event.deltaY;
    let zoomFactor = Math.exp(-delta * zoomIntensity);
    
    let oldZoom = wg.dims.zoom;
    let zoom = (oldZoom == null ? 
        20 :
        oldZoom * zoomFactor);

    // Get mouse position relative to canvas
    let mousePos = getMousePos(event);
    let mouseCoords = wg.dims.toCoords(mousePos);


    /* The new offset calculation comes from the following
     canvasPosX = offsetX + zoom * graphcoordX
    
     mouseCoords are the graph coords of the mouse

     to have the mouse coords translate to the same canvas pos (zooming into the mouse)
     requires that 
     oldOffsetX + oldzoom * mousecoordsX = newOffsetX + newZoom * mousecoordsX
     oldOffsetX + oldzoom * mouscoordsX - newzoom * mousecoordsX = newOffsetX
     newOffsetX = oldOffsetX + mouseCoordsX * (oldzoom - newzoom)

     for the y axis, the sign in the brackets needs to be inverted
    */

    let oldOffset = wg.dims.offset;
    let newOffset = [
        oldOffset[0] + mouseCoords[0] * (oldZoom - zoom),
        oldOffset[1] + mouseCoords[1] * (zoom - oldZoom)
    ];


    refreshDims(zoom, newOffset);
    wg.redraw();
});







/**
 * Util function for creating new dimensions from current window and graph state
 * this is the old way of doing it, which would re-center the whole graph, and calling it too often would fuck up the user experience
 * basically, this should only be called when the user clicks a 're-center' button in one of the canvas sidebars
 * 
 * @returns {Dims} new dims obj
 */
function resizeAndCenterGraph() {
    let pixelsizes = resizeCanvas();
    let minpxL = [];
    let maxpxL = [];
    if (s.mobileScreen) {
        // on narrow screens we leave space for toolbars on the top and botom
        minpxL = [0,  0.1 * pixelsizes[1]];
        maxpxL = [pixelsizes[0], 0.9 * pixelsizes[1]];
    } else {
        // on wide screens we leave space for toolbars on the sides
        minpxL = [ Math.round(0.1 * pixelsizes[0]),  Math.round(0.03*pixelsizes[1])];
        maxpxL = [ Math.round(0.9 * pixelsizes[0]),  Math.round(0.97*pixelsizes[1])];
    }
    let mincoordsL = getMinCoords();
    let maxcoordsL = getMaxCoords();


    let difpL = [maxpxL[0] - minpxL[0], maxpxL[1] - minpxL[1]]
    let difcL = [maxcoordsL[0] - mincoordsL[0], maxcoordsL[1] - mincoordsL[1]];
    let avgcL = [(mincoordsL[0] + maxcoordsL[0]) / 2, (mincoordsL[1] + maxcoordsL[1]) / 2]


    let newZoom = Math.round(Math.min(difpL[0] / difcL[0], difpL[1] / difcL[1]));
    zoom = newZoom;

    let newOffset =  [(pixelsizes[0] / 2) - (newZoom * avgcL[0]), (pixelsizes[1] / 2) + newZoom * avgcL[1]]; 

    let r = new Dims(pixelsizes[0], pixelsizes[1], newZoom, newOffset);

    // log outs:
    {
        // console.log(avgcL);
        // console.log(newZoom);
        // console.log(pixelsizes);
        // console.log(newOffset);
        // console.log(pixelsizes);
        // console.log(minpxL);
        // console.log(maxpxL);
        // console.log(difpL);
        // console.log("minc, maxc");
        // console.log(mincoordsL);
        // console.log(maxcoordsL);
        // console.log("difc, rat");
        // console.log(difcL);
        // console.log(ratioL);
        // console.log("actdifcL:");
        // console.log(actdifcL);
        // console.log(r);
    }

    return r;
} 





function resizeCanvcasModal() {
    if (!wg || !wg.dims) {
        console.log("ResizeCanvasModal called but now wg or dims");
        return;
    }
    
    let newDims = resizeAndCenterGraph();
    wg.dims = newDims;
    wg.redraw();
    
}


