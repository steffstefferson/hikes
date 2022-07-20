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
      console.log("kicked service-worker");
    }
    caches.keys().then((keyList) => {
      return keyList.map(async (cache) => {
        return await caches.delete(cache);
      });
    });
  });
}
