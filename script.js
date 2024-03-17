let previewIframe = document.querySelector("#preview");

var parser = new DOMParser();

let numObjects = 0;

// let cueCount = document.querySelector("#cueCount");

// let currentCue = parseInt(cueCount.innerHTML);

let currentCue = 0;

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

let currentBackgroundColor = "white";

window.onmessage = function (e) {
  if (e.data.message == "update html") {
    htmlDoc = parser.parseFromString(e.data.html, "text/html");
    updatePreviewTimeline();
    updateSelectedPreviewScene();
    updateHtmlStates(e.data.html, e.data.typing);
  }

  if (e.data.message == "cue change") {
    currentCue = e.data.cueCount;
    // cueCount.innerHTML = currentCue;
    currentScrollPos = e.data.scrollPos;
    updateSelectedPreviewScene();

    // let slider = document.querySelector("#timelineSlider");

    // slider.style.left = `${
    //   (currentScrollPos / (frameNum * 600)) *
    //   timelineContainer.getBoundingClientRect().width
    // }px`;
  }

  if (e.data.message == "selected el") {
    let thisId = e.data.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${e.data.id}"`);
    currentElement = thisEl;

    if (thisEl.tagName == "IMG") {
      type = "IMG";
      toggleSettingsDisplay("image");
      thisEl.classList.contains("fill")
        ? (behaviorSelector.value = "Fill")
        : (behaviorSelector.value = "Custom");
    } else if (thisEl.tagName == "PRE") {
      fontSizePicker.value = thisEl.style.fontSize.replace("px", "");
      fontSelector.value = thisEl.style.fontFamily.replaceAll(`"`, "");
      fontColorPicker.value = rgbToHex(thisEl.style.color);
      toggleSettingsDisplay("text");
    }
    //Settings for all elements
    thisEl.classList.contains("scrollable")
      ? (behaviorSelector.value = "Scroll")
      : (behaviorSelector.value = "Fixed");
    //update values in UI
    let dataCues = JSON.parse(thisEl.dataset.cues);
    startCueInput.value = dataCues[0];
    endCueInput.value = dataCues[dataCues.length - 1];
  }
  if (e.data.message == "click") {
    if (addingText) {
      let clickedPos = e.data.clickedPos;
      addText(clickedPos.x, clickedPos.y);
      addingText = false;
    }
  }
  if (e.data.message == "deselected el") {
    toggleSettingsDisplay("canvas");
  }
};

let arrayFromSelector = function (selector) {
  return Array.from(document.querySelectorAll(selector));
};

let toggleSettingsDisplay = function (type) {
  if (type == "image") {
    arrayFromSelector(".elementSettings").forEach(function (el) {
      el.style.display = "block";
    });
    arrayFromSelector(".showForTextEl").forEach(function (el) {
      el.style.display = "none";
    });
    arrayFromSelector(".showForImgEl").forEach(function (el) {
      el.style.display = "block";
    });
    arrayFromSelector(".canvasSettings").forEach(function (el) {
      el.style.display = "none";
    });
  } else if (type == "text") {
    arrayFromSelector(".elementSettings").forEach(function (el) {
      el.style.display = "block";
    });
    arrayFromSelector(".showForTextEl").forEach(function (el) {
      el.style.display = "block";
    });
    arrayFromSelector(".showForImgEl").forEach(function (el) {
      el.style.display = "none";
    });
    arrayFromSelector(".canvasSettings").forEach(function (el) {
      el.style.display = "none";
    });
  } else if (type == "canvas") {
    arrayFromSelector(".elementSettings").forEach(function (el) {
      el.style.display = "none";
    });
    arrayFromSelector(".canvasSettings").forEach(function (el) {
      el.style.display = "block";
    });
  }
};

let iframeScript = ``;

//htmlDoc is where we update our current source of truth for what the current doc should be
// it should be up to date with change we make within the iframe
let htmlDoc = parser.parseFromString(originalSrcdoc, "text/html");

previewIframe.srcdoc = originalSrcdoc;

