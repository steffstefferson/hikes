export function checkForNewSampleRoute(fnAddToMap) {
  if (localStorage.getItem("sampleRoutesLoaded")) {
    loadSampleRoutes(fnAddToMap);
  }
}

export function loadSampleRoutes(fnAddToMap) {
  localStorage.setItem("sampleRoutesLoaded", 1);
  setTimeout(() => {
    let loadOptions = localStorage.getItem("load_options");
    if (loadOptions == null) {
      localStorage.setItem("load_options", "all");
      loadOptions = "all";
    }

    let version = localStorage.getItem("tracks-version") || "0";

    let jsonUrl = "routes/routes_generated.json?v=" + version;

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
            fnAddToMap("routes/" + route.Name);
          });
        });
    } catch (e) {
      console.log(e);
    }
  }, 0);
}
