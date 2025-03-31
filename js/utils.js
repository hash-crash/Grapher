/**
 * string definitions:
 */
const CATASTROPHIC_ERROR_RESTART_APP = "Something went catastrophically wrong. Application has lost state, please try restarting it.";
const DEFAULT_VERTEX_CLICK_PROXIMITY_RADIUS = 12;
const MAX_DRAG_DISTANCE_FOR_CLICK = 4;
const DEFAULT_EDGE_HOVER_PROXIMITY = 5;

const NORMAL = 'normal';
const DELETE = 'delete';
const EDGE = 'edge';
const ADD_VERTCIES = 'addVertices';

const EDIT_MODE = 0;
const RECONFIGURATION_MODE = 1;

const DEFAULT_EDIT_MODE = 'a';
const CROSSING_FREE_EDIT_MODE = 'b';
const MATCHINGS_RECONFIGURATION_MODE = 'c';
const CFSP_RECONFIGURATION_MODE = 'd';
const CFST_RECONFIGURATION_MODE = 'e';
const TRIANGULATION_RECONFIGURATION_MODE = 'f';

var submode = DEFAULT_EDIT_MODE;









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




function getMousePos(event) {
    let rect = canvas.getBoundingClientRect();
    if (!event.clientX || !event.clientY) {
        console.log("Error: tried to get mouse position from event which doesn't have clientX/Y defined" );
        console.log(event);
        return null;
    }
    return [event.clientX - rect.left, event.clientY - rect.top];
}


function isNearVertex(mousePos, vertex, radius = DEFAULT_VERTEX_CLICK_PROXIMITY_RADIUS) {
    if (!wg || !wg.dims || !mousePos || !vertex) {
        return false;
    }

    let canvasPos = wg.dims.toCanvas(vertex);

    return Math.hypot(canvasPos[0] - mousePos[0], canvasPos[1] - mousePos[1]) < radius;
}







function toast(message, error = false) {
	const cont = document.getElementById("contentId");
    const toast = document.createElement("div");
    if (error) {
        toast.className = "toast errortoast";
    } else {
        toast.className = "toast infotoast";
    }
    toast.textContent = message;

    cont.append(toast);

    // Automatically remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}








function distanceToSegment(mouse, p1, p2) {
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
 * Check if point lies on segment
 *  Only call this after you've checked that d
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




function showModal(contentElement) {
    let modal = document.createElement('div');
    modal.className = 'modal';
    
    let modalContent = document.createElement('div');
    modalContent.className = 'modal-content mode-selector';
    
    // Close button
    let closeButton = document.createElement('button');
    closeButton.className = 'closemodal';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => document.body.removeChild(modal));
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(contentElement);
    modal.appendChild(modalContent);
    
    // Rest of your existing modal logic (click outside, ESC key)...
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('visible'), 10);
}






function pequals(a, b) {
    return a[0] === b[0] && a[1] === b[1];
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



function initializeButtons() {

    let undobtn = document.getElementById('undobtnid');
    undobtn.addEventListener('click', undo);

    let redobtn = document.getElementById('redobtnid');
    redobtn.addEventListener('click', redo);

    let resizecanvasbtn = document.getElementById('resizecanvasid');
    resizecanvasbtn.addEventListener('click', resizeCanvcasModal);

    let copybtn = document.getElementById('copyfilebuttonid');
    copybtn.addEventListener('click', copyFileContent);

    let downloadBtn = document.getElementById('downloadfilebuttonid');
    downloadBtn.addEventListener('click', downloadFileContent);

    let graphModeBtn = document.getElementById('graphmodeid');
    graphModeBtn.addEventListener('click', () => {
        const selectorUI = createModeSelector(
            window.Grapher.currentMode, 
            window.Grapher.currentSubmode
        );
        showModal(selectorUI);
    });


}


function doaredraw() {
    if (!window.Grapher) {
        alert(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }
    window.Grapher.redraw();
}






function triggerShake() {

    // Add shake class
    canvas.classList.add('shake-element');
    
    // Remove after animation completes
    canvas.addEventListener('animationend', () => {
        canvas.classList.remove('shake-element');
    }, {once: true});
  }
