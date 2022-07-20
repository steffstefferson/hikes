let _map = null;
let currentMapTileLayer = null;

export function layerChanged(layerName) {
  switch (layerName) {
    case "openstreetmap":
      return changeToOpenStreetMap();
    default:
      changeToSwissTopo();
  }
}

function changeToOpenStreetMap() {
  let osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data &copy; 2022 OpenStreetMap contributors",
  });
  addLayer(osm, "openstreetmap");
}

function changeToSwissTopo() {
  let swissTopo = L.tileLayer(
    "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
    {
      attribution: "swisstopo",
    }
  );
  addLayer(swissTopo, "swisstopo");
}

function addLayer(layer, layerName) {
  localStorage.setItem("mapLayer", layerName);
  _map.eachLayer((x) => {
    if (x._leaflet_id == currentMapTileLayer) {
      _map.removeLayer(x);
    }
  });
  _map.addLayer(layer);
  currentMapTileLayer = layer._leaflet_id;
}

export function initMapLayer(map) {
  _map = map;
  let dropdown = document.getElementById("selectLayer");
  dropdown.addEventListener(
    "change",
    (e) => layerChanged(e.target.value),
    false
  );
  let initValue = localStorage.getItem("mapLayer");
  dropdown.value = initValue;
  layerChanged(initValue);
}
