

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

    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('visible'), 10);
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


function triggerShake() {

    // Add shake class
    canvas.classList.add('shake-element');
    
    // Remove after animation completes
    canvas.addEventListener('animationend', () => {
        canvas.classList.remove('shake-element');
    }, {once: true});
  }
