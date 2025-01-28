


function drawEdge(e) {
    // console.log('e');
    // console.log(e);
    // console.log(wg.state.vertices[e[0]]);
    // console.log(wg.state.vertices[e[1]]);



    let s = wg.dims.toCanvas(wg.state.vertices[e[0]]);
    let end = wg.dims.toCanvas(wg.state.vertices[e[1]]);
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth = 1;
}


function drawHighlightedEdge(e) {
    ;
}




// Simple solid black circle
function drawVx(v) {

    let c = wg.dims.toCanvas(v);
    let r = 5;
    ctx.beginPath();
    ctx.arc(c[0], c[1], r, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";

}


function drawSelectedVx(v) {

    let c = wg.dims.toCanvas(v);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(c[0], c[1], 11, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
    

    ctx.fillStyle = "darkgreen";
    ctx.font = "20px sans serif"
    //todo get better coords for text based on pixel color
    // ctx.fillText(`Selected vertex: ${i} (${v[0]}, ${v[1]})`, 0.5 * this.dims.minpx[0], 0.5 * this.dims.minpx[1]);



    ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
}

function drawHighlighedVx(v) {

}




















function isNearVertex(mousepos, vx) {
    let cc = wg.dims.toCanvas(vx);

    let d = Math.sqrt((cc[0] - mousepos["x"]) ** 2 + (cc[1] - mousepos["y"]) ** 2);

    return d < 7;

}


function getMousePos(event) {

    const rect = canvas.getBoundingClientRect(); // Get canvas position
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}


function handleHover(event) {
    if (!window.Grapher?.state?.vertices) {
        console.log("no state while handling hover");
        return;
    }

    mousePos = getMousePos(event);

    window.Grapher.redraw();

}

function handPointerOverVertex(mousePos) {
    // Check each object for hover
    let i = 0;
    for (const obj of window.Grapher.state.vertices) {
        if (isNearVertex(mousePos, obj)) {

            console.log(`Hovering over object ${obj}`);
            canvas.style.cursor = "pointer";

            return; // Stop checking further objects
        }
        i += 1;
    }
    canvas.style.cursor = "auto";
    return;
}
 
function handleClick(event) {
    if (!window.Grapher?.state?.vertices) {
        return;
    }

    const mousePos = getMousePos(event);

    console.log("onclick handler called at " + mousePos.x + " and " + mousePos.y);
    
    let i = 0;

    if (window.Grapher.state.mode == NORMAL) {
        // Check each object for a click
        for (const obj of window.Grapher.state.vertices) {
            console.log(obj);
            // for now doing nothing here
            if (isNearVertex(mousePos, obj)) {
                selectedVx = i;
                console.log(`Clicked on object ${obj}`);
                window.Grapher.redraw();
                return; // Stop checking further objects
            }
            i += 1;
        }
        selectedVx = -1;
    } else if (window.Grapher.state.mode == MOVE) {
        if (selectedVx === -1 ) {

        } else {
            canvas.style.cursor = "auto";
        }
        

    } else if (window.Grapher.state.mode == ADD) {

    }
}





function drawHihglightedCoordinate(mousePos) {


    if (selectedVx === -1) {
        return;
    }
    
    const graphCoords = window.Grapher.dims.toCoords([mousePos.x, mousePos.y]);
    const closestGraphCoord = [
        Math.round(graphCoords[0]),
        Math.round(graphCoords[1])
    ];
    const canvasCoord = wg.dims.toCanvas(closestGraphCoord);
    
    const crossSize = 15; // Size of the diagonal cross
    
    console.log(mousePos);
    console.log(`trying to draw cross mouse graph coords: mousePos: ${mousePos} ${graphCoords}, closest: ${closestGraphCoord}, canvasC: ${canvasCoord}`);
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;

    // Draw diagonal cross
    ctx.beginPath();
    ctx.moveTo(canvasCoord[0] - crossSize, canvasCoord[1] - crossSize);
    ctx.lineTo(canvasCoord[0] + crossSize, canvasCoord[1] + crossSize);
    ctx.moveTo(canvasCoord[0] - crossSize, canvasCoord[1] + crossSize);
    ctx.lineTo(canvasCoord[0] + crossSize, canvasCoord[1] - crossSize);
    ctx.stroke();
    ctx.closePath();

}

function drawBackgroundCoordinateGrid() {
    if (!window.Grapher?.state?.vertices) {
        console.log("no state while handling hover");
        return;
    }


    const maxLines = 150;
    const { minc, maxc, ratio } = wg.dims;
    
    // Calculate step size to limit the number of lines
    let stepX = Math.max(1, Math.ceil((maxc[0] - minc[0]) / maxLines));
    let stepY = Math.max(1, Math.ceil((maxc[1] - minc[1]) / maxLines));

    ctx.strokeStyle = "rgba(192, 192, 192, 0.5)";
    ctx.lineWidth = 1;

    // Draw vertical lines


    for (let x = Math.ceil(minc[0] / stepX) * stepX; x <= maxc[0]; x += stepX) {
        const canvasX = wg.dims.toCanvas([x, minc[1]])[0];
        ctx.beginPath();
        ctx.moveTo(canvasX, wg.dims.minpx[1]);
        ctx.lineTo(canvasX, wg.dims.maxpx[1]);
        ctx.stroke();
        ctx.closePath();
    }

    // Draw horizontal lines
    for (let y = Math.ceil(minc[1] / stepY) * stepY; y <= maxc[1]; y += stepY) {
        const canvasY = wg.dims.toCanvas([minc[0], y])[1];
        ctx.beginPath();
        ctx.moveTo(wg.dims.minpx[0], canvasY);
        ctx.lineTo(wg.dims.maxpx[0], canvasY);
        ctx.stroke();
        ctx.closePath();
    }





    cooridinateMarkings();


}


function cooridinateMarkings() {
    let xmousemark = null;
    let ymousemark = null;

    wg = window.Grapher;

    if (selectedVx !== -1) {
        xmousemark = wg.state.vertices[selectedVx][0];
        ymousemark = wg.state.vertices[selectedVx][1];
    }

    if (xmousemark == null || ymousemark == null) {
        normalCoordinateMarkings();
    } else {
        selectedCoordinateMarkings([xmousemark, ymousemark]);
    }
}

function selectedCoordinateMarkings(selectedCoords) {
    
}

function normalCoordinateMarkings() {
    let dc = wg.dims.difc;

    let difp = [wg.dims.maxpx[0] - wg.dims.minpx[0], wg.dims.maxpx[1] - wg.dims.minpx[1]];

    let ratios = [difp[0] / dc[0], difp[1] / dc[1]];

    console.log(dc);
    console.log(difp);
    console.log(ratios);
    
    let xsteps = Math.ceil(40 / ratios[0]);

    console.log(xsteps);
    for (let i =  wg.dims.minc[0]; i <  wg.dims.maxc[0]; i += xsteps) {
        let pos = wg.dims.toCanvas([i, wg.dims.maxc[1]]);
        // shift y axis down
        pos[1] = pos[1] + VERTICAL_OFFSET_FOR_MARKINGS;     

    }
    
    
    let ysteps = Math.ceil(40 / ratios[1]);


    for (let i = wg.dims.minc[1]; i < wg.dims.maxc[1]; i += ysteps) {
        let pos = wg.dims.toCanvas([i, wg.dims.maxc[1]]);
        // shift x axis to the right
        pos[0] = pos[0] + HORIZONTAL_OFFSET_FOR_MARKINGS;
    }




}

const VERTICAL_OFFSET_FOR_MARKINGS = 15;
const HORIZONTAL_OFFSET_FOR_MARKINGS = 15;






document.addEventListener('keydown', function (event) {
    let tagName = event.target.tagName.toLowerCase();
    if (tagName === 'form' || tagName === 'input' || tagName === 'textarea' || event.target.isContentEditable) {
        return;
    }


    // Detect undo: Ctrl+Z or Cmd+Z or u or shift+U
    if ((event.key === 'u'  && !event.shiftKey) || (event.key === 'U' && EventTarget.shiftKey)
             || ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey)) {
        undo();
        console.log("undo done");
        return;
    }

    // Detect redo: Ctrl+Shift+Z or Cmd+Shift+Z or shift+u or U
    else if (( event.shiftKey && (event.key === 'u' || ((event.ctrlKey || event.metaKey) && event.key === 'z'))) 
            || (event.key === 'U' && !event.shiftKey)) {  
        redo();  
        console.log("redo done");
        return;
    } 

    //if no state, the rest doesn't make sense. At least undo and redo can recover state.
    if (!window.Grapher.state) {
        return;
    }
    
    if (event.key === 'm') {
        console.log("state.mode is now move");
        window.Grapher.state.mode = MOVE;
    } else if (event.key === 'n' || event.key === 'Escape' || event.key === 'Esc') {
        console.log("escape or n clicked, now normal mode")
        if (window.Grapher.state.mode === NORMAL) {
            selectedVx = -1;
        } else {
            window.Grapher.state.mode = NORMAL;
        }
    } else if (event.key === 'e' || event.key === 'j') {
        
        window.Grapher.state.mode = EDGE;
    } else if (event.key === 'Delete' || event.key == 'Backspace') {
        //delete
        deleteItem();
    }
})
















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





const moveIcon = new Image();
moveIcon.src = "assets/move.svg";

function handleDrag(event) {
    console.log("dragging");
    console.log(event);
}


function rightclick(event) {
    event.preventDefault();

    console.log(`right clicked at ${getMousePos(event).x} ${getMousePos(event).y}`)
    
}

function md(event) {
    switch (event.which) {
        case 1: console.log('left'); lmd(event); break;
        case 2: console.log('middle'); mmd(event); break;
        case 3: console.log('right'); rmd(event); break; 
      }
}

function mmd(event) {
    handleClick(event);
}

function lmd(event) {
    handleClick(event);
}

function rmd(event) {
    handleClick(event);
}
    

function mu(event) {
    console.log("mouseUp");
    console.log(event);
}


canvas.addEventListener('mousemove', handleHover);
canvas.addEventListener('mouseup', mu);
canvas.addEventListener('mousedown', md);


// canvas.addEventListener('contextmenu', rightclick)
// canvas.addEventListener('click', handleClick);


