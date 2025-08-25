import { songData as rawSongData } from '../../scores/basic_rock_1.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameBtn = document.getElementById('startGameBtn');

const NOTE_SPEED = 0.2; // pixels per millisecond
const HIT_ZONE_HEIGHT = 50;
const NOTE_RADIUS = 15;

let gameRunning = false;
let startTime = 0;
const activeNotes = [];
let currentSong = [];

// Map MIDI notes to horizontal positions on the canvas
const notePositions = {
    36: 100, // Kick
    38: 200, // Snare
    42: 300, // Closed Hi-Hat
    46: 400, // Open Hi-Hat
    49: 500, // Crash Cymbal
    51: 600, // Ride Cymbal
};

function drawHitZone() {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.fillRect(0, canvas.height - HIT_ZONE_HEIGHT, canvas.width, HIT_ZONE_HEIGHT);
    ctx.strokeStyle = 'green';
    ctx.strokeRect(0, canvas.height - HIT_ZONE_HEIGHT, canvas.width, HIT_ZONE_HEIGHT);
}

function drawNote(note) {
    ctx.beginPath();
    ctx.arc(note.x, note.y, NOTE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.closePath();
}

function gameLoop(currentTime) {
    if (!gameRunning) return;

    const elapsedTime = currentTime - startTime;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw hit zone
    drawHitZone();

    // Update and draw active notes
    for (let i = activeNotes.length - 1; i >= 0; i--) {
        const note = activeNotes[i];
        note.y = (elapsedTime - note.time) * NOTE_SPEED;

        if (note.y > canvas.height + NOTE_RADIUS) {
            // Remove notes that are off-screen
            activeNotes.splice(i, 1);
        } else {
            drawNote(note);
        }
    }

    // Spawn new notes
    while (currentSong.length > 0 && currentSong[0].time <= elapsedTime) {
        const noteData = currentSong.shift();
        const xPos = notePositions[noteData.note];
        if (xPos) {
            activeNotes.push({
                ...noteData,
                x: xPos,
                y: 0,
            });
        }
    }


    if (activeNotes.length > 0 || currentSong.length > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        endGame();
    }
}

function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    startTime = performance.now();
    activeNotes.length = 0; // Clear active notes
    // Create a deep copy of the song data so we can mutate it safely.
    currentSong = JSON.parse(JSON.stringify(rawSongData));

    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    console.log("Game Over!");
    ctx.font = "48px serif";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
}

// Initial draw
drawHitZone();

startGameBtn.addEventListener('click', startGame);