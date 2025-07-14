

/**
 * @param {[Number, Number]} a expressing coordinates of a point, x1 and y1
 * @param {*} b expressing coordinates of a point, x2 and y2
 * @returns whether or not and b are the same point
 */
function pequals(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}

/**
 * Checks if two edges (represented by their vertex index pairs) are the same.
 * @param {[Number, Number]} e_idx_pair1 - Vertex indices of the first edge.
 * @param {[Number, Number]} e_idx_pair2 - Vertex indices of the second edge.
 * @returns {boolean} True if the edges are the same, false otherwise.
 */
function areEdgesEqual(e_idx_pair1, e_idx_pair2) {
    if (!e_idx_pair1 || !e_idx_pair2 || e_idx_pair1.length !== 2 || e_idx_pair2.length !== 2) {
        return false;
    }
    return (e_idx_pair1[0] === e_idx_pair2[0] && e_idx_pair1[1] === e_idx_pair2[1]) ||
           (e_idx_pair1[0] === e_idx_pair2[1] && e_idx_pair1[1] === e_idx_pair2[0]);
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
 * 
 * @returns true if this line would intersect any existing edge
 */
function intersectsAny(p1, p2, state=null, edges = null) {
    if (state === null) {
        state = wg.state;
    }
    if (edges === null) {
        edges = state.edges;
    }

    for (const edge of edges) {
        let v1 = state.vertices[edge[0]];
        let v2 = state.vertices[edge[1]];
        if (intersects(p1, p2, v1, v2)) {
            return true;
        }
    }
}


/**
 * Finds all existing edges that are properly intersected by a potential new edge.
 * "Properly intersected" means the edges cross and do not share any endpoints.
 *
 * @param {[Nunmber, Number]} potentialEdge - The edge to check, as a pair of vertex indices [v1, v2].
 * @returns {[Number..]} - An array of indices of all existing edges that are properly intersected.
 */
function findIntersectedEdges(potentialEdge, state=null) {
    if (state === null) {
        state = wg.state;
    }

    const intersected_indices = [];
    const [v1_idx, v2_idx] = potentialEdge;

    // Get the coordinates of the potential new edge.
    const p1 = state.vertices[v1_idx];
    const p2 = state.vertices[v2_idx];

    // Loop through all existing edges in the graph.
    for (let i = 0; i < state.edges.length; i++) {
        const existingEdge = state.edges[i];
        const [v3_idx, v4_idx] = existingEdge;

        // --- Crucial Guard Clause ---
        // If the potential new edge shares any vertex with the existing edge,
        // they cannot properly intersect. They are adjacent, not crossing.
        if (v1_idx === v3_idx || v1_idx === v4_idx || v2_idx === v3_idx || v2_idx === v4_idx) {
            continue; // Skip to the next edge.
        }

        // Now that we know the edges are disjoint, we can perform the geometric test.
        // We leverage your existing, robust 'intersects' function.
        const q1 = state.vertices[v3_idx];
        const q2 = state.vertices[v4_idx];
        
        if (intersects(p1, p2, q1, q2)) {
            intersected_indices.push(i);
        }
    }

    return intersected_indices;
}


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
 * If 2 lines intersect, this function returns the point at which they intersect (in graph coordinates, not canvas)
 * @param {[Number, Number]} p1 
 * @param {[Number, Number]} p2 
 * @param {[Number, Number]} q1 
 * @param {[Number, Number]} q2 
 * @returns {[Number, Number]?} intersection point
 */
function getIntersectionPoint(p1, p2, q1, q2) {
    const x1 = p1[0], y1 = p1[1];
    const x2 = p2[0], y2 = p2[1];
    const x3 = q1[0], y3 = q1[1];
    const x4 = q2[0], y4 = q2[1];

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denominator === 0) {
        // Lines are parallel, and we are assuming they do intersect
        return  isOnSegment(p1, p2, q1) ? q1 :
                isOnSegment(p1, p2, q2) ? q2 :
                isOnSegment(q1, q2, p1) ? p1 :
                isOnSegment(q1, q2, p2) ? p2 :
                null;
        
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
    }
    return null;
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



/**
 * 
 * @param {[Number, Number]} mouse position in canvas (so, not in graph coordinates)
 * @param {[Number, Number]} p1 position in canvas
 * @param {[Number, Number]} p2 position in canvas
 * @returns {Number} canvas units distance between mouse and p1-p2
 */
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




/**
 * 
 * @param {[Number, Number]} mousePos coordinates in the canvas
 * @param {[Number, Number]} vertex coordinates in the graph
 * @returns {Boolean} whetheher it's within PROXIMITY_VERTEX-setting pixels
 */
function isNearVertex(mousePos, vertex) {
    if (!wg || !wg.dims || !mousePos || !vertex) {
        return false;
    }

    let radius = settingsManager.get(PROXIMITY_VERTEX);
    if (!radius) {
        console.warn("Could not get proximity radius from settings");
        radius = DEFAULT_VERTEX_CLICK_PROXIMITY_RADIUS;
    }



    let canvasPositionOfVx = wg.dims.toCanvas(vertex);

    return Math.hypot(canvasPositionOfVx[0] - mousePos[0], canvasPositionOfVx[1] - mousePos[1]) < radius;
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
function isConnected(state=null) {
    if (state === null) {
        state = wg.state;
    }

    const adjList = state.unf;
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
function isSpanningTree(state=null) {
    if (state === null) {
        state = wg.state;
    }
    const n = state.vertices.length;
    return isConnected(state) && state.edges.length === n - 1;
}

/**
 * Checks if the graph is a spanning path (tree with exactly 2 leaves and others degree 2)
 * @returns {boolean} True if spanning path
 */
function isSpanningPath(state=null) {

    if (state === null) {
        state = wg.state;
    }

    if (!isSpanningTree(state)) {
        return false;
    }

    const n = state.vertices.length;
    if (n === 1) {
        // Single node is trivial path
        return true;
    }
    
    const degrees = state.unf.map(entry => entry.eiv.length);
    let leafCount = 0;
    
    for (const deg of degrees) {
        if (deg === 1){
            leafCount++;
        } else if (deg !== 2) {
            return false;
        }
    }
    return leafCount === 2;
}


var perfectMatching = false;
var almostPerfectMatching = false;
function isMatching(state=null) {

    if (state === null) {
        state = wg.state;
    }

    perfectMatching = false;
    almostPerfectMatching = false;

    const adjList = state.unf;
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

function isGeometricTriangulation(state=null) {

    if (state === null) {
        state = wg.state;
    }

    // O(n² worst-case)
    if (!isCrossingFree(state)) {
        return false;
    }

    const n =  state.vertices.length;
    const adjList = state.unf;

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
            for (const e of state.edges) {
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


function isCFST(state=null) {
    if (state === null) {
        state = wg.state;
    }
    return isCrossingFree(state) && isSpanningTree(state);
}

function isCFSP(state=null) {
    if (state === null) {
        state = wg.state;
    }
    return isCrossingFree(state) && isSpanningPath(state);
}



/**
 * Checks if the graph is a valid pairing/matching
 * @returns {boolean} True if valid matching
 */
function isCFMatching(state=null) {
    if (state === null) {
        state = wg.state;
    }
    return isCrossingFree(state) && isMatching(state);
}





function isValidGraphForMode() {
    if (mode === EDIT_MODE) {
        return submode === DEFAULT_EDIT_MODE ?
            true :
            isCrossingFree();
    } else {
        switch (submode) {
            case MATCHINGS_RECONFIGURATION_MODE:
                return isMatching();
            case TRIANGULATION_RECONFIGURATION_MODE:
                return isGeometricTriangulation();
            case CFSP_RECONFIGURATION_MODE:
                return isCFSP();
            case CFST_RECONFIGURATION_MODE:
                return isCFST();
            default:
                console.error("unkown submode");
                break;
        }
    }
}