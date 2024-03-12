let scrollInterval = 600;

let canvasWidth = 800;
let canvasHeight = 600;

let frameNum = 15;
let frameNumToHeight = function (frameNum) {
  return (frameNum + 1) * 600;
};

let initialFrameDuration = 1;

let fontDefinitions = {
  "Comic Neue": `<style>
    @font-face {
      font-family: "Comic Neue";
      src: url("fonts/ComicNeue-Bold.ttf") format("truetype");
    }
    </style>`,
  "Rainy Hearts": `<style>
    @font-face {
      font-family: "Rainy Hearts";
      src: url("fonts/rainyhearts.ttf") format("truetype");
    }
    </style>`,
  "Bad Comic": `<style>
    @font-face {
      font-family: "Bad Comic";
      src: url("fonts/BadComic-Regular.ttf") format("truetype");
    }
    </style>`,
};

let exportScript = `

let currentCueIndex = 0;

let dimensions = {
  w: 800,
  h: 600
}
      let sceneContainer = document.querySelector("#sceneContainer");
      let scrollContainer = document.querySelector("#scrollContainer");
      let scrollPos = 0;
      let interval = 600;


      let currentSceneEls = [];
      let prevSceneEls = [];
      let frameNum = parseInt(scrollContainer.dataset.frameNum);
      let sceneEls =  document.querySelectorAll(".sceneEl");

      let setPageHeight = function(){
        let lastFrameBuffer;
        if (window.innerHeight < 600){
          lastFrameBuffer = 0;
        } else if (window.innerHeight >= 600) {
          lastFrameBuffer =  window.innerHeight-600+100;
        }
        scrollContainer.style.height = ((frameNum+1)*600+lastFrameBuffer)+'px';

      }

      setPageHeight();


      // Script for animating comic

      // Keys: the cue number
      // Values: an array of scene Els
      let cuesToEls = {};

     let initializeCues = function(){

      //Initialize list
      for (let i = 0; i < frameNum+1; i++) {
        cuesToEls[i] = [];
      }
      sceneEls.forEach(function (sceneEl) {
        let cues = JSON.parse(sceneEl.dataset.cues);
        cues.forEach(function (cue) {
          // Push element to cues if it's within the frame limit
          if (cue <= frameNum){
           cuesToEls[cue].push(sceneEl);
          }
        });
      });
     }

     initializeCues();



function changeScene(scrollPos, initialize) {
  let cueChanged = currentCueIndex !== Math.floor(scrollPos / interval);
  currentCueIndex = Math.floor(scrollPos / interval);

  if (cueChanged){


      prevSceneEls = currentSceneEls;
      currentSceneEls = cuesToEls[currentCueIndex];

      prevSceneEls.forEach(function (sceneEl) {
        //if this prev scene El is not in this current one, remove it
        if (currentSceneEls.indexOf(sceneEl) == -1) {
          sceneEl.classList.remove("visible");
          window.setTimeout(function () {
            sceneEl.classList.remove("display");
          }, 300);
        }
      });

      //Show all the current ones
      currentSceneEls.forEach(function (sceneEl) {
        sceneEl.classList.add("display");
        window.setTimeout(function () {
          sceneEl.classList.add("visible");
        }, 5);
      });
  }
  if (initialize){
    currentCueIndex = Math.floor(scrollPos / interval);
    prevSceneEls = currentSceneEls;
    currentSceneEls = cuesToEls[currentCueIndex];

    prevSceneEls.forEach(function (sceneEl) {
      //if this prev scene El is not in this current one, remove it
      if (currentSceneEls.indexOf(sceneEl) == -1) {
        sceneEl.classList.remove("visible");
        window.setTimeout(function () {
          sceneEl.classList.remove("display");
        }, 300);
      }
    });

    //Show all the current ones
    currentSceneEls.forEach(function (sceneEl) {
      sceneEl.classList.add("display");
      window.setTimeout(function () {
        sceneEl.classList.add("visible");
      }, 5);
    });
  }


}
changeScene(window.scrollY, true);

// setTimeout(function(){
//   changeScene(window.scrollY, true);
// },100)

window.onscroll = function (e) {
  scrollPos = window.scrollY;
  changeScene(window.scrollY);
};



// For resizing canvas
function resizeWindow() {
  setPageHeight();
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  let gutters = 40;
    let scaleX = window.innerWidth / ( dimensions.w + gutters);
    let scaleY = window.innerHeight /  (dimensions.h+gutters);
    let ratio = window.innerWidth / window.innerHeight;
    let transform = window.getComputedStyle(sceneContainer).transform;
    // sceneContainer.style.backgroundColor = "blue"
    if (ratio >  dimensions.w /  dimensions.h) {
      sceneContainer.style.transform = "translate(-50%, -50%) scale("+scaleY+")"
    ;
    } else {
      sceneContainer.style.transform = "translate(-50%, -50%) scale("+scaleX+")"
      ;
    }
}

window.onresize = resizeWindow;

resizeWindow();

`;

let exportStyle = `
body {
  margin:0px;
  -webkit-font-smoothing: antialiased;

}
#sceneContainer {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 600px;
}
#scrollContainer{
  height:9600px;
}

.sceneEl{
  position:absolute;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  -ms-user-select: none;
  user-select: none;

  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  -ms-user-drag: none;
  user-drag: none;

  opacity:0;
  display: none;
  transition: opacity .2s ease-in, background .2s;
  position:absolute;
  top:0px;
  left:0px;
  box-sizing: border-box;
  pointer-events:none;

}
pre.sceneEl{
  font-size:24px;
  margin:0px;
  display:inline-block;
  white-space: pre-wrap;
  tab-size:4;
}
pre.sceneEl * {
  pointer-events: none;
}

img {
  position:absolute;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  -ms-user-select: none;
  user-select: none;

  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  -ms-user-drag: none;
  user-drag: none;

  image-rendering: optimizeSpeed;             /* STOP SMOOTHING, GIVE ME SPEED  */
  image-rendering: -moz-crisp-edges;          /* Firefox                        */
  image-rendering: -o-crisp-edges;            /* Opera                          */
  image-rendering: -webkit-optimize-contrast; /* Chrome (and eventually Safari) */
  image-rendering: pixelated;                 /* Universal support since 2021   */
  image-rendering: optimize-contrast;         /* CSS3 Proposed                  */
  -ms-interpolation-mode: nearest-neighbor;   /* IE8+                           */

}
img.maxWidth{
  max-width: calc(100vw - 40px);
}
pre.maxWidth{
  max-width: 400px;
}

.sceneEl.display{
  display:inline-block;
}





.sceneEl.visible{
  opacity:.999999;
  transition:  opacity .4s ease-in 0s, background .2s;
  pointer-events:all;
}

#parallaxTest{
  position:absolute;
  width:100%;
  top:400px;
  left:0px;
}

`;