//TODO: create a wrapper for image that contains the containing div and the selection points
let addImage = function (image, xPos, yPos) {
  let img = new Image();
  img.src = image.src;

  //Resize image so its not fuckin huge
  if (img.naturalWidth > previewIframe.getBoundingClientRect().width - 40) {
    img.style.width = `${previewIframe.getBoundingClientRect().width - 40}px`;
  }
  //Create the default cues
  setupSceneEl(img);

  img.style.left = `${xPos}px`;
  img.style.top = `${yPos}px`;

  img.classList.add("selected");
  behaviorSelector.value = "Fixed";
  placementSelector.value = "Custom";
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

let addElementToScene = function (el, type) {
  //Add image or text to scene container
  clearClasses();
  let sceneContainer = htmlDoc.querySelector("#sceneContainer");
  sceneContainer.appendChild(el);

  //Change preview iframe frame to the html
  if (el.tagName == "IMG") {
    updateHtmlStates(htmlDoc.documentElement.outerHTML);
  }
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
    updateHtmlStates(htmlDoc.documentElement.outerHTML);
    updateIframeAndTimeline();
  }
};

document.addEventListener("keydown", function (e) {
  if (e.keyCode == "8" || e.keyCode == "46") {
    sendDeleteMessage();
  }
});

// KEEP IFRAME SCROLLED TO RECENT POSITION

previewIframe.onload = function () {
  this.contentWindow.scrollTo(0, currentScrollPos);
  previewIframe.contentWindow.postMessage({ message: "scroll to" });
};

//GENERAL ELEMENT STUFF

let deleteButton = document.querySelector("#delete");

let sendDeleteMessage = function () {
  toggleSettingsDisplay("canvas");
  previewIframe.contentWindow.postMessage({ message: "delete el" });
};

deleteButton.addEventListener("click", function () {
  sendDeleteMessage();
});

// IMAGE STUFF

const localStorageKey = "images";

const inputImg = document.getElementById("image-upload");
const img = document.getElementById("img");

const imageCollection = document.querySelector("#image-collection");

let imageLibrary = {};
let addImageButton = document.querySelector("#addImage");

let openImageButton = document.querySelector("#open-image");
let imageLibraryPanel = document.querySelector("#imageLibraryPanel");
let closeLibraryButton = document.querySelector("#closeLibrary");

let isLibraryPanelOpen = false;

// let imageLibraryButton = document.querySelector("#image-library-button");

// imageLibraryButton.addEventListener("click", function () {
//   toggleSettingsDisplay("library");
// });

let closeLibraryPanel = function () {
  isLibraryPanelOpen = false;
  imageLibraryPanel.classList.remove("show");
  scenePreviewContainer.classList.remove("libraryPanelOpen");
};

openImageButton.addEventListener("click", function () {
  isLibraryPanelOpen = !isLibraryPanelOpen;
  if (isLibraryPanelOpen) {
    imageLibraryPanel.classList.add("show");
    scenePreviewContainer.classList.add("libraryPanelOpen");
  } else {
    imageLibraryPanel.classList.remove("show");
    scenePreviewContainer.classList.remove("libraryPanelOpen");
  }
});
closeLibraryButton.addEventListener("click", function () {
  closeLibraryPanel();
});

// Background Color
let backgroundColorPicker = document.querySelector("#backgroundColor");
backgroundColorPicker.addEventListener("change", (e) => {
  currentBackgroundColor = e.target.value;
  let body = htmlDoc.querySelector("body");
  body.style.backgroundColor = currentBackgroundColor;
  clearClasses();
  updateHtmlStates(htmlDoc.documentElement.outerHTML);
  updateIframeAndTimeline();
});

let acceptedImgTypes = ["png", "jpeg", "jpg", "gif", "webp", "heic"];

