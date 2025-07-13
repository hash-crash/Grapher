/**
 * @fileoverview
 * This file houses the State class, which is used to represent a graph. 
 * 
 * It has
 * - an array of vertices, each being a pair of integer coordinates,
 * - an array of edges, each being a pair of indices in the vertices array
 * - an adjacency list, each item being an object with v: [x, y] being the vertex,
 *       and eiv: [a, b, c] being indices of other vertices that this one is connected to.
 * 
 * Also, here are all the functions which modify the state of the displayed graph,
 *  like adding, editing, removing edges/vertices as well as the reconfiguration flips.
 */
class State {

    constructor(edgesB, verticesB, complete=false, unfB) {
        this.vertices = verticesB;

        if (complete) {
            this.edges = edgesB;
            this.unf = unfB;
        } else {

            // complete should not be set if passing in 'user-visible' i.e. 1-indexed edges
            this.edges = edgesB.map((v) => [v[0] - 1, v[1] - 1]); 

            
            let i = 0;
            this.unf = this.vertices.map((v) => {
                let eiv = this.edges.map((e) => {
                    if (e[0] == i) {
                        return e[1];
                    } else if (e[1] == i) {
                        return e[0];
                    } else {
                        return -1;
                    }
                }).filter((n) => n != -1);
                i+=1;
                return {v, eiv}
            });
        }

    }

    // Copy constructor to create a deep copy
    copyConstructor() {
        const edgesCopy = this.edges.map(element => {
            return [element[0], element[1]];
        }); // Deep copy edges array
        const verticesCopy = this.vertices.map(element => {
            return [element[0], element[1]];
        });
        let unfcopy = this.unf.map(item => ({
            v: item.v,
            eiv: item.eiv.map((e) => e), // Deep copy eiv array
        }));

        return new State(edgesCopy, verticesCopy, true /* complete flag */,  unfcopy);
    }

    updateAdjList() {
        let i = 0;
        let tempmap = this.vertices.map((v) => {
            let eiv = this.edges.map((e) => {
                if (e[0] == i) {
                    return e[1];
                } else if (e[1] == i) {
                    return e[0];
                } else {
                    return -1;
                }
            }).filter((n) => n != -1);
            i+=1;
            return {v, eiv}
        });
        this.unf = tempmap;
    }

    equals(that) {
        if (!that.edges || !that.vertices ||
             this.edges.length !== that.edges.length ||
             this.vertices.length !== that.vertices.length) {
            return false;
        }

        for (let index = 0; index < this.vertices.length; index++) {
            let element = this.vertices[index];
            let e2 = that.vertices[index];
            if (element[0] !== e2[0] || element[1] !== e2[1]) {
                return false;
            }
        }

        for (let index = 0; index < this.edges.length; index++) {
            let element = this.edges[index];
            let e2 =  that.edges[index];
            if (element[0] !== e2[0] || element[1] !== e2[1]) {
                return false;
            }
        }

        // this will do the trick for now. 🙉🙉
        return true;
    }


    saveState() {
        if (settingsManager.isFileProtocol()) {
            console.warn("Not saving state to LocalStorage because the app is running in file:// protocol");
            return;
        }

        const stateData = {
            vertices: wg.state.vertices,
            edges: wg.state.edges,
            unf: wg.state.unf
        };
        try {
            localStorage.setItem('wgState', JSON.stringify(stateData));
        } catch (e) {
            console.error('Error saving state:', e);
            toast("Failed to save the graph to LocalStorage", true);
        }
    }

}

function restoreFromLocalStorage() {
    const savedData = localStorage.getItem('wgState');
    if (!wg) {
        wg = window.Grapher;
    }

    if (!savedData) {
        wg.state = EMPTY_STATE;
        wg.redraw();
        return;
    }


    if (!confirm('Found previous state. Restore?')) {
        localStorage.removeItem('wgState');
        wg.state = EMPTY_STATE;
        wg.redraw();
        return;
    }



    try {
        const parsed = JSON.parse(savedData);
        
        // Reconstruct using complete=true constructor
        wg.state = new State(
            parsed.edges,
            parsed.vertices,
            true,       // complete flag
            parsed.unf
        );

        stateUpdated();
    } catch (e) {
        console.error('Restoration failed:', e);
        localStorage.removeItem('wgState');
    }
    
}


