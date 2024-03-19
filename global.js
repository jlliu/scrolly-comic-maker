let scrollInterval = 600;

let canvasWidth = 800;
let canvasHeight = 600;

let frameNum = 15;
let frameNumToHeight = function (frameNum) {
  return (frameNum + 1) * 600;
};

let initialFrameDuration = 1;

let generateDataCueString = function (startFrame, endFrame) {
  let cuesString = "[";
  for (var i = 0; i < endFrame - startFrame + 1; i++) {
    if (i != 0) {
      cuesString += ",";
    }
    cuesString += startFrame + i;
  }
  cuesString += "]";
  return cuesString;
};

let fontDefinitions = {
  "Comic Neue": {
    css: `
    @font-face {
      font-family: "Comic Neue";
      src: url("fonts/ComicNeue-Bold.ttf") format("truetype");
    }
    `,
    url: "fonts/ComicNeue-Bold.ttf",
  },
  "Rainy Hearts": {
    css: `
    @font-face {
      font-family: "Rainy Hearts";
      src: url("fonts/rainyhearts.ttf") format("truetype");
    }
    `,
    url: "fonts/rainyhearts.ttf",
  },
  "Bad Comic": {
    css: `
    @font-face {
      font-family: "Bad Comic";
      src: url("fonts/BadComic-Regular.ttf") format("truetype");
    }
    `,
    url: "fonts/BadComic-Regular.ttf",
  },
};

let exportScript = `

let dimensions = {
  w: 800,
  h: 600
}

  let sceneEls =  document.querySelectorAll(".sceneEl");

  //initialize height
  let sceneContainer = document.querySelector("#sceneContainer");

  let scrollContainer = document.querySelector("#scrollContainer");
  let frameNum = parseInt(scrollContainer.dataset.frameNum);

  let correctScale = function(num){
    let scale = new WebKitCSSMatrix(window.getComputedStyle(sceneContainer).transform).a;
    return num / scale;
  }


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



  let currentCueIndex = 0;
  let scrollPos = 0;
  let interval = 600;

  let currentSceneEls = [];
  let prevSceneEls = [];


  function changeScene(scrollPos, initialize) {
    let cueChanged = currentCueIndex !== Math.floor(scrollPos / interval);
    currentCueIndex = Math.floor(scrollPos / interval);
    adjustScrollables(window.scrollY);

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

  setTimeout(function(){
    changeScene(window.scrollY, true);
    resizeFills();
  },1)

  window.onscroll = function (e) {
    scrollPos = window.scrollY;
    changeScene(window.scrollY);

  };

  function adjustScrollables(){
       Array.from(document.querySelectorAll('.sceneEl.scrollable')).forEach(function(element){
        let originalScrollPos = element.dataset.ypos;
        element.style.transform = "translateY("+ (originalScrollPos-window.scrollY)+"px)";
      });
  }

  function resizeFills(){
    Array.from(document.querySelectorAll('.sceneEl.fill')).forEach(function(element){
      element.style.left = correctScale(-sceneContainer.getBoundingClientRect().left)+'px';
      element.style.width = correctScale(window.innerWidth)+'px';
      if (!element.classList.contains("scrollable")){
        element.style.height = correctScale(window.innerHeight)+'px';
        element.style.top = correctScale(-sceneContainer.getBoundingClientRect().top)+'px';
      } else {
        element.style.top = JSON.parse(element.dataset.originalpos).y;
      }
      });
  }

  // For resizing canvas
  function resizeWindow() {
    setPageHeight();
    resizeFills();
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
      scrollContainer.style.width = sceneContainer.getBoundingClientRect().width+"px";
      scrollContainer.style.marginTop = sceneContainer.getBoundingClientRect().top+"px";
      scrollContainer.style.height = scrollContainer.getBoundingClientRect().height-sceneContainer.getBoundingClientRect().top+"px";

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
  pointer-events:none;
}
#scrollContainer{
  height:9600px;
  position:relative;
  pointer-events:none;
  width:100px;
  margin:auto;

}
#scrollContainer .sceneEl.scrollable{
  transform-origin: top left;
  display: block !important;
  opacity: 1 !important;
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


  position:absolute;
  top:0px;
  left:0px;
  box-sizing: border-box;


}
.sceneEl:not(.scrollable){
  opacity:0;
  display: none;
  transition: opacity .2s ease-in, background .2s;
  pointer-events:none;

}

.sceneEl.fill:not(.scrollable){
  object-fit: cover; /* or object-fit: contain; */
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

.sceneEl.display, .sceneEl.scrollable{
  display:inline-block;
}




.sceneEl.visible, .sceneEl.scrollable{
  opacity:1;
  transition:  opacity .4s ease-in 0s, background .2s;
  pointer-events:all;
}
`;

// let copy = element;

//NEED TO GIVE RIGHT DIMENSIONS... AND RIGHT POSITION

// console.log( window.scrollY);
// console.log( element.getBoundingClientRect().top);
// console.log(scrollContainer.getBoundingClientRect().top);
// copy.style.top = element.getBoundingClientRect().top-scrollContainer.getBoundingClientRect().top+"px";
// console.log(window.scrollY+element.getBoundingClientRect().top-scrollContainer.getBoundingClientRect().top+"px")
// copy.style.left = element.getBoundingClientRect().left-scrollContainer.getBoundingClientRect().left+"px";
// copy.style.transform = "scale("+getScale()+")";

// element.remove();
// scrollContainer.appendChild(copy);
