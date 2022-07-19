export function loadTracksFromLocalStorage(fnTrackLoaded) {
  var allTracks = localStorage.getItem("tracks");
  if (allTracks == null) return;

  JSON.parse(allTracks).tracks.forEach((trackMetaData) => {
    var fileContent = localStorage.getItem(trackMetaData.trackId);
    if (fileContent != null) fnTrackLoaded(fileContent);
  });
}

export function processFile(file) {
  return new Promise(function (resolve, reject) {
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

  var trackId = "track-" + +new Date();

  let trackMetaData = {
    trackId,
    date,
    fileSource,
    ext: file.format,
    name: file.filename,
  };

  localStorage.setItem(trackId, content);

  var allTracks = JSON.parse(localStorage.getItem("tracks"));
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
    var file = event.data.file;
    console.log("got file dropped message", file.name);
    processFile(file, "webShareTraget").then(fnAddToMap);
  };
}
