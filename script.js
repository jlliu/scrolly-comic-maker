let addImageButton = document.querySelector("#addImage");
let previewIframe = document.querySelector("#preview");

var parser = new DOMParser();

let numObjects = 0;

let cueCount = document.querySelector("#cueCount");

let currentCue = parseInt(cueCount.innerHTML);

let currentElement = null;
let startCueInput = document.querySelector("#startCue");
let endCueInput = document.querySelector("#endCue");
endCueInput.setAttribute("max", frameNum);

let currentIdInput = document.querySelector("#currentId");

let currentScrollPos = 0;

let selectedLibraryImage = null;
let currentlyDraggingLibraryImage = false;

let frameAddButton = document.querySelector("#frame-add");
let frameSubtractButton = document.querySelector("#frame-subtract");

let settingsPanel = document.querySelector("#settings");

let sendForwardButton = document.querySelector("#sendForward");
let sendBackButton = document.querySelector("#sendBack");

// let timelineContainer = document.querySelector("#timelineContainer");

let scenePreviewContainer = document.querySelector("#scenePreviewContainer");
let sceneWrapperContainer = document.querySelector("#sceneWrapperContainer");

window.onmessage = function (e) {
  if (e.data.message == "update html") {
    htmlDoc = parser.parseFromString(e.data.html, "text/html");
    updatePreviewTimeline();
    updateSelectedPreviewScene();
  }

  if (e.data.message == "cue change") {
    currentCue = e.data.cueCount;
    cueCount.innerHTML = currentCue;
    currentScrollPos = e.data.scrollPos;
    updateSelectedPreviewScene();

    // let slider = document.querySelector("#timelineSlider");

    // slider.style.left = `${
    //   (currentScrollPos / (frameNum * 600)) *
    //   timelineContainer.getBoundingClientRect().width
    // }px`;
  }

  if (e.data.message == "selected el") {
    console.log("selected el received");
    let thisId = e.data.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${e.data.id}"`);
    currentElement = thisEl;

    //update values in UI
    let dataCues = JSON.parse(thisEl.dataset.cues);
    startCueInput.value = dataCues[0];
    endCueInput.value = dataCues[dataCues.length - 1];
    // currentIdInput.innerHTML = thisId;

    if (thisEl.tagName == "IMG") {
      type = "IMG";
      toggleSettingsDisplay("image");
    } else if (thisEl.tagName == "PRE") {
      // currentImgPreview.src = "";
      fontSizePicker.value = thisEl.style.fontSize.replace("px", "");
      fontSelector.value = thisEl.style.fontFamily.replaceAll(`"`, "");
      fontColorPicker.value = rgbToHex(thisEl.style.color);
      toggleSettingsDisplay("text");
    }
  }
  if (e.data.message == "click") {
    console.log("get click mesage");
    if (addingText) {
      let clickedPos = e.data.clickedPos;
      addText(clickedPos.x, clickedPos.y);

      addingText = false;
    }
  }
  if (e.data.message == "deselected el") {
    console.log("get deselect mesage");
  }
};

let toggleSettingsDisplay = function (type) {
  if (type == "library") {
    document.querySelector(".librarySettings").style.display = "block";
    document.querySelector(".elementSettings").style.display = "none";
  } else if (type == "image") {
    document.querySelector(".elementSettings").style.display = "block";
    document.querySelector(".showForTextEl").style.display = "none";
    document.querySelector(".showForImgEl").style.display = "block";
  } else if (type == "text") {
    document.querySelector(".elementSettings").style.display = "block";
    document.querySelector(".showForTextEl").style.display = "block";
    document.querySelector(".showForImgEl").style.display = "none";
  }
};

let iframeScript = ``;

//htmlDoc is where we update our current source of truth for what the current doc should be
// it should be up to date with change we make within the iframe
let htmlDoc = parser.parseFromString(originalSrcdoc, "text/html");

previewIframe.srcdoc = originalSrcdoc;

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

//TODO: create a wrapper for image that contains the containing div and the selection points
let addImage = function (imageSrc, xPos, yPos) {
  let img = new Image();
  img.src = imageSrc;
  img.classList.add("maxWidth");

  //Resize image so its not fuckin huge
  if (img.naturalWidth > previewIframe.getBoundingClientRect().width - 40) {
    img.style.width = `${previewIframe.getBoundingClientRect().width - 40}px`;
  }
  //Create the default cues
  setupSceneEl(img);

  img.style.left = `${xPos}px`;
  img.style.top = `${yPos}px`;

  img.classList.add("selected");
  // currentImgPreview.src = img.src;

  addElementToScene(img);
  toggleSettingsDisplay("image");
};

