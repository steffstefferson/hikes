export function setMapForOffline(e) {
  localStorage.setItem("addMapTilesToCache", +e.target.checked);
  broadcastValue(!!+e.target.checked);
}

function broadcastValue(addMapTilesToCache) {
  document.getElementById("recButton").style.display = addMapTilesToCache
    ? "inline"
    : "none";
  const channel = new BroadcastChannel("settings_offlineUse");
  channel.postMessage({ addMapTilesToCache });
}
export function initCheckboxMapForOffline() {
  var addMapTilesToCache = !!+localStorage.getItem("addMapTilesToCache");
  var checkBox = document.getElementById("mapOffline");
  checkBox.addEventListener("change", setMapForOffline, false);
  checkBox.checked = addMapTilesToCache;
  broadcastValue(addMapTilesToCache);
}
