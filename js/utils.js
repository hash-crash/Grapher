/**
 * string definitions:
 */
const CATASTROPHIC_ERROR_RESTART_APP = "Something went catastrophically wrong. Application has lost state, please try restarting it.";

const NORMAL = 0;
const MOVE = 1;
const DELETE = 2;
const EDGE = 3;
const ADD = 4;






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






function showModal(content) {
    // Create the modal elements
    const modal = document.createElement('div');
    modal.className = 'modal';
  
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
  
    const closeButton = document.createElement('span');
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
    let tr = [1,1];
    let bl = [1,1];

    let content = `
        Bottom left: x = <input id="resizebottomleftx" type="number" style="width: 50px" value="${bl[0]}">  y = <input id="resizebottomlefty" type="number" style="width: 50px" value="${bl[1]}"> 
        <br>
        Top right: x = <input id="resizetoprightx" type="number" style="width: 50px" value="${tr[0]}">  y = <input id="resizetoprighty" type="number" style="width: 50px" value="${tr[1]}"> 
        <br>
        <br>
        <button id="resizeapply" class="applyBtn">Apply</button>
    `;

    showModal(content);
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
    window.Grapher.redraw();
}

