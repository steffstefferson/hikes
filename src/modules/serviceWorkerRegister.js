let swScope = location.href.indexOf("localhost") >= 0 ? "." : "/hikes/src/";
export function initServiceWorker() {
  //thanks jaffa
  addEventListener("focus", () => {
    installServiceWorker();
  });
  installServiceWorker();
}

function installServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js", { scope: swScope })
      .then((registration) => {
        console.log("Registration succeeded. Scope is " + registration.scope);
        registration.onupdatefound = function () {
          if (!navigator.serviceWorker.controller) {
            return;
          }
          let installingWorker = registration.installing;

          installingWorker.onstatechange = () => {
            if (installingWorker.state == "installed") {
              console.log("got new version to install");

              showNewVersionAvailableDialog();
            }
          };
        };
      })
      .catch((error) => {
        console.log("Registration failed with " + error);
      });
  }
}
function showNewVersionAvailableDialog() {
  let div = document.createElement("div");
  div.id = "newVersion";
  div.classList.add("newVersion");
  div.innerHTML = template;
  document.body.appendChild(div);

  document
    .getElementById("button_newVersionYes")
    .addEventListener("click", installNewVersion);
  document
    .getElementById("button_newVersionNo")
    .addEventListener("click", skipNewVersion);

  function installNewVersion() {
    removeDialog();
    window.location.reload();
  }
  function skipNewVersion() {
    removeDialog();
  }

  function removeDialog() {
    document
      .getElementById("button_newVersionYes")
      .removeEventListener("click", installNewVersion);
    document
      .getElementById("button_newVersionNo")
      .removeEventListener("click", skipNewVersion);

    let el = document.getElementById("newVersion");
    el.parentElement.removeChild(el);
  }
}

let template = `<div>
  New app version available! <br />
  Start it now?
  <button id="button_newVersionYes">Yes</button>
  <button id="button_newVersionNo">Nope</button>
</div>`;
