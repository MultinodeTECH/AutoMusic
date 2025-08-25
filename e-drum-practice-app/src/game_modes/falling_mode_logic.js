import { NOTE_SPEED } from '../config.js';
import * as scoring from '../core/scoring_system.js';
import * as ui from '../ui/ui_controller.js';

// --- Configuration ---
const CANVAS_HEIGHT = 600; // TODO: Get from a shared config/state
const HIT_ZONE_HEIGHT = 50;
const HIT_ZONE_Y = CANVAS_HEIGHT - HIT_ZONE_HEIGHT;
const NOTE_RADIUS = 15;

// Map MIDI notes to horizontal positions
const notePositions = {
    36: 100, 37: 100, // Kick
    38: 200, 40: 200, // Snare
    42: 300, 44: 300, // Closed Hi-Hat
    46: 400, // Open Hi-Hat
    49: 500, 55: 500, 57: 500, // Crash
    51: 600, 52: 600, 59: 600, // Ride
    41: 550, 43: 550, // Low Tom
    45: 450, 47: 450, 48: 450, 50: 450, // Mid/High Toms
};

let songData = [];
let noteSpawnIndex = 0;

export function onStart(state) {
    songData = JSON.parse(JSON.stringify(state.currentSongData));
    noteSpawnIndex = 0;
    scoring.resetScore();
    ui.updateScoreDisplay();
    ui.setGameInProgressUI();
    return {
        ...state,
        notes: [],
        hitEffects: [],
        score: 0,
        combo: 0,
    };
}

export function onStop(state) {
    ui.setGameEndedUI();
    return state;
}

export function update(state, currentTime, actions) {
    if (!state.gameRunning) {
        return state;
    }

    const elapsedTime = currentTime - state.startTime;
    let notes = state.notes || [];
    let hitEffects = state.hitEffects || [];
    let score = state.score;
    let combo = state.combo;

    // 1. Handle player input (hits)
    const noteOnActions = actions.filter(a => a.type === 'NOTE_ON');
    if (noteOnActions.length > 0) {
        noteOnActions.forEach(action => {
            const hitNoteNumber = action.payload.note;
            const hitX = notePositions[hitNoteNumber];
            let hitSuccess = false;

            // Find the lowest note in the correct lane that is inside the hit zone
            let bestCandidate = null;
            for (const note of notes) {
                if (note.x === hitX) {
                    const dist = Math.abs(note.y - HIT_ZONE_Y);
                    if (dist < HIT_ZONE_HEIGHT / 2) { // Inside hit zone
                        if (!bestCandidate || note.y > bestCandidate.y) {
                            bestCandidate = note;
                        }
                    }
                }
            }

            if (bestCandidate) {
                hitSuccess = true;
                // Remove the hit note
                notes = notes.filter(n => n.id !== bestCandidate.id);

                // Update score
                const scoreResult = scoring.calculateScore(score, combo, 'perfect'); // Simplified for now
                score = scoreResult.newScore;
                combo = scoreResult.newCombo;
                ui.updateScoreDisplay(score, combo);

                // Add a visual effect
                hitEffects.push({
                    x: bestCandidate.x,
                    y: HIT_ZONE_Y,
                    startTime: Date.now(),
                    duration: 200,
                    startRadius: NOTE_RADIUS,
                    maxRadius: NOTE_RADIUS + 30,
                });
            }
        });
    }

    // 2. Spawn new notes
    while (noteSpawnIndex < songData.length && songData[noteSpawnIndex].time <= elapsedTime) {
        const noteData = songData[noteSpawnIndex];
        const xPos = notePositions[noteData.note];
        if (xPos) {
            notes.push({
                ...noteData,
                id: `note-${noteData.time}-${noteData.note}`,
                x: xPos,
                y: 0,
            });
        }
        noteSpawnIndex++;
    }

    // 3. Update positions and handle missed notes
    const remainingNotes = [];
    for (const note of notes) {
        const noteElapsedTime = elapsedTime - note.time;
        note.y = noteElapsedTime * NOTE_SPEED;

        if (note.y > CANVAS_HEIGHT) {
            // Note missed
            combo = 0; // Reset combo
            ui.updateScoreDisplay(score, combo);
            // Optionally, add a "miss" effect here
        } else {
            remainingNotes.push(note);
        }
    }

    // 4. Return the new state
    return {
        ...state,
        notes: remainingNotes,
        hitEffects,
        score,
        combo,
    };
}