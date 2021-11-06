self.addEventListener("install", (event) => {
  console.log("sw installed");
  event.waitUntil(
    caches.open("v1").then((cache) => {
      return cache.addAll([
        "index.html",
        "styles.css",
        "index.js",
        "gpx.js",
        "leaflet.filelayer.js",
      ]);
    })
  );
});