function getImg(event) {
  const files = event.target.files; // 0 = get the first file
  let displacement = 0;
  let fileTypeError = false;
  Array.from(files).forEach(function (file) {
    let url = window.URL.createObjectURL(file);
    let imgType = file.type.split("/")[1];
    if (imgType == "svg+xml") {
      imgType = "svg";
    }
    if (!acceptedImgTypes.includes(imgType.toLowerCase())) {
      fileTypeError = true;
    } else {
      let newImg = new Image();
      newImg.src = url;
      newImg.classList.add("imageLibraryPreview");
      //Add images onto screen

      // newImg.addEventListener("load", function () {
      //   addImage(
      //     url,
      //     canvasWidth / 2 - newImg.naturalWidth / 2 + displacement,
      //     canvasHeight / 2 - newImg.naturalHeight / 2 + displacement
      //   );
      //   displacement += 20;
      // });

      newImg.addEventListener("mousedown", function (e) {
        let draggedImage = new Image();
        draggedImage.src = newImg.src;
        draggedImage.id = "draggedImage";
        document.body.appendChild(draggedImage);
        draggedImage.style.left = `${e.clientX - newImg.naturalWidth / 2}px`;
        draggedImage.style.top = `${e.clientY - newImg.naturalHeight / 2}px`;
        currentlyDraggingLibraryImage = true;
      });
      // newImg.addEventListener("click", function (e) {
      //   console.log("hi");
      //   addImage(
      //     url,
      //     canvasWidth / 2 - newImg.naturalWidth / 2 + displacement,
      //     canvasHeight / 2 - newImg.naturalHeight / 2 + displacement
      //   );
      //   displacement += 20;
      // });

      imageCollection.appendChild(newImg);
      imageLibrary[newImg.src] = { img: newImg, file: file, type: imgType };
    }
  });
  // Should we raise an alert?
  if (fileTypeError) {
    window.alert(
      "oops! please upload one of the following accepted file types: <br> .png, .jpeg, .jpg, .gif, .webp"
    );
  }
}

inputImg.addEventListener("change", getImg);

document.addEventListener("mousemove", function (e) {
  if (currentlyDraggingLibraryImage) {
    let draggedImage = document.querySelector("#draggedImage");
    draggedImage.style.left = `${
      e.clientX - draggedImage.getBoundingClientRect().width / 2
    }px`;
    draggedImage.style.top = `${
      e.clientY - draggedImage.getBoundingClientRect().height / 2
    }px`;
    document.querySelector("#preview").classList.add("inactive");
  }
});

document.addEventListener("click", function (e) {
  // Deselect selected els if we click elsewhere on UI
  if (!e.target.closest("#rightPanel") && !e.target.closest("#preview")) {
    previewIframe.contentWindow.postMessage({ message: "deselect" });
  }
});

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
            previewIframe.getBoundingClientRect().left -
            sceneContainer.getBoundingClientRect().left
        ) -
        draggedImage.getBoundingClientRect().width / 2,
      y:
        correctScale(
          e.clientY -
            previewIframe.getBoundingClientRect().top -
            sceneContainer.getBoundingClientRect().top
        ) -
        draggedImage.getBoundingClientRect().height / 2,
    };
    addImage(draggedImage, droppedPos.x, droppedPos.y);
    draggedImage.remove();
    currentlyDraggingLibraryImage = false;
    previewIframe.classList.remove("inactive");
  }
});

// PLACEMENT AND FIXED VS SCROLL
let behaviorSelector = document.querySelector("#behaviorSelector");
let placementSelector = document.querySelector("#placementSelector");

behaviorSelector.onchange = (event) => {
  if (event.target.value == "Scroll") {
    previewIframe.contentWindow.postMessage({ message: "toggle scroll" });
  } else if (event.target.value == "Fixed") {
    previewIframe.contentWindow.postMessage({ message: "toggle fixed" });
  }
};

placementSelector.onchange = (event) => {
  if (event.target.value == "Custom") {
    previewIframe.contentWindow.postMessage({ message: "toggle custom size" });
  } else if (event.target.value == "Fill") {
    previewIframe.contentWindow.postMessage({ message: "toggle fill size" });
  }
};

// ADDING TEXT

let addTextButton = document.querySelector("#add-text");
var fontSelector = document.getElementById("fontSelector");
let fontSizePicker = document.getElementById("fontSize");
let fontColorPicker = document.getElementById("fontColor");
let textAlignmentPicker = document.getElementById("textAlignment");
let includedFonts = [];
let addingText = false;

let currentFont = "Comic Neue";
let currentFontSize = 24;
let currentFontColor = "#000000";
let currentTextAlignment = "left";

function rgbToHex(color) {
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
  const paragraph = document.createElement("pre");
  const text = document.createTextNode("");
  paragraph.appendChild(text);
  paragraph.style.fontFamily = currentFont;
  paragraph.style.fontSize = `${currentFontSize}px`;
  paragraph.style.textAlign = currentTextAlignment;
  paragraph.style.color = currentFontColor;
  paragraph.style.left = `${xPos}px`;
  paragraph.style.top = `${yPos}px`;
  paragraph.setAttribute("contenteditable", true);
  paragraph.classList.add("selected");

  let head = htmlDoc.querySelector("head");
  let fontStyleEl = htmlDoc.querySelector("style[data-id='fonts']");
  let styleCSS = fontDefinitions[currentFont].css;
  fontStyleEl.innerHTML += styleCSS;
  includedFonts.push(currentFont);
  setupSceneEl(paragraph);
  addElementToScene(paragraph);
  toggleSettingsDisplay("text");
};

