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
