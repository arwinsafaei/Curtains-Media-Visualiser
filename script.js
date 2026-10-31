const audio=document.getElementById("audio");
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