let setupSceneEl = function (el) {
  el.classList.add("sceneEl");
  let id = numObjects;
  numObjects++;
  el.setAttribute("data-id", id);
  el.style.zIndex = id;

  let startFrame = currentCue;
  let endFrame = currentCue + initialFrameDuration;

  if (currentCue + initialFrameDuration > frameNum) {
    endFrame = frameNum;
  }

  el.setAttribute("data-cues", generateDataCueString(startFrame, endFrame));

  startCueInput.value = startFrame;
  endCueInput.value = endFrame;

  // currentIdInput.innerHTML = id;
  currentElement = el;
};

let clearClasses = function () {
  Array.from(htmlDoc.querySelectorAll(".sceneEl")).forEach(function (sceneEl) {
    sceneEl.classList.remove("selected");
    sceneEl.classList.remove("display");
    sceneEl.classList.remove("visible");
    sceneEl.classList.remove("dragging");
    sceneEl.classList.remove("editingText");
    sceneEl.removeAttribute("contenteditable");
  });
};

let addElementToScene = function (el) {
  //Add image to scene container
  clearClasses();
  let sceneContainer = htmlDoc.querySelector("#sceneContainer");
  sceneContainer.appendChild(el);

  //Change preview iframe frame to the html

  updateIframeAndTimeline();
};

let updateCues = function (startFrame, endFrame) {
  if (endFrame >= startFrame) {
    let thisEl = htmlDoc.querySelector(
      `.sceneEl[data-id="${currentElement.dataset.id}"`
    );
    thisEl.setAttribute(
      "data-cues",
      generateDataCueString(startFrame, endFrame)
    );
    clearClasses();
    updateIframeAndTimeline();
  }
};

// KEEP IFRAME SCROLLED TO RECENT POSITION

previewIframe.onload = function () {
  this.contentWindow.scrollTo(0, currentScrollPos);
};

// IMAGE STUFF

const localStorageKey = "images";

const inputImg = document.getElementById("image-upload");
const img = document.getElementById("img");

const imageCollection = document.querySelector("#image-collection");

let imageLibrary = [];

let imageLibraryButton = document.querySelector("#image-library-button");

imageLibraryButton.addEventListener("click", function () {
  toggleSettingsDisplay("library");
});

function getImg(event) {
  const files = event.target.files; // 0 = get the first file
  let displacement = 0;
  Array.from(files).forEach(function (file) {
    let url = window.URL.createObjectURL(file);

    let newImg = new Image();
    newImg.src = url;
    newImg.classList.add("imageLibraryPreview");

    //Add images onto screen
    newImg.addEventListener("load", function () {
      addImage(
        url,
        canvasWidth / 2 - newImg.naturalWidth / 2 + displacement,
        canvasHeight / 2 - newImg.naturalHeight / 2 + displacement
      );
      displacement += 20;
    });

    newImg.addEventListener("mousedown", function (e) {
      let draggedImage = new Image();
      draggedImage.src = newImg.src;
      draggedImage.id = "draggedImage";
      document.body.appendChild(draggedImage);
      draggedImage.style.left = `${e.clientX - newImg.naturalWidth / 2}px`;
      draggedImage.style.top = `${e.clientY - newImg.naturalHeight / 2}px`;
      currentlyDraggingLibraryImage = true;
    });

    imageCollection.appendChild(newImg);
    imageLibrary.push(newImg);
  });
}

inputImg.addEventListener("change", getImg);

document.addEventListener("mousemove", function (e) {
  if (currentlyDraggingLibraryImage) {
    let draggedImage = document.querySelector("#draggedImage");
    draggedImage.style.left = `${e.clientX - draggedImage.naturalWidth / 2}px`;
    draggedImage.style.top = `${e.clientY - draggedImage.naturalHeight / 2}px`;
    document.querySelector("#preview").classList.add("inactive");
  }
});

// document.addEventListener("click", function (e) {
//   console.log(e.target);
//   if (addingText && e.target != addTextButton) {
//     console.log("should add text here");
//     let sceneContainer = htmlDoc.querySelector("#sceneContainer");
//     let clickedPos = {
//       x:
//         e.clientX -
//         previewIframe.offsetLeft -
//         sceneContainer.getBoundingClientRect().left,
//       y:
//         e.clientY -
//         previewIframe.offsetTop -
//         sceneContainer.getBoundingClientRect().top,
//     };
//     addText(clickedPos.x, clickedPos.y);
//     addingText = false;
//   }
// });

