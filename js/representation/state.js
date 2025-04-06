/**
 * 
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

        return new State(edgesCopy, verticesCopy, true,  unfcopy);
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
    updateFileView();
    updateHistoryView();
    wg.state.updateAdjList();
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


/**
 * This likely doesn't need to touch the adjacency list/matrix?? not sure, check later TODO 
 */
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

    //TODO add bounds checking?

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


    // TODO check if i should check for minmax coords, maybe -50 +50
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

        wg.state.updateAdjList();

        selectedEdge = -1;
        addToHistory(wg.state.copyConstructor(), REMOVE_EDGE, edgeToDelete);


        stateUpdated();

    } else {
        toast("Nothing selected for deletion");
    }
}

