const audio = document.getElementById("audio");
const maximizeButton = document.getElementById("maximize");
const maximizeIcon = document.getElementById("maximize-icon");
const fileInput = document.getElementById("file-input");
const trackTitle = document.getElementById("track-title");
const trackSubtitle = document.getElementById("track-subtitle");
const openButton = document.getElementById("open-file");
const seek = document.getElementById("seek");
const currentTime = document.getElementById("current-time");
const duration = document.getElementById("duration");
const backButton = document.getElementById("back");
const playButton = document.getElementById("play");
const playIcon = document.getElementById("play-icon");
const forwardButton = document.getElementById("forward");
const repeatButton = document.getElementById("repeat");
const repeatIcon = document.getElementById("repeat-icon");
const fullscreenButton = document.getElementById("fullscreen");
const fullscreenIcon = document.getElementById("fullscreen-icon");

let repeat = false;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function updateProgress() {
    if (!audio.paused && !audio.ended && audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;

        seek.style.setProperty("--progress", `${progress}%`);
        seek.value = audio.currentTime;
        currentTime.textContent = formatTime(audio.currentTime);

        requestAnimationFrame(updateProgress);
    }
}

async function toggleFullscreen() {
    if(!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
    } else {
        await document.exitFullscreen();
    }
}

document.addEventListener("fullscreenchange", () => {
    const isFullscreen = !!document.fullscreenElement;

    maximizeButton.querySelector("svg").innerHTML =
        isFullscreen
            ? '<path d="M5 2H14V11 M2 5H11V14H2V5 M5 2V5 M11 11H14"/>'
            : '<rect x="2" y="3" width="12" height="9" fill="none"/>';

    fullscreenIcon.setAttribute(
        "d",
        isFullscreen
            ? "M9 3V9H3 M15 3V9H21 M3 15H9V21 M21 15H15V21"
            : "M3 9V3H9 M15 3H21V9 M21 15V21H15 M9 21H3V15"
    );

    maximizeButton.title = isFullscreen ? "Restore" : "Maximize";
    fullscreenButton.title = isFullscreen ? "Exit fullscreen" : "Fullscreen";
});

audio.addEventListener("play", () => {
    playButton.title = "Pause";
    playButton.setAttribute("aria-label", "Pause");
    playIcon.setAttribute("d", "M6 4H10V20H6ZM14 4H18V20H14Z");

    requestAnimationFrame(updateProgress);
});

audio.addEventListener("pause", () => {
    playButton.title = "Play";
    playButton.setAttribute("aria-label", "Play");
    playIcon.setAttribute("d", "M6 3L21 12L6 21V3Z");
});

audio.addEventListener("loadedmetadata", () => {
    currentTime.textContent = "0:00";
    duration.textContent = formatTime(audio.duration);
    seek.max = audio.duration;
    seek.value = 0;
    seek.style.setProperty("--progress", "0%");
});

audio.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(audio.currentTime);

    const progress = (audio.currentTime / audio.duration) * 100;
    seek.style.setProperty("--progress", `${progress}%`);
});

audio.addEventListener("ended", () => {
    seek.value = audio.duration;
    seek.style.setProperty("--progress", "100%");
    currentTime.textContent = formatTime(audio.duration);
});

maximizeButton.addEventListener("click", toggleFullscreen);

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (!file) return;

    audio.src = URL.createObjectURL(file);
    audio.load();

    trackTitle.textContent = file.name;
    trackSubtitle.textContent = "Ready to play";
});

openButton.addEventListener("click", () => fileInput.click());

seek.addEventListener("input", () => {
    audio.currentTime = seek.value;

    const progress = (seek.value / seek.max) * 100;
    seek.style.setProperty("--progress", `${progress}%`);
});

backButton.addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime -10);
});

playButton.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
});

forwardButton.addEventListener("click", () => {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
});

repeatButton.addEventListener("click", () => {
    repeat = !repeat;
    audio.loop = repeat;
    repeatButton.classList.toggle("active", repeat);
});

fullscreenButton.addEventListener("click", toggleFullscreen);