document.addEventListener("mouseup", function (e) {
  if (currentlyDraggingLibraryImage) {
    let draggedImage = document.querySelector("#draggedImage");
    let previewIframe = document.querySelector("#preview");
    let sceneContainer =
      previewIframe.contentWindow.document.querySelector("#sceneContainer");
    let correctScale = function (num) {
      let scale = new WebKitCSSMatrix(
        previewIframe.contentWindow.getComputedStyle(sceneContainer).transform
      ).a;
      return num / scale;
    };
    let droppedPos = {
      x:
        correctScale(
          e.clientX -
            previewIframe.offsetLeft -
            sceneContainer.getBoundingClientRect().left
        ) -
        draggedImage.naturalWidth / 2,
      y:
        correctScale(
          e.clientY -
            previewIframe.offsetTop -
            sceneContainer.getBoundingClientRect().top
        ) -
        draggedImage.naturalHeight / 2,
    };
    addImage(draggedImage.src, droppedPos.x, droppedPos.y);
    draggedImage.remove();
    currentlyDraggingLibraryImage = false;
    previewIframe.classList.remove("inactive");
  }
});

// previewIframe.addEventListener("mouseup", function (e) {

// });

// ADDING TEXT

let addTextButton = document.querySelector("#add-text");
var fontSelector = document.getElementById("fontSelector");
let fontSizePicker = document.getElementById("fontSize");
let fontColorPicker = document.getElementById("fontColor");
let includedFonts = [];
let addingText = false;

let currentFont = "Comic Neue";
let currentFontSize = 24;
let currentFontColor = "#000000";

function rgbToHex(color) {
  console.log(color);
  if (color[0] == "#") {
    return color;
  }
  var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
  var red = parseInt(digits[2]);
  var green = parseInt(digits[3]);
  var blue = parseInt(digits[4]);

  var rgb = blue | (green << 8) | (red << 16);
  return digits[1] + "#" + rgb.toString(16).padStart(6, "0");
}

let addText = function (xPos, yPos) {
  console.log("add text called");
  const paragraph = document.createElement("pre");
  const text = document.createTextNode("");
  paragraph.appendChild(text);
  paragraph.style.fontFamily = currentFont;
  paragraph.style.fontSize = `${currentFontSize}px`;
  paragraph.style.color = currentFontColor;
  paragraph.style.left = `${xPos}px`;
  paragraph.style.top = `${yPos}px`;
  paragraph.setAttribute("contenteditable", true);
  paragraph.focus();
  paragraph.classList.add("maxWidth");
  paragraph.classList.add("selected");

  let head = htmlDoc.querySelector("head");
  let styleHTML = fontDefinitions[currentFont];
  head.insertAdjacentHTML("beforeend", styleHTML);
  setupSceneEl(paragraph);
  addElementToScene(paragraph);
  toggleSettingsDisplay("text");
};

addTextButton.addEventListener("click", function () {
  console.log("setting adding to true");
  addingText = true;
  previewIframe.contentWindow.postMessage({ message: "adding text" });

  // document.body.style.cursor = "crosshair";
});

// TEXT SETTINGS

fontSelector.onchange = (event) => {
  currentFont = event.target.value;
  // change selected element if exists
  if (currentElement.tagName == "PRE") {
    console.log("changing font");
    let thisId = currentElement.dataset.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
    thisEl.style.fontFamily = currentFont;
    let head = htmlDoc.querySelector("head");
    let styleHTML = fontDefinitions[currentFont];
    head.insertAdjacentHTML("beforeend", styleHTML);
    updateIframeAndTimeline();
  }
};

fontColorPicker.addEventListener("change", (e) => {
  currentFontColor = e.target.value;

  if (currentElement.tagName == "PRE") {
    let thisId = currentElement.dataset.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
    thisEl.style.color = currentFontColor;
    updateIframeAndTimeline();
  }
});

fontSizePicker.addEventListener("change", (e) => {
  currentFontSize = e.target.value;

  if (currentElement.tagName == "PRE") {
    let thisId = currentElement.dataset.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
    thisEl.style.fontSize = `${currentFontSize}px`;
    updateIframeAndTimeline();
  }
});

// MANAGING FRAMES

frameAddButton.addEventListener("click", function () {
  frameNum++;
  updateFrames();
});

frameSubtractButton.addEventListener("click", function () {
  if (frameNum > 1) {
    frameNum--;
    updateFrames();
  }
});

let updateIframeAndTimeline = function () {
  previewIframe.srcdoc = htmlDoc.documentElement.outerHTML;
  updatePreviewTimeline();
};

