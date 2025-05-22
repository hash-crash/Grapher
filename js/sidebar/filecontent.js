


/**
 * This is the main function that should be called any time that the state of the graph changes in any way, 
 * to make sure that the file representation is coherent to the canvas representation 
 */
function updateFileView() {

    filecontentslist.innerHTML = 
    `<li class="fileListHeaderLine">
        Vertices: <span style='color: royalblue'>${"".concat(window.Grapher.state.vertices.length)}</span> 
        Edges: <span style='color: firebrick'>${"".concat(window.Grapher.state.edges.length)}</span>
    </li>
    <div id="vertexlist" class="file-contents--vertices-border">
        ${covnertToLines(window.Grapher.state.vertices)}
    </div>
    <div id="edgelist" class="file-contents--edges-border">
        ${covnertToLines(window.Grapher.state.edges, false)}
    </div>`

    var edgelist = document.getElementById("edgelist");
    var vertexlist = document.getElementById("vertexlist");

    // console.log(edgelist);
    // console.log(vertexlist);


    edgelist.addEventListener('click', selectEdgeLine);
    vertexlist.addEventListener('click', selectVxLine);




    edgelist.addEventListener('mouseover', highlightEdgeLine);
    vertexlist.addEventListener('mouseover', highlightVxLine);


    edgelist.addEventListener('mouseleave', dehighlightEdge);
    vertexlist.addEventListener('mouseleave', dehighlightVx);




    edgelist.addEventListener('dblclick', editEdgeLine);
    vertexlist.addEventListener('dblclick', editVxLine);

    showFileContent();
}




function covnertToLines(things, vertices=true) {
    if (vertices) {
        return things.map(([x,y]) => [Math.round((x + Number.EPSILON) * 100) / 100, Math.round((y + Number.EPSILON) * 100) / 100

        ]).map(([x, y]) => 
            `<li class="verticesListItem">${pad(x)},${pad(y)}</li>`
          ).join('');
    } else {
        // edges need to have their indexes adjusted by 1 so they are 1-based for the user representation
        return things.map(([x, y]) => 
            `<li class="edgesListItem">${pad(x + 1)},${pad(y + 1)}</li>`
          ).join('');
    }
}


function pad(value) {
    const nbsp = '\u00A0'; // Non-breaking space
    return String(value).padStart(3, nbsp);
}



function selectEdgeLine(event) {
    if (event.target.tagName !== 'LI') {
        return;
    }

    if (event.detail > 1) {
        return;
    }

    if (mode !== EDIT_MODE) {
        return;
    }


    // Get the clicked <li> index
    const index = Array.from(edgelist.children).indexOf(event.target);


    console.log(`You clicked on edge ${index + 1}: ${event.target.textContent}`);

    selectedEdge = index;
    window.Grapher.redraw();
    
}    
function selectVxLine(event) {

    if (event.target.tagName !== 'LI') {
        return
    }

    // prevent the second click on the same element
    if (event.detail > 1) {
        return;
    }

    if (mode !== EDIT_MODE) {
        return;
    }

    // Get the clicked <li> index
    const index = Array.from(vertexlist.children).indexOf(event.target);

    console.log(`You clicked on vertex ${index + 1}: ${event.target.textContent}`);

    selectedVx = index;
    window.Grapher.redraw();
}

function highlightEdgeLine(event) {
    if (event.target.tagName !== 'LI') {
        return;
    }

    // Get the clicked <li> index
    const index = Array.from(edgelist.children).indexOf(event.target);

    highlightedEdge = index;

    wg.redraw();

}
function highlightVxLine(event) {
    if (event.target.tagName !== 'LI') {
        return;
    }

    // Get the clicked <li> index
    const index = Array.from(vertexlist.children).indexOf(event.target);

    highlightedVx = index;

    wg.redraw();

}






