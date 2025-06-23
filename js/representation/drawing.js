
function drawEdge(e) {

    let color = settingsManager.get(EDGE_COLOR);

    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    let thickness = settingsManager.get(EDGE_THICKNESS);
    ctx.beginPath();
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color ? color : '#333333';
    ctx.fillStyle = color ? color : '#333333';
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;

    resetColor();
}


function drawFlipInsertEdgeA(e) {
    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    let thickness = settingsManager.get(EDGE_THICKNESS);
    ctx.fillStyle = 'darkgreen';
    ctx.strokeStyle = 'darkgreen';
    ctx.beginPath();
    ctx.lineWidth = Math.round(thickness * 1.33);
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;

    resetColor();
}



function drawFlipInsertEdgeB(e) {
    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    let thickness = settingsManager.get(EDGE_THICKNESS);
    ctx.fillStyle = 'mediumseagreen';
    ctx.strokeStyle = 'mediumseagreen';
    ctx.beginPath();
    ctx.lineWidth =  Math.round(thickness * 1.33);
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;

    resetColor();
}


function drawHighlightedEdge(e) {
    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    let thickness = settingsManager.get(EDGE_THICKNESS);
    let color = settingsManager.get(HIGHTLIGHT_COLOR);
    ctx.fillStyle = color ? color : 'lime';
    ctx.strokeStyle = color ? color : 'lime';
    ctx.beginPath();
    ctx.lineWidth =  Math.round(thickness * 1.33);
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;

    resetColor();
}

function drawSelectedEdge(e) {
    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    let thickness = settingsManager.get(EDGE_THICKNESS);
    let color = settingsManager.get(SELECT_COLOR);
    ctx.fillStyle = color ? color : 'blue';
    ctx.strokeStyle = color ? color : 'blue';
    ctx.beginPath();
    ctx.lineWidth =  Math.round(thickness * 1.66);
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;
    resetColor()
}


function drawEdgeForRemoval(e) {
    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    let thickness = settingsManager.get(EDGE_THICKNESS);
    let color = settingsManager.get(REMOVE_COLOR);
    ctx.fillStyle = color ? color : 'crimson';
    ctx.strokeStyle = color ? color : 'crimson';
    ctx.beginPath();
    ctx.lineWidth =  Math.round(thickness * 1.66);
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;
    resetColor()
}

function drawEdgeWithWarning(e) {
    ctx.save();
    
    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    let thickness = settingsManager.get(EDGE_THICKNESS);

    ctx.strokeStyle = 'black';
    ctx.setLineDash([10, 25]); // 5px dash, 5px gap - hardcoded for now
    ctx.lineWidth = Math.round(thickness * 2);

    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
}