addTextButton.addEventListener("click", function () {
  addingText = true;
  previewIframe.contentWindow.postMessage({ message: "adding text" });
  closeLibraryPanel();
});

// TEXT SETTINGS

fontSelector.onchange = (event) => {
  currentFont = event.target.value;
  // change selected element if exists
  if (currentElement.tagName == "PRE") {
    let thisId = currentElement.dataset.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
    thisEl.style.fontFamily = currentFont;
    if (!includedFonts.includes(currentFont)) {
      let fontStyleEl = htmlDoc.querySelector("style[data-id='fonts']");
      let styleCSS = fontDefinitions[currentFont].css;
      fontStyleEl.innerHTML += styleCSS;
      includedFonts.push(currentFont);
    }
    updateHtmlStates(htmlDoc.documentElement.outerHTML);
    updateIframeAndTimeline();
  }
};

fontColorPicker.addEventListener("change", (e) => {
  currentFontColor = e.target.value;

  if (currentElement.tagName == "PRE") {
    let thisId = currentElement.dataset.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
    thisEl.style.color = currentFontColor;
    updateHtmlStates(htmlDoc.documentElement.outerHTML);
    updateIframeAndTimeline();
  }
});

fontSizePicker.addEventListener("change", (e) => {
  currentFontSize = e.target.value;

  if (currentElement.tagName == "PRE") {
    let thisId = currentElement.dataset.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
    thisEl.style.fontSize = `${currentFontSize}px`;
    updateHtmlStates(htmlDoc.documentElement.outerHTML);
    updateIframeAndTimeline();
  }
});

