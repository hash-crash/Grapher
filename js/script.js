/*********************************************************************************************************************************
 * 
 * This file is the javascript entry-point for the application.
 * It sets up some basic framework, initiates the other files, 
 * and initializes some objects that are crucial to the functioning of the app.
 * 
 *******************************************************************************************************************************/











// Boot up the javascript:


{
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
 * @param {*} path in this project, starts with 'js/...'
 * @param {*} callback function to call after loading the script
 */
function scriptLoader(path, callback)
{
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.async = true;
    script.src = `${foundPath}${path}`;
    script.onload = function(){
        if(typeof(callback) == "function")
        {
            callback();
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
    }
}


scriptLoader('js/sidebar/filecontent.js');
scriptLoader('js/sidebar/history.js');
scriptLoader('js/utils.js');
scriptLoader('js/representation/state.js');
scriptLoader('js/representation/dims.js');
scriptLoader('js/representation/grapher.js', function() {
    // the main grapher object representing the state, dimensions of the image.
    // please don't remove this
    window.Grapher = new Grapher(null, null, ctx);
});
scriptLoader('js/canvas.js', initCanvas);
scriptLoader('js/sidebar/file.js', runTimeout);


/**
 * Enables checking with the user if they want to re-esablish the state that
 * was put into localstorage the previous time that the program was ran. TODO before giving this to the professor, i should actually enable this feature
 * 
 * For development purposes, this function will perform a
 * 100ms pause and then run the automatic loading of data/filename
 * 
 * This is here to speed up development, when it is needed,
 *  simply add runTimeout as the callback argument for the file.js scriptloader.
 */
function runTimeout() {
    // setTimeout(() => {
    //     restoreFromLocalStorage();
    // }, 80)

    setTimeout(() => {
        autoLoadInputFile("in.txt");
    }, 150);

    // current experimental area:

    // for now just add a vertex after 2 seconds;
    setTimeout(() => {
        console.log('called addvX');
        addVx([12,12]);
        addVx([-25,20]);
        addEdge([10, 9], true);
        addEdge([9,10]);
    }, 250);
}

function initCanvas() {
    setTimeout(() => {
        initializeButtons();
    }, 50)
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
cssLoader('css/history.css');
cssLoader('css/filecontent.css');
}
























//*******************************************************************************************************************************/
// utils to make some items more available everywhere with less typing:
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
var selectedVx = -1;
var selectedEdge = -1;
var highlightedEdge = -1;
var highlightedVx = -1;
var mousePos = null;




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
var wg = window.Grapher;
window.stateHistory = [];
window.undoneStates = [];



// settings object
s = {
    // when true, the x and y coordinates are represented with the same number of pixels 
    // (i.e. on a typical widescreen, there will be more x coordinates shown than y)
    // otherwise, the graph is stretched to fill the available screen space
    ONE_TO_ONE : true,
    mobileScreen: false,
}


