let originalSrcdoc = `
<html>
  <head>
    <style>
      body {
        margin:0px;
      }
      body.nwse-resizing{
        cursor: nwse-resize;
      }
      body.nesw-resizing{
        cursor: nesw-resize;
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
        cursor: grab;
        box-sizing: border-box;

      }

      img.display{
        display:block;
      }

      img.selected {
        -webkit-box-shadow: 0px 0px 0px 3px rgba(135,183,255,1);
        -moz-box-shadow: 0px 0px 0px 3px rgba(135,183,255,1);
        box-shadow: 0px 0px 0px 3px rgba(135,183,255,1);
      }

      img:not(.selected):hover {
        -webkit-box-shadow: 0px 0px 0px 2px rgba(135,183,255,.5);
        -moz-box-shadow: 0px 0px 0px 2px rgba(135,183,255,.5);
        box-shadow: 0px 0px 0px 2px rgba(135,183,255,.5);
      }

      img::after{
        content: "after";
      }

      img.dragging{
        cursor: grabbing;
      }
      img.nwse-resizing{
        cursor: nwse-resize;
      }
      img.nesw-resizing{
        cursor: nesw-resize;
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

      let currentlyResizing = false;
      // let resizeCorner = null;
      // let resizingEl = null;

      let resizeInfo = {
        corner: null,
        el: null,
        ratio: null,
        orignalPos: {x:null,y:null}
      }
      let images = document.querySelectorAll("img");

      //Track where you click on image
      let clickedPos = {x: 0, y: 0};

      let getHtmlString = function(){
        return document.querySelector('html').innerHTML;
      }

      let sendUpdatedHtmlMessage = function(){
        window.top.postMessage({
            message: "update html",
            html: getHtmlString()
        });
      }


      let cornerMargin = 20;



      let bottomRightCorner = function(element, pos){
        let dimensions = element.getBoundingClientRect();
        return (pos.x < dimensions.width &&
        pos.x > dimensions.width - cornerMargin &&
        pos.y < dimensions.height &&
        pos.y > dimensions.height - cornerMargin
        );
      }

      let bottomLeftCorner = function(element,pos){
        let dimensions = element.getBoundingClientRect();
        return (pos.x < cornerMargin &&
        pos.x > 0 &&
        pos.y < dimensions.height &&
        pos.y > dimensions.height - cornerMargin
        );
      }

      let topRightCorner = function(element,pos){
        let dimensions = element.getBoundingClientRect();
        return (pos.x < dimensions.width &&
        pos.x > dimensions.width - cornerMargin &&
        pos.y < cornerMargin &&
        pos.y > 0
        );
      }

      let topLeftCorner = function(element,pos){
        let dimensions = element.getBoundingClientRect();
        return (pos.x < cornerMargin &&
        pos.x > 0 &&
        pos.y < cornerMargin &&
        pos.y > 0
        );
      }

      let updateResizeCursors = function(thisEl,pos){
        if (bottomRightCorner(thisEl,pos)) {

            document.body.classList.add('nwse-resizing');
            thisEl.classList.add('nwse-resizing');
           }
          else if (topRightCorner(thisEl,pos)){
            document.body.classList.add('nesw-resizing');
            thisEl.classList.add('nesw-resizing');
           }
          else if (bottomLeftCorner(thisEl,pos)){
            document.body.classList.add('nesw-resizing');
            thisEl.classList.add('nesw-resizing');
           }
           else if (topLeftCorner(thisEl,pos)){
            document.body.classList.add('nwse-resizing');
            thisEl.classList.add('nwse-resizing');
           }

           else {
            thisEl.classList.remove('nesw-resizing');
            thisEl.classList.remove('nwse-resizing');
           }

      }
      let removeResizeCursorsOnBody = function(){
        document.body.classList.remove('nwse-resizing');
        document.body.classList.remove('nesw-resizing');
      }

      images.forEach(function(image){
        image.addEventListener("mouseover",function(e){
          let thisEl =e.target;
          let pos = {
            x: e.clientX-thisEl.getBoundingClientRect().left,
            y: e.clientY-thisEl.getBoundingClientRect().top
          };
          if (!currentlyResizing){
            updateResizeCursors(thisEl, pos);
          }

        })

        image.addEventListener("mousemove",function(e){
          let thisEl =e.target;
          let pos = {
            x:e.clientX-thisEl.getBoundingClientRect().left,
            y: e.clientY-thisEl.getBoundingClientRect().top
          };
          if (!currentlyResizing){
            updateResizeCursors(thisEl, pos);
          }


        })


        image.addEventListener("mouseleave",function(e){
          let thisEl = e.target;
          if (!currentlyResizing){
            thisEl.classList.remove('nesw-resizing');
            thisEl.classList.remove('nwse-resizing');
          }

        })

        image.addEventListener("mousedown",function(e){
          console.log("you mousedown on me");
          let thisEl =e.target;

          clickedPos = {
          x:e.clientX-thisEl.getBoundingClientRect().left,
          y: e.clientY-thisEl.getBoundingClientRect().top
        };

          // make this image selected
          images.forEach(function (sceneEl) {
            sceneEl.classList.remove('selected');
          });
          e.target.classList.add('selected');
          window.top.postMessage({
            message: "selected img",
            id: e.target.dataset.id
          })


          // Are we dragging or resizing?
          let dimensions = thisEl.getBoundingClientRect();

          //Bottom right corner
          resizeInfo = {
              corner:"",
              el: thisEl,
              originalPos: thisEl.getBoundingClientRect()
          }
          if (bottomRightCorner(thisEl,clickedPos)) {
            currentlyResizing = true;
            resizeInfo.corner = "bottomRight";
           } else if (topRightCorner(thisEl,clickedPos)) {
            currentlyResizing = true;
            resizeInfo.corner = "topRight";
          }
          else if (bottomLeftCorner(thisEl,clickedPos)) {
            currentlyResizing = true;
            resizeInfo.corner = "bottomLeft";
          }
          else if (topLeftCorner(thisEl,clickedPos)) {
            currentlyResizing = true;
            resizeInfo.corner = "topLeft";
          }
          else {
            currentlyDragging = true;
            draggingEl = thisEl;
            thisEl.classList.add('dragging');
           }
        })

        image.addEventListener("click",function(e){
          console.log("you click on me");
          // // make this image selected
          // images.forEach(function (sceneEl) {
          //   sceneEl.classList.remove('selected');
          // });
          // e.target.classList.add('selected');
          // window.top.postMessage({
          //   message: "selected img",
          //   id: e.target.dataset.id
          // })

        });

      });

      let deleteSelectedImages = function(){
        let sceneContainer = document.querySelector("#sceneContainer");
          Array.from(document.querySelectorAll('img.selected')).forEach(function(element){
            sceneContainer.removeChild(element);
          });
          sendUpdatedHtmlMessage();
      }
      document.addEventListener('keydown',function(e){
        if (e.keyCode == '8' || e.keyCode == '46'){
          deleteSelectedImages();
        }
      });
      document.addEventListener('mousemove',function(e){
        if (currentlyDragging){
           draggingEl.style.left = (e.clientX - clickedPos.x) +"px" ;
           draggingEl.style.top = (e.clientY - clickedPos.y)+"px";
        }
        if (currentlyResizing){
          let thisEl = resizeInfo.el;
          let newWidth; let dy; let dx;

          //clicked ratio tells you where you clicked in relation to the image
          let clickedRatio = {
            x: clickedPos.x/resizeInfo.originalPos.width,
            y: clickedPos.y/resizeInfo.originalPos.height
          };
          if (resizeInfo.corner == "bottomRight"){
            if (e.clientX > resizeInfo.originalPos.left){
              newWidth = (e.clientX - resizeInfo.originalPos.left)/clickedRatio.x;
            }
          }
          else if (resizeInfo.corner == "topRight"){
            if (e.clientX > resizeInfo.originalPos.left){
              newWidth = (e.clientX - resizeInfo.originalPos.left)/clickedRatio.x;
              newHeight = (newWidth*thisEl.naturalHeight/thisEl.naturalWidth);
              dy = newHeight - resizeInfo.originalPos.height;
              thisEl.style.top = (resizeInfo.originalPos.top-dy)+'px';
            }
          }
          else if (resizeInfo.corner == "bottomLeft"){
            if (e.clientX < (resizeInfo.originalPos.left+resizeInfo.originalPos.width)){
              newWidth = (resizeInfo.originalPos.right -  e.clientX)/(1-clickedRatio.x);
              dx = newWidth - resizeInfo.originalPos.width;
              thisEl.style.left = (resizeInfo.originalPos.left - dx)+ "px";
            }
          }
          else if (resizeInfo.corner == "topLeft"){
            if (e.clientX < (resizeInfo.originalPos.left+resizeInfo.originalPos.width)){
              newWidth = (resizeInfo.originalPos.right -  e.clientX)/(1-clickedRatio.x);
              newHeight = (newWidth*thisEl.naturalHeight/thisEl.naturalWidth);
              dy = newHeight - resizeInfo.originalPos.height;
              dx = newWidth - resizeInfo.originalPos.width;
              thisEl.style.left = (resizeInfo.originalPos.left - dx)+ "px";
              thisEl.style.top = (resizeInfo.originalPos.top-dy)+'px';
            }
          }
          thisEl.style.width = newWidth+"px";
        } else {

          if (e.target.tagName != "IMG"){
            removeResizeCursorsOnBody();
          }
        }
      })
      document.addEventListener('mouseup',function(e){

        // Set dragging to false and update doc
        if (e.target.tagName == "IMG"){
          currentlyDragging = false;
          e.target.classList.remove("dragging");

          sendUpdatedHtmlMessage();
          draggingEl = null;
        }

        //Clear selected and resizing if you click outside an image
        if (e.target.tagName != "IMG"){
          removeResizeCursorsOnBody();
          images.forEach(function (sceneEl) {
            sceneEl.classList.remove('selected');
          });
        }
        // stop resizing
        if (currentlyResizing){
          currentlyResizing = false;
          resizeInfo = {
            corner: null,
            el: null,
            ratio: null,
            originalPos: {}
          }
          sendUpdatedHtmlMessage();
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
        let cues = JSON.parse(sceneEl.dataset.cues);
        cues.forEach(function (cue) {
          cuesToEls[cue].push(sceneEl);
        });
      });


      let currentCueIndex = 0;
      let scrollPos = 0;
      let interval = 600;

      let currentSceneEls = [];
      let prevSceneEls = [];


      function changeScene(scrollPos, initialize) {
        console.log("change scene called");
        let cueChanged = currentCueIndex !== Math.floor(scrollPos / interval);
        currentCueIndex = Math.floor(scrollPos / interval);
        if (cueChanged){
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
      },100)

      window.onscroll = function (e) {
        scrollPos = window.scrollY;
        changeScene(window.scrollY);
      };

  </script>
</html>
`;