function stateUpdated(saveToLocalStorage=true) {

    if(!isValidGraphForMode()) {
        toast("Invalid graph for this mode.", true);
        triggerShake();
        poppedItem = window.stateHistory.pop();
    
        prevState = window.stateHistory[window.stateHistory.length - 1];
        wg.state = prevState.state.copyConstructor();
    }

    updateFileView();
    updateHistoryView();
    wg.state.updateAdjList();
    if (settingsManager.get(SHOW_COLINEAR_TRIPLES_TOGGLE)) {
        allColinearTriples = findAllColinearTriples();
    }
    wg.redraw();
    if (saveToLocalStorage) {
        wg.state.saveState();
    }
}

const EMPTY_STATE = new State([], []);


function explodeCoordinatesInState(factor) {
    wg.state.vertices.forEach((v) => {
        v[0] = v[0] * factor;
        v[1] = v[1] * factor;
    });
    wg.state.updateAdjList();

    addToHistory(wg.state.copyConstructor(), EXPLODE_COORDS, factor);
    stateUpdated();
}


function addVx(coords) {

    if (wg !== window.Grapher) {
        wg = window.Grapher;
    }

    if (wg.state === null) {
        console.log(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }

    if (!Array.isArray(coords) || typeof coords[0] !== "number" || typeof coords[1] !== "number") {
        console.log("ERROR, invalid arg passed into addVx");
        return;
    }


    for (vx of wg.state.vertices) {
        if (vx[0] === coords[0] && vx[1] === coords[1]) {
            toast(`Vertex already exists at ${coords[0]},${coords[1]}.`, true);
            return;
        }
    }


    
    wg.state.vertices.push(coords);
    wg.state.updateAdjList();

    addToHistory(wg.state.copyConstructor(), ADD_VERTEX, coords);
    stateUpdated();

}


function moveVertex(oldCoords, newCoords) {
    if (wg !== window.Grapher) {
        wg = window.Grapher;
    }

    if (!Array.isArray(oldCoords) || typeof oldCoords[0] !== "number" || typeof oldCoords[1] !== "number") {
        console.log("ERROR, invalid oldCoords arg passed into moveVertex");
        return false;
    }

    if (!Array.isArray(newCoords) || typeof newCoords[0] !== "number" || typeof newCoords[1] !== "number") {
        console.log("ERROR, invalid newCOords arg passed into moveVertex");
        return false;
    }


    for (let vx of wg.state.vertices) {
        if (vx[0] === newCoords[0] && vx[1] === newCoords[1]) {
            toast("There already exists a vertex there.", true);
            return false;
        }
    }


    for (let i = 0; i < wg.state.vertices.length; i++) {
        let vx = wg.state.vertices[i];
        if (vx[0] !== oldCoords[0]  || vx[1] !== oldCoords[1]) {
            continue;
        }

        vx[0] = newCoords[0];
        vx[1] = newCoords[1];
        wg.state.updateAdjList();

        addToHistory(wg.state.copyConstructor(), MOVE_VERTEX, oldCoords, newCoords);
        stateUpdated();

        return true;
    }

    return false;
}












/**
 * 
 * @param {[Number, Number]} indices in the state.vertices list
 * @param {boolean} userPresentation if set to true, the provided indices should be 
 *                              reduced by 1 since user presentation is 1-based
 *                              and software representation is 0-based
 * @returns {boolean} true on success, false on failure
 */
function addEdge(indices, userPresentation=false) {
    if (wg !== window.Grapher) {
        wg = window.Grapher;
    }

    if (!Array.isArray(indices) || typeof indices[0] !== "number" || typeof indices[1] !== "number") {
        console.log("ERROR, invalid arg passed into addEdge");
        return false;
    }

    if (userPresentation) {
        indices[0] = indices[0] - 1;
        indices[1] = indices[1] - 1;
    }

    // bounds checking:
    if (!checkEdgeBounds(indices)) {
        return false;
    }


    wg.state.edges.push(indices);
    wg.state.updateAdjList();

    addToHistory(wg.state.copyConstructor(), ADD_EDGE, indices.map((e) => e + 1));
    stateUpdated();

    return true;

}

function editEdge(orignalEdge, indices) {
    if (wg !== window.Grapher) {
        wg = window.Grapher;
    }

    if (!Array.isArray(indices) || typeof indices[0] !== "number" || typeof indices[1] !== "number") {
        console.log("ERROR, invalid arg passed into addEdge");
        return false;
    }

    // bounds checking:
    if (!checkEdgeBounds(indices)) {
        return false;
    }



    for (let i = 0; i < wg.state.edges.length; i++) {
        let edge = wg.state.edges[i];
        if ((edge[0] === orignalEdge[0] && edge[1] === orignalEdge[1]) ||
            (edge[0] === orignalEdge[1] && edge[1] === orignalEdge[0])) {
            // this is the one

            wg.state.edges[i][0] = indices[0];
            wg.state.edges[i][1] = indices[1];
            wg.state.updateAdjList();

            addToHistory(wg.state.copyConstructor(), MODIFY_EDGE, orignalEdge, indices);
            stateUpdated();

            return true;
        }
    }
    return false;

}

function checkEdgeBounds(indices) {

    if (!wg || !wg.state) {
        return false;
    }

    if (indices[0] === indices[1]) {
        console.log("Edge needs to have different start and end indices");
        toast("Edge needs to connect different vertices", true);
        return false;
    }
    if (indices[0] < 0 || indices[1] < 0) {
        console.log("ERROR, index of Vx starts from 1 in addEdge");
        toast("Vertices start from 1", true);
        return false;
    }
    if (indices[0] >= wg.state.vertices.length) {
        console.log("The desired start vertex is out of bounds");
        toast("The desired start vertex is out of bounds", true);
        return false;
    } 
    if (indices[1] >= wg.state.vertices.length) {
        console.log("The desired end vertex is out of bounds");
        toast("The desired end vertex is out of bounds", true);
        return false;
    }
    for (edge of wg.state.edges) {
        if ((edge[0] === indices[0] && edge[1] === indices[1]) ||
            (edge[0] === indices[1] && edge[1] === indices[0])) {
            toast("There already exists an edge connecting those 2");
            return false;
        }
    }
    return true;
}


/**
 * 
 * @param {[Number, Number]} edge 
 */
function removeEdge(edge) {
    console.log("removeedge called for" + edge);

    for (let index = 0; index < wg.state.edges.length; index++) {
        let element = wg.state.edges[index];
        if (element[0] === edge[0] && element[1] === edge[1]
            || element[0] === edge[1] && element[1] === edge[0]) {

            wg.state.edges.splice(index, 1);
            wg.state.updateAdjList();

            addToHistory(wg.state.copyConstructor(), REMOVE_EDGE, edge.map((i) => i+1));
            stateUpdated();

            return;
        }
    }
    console.log(`Could not find edge ${edge} to delete :(`);
    toast(`Could not find edge between ${edge[0] + 1} and ${edge[1] + 1}`);
}


/**
 * Remove the vertex and all the edges that used to connect to it.
 * Also, update all edges pointing to vertices that came after this one,
 * since the indices in all of them need to be decremented as this vertex leaving means that 
 * all of them drop by 1.
 * 
 * @param {Number} vxIndex 0-based in wg.state.vertices array
 */
function removeVx(vxIndex) {
    if (vxIndex >= wg.state.vertices.length) {
        const error = `Cannot delete vertex ${vxIndex + 1} because there aren't that many in total`;
        console.error(error);
        toast(error, true);
        return;
    }

    let vertexCoords = wg.state.vertices[vxIndex];

    console.log(`Deleting ${vertexCoords} which is at index ${vxIndex} UR ${vxIndex + 1}`);
    for(let i = 0; i < wg.state.edges.length; i++) {
        let e = wg.state.edges[i];
        if (e[0] == vxIndex || e[1] == vxIndex) {
            console.log(`removing edge ${e[0]}, ${e[1]} which is UR ${e[0] + 1}, ${e[1] + 1}`)
            removeEdge(e);
            i--;
        }
    }

    wg.state.vertices.splice(vxIndex, 1);

    wg.state.edges.forEach((e) => {

        if (e[0] > vxIndex) {
            e[0] -= 1;
        }
        if (e[1] > vxIndex) {
            e[1] -= 1;
        }
    });
    wg.state.updateAdjList();


    addToHistory(wg.state.copyConstructor(), REMOVE_VERTEX, vertexCoords);
    stateUpdated();
}


function deleteItem() {
    console.log("trying to delete");

    if (selectedVx !== -1) {
        console.log("deleting a vx");

        let adjacencyObject = wg.state.unf[selectedVx];
        let v = adjacencyObject.v;
        let eiv = adjacencyObject.eiv;

        // we need to delete all edges that were connected to this vx
        for (const element of eiv) {
            console.log("eiv: " + element)
            removeEdge([selectedVx, element]);
        }

        removeVx(selectedVx);
        wg.state.updateAdjList();

        addToHistory(wg.state.copyConstructor(), REMOVE_VERTEX, v);

        stateUpdated();

        selectedVx = -1;
    } else if (selectedEdge !== -1) {
        console.log("deleting an edge");

        let edgeToDelete = wg.state.edges[selectedEdge];

        // if we delete an edge, it's fine to leave the vertices.
        removeEdge(edgeToDelete);

        selectedEdge = -1;

        wg.state.updateAdjList();

        addToHistory(wg.state.copyConstructor(), REMOVE_EDGE, edgeToDelete);
        stateUpdated();

    } else {
        toast("Nothing selected for deletion");
    }
}


function flipMatching(flipMode, e1_idx, e2_idx) {
    let e1 = [wg.state.edges[e1_idx][0], wg.state.edges[e1_idx][1]];
    let e2 = [wg.state.edges[e2_idx][0], wg.state.edges[e2_idx][1]];



    if (flipMode === 'a') {
        wg.state.edges[e1_idx][1] = e2[0];
        wg.state.edges[e2_idx][0] = e1[1];
    } else {
        wg.state.edges[e1_idx][1] = e2[1];
        wg.state.edges[e2_idx][1] = e1[1];
    }

    resetSelectionState();
    addToHistory(wg.state.copyConstructor(), FLIP, e1, e2, flipMode);
    stateUpdated();
}



/**
 * Executes the 1-for-1 diagonal flip for a triangulation.
 * This replaces the edge to be removed with the new edge to be added.
 */
function performTriangulationFlip() {
    const edgeToRemoveIdx = reconfigState.edges_to_remove[0];

    // the first edge of the first set of edges
    const edgeToAdd = reconfigState.edges_to_add[0][0];

    // For history purposes, we might want a copy of the edge before we change it.
    const originalEdgeRemoved = [...wg.state.edges[edgeToRemoveIdx]];
    console.log(`Flipping edge ${edgeToRemoveIdx}: removing [${originalEdgeRemoved}] and adding [${edgeToAdd}]`);


    // By replacing the edge at the same index, we avoid re-indexing all other edges,
    // which is safer and more efficient.
    wg.state.edges[edgeToRemoveIdx] = edgeToAdd;


    // Update the history and reset the state machine for the next operation.
    addToHistory(wg.state.copyConstructor(), FLIP, originalEdgeRemoved, edgeToAdd);
    stateUpdated(); // This should handle redrawing and other necessary updates.
    resetSelectionState();
}


/**
 * Executes the edge exchange for a crossing-free spanning path (CFSP) or tree (CFST).
 */
function performTreeFlip() {
    // 1. Get final operation details from the global state.
    // Assumes these have been finalized by the confirmation logic.
    const edgesToRemoveIndices = reconfigState.edges_to_remove; // e.g., [12]
    const edgesToAdd = reconfigState.edges_to_add[0]; // e.g., [[v1, v2]]

    const originalEdgesRemoved = edgesToRemoveIndices.map(
        index => [...wg.state.edges[index]]
    );

    // Create a Set of indices for efficient lookup (O(1)).
    const indicesToRemoveSet = new Set(edgesToRemoveIndices);

    // Filter out the old edges.
    const remainingEdges = wg.state.edges.filter(
        (_, index) => !indicesToRemoveSet.has(index)
    );

    wg.state.edges = remainingEdges.concat(edgesToAdd);


    addToHistory(wg.state.copyConstructor(), FLIP, originalEdgesRemoved, edgesToAdd);

    stateUpdated();

    resetSelectionState();
}