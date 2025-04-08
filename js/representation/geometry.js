

/**
 * @param {[Number, Number]} a expressing coordinates of a point, x1 and y1
 * @param {*} b expressing coordinates of a point, x2 and y2
 * @returns whether or not and b are the same point
 */
function pequals(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}


/**
 * @param {[Number, Number]} e1 the edge, containing the 0-based indices of the vertices it connects
 * @param {[Number, Number]} e2 the edge, containing the 0-based indices of the vertices it connects
 * @returns true if intersects, false if not intersects
 */
function edgeIntersect(e1, e2) {
    if (!wg || !wg.state) {
        return false;
    }

    //  console.log(`e1 ${e1}, e2 ${e2}`);

    let p1 = wg.state.vertices[e1[0]];
    let p2 = wg.state.vertices[e1[1]];
    let q1 = wg.state.vertices[e2[0]];
    let q2 = wg.state.vertices[e2[1]];

    return intersects(p1, p2, q1, q2);
}



/**
 * Check if point p lies on segment [a,b]
 * @param {[Number, Number]} a coordinates
 * @param {[Number, Number]} b coordinates
 * @param {[Number, Number]} p coordinates
 * 
 * @returns true if colinear and p beween a,b
 */ 

function isOnSegment(a, b, p) {
    const d = det(a,b,p);
    //  console.log(`re-det ${d}, a, b, p su ${a}, ${b}, ${p}`);
    return d === 0 &&
            p[0] <= Math.max(a[0], b[0]) && 
            p[0] >= Math.min(a[0], b[0]) && 
            p[1] <= Math.max(a[1], b[1]) && 
            p[1] >= Math.min(a[1], b[1]);
};


/**
 * 
 * @param {[Number, Number]} p1 coordinates
 * @param {[Number, Number]} p2 coordinates
 * @param {[Number, Number]} q1 coordinates
 * @param {[Number, Number]} q2 coordinates
 * @returns true if intersection found, false if no intersection
 */
function intersects(p1, p2, q1, q2) {

    if (pequals(p1, q1)) {
        return isOnSegment(q1, q2, p2);
    }
    if (pequals(p1, q2)) {
        return isOnSegment(q1, q2, p2);
    }
    if (pequals(p2, q1)) {
        return isOnSegment(q1, q2, p1);  
    }
    if (pequals(p2, q2)) {
        return isOnSegment(q1, p2, p1);
    }

    let d1 = det(p1, p2, q1);
    let d2 = det(p1, p2, q2);
    let d3 = det(q1, q2, p1);
    let d4 = det(q1, q2, p2);

    // console.log(`${d1}, ${d2}, ${d3}, ${d4}`);

    if (d1 === 0 && isOnSegment(p1, p2, q1)) {
        return true;
    }
    if (d2 === 0 && isOnSegment(p1, p2, q2)) {
        return true;
    }
    if (d3 === 0 && isOnSegment(q1, q2, p1)) {
        return true;
    }
    if (d4 === 0 && isOnSegment(q1, q2, p2)) {
        return true;
    }


    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}






/**
 * Determinant given by:
 * ```
 * |p1x p2x qx|
 * |p1y p2y qy|
 * | 1   1  1 |
 * ```
 * Tells us if q is clockwise or counter-clockwise from p1-p2
 * 
 * @param {[Number, Number]} p1
 * @param {[Number, Number]} p2
 * @param {[Number, Number]} q
 * @returns result of the described determinant
 */
function det(p1, p2, q) {
    return (p1[0] * (p2[1] - q[1]))
         - (p2[0] * (p1[1] - q[1]))
         + (q[0] * (p1[1] - p2[1]));
}




function distanceToSegment(mouse, p1, p2) {
    if (!Array.isArray(mouse) || mouse.length != 2) {
        return;
    }
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const lengthSquared = dx*dx + dy*dy;
    
    if (lengthSquared === 0) {
        return Math.hypot(mouse[0] - p1[0], mouse[1] - p1[1]);
    }

    const t = ((mouse[0] - p1[0]) * dx + (mouse[1] - p1[1]) * dy) / lengthSquared;
    const tClamped = Math.max(0, Math.min(1, t));
    const projX = p1[0] + tClamped * dx;
    const projY = p1[1] + tClamped * dy;
    
    return Math.hypot(mouse[0] - projX, mouse[1] - projY);
}





function isNearVertex(mousePos, vertex) {
    if (!wg || !wg.dims || !mousePos || !vertex) {
        return false;
    }

    let radius = settingsManager.get(PROXIMITY_VERTEX);
    if (!radius) {
        console.warn("Could not get proximity radius from settings");
        radius = DEFAULT_VERTEX_CLICK_PROXIMITY_RADIUS;
    }



    let canvasPos = wg.dims.toCanvas(vertex);

    return Math.hypot(canvasPos[0] - mousePos[0], canvasPos[1] - mousePos[1]) < radius;
}



function findAllColinearTriples() {
    const collinearTriples = [];
    const n = wg.state.vertices.length;

    // Need at least 3 vertices to form a triple
    if (n < 3) {
        return collinearTriples;
    }

    // Iterate through all unique combinations of three distinct vertex indices i, j, k
    for (let i = 0; i < n - 2; i++) {
        for (let j = i + 1; j < n - 1; j++) {
            for (let k = j + 1; k < n; k++) {
                const p1 = wg.state.vertices[i];
                const p2 = wg.state.vertices[j];
                const p3 = wg.state.vertices[k];
                if (det(p1, p2, p3) !== 0) {
                    continue;
                }
                if (isOnSegment(p1, p3, p2)) {
                    collinearTriples.push([i, j, k]);
                    continue;
                }
                if (isOnSegment(p1, p2, p3)) {
                    collinearTriples.push([i, k, j]);
                    continue;
                }
                collinearTriples.push([j, i, k]);
            }
        }
    }
    return collinearTriples;
}



/**
 * Checks if the graph is connected using BFS
 * @returns {boolean} True if connected
 */
function isConnected() {
    const adjList = wg.state.unf;
    const n = adjList.length;
    if (n < 2) {
        // Empty graph or only 1 node
        return true; 
    }

    
    const visited = new Array(n).fill(false);
    const queue = [0];

    visited[0] = true;
    let visitedCount = 1;
    
    while (queue.length > 0) {
        const current = queue.shift();
        for (const neighbor of adjList[current].eiv) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                visitedCount++;
                queue.push(neighbor);
            }
        }
    }
    return visitedCount === n;
}

function isCrossingFree(state=null) {
    if (state === null) {
        state = wg.state;
    }

    const n = state.vertices.length;
    //non-planar graph must have crossings
    if (n > 4 && state.edges.length > (3 * n) - 6) {
        return false;
    }

    // Now edges.length is bound to be O(n), so worst case is O(n²)
    let isGood = true;
    state.edges.forEach((edge, i) => {
        for (let j = i + 1; j < state.edges.length; j++) {
            const otherEdge = state.edges[j];
            if (edgeIntersect(edge, otherEdge)) {
                console.log(`${edge}, ${otherEdge}, {[${state.vertices[edge[0]]}, ${state.vertices[edge[1]]}]} and {[${state.vertices[otherEdge[0]]}, ${state.vertices[otherEdge[1]]}]}`)
                isGood = false;
            }
        }
    }); 
    return isGood;
}


/**
 * Checks if the graph is a spanning tree (connected with exactly n-1 edges)
 * @returns {boolean} True if spanning tree
 */
function isSpanningTree() {
    const n = wg.state.vertices.length;
    return isConnected() && wg.state.edges.length === n - 1;
}

/**
 * Checks if the graph is a spanning path (tree with exactly 2 leaves and others degree 2)
 * @returns {boolean} True if spanning path
 */
function isSpanningPath() {
    if (!isSpanningTree()) {
        return false;
    }

    const n = wg.state.vertices.length;
    if (n === 1) {
        // Single node is trivial path
        return true;
    }
    
    const degrees = wg.state.unf.map(entry => entry.eiv.length);
    let leafCount = 0;
    
    for (const deg of degrees) {
        if (deg === 1){
            leafCount++;
        }
        // this is probably irrelevantg
        else if (deg !== 2) {
            return false;
        }
    }
    return leafCount === 2;
}


var perfectMatching = false;
var almostPerfectMatching = false;
function isMatching() {

    perfectMatching = false;
    almostPerfectMatching = false;

    const adjList = wg.state.unf;
    const n = adjList.length;
    
    let degreeZeroCount = 0;
    let degreeOneCount = 0;
    
    // Check all vertices' degrees
    for (const vertex of adjList) {
        const degree = vertex.eiv.length;
        
        if (degree > 1) {
            // Immediate disqualification
            return false;
        }
        if (degree === 0){
            degreeZeroCount++;
        }
        else {
            degreeOneCount++;
        }
    }
    
    // Check matching conditions
    if (n % 2 === 0) { 
        // Even number of vertices
        const result = (degreeZeroCount === 0 && degreeOneCount === n);
        if (result) {
            perfectMatching = true;
        }
        return result; 
    } else {  
        // Odd number of vertices
        const result = (degreeZeroCount === 1 && degreeOneCount === n - 1);
        if (result) {
            almostPerfectMatching = true;
        }
        return result;
    }
}

function isGeometricTriangulation() {

    // O(n² worst-case)
    if (!isCrossingFree()) {
        return false;
    }

    const n =  wg.state.vertices.length;
    const adjList = wg.state.unf;

    // O(non-edge*edges) = O(n³) worst-case since there can be n(n-1)/2 possible new edges worst case (O(n²)), and O(n) edges. 
    // Check all non-edges for possible addition
    for (let i = 0; i < n; i++) {
        for (let j = i+1; j < n; j++) {
            if (adjList[i].eiv.includes(j)){
                // Skip existing edges
                continue; 
            }
            
            // Proposed edge between i and j
            const newEdge = [i, j];
            
            // Check against all existing edges
            let canAdd = true;
            for (const e of wg.state.edges) {
                if (edgeIntersect(newEdge, e)) {
                    canAdd = false;
                    // Early exit for this non-edge
                    break; 
                }
            }
            
            if (canAdd) {
                // Not maximal -> not triangulated
                return false; 
            }
        }
    }
    return true;
}


function isCFST() {
    return isCrossingFree() && isSpanningTree();
}

function isCFSP() {
    return isCrossingFree() && isSpanningPath();
}



/**
 * Checks if the graph is a valid pairing/matching
 * @returns {boolean} True if valid matching
 */
function isCFMatching() {
    return isCrossingFree() && isMatching();
}





function isValidGraphForMode() {
    if (mode === EDIT_MODE) {
        return submode === DEFAULT_EDIT_MODE ?
            true :
            isCrossingFree();
    } else {
        switch (submode) {
            case TRIANGULATION_RECONFIGURATION_MODE:
                return isGeometricTriangulation();
            case CFSP_RECONFIGURATION_MODE:
                return isCFSP();
            case CFST_RECONFIGURATION_MODE:
                return isCFST();
            case MATCHINGS_RECONFIGURATION_MODE:
                return isMatching();
            default:
                console.error("unkown submode");
                break;
        }
    }
}