/**
 * string definitions:
 */
const CATASTROPHIC_ERROR_RESTART_APP = "Something went catastrophically wrong. Application has lost state, please try restarting it.";
const DEFAULT_VERTEX_CLICK_PROXIMITY_RADIUS = 12;
const MAX_DRAG_DISTANCE_FOR_CLICK = 4;
const DEFAULT_EDGE_HOVER_PROXIMITY = 8;

const NORMAL = 'normal';
const DELETE = 'delete';
const EDGE = 'edge';
const ADD_VERTCIES = 'addVertices';

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


var showColinearPoints = false;
var allColinearTriples = [];




function toggleShowColinear() {
    showColinearPoints = !showColinearPoints;

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



function getMousePos(event) {
    let rect = canvas.getBoundingClientRect();
    if (!event.clientX || !event.clientY) {
        console.log("Error: tried to get mouse position from event which doesn't have clientX/Y defined" );
        console.log(event);
        return null;
    }
    return [event.clientX - rect.left, event.clientY - rect.top];
}






