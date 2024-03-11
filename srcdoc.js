let originalSrcdoc = `
<html>
  <head>
    <title>My Comic</title>
    <style>
      body {
        margin:0px;
        -webkit-font-smoothing: antialiased;

      }
      body.nwse-resizing{
        cursor: nwse-resize;
      }
      body.nesw-resizing{
        cursor: nesw-resize;
      }

      body.addingText{
        cursor: crosshair;
      }


      #sceneContainer {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 800px;
        height: 600px;
        border: 2px dotted rgba(0, 0, 0, 0.333);
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
        cursor: grab;
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



      .sceneEl:not(.selected,.editingText):hover {
        -webkit-box-shadow: 0px 0px 0px 4px rgba(135,183,255,.5);
        -moz-box-shadow: 0px 0px 0px 4px rgba(135,183,255,.5);
        box-shadow: 0px 0px 0px 4px rgba(135,183,255,.5);
      }

      .sceneEl.selected:not(.editingText), .sceneEl.selected.hover:not(.editingText) {
        -webkit-box-shadow: 0px 0px 0px 4px rgba(135,183,255,1);
        -moz-box-shadow: 0px 0px 0px 4px rgba(135,183,255,1);
        box-shadow: 0px 0px 0px 4px rgba(135,183,255,1);
      }

      .sceneEl.editingText{
        cursor: text;
      }

      .sceneEl.dragging{
        cursor: grabbing;
      }
      .sceneEl.nwse-resizing{
        cursor: nwse-resize;
      }
      .sceneEl.nesw-resizing{
        cursor: nesw-resize;
      }

      .sceneEl.visible{
        opacity:1;
        transition:  opacity .4s ease-in 0s, background .2s;
        pointer-events:all;
      }

      #parallaxTest{
        position:absolute;
        width:100%;
        top:400px;
        left:0px;
      }

    </style>

  </head>
  <body>
    <div id="sceneContainer"></div>
    <div id="scrollContainer" data-frame-num="15">
      <!-- asdf
      <img id="parallaxTest" src="img/test.png" /> -->
    </div>
  </body>
  <script>

    let dimensions = {
      w: 800,
      h: 600
    }
      let currentlyDragging = false;
      let draggingEl = null;

      // let highestZindex = -9999999999999999999999;
      // let lowestZindex =  99999999999999999999999;



      // let currentlyEditing = false;
      let editingTextEl = null;




      let currentlyResizing = false;
      let resizeInfo = {
        corner: null,
        el: null,
        ratio: null,
        orignalPos: {x:null,y:null}
      }
      let images = document.querySelectorAll("img");

      let sceneEls =  document.querySelectorAll(".sceneEl");

      //initialize height
      let sceneContainer = document.querySelector("#sceneContainer");

      let scrollContainer = document.querySelector("#scrollContainer");
      let frameNum = parseInt(scrollContainer.dataset.frameNum);
      scrollContainer.style.height = ((frameNum+1)*600)+'px';


      //Track where you click on image
      let clickedPos = {x: 0, y: 0};

      let getHtmlString = function(){
        return document.querySelector('html').innerHTML;
      }

      window.onmessage = function (e) {
        if (e.data.message == "adding text"){

          document.body.classList.add("addingText");
        }
        if (e.data.message == "delete el"){
          deleteSelectedElements();
        }

      }
      let sendUpdatedHtmlMessage = function(){
        window.parent.postMessage({
            message: "update html",
            html: getHtmlString()
        });
      }

      let sendClickMessage= function(clickedPos){

        window.parent.postMessage({
            message: "click",
            clickedPos: clickedPos
        });
      }


      let cornerMargin = 20;

      let correctScale = function(num){
        let scale = new WebKitCSSMatrix(window.getComputedStyle(sceneContainer).transform).a;
        return num / scale;
      }




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

      sceneEls.forEach(function(el){

        if (el.tagName == "PRE"){
          console.log("TAG NAME IS PRE")
          if (el.getAttribute('contenteditable') == "true"){
            console.log("SETTING CONTENTEDITABLE")
            editingTextEl = el;
            el.classList.add("editingText");
            el.focus();
          }
        }

        el.addEventListener("input", function(e){
          let thisEl = e.target;
          console.log("SETTING ADDING TEXT TO FALSE")
          document.body.classList.remove("addingText");
          sendUpdatedHtmlMessage();
        });

        el.addEventListener("keydown", function(e){
          // Press tab
          if (e.keyCode === 9) {
              document.execCommand('insertHTML', false, '&#009');
              e.preventDefault();
            }

        });

        el.addEventListener("mouseover",function(e){
          let thisEl =e.target;
          let pos = {
            x: e.clientX-thisEl.getBoundingClientRect().left,
            y: e.clientY-thisEl.getBoundingClientRect().top
          };
          if (!currentlyResizing){
            updateResizeCursors(thisEl, pos);
          }

        })

        el.addEventListener("mousemove",function(e){
          let thisEl =e.target;
          let pos = {
            x:e.clientX-thisEl.getBoundingClientRect().left,
            y: e.clientY-thisEl.getBoundingClientRect().top
          };
          if (!currentlyResizing){
            updateResizeCursors(thisEl, pos);
          }
        })


        el.addEventListener("mouseleave",function(e){
          let thisEl = e.target;
          if (!currentlyResizing){
            thisEl.classList.remove('nesw-resizing');
            thisEl.classList.remove('nwse-resizing');
          }

        })

        el.addEventListener("mousedown",function(e){

            console.log("you mousedown on me");
            let thisEl =e.target;

            clickedPos = {
              x:e.clientX-thisEl.getBoundingClientRect().left,
              y: e.clientY-thisEl.getBoundingClientRect().top
            };



            // make this image selected
            sceneEls.forEach(function (sceneEl) {
              sceneEl.classList.remove('selected');
            });
            e.target.classList.add('selected');
            console.log("i'm selecting something")
            sendSelectedElMessage(e);


            // Are we dragging or resizing?
            let dimensions = thisEl.getBoundingClientRect();



          //NOTE: don't resize if element active either
          resizeInfo = {
              corner:"",
              el: thisEl,
              originalPos: thisEl.getBoundingClientRect()
          }
          console.log(resizeInfo);
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
            // Make elements draggable if we're not currently editing text
            if (!(thisEl.tagName == "PRE" && thisEl == document.activeElement)){
              currentlyDragging = true;
              draggingEl = thisEl;
              thisEl.classList.add('dragging');
            }

           }

          // is this text? might we want to edit the text?
          // if (thisEl.tagName == "PRE"){
          //   editingText = true;
          // }


        })

        el.addEventListener("click",function(e){
          console.log("you click on me");

        });

        el.addEventListener("dblclick",function(e){
          let thisEl = e.target;
          console.log("you double click on me");
          if (thisEl.tagName == "PRE"){
            editingTextEl = thisEl;
            this.classList.add('editingText');
            thisEl.setAttribute('contenteditable', true);
            thisEl.focus();
          }

        });

      });

      let deleteSelectedElements = function(){

          Array.from(document.querySelectorAll('.sceneEl.selected:not(.editingText)')).forEach(function(element){
            deleteElement(element);
          });
          sendUpdatedHtmlMessage();
      }
      let deleteElement = function(element){
        sceneContainer.removeChild(element);
      }
      document.addEventListener('keydown',function(e){
        if (e.keyCode == '8' || e.keyCode == '46'){
          deleteSelectedElements();
        }
      });

      let moveElement = function(e){
        draggingEl.style.left = correctScale(e.clientX - sceneContainer.getBoundingClientRect().left -  clickedPos.x) +"px" ;
        draggingEl.style.top = correctScale(e.clientY - sceneContainer.getBoundingClientRect().top - clickedPos.y)+"px";
      }
      let resizeElement = function(e){
        let thisEl = resizeInfo.el;
        thisEl.classList.remove('maxWidth');

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
              dy = (newHeight - (resizeInfo.originalPos.height));
              thisEl.style.top = correctScale(resizeInfo.originalPos.top-dy - sceneContainer.getBoundingClientRect().top)+'px';
            }
          }
          else if (resizeInfo.corner == "bottomLeft"){
            if (e.clientX < (resizeInfo.originalPos.left+resizeInfo.originalPos.width)){
              newWidth = (resizeInfo.originalPos.right -  e.clientX)/(1-clickedRatio.x);
              dx = newWidth - resizeInfo.originalPos.width;
              thisEl.style.left = correctScale(resizeInfo.originalPos.left - dx - sceneContainer.getBoundingClientRect().left)+ "px";
            }
          }
          else if (resizeInfo.corner == "topLeft"){
            if (e.clientX < (resizeInfo.originalPos.left+resizeInfo.originalPos.width)){
              newWidth = (resizeInfo.originalPos.right -  e.clientX)/(1-clickedRatio.x);
              newHeight = (newWidth*thisEl.naturalHeight/thisEl.naturalWidth);
              dy = newHeight - resizeInfo.originalPos.height;
              dx = newWidth - resizeInfo.originalPos.width;
              thisEl.style.left = correctScale(resizeInfo.originalPos.left - dx - sceneContainer.getBoundingClientRect().left)+ "px";
              thisEl.style.top = correctScale(resizeInfo.originalPos.top-dy- sceneContainer.getBoundingClientRect().top)+'px';
            }
          }
          thisEl.style.width = correctScale(newWidth)+"px";

      }
      document.addEventListener('mousemove',function(e){
        if (currentlyDragging){
         moveElement(e);
        }
        if (currentlyResizing){

          resizeElement(e);
        } else {
          if (!e.target.classList.contains("sceneEl")){
            removeResizeCursorsOnBody();
          }
        }
      })

      document.addEventListener('mousedown', function(e){
        //clear content editables
        if (editingTextEl && e.target != editingTextEl) {
          console.log("sdf")
          // let editingEl = document.querySelector('p.editingText');
          editingTextEl.setAttribute('contenteditable', false);
          editingTextEl.classList.remove('editingText');

          if (editingTextEl.innerHTML == ""){
            deleteElement(editingTextEl);
          }
          editingTextEl = null;
        }
      })
      document.addEventListener('mouseup',function(e){
        // are we dragging and releasing?
        if(draggingEl){
          console.log("set currently dragging to false");
          draggingEl.classList.remove("dragging");
          sendUpdatedHtmlMessage();
          draggingEl = null;
          currentlyDragging = false;
        }

        //Clear selected and resizing if you click outside an image
        if (!e.target.classList.contains('sceneEl')){
          removeResizeCursorsOnBody();
          console.log('remove selected')
          sendDeselectMessage();
          sceneEls.forEach(function (sceneEl) {
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
      document.addEventListener("click", function(e){
        document.body.classList.remove("addingText");
        let clickedPos = {
            x:
            correctScale(e.clientX -
              sceneContainer.getBoundingClientRect().left),
            y:
            correctScale(e.clientY -
              sceneContainer.getBoundingClientRect().top),
          };
          sendClickMessage(clickedPos);
      })


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

      let sendCueChangeMessage = function(){
        console.log("sending cue change");
        console.log(currentCueIndex);
        window.parent.postMessage({
              message: "cue change",
              cueCount: currentCueIndex,
              scrollPos: scrollPos
        }); //inside the iframe
      }

      let sendSelectedElMessage = function(e){
        window.parent.postMessage({
            message: "selected el",
            id: e.target.dataset.id,
            // highestZindex: highestZindex,
            // lowestZindex: lowestZindex
        })
      }

      // Sends when there is no selected replacement
      let sendDeselectMessage = function(){
        window.parent.postMessage({
            message: "deselected el"
        })
      }


      function changeScene(scrollPos, initialize) {
        let cueChanged = currentCueIndex !== Math.floor(scrollPos / interval);
        currentCueIndex = Math.floor(scrollPos / interval);
        sendCueChangeMessage();
        if (cueChanged){
          sendCueChangeMessage();

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



      // For resizing canvas
      function reportWindowSize() {
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

      window.onresize = reportWindowSize;

      reportWindowSize();


  </script>
</html>
`;

