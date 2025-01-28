/**
 * 
 */
class Dims {
    constructor(minpx, maxpx, minc, maxc, difc, ratio) {
        this.minpx = minpx;
        this.maxpx = maxpx;
        this.minc = minc;
        this.maxc = maxc;
        this.difc = difc;
        this.ratio = ratio;
    };
    toCoords (canvasPosition) {
        return [
            Math.round(((canvasPosition[0] - this.minpx[0]) / this.ratio[0]) + this.minc[0]),
            Math.round(
                (
                    (this.maxpx[1] - canvasPosition[1]) 
                    /
                    this.ratio[1]
                )
                 +
                  this.minc[1]
            ) 
        ]
    }
    toCanvas (coords) {
        return [
            this.minpx[0] +
            (
                (coords[0] - this.minc[0])
                 *
                this.ratio[0]
            ),
            this.maxpx[1] -
            (
                (coords[1] - this.minc[1]) 
                *
                this.ratio[1]
            )
        ];
    }
    
}


function resizeCanvas() {


    if (window.innerWidth > 768) {
        s.mobileScreen = false;
        canvas.height=window.innerHeight;
        canvas.width=window.innerWidth*0.8;
    }
    else {
        s.mobileScreen = true;
        canvas.height = window.innerHeight * 0.8;
        canvas.width = window.innerWidth;
    }
    return [canvas.width, canvas.height];
}

// util function for creating new dimensions from current window and graph state
function refreshDims() {
    let pixelsizes = resizeCanvas();
    let minpxL = [];
    let maxpxL = [];
    if (s.mobileScreen) {
        // on narrow screens we leave space for toolbars on the top and botom
        minpxL = [0,  0.1 * pixelsizes[1]];
        maxpxL = [pixelsizes[0], 0.9 * pixelsizes[1]];
    } else {
        // on wide screens we leave space for toolbars on the sides
        minpxL = [ Math.round(0.1 * pixelsizes[0]),  Math.round(0.03*pixelsizes[1])];
        maxpxL = [ Math.round(0.9 * pixelsizes[0]),  Math.round(0.97*pixelsizes[1])];
    }
    let mincoordsL = getMinCoords();
    let maxcoordsL = getMaxCoords();


    let difpL = [maxpxL[0] - minpxL[0], maxpxL[1] - minpxL[1]]
    let difcL = [maxcoordsL[0] - mincoordsL[0], maxcoordsL[1] - mincoordsL[1]];

    
    let ratioL = [(0.8 * pixelsizes[0]) / difcL[0], (0.8 * pixelsizes[1]) / difcL[1]];


    let minratio = [];
    let actdifcL = [];
    let actualMaxC = [];
    let actualMinC = [];


    if (ratioL[0] < ratioL[1]) {
        // the actual graph is 'wide' in the screen?
        // x ratio is smaller, so 'utilize space' rectangles are tall


        // we take the x ratio as the universal ratio
        minratio = [ratioL[0], ratioL[0]];

        let ydif = Math.round(difpL[1] / ratioL[0]);

        actdifcL = [difcL[0], ydif];



        // now to center the image within actual coordinate difference
        let bonusy = actdifcL[1] - difcL[1];
        let topbonusy = -1;
        if (bonusy % 2 === 1) {
            topbonusy = Math.floor(bonusy / 2);
        } else {
            topbonusy = bonusy / 2;
        }
        let bottombonusy = bonusy - topbonusy;

        actualMinC = [mincoordsL[0], mincoordsL[1] - topbonusy];
        actualMaxC = [maxcoordsL[0], maxcoordsL[1] + bottombonusy];


        
    } else {
        //TODO: this section is untested

        // the actual graph is 'tall' in the screen?
        // x ratio is bigger so 'utilize space' rectangles are wide 



        // we take the y ratio as the universal ratio
        minratio = [ratioL[1], ratioL[1]];


        let xdif = Math.round(difpL[0] / ratioL[1]);

        actdifcL = [xdif, difcL[1]];


        // now to center the image within actdifcl
        let bonusx = actdifcL[0] - difcL[0];
        let lbonusx = -1;
        if (bonusx % 2 === 1) {
            lbonusx = Math.floor(bonusx / 2);
        } else {
            lbonusx = bonusx / 2;
        }
        let rbonusx = bonusx - lbonusx;

        actualMinC = [mincoordsL[0] - lbonusx, mincoordsL[1]];
        actualMaxC = [maxcoordsL[0] + rbonusx, maxcoordsL[1]];

    }










    let r =  new Dims(minpxL, maxpxL, actualMinC, actualMaxC, actdifcL, minratio);



    // log outs:
    {
        // console.log(pixelsizes);
        // console.log(minpxL);
        // console.log(maxpxL);
        // console.log(difpL);
        // console.log("minc, maxc");
        // console.log(mincoordsL);
        // console.log(maxcoordsL);
        // console.log("difc, rat");
        // console.log(difcL);
        // console.log(ratioL);
        // console.log("actdifcL:");
        // console.log(actdifcL);
        // console.log(r);
    }





    return r;
} 