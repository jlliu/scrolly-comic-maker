let addImageButton = document.querySelector("#addImage");
let previewIframe = document.querySelector("#preview");

var parser = new DOMParser();

// let addedObjects = [];

let numObjects = 0;

let cueCount = document.querySelector("#cueCount");

let currentCue = parseInt(cueCount.innerHTML);

let currentElement = null;
let startCueInput = document.querySelector("#startCue");
let endCueInput = document.querySelector("#endCue");

let currentIdInput = document.querySelector("#currentId");

let currentScrollPos = 0;

let selectedLibraryImage = null;
let currentlyDraggingLibraryImage = false;

window.onmessage = function (e) {
  // inside the parent
  if (e.data.message == "reposition img") {
    console.log("reposition image received");
    // addedObjects[e.data.id].position.x = e.data.x;
    // addedObjects[e.data.id].position.y = e.data.y;
    let thisImg = htmlDoc.querySelector(`img[data-id="${e.data.id}"`);
    thisImg.style.left = `${e.data.x}px`;
    thisImg.style.top = `${e.data.y}px`;
    // let thisEl = addedObjects[e.data.id];
    // thisEl.x = e.data.x;
    // thisEl.y = e.data.y;
    // previewIframe.srcdoc = htmlDoc.documentElement.outerHTML;
  }

  if (e.data.message == "update html") {
    console.log("updateHTML");
    // addedObjects[e.data.id].position.x = e.data.x;
    // addedObjects[e.data.id].position.y = e.data.y;
    // let thisImg = htmlDoc.querySelector(`img[data-id="${e.data.id}"`);
    // thisImg.style.left = `${e.data.x}px`;
    // thisImg.style.top = `${e.data.y}px`;

    htmlDoc = parser.parseFromString(e.data.html, "text/html");
    // let thisEl = addedObjects[e.data.id];
    // thisEl.x = e.data.x;
    // thisEl.y = e.data.y;
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
    console.log("selected image received");
    let thisId = e.data.id;
    let thisEl = htmlDoc.querySelector(`img[data-id="${e.data.id}"`);
    currentElement = thisEl;

    //update values in UI
    let dataCues = JSON.parse(thisEl.dataset.cues);
    startCueInput.value = dataCues[0];
    endCueInput.value = dataCues[dataCues.length - 1];
    currentIdInput.innerHTML = thisId;
    currentImgPreview.src = thisEl.src;
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
    console.log(cuesString);
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
  let id = numObjects;
  numObjects++;
  img.setAttribute("data-id", id);

  //Create the default cues

  let startFrame = currentCue;
  let endFrame = currentCue + 2;

  img.setAttribute("data-cues", generateDataCueString(startFrame, endFrame));
  img.style.left = `${xPos}px`;
  img.style.top = `${yPos}px`;

  startCueInput.value = startFrame;
  endCueInput.value = endFrame;

  currentImgPreview.src = img.src;
  currentIdInput.innerHTML = id;

  //Add image to scene container
  let sceneContainer = htmlDoc.querySelector("#sceneContainer");
  sceneContainer.appendChild(img);

  //Change preview iframe frame to the html

  Array.from(htmlDoc.querySelectorAll("img")).forEach(function (image) {
    image.classList.remove("selected");
    image.classList.remove("display");
    image.classList.remove("visible");
    image.classList.remove("dragging");
  });

  previewIframe.srcdoc = htmlDoc.documentElement.outerHTML;
  //Store this as current element
  currentElement = img;
};

let updateCues = function (startFrame, endFrame) {
  if (endFrame >= startFrame) {
    let thisImg = htmlDoc.querySelector(
      `img[data-id="${currentElement.dataset.id}"`
    );
    thisImg.setAttribute(
      "data-cues",
      generateDataCueString(startFrame, endFrame)
    );

    Array.from(htmlDoc.querySelectorAll("img")).forEach(function (image) {
      image.classList.remove("selected");
      image.classList.remove("display");
      image.classList.remove("visible");
      image.classList.remove("dragging");
    });
    previewIframe.srcdoc = htmlDoc.documentElement.outerHTML;
  }
};

//Detect property change
startCueInput.addEventListener("change", (e) => {
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

let imageLibrary = [];

function getImg(event) {
  const file = event.target.files[0]; // 0 = get the first file
  let url = window.URL.createObjectURL(file);

  let newImg = new Image();
  newImg.src = url;
  newImg.classList.add("imageLibraryPreview");
  newImg.addEventListener("mousedown", function (el) {
    //drag
    selectedLibraryImage = el;
    let draggedImage = new Image();
    draggedImage.src = newImg.src;
    draggedImage.id = "draggedImage";
    document.body.appendChild(draggedImage);
    currentlyDraggingLibraryImage = true;
  });
  imageCollection.appendChild(newImg);

  imageLibrary.push(newImg);
}

inputImg.addEventListener("change", getImg);

document.addEventListener("mousemove", function (e) {
  if (currentlyDraggingLibraryImage) {
    let draggedImage = document.querySelector("#draggedImage");
    draggedImage.style.left = `${e.clientX}px`;
    draggedImage.style.top = `${e.clientY}px`;
    document.querySelector("#preview").classList.add("inactive");
  }
});

document.addEventListener("mouseup", function (e) {
  if (currentlyDraggingLibraryImage) {
    let draggedImage = document.querySelector("#draggedImage");
    let previewIframe = document.querySelector("#preview");
    let droppedPos = {
      x: e.clientX - previewIframe.offsetLeft,
      y: e.clientY - previewIframe.offsetTop,
    };
    addImage(draggedImage.src, droppedPos.x, droppedPos.y);
    draggedImage.remove();
    currentlyDraggingLibraryImage = false;
    previewIframe.classList.remove("inactive");
  }
});
