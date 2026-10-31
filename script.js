const seek = document.getElementById("seek");

seek.addEventListener("input", () => {
    seek.style.setProperty("--progress", `${seek.value}%`);
});

seek.style.setProperty("--progress", "0%");