function dehighlightVx(event) {
    highlightedVx = -1;
    wg.redraw();
}
function dehighlightEdge(event) {
    highlightedEdge = -1;
    wg.redraw();
}









function editEdgeLine(event) {

    if (event.target.tagName !== 'LI') {
        return;
    }

    event.stopPropagation();

    if (mode !== EDIT_MODE) {
        return;
    }

    // Get the clicked <li> index
    const index = Array.from(edgelist.children).indexOf(event.target);

    let li = event.target;
    let originalText = li.textContent;
    let originalEdge = wg.state.edges[index];

    li.style.cursor = "auto";

    console.log(`You doubleclicked on edge ${index + 1}: ${event.target.textContent}`);
    
    li.innerHTML = `
    <div class="fileeditline">
        s: <input class="fileeditbox" type="number" id="startInput" value="${originalEdge[0] + 1}" />
        e: <input class="fileeditbox" type="number" id="endInput" value="${originalEdge[1] + 1}" />
        <button id="applyBtnId" class="applyBtn">Apply</button>
    </div>
    `;

    let startInput = li.querySelector('#startInput');
    let endInput = li.querySelector('#endInput');
    let btn = li.querySelector('#applyBtnId');

    // Focus the first input
    startInput.focus();

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            // Revert to the original text
            li.textContent = originalText;
            li.style.cursor = "pointer";
            document.removeEventListener('keydown', handleKeydown);
        } else if (event.key === 'Enter') {
            // Perform validation
            attemptPersist();
        }
    }

    function attemptPersist() {
        const startValue = parseInt(startInput.value, 10);
        const endValue = parseInt(endInput.value, 10);

        if (isNaN(startValue) || isNaN(endValue)) {
            toast('Invalid input! Please enter valid numbers.', true);
            return;
        }

        let successfulEdit = editEdge(originalEdge, [startValue - 1, endValue - 1]);
        if (!successfulEdit) {
            return;
        }

        // Apply the new values to html
        li.textContent = `${pad(startValue)},${pad(endValue)}`;
        li.style.cursor = "pointer";

        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('mousedown', handleClickOutside);
    }

    function handleClickOutside(event) {
        if (li !== event.target && !li.contains(event.target)) {
            li.textContent = originalText;
            li.style.cursor = "pointer";
            document.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }

    // Attach keydown listener
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousedown', handleClickOutside);
    btn.addEventListener('click', attemptPersist);
}







function editVxLine(event) {

    if (event.target.tagName !== 'LI') {
        return
    }

    event.stopPropagation();

    if (mode !== EDIT_MODE) {
        return;
    }

    // Get the clicked <li> index
    const index = Array.from(vertexlist.children).indexOf(event.target);

    let li = event.target;
    let originalText = li.textContent;
    let originalVx = wg.state.vertices[index];

    li.style.cursor = "auto";

    console.log(`You doubleclicked on vertex ${index + 1}: ${event.target.textContent}`);

    li.innerHTML = `
    <div class="fileeditline">
        x: <input class="fileeditbox" type="number" id="xinput" value="${originalVx[0]}" />
        y: <input class="fileeditbox" type="number" id="yinput" value="${originalVx[1]}" />
        <button id="applyvxbtnid" class="applyBtn">Apply</button>
    </div>
    `;

    let xinput = li.querySelector('#xinput');
    let yinput = li.querySelector('#yinput');
    let btn = li.querySelector('#applyvxbtnid');

    xinput.focus();

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            // Revert to the original text
            li.textContent = originalText;
            li.style.cursor = "pointer";
            document.removeEventListener('keydown', handleKeydown);
        } else if (event.key === 'Enter') {
            // Perform validation
            attemptPersist();
        }
    }

    function attemptPersist() {
        const xValue = parseInt(xinput.value, 10);
        const yValue = parseInt(yinput.value, 10);

        if (isNaN(xValue) || isNaN(yValue)) {
            toast('Invalid input! Please enter valid numbers.', true);
            return;
        }

        let successfulEdit = moveVertex(originalVx, [xValue, yValue]);
        if (!successfulEdit) {
            return;
        }

        // Apply the new values to html
        li.textContent = `${pad(xValue)},${pad(yValue)}`;
        li.style.cursor = "pointer";

        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('mousedown', handleClickOutside);
    }

    function handleClickOutside(event) {
        if (li !== event.target && !li.contains(event.target)) {
            li.textContent = originalText;
            li.style.cursor = "pointer";
            document.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }

    // Attach keydown listener
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousedown', handleClickOutside);
    btn.addEventListener('click', attemptPersist);

}

