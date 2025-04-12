



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









































/**
 * 
 * @param {Number} index in the vertices array
 * @returns index in edges array of edge which it belongs to
 */
function findEdgeOfVx(index) {
    let relevantEdge = -1;
    wg.state.edges.forEach((e, i) => {
        if (e[0] === index || e[1] === index) {
            relevantEdge = i;
        }
    });
    if (relevantEdge === -1) {
        toast("Something went really wrong", true);
    }
    return relevantEdge;
}



/**
 * 
 * @param {Number} e1 index in edges array
 * @param {Number} e2 index in edges array
 * 
 * 
 */
function drawFlipIndicationMatching(e1, e2) {

    let edge1 = wg.state.edges[e1];
    let edge2 = wg.state.edges[e2];


    if (!isFlipPossibleMatching(edge1, edge2)) {
        console.log("cannot do anything here :(");
        return;
    }

    let p1 = wg.state.vertices[edge1[0]];
    let p2 = wg.state.vertices[edge1[1]];
    let p3 = wg.state.vertices[edge2[0]];
    let p4 = wg.state.vertices[edge2[1]];

    let edgesWithoutEither = wg.state.edges.filter((edge) => {
        return !pequals(edge, edge2) && !pequals(edge, edge2);
    });

    let flips = possibleFlipsMatchingPoints(p1, p2, p3, p4, edgesWithoutEither);

    if (flips === null) {
        console.error("isFlipPossibleMatching says yes, but possibleFlips says no. pick a struggle.");
        return;
    }

    if (flips === 'a' || flips === 'c') {
        drawFlipInsertEdgeA([edge1[0], edge2[0]]);
        drawFlipInsertEdgeA([edge1[1], edge2[1]]);
    }

    if (flips === 'b' || flips === 'c') {
        drawFlipInsertEdgeB([edge1[0], edge2[1]]);
        drawFlipInsertEdgeB([edge1[1], edge2[0]]);
    }




}






function handleClickMatchingsMode(mousePos) {


    if (submode !== MATCHINGS_RECONFIGURATION_MODE) {
        console.error("Only matchings allowed here");
        return;
    }


    if (selectedEdge === -1) {
        // nothing already selected, so we can try to do some stuff: namely, see if the user is selecting an edge or vertex

        let result = findAnyClickedItem(mousePos);
        selectedVx = result.vx;
        selectedEdge = result.edge;

        if (selectedVx !== -1) {
            selectedEdge = findEdgeOfVx(selectedVx);
            selectedVx = -1;
            flipEdges = edgesWithPossibleFlipsMatchings(selectedEdge);

        } else if (selectedEdge === -1) {
            console.log("Found nothing in click");
        }

        flipEdges = edgesWithPossibleFlipsMatchings(selectedEdge);
        return;
    }

    let clickedItem = findAnyClickedItem(mousePos);

    // something was selected, but they clicked on empty space
    if (clickedItem.vx === -1 && clickedItem.edge === -1) {

        if (selectedEdge !== -1 && chosenFlipEdge !== -1) {
            seeIfClickOnFlip(mousePos);
        }


        selectedVx = -1;
        selectedEdge = -1;
        flipEdges = [];
        chosenFlipEdge = -1;
        wg.redraw();
        return;
    }


    
    // Something is already selected. Let's make sure that we have flippable edges:
    let clickedEdge = -1;
    if (clickedItem.vx !== -1) {
        clickedEdge = findEdgeOfVx(clickedItem.vx);
    } else {
        clickedEdge = clickedItem.edge;
    }
    

    if (chosenFlipEdge === -1 && flipEdges.includes(clickedEdge)) {
        chosenFlipEdge = clickedEdge;
    }
    //TODO here consider if clicking on another edge that would be flippable with current selected can be chosen as flippable,
    //  or if it should do nothing, as it does now





    canvas.style.cursor = "auto";
}




