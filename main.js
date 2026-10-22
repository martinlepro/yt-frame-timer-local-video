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

  // Départ / Fin : accepte secondes à la main, bouton du lecteur local, ou JSON « Copy debug info » YouTube.
  ["startobj", "endobj"].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener("change", parseForTime);
    input.addEventListener("paste", () => setTimeout(() => parseForTime({ target: input }), 0));
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
  const startParsed = extractSeconds(document.getElementById("startobj").value);
  const endParsed = extractSeconds(document.getElementById("endobj").value);
  const start = startParsed ? startParsed.seconds : NaN;
  const end = endParsed ? endParsed.seconds : NaN;
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
  const credits = "Retimed using [yt-frame-timer](https://slashinfty.github.io/yt-frame-timer)";

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

// Extrait un temps en secondes depuis : un nombre simple, ou le JSON « Copy debug info » de YouTube (champ lct).
function extractSeconds(raw) {
  const text = String(raw).trim();
  if (!text) return null;
  const plain = Number(text.replace(",", "."));
  if (Number.isFinite(plain)) return { seconds: plain, fromYouTube: false };
  try {
    const lct = Number(JSON.parse(text).lct);
    if (Number.isFinite(lct)) return { seconds: lct, fromYouTube: true };
  } catch (_) {
    // JSON invalide : tentative par expression régulière (texte copié partiellement).
  }
  const match = text.match(/"lct"\s*:\s*"?(-?\d+(?:\.\d+)?)"?/);
  return match ? { seconds: Number(match[1]), fromYouTube: true } : null;
}

function parseForTime(event) {
  const input = event.target;
  const parsed = extractSeconds(input.value);
  const status = document.getElementById("videoStatus");
  if (!parsed) {
    if (input.value.trim()) {
      input.setCustomValidity("Valeur non reconnue : entre des secondes ou colle le « Copy debug info » YouTube.");
      input.reportValidity();
    }
    return;
  }
  input.setCustomValidity("");
  let seconds = parsed.seconds;
  const fps = getFPS();
  // Pour YouTube, on aligne sur l'image (comme l'outil d'origine) ; pour une saisie manuelle, on garde la valeur telle quelle.
  if (parsed.fromYouTube && fps) seconds = Math.floor(seconds * fps + 1e-6) / fps;
  input.value = seconds.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  if (parsed.fromYouTube) {
    status.textContent = `${input.id === "startobj" ? "Départ" : "Fin"} importé depuis YouTube : ${input.value} s.`;
  }
}
