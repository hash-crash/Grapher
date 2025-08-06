/**
 * Here is where the history of the changes to the graph is stored and handled.
 * 
 * Doing this allows us to traverse the changes that happened to the graph
 * using undo() and redo()
 * 
 * It is quite important that each history item stores the state of the graph 
 * that happens AFTER the change in its description is applied. 
 * This is also how the highlighting in the sidebar functions.
 */



let historyList = document.getElementById('changehistorylistid');




/**
 * Just run through the html elements and adjust them as necessary. Also handles the regular case for adding a new item to the list, keeping it
 * within the visible area by scrolling to the bottom
 */
function updateHistoryView() {

    
    // Update content
    historyList.innerHTML = convertToHistoryLines();
    
    requestAnimationFrame(scrollHistoryItemIntoView);


    historyList.addEventListener('click', jumpToLine);

    // this one is currently not doing anything
    // I don't know if i want to make it redraw the whole thing into that state on hover, 
    // make a new miniaturized canvas showing that graph,
    // or do nothing.... difficult usability decisions
    historyList.addEventListener('mouseover', redrawIntoState);
    // historyList.addEventListener('mouseleave', doaredraw);
}

function scrollHistoryItemIntoView() {

    let scrollContainer = historyList.parentElement;
    let currentChangeElement = historyList.querySelector('.lastHistoryLine');
    if (!currentChangeElement) {
        console.log("No last history line found");
        return;
    } 

    // Calculate element's position relative to container
    let containerRect = scrollContainer.getBoundingClientRect();
    let elementRect = currentChangeElement.getBoundingClientRect();
    let relativeTop = elementRect.bottom - containerRect.top;


    // Only scroll if the element isn't already fully visible
    if (relativeTop < 0 || relativeTop > containerRect.height) {
        let targetTop = currentChangeElement.offsetTop - scrollContainer.offsetHeight / 2;
        scrollContainer.scrollTop = targetTop;
    }

}

/**
 * Converts the window.stateHistory and window.UndoneStates into html elements for the ordered list.
 * 
 * @returns the inner HTML of the <ol> for the history.
 */
function convertToHistoryLines() {

    let i = 0;
    let historyLines = window.stateHistory.map((item) => {
        if (i === window.stateHistory.length - 1) {
            return `<li class="changehistorylistline lastHistoryLine">${item.description}</li>`;
        }
        i += 1;
        return `<li class="changehistorylistline">${item.description}</li>`;
    }).join('\n');

    let s = "";
    for (i = window.undoneStates.length - 1; i >= 0; i--) {
        const item = window.undoneStates[i];

        if ( i ===window.undoneStates.length - 1 && 
            window.stateHistory.length === 0 &&
            window.undoneStates.length > 0) {
            s = s.concat(`<li class="changehistorylistline firstundonelineandnohistory">${item.description}</li>`);
            continue;
        }

        s = s.concat(`<li class="changehistorylistline">${item.description}</li>`);
        
    }

    return `${historyLines}\n${s}`;
}








function jumpToLine(event) {
    if (event.target.tagName !== 'LI') {
        return;
    }

    // Get the clicked <li> index
    const index = Array.from(historyList.children).indexOf(event.target);

    console.log(`You clicked on line ${index + 1}: ${event.target.textContent}`);

    if (index >= window.stateHistory.length) {
        // its actually an 'undone state'
        let j = index - window.stateHistory.length;

        let maxind = window.undoneStates.length - 1;
        let compind = maxind - j;
        
        console.log(`the 'computed' index is ${j}, maxind ${maxind}, compind ${compind}`);

        for (let i = maxind; i >= compind; i--) {

            let element = window.undoneStates.pop();
            window.stateHistory.push(element);
        }
    } else if (index === window.stateHistory.length - 1) {
        console.log("Nothing to do, this is the current state");
    } else {
        // it's actually a state from history

        let diff = (window.stateHistory.length - 1) - index;

        for (let i = 0; i < diff; i++) {
            let element = window.stateHistory.pop();
            window.undoneStates.push(element);
        }
    }

    wg.state = window.stateHistory[window.stateHistory.length - 1].state.copyConstructor();

    wg.redraw();

    updateFileView();
    updateHistoryView();

}


function redrawIntoState(event) {
    if (event.target.tagName !== 'LI') {
        return;
    }

    /* This is all paused for now since i don't really know if I want it.
    
    
    // Get the clicked <li> index
    const index = Array.from(historyList.children).indexOf(event.target);

    console.log(`You clicked on line ${index + 1}: ${event.target.textContent}`);

    if (index >= window.stateHistory.length) {
        // its actually an 'undone state'
        console.log('this is gonna be hard');
        let future = window.undoneStates[index - window.stateHistory.length];
        let s = future.state;


    } else {
        // it's actually a state from history
        console.log('this is gonna be hard');
        let past = window.stateHistory[index];
        let s = past.state;


    }
    */
}





















