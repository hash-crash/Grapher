

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
    document.addEventListener('mousedown', modalMouseDown);

    setTimeout(() => {
        modal.classList.add('visible');
        document.addEventListener('mousedown', modalMouseDown);
    }, 10);
}




function modalMouseDown(event)  {
    let modalList = document.getElementsByClassName('modal-content');
    let openModal = document.querySelector('.modal.visible');

    if (modalList.length > 0 && !modalList[0].contains(event.target)) {
        document.removeEventListener('mousedown', modalMouseDown);
        openModal.remove();
        return; // Stop further processing
    }
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

    let explodeButton = document.getElementById('explodeid');
    explodeButton.addEventListener('click', explodeCoordinates);

    let possibleFlipsButton = document.getElementById('showflipsid');
    possibleFlipsButton.addEventListener('click', drawPossibleFlips);

    // let colinearButton = document.getElementById('showcolinearid');
    // colinearButton.addEventListener('click', () => {
    //     toggleShowColinear();
    //     colinearButton.classList.toggle('pressed-button', showColinearPoints);
    // });

    let graphModeBtn = document.getElementById('graphmodeid');
    graphModeBtn.addEventListener('click', () => {
        console.log("Opening mode selection modal...");
        // Generate the UI content
        const selectorUI = createModeSelector();
        showModal(selectorUI);
    });

    let settingsButton = document.getElementById('settingsid');
    settingsButton.addEventListener('click', () => {
        console.log("Opening settings modal...");
        // Generate the UI content
        const settingsPanelElement = createSettingsPanel();
        showModal(settingsPanelElement);
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


