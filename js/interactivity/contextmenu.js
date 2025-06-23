
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

function getNumberOfVisibleContextMenuButtons() {
    let visibleButtons = 0;
    if (drawEdgeBtn.style.display === 'block') visibleButtons++;
    if (addVertexBtn.style.display === 'block') visibleButtons++;
    if (addVertexAndDrawEdgeBtn.style.display === 'block') visibleButtons++;
    if (removeVertexBtn.style.display === 'block') visibleButtons++;
    if (removeEdgeBtn.style.display === 'block') visibleButtons++;
    if (removeEdgeToHereBtn.style.display === 'block') visibleButtons++;
    return visibleButtons;
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

    if (mode !== EDIT_MODE) {
        return;
    }

    if (highlightedEdge === -1) {
        removeEdgeBtn.style.display = 'none';
        console.log("No edge - no remove edge");
    }

    

    let mousePos = getMousePos(e);
    let coords = wg.dims.toCoords(mousePos).map(Math.round);
    /**
     * @param {[Number, Number]} c coords 
     * @returns {Boolean} true if we are hovering on a vertex, false if we aren't
     */
    let hoverResult = ((c) => {
        for (const vertex of wg.state.vertices) {
            if (pequals(c, vertex)) {
                console.log(`    Hovering on vertex at coords: ${c}`);
                return true;
            }
        }
        console.log("    Not hovering on any vertex");
        return false;
    })(coords);



    if (highlightedVx === -1) {
        // We are not actively hovering on an item, meaning that we cannot remove it or draw to it since it doesn't exist
        removeVertexBtn.style.display = 'none';
        drawEdgeBtn.style.display = 'none';

        // but we could still be 'pointing' towards a coordinate that has a vertex, so:
        if (hoverResult) {
            console.log("  HERE MOTHERFUCKER");
            addVertexAndDrawEdgeBtn.style.display = 'none';
            addVertexBtn.style.display = 'none';
        }

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
            // we have selected, and there isn't an edge between selected and highlighted.
            removeEdgeToHereBtn.style.display = 'none';
        }
        if (highlightedVx === selectedVx) {
            drawEdgeBtn.style.display = 'none';
            removeEdgeToHereBtn.style.display = 'none';
        }
    }

    if (drawEdgeBtn.style.display === 'block' && intersectsAny(wg.state.vertices[selectedVx], wg.state.vertices[highlightedVx])) {
        drawEdgeBtn.style.display = 'none';
    }

    if (addVertexAndDrawEdgeBtn.style.display === 'block' && intersectsAny(wg.state.vertices[selectedVx], closestGraphCoord)) {
        addVertexAndDrawEdgeBtn.style.display = 'none';
    }


    if (getNumberOfVisibleContextMenuButtons() === 0) {
        // If no buttons are visible, hide the menu
        hideCustomMenu();
        return;
    }

    // i feel like this should all be doable much much cleaner but i really dk how to do that atm
   
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

    if (highlightedVx === -1 || selectedVx === -1) {
        console.log("Draw edge clicked but selected or highlighted edge is missing");
        return;
    }


    addEdge([highlightedVx, selectedVx]);
    hideCustomMenu();
});

document.getElementById('remove-edge-contextmenu').addEventListener('click', () => {
    console.log("Drawing edge here");
    let a = [customMenu.style.left, customMenu.style.top];
    if (highlightedEdge === -1) {
        console.log("Draw edge clicked but highlighted edge is missing");
        return;
    }

    const oldEdge = highlightedEdge;
    highlightedEdge = -1;
    removeEdge(wg.state.edges[oldEdge]);
    if (selectedEdge === oldEdge) {
        selectedEdge = -1;
    }

    hideCustomMenu();
});


document.getElementById('remove-edge-to-here-contextmenu').addEventListener('click', () => {
    console.log("Drawing edge here");
    
    if (highlightedVx === -1 || selectedVx === -1) {
        console.log("Draw edge clicked but selected or highlighted vertex is missing");
        return;
    }

    if (!wg.state.unf[highlightedVx].eiv.includes(selectedVx)) {
        console.log("Remove edge to here button clicked in context menu but there isn't an edge between selected and highlighted");
        return;
    }

    removeEdge([selectedVx, highlightedVx]);

    hideCustomMenu();
});


document.getElementById('add-vertex-contextmenu').addEventListener('click', () => {

    let a = [customMenu.style.left, customMenu.style.top]
        //now get rid of the "px" at the end
        .map(e => e.substring(0, e.length-2))
        .map(e => Number(e));
    selectedVx = wg.state.vertices.length;
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

    let oldSelected = selectedVx;
    selectedVx = wg.state.vertices.length - 1;
    addEdge([oldSelected, selectedVx]);

    console.log(`${selectedVx}, ${wg.state.vertices.length - 1}`);



    hideCustomMenu();
});

document.getElementById('remove-vertex-contextmenu').addEventListener('click', () => {
    console.log('Removing vertex');
    if (highlightedVx === -1) {
        console.log("Remove Vx was clicked but no vertex is highlighted");
        return;
    }

    if (selectedVx === highlightedVx) {
        selectedVx = -1;
    }

    removeVx(highlightedVx);

    highlightedVx = -1;


    hideCustomMenu();  
});


