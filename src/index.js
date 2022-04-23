import { checkForSwissTopoInfo } from "./modules/swissTopo.js";
import { calculateHikingTime } from "./modules/hikingTimeCalculation.js";

var map = null;
var currentMapTileLayer = null;
var onceCentered = false;
export function initMap() {
  var L = window.L;

  map = L.map("map", {
    center: [47.17599, 7.33801],
    zoom: 12,
  });
  setMapLayer();
}
export function addLoadFunctionality() {
  addRouteIcon();
  loadTracksFromLocalStorage();
}

function addRouteIcon() {
  console.log("add route icon");
  var style = {
    color: "red",
    opacity: 1.0,
    fillOpacity: 1.0,
    weight: 2,
    clickable: false,
  };
  L.Control.FileLayerLoad.LABEL =
    '<img class="icon" src="folder.svg" alt="file icon"/>';
  let control = L.Control.fileLayerLoad({
    fitBounds: true,
    layerOptions: {
      style: style,
      pointToLayer: function (data, latlng) {
        return L.circleMarker(latlng, { style: style });
      },
    },
  });
  control.addTo(map);
  control.loader.on("data:loading", function (e) {
    addFileToLocalStorage(e);
  });
}

function loadTracksFromLocalStorage() {
  var allTracks = localStorage.getItem("tracks");
  if (allTracks == null) return;

  JSON.parse(allTracks).tracks.forEach((trackMetaData) => {
    addTrackToMap(trackMetaData);
  });
}

export function clearRoutes() {
  var allTracks = localStorage.getItem("tracks");
  if (allTracks == null) return;

  JSON.parse(allTracks).tracks.forEach((trackMetaData) => {
    localStorage.removeItem(trackMetaData.trackId);
  });
  localStorage.removeItem("tracks");
}

function addTrackToMap(trackMetaData) {
  console.log("load track from localStorage" + trackMetaData.trackId);
  var fileContent = localStorage.getItem(trackMetaData.trackId);
  if (fileContent != null) addToMap(fileContent);
}

function addFileToLocalStorage(file) {
  let date = new Date().toISOString();

  var trackId = "track-" + +new Date();

  let trackMetaData = {
    trackId,
    date,
    ext: file.format,
    name: file.filename,
  };

  localStorage.setItem(trackId, file.content);

  var allTracks = JSON.parse(localStorage.getItem("tracks"));
  if (allTracks == null) {
    allTracks = { tracks: [] };
    localStorage.setItem("tracks", JSON.stringify(allTracks));
  }
  allTracks.tracks.push(trackMetaData);
  localStorage.setItem("tracks", JSON.stringify(allTracks));
  console.log("Track with Id=" + trackId + " added to storage");
}

export function initRoutes() {
  setTimeout(() => {
    var loadOptions = localStorage.getItem("load_options");
    if (loadOptions == null) {
      localStorage.setItem("load_options", "all");
      loadOptions = "all";
    }

    var jsonUrl = "routes/routes_generated.json";

    if (loadOptions != "all") {
      jsonUrl = "routes/routes_generated_sample.json";
    }

    try {
      fetch(jsonUrl)
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          result.routes.forEach((route) => {
            console.log(route.Name);
            addToMap("routes/" + route.Name);
          });
        });
    } catch (e) {
      console.log(e);
    }
  }, 0);
}

function addToMap(gpxFileName) {
  let defaultPolyLineOptions = {
    color: "red",
    opacity: 0.75,
    weight: 3,
    lineCap: "round",
  };

  let hoverPolyLineOptions = {
    color: "green",
    opacity: 1,
    weight: 6,
    lineCap: "round",
  };

  new L.GPX(gpxFileName, {
    async: true,
    marker_options: {
      startIconUrl: "images/pin-icon-start.png",
      endIconUrl: "images/pin-icon-end.png",
      shadowUrl: "images/pin-shadow.png",
      wptIconUrls: {
        "": null,
      },
    },
    polyline_options: defaultPolyLineOptions,
  })
    .on("loaded", function (e) {
      e.target.bindTooltip(getHtmlInfoElement(e.target._info));
      if (!onceCentered) {
        map.fitBounds(e.target.getBounds());
        onceCentered = true;
      }
    })
    .on("addline", function (l) {
      let totalHikingTime = calculateHikingTime(l.line.getLatLngs());
      var minutes = parseInt(
        (totalHikingTime - parseInt(totalHikingTime)) * 60
      );
      l.sourceTarget._info.estimatedHikingTimeInHours =
        parseInt(totalHikingTime) + "h " + minutes + "min";
    })
    .on("mouseover", function (ev) {
      ev.layer.setStyle(hoverPolyLineOptions);
      ev.layer.bringToFront();
    })
    .on("mouseout", function (ev) {
      ev.layer.setStyle(defaultPolyLineOptions);
    })
    .on("addpoint", enrichWithSwissTopoInfo)
    .on("skippoint", enrichWithSwissTopoInfo)
    .addTo(map);
}

function enrichWithSwissTopoInfo(x) {
  var swissTopoInfo = checkForSwissTopoInfo(x);

  if (swissTopoInfo != null) {
    x.sourceTarget._info.swissTopoInfo = swissTopoInfo;
  }
}

function getHtmlInfoElement(tourInfo) {
  var template = `<div class="tourpopup">
    <h1>${tourInfo.name}</h1>
    <div>Up: ${Math.round(
      tourInfo.swissTopoInfo?.ascent || tourInfo.elevation.gain
    )} m</div>
    <div>Down: ${Math.round(
      tourInfo.swissTopoInfo?.descent || tourInfo.elevation.loss
    )} m</div>
    <div>Min elevation: ${Math.round(tourInfo.elevation.min)} m</div>
    <div>Max elevation: ${Math.round(tourInfo.elevation.max)} m</div>
    <div>Length: ${
      Math.round((tourInfo.swissTopoInfo?.length || tourInfo.length) / 10) / 100
    } km</div>
    <div>Estimate: ${
      tourInfo.swissTopoInfo?.estimatedHikingTimeInHours ||
      tourInfo.estimatedHikingTimeInHours
    }</div>

    </div>`;
  return template;
}

function setMapLayer() {
  if (localStorage.getItem("mapLayer") == "OpenStreetMap") {
    changeToOpenStreetMap();
  } else {
    changeToSwissTopo();
  }
}

export function changeToOpenStreetMap() {
  var osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data &copy; 2021 OpenStreetMap contributors",
  });
  addLayer(osm, "OpenStreetMap");
}

export function changeToSwissTopo() {
  var swissTopo = L.tileLayer(
    "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
    {
      attribution: "swisstopo",
    }
  );
  addLayer(swissTopo, "SwissTopo");
}

export function installServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js", { scope: "." })
      .then((reg) => {
        console.log("Registration succeeded. Scope is " + reg.scope);
      })
      .catch((error) => {
        console.log("Registration failed with " + error);
      });
  }
}

export async function kickServiceWorker() {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log("kicked sw");
    }
    caches.keys().then((keyList) => {
      return keyList.map(async (cache) => {
        if (cache == "v1") {
          console.log("Service Worker: Removing old cache: " + cache);
          return await caches.delete(cache);
        }
      });
    });
  });
}

function addLayer(layer, layerName) {
  localStorage.setItem("mapLayer", layerName);
  map.eachLayer((x) => {
    if (x._leaflet_id == currentMapTileLayer) {
      map.removeLayer(x);
    }
  });
  map.addLayer(layer);
  currentMapTileLayer = layer._leaflet_id;
}