let updateFrames = function () {
  //update inputs
  startCueInput.setAttribute("max", frameNum);
  endCueInput.setAttribute("max", frameNum);
  if (endCueInput.value > frameNum) {
    // endCueInput.value =
    //TODO!!! UPDATE EVERYTHING AND FIX BUGS WHEN WE CHANGE FRAME NUM!!!
  }
  //Update iframe
  clearClasses();
  let scrollContainer = htmlDoc.querySelector("#scrollContainer");
  scrollContainer.dataset.frameNum = frameNum;
  updateIframeAndTimeline();
};

// SENDING FORWARD AND BACK

let getZindexRange = function () {
  let highestZ = -999999999999999;
  let lowestZ = 999999999999999;
  Array.from(htmlDoc.querySelectorAll(".sceneEl")).forEach(function (sceneEl) {
    if (parseInt(sceneEl.style.zIndex) > highestZ) {
      highestZ = parseInt(sceneEl.style.zIndex);
    }
    if (parseInt(sceneEl.style.zIndex) < lowestZ) {
      lowestZ = parseInt(sceneEl.style.zIndex);
    }
  });
  return { highest: highestZ, lowest: lowestZ };
};

sendForwardButton.addEventListener("click", function () {
  let thisId = currentElement.dataset.id;
  let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
  let highestZ = getZindexRange().highest;
  if (parseInt(thisEl.style.zIndex) < highestZ) {
    thisEl.style.zIndex = highestZ + 1;
    updateIframeAndTimeline();
  }
});

sendBackButton.addEventListener("click", function () {
  let thisId = currentElement.dataset.id;
  let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
  let lowestZ = getZindexRange().lowest;
  if (parseInt(thisEl.style.zIndex) > lowestZ) {
    thisEl.style.zIndex = lowestZ - 1;
    updateIframeAndTimeline();
  }
});

// MANAGING FRAME DURATION

//Detect property change
startCueInput.addEventListener("change", (e) => {
  // NOTE: make sure maximum is set to end frame
  //Double check it's valid
  let startFrame = parseInt(startCueInput.value);
  let endFrame = parseInt(endCueInput.value);
  if (endFrame >= startFrame) {
    updateCues(startFrame, endFrame);
  }
});

//Detect property change
endCueInput.addEventListener("change", (e) => {
  //NOTE make sure minimum is set to end frame
  //Double check it's valid
  let startFrame = parseInt(startCueInput.value);
  let endFrame = parseInt(endCueInput.value);
  if (endFrame >= startFrame && endFrame < frameNum) {
    updateCues(startFrame, endFrame);
  }
});

//PREVIEW TIMELINE

let updatePreviewTimeline = function () {
  sceneWrapperContainer.innerHTML = "";
  for (var i = 0; i <= frameNum; i++) {
    let thisScene = htmlDoc.querySelector(`#sceneContainer`).cloneNode(true);
    thisScene.id = `#sceneContainer${i}`;
    thisScene.classList.add("sceneContainer");
    Array.from(thisScene.querySelectorAll(".sceneEl")).forEach(function (
      sceneEl
    ) {
      let cues = JSON.parse(sceneEl.dataset.cues);
      if (cues.includes(i)) {
        sceneEl.classList.add("visible");
        sceneEl.classList.add("display");
      } else {
        sceneEl.classList.remove("visible");
        sceneEl.classList.remove("display");
      }
    });
    thisScene.classList.add("previewScene");
    const sceneWrapper = document.createElement("div");
    sceneWrapper.classList.add("sceneWrapper");
    sceneWrapper.setAttribute("data-cue", i);

    //Cancel out transforms done in original canvas
    thisScene.style.transform = "";

    // let outerWidth = 800;
    // sceneWrapper.style.width = `calc(100% / ${frameNum + 1})`;
    // sceneWrapper.style.height = `calc(${outerWidth}px / ${
    //   frameNum + 1
    // } / 1.333333333)`;
    // thisScene.style.transform = `scale(${outerWidth / (frameNum + 1) / 800})`;
    // thisScene.style.marginRight = -800 + outerWidth / (frameNum + 1);

    sceneWrapper.addEventListener("click", function (e) {
      let cue = parseInt(e.target.dataset.cue);
      previewIframe.contentWindow.scrollTo(0, frameNumToHeight(cue - 1));
    });

    sceneWrapper.appendChild(thisScene);

    sceneWrapperContainer.appendChild(sceneWrapper);
  }
};

let updateSelectedPreviewScene = function () {
  let currentSceneWrapper = document.querySelector(
    `.sceneWrapper[data-cue="${currentCue}"]`
  );
  Array.from(document.querySelectorAll(".sceneWrapper")).forEach(function (
    sceneWrapper
  ) {
    sceneWrapper.classList.remove("selected");
  });
  currentSceneWrapper.classList.add("selected");
};

updatePreviewTimeline();
