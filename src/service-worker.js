// Replace 3.6.3 with the current version number of Workbox.
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.2/workbox-sw.js"
);

self.addEventListener("install", (event) => {
  console.log("sw installed");
  event.waitUntil(
    caches.open("v1").then((cache) => {
      return cache.addAll([
        "index.html",
        "styles.css",
        "modules/map.js",
        "modules/thirdparty/gpx.js",
        "modules/thirdparty/leaflet.filelayer.js",
        "modules/hikingTimeCalculation.js",
        "modules/swissTopo.js",
        "modules/applicationReset.js",
        "modules/mapLayer.js",
        "modules/recordMapLayer.js",
        "modules/sampleRoute.js",
        "modules/serviceWorkerRegister.js",
        "modules/localStorageTracks.js",
        "images/folder.svg",
        "images/pin-icon-end.png",
        "images/pin-icon-start.png",
        "images/pin-icon-wpt.png",
        "images/pin-shadow.png",
        "https://storage.googleapis.com/workbox-cdn/releases/6.5.2/workbox-sw.js",
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js",
      ]);
    })
  );
});

workbox.routing.registerRoute(
  ({ url }) => url.href.endsWith(".gpx"),
  new workbox.strategies.CacheFirst({
    cacheName: "gpx-file-cache",
  })
);

workbox.routing.registerRoute(
  ({ url }) =>
    url.href.indexOf("storage.googleapis.com/workbox-cdn/releases/") > 0,
  new workbox.strategies.CacheFirst({
    cacheName: "workbox-cache",
  })
);

function registerMapCache(name, host) {
  var checkMatch = function (event) {
    var match = addMapTilesToCache && event.url.host == host;
    // console.log("checking route:" + event.url + " its a match" + match, {
    //   addMapTilesToCache,
    //   match,
    // });
    return match;
  };

  workbox.routing.registerRoute(
    checkMatch,
    new workbox.strategies.CacheFirst({
      cacheName: name,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          // Only cache requests for two weeks
          maxAgeSeconds: 2 * 7 * 24 * 60 * 60,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
}
const shareTargetHandler = async ({ event }) => {
  console.log("Saving media locally...");
  const formData = await event.request.formData();
  const mediaFiles = formData.getAll("media");

  const channel = new BroadcastChannel("file_dropped");
  for (const mediaFile of mediaFiles) {
    if (!mediaFile.name) {
      console.log("Sorry! No name found on incoming media.");
      continue;
    }
    channel.postMessage({ file: mediaFile });
  }
  return Response.redirect("/?shareTarget&fileCount=" + mediaFiles.length, 303);
};

registerMapCache("openstreetmap-cache", "b.tile.openstreetmap.org");

registerMapCache("swisstopo-cache", "wmts.geo.admin.ch");

workbox.routing.registerRoute("/share-target", shareTargetHandler, "POST");

let addMapTilesToCache = false;

const broadcastChannel = new BroadcastChannel("settings_isRecording");
broadcastChannel.onmessage = (event) => {
  addMapTilesToCache = event.data.isRecording;
};
