const audio = document.querySelector("audio");
const prev = document.querySelector(".prev");
const playpause = document.querySelector(".playpause");
const next = document.querySelector(".next");
const fileInput = document.querySelector("input[type='file']");
const songsList = document.querySelector("ul");
const seekBar = document.getElementById("seekBar");
const currTime = document.getElementsByClassName("currentTime")[0];
const remainingTime = document.getElementsByClassName("timeRemaining")[0];
const controls = document.getElementsByClassName("controls")[0]
const songName = document.querySelector(".songname")

let songs = [];
let currentSongIndex = 0;
let isPlaying = false;
let progressInterval = null;
const canvas = document.getElementById("canvas");





//window.addEventListener("load", ()=>controls.areaDisabled = true)


function disableControls() {
    prev.classList.add('disabled');
    playpause.classList.add('disabled');
    next.classList.add('disabled');
    songName.classList.add('disabled')
    seekBar.disabled = true;
}

// Function to enable controls
function enableControls() {
    prev.classList.remove('disabled');
    playpause.classList.remove('disabled');
    next.classList.remove('disabled');
    songName.classList.remove('disabled')
    seekBar.disabled = false;
}

// Disable controls initially
disableControls();
// Event listener for file input
fileInput.addEventListener("change", () => {
    for (const file of fileInput.files) {
        if (file) {
            const url = URL.createObjectURL(file);
            songs.push({ name: file.name, src: url });
        } else {
            alert('No files selected');
        }
    }
    updateSongsList();
    // Enable controls after files are selected
    enableControls();
});



window.addEventListener('load', () => {
    if (songs.length > 0) {
        playSong(0);
    }
});

audio.addEventListener('ended', () => {
    playNextSong();
});

function playNextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(currentSongIndex);
}

// Update songs list and add click event listeners
function updateSongsList() {
    songsList.innerHTML = "";
    songs.forEach((item, index) => {
        const songItem = document.createElement("li");
        songItem.innerHTML = item.name;
        songItem.setAttribute("class", "song");
        songsList.appendChild(songItem);

        songItem.addEventListener("click", () => {
            currentSongIndex = index;
            playSong(currentSongIndex);
        });
    });

    // Play the first song in the list by default if there are songs available
    if (songs.length > 0) {
        playSong(0);
    }
}

prev.addEventListener("click", () => {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(currentSongIndex);
});

next.addEventListener("click", () => {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(currentSongIndex);
});

playpause.addEventListener("click", () => {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
});

function playSong(index) {
    const song = songs[index];
    audio.src = song.src;
    audio.play();
    isPlaying = true;
    playpause.innerHTML = "<img src='./pause.png' height='50' width='50' alt='Pause'/>";

    // Set the current song name
    songName.innerText = song.name;

    document.querySelectorAll('.song').forEach((song, idx) => {
        song.classList.remove('active');
        if (idx === index) {
            song.classList.add('active');
            // Scroll to the currently playing song item
            song.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // Clear any previous interval
    clearInterval(progressInterval);

    // Update progress bar
    progressInterval = setInterval(updateProgress, 50);

    // Start the visualizer
    startVisualizer();
}


function updateProgress() {
    const duration = audio.duration;
    const currentTime = audio.currentTime;
    const percentage = (currentTime / duration) * 100;

    const activeSongElement = document.querySelector('.song.active');
    if (activeSongElement) {
        activeSongElement.style.setProperty('--progress-width', percentage + '%');
    }

    const formattedCurrentTime = formatTime(currentTime);
    const formattedRemainingTime = formatTime(duration - currentTime);

    currTime.innerText = formattedCurrentTime;
    remainingTime.innerText = formattedRemainingTime;
    seekBar.value = percentage;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const play = () => {
    audio.play();
    isPlaying = true;
    playpause.innerHTML = "<img src='./pause.png' height='50' width='50' alt='Pause'/>";

    // Start the progress interval
    clearInterval(progressInterval);
    progressInterval = setInterval(updateProgress, 50);
}

const pause = () => {
    audio.pause();
    isPlaying = false;
    playpause.innerHTML = "<img src='./play.png' height='50' width='50' alt='Play'/>";
    clearInterval(progressInterval);  // Clear the interval when paused
}

function startVisualizer() {
    const context = new AudioContext();
    const src = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    src.connect(analyser);
    analyser.connect(context.destination);

    analyser.fftSize = 1024;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const barWidth = (WIDTH / bufferLength) * 1.5;
    let barHeight;
    let x = 0;

    function renderFrame() {
        requestAnimationFrame(renderFrame);
        x = 0;

        analyser.getByteFrequencyData(dataArray);

        // Clear the canvas
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];

            const r = Math.min(255, barHeight + (100 * (i / bufferLength)));
            const g = Math.min(255, 255 * (i / bufferLength));
            const b = 50;

            ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    renderFrame();
}

// Event listener for seek bar input
seekBar.addEventListener("input", () => {
    const seekTime = audio.duration * (seekBar.value / 100);
    audio.currentTime = seekTime;
});

audio.addEventListener("timeupdate", () => {
    updateProgress();
});
