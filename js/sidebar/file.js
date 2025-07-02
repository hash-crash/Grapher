/***********************************************************************
 * 
 * This is where file importing and the file representation of the graph
 * are handled. Drag-n-drop logic, parsing of the file and loadin up the
 * graph state from the file.
 * 
 ***********************************************************************/




const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileContentsElem = document.getElementById("filecontents");
const clearFileBtn =  document.getElementById("clearFile");
const filecontentslist = document.getElementById("filecontentslist");

var fcL = "";

var abort = false;

// Process and store the graph file
function handleFiles(files) {

    function handleFile(filePromise) {
    
        permfile = filePromise;
        if ("text/plain" !== filePromise.type)  {
            alert("Please input a plain text file");
            return;
        }
        let reader = new FileReader();
        reader.onload = (event) => {
            fcL = event.target.result;
            let allLines = fcL.split(/\r\n|\n/);
            // Reading line by line
            handleFileLines(allLines);

            if (abort) {
                wg = null;
                window.Grapher = null;
            }
        };
        reader.onerror = (event) => {
            alert("An unexpected error occurred while reading the graph file:" + event.target.error.name + " Line " + line);
        };
        reader.readAsText(permfile);
        //nothing to be done here as  reader.onload() is deferred
    }

    Array.from(files).forEach((file) => {
        // console.log(file)
        handleFile(file);
        // nothing can be done here because reader.onload() is deferred
    });
}


/**
 * Function is not nested inside the others 
 * so that it would be available in autoLoadInputFile 
 **/
function handleFileLines(allLines) {

    let edgesBuffer = [];
    let verticesBuffer = [];
    let line = 1;

    //take first line and remove it from the list
    let firstLineString = allLines.shift();
    let firstLineNumbers = splitLine(firstLineString);
    if (firstLineNumbers == null) {
        abort = true;
        return;
    }

    let nvertices = firstLineNumbers[0];
    let nedges = firstLineNumbers[1];
    // console.log("nedges je" + nedges);
    if (nvertices <= 0 || nedges < 0) {
        alert("The number of vertices and edges (in the first line) must be nonnegative");
        abort = true;
        return;
    }
    // console.log("nv" + nvertices + " ne " + nedges);

    while (line - 1 < nvertices) {
        line += 1;
        let vertex = splitLine(allLines.shift());
        if (vertex == null) {
            abort = true;
            return;
        }
        verticesBuffer.push(vertex);
    }

    while (line - (nvertices + 1) < nedges) {
        line += 1;
        let templine = allLines.shift();
        let edge = splitLine(templine);
        if (edge == null ) {
            alert(`Something went wrong while handling line ${line}, content: ${templine}`);
            abort = true;
            return;
        }
        if (edge[0] <= 0 || edge[1] <= 0) {
            alert(`Error while handling line ${line}, the indices of vertexes start may only from 1 but found ${templine} instead`);
            abort = true;
            return;
        }

        edgesBuffer.push(edge);
    }

    if (mode !== EDIT_MODE || submode !== DEFAULT_EDIT_MODE) {
        mode = EDIT_MODE;
        submode = DEFAULT_EDIT_MODE;
        toast("File imported. Mode reset to free editing.")
    } else {
        toast("File imported.")
    }

    window.Grapher =  new Grapher(new State(edgesBuffer, verticesBuffer), null, ctx);
    wg = window.Grapher;

    let dims = resizeAndCenterGraph();
    window.Grapher.dims = dims;

    window.stateHistory = [];
    window.undoneStates = [];
    addToHistory(wg.state.copyConstructor(), IMOPRT_FILE);

    stateUpdated();
    
    console.log("File handling completed");
    return;
}




let lineRegEx = /\s|,|;/;

/**
 * Turn one line (2 numbers separated by commma, semiclon, or spaces) into the 2 numbers returned as a list.
 */
function splitLine(lineContent) {

    strings = lineContent.split(lineRegEx)
        .filter(Boolean); // empty strings filtered out

    if (strings.length != 2) {
        alert("Unable to parse file at line " + line + ", line content: " + lineContent);
        return null;
    }

    numbers = strings.map((item) => {
            if (isNaN(item)) {
                alert("An unexpected error occurred while reading the graph file: " + item + " is not a number. Line " + line);
                return null;
            }
            return Number(item);
        });
    if (numbers[0] === null || numbers[1] === null) {
        return null;
    }
    return numbers;
 
}








//**************************************************************************************************************************************************************















// INIT:

// Highlight drop zone when a file is dragged over
dropZone.addEventListener("dragover", (event) => {
    event.preventDefault(); // Prevent default behavior
    dropZone.classList.add("dragover");
});

// Remove highlight when drag leaves
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

// Handle file drop
dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");

    let files = event.dataTransfer.files; // Get the files
    handleFiles(files);
});

// Open file input when clicking the drop zone
fileInput.addEventListener("click", () => {
    fileInput.click();
});

// Handle file input change (for selecting files via dialog)
fileInput.addEventListener("change", () => {
    let files = fileInput.files; // Get the selected files
    if (files.length != 1) {
        alert("Please only input 1 file");
    } else {
        handleFiles(files);
    }
});

function clearFile() {
    let newEmptyState = new State([],[]);
    addToHistory(newEmptyState.copyConstructor(), CLEAR_FILE);
    window.Grapher.state = newEmptyState;
    window.Grapher.context.clearRect(0, 0, window.Grapher.context.canvas.width, window.Grapher.context.canvas.height);
    wg.redraw();
    showFileInput();
    updateHistoryView();
}

clearFileBtn.addEventListener("click", clearFile);

/**
 * css manipulation to deal with clear/load events
 */
function showFileContent() {
    fileContentsElem.style.display='block';
    document.querySelectorAll('.file-present-buttons').forEach(element => {
        element.style.display='block'
    });    dropZone.style.display='none';
    fileInput.style.display='none';
}

function showFileInput() {
    fileContentsElem.style.display='none';
    document.querySelectorAll('.file-present-buttons').forEach(element => {
        element.style.display='none'
    });
    dropZone.style.display='flex';
    fileInput.style.display='auto';
}














/**
 * allows the bootup to automatically import a file. specify the filename in script.js
 * 
 * @returns {Promise} promise which will resolve once the file is handled
 */
function autoLoadInputFile(filename) {
    
    return fetch("data/" + filename)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load file: ${response.statusText}`);
        }
        return response.text();
    })
    .then(fileContent => {
        fcL = fileContent;
        temp = fileContent.split(/\r\n|\n/);
        handleFileLines(temp);

        if (abort) {
            wg = null;
            window.Grapher = null;
            console.log("aborted in fetching of data file");
        }
    });

}


