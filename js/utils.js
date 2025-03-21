/**
 * string definitions:
 */
const CATASTROPHIC_ERROR_RESTART_APP = "Something went catastrophically wrong. Application has lost state, please try restarting it.";
const DEFAULT_VERTEX_CLICK_PROXIMITY_RADIUS = 12;

const NORMAL = 0;
const MOVE = 1;
const DELETE = 2;
const EDGE = 3;
const ADD = 4;





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


function distance(a, b) {
    let x = (a[0] - b[0]) ** 2;
    let y = (a[1] - b[1]) ** 2;
    return Math.sqrt(x + y);
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












function showModal(content) {
    // Create the modal elements
    let modal = document.createElement('div');
    modal.className = 'modal';
  
    let modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
  
    let closeButton = document.createElement('span');
    closeButton.className = 'closemodal';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => document.body.removeChild(modal));
  
    modalContent.innerHTML = `<p>${content}</p>`;
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
  
    // Add event listener to close when clicking outside or pressing ESC
    modal.addEventListener('click', (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    });
  
    window.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        document.body.removeChild(modal);
        window.removeEventListener('keydown', escHandler);
      }
    });
  
    // Append modal to the body
    document.body.appendChild(modal);
  
    // Show modal
    setTimeout(() => modal.classList.add('visible'), 10); // For transitions
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
}


function doaredraw() {
    if (!window.Grapher) {
        alert(CATASTROPHIC_ERROR_RESTART_APP);
        return;
    }
    window.Grapher.redraw();
}

