let addImageButton = document.querySelector("#addImage");

let previewIframe = document.querySelector("#preview");

var parser = new DOMParser();

let addedObjects = [];

let cueCount = document.querySelector("#cueCount");

let currentCue = parseInt(cueCount.innerHTML);
console.log(currentCue);

let currentElement = null;
let startCueInput = document.querySelector("#startCue");
let endCueInput = document.querySelector("#endCue");

let currentIdInput = document.querySelector("#currentId");

let currentScrollPos = 0;

window.onmessage = function (e) {
  // inside the parent
  if (e.data.message == "reposition img") {
    console.log("reposition image received");
    addedObjects[e.data.id].position.x = e.data.x;
    addedObjects[e.data.id].position.y = e.data.y;
    let thisImg = htmlDoc.querySelector(`img[data-id="${e.data.id}"`);
    thisImg.style.left = e.data.x;
    thisImg.style.top = e.data.y;
    // previewIframe.srcdoc = htmlDoc.documentElement.outerHTML;
  }

  // inside the parent
  if (e.data.message == "cue change") {
    currentCue = e.data.cueCount;
    cueCount.innerHTML = currentCue;
    currentScrollPos = e.data.scrollPos;
  }

  // inside the parent
  if (e.data.message == "selected img") {
    let thisId = e.data.id;
    let thisEl = addedObjects[thisId];
    startCueInput.innerHTML = thisEl.startFrame;
    endCueInput.innerHTML = thisEl.endFrame;
    currentIdInput.innerHTML = thisId;
  }
};

let iframeScript = ``;

let originalSrcdoc = `
<html>
  <head>
    <style>
      body {
        margin:0px;
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
        height:10000px;
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

        opacity:0;
        display: none;
        transition: opacity .2s ease-in, background .2s;
        position:absolute;
        top:0px;
        left:0px;

      }

      img.visible{
        opacity:1;
        transition:  opacity .4s ease-in 0s, background .2s;
        pointer-events:all;
      }

    </style>

  </head>
  <body>
    <div id="sceneContainer"></div>
    <div id="scrollContainer"></div>
  </body>
  <script>
      let currentlyDragging = false;
      let draggingEl = null;
      let images = document.querySelectorAll("img");
      let clickedPos = {x: 0, y: 0};
      images.forEach(function(image){
        image.addEventListener("mousedown",function(e){
          console.log("you mousedown on me");
          clickedPos = {x:e.clientX-e.target.offsetLeft, y: e.clientY-e.target.offsetTop };
          currentlyDragging = true;
          draggingEl = image;
        })

        image.addEventListener("click",function(e){
          console.log("you click on me");
          window.top.postMessage({
            message: "selected img",
            id: e.target.dataset.id
          })

        });

      });
      document.addEventListener('mouseup', function(){
        currentlyDragging = false;

          window.top.postMessage({
            message: "reposition img",
            id: draggingEl.dataset.id,
            x: draggingEl.offsetLeft,
            y: draggingEl.offsetTop
            }); //inside the iframe

          draggingEl = null;
      });
      document.addEventListener('mousemove',function(e){

        if (currentlyDragging){
           draggingEl.style.left = (e.clientX - clickedPos.x) +"px" ;
           draggingEl.style.top = (e.clientY - clickedPos.y)+"px";
        }

      })


      // Keys: the cue number
      // Values: an array of scene Els
      let cuesToEls = {};

      //Initialize list
      for (let i = 0; i < 16; i++) {
        cuesToEls[i] = [];
      }


      images.forEach(function (sceneEl) {
        console.log(sceneEl);
        let cues = JSON.parse(sceneEl.dataset.cues);
        cues.forEach(function (cue) {
          cuesToEls[cue].push(sceneEl);
        });
      });

      console.log(cuesToEls);



    let currentCueIndex = 0;

      let scrollPos = 0;

      let interval = 600;

      let currentSceneEls = [];
      let prevSceneEls = [];


      function changeScene(scrollPos, initialize) {
        let cueChanged = currentCueIndex !== Math.floor(scrollPos / interval);
        currentCueIndex = Math.floor(scrollPos / interval);
        if (cueChanged){
          console.log(currentCueIndex);
          window.top.postMessage({
            message: "cue change",
            cueCount: currentCueIndex,
            scrollPos: scrollPos
            }); //inside the iframe

            prevSceneEls = currentSceneEls;
            currentSceneEls = cuesToEls[currentCueIndex];

            prevSceneEls.forEach(function (sceneEl) {
              //if this prev scene El is not in this current one, remove it
              if (currentSceneEls.indexOf(sceneEl) == -1) {
                sceneEl.classList.remove("visible");
                window.setTimeout(function () {
                  sceneEl.style.display = "none";
                }, 300);
              }
            });

            //Show all the current ones
            currentSceneEls.forEach(function (sceneEl) {
              sceneEl.style.display = "block";
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
                sceneEl.style.display = "none";
              }, 300);
            }
          });

          //Show all the current ones
          currentSceneEls.forEach(function (sceneEl) {
            sceneEl.style.display = "block";
            window.setTimeout(function () {
              sceneEl.classList.add("visible");
            }, 5);
          });
        }

      }


      changeScene(window.scrollY, true);
      window.onscroll = function (e) {
        scrollPos = window.scrollY;
        // console.log(scrollPos);
        changeScene(window.scrollY);
      };


  </script>
</html>

`;
let htmlDoc = parser.parseFromString(originalSrcdoc, "text/html");

