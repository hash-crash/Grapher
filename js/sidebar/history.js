/**
 * Here is where the history of the changes to the graph is stored and handled.
 * 
 * Doing this allows us to traverse the changes that happened to the graph
 * using undo() and redo()
 * 
 * It is quite important that each history item stores the state of the graph 
 * that happens AFTER the change in its description is applied. 
 * This is also how the highlighting in the 
 */



let historyList = document.getElementById('changehistorylistid');





function updateHistoryView() {
    historyList.innerHTML = convertToHistoryLines();

    historyList.addEventListener('click', jumpToLine);
    historyList.addEventListener('mouseover', redrawIntoState);
    historyList.addEventListener('mouseleave', doaredraw);

}

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

        for (let i = 0; i < j; i++) {
            const element = window.undoneStates[i];
            window.stateHistory.push(element);

            
        }


    } else {
        // it's actually a state from history

        


    }

    wg.redraw();

    // todo maybe move these into wg.redraw()???????
    updateFileView();
    updateHistoryView();

}


function redrawIntoState(event) {
    if (event.target.tagName !== 'LI') {
        return;
    }

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

}





















function redo() {
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

    updateFileView();
    updateHistoryView();
    window.Grapher.redraw();
}



function undo() {
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

    updateFileView();
    updateHistoryView();
    window.Grapher.redraw();
}












function addToHistory(state, action, item1 = null, item2 = null, item3 = null) {
    let description = getDescription(action, item1, item2);
    let newHistoryItem = new HistoryItem(state, action, description);

    window.stateHistory.push(newHistoryItem);
}


function getDescription(action, item1, item2, item3) {
    switch (action) {
        case ADD_VERTEX :
            return `Add vertex ${item1}`;
        break;
        case REMOVE_VERTEX:
            return `Remove vertex ${item1}`;
        break;
        case MOVE_VERTEX:
            return `Move vertex ${item1} to ${item2}`;
        break;
        case ADD_EDGE: 
            if (item2 === null) {
                // simple message
                return `Add edge ${item1}`;
            }
            return `Add edge from ${item1[0]} (${item2}) to ${item1[1]} (${item3})`;
        break;
        case REMOVE_EDGE:
            if (item2 === null) {
                // simple message
                return `Remove edge ${item1}`;
            }
            return `Remove edge from ${item1[0]} (${item2}) to ${item1[1]} (${item3})`;
        break;
        case MODIFY_EDGE:
            return `Move edge ${item1} to ${item2}`;
        break;
        case CLEAR_FILE:
            return 'Clear the file';
        break;
        case IMOPRT_FILE:
            return 'Import new file'
        default:
            return 'Unknown action';
    }
}


const ADD_VERTEX = 0;
const REMOVE_VERTEX = 1;
const MOVE_VERTEX = 2;
const ADD_EDGE = 3;
const REMOVE_EDGE = 4;
const MODIFY_EDGE = 5;
const CLEAR_FILE = 6;
const IMOPRT_FILE = 7;




class HistoryItem{
    constructor(state, action, description) {
        this.state = state;
        this.action = action;
        this.description = description;
    }

}