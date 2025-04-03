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

var mode = EDIT_MODE; 
var submode = DEFAULT_EDIT_MODE;











function getMousePos(event) {
    let rect = canvas.getBoundingClientRect();
    if (!event.clientX || !event.clientY) {
        console.log("Error: tried to get mouse position from event which doesn't have clientX/Y defined" );
        console.log(event);
        return null;
    }
    return [event.clientX - rect.left, event.clientY - rect.top];
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
        const selectorUI = createModeSelector();
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