textAlignmentPicker.addEventListener("change", (e) => {
  currentTextAlignment = e.target.value;
  if (currentElement.tagName == "PRE") {
    let thisId = currentElement.dataset.id;
    let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
    thisEl.style.textAlign = currentTextAlignment;
    updateHtmlStates(htmlDoc.documentElement.outerHTML);
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
  updateHtmlStates(htmlDoc.documentElement.outerHTML);
  updateIframeAndTimeline();
};

// SENDING FORWARD AND BACK

let getZindexRange = function () {
  let highestZ = -999999999999999;
  let lowestZ = 999999999999999;
  arrayFromSelector(".sceneEl").forEach(function (sceneEl) {
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
    updateHtmlStates(htmlDoc.documentElement.outerHTML);
    updateIframeAndTimeline();
  }
});

sendBackButton.addEventListener("click", function () {
  let thisId = currentElement.dataset.id;
  let thisEl = htmlDoc.querySelector(`.sceneEl[data-id="${thisId}"`);
  let lowestZ = getZindexRange().lowest;
  if (parseInt(thisEl.style.zIndex) > lowestZ) {
    thisEl.style.zIndex = lowestZ - 1;
    updateHtmlStates(htmlDoc.documentElement.outerHTML);
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
      // Show scrollable iamges
      if (sceneEl.classList.contains("scrollable")) {
        let originalScrollPos = parseInt(sceneEl.dataset.ypos);
        sceneEl.style.transform = "";
        if (originalScrollPos >= i * 600 && originalScrollPos < (i + 1) * 600) {
          sceneEl.classList.add("visible");
          sceneEl.classList.add("display");
        } else {
          sceneEl.classList.remove("visible");
          sceneEl.classList.remove("display");
        }
      } else {
        // Show non scrollable images
        let cues = JSON.parse(sceneEl.dataset.cues);
        if (cues.includes(i)) {
          sceneEl.classList.add("visible");
          sceneEl.classList.add("display");
        } else {
          sceneEl.classList.remove("visible");
          sceneEl.classList.remove("display");
        }
      }
    });
    thisScene.classList.add("previewScene");
    const sceneWrapper = document.createElement("div");
    sceneWrapper.classList.add("sceneWrapper");
    sceneWrapper.classList.add("pixel-corners-4");
    sceneWrapper.setAttribute("data-cue", i);

    const frameNumDiv = document.createElement("div");
    frameNumDiv.innerHTML = i;
    frameNumDiv.classList.add("frameNum");

    thisScene.style.backgroundColor = currentBackgroundColor;

    //Cancel out transforms done in original canvas
    thisScene.style.transform = "";

    sceneWrapper.addEventListener("click", function (e) {
      let cue = parseInt(e.target.dataset.cue);
      previewIframe.contentWindow.scrollTo(0, frameNumToHeight(cue - 1));
    });
    sceneWrapper.appendChild(frameNumDiv);
    sceneWrapper.appendChild(thisScene);

    sceneWrapperContainer.appendChild(sceneWrapper);
  }
};

let updateSelectedPreviewScene = function () {
  let currentSceneWrapper = document.querySelector(
    `.sceneWrapper[data-cue="${currentCue}"]`
  );
  arrayFromSelector(".sceneWrapper").forEach(function (sceneWrapper) {
    sceneWrapper.classList.remove("selected");
    sceneWrapper.classList.remove("pixel-corners-4-selected");
  });
  currentSceneWrapper.classList.add("selected");
  currentSceneWrapper.classList.add("pixel-corners-4-selected");
  // check if selected is out of view.
  if (
    currentSceneWrapper.getBoundingClientRect().right >
    scenePreviewContainer.getBoundingClientRect().right
  ) {
    let displacement =
      currentSceneWrapper.getBoundingClientRect().left -
      scenePreviewContainer.getBoundingClientRect().left;
    scenePreviewContainer.scrollTo(
      scenePreviewContainer.scrollLeft + displacement,
      0
    );
  } else if (
    currentSceneWrapper.getBoundingClientRect().left <
    scenePreviewContainer.getBoundingClientRect().left
  ) {
    let displacement =
      currentSceneWrapper.getBoundingClientRect().right -
      scenePreviewContainer.getBoundingClientRect().right;
    scenePreviewContainer.scrollTo(
      scenePreviewContainer.scrollLeft + displacement,
      0
    );
  }
  // Logic to hide gradients
  if (scenePreviewContainer.scrollLeft > 0) {
    document.querySelector(".timeline-gradient-l").classList.add("show");
  } else {
    document.querySelector(".timeline-gradient-l").classList.remove("show");
  }
  if (
    scenePreviewContainer.scrollLeft + scenePreviewContainer.clientWidth ==
    scenePreviewContainer.scrollWidth
  ) {
    document.querySelector(".timeline-gradient-r").classList.remove("show");
  } else {
    document.querySelector(".timeline-gradient-r").classList.add("show");
  }
};

updatePreviewTimeline();

let generatePreviewHTML = function () {
  clearClasses();
  let htmlDocCopy = htmlDoc.cloneNode(true);
  let styleToRemove = htmlDocCopy.querySelector("style[data-id='editor']");
  styleToRemove.remove();
  let styleEl = htmlDocCopy.querySelector("style[data-id='fonts']");
  styleEl.innerHTML += exportStyle;
  htmlDocCopy.querySelector("script").innerHTML = exportScript;
  return htmlDocCopy;
};

// JS Zip stuff
let exportButton = document.querySelector("#exportButton");
exportButton.addEventListener("click", function () {
  let htmlDocCopy = htmlDoc.cloneNode(true);
  let storyTitle = document.querySelector("#title").value;
  var zip = new JSZip();

  let sceneEls = Array.from(htmlDocCopy.querySelectorAll(".sceneEl"));

  htmlDocCopy.querySelector("title").innerHTML = storyTitle;
  htmlDocCopy.querySelector("script").innerHTML = exportScript;
  let style = exportStyle;
  let styleEls = htmlDocCopy.querySelectorAll("style");
  styleEls.forEach(function (el) {
    el.remove();
  });

  let finalFonts = [];
  let finalFontPaths = [];

  sceneEls.forEach(function (sceneEl) {
    let id = sceneEl.dataset.id;
    if (sceneEl.tagName == "IMG") {
      //Collect images
      let type = imageLibrary[sceneEl.src].type;
      let blob = imageLibrary[sceneEl.src].file;
      var images = zip.folder("images");

      let fileName = `img${id}.${type}`;
      let newSrc = `images/${fileName}`;
      images.file(fileName, blob);
      sceneEl.src = newSrc;
    } else if (sceneEl.tagName == "PRE") {
      //Collect fonts
      let fontFamily = sceneEl.style.fontFamily.replaceAll(`"`, "");
      if (!finalFonts.includes(fontFamily)) {
        finalFonts.push(fontFamily);
        finalFontPaths.push(fontDefinitions[fontFamily].url);
        style += fontDefinitions[fontFamily].css;
      }
    }
    sceneEl.classList.remove("visible");
    sceneEl.classList.remove("display");
    sceneEl.setAttribute("contenteditable", false);
    sceneEl.classList.remove("selected");
    sceneEl.classList.remove("hover");
  });
  let styleEl = document.createElement("style");
  htmlDocCopy.querySelector("head").appendChild(styleEl);
  htmlDocCopy.querySelector("style").innerHTML = style;
  htmlDocCopy.querySelector("script").innerHTML = exportScript;
  zip.file("index.html", htmlDocCopy.documentElement.outerHTML);

  let loadedCount = 0;

  if (finalFontPaths.length) {
    finalFontPaths.forEach(function (path) {
      fetch(path) // 1) fetch the url
        .then(function (response) {
          if (response.status === 200 || response.status === 0) {
            return Promise.resolve(response.blob());
          } else {
            return Promise.reject(new Error(response.statusText));
          }
        })
        .then(
          function success(data) {
            zip.file(path, data);
            loadedCount++;
            if (loadedCount == finalFontPaths.length) {
              zip.generateAsync({ type: "blob" }).then(function (content) {
                saveAs(content, "myComic.zip");
              });
            }
          },
          function error(e) {
            console.log("error");
          }
        );
    });
  } else {
    zip.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, "myComic.zip");
    });
  }
});

