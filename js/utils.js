/**
 * string definitions:
 */
const CATASTROPHIC_ERROR_RESTART_APP = "Something went catastrophically wrong. Application has lost state, please try restarting it.";
const DEFAULT_VERTEX_CLICK_PROXIMITY_RADIUS = 12;
const MAX_DRAG_DISTANCE_FOR_CLICK = 4;
const DEFAULT_EDGE_HOVER_PROXIMITY = 8;

const INIT = {
    AUTO_LOAD_FILE: 1,
    RESTORE_FROM_LOCALSTORAGE: 2,
    DO_NOTHING: 3,
}
Object.freeze(INIT);

const EDIT_MODE = 0;
const RECONFIGURATION_MODE = 1;

const DEFAULT_EDIT_MODE = 'a';
const CROSSING_FREE_EDIT_MODE = 'b';

const CFSP_RECONFIGURATION_MODE = 'd';
const CFST_RECONFIGURATION_MODE = 'e';
const TRIANGULATION_RECONFIGURATION_MODE = 'f';

const MATCHINGS_RECONFIGURATION_MODE = 'c';
const MATCHINGS_ALMOSTPERFECT_RECONFIGURATION_MODE = 'g';


var mode = EDIT_MODE; 
var submode = DEFAULT_EDIT_MODE;






var allColinearTriples = [];





function createInitialSelection() {
    return {
        // The user interaction mode (can be different for each graph type)
        mode: null,          // Either 'edges' or 'vertices'

        isReady: false,   // True when a valid reconfiguration is ready to be shown
        
        edges_to_remove: [], // An array of edge indices to be removed - inner array is of size 2 for perfect matchings, size 1 otherwise
        edges_to_add: [],    // An array of sets new edges to be added (as vertex index pairs)
                             // e.g., [[[v1, v2], [v3, v4]], [[v1, v4], [v2, v3]]] for a matching
                             // or [[[v1, v2]]] when there is just 1 option to add 1 edge

        picked_vertex: -1, // The index of the vertex that is currently selected for flipping
        // Data for the UI and intermediate steps
        possibleTargets: [], // Array of indices (edges or vertices) to highlight
    };
}


/**
 * Resets the reconfiguration state
 */
function resetSelectionState() {
    reconfigState = createInitialSelection();
    selectedEdge = -1;
    selectedVx = -1;
    wg.redraw();
}







function toggleShowColinear() {
    let showColinearPoints = settingsManager.get(SHOW_COLINEAR_TRIPLES_TOGGLE);

    if (showColinearPoints) {
        allColinearTriples = findAllColinearTriples();
        if (allColinearTriples.length === 0) {
            toast("No 3 vertices are colinear");
        } else {
            wg.redraw();
            toast(`Showing lines between all ${allColinearTriples.length} colinear vertices`);
        }
    } else {
        allColinearTriples = [];
        wg.redraw();
    }
}




/** 
 * Returns the mouse position relative to the canvas.
 * @param {MouseEvent} event - The mouse event.
 * @returns {[number, number]} - The mouse position as [x, y] coordinates.
 */
function getMousePos(event) {
    let rect = canvas.getBoundingClientRect();
    if (!event.clientX || !event.clientY) {
        console.log("Error: tried to get mouse position from event which doesn't have clientX/Y defined" );
        console.log(event);
        return null;
    }
    return [event.clientX - rect.left, event.clientY - rect.top];
}







var allPossibleFlips = [];
function drawPossibleFlips() {

    if (allPossibleFlips.length === 0) {
        toast("No flips are possible");
    } else {
        wg.redraw();
        toast(`Showing lines for all ${allPossibleFlips.length} possible flips`);
    }
}



