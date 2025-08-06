/**
 * worker.js
 * @fileoverview
 * This worker handles the management of the computation of all possible flips in a graph 
 * for the different reconfiguration modes.
 * 
 * It listens for messages from the main thread to initialize,
 * start computations or cancel operations.
 */


// Listen for messages from the main thread
self.onmessage = function(e) {
  if (e.data.type === 'init') {
    init();
  } else if (e.data.type === 'start') {
    findAllAvailableFlips(e);
  } else if (e.data.type === 'cancel') {
    resetWorkerState(e.data.state, e.data.operation);
  } 
};



function init() {

    // let's not spam the console with unsuccessful attempts to find flips
    // (function() {
    //     const noop = () => {};
    //     // console.log = noop;
    //     // console.warn = noop;
    //     // console.error = noop;
    //     // console.info = noop;
    //     // console.debug = noop;
    //     self.toast = noop;
    // })();


    // Create mock window environment
    const window = {
        Grapher: {
            state: null,
            redraw: function() {},
        }
    };

    self.window = window;  // Make available globally
    self.wg = window.Grapher;  
    self.selectedEdge = -1;
    self.selectedVx = -1;
    self.reconfigState = null;

    self.results = [];
    self.resultCount = 0;

    // Import required scripts (with mock window in place)
    importScripts(
        '../utils.js',
        '../representation/geometry.js',
        '../representation/state.js',
        'matchingsmode.js',
        'pathsmode.js'
    );
    resetSelectionState();
    console.log('Worker scripts loaded successfully');
}






// Reset worker state for a new operation
function resetWorkerState(state, operation) {
    results = [];
    resultCount = 0;
    currentOperation = operation;
    
    // Update window mock with new state
    wg.state = state === null ? state : JSON.parse(state);
}



self.addResult = function(result) {
    results.push(result);
    resultCount++;
    
    // Send immediately for the first 1000 results or every 10th result afterwards
    if (resultCount < 1000 || resultCount % 10 === 0) {
        self.postMessage({
            type: 'partial',
            count: resultCount,
            data: results
        });
        results = [];  // Reset buffer
    }
};
















/**
 * 
 * @param {Object} message - The message object containing the operation and state.
 * @param {Object} message.data - The data object containing the operation and state.
 * @param {String} message.data.type - 'start', 'cancel'
 * @param {String} message.data.operation - e.g., 'matching', 'triangulation'.
 * @param {String} message.data.state - The current state of the graph, as a JSON-serialized string.
 */
function findAllAvailableFlips(message) {
try {

    wg.state = JSON.parse(message.data.state);

    
    switch (message.data.operation) {
        case MATCHINGS_RECONFIGURATION_MODE:
            allPossibleflipsmatching();
            break;
        case MATCHINGS_ALMOSTPERFECT_RECONFIGURATION_MODE:
            allPossibleFlipsAPM();
            break;
        case TRIANGULATION_RECONFIGURATION_MODE:
            allPossibleFlipstriangulation(); 
            break;
        case CFSP_RECONFIGURATION_MODE:
            allPossibleFlipsCFSP();  
            break;
        case CFST_RECONFIGURATION_MODE:
            allPossibleFlipsCFST();
            break;
        default:
            throw new Error(`Unknown operation: ${message.data.operation}`);
    }
    
    if (results.length > 0) {
        self.postMessage({
        type: 'partial',
        count: resultCount,
        data: results
        });
    }
    
    self.postMessage({
        type: 'complete',
        totalCount: resultCount
    });
    
    } catch (error) {
        self.postMessage({
            type: 'error',
            message: error.message,
            stack: error.stack
        });
    }
}
