


function drawEdge(e) {



    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#222222"
    ctx.fillStyle = "#222222"
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;
}


function drawHighlightedEdge(e) {
    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);

    ctx.fillStyle = "limegreen";
    ctx.strokeStyle = "limegreen";
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
}

function drawSelectedEdge(e) {
    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);

    ctx.fillStyle = "deepskyblue";
    ctx.strokeStyle = "deepskyblue";
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.stroke();
    ctx.closePath();
    
    ctx.lineWidth = 1;
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
}


// Simple solid black circle
function drawVx(v) {



    let c = wg.dims.toCanvas(v);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;


    ctx.beginPath();
    ctx.fillStyle = "#fefefe";
    ctx.arc(c[0], c[1], 7, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();


    ctx.beginPath();
    ctx.arc(c[0], c[1], 9, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black"; 
}


function drawSelectedVx(v) {

    let c = wg.dims.toCanvas(v);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.fillStyle = "#e1e1e1";
    ctx.arc(c[0], c[1], 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();


    ctx.beginPath();
    ctx.arc(c[0], c[1], 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black"; 

    //todo get better coords for text based on pixel color? Or mabe use something like the pop-up system?
    // ctx.fillText(`Selected vertex: ${i} (${v[0]}, ${v[1]})`, 0.5 * this.dims.minpx[0], 0.5 * this.dims.minpx[1]);


}

function drawHighlighedVx(v) {

    let c = wg.dims.toCanvas(v);
    ctx.strokeStyle = "limegreen";
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.fillStyle = "#e1e1e1";
    ctx.arc(c[0], c[1], 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();


    ctx.beginPath();
    ctx.arc(c[0], c[1], 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black"; 


    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
}








const customMenu = document.getElementById("custom-menu");

let drawEdgeBtn = document.getElementById('draw-edge-contextmenu');
let addVertexBtn = document.getElementById('add-vertex-contextmenu');
let addVertexAndDrawEdgeBtn = document.getElementById('add-vertex-draw-edge-contextmenu');
let removeVertexBtn = document.getElementById('remove-vertex-contextmenu');
let removeEdgeToHereBtn = document.getElementById('remove-edge-to-here-contextmenu');
let removeEdgeBtn = document.getElementById('remove-edge-contextmenu');

function resetContextMenuButtonsVisibility() {
    drawEdgeBtn.style.display = 'block';
    addVertexBtn.style.display = 'block';
    addVertexAndDrawEdgeBtn.style.display = 'block';
    removeVertexBtn.style.display = 'block';
    removeEdgeBtn.style.display = 'block';
    removeEdgeToHereBtn.style.display = 'block';
}

function showCustomMenu(x, y) {
    customMenu.style.top = y + 'px';
    customMenu.style.left = x + 'px';
    customMenu.style.display = 'block';
}

// Function to hide the custom menu.
function hideCustomMenu() {
    customMenu.style.display = 'none';
    resetContextMenuButtonsVisibility();
}

// Listen for the contextmenu event on the whole document
document.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent the default context menu.

    // Right-clicking outside the canvas shouldn't give you a context menu
    if (e.target !== canvas) {  
        if (customMenu.style.display === 'block') {
            hideCustomMenu();
        }
        return;
    } 

    resetContextMenuButtonsVisibility();

    if (highlightedEdge === -1) {
        removeEdgeBtn.style.display = 'none';
        console.log("No edge - no remove edge");
    }

    if (highlightedVx === -1) {
        // We are not actively hovering on an item, meaning that we cannot remove it or draw to it since it doesn't exist
        removeVertexBtn.style.display = 'none';
        drawEdgeBtn.style.display = 'none';

        console.log("No vx - no remove vx or drawedge");
    } else {
        // We are actively hovering on an item, cannot add one here since it already exists
        addVertexAndDrawEdgeBtn.style.display = 'none';
        addVertexBtn.style.display = 'none';

        console.log("Yes vx - no add to empty space");
    }

    if (selectedVx === -1 ) {
        // Nothing is currently selected, meaning we have nowhere to draw from
        drawEdgeBtn.style.display = 'none';
        addVertexAndDrawEdgeBtn.style.display = 'none';
        removeEdgeToHereBtn.style.display = 'none';
        console.log("No selected - no drawing or removing edges");  
    } else {
        let t = wg.state.unf[selectedVx];
        if (t["eiv"].includes(highlightedVx)) {
            drawEdgeBtn.style.display = 'none';
        } else {
            removeEdgeToHereBtn.style.display = 'none';
        }
    }

    
   
    showCustomMenu(e.pageX, e.pageY);


});



// Hide the menu on any left-click (or any click) outside the menu.
document.addEventListener('click', (e) => {
    if (customMenu.style.display === 'block') {
        hideCustomMenu();
    }
});

document.getElementById('draw-edge-contextmenu').addEventListener('click', () => {
    console.log("Drawing edge here");
    let a = [customMenu.style.left, customMenu.style.top];
    console.log(a);
    console.log(wg.dims.toCoords(a));
    addEdge([1, 2]);
    hideCustomMenu();
});

document.getElementById('remove-edge-contextmenu').addEventListener('click', () => {
    console.log("Drawing edge here");
    let a = [customMenu.style.left, customMenu.style.top];
    console.log(a);
    console.log(wg.dims.toCoords(a));
    removeEdge([1, 2]);
    hideCustomMenu();
});


document.getElementById('remove-edge-to-here-contextmenu').addEventListener('click', () => {
    console.log("Drawing edge here");
    let a = [customMenu.style.left, customMenu.style.top];
    console.log(a);
    console.log(wg.dims.toCoords(a));
    removeEdge([1, 2]);
    hideCustomMenu();
});


document.getElementById('add-vertex-contextmenu').addEventListener('click', () => {

    let a = [customMenu.style.left, customMenu.style.top]
        //now get rid of the "px" at the end
        .map(e => e.substring(0, e.length-2))
        .map(e => Number(e));
    addVx(wg.dims.toCoords(a).map(Math.round));
    hideCustomMenu();
});

document.getElementById('add-vertex-draw-edge-contextmenu').addEventListener('click', () => {
    if (selectedVx === -1){
        console.log("Add Vx and draw edge was clicked but no vertex is selected");
        return;
    }

    let canvasPos = [customMenu.style.left, customMenu.style.top]
        //now get rid of the "px" at the end
        .map(e => e.substring(0, e.length-2))
        .map(e => Number(e));

    let coords = wg.dims.toCoords(canvasPos).map(Math.round);
    addVx(coords);
    console.log(`${selectedVx}, ${wg.state.vertices.length}, ${coords}, ${wg.state.vertices[wg.state.vertices.length - 1]}`)

    addEdge([selectedVx, wg.state.vertices.length - 1]);


    hideCustomMenu();
});

document.getElementById('remove-vertex-contextmenu').addEventListener('click', () => {
    console.log('Removing vertex');
    if (selectedVx !== -1) {
        console.log("kaljsdfh");
    }
    hideCustomMenu();  
});





















// Global variables for dragging
let isDraggingCanvas = false;
let isDraggingVertex = false;
let draggedVertexIndex = -1;
let originalState = null;
let vertexDragOffset = { x: 0, y: 0 };
let dragStart = { x: 0, y: 0 };


canvas.addEventListener('mousedown', (event) => {
    // Use left button only.
    if (event.button !== 0) {
        return;
    }
    let mousePos = getMousePos(event);

    // Check if the click is near any vertex.
    for (let i = 0; i < window.Grapher.state.vertices.length; i++) {
        if (isNearVertex(mousePos, wg.state.vertices[i])) {
            let canvasPos = wg.dims.toCanvas(wg.state.vertices[i]);
            isDraggingVertex = true;
            draggedVertexIndex = i;
            // Record the offset from the vertex center to the mouse position
            vertexDragOffset.x = canvasPos[0] - mousePos[0];
            vertexDragOffset.y = canvasPos[1] - mousePos[1];
            originalState = wg.state.copyConstructor();
            return;
        }
    }
  
    // If no vertex was clicked, start dragging the canvas.
    isDraggingCanvas = true;
    // Record the starting offset relative to the mouse position.
    dragStart.x = mousePos[0] - wg.dims.offset[0];
    dragStart.y = mousePos[1] - wg.dims.offset[1];
    
});

// Only dragging is handled in this listener:
canvas.addEventListener('mousemove', (event) => {
    let dims = window.Grapher.dims;
    let mousePos = getMousePos(event);
    if (isDraggingCanvas) {
        // Update the camera offset based on mouse movement.
        dims.offset[0] = mousePos[0] - dragStart.x;
        dims.offset[1] = mousePos[1] - dragStart.y;
        wg.redraw();
    } else if (isDraggingVertex && draggedVertexIndex !== -1) {
        // Adjust mouse position by the vertex drag offset.
        let adjustedX = mousePos[0] + vertexDragOffset.x;
        let adjustedY = mousePos[1] + vertexDragOffset.y;
        // Convert canvas coordinates to graph coordinates.
        let newGraphCoords = wg.dims.toCoords([adjustedX, adjustedY]);
        // Update the vertex in the state.
        window.Grapher.state.vertices[draggedVertexIndex] = newGraphCoords;
        window.Grapher.state.updateAdjList();
        updateFileView();   
    }
});

canvas.addEventListener('mouseup', (event) => {
    if (event.button !== 0) {
        return;
    }
    if (isDraggingVertex && draggedVertexIndex !== -1 && originalState !== null) {
        let currentCoords = wg.state.vertices[draggedVertexIndex];
        let snappedCoords = currentCoords.map(Math.round);
        let originalCoords = originalState.vertices[draggedVertexIndex];
        wg.state.vertices[draggedVertexIndex] = snappedCoords;
        wg.state.updateAdjList();
        updateFileView();

        // Only update if coordinates changed
        if (snappedCoords[0] !== originalCoords[0] || snappedCoords[1] !== originalCoords[1]) {
            console.log(`snapping ${currentCoords} to ${snappedCoords} and it started from ${originalCoords}`);
            
            addToHistory(wg.state.copyConstructor(), MOVE_VERTEX, originalCoords, snappedCoords);
            stateUpdated();
        }

    }

    isDraggingCanvas = false;
    isDraggingVertex = false;
    draggedVertexIndex = -1;
    originalState = null;


    // call handlHover one more time here so that we get the correct 'reset' of the cursor
    handleHover(event);

});









// Non-dragging logic for correct drawing is handled here:
function handleHover(event) {
    if (!window.Grapher?.state?.vertices) {
        console.log("no state while handling hover");
        return;
    }

    mousePos = getMousePos(event);

    let found = false;

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
        if (isDraggingCanvas) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'default';
        }
    }


    window.Grapher.redraw();




    // console.log("drawing coordintate");
    if ((!found && !isDraggingCanvas) || (isDraggingVertex && draggedVertexIndex !== -1)) {
        drawHihglightedCoordinate(mousePos);
    }

}




 
function handleClick(event) {
    if (!window.Grapher?.state?.vertices) {
        return;
    }

    const mousePos = getMousePos(event);

    console.log("onclick handler called at " + mousePos.x + " and " + mousePos.y);
    
    let i = 0;

    if (window.Grapher.state.mode == NORMAL) {
        // Check each object for a click
        for (let obj of window.Grapher.state.vertices) {
            console.log(obj);
            // for now doing nothing here
            if (isNearVertex(mousePos, obj)) {
                selectedVx = i;
                console.log(`Clicked on object ${obj}`);
                window.Grapher.redraw();
                return; // Stop checking further objects
            }
            i += 1;
        }
        selectedVx = -1;
    } else if (window.Grapher.state.mode == MOVE) {
        if (selectedVx === -1 ) {

        } else {
            canvas.style.cursor = "auto";
        }
        

    } else if (window.Grapher.state.mode == ADD) {

    }
}




let closestGraphCoord = null;


function drawHihglightedCoordinate(mousePos) {

    
    let graphCoords = window.Grapher.dims.toCoords(mousePos);
    closestGraphCoord = [
        Math.round(graphCoords[0]),
        Math.round(graphCoords[1])
    ];

    let canvasCoord = wg.dims.toCanvas(closestGraphCoord);
    
    // Adjust the size of the green cross here: 
    let crossSize = (wg.dims.zoom / 3)  * Math.SQRT2;
    
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

}



function drawBackgroundCoordinateGrid() {
    let dims = window.Grapher.dims;
    let canvasWidth = dims.canvasWidth;
    let canvasHeight = dims.canvasHeight;
    
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






document.addEventListener('keydown', function (event) {
    let tagName = event.target.tagName.toLowerCase();
    if (tagName === 'form' || tagName === 'input' || tagName === 'textarea' || event.target.isContentEditable) {
        return;
    }


    // Detect undo: Ctrl+Z or Cmd+Z or u or shift+U
    if ((event.key === 'u'  && !event.shiftKey) || (event.key === 'U' && EventTarget.shiftKey)
             || ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey)) {
        undo();
        console.log("undo done");
        return;
    }

    // Detect redo: Ctrl+Shift+Z or Cmd+Shift+Z or shift+u or U
    else if (( event.shiftKey && (event.key === 'u' || ((event.ctrlKey || event.metaKey) && event.key === 'z'))) 
            || (event.key === 'U' && !event.shiftKey)) {  
        redo();  
        console.log("redo done");
        return;
    } 

    //if no state, the rest doesn't make sense. At least undo and redo can recover state.
    if (!window.Grapher.state) {
        return;
    }
    
    if (event.key === 'm') {
        console.log("state.mode is now move");
        window.Grapher.state.mode = MOVE;
    } else if (event.key === 'n' || event.key === 'Escape' || event.key === 'Esc') {
        console.log("escape or n clicked, now normal mode")
        if (window.Grapher.state.mode === NORMAL) {
            selectedVx = -1;
        } else {
            window.Grapher.state.mode = NORMAL;
        }
    } else if (event.key === 'e' || event.key === 'j') {
        
        window.Grapher.state.mode = EDGE;
    } else if (event.key === 'Delete' || event.key == 'Backspace') {
        //delete
        deleteItem();
    }
})


















const moveIcon = new Image();
moveIcon.src = "assets/icons/move.svg";



canvas.addEventListener('mousemove', handleHover);


// canvas.addEventListener('contextmenu', rightclick)
// canvas.addEventListener('click', handleClick);


