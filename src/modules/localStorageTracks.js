export function loadTracksFromLocalStorage() {
  let allTracks = localStorage.getItem("tracks");
  if (allTracks == null) return;
  var centerMap = true;
  JSON.parse(allTracks).tracks.forEach((trackMetaData) => {
    let fileContent = localStorage.getItem(trackMetaData.trackId);
    if (fileContent != null) {
      _addToMap(fileContent, centerMap);
      centerMap = false;
    }
  });
}

export function processFile(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = function (e) {
      addFileToLocalStorage(file, e.target.result, "inputFile");
      resolve(e.target.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function addFileToLocalStorage(file, content, fileSource) {
  let date = new Date().toISOString();

  let trackId = "track-" + +new Date();

  let trackMetaData = {
    trackId,
    date,
    fileSource,
    ext: file.format,
    name: file.filename,
  };

  localStorage.setItem(trackId, content);

  let allTracks = JSON.parse(localStorage.getItem("tracks"));
  if (allTracks == null) {
    allTracks = { tracks: [] };
    localStorage.setItem("tracks", JSON.stringify(allTracks));
  }
  allTracks.tracks.push(trackMetaData);
  localStorage.setItem("tracks", JSON.stringify(allTracks));
  console.log("Track with Id=" + trackId + " added to storage");
}

export function initFileDroppedChannel(fnAddToMap) {
  const broadcastChannel = new BroadcastChannel("file_dropped");
  broadcastChannel.onmessage = (event) => {
    let file = event.data.file;
    console.log("got file dropped message", file.name);
    processFile(file, "webShareTraget").then(fnAddToMap);
  };
}

function initShowLoadTrackButton() {
  let showLoadTrackButton = localStorage.getItem("showLoadTrackButton");
  if (showLoadTrackButton == null) {
    showLoadTrackButton = true;
  } else {
    showLoadTrackButton = !!+showLoadTrackButton;
  }

  let checkBox = document.getElementById("chkShowLoadTrackButton");
  checkBox.addEventListener(
    "change",
    (e) => toggleButton(e.target.checked),
    false
  );
  checkBox.checked = showLoadTrackButton;
  toggleButton(showLoadTrackButton);
}

function toggleButton(visible) {
  localStorage.setItem("showLoadTrackButton", +visible);
  toggleAddRouteIcon(visible);
}

let _map = null;
let _addToMap = null;
let _addRouteIcon = null;
export function addLoadFunctionality(map, addToMap) {
  _map = map;
  _addToMap = addToMap;
  initShowLoadTrackButton();
  loadTracksFromLocalStorage();
}

function toggleAddRouteIcon(visible) {
  if (!visible) {
    if (_addRouteIcon) {
      _addRouteIcon.remove();
    }
    return;
  }
  var style = {
    color: "red",
    opacity: 1.0,
    fillOpacity: 1.0,
    weight: 2,
    clickable: false,
  };
  L.Control.FileLayerLoad.LABEL =
    '<img class="icon" src="images/folder.svg" alt="file icon"/>';
  let control = L.Control.fileLayerLoad({
    fitBounds: true,
    layerOptions: {
      style: style,
      pointToLayer: (data, latlng) => L.circleMarker(latlng, { style: style }),
    },
  });
  control.addTo(_map);
  control.loader.on("data:loading", (e) => {
    _addToMap(e.content, true);
    addFileToLocalStorage(e, e.content, "leafletExt");
  });
  _addRouteIcon = control;
}