// Simple solid black circle
function drawVx(v) {



    let color = settingsManager.get(VERTEX_COLOR);
    let size = settingsManager.get(VERTEX_SIZE);
    let c = wg.dims.toCanvas(v);
    ctx.strokeStyle = color ? color : 'black';
    ctx.lineWidth = 0.4 * size;


    ctx.beginPath();
    ctx.fillStyle = "#fefefe";
    ctx.arc(c[0], c[1], Math.round(0.8 * size), 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();


    ctx.beginPath();
    ctx.arc(c[0], c[1], size, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    
    resetColor();
}


function drawSelectedVx(v) {

    let c = wg.dims.toCanvas(v);
    let color = settingsManager.get(SELECT_COLOR);
    let size = settingsManager.get(VERTEX_SIZE);
    ctx.strokeStyle = color ? color : 'blue';
    ctx.lineWidth = 0.6 * size;

    ctx.beginPath();
    ctx.fillStyle = "#e1e1e1";
    ctx.arc(c[0], c[1], Math.round(0.8 * size), 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();


    ctx.beginPath();
    ctx.arc(c[0], c[1], size, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    
    resetColor();


}

function drawHighlighedVx(v) {

    let c = wg.dims.toCanvas(v);
    let color = settingsManager.get(HIGHTLIGHT_COLOR);
    let size = settingsManager.get(VERTEX_SIZE);
    ctx.strokeStyle = color ? color : 'lime';
    ctx.lineWidth = 0.6 * size;

    ctx.beginPath();
    ctx.fillStyle = "#e1e1e1";
    ctx.arc(c[0], c[1], Math.round(0.8 * size), 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();


    ctx.beginPath();
    ctx.arc(c[0], c[1], size, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    
    resetColor();
}


/**
 * 
 * @param {[Number, Number]} pt point in graph cordinates (not canvas);
 */
function drawIntersectionWarningCircle(pt) {
    let c = wg.dims.toCanvas(pt);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(c[0], c[1], 15, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    resetColor();
}


function resetColor() {
    let regularColor =  settingsManager.get(REGULAR_COLOR);
    ctx.fillStyle = regularColor;
    ctx.strokeStyle = regularColor; 
}


 /** @type {[Number, Number]} */
let closestGraphCoord = null;


function drawHihglightedCoordinate(mousePos) {

    let canvasCoord = wg.dims.toCanvas(closestGraphCoord);
    
    // Adjust the size of the green cross here: 
    let crossSize = (wg.dims.zoom / 4)  * Math.SQRT2;
    
    // console.log(mousePos);
    // console.log(`trying to draw cross mouse graph coords: mousePos: ${mousePos} ${graphCoords}, closest: ${closestGraphCoord}, canvasC: ${canvasCoord}`);
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;

    // Draw diagonal cross
    ctx.beginPath();
    ctx.moveTo(canvasCoord[0] - crossSize, canvasCoord[1] - crossSize);
    ctx.lineTo(canvasCoord[0] + crossSize, canvasCoord[1] + crossSize);
    ctx.moveTo(canvasCoord[0] - crossSize, canvasCoord[1] + crossSize);
    ctx.lineTo(canvasCoord[0] + crossSize, canvasCoord[1] - crossSize);
    ctx.stroke();
    ctx.closePath();

    resetColor();
}



function drawBackgroundCoordinateGrid() {


    let dims = window.Grapher.dims;
    let canvasWidth = dims.canvasWidth;
    let canvasHeight = dims.canvasHeight;



    if (dims.zoom < 2) {
        return;
    }
    
    // Determine visible area in graph coordinates.
    // Note: with the inverted y-axis, the top of the canvas (0) has a higher y-value.
    let topLeftGraph = dims.toCoords([0, 0]); // high y-value
    let bottomRightGraph = dims.toCoords([canvasWidth, canvasHeight]); // low y-value

    // For x, we use the usual order.
    let startX = Math.floor(topLeftGraph[0]);
    let endX   = Math.ceil(bottomRightGraph[0]);

    // For y, the visible range goes from bottomRightGraph[1] (low) up to topLeftGraph[1] (high).
    let startY = Math.floor(bottomRightGraph[1]);
    let endY   = Math.ceil(topLeftGraph[1]);

    ctx.save();
    // grey with some opacity
    ctx.strokeStyle = "rgba(192, 192, 192, 0.5)";
    ctx.lineWidth = 1;

    // Draw vertical grid lines.
    for (let x = startX; x <= endX; x++) {
        // Convert graph coordinate (x,0) to canvas x.
        const canvasX = dims.toCanvas([x, 0])[0];
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, canvasHeight);
        ctx.stroke();
    }

    // Draw horizontal grid lines.
    for (let y = startY; y <= endY; y++) {
        // Convert graph coordinate (0,y) to canvas y.
        const canvasY = dims.toCanvas([0, y])[1];
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(canvasWidth, canvasY);
        ctx.stroke();
    }
    ctx.restore();

    resetColor();
}




function cooridinateMarkings() {
    let xmousemark = null;
    let ymousemark = null;

    wg = window.Grapher;

    if (selectedVx !== -1) {
        xmousemark = wg.state.vertices[selectedVx][0];
        ymousemark = wg.state.vertices[selectedVx][1];
    }

    if (xmousemark == null || ymousemark == null) {
        normalCoordinateMarkings();
    } else {
        selectedCoordinateMarkings([xmousemark, ymousemark]);
    }
}

function selectedCoordinateMarkings(selectedCoords) {
    
}




function normalCoordinateMarkings() {
    let dc = wg.dims.difc;

    let difp = [wg.dims.maxpx[0] - wg.dims.minpx[0], wg.dims.maxpx[1] - wg.dims.minpx[1]];

    let ratios = [difp[0] / dc[0], difp[1] / dc[1]];


    
    let xsteps = Math.ceil(40 / ratios[0]);

    // console.log(dc);
    // console.log(difp);
    // console.log(ratios);
    // console.log(xsteps);
    for (let i =  wg.dims.minc[0]; i <  wg.dims.maxc[0]; i += xsteps) {
        let pos = wg.dims.toCanvas([i, wg.dims.maxc[1]]);
        // shift y axis down
        pos[1] = pos[1] + VERTICAL_OFFSET_FOR_MARKINGS;     

    }
    
    
    let ysteps = Math.ceil(40 / ratios[1]);


    for (let i = wg.dims.minc[1]; i < wg.dims.maxc[1]; i += ysteps) {
        let pos = wg.dims.toCanvas([i, wg.dims.maxc[1]]);
        // shift x axis to the right
        pos[0] = pos[0] + HORIZONTAL_OFFSET_FOR_MARKINGS;
    }

}



const VERTICAL_OFFSET_FOR_MARKINGS = 15;
const HORIZONTAL_OFFSET_FOR_MARKINGS = 15;


