export function clearRoutes() {
  // var allTracks = localStorage.getItem("tracks");
  // if (allTracks == null) return;

  // JSON.parse(allTracks).tracks.forEach((trackMetaData) => {
  //   localStorage.removeItem(trackMetaData.trackId);
  // });
  // localStorage.removeItem("tracks");
  // localStorage.setItem("tracks-version", +new Date());
  localStorage.clear();
}

export async function resetApplication() {
  localStorage.clear();
  resetServiceWorker().then(() => {
    location.reload();
  });
}
async function resetServiceWorker() {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log("kicked sw");
    }
    caches.keys().then((keyList) => {
      return keyList.map(async (cache) => {
        return await caches.delete(cache);
      });
    });
  });
}
