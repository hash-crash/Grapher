/**
 * 
 */
class State {

    constructor(edgesB, verticesB, complete=false, modeB, unfB) {
        this.vertices = verticesB;

        if (complete) {
            this.edges = edgesB;
            this.mode = modeB;
            this.unf = unfB;
        } else {
            this.edges = edgesB.map((v) => [v[0] - 1, v[1] - 1]); 
            this.mode = NORMAL;
            
            let i = 0;
            this.unf = this.vertices.map((v) => {
                let eiv = this.edges.map((e) => {
                    if (e[0] == i) {
                        return e[1];
                    } else if (e[1] == i) {
                        return e[0];
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

        return new State(edgesCopy, verticesCopy, true, this.mode, unfcopy);
    }

    updateAdjList() {
        let i = 0;
        return this.vertices.map((v) => {
            let eiv = this.edges.map((e) => {
                if (e[0] == i) {
                    return e[1];
                } else if (e[1] == i) {
                    return e[0];
                }
            }).filter((n) => n != -1);
            i+=1;
            return {v, eiv}
        });
    }


}


const EMPTY_STATE = new State([], []);




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


    updateFileView();
    updateHistoryView();
    wg.redraw();

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
    for (const vx of wg.state.vertices) {
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

        updateFileView();
        updateHistoryView();
        wg.redraw();
        return true;
    }

    return false;
}












/**
 * 
 * @param {*} indices in the state.vertices list
 * @param {*} userPresentation if set to true, the provided indices should be 
 *                              reduced by 1 since user presentation is 1-based
 *                              and software representation is 0-based
 * @returns 
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

    addToHistory(wg.state.copyConstructor(), ADD_EDGE, indices);

    updateFileView();
    updateHistoryView();
    wg.redraw();
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

            updateFileView();
            updateHistoryView();
            wg.redraw();
            return true;
        }
    }
    return false;

}

function checkEdgeBounds(indices) {
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