previewIframe.srcdoc = originalSrcdoc;

generateDataCueString = function (startFrame, endFrame) {
  let cuesString = "[";
  for (var i = 0; i < endFrame - startFrame; i++) {
    console.log(cuesString);
    if (i != 0) {
      cuesString += ",";
    }
    cuesString += startFrame + i;
  }
  cuesString += "]";
  return cuesString;
};

addImageButton.addEventListener("click", function () {
  let img = new Image();
  img.src = "img/testImg.png";
  let id = addedObjects.length;
  img.setAttribute("data-id", id);

  //Create the default cues

  let startFrame = currentCue;
  let endFrame = currentCue + 2;

  // let dataCues = `data-cues="${cuesString}"`;

  console.log(startFrame, endFrame);
  img.setAttribute("data-cues", generateDataCueString(startFrame, endFrame));

  startCueInput.value = startFrame;
  endCueInput.value = endFrame;
  currentElement = img;
  currentImgPreview.src = currentElement.src;
  currentIdInput.innerHTML = id;

  //Add image to scene container
  let sceneContainer = htmlDoc.querySelector("#sceneContainer");
  sceneContainer.appendChild(img);

  //Change preview iframe frame to the html
  previewIframe.srcdoc = htmlDoc.documentElement.outerHTML;

  //When we add a new image, show it by default starting on this cue
  // but allow adjusting it to multiple cues
  addedObjects.push({
    id: id,
    imgSrc: img.src,
    position: { x: 0, y: 0 },
    startFrame: currentCue,
    endFrame: currentCue + 1,
  });
});

let updateCues = function (startFrame, endFrame) {
  if (endFrame >= startFrame) {
    let thisImg = htmlDoc.querySelector(
      `img[data-id="${currentElement.dataset.id}"`
    );
    console.log(currentElement);
    console.log(`img[data-id="${currentElement.dataset.id}"]`);
    console.log(thisImg);
    console.log(startFrame, endFrame);
    thisImg.setAttribute(
      "data-cues",
      generateDataCueString(startFrame, endFrame)
    );
    console.log("test");
    previewIframe.srcdoc = htmlDoc.documentElement.outerHTML;
    console.log("tes2");
  }
};

//Detect property change
startCueInput.addEventListener("change", (e) => {
  console.log(e.target.value);
  // Need to change data values between the two
  //Double check it's valid
  let startFrame = parseInt(startCueInput.value);
  let endFrame = parseInt(endCueInput.value);
  if (endFrame >= startFrame) {
    updateCues(startFrame, endFrame);
  }
});

//Detect property change
endCueInput.addEventListener("change", (e) => {
  console.log(e.target.value);
  // Need to change data values between the two
  //Double check it's valid
  let startFrame = parseInt(startCueInput.value);
  let endFrame = parseInt(endCueInput.value);
  if (endFrame >= startFrame) {
    updateCues(startFrame, endFrame);
  }
});

previewIframe.onload = function () {
  this.contentWindow.scrollTo(0, currentScrollPos);
};

// LOcal storage stuff
const localStorageKey = "images";

const inputImg = document.getElementById("image-upload");
const img = document.getElementById("img");

const imageCollection = document.querySelector("#image-collection");

function getImg(event) {
  const file = event.target.files[0]; // 0 = get the first file
  let url = window.URL.createObjectURL(file);

  let newImg = new Image();
  newImg.src = url;
  newImg.classList.add("imageLibraryPreview");
  imageCollection.appendChild(newImg);
}

inputImg.addEventListener("change", getImg);
