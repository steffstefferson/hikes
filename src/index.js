(function (window) {
  "use strict";
  var map = null;
  function initMap() {
    var L = window.L;
    var osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "Map data &copy; 2021 OpenStreetMap contributors",
    });
    map = L.map("map", {
      center: [0, 0],
      zoom: 2,
    }).addLayer(osm);
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
      .addTo(map);
  }

  function getHtmlInfoElement(tourInfo) {
    var template = `<div class="tourpopup">
    <h1>${tourInfo.name}</h1>
    <div>Up: ${Math.round(tourInfo.elevation.gain)} m</div>
    <div>Down: ${Math.round(tourInfo.elevation.loss)} m</div>
    <div>Max: ${Math.round(tourInfo.elevation.max)} m</div>
    <div>Min: ${Math.round(tourInfo.elevation.min)} m</div>
    <div>Length: ${Math.round(tourInfo.length / 10) / 100} km</div> 
    </div>`;
    return template;
  }

  window.addEventListener("load", function () {
    initMap();
    initRoutes();
  });
})(window);