function redo(depth = 0) {
    if (window.undoneStates.length === 0) {
        console.log("nothing to redo");
        toast("Nothing to re-do.")
        return;
    }

    console.log('Redo action triggered!');

    // for redo, take the item from what has been undone
    let futureItem = window.undoneStates.pop();

    // now it can be undone
    window.stateHistory.push(futureItem);

    // set a copy of the state to the current state
    window.Grapher.state = futureItem.state.copyConstructor();

    if (window.Grapher.state === null) {
        window.Grapher.context.clearRect(0, 0, window.Grapher.context.canvas.width, window.Grapher.context.canvas.height);
        showFileInput();
        return;
    }

    // a little hacky but it saves us from infinite recursion
    if (depth === 0 && !isValidGraphForMode()) {
        toast("Cannot redo because of current graph mode", true);
        undo(1);
    } else if (depth === 0 && mode === RECONFIGURATION_MODE && futureItem.action !== ActionType.FLIP) {
        toast("Can only redo flips in this mode", true);
        undo(1);
    }

    if (settingsManager.get(SHOW_COLINEAR_TRIPLES_TOGGLE)) {
        allColinearTriples = findAllColinearTriples();
    }

    // this is a bugfix, and i'm not sure why it's needed:
    window.Grapher.state.updateAdjList();
    // end of bugfix

    updateFileView();
    updateHistoryView();
    window.Grapher.redraw();
}



function undo(depth = 0) {
    if (window.stateHistory.length === 0) {
        console.log("Nothing to undo.");
        toast("Nothing to undo.")
        return;
    }



    console.log('Undo action triggered!');

    // for undo, take the item from the history
    let historyItem = window.stateHistory.pop();

    // it can be re-done now:
    window.undoneStates.push(historyItem);

    if (window.stateHistory.length > 0) {
        // the new current state should be whatever's now at the top of the history stack
        window.Grapher.state = window.stateHistory[window.stateHistory.length - 1].state.copyConstructor();
    } else {
        window.Grapher.state = new State([],[]);
    }
    

    // was the last action a 'clear'
    if (window.Grapher.state === null) {
        window.Grapher.context.clearRect(0, 0, window.Grapher.context.canvas.width, window.Grapher.context.canvas.height);
        showFileInput();
        return;
    }


    // a little hacky but it saves us from infinite recursion
    if (depth === 0 && !isValidGraphForMode()) {
        toast("Cannot undo because of current graph mode", true);
        redo(1);
    } else if (depth === 0 && mode === RECONFIGURATION_MODE && historyItem.action !== ActionType.FLIP) {
        toast("Can only undo flips in this mode", true);
        redo(1);
    }




    if (settingsManager.get(SHOW_COLINEAR_TRIPLES_TOGGLE)) {
        allColinearTriples = findAllColinearTriples();
    }
    window.Grapher.state.updateAdjList();
    updateFileView();
    updateHistoryView();
    window.Grapher.redraw();
}











/**
 * @param {State} state must be the state of the graph AFTER the change that is being described by action is applied
 * @param {Enum} action one of ActionType.ADD_VERTEX, ActionType.MOVE_VERTEX, etc
 * @param {String | Number} item1 1st item of formatting, formatting depends on action
 * @param {String | Number} item2 2nd -||-
 * @param {String | Number} item3 3rd -||-
 */
function addToHistory(state, action, item1 = null, item2 = null, item3 = null) {
    let description = getDescription(action, item1, item2, item3);
    let newHistoryItem = new HistoryItem(state, action, description);


    // make sure to drop the 'unone' stuff if we're doding new stuff
    if (window.undoneStates.length > 0) {
        if (!state.equals(window.undoneStates[window.undoneStates.length - 1])) {
            window.undoneStates = [];
        }
    }
 
    window.stateHistory.push(newHistoryItem);
}


function getDescription(action, item1, item2, item3) {
    switch (action) {
        case ActionType.ADD_VERTEX :
            return `Add vertex ${item1}`;
        case ActionType.REMOVE_VERTEX:
            return `Remove vertex ${item1}`;
        case ActionType.MOVE_VERTEX:
            return `Move vertex ${item1} to ${item2}`;
        case ActionType.ADD_EDGE: 
            if (item2 === null) {
                // simple message
                return `Add edge ${item1}`;
            }
            return `Add edge from ${item1[0]} (${item2}) to ${item1[1]} (${item3})`;
        case ActionType.REMOVE_EDGE:
            if (item2 === null) {
                // simple message
                return `Remove edge ${item1}`;
            }
            return `Remove edge from ${item1[0]} (${item2}) to ${item1[1]} (${item3})`;
        case ActionType.MODIFY_EDGE:
            return `Move edge ${item1} to ${item2}`;
        case ActionType.CLEAR_FILE:
            return 'Clear the file';
        case ActionType.IMPORT_FILE:
            return 'Import new file';
        case ActionType.EXPLODE_COORDS:
            return `Explode coordinates by ${item1}`;
        case ActionType.FLIP:
            if (!item3) {
                return `Flip edge ${item1} to ${item2}`;
            }
            return `Flip edge ${item1} and ${item2} via mode ${item3}`;
        default:
            return 'Unknown action';
    }
}

const ActionType = {
    ADD_VERTEX: 0,
    REMOVE_VERTEX: 1,
    MOVE_VERTEX: 2,
    ADD_EDGE: 3,
    REMOVE_EDGE: 4,
    MODIFY_EDGE: 5,
    CLEAR_FILE: 6,
    IMPORT_FILE: 7,
    EXPLODE_COORDS: 8,
    FLIP: 9,
}



class HistoryItem{
    /**
     * 
     * @param {State} state 
     * @param {Number} action from ActionType 
     * @param {String} description 
     */
    constructor(state, action, description) {
        this.state = state;
        this.action = action;
        this.description = description;
    }
}
