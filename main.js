"use strict";

let localVideoUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("localVideo");
  const fileInput = document.getElementById("videoFile");
  const fpsInput = document.getElementById("framerate");
  const status = document.getElementById("videoStatus");
  const frameButtons = ["prevFrame", "nextFrame", "setStart", "setEnd"];

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (localVideoUrl) URL.revokeObjectURL(localVideoUrl);
    localVideoUrl = URL.createObjectURL(file);
    video.src = localVideoUrl;
    video.load();
    status.textContent = `Chargement : ${file.name}`;
  });

  video.addEventListener("loadedmetadata", () => {
    frameButtons.forEach(id => document.getElementById(id).disabled = false);
    status.textContent = `Vidéo prête — durée ${formatClock(video.duration)}. Le pas d’image utilise le FPS indiqué.`;
  });

  video.addEventListener("error", () => {
    status.textContent = "Impossible de lire cette vidéo dans le navigateur. Essaie un fichier MP4/H.264 ou WebM.";
    frameButtons.forEach(id => document.getElementById(id).disabled = true);
  });

  document.getElementById("prevFrame").addEventListener("click", () => seekFrame(-1));
  document.getElementById("nextFrame").addEventListener("click", () => seekFrame(1));
  document.getElementById("setStart").addEventListener("click", () => setEndpoint("startobj"));
  document.getElementById("setEnd").addEventListener("click", () => setEndpoint("endobj"));
  document.getElementById("computeButton").addEventListener("click", compute);
  document.getElementById("modMessageButton").addEventListener("click", copyModMessage);
  fpsInput.addEventListener("change", validateFPS);
  
  // YouTube-style frame stepping with keyboard shortcuts.
  document.addEventListener("keydown", (event) => {
    const active = document.activeElement;
    const tag = active?.tagName?.toLowerCase();

    // Do not intercept shortcuts while typing in a field.
    if (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      active?.isContentEditable
    ) {
      return;
    }

    // Only step through a loaded, paused video.
    if (
      video.readyState < 1 ||
      video.paused === false ||
      !video.src
    ) {
      return;
    }

    // Comma = previous frame; period = next frame.
    if (event.key === ",") {
      event.preventDefault();
      seekFrame(-1);
    } else if (event.key === ".") {
      event.preventDefault();
      seekFrame(1);
    }
  });

});

function getFPS() {
  const fps = Number.parseFloat(document.getElementById("framerate").value);
  return Number.isFinite(fps) && fps > 0 ? fps : null;
}

function seekFrame(direction) {
  const video = document.getElementById("localVideo");
  const fps = getFPS();
  if (!fps || !Number.isFinite(video.duration)) {
    alert("Entre un framerate valide et charge une vidéo.");
    return;
  }
  video.pause();
  const nextTime = Math.max(0, Math.min(video.duration, video.currentTime + direction / fps));
  video.currentTime = nextTime;
  document.getElementById("videoStatus").textContent =
    `Position : ${video.currentTime.toFixed(6)} s (environ image ${Math.round(video.currentTime * fps)} à ${fps} FPS)`;
}

function setEndpoint(id) {
  const video = document.getElementById("localVideo");
  const fps = getFPS();
  if (!fps) {
    alert("Entre un framerate valide.");
    return;
  }
  // Snap to the nearest frame boundary for the selected FPS.
  const snappedTime = Math.round(video.currentTime * fps) / fps;
  document.getElementById(id).value = snappedTime.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  document.getElementById("videoStatus").textContent =
    `${id === "startobj" ? "Départ" : "Fin"} défini à ${snappedTime.toFixed(6)} s (image ${Math.round(snappedTime * fps)}).`;
}

function compute() {
  const fps = getFPS();
  const start = Number.parseFloat(document.getElementById("startobj").value);
  const end = Number.parseFloat(document.getElementById("endobj").value);
  if (!fps || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
    alert("Vérifie le FPS et les points de départ/fin (la fin doit être après le départ).");
    return;
  }

  const totalMilliseconds = Math.round((end - start) * 1000);
  const hours = Math.floor(totalMilliseconds / 3600000);
  const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const milliseconds = totalMilliseconds % 1000;
  const finalTime = `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s ${String(milliseconds).padStart(3, "0")}ms`;
  const modMessage = `Mod Message: Time starts at ${start.toFixed(6)} and ends at ${end.toFixed(6)} at ${fps} fps to get a final time of ${finalTime}.`;
  const credits = "Retimed using [yt-frame-timer](https://martinlepro.github.io/yt-frame-timer-local-video/)";

  document.getElementById("time").value = finalTime;
  const message = document.getElementById("modMessage");
  message.disabled = false;
  message.value = `${modMessage} ${credits}`;
  document.getElementById("modMessageButton").disabled = false;
}

async function copyModMessage() {
  const textArea = document.getElementById("modMessage");
  try {
    await navigator.clipboard.writeText(textArea.value);
  } catch (_) {
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
  }
  alert("Message copié dans le presse-papiers.");
}

function validateFPS() {
  const valid = Boolean(getFPS());
  document.getElementById("framerate").setCustomValidity(valid ? "" : "Entre un framerate supérieur à zéro.");
  ["prevFrame", "nextFrame", "setStart", "setEnd", "computeButton"].forEach(id => {
    const element = document.getElementById(id);
    if (id === "computeButton") element.disabled = !valid;
    else element.disabled = !valid || !document.getElementById("localVideo").src;
  });
}

function formatClock(seconds) {
  if (!Number.isFinite(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2).padStart(5, "0");
  return `${mins}:${secs}`;
}

// Retain compatibility with YouTube's "Copy debug info" JSON, whose lct field is seconds.
function parseForTime(event) {
  try {
    const value = JSON.parse(event.target.value).lct;
    if (Number.isFinite(Number(value))) event.target.value = Number(value).toFixed(6);
  } catch (_) {
    // The fields also accept plain numeric seconds for local videos.
  }
}
