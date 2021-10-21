(function (window) {
  "use strict";
  var map = null;
  function initMap() {
    var control;
    var L = window.L;
    var osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "Map data &copy; 2013 OpenStreetMap contributors",
    });
    map = L.map("map", {
      center: [0, 0],
      zoom: 2,
    }).addLayer(osm);
    var style = {
      color: "red",
      opacity: 1.0,
      fillOpacity: 1.0,
      weight: 2,
      clickable: false,
    };
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

  function addToMap(gpx) {
    new L.GPX(gpx, {
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
        map.fitBounds(e.target.getBounds());
      })
      .addTo(map);
  }

  window.addEventListener("load", function () {
    initMap();
    initRoutes();
  });
})(window);
