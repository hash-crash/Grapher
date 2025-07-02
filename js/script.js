/*********************************************************************************************************************************
 * 
 * This file is the javascript entry-point for the application.
 * It sets up some basic framework, initiates the other files, 
 * and initializes some objects that are crucial to the functioning of the app.
 * 
 *******************************************************************************************************************************/











// Boot up the javascript:
{
    let timestampStart = performance.now();

    const scripts = document.getElementsByTagName("script");
    src = scripts[scripts.length-1].src;
    let foundPath = "";
    // if being hosted from just a simple file, we need to give the OS thefull path 
    // - thankfully we can get it on hopefully all browsers.
    if (src.startsWith("file://")) {
        // extract the actual FS-path all the way up to and including  "script.js"
        foundPath = src.split("file://")[1];
        // we remove 12 because we want to leave everything from / until grapher/ which means removing "js/script.js" - which is 12 characters
        foundPath = foundPath.substring(0, foundPath.length - 12);

        console.log(foundPath);
    }

    


/**
 * This enables adding new JS files to the project without editing any HTML,
 * just call this loader function on the new files as the path below.
 * 
 * taken from: https://stackoverflow.com/questions/43485888/include-multiple-javascript-files-in-a-js-file
 * 
 * @param {String} path in this project, the relative path of all javascript files starts with 'js/...'
 * @param {Function} callback to call after loading the script
 * @returns {Promise} promise that resolves once the file is fully loaded
 */
function scriptLoader(path, callback) {
return new Promise((resolve, reject) => {
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.async = true;
    script.src = `${foundPath}${path}`;
    script.onload = function(){
        if(typeof(callback) == "function"){
            callback();
            resolve();
        } else {
            resolve();
        }
    }
    try
    {
        var scriptOne = document.getElementsByTagName('script')[0];
        scriptOne.parentNode.insertBefore(script, scriptOne);
        
    }
    catch(e)
    {
        document.getElementsByTagName("head")[0].appendChild(script);
        reject();
    }
});
}


async function loadAllScripts() {
    let utilsPromise =  scriptLoader('js/utils.js');

    // these files are indepedent and can be loaded whenever
    let statePromise = scriptLoader('js/representation/state.js');
    let dimsPromise = scriptLoader('js/representation/dims.js');

    let fcPromise = scriptLoader('js/sidebar/filecontent.js');
    let filePromise = scriptLoader('js/sidebar/file.js');
    let historyPromise = scriptLoader('js/sidebar/history.js');
    let geometryPromise = scriptLoader('js/representation/geometry.js');
    let drawingPromise = scriptLoader('js/representation/drawing.js');
    let editModePromise = scriptLoader('js/graphlogic/editmode.js');
    let matchingsModePromise = scriptLoader('js/graphlogic/matchingsmode.js');
    let triangulationsModePromise = scriptLoader('js/graphlogic/triangulationsmode.js');
    let pathsModePromise = scriptLoader('js/graphlogic/pathsmode.js');
    let reconfModePromise = scriptLoader('js/graphlogic/reconfigurationmode.js');
    let contextMenuPromise = scriptLoader('js/interactivity/contextmenu.js');
    let hiPromise = scriptLoader('js/interactivity/htmlinteractivity.js');
    let miPromise = scriptLoader('js/interactivity/modeinteractivity.js');
    let settingsPromise = scriptLoader('js/interactivity/settings.js');


    // we need utilsPromise first
    await utilsPromise;
    await statePromise;
    await dimsPromise;

    let grapherPromise =  scriptLoader('js/representation/grapher.js'); 


    await fcPromise;
    await historyPromise;
    await geometryPromise;
    await editModePromise;
    await matchingsModePromise;
    await triangulationsModePromise;
    await pathsModePromise;
    await reconfModePromise;
    await contextMenuPromise;
    await hiPromise;
    await miPromise;
    await settingsPromise;
    await drawingPromise;
    await grapherPromise;
    // the main grapher object representing the state, dimensions of the image.
    // please don't remove this
    window.Grapher = new Grapher(null, null, ctx);

    reconfigState = createInitialSelection(window.Grapher);

    await scriptLoader('js/interactivity/canvas.js');
    initializeButtons();

    await filePromise;
    runAutoInit();
}
loadAllScripts();


/**
 * Enables checking with the user if they want to re-esablish the state that
 * was put into localstorage the previous time that the program was ran. TODO before giving this to the professor, i should actually enable this feature
 * 
 * For development purposes, this function will  run the automatic loading of data/filename
 * 
 * This is here to speed up development, when it is needed,
 *  simply add a call to this function at the end of loadAllScripts
 */
async function runAutoInit() {
    // setTimeout(() => {
    //     restoreFromLocalStorage();
    // }, 80)

    
    // current experimental area:

    try {
        console.log(`Miliseconds needed for init: ${performance.now() - timestampStart}`);

        await autoLoadInputFile("in4.txt"); // Now waits for completion

        // for now just add vertices and edges;
        // addVx([12,12]);
        // addVx([-25,20]);
        // addEdge([10, 9], true);
        // addEdge([9,10]);
        console.log(`Miliseconds needed for init including file auto-loading: ${performance.now() - timestampStart}`);

    } catch (error) {
        console.error("Error:", error);
        toast(`Error: ${error}`, true);
    }
}

}


















//*******************************************************************************************************************************/
// Boot up the css:
{
/** 
 * More of the same, but this time for adding css stylesheets:
 */
function cssLoader(path) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = path;
    try {
        var firstLink = document.getElementsByTagName('link')[0] || document.getElementsByTagName('head')[0].firstChild;
        firstLink.parentNode.insertBefore(link, firstLink);
    } catch (e) {
        document.getElementsByTagName('head')[0].appendChild(link);
    }
}
cssLoader('css/fonts.css');
cssLoader('css/style.css');
cssLoader('css/sidebar.css');
cssLoader('css/canvas.css');
cssLoader('css/modeineractivity.css');
cssLoader('css/history.css');
cssLoader('css/filecontent.css');
cssLoader('css/settings.css');
cssLoader('css/toolbar.css');
}
























//*******************************************************************************************************************************/
// utils to make some items more available everywhere with less typing:
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
var selectedVx = -1;
var selectedEdge = -1;
var highlightedEdge = -1;
var highlightedVx = -1;

/**
 * See {@link ReconfigurationMode#createInitialSelection} 
 */
var reconfigState = null;



// make sure to adjust the image in case the window is resized :)
function resizeEventHandler() { window.Grapher.redraw();}
window.onresize = resizeEventHandler;

// Taken from https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event on 2025-01-03
const beforeUnloadHandler = (event) => {
    event.preventDefault();
    // Included for legacy support, e.g. Chrome/Edge < 119
    event.returnValue = true;
};
// todo uncomment this for the professor
// window.addEventListener("beforeunload", beforeUnloadHandler);



// more shortcut utils
window.stateHistory = [];
window.undoneStates = [];


