

function handleHoverReconfigurationMode(mousePos) {
    let found = false;
    highlightedEdge = -1;

    // Check proximity to all vertices
    window.Grapher.state.vertices.forEach((v, i) => {
        if (isNearVertex(mousePos, v)) {
            highlightedVx = i;
            found = true;
            if (isDraggingCanvas) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'pointer';
            }
        }
    });

    if (!found) {
        highlightedVx = -1;
        let closestDistance = Infinity;

        window.Grapher.state.edges.forEach((edge, i) => {
            
            const v1 = window.Grapher.dims.toCanvas(window.Grapher.state.vertices[edge[0]]);
            const v2 = window.Grapher.dims.toCanvas(window.Grapher.state.vertices[edge[1]]);
            
            // I think this is redundant, but I'd rather be safe than sorry
            if (isNearVertex(mousePos, window.Grapher.state.vertices[edge[0]]) || 
                isNearVertex(mousePos, window.Grapher.state.vertices[edge[1]])) {
                return;
            }

            const dist = distanceToSegment(mousePos, v1, v2);
            let minDist = settingsManager.get(PROXIMITY_EDGE);
            if (!minDist) {
                minDist = DEFAULT_EDGE_HOVER_PROXIMITY;
            }
            if (dist < minDist && dist < closestDistance) {
                closestDistance = dist;
                highlightedEdge = i;
            }
        });

        if (isDraggingCanvas) {
            canvas.style.cursor = 'move';
        } else if (highlightedEdge !== -1) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }
    }
    return found;
}






let workerObject = null;
function initWorker() {

    if (window.location.protocol === 'file:') {
        console.error('Web Workers are not supported in file:// protocol. "Find all possible flips" functionality will not work.');
        toast("Find all possible flips only works in HTTP protocol.", true, 6);
        return null;
    }
    workerObject =  new Worker('js/graphlogic/worker.js');
    if (!workerObject) {
        return;
    }
    workerObject.postMessage( { type: 'init' } );

    // Handle incremental results
    workerObject.onmessage = (e) => {
        if (e.data.type === 'partial') {
        console.log(`Received ${e.data.count} results so far...`);
        e.data.data.forEach(result => {
            // Process individual result
            processResult(result);
        });
        }
        else if (e.data.type === 'complete') {
        console.log(`TOTAL RESULTS: ${e.data.totalCount}`);
        }
        else if (e.data.type === 'error') {
        console.error('Worker Error:', e.data.message);
        console.error(e.data.stack);
        }
  };

}   

initWorker();

function getAllPossibleFlipsWorker() {

    console.log(`Starting worker for operation: ${submode}`);
    workerObject.postMessage({
        type: 'start',
        operation: submode,  // or 'triangulation'
        state: JSON.stringify(wg.state)
    });      

}




function processResult(result) {
    // Process the result as needed
    console.log('Processing result:', result);
    // For example, you could store it in a global array or update the UI
    allPossibleFlips.push(result);
    drawPossibleFlips();
    wg.redraw();
}
