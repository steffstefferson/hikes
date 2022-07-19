import { checkForSwissTopoInfo } from "./modules/swissTopo.js";
import { calculateHikingTime } from "./modules/hikingTimeCalculation.js";

var map = null;
var onceCentered = false;
export function initMap() {
  var L = window.L;

  map = L.map("map", {
    center: [47.17599, 7.33801],
    zoom: 12,
  });
  return map;
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
    '<img class="icon" src="images/folder.svg" alt="file icon"/>';
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

    var version = localStorage.getItem("tracks-version") || "0";

    var jsonUrl = "routes/routes_generated.json?v=" + version;

    if (loadOptions != "all") {
      jsonUrl = "routes/routes_generated_sample.json?v=" + version;
    }

    try {
      fetch(jsonUrl)
        .then((response) => response.json())
        .then((result) => {
          console.log(result);
          result.routes.forEach((route) => {
            console.log("add route to map" + route.Name);
            addToMap("routes/" + route.Name);
          });
        });
    } catch (e) {
      console.log(e);
    }
  }, 0);
}

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
    .on("click", function (ev) {
      console.log("clicked", ev.layer);
      if (lastHighlightedTrack == ev.layer) {
        lastHighlightedTrack = null;
        ev.layer.setStyle(defaultPolyLineOptions);
      } else {
        hideLastTrack();
        lastHighlightedTrack = ev.layer;
        ev.layer.setStyle(hoverPolyLineOptions);
        ev.layer.bringToFront();
      }
    })
    .on("mouseover", function (ev) {
      ev.layer.setStyle(hoverPolyLineOptions);
      ev.layer.bringToFront();
    })
    .on("mouseout", function (ev) {
      if (ev.layer != lastHighlightedTrack) {
        ev.layer.setStyle(defaultPolyLineOptions);
      }
    })
    .on("addpoint", enrichWithSwissTopoInfo)
    .on("skippoint", enrichWithSwissTopoInfo)
    .addTo(map);
}
let lastHighlightedTrack = null;
function hideLastTrack() {
  if (lastHighlightedTrack && lastHighlightedTrack.setStyle) {
    lastHighlightedTrack.setStyle(defaultPolyLineOptions);
  }
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
