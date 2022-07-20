import { checkForSwissTopoInfo } from "./swissTopo.js";
import { calculateHikingTime } from "./hikingTimeCalculation.js";

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

export function addToMap(gpxFileName) {
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
      ev.layer.setStyle && ev.layer.setStyle(hoverPolyLineOptions);
      ev.layer.bringToFront && ev.layer.bringToFront();
    })
    .on("mouseout", function (ev) {
      if (ev.layer && ev.layer.setStyle && ev.layer != lastHighlightedTrack) {
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