function downloadFileContent() {
    const fileContent = settingsManager.get(USE_IPE_FORMAT) ? graphToIPE() : graphToCSV();

    // Generate the filename dynamically with ISO date including seconds
    const now = new Date();
    const isoDateWithSeconds = now.toISOString().replace(/:/g, "-").split(".")[0]; // Replace colons for filename safety
    const filename = `graph_${isoDateWithSeconds}${settingsManager.get(USE_IPE_FORMAT) ? '.ipe' : '.csv'}`;

    // Create a Blob from the file content
    const blob = new Blob([fileContent], { type: "text/plain" });

    // Create a Blob URL
    const url = URL.createObjectURL(blob);

    // Create a temporary <a> element
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // Use the dynamic filename
    document.body.appendChild(a); // Append the element temporarily

    a.click(); // Simulate a click to trigger download

    document.body.removeChild(a); // Clean up the DOM
    URL.revokeObjectURL(url); // Release the Blob URL
}

function copyFileContent() {
    let fc = graphToCSV();

    navigator.clipboard.writeText(fc).then(() => {
        console.log("File contents copied to clipboard!");
        toast("File contents copied");
    })
    .catch((err) => {
        console.error("Failed to copy text: ", err);
        toast("Failed to copy text :(", true);
    });

}

function graphToIPE() {
    return `<?xml version="1.0"?>
<!DOCTYPE ipe SYSTEM "ipe.dtd">
<ipe version="70218" creator="Grapher">
<ipestyle name="basic">
<pen name="heavier" value="0.8"/>
<symbol name="mark/fdisk(sfx)" transformations="translations">
<group>
<path fill="sym-fill">
0.5 0 0 0.5 0 0 e
</path>
<path fill="sym-stroke" fillrule="eofill">
0.6 0 0 0.6 0 0 e
0.4 0 0 0.4 0 0 e
</path>
</group>
</symbol>
</ipestyle>
<page>
    <layer name="vertices"/>
    <layer name="edges"/>
    <view layers="vertices edges" active="edges"/>
    ${edgesToIPEPaths()}
    ${verticesToIPENodes()}
</page>
</ipe>
`;
}

function verticesToIPENodes() {
    return wg.state.vertices.map(
        (v) => `
        <use layer="vertices" name="mark/fdisk(sfx)" pos="${v[0]} ${v[1]}" size="normal" stroke="black" fill="white"/>`
    ).join("\n");
}

function edgesToIPEPaths() {
    return wg.state.edges.map(
        (e) => {
            return `
            <path layer="edges" stroke="black" pen="heavier">
                ${wg.state.vertices[e[0]][0]} ${wg.state.vertices[e[0]][1]} m
                ${wg.state.vertices[e[1]][0]} ${wg.state.vertices
                [e[1]][1]} l
            </path>`;
        }
    ).join("");
}

function graphToCSV() {
return `${wg.state.vertices.length},${wg.state.edges.length}
${verticesToCSV()}
${edgesToCSV()}`;
}

function verticesToCSV() {
    return wg.state.vertices.map((v) => `${v[0]},${v[1]}`).join("\n");
}

function edgesToCSV() {
    return wg.state.edges.map((e) => `${e[0] + 1},${e[1] + 1}`).join("\n");
}





