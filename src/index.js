import { checkForSwissTopoInfo } from "./modules/swissTopo.js";
import { calculateHikingTime } from "./modules/hikingTimeCalculation.js";

var map = null;
var currentMapTileLayer = null;
var onceCentered = false;
export function initMap() {
  var L = window.L;

  map = L.map("map", {
    center: [0, 0],
    zoom: 2,
  });
  setMapLayer();
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
      tourInfo.swissTopoInfo.ascent || tourInfo.elevation.gain
    )} m</div>
    <div>Down: ${Math.round(
      tourInfo.swissTopoInfo.descent || tourInfo.elevation.loss
    )} m</div>
    <div>Min elevation: ${Math.round(tourInfo.elevation.min)} m</div>
    <div>Max elevation: ${Math.round(tourInfo.elevation.max)} m</div>
    <div>Length: ${
      Math.round((tourInfo.swissTopoInfo.length || tourInfo.length) / 10) / 100
    } km</div>
    <div>Estimate: ${
      tourInfo.swissTopoInfo.estimatedHikingTimeInHours ||
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
