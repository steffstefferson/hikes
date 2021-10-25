var map = null;
var currentMapTileLayer = null;

function initMap() {
  var L = window.L;

  map = L.map("map", {
    center: [0, 0],
    zoom: 2,
  });
  setMapLayer();
}

function initRoutes() {
  var jsonUrl =
    location.href.indexOf("127.0.0.1") >= 0
      ? "routes/routes_generated_sample.json"
      : "routes/routes_generated.json";

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
      map.fitBounds(e.target.getBounds());
    })
    .on("addline", function (l) {
      let totalHikingTime = calculateHikingTime(l.line.getLatLngs());
      var minutes = parseInt(
        (totalHikingTime - parseInt(totalHikingTime)) * 60
      );
      l.sourceTarget._info.estimatedHikingTimeInHours =
        parseInt(totalHikingTime) + "h " + minutes + "min";
    })
    .addTo(map);
}

function getHtmlInfoElement(tourInfo) {
  var template = `<div class="tourpopup">
    <h1>${tourInfo.name}</h1>
    <div>Up: ${Math.round(tourInfo.elevation.gain)} m</div>
    <div>Down: ${Math.round(tourInfo.elevation.loss)} m</div>
    <div>Max elevation: ${Math.round(tourInfo.elevation.max)} m</div>
    <div>Min elevation: ${Math.round(tourInfo.elevation.min)} m</div>
    <div>Length: ${Math.round(tourInfo.length / 10) / 100} km</div>
    <div>Estimate: ${tourInfo.estimatedHikingTimeInHours}</div>

    </div>`;
  return template;
}

window.addEventListener("load", function () {
  initMap();
  initRoutes();
});

function setMapLayer() {
  if (localStorage.getItem("mapLayer") == "OpenStreetMap") {
    changeToOpenStreetMap();
  } else {
    changeToSwissTopo();
  }
}

function changeToOpenStreetMap() {
  var osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data &copy; 2021 OpenStreetMap contributors",
  });
  addLayer(osm, "OpenStreetMap");
}

function changeToSwissTopo() {
  var swissTopo = L.tileLayer(
    "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
    {
      attribution: "swisstopo",
    }
  );
  addLayer(swissTopo, "SwissTopo");
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

//https://www.wanderndeluxe.de/en/calculate-hiking-time-distance-altitude/
function calculateHikingTime(l) {
  var lastPoint = null;
  var totalHikingTimeDistance = 0;
  var totalElevation = 0;
  var totalDistance = 0;
  var totalHikingTimeElevation = 0;
  l.forEach((x) => {
    if (lastPoint == null) {
      lastPoint = x;
      return;
    }

    var distanceInKm = getDistanceFromLatLonInKm(
      x.lat,
      x.lng,
      lastPoint.lat,
      lastPoint.lng
    );

    if (isNaN(lastPoint.meta.ele) || isNaN(x.meta.ele)) {
      totalHikingTimeElevation = totalHikingTimeDistance = NaN;
      return;
    }

    var elevation = x.meta.ele - lastPoint.meta.ele;
    totalElevation += elevation;
    totalDistance += distanceInKm;
    totalHikingTimeElevation += getHikingTimeElevation(elevation);
    totalHikingTimeDistance += distanceInKm / 4; // 4KM / h
    lastPoint = x;
  });

  var time =
    Math.max(totalHikingTimeElevation, totalHikingTimeDistance) +
    Math.min(totalHikingTimeElevation, totalHikingTimeDistance) / 2;
  return time;
}

function getHikingTimeElevation(elevationInMeter) {
  //ascent
  var elevationFactor = elevationInMeter / 300; //300hm / h
  if (elevationInMeter < 0) {
    //descent
    elevationFactor = (elevationInMeter * -1) / 500; //500hm / h
  }
  return elevationFactor;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
