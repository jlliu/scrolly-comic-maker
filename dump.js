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
  // currentElement = img;
  // currentImgPreview.src = currentElement.src;

  currentImgPreview.src = img.src;
  currentIdInput.innerHTML = id;

  //Add image to scene container
  let sceneContainer = htmlDoc.querySelector("#sceneContainer");
  sceneContainer.appendChild(img);

  //Change preview iframe frame to the html
  previewIframe.srcdoc = htmlDoc.documentElement.outerHTML;

  //When we add a new image, show it by default starting on this cue
  // but allow adjusting it to multiple cues
  let elementData = {
    id: id,
    imgSrc: img.src,
    position: { x: 0, y: 0 },
    startFrame: startFrame,
    endFrame: endFrame,
  };
  addedObjects.push(elementData);
  currentElement = elementData;
});

// window.top.postMessage({
//   message: "reposition img",
//   id: draggingEl.dataset.id,
//   x: draggingEl.offsetLeft,
//   y: draggingEl.offsetTop
// }); //inside the iframe