function seeIfClickOnFlip(mousePos) {


    let e1 = wg.state.edges[selectedEdge];
    let e2 = wg.state.edges[chosenFlipEdge];
    let flips = possibleFlipsMatching(e1, e2);

    if (flips === null) {
        toast("Something went really wrong. Can't find possible flips", true);
        return;
    }

    let v1 = wg.state.vertices[e1[0]];
    let v2 = wg.state.vertices[e1[1]];
    let v3 = wg.state.vertices[e2[0]];
    let v4 = wg.state.vertices[e2[1]];
    let p1 = wg.dims.toCanvas(v1);
    let p2 = wg.dims.toCanvas(v2);
    let p3 = wg.dims.toCanvas(v3);
    let p4 = wg.dims.toCanvas(v4);
    let minDist = settingsManager.get(PROXIMITY_EDGE);
    if (!minDist) {
        minDist = DEFAULT_EDGE_HOVER_PROXIMITY;
    }

    if (flips === 'a' || flips === 'c') {
        const dist1 = distanceToSegment(mousePos, p1, p3);
        const dist2 = distanceToSegment(mousePos, p2, p4);
        console.log(`v1 ${v1} v2 ${v2}, v3 ${v3}, v4 ${v4}`);
        console.log(dist1);
        console.log(dist2);
        if (dist1 < minDist || dist2 < minDist) {
            flipMatching('a');


            return;
        }
    }

    if (flips === 'b' || flips === 'c') {
        const dist1 = distanceToSegment(mousePos, p1, p4);
        const dist2 = distanceToSegment(mousePos, p2, p3);
        if (dist1 < minDist || dist2 < minDist) {

            flipMatching('b');

            return;
        }
    }
    return;
}









/**
 * @param {Number} e index in main edges array 
 * @returns {[Number]} all indices in edges array which can be flipped WRT e
 */
function edgesWithPossibleFlipsMatchings(e) {
    if (almostPerfectMatching) {
        console.error("This shouldn't be happening here.");
        return [];
    }

    if (e < 0 || e >= wg.state.edges.length) {
        console.log("Edge index out of bounds when finding all possible flips for an edge.");
        return [];
    }

    let inputEdge = wg.state.edges[e];

    let flippable = [];
    wg.state.edges.forEach((edgeToCheck, i) => {

        if (i === e) {
            return;
        }

        if (!isFlipPossibleMatching(inputEdge, edgeToCheck)) {
            return; // @ foreach
        } 

        flippable.push(i);

    });

    return flippable;
}


/**
 * 
 * @param {[Number, Number]} e1 
 * @param {[Number, Number]} edgeToCheck 
 * @returns {boolean} 
 */
function isFlipPossibleMatching(e1, e2) {
    return possibleFlipsMatching(e1, e2) !== null;
}

/**
 * @returns 'a' if p1-p3, p2-p4 is only possible
 *          'b' if p1-p4, p2-p3 is only possible
 *          'c' if both are possible
 *          null if none is possible
 */
function possibleFlipsMatching(e1, e2) {
    if (almostPerfectMatching) {
        console.log("TODO");
        return null;
    }

    if (pequals(e1, e2)) {
        return null;
    }

    let p1 = wg.state.vertices[e1[0]];
    let p2 = wg.state.vertices[e1[1]];
    let p3 = wg.state.vertices[e2[0]];
    let p4 = wg.state.vertices[e2[1]];

    let edgesWithoutEither = wg.state.edges.filter((edge) => {
        return !pequals(edge, e1) && !pequals(edge, e1);
    });

    return possibleFlipsMatchingPoints(p1, p2, p3, p4, edgesWithoutEither);
}


/**
 * @param {[Number, Number]} p1 coords 1 of e1
 * @param {[Number, Number]} p2 coords 2 of e1
 * @param {[Number, Number]} p3 coords 1 of e2
 * @param {[Number, Number]} p4 coords 2 of e2
 * @param {[[Number, Number]]} otherEdges edges list, same as wg.state.edges, but without the edge connecting p1-p2 and p3-p4 
 * 
 * @see possibleFlipsMatching
 */
function possibleFlipsMatchingPoints(p1, p2, p3, p4, otherEdges) {

    let a = true;
    if (intersects(p1, p3, p2, p4) || intersectsAny(p1, p3, null, otherEdges) || intersectsAny(p2, p4, null, otherEdges)) {
        a = false;
    }

    let b = true;
    if (intersects(p1, p4, p2, p3) || intersectsAny(p1, p4, null, otherEdges) || intersectsAny(p2, p3, null, otherEdges)) {
        b = false;
    }

    return a && b ? 'c' : 
                a ? 'a' :
                b ? 'b' :
                null;

}
