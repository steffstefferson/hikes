function toggleButton(visible) {
  localStorage.setItem("showRecordButton", +visible);
  setRecording(visible);
  document.getElementById("recButton").checked = visible;
  document.getElementById("recButton").style.display = visible
    ? "inline"
    : "none";
}

function setRecording(isRecording) {
  localStorage.setItem("isRecording", isRecording);
  broadcastIsRecording(isRecording);
}

export function toggleRecording() {
  var isRecording = !!+localStorage.getItem("isRecording");
  setRecording(!isRecording);
}

function broadcastIsRecording(isRecording) {
  const channel = new BroadcastChannel("settings_isRecording");
  channel.postMessage({ isRecording });
}

export function initCheckboxMapForOffline() {
  var showRecordButton = !!+localStorage.getItem("showRecordButton");

  var checkBox = document.getElementById("chkShowRecordButton");
  checkBox.addEventListener(
    "change",
    (e) => toggleButton(e.target.checked),
    false
  );
  checkBox.checked = showRecordButton;

  var recordButton = document.getElementById("recButton");
  recordButton.addEventListener("change", toggleRecording, false);
  toggleButton(showRecordButton);
}
