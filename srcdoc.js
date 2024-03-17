let originalSrcdoc = `
<html>
  <head>
    <title>My Comic</title>
    <style data-id="editor">
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
        pointer-events:none;
        /* z-index:0; */
      }
      #scrollContainer{
        height:9600px;
        position:relative;
        pointer-events:none;
        width:100px;
        margin:auto;
        /* z-index:0; */

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
        cursor: grab;
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

      .sceneEl.visible, .sceneEl.scrollable{
        opacity:1;
        transition:  opacity .4s ease-in 0s, background .2s;
        pointer-events:all;
      }

    </style>

  </head>
  <body>
    <div id="scrollContainer" data-frame-num="15"></div>
    <div id="sceneContainer"></div>

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

      let sceneEls =  document.querySelectorAll(".sceneEl");

      //initialize height
      let sceneContainer = document.querySelector("#sceneContainer");

      let scrollContainer = document.querySelector("#scrollContainer");
      let frameNum = parseInt(scrollContainer.dataset.frameNum);


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

      let correctScale = function(num){
        let scale = new WebKitCSSMatrix(window.getComputedStyle(sceneContainer).transform).a;
        return num / scale;
      }

      let getScale = function(){
        let scale = new WebKitCSSMatrix(window.getComputedStyle(sceneContainer).transform).a;
        return scale;
      }


      //Track where you click on image
      let clickedPos = {x: 0, y: 0};

      let getHtmlString = function(){
        return document.querySelector('html').innerHTML;
      }

      window.onmessage = function (e) {
        if (e.data.message == "adding text"){

          document.body.classList.add("addingText");
        }
        else if (e.data.message == "delete el"){
          deleteSelectedElements();
        }
        else if (e.data.message == "toggle scroll"){
          toggleElementScroll();
        }
        else if (e.data.message == "toggle fixed"){
          toggleElementFixed();
        }
        else if (e.data.message == "toggle custom size"){
          toggleElementCustom();
        }
        else if (e.data.message == "toggle fill size"){
          toggleElementFill();
        }
        else if (e.data.message == "deselect"){
          deselectElements();

        }
        else if (e.data.message == "scroll to"){
          changeScene(window.scrollY, true);

        }
      }
      let sendUpdatedHtmlMessage = function(){
        console.log("send updated html")
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
          if (el.getAttribute('contenteditable') == "true"){
            editingTextEl = el;
            el.classList.add("editingText");
            let attemptToFocus = setInterval(function(){
               if (el != document.activeElement){
                el.focus();
               } else {
                clearInterval(attemptToFocus);
               };
            }, 20);
          }
        }

        el.addEventListener("input", function(e){
          let thisEl = e.target;
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
            sendSelectedElMessage(e);


            // Are we dragging or resizing?
            let dimensions = thisEl.getBoundingClientRect();



          //NOTE: don't resize if element active either
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

      let toggleElementScroll = function(){
        Array.from(document.querySelectorAll('.sceneEl.selected')).forEach(function(element){
            element.classList.add("scrollable");
            element.setAttribute('data-ypos',scrollPos);
            element.setAttribute('data-cues', generateDataCueString(0,frameNum));
            if (element.classList.contains("fill")){
              // element.style.height = JSON.parse(element.dataset.originalpos).h;
              element.style.width = correctScale(window.innerWidth)+'px';
              element.style.height = "auto";
              element.style.top = JSON.parse(element.dataset.originalpos).y;
              }
        });
        sendUpdatedHtmlMessage();
      }

      let toggleElementFixed = function(){
        Array.from(document.querySelectorAll('.sceneEl.selected')).forEach(function(element){
            element.classList.remove("scrollable");
            element.style.transform = "";
            element.removeAttribute('data-ypos');
            element.setAttribute('data-cues', generateDataCueString(currentCueIndex,currentCueIndex+1));
            if (element.classList.contains("fill")){
              element.style.height = correctScale(window.innerHeight)+'px';
              element.style.top = correctScale(-sceneContainer.getBoundingClientRect().top)+'px';
            } else {
              element.style.height = "auto";

            }
        });
        sendUpdatedHtmlMessage();
      }

      let toggleElementCustom = function(){
        Array.from(document.querySelectorAll('.sceneEl.selected')).forEach(function(element){
            element.classList.remove("fill");
            let originalpos = JSON.parse(element.dataset.originalpos);

            element.style.width = originalpos.w;
            element.style.height = "auto"
            element.style.left = originalpos.x;
            element.style.top = originalpos.y;
            // element.removeAttribute('data-originalpos');

        });
        sendUpdatedHtmlMessage();
      }


      let toggleElementFill = function(){
        console.log("togle fill")
        Array.from(document.querySelectorAll('.sceneEl.selected')).forEach(function(element){
          element.setAttribute('data-originalpos', JSON.stringify({
            x: element.style.left,
            y: element.style.top,
            w: correctScale(element.getBoundingClientRect().width)+'px',
            h: correctScale(element.getBoundingClientRect().height)+'px',
          }));

          element.classList.add("fill");
          element.style.left = correctScale(-sceneContainer.getBoundingClientRect().left)+'px';

          console.log(-sceneContainer.getBoundingClientRect().top);
          element.style.width = correctScale(window.innerWidth)+'px';
          if (element.classList.contains("scrollable")){
            // element.style.height = JSON.parse(element.dataset.originalpos).h;
            element.style.height = "auto";
          } else {
            element.style.top = correctScale(-sceneContainer.getBoundingClientRect().top)+'px';
            element.style.height = correctScale(window.innerHeight)+'px';

          }
        });
        sendUpdatedHtmlMessage();
      }

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

        // CASE 0: scrollable, and fill
        // case 1: scrollable, no fill
        // case 2: not scrollable, fill
        // case 3: not scrollable, no fill
        let scrollable = draggingEl.classList.contains("scrollable");
        let fill = draggingEl.classList.contains("fill");
        if (scrollable && fill){
          draggingEl.style.transform = "none";
          draggingEl.setAttribute('data-ypos',scrollPos);
          draggingEl.style.top = correctScale(e.clientY - sceneContainer.getBoundingClientRect().top - clickedPos.y)+"px";
        } else if (scrollable && !fill){
          draggingEl.style.transform = "none";
          draggingEl.setAttribute('data-ypos',scrollPos);
          draggingEl.style.left = correctScale(e.clientX - sceneContainer.getBoundingClientRect().left -  clickedPos.x) +"px" ;
          draggingEl.style.top = correctScale(e.clientY - sceneContainer.getBoundingClientRect().top - clickedPos.y)+"px";

        } else if (!scrollable && fill){
          // do nothing!
        } else if (!scrollable && !fill){
          draggingEl.style.left = correctScale(e.clientX - sceneContainer.getBoundingClientRect().left -  clickedPos.x) +"px" ;
          draggingEl.style.top = correctScale(e.clientY - sceneContainer.getBoundingClientRect().top - clickedPos.y)+"px";


        }
      }

      let resizeElement = function(e){
        let thisEl = resizeInfo.el;
        thisEl.style.maxWidth = "none";

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
          // let editingEl = document.querySelector('p.editingText');
          editingTextEl.setAttribute('contenteditable', false);
          editingTextEl.classList.remove('editingText');

          if (editingTextEl.innerHTML == ""){
            deleteElement(editingTextEl);
          }
          editingTextEl = null;
        }
      })

      let deselectElements = function(){
        sendDeselectMessage();
          sceneEls.forEach(function (sceneEl) {
            sceneEl.classList.remove('selected');
          });

      }
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
          deselectElements();

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
        window.parent.postMessage({
              message: "cue change",
              cueCount: currentCueIndex,
              scrollPos: scrollPos
        });
      }

      let sendSelectedElMessage = function(e){
        window.parent.postMessage({
            message: "selected el",
            id: e.target.dataset.id
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
        adjustScrollables(window.scrollY);
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

      function adjustScrollables(){
           Array.from(document.querySelectorAll('.sceneEl.scrollable')).forEach(function(element){
            let originalScrollPos = element.dataset.ypos;
            element.style.transform = "translateY("+ (originalScrollPos-window.scrollY)+"px)";
          });
      }

      function resizeFills(){
        Array.from(document.querySelectorAll('.sceneEl.fill')).forEach(function(element){
          element.style.left = correctScale(-sceneContainer.getBoundingClientRect().left)+'px';
          element.style.top = correctScale(-sceneContainer.getBoundingClientRect().top)+'px';
          element.style.width = correctScale(window.innerWidth)+'px';
          if (!element.classList.contains("scrollable")){
            element.style.height = correctScale(window.innerHeight)+'px';
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

          // Array.from(document.querySelectorAll('.sceneEl.scrollable')).forEach(function(element){
          //   element.style.transform = "scale("+getScale()+")";
          //   let left = element.dataset.left;
          //   element.style.left = left*scaleX+"px";
          // });
      }

      window.onresize = resizeWindow;

      resizeWindow();


  </script>
</html>
`;