// preview
let previewButton = document.querySelector("#previewButton");
let fullPreviewContainer = document.querySelector(".fullPreviewContainer");
let fullPreviewIframe = document.querySelector("#fullPreview");
let editor = document.querySelector(".editor");
let fullPreviewOpen = false;
previewButton.addEventListener("click", function () {
  fullPreviewOpen = !fullPreviewOpen;
  if (fullPreviewOpen) {
    fullPreviewContainer.style.display = "flex";
    editor.style.display = "none";
    previewButton.innerHTML = "Back to Editing";
    fullPreviewIframe.srcdoc = generatePreviewHTML().documentElement.outerHTML;
  } else {
    fullPreviewContainer.style.display = "none";
    editor.style.display = "flex";
    previewButton.innerHTML = "Preview";
  }
});

//Behavior for html states, undo and redo

let htmlStates = [];
let currentStateVisiting = null;
let undoButton = document.querySelector("#undo");
let redoButton = document.querySelector("#redo");
updateHtmlStates = function (htmlData, typing) {
  // Don't do this for typing updated html events
  if (!typing) {
    // are we currently visiting a state with undo/redo?
    if (currentStateVisiting == null) {
      if (htmlStates.length < 10) {
        htmlStates.push(htmlData);
      } else if (htmlStates.length == 10) {
        htmlStates.shift();
        htmlStates.push(htmlData);
      }
    } else {
      htmlStates.splice(currentStateVisiting + 1);
      htmlStates.push(htmlData);
      currentStateVisiting = null;
      redoButton.disabled = true;
    }
    if (htmlStates.length > 1) {
      undoButton.disabled = false;
    }
  }
};

undoButton.addEventListener("click", function () {
  redoButton.disabled = false;
  if (currentStateVisiting == null) {
    currentStateVisiting = htmlStates.length - 2;
  } else if (currentStateVisiting > 0) {
    currentStateVisiting--;
  }
  if (currentStateVisiting == 0) {
    undoButton.disabled = true;
  } else {
    undoButton.disabled = false;
  }
  let currentHTML = htmlStates[currentStateVisiting];
  htmlDoc = parser.parseFromString(currentHTML, "text/html");
  updateIframeAndTimeline();
});

redoButton.addEventListener("click", function () {
  undoButton.disabled = false;
  if (currentStateVisiting < htmlStates.length - 1) {
    currentStateVisiting++;
  }
  if (currentStateVisiting == htmlStates.length - 1) {
    redoButton.disabled = true;
  } else {
    redoButton.disabled = false;
  }
  let currentHTML = htmlStates[currentStateVisiting];
  htmlDoc = parser.parseFromString(currentHTML, "text/html");
  updateIframeAndTimeline();
});

updateHtmlStates(htmlDoc.documentElement.outerHTML);
