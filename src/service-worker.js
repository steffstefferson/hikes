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

self.addEventListener("fetch", function (event) {
  var isGpxRoute = event.request.url.endsWith(".gpx");
  if (!isGpxRoute) {
    event.respondWith(fetch(event.request));
  } else {
    let cacheName = isGpxRoute ? "v1-gpx" : "v1";
    event.respondWith(
      caches.open(cacheName).then(function (cache) {
        return cache.match(event.request).then(function (response) {
          return (
            response ||
            fetch(event.request).then(function (response) {
              cache.put(event.request, response.clone());
              return response;
            })
          );
        });
      })
    );
  }
});
