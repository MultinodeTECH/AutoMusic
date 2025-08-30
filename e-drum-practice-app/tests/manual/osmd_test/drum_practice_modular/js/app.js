import { domElements, updateScore, showResults, showFeedback } from './ui.js';
import { scoreLibrary } from './config.js';

// --- OSMD Instances ---
let osmdTarget;
let osmdUser;

// --- State Management ---
const MAX_ERROR_WINDOW = 200; // ms
let accuracyHistory = [];

let userNotes = [];
let isPlaying = false;
let timeoutId = null;
let currentTargetNote = null;
let nextTargetNoteIdealHitTime = 0;
let audioPerformanceOffset = 0; // To sync performance.now() with AudioContext time
let stats = { totalNotes: 0, hits: 0, misses: 0, extras: 0, score: 0 };
let metronome;

// A more precise Metronome using the Web Audio API's scheduler
class Metronome {
    constructor(audioContext) {
        this.audioCtx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        this.frequency = 880; // High pitch for clarity
        this.duration = 0.05; // 50ms click
    }

    // This method schedules a click to happen at a precise time in the future.
    // `time` is an absolute timestamp from the AudioContext's clock.
    play(time) {
        if (!this.audioCtx) return;

        // Resume context if it was suspended (e.g., by browser auto-play policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.frequency.setValueAtTime(this.frequency, time);
        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + this.duration);

        oscillator.start(time);
        oscillator.stop(time + this.duration);
    }
}
// --- Realtime Transcription State ---
let isRecording = false;
let lastHitTime = 0;
let completedMeasures = 0;
let currentMeasureTicks = 0;

// --- MusicXML Generation (for user score) ---
function generateMusicXML(notes = [], measureCount = 1) {
    const divisions = 4; // 16th note is the smallest unit
    const maxTicksPerMeasure = 16; // 4/4 time, 4 * 4 = 16

    const typeToDuration = {
        'whole': 16, 'half': 8, 'quarter': 4, 'eighth': 2, '16th': 1
    };

    let measures = [];
    let currentMeasureTicks = 0;
    let currentMeasureNotes = '';

    const attributes = `
        <attributes>
            <divisions>${divisions}</divisions>
            <key><fifths>0</fifths></key>
            <time><beats>4</beats><beat-type>4</beat-type></time>
            <clef><sign>percussion</sign></clef>
        </attributes>`;

    for (const note of notes) {
        const durationTicks = typeToDuration[note.type] || 1;

        if (currentMeasureTicks >= maxTicksPerMeasure) {
            measures.push(currentMeasureNotes);
            currentMeasureNotes = '';
            currentMeasureTicks = 0;
        }

        const colorXml = note.color ? `<color>${note.color}</color>` : '';
        currentMeasureNotes += `
            <note>
                <unpitched>
                    <display-step>C</display-step>
                    <display-octave>5</display-octave>
                </unpitched>
                <duration>${durationTicks}</duration>
                <voice>1</voice>
                <type>${note.type}</type>
                <stem>up</stem>
                <notehead>x</notehead>
                ${colorXml}
            </note>`;
        currentMeasureTicks += durationTicks;
    }

    if (currentMeasureTicks > 0) {
        if (currentMeasureTicks < maxTicksPerMeasure) {
            const restTicks = maxTicksPerMeasure - currentMeasureTicks;
            currentMeasureNotes += `<note><rest/><duration>${restTicks}</duration></note>`;
        }
        measures.push(currentMeasureNotes);
    }

    while (measures.length < measureCount) {
        measures.push(`<note><rest/><duration>${maxTicksPerMeasure}</duration></note>`);
    }

    let measuresXml = '';
    measures.forEach((measureNotes, index) => {
        measuresXml += `
            <measure number="${index + 1}">
                ${index === 0 ? attributes : ''}
                ${measureNotes}
            </measure>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
        <score-partwise version="3.1">
            <part-list><score-part id="P1"><part-name>Drums</part-name></score-part></part-list>
            <part id="P1">${measuresXml}</part>
        </score-partwise>`;
}

function quantizeDuration(deltaTime, bpm) {
    const quarterNoteDuration = (60 / bpm) * 1000;
    const noteTypes = {
        'whole': quarterNoteDuration * 4,
        'half': quarterNoteDuration * 2,
        'quarter': quarterNoteDuration,
        'eighth': quarterNoteDuration / 2,
        '16th': quarterNoteDuration / 4,
    };

    let closestType = 'quarter';
    let smallestDifference = Math.abs(deltaTime - noteTypes['quarter']);

    for (const type in noteTypes) {
        const difference = Math.abs(deltaTime - noteTypes[type]);
        if (difference < smallestDifference) {
            smallestDifference = difference;
            closestType = type;
        }
    }
    console.log(`Quantized: ${deltaTime.toFixed(2)}ms -> ${closestType}`);
    return closestType;
}

// --- Score Loading and Rendering ---
async function loadTargetScore() {
    const selectedScore = domElements.scoreSelect.value;
    const xml = scoreLibrary[selectedScore];

    // Simple way to count notes for stats, might need improvement for complex scores
    stats.totalNotes = (xml.match(/<note>/g) || []).length - (xml.match(/<rest\/>/g) || []).length;

    await osmdTarget.load(xml);
    osmdTarget.render();
    osmdTarget.cursor.show();
}

async function loadUserScore() {
    const xml = generateMusicXML(userNotes, 3); // Always generate 3 measures
    await osmdUser.load(xml);
    osmdUser.render();
}

// --- Playback Logic ---
function calculateAverageAccuracy() {
    if (accuracyHistory.length === 0) return 0;
    const sum = accuracyHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / accuracyHistory.length);
}

function playNextNote(callReason = 'scheduled') {
    if (!isPlaying) return;

    if (currentTargetNote && !currentTargetNote.hit) {
        stats.misses++;
        // A miss is a 0 accuracy event
        accuracyHistory.push(0);
        updateScore({ score: calculateAverageAccuracy() });
        currentTargetNote.NoteheadColor = "#FF0000"; // Red
        osmdTarget.render();
    }

    while (osmdTarget.cursor.NotesUnderCursor().length === 0 && !osmdTarget.cursor.Iterator.EndReached) {
        osmdTarget.cursor.next();
    }

    if (osmdTarget.cursor.Iterator.EndReached) {
        osmdTarget.cursor.reset();
        timeoutId = setTimeout(() => playNextNote(), 0);
        return;
    }

    const notes = osmdTarget.cursor.NotesUnderCursor();
    if (notes.length === 0) {
        osmdTarget.cursor.next();
        playNextNote();
        return;
    }

    currentTargetNote = notes[0];
    // FIX: Use the scheduled time from the previous note's calculation to avoid timing drift.
    currentTargetNote.idealHitTime = nextTargetNoteIdealHitTime;

    const duration = currentTargetNote.Length.RealValue;
    const bpm = parseInt(domElements.bpmSlider.value, 10);
    const quarterNoteDurationMs = (60 / bpm) * 1000;
    const noteDurationMs = quarterNoteDurationMs * duration * 4;

    nextTargetNoteIdealHitTime = currentTargetNote.idealHitTime + noteDurationMs;

    // LOGGING: Log the scheduled vs actual metronome hit time.
    const scheduledTime = currentTargetNote.idealHitTime;
    const actualTime = performance.now();
    const drift = actualTime - scheduledTime;

    console.log(`--- PLAYBACK (${callReason}) ---`);
    console.log(`Scheduled Time: ${scheduledTime.toFixed(2)}ms`);
    console.log(`Actual Time:    ${actualTime.toFixed(2)}ms`);
    if (callReason === 'scheduled') {
        console.log(`Drift:          ${drift.toFixed(2)}ms`);
    } else {
        console.log(`Triggered Early By: ${(-drift).toFixed(2)}ms`);
    }
    console.log(`----------------`);

    // FIX: Schedule the metronome click using the precise, calculated idealHitTime.
    // We convert the performance.now() timestamp to the AudioContext's time domain.
    // Convert the performance.now() based idealHitTime to the AudioContext's time domain.
    const scheduledPlayTime = (currentTargetNote.idealHitTime + audioPerformanceOffset) / 1000;

    // Ensure we don't schedule in the past. If we're late, play immediately.
    const playTime = Math.max(metronome.audioCtx.currentTime, scheduledPlayTime);
    metronome.play(playTime);

    // FIX: Implement self-correcting timer to prevent rhythm drift.
    const delay = nextTargetNoteIdealHitTime - performance.now();
    timeoutId = setTimeout(() => {
        osmdTarget.cursor.next();
        playNextNote();
    }, delay > 0 ? delay : 0);
}

// --- User Input ---
export function handleHit() {
    const hitTime = performance.now();

    // --- NEW LOGIC FOR FIRST HIT ---
    // If playback hasn't started, this hit should start it and be judged against the first note.
    if (!isPlaying) {
        console.log("First hit detected. Starting playback and scoring immediately.");
        handlePlay(); // This will set the first currentTargetNote and its idealHitTime

        // After handlePlay, currentTargetNote is now set for the first note.
        // We overwrite its idealHitTime with the actual first hit time to ensure the first hit is always "Perfect".
        if (currentTargetNote) {
            currentTargetNote.idealHitTime = hitTime;
            // FIX: Recalculate the next note's ideal time based on this adjusted first hit to keep the timing chain consistent.
            const duration = currentTargetNote.Length.RealValue;
            const bpm = parseInt(domElements.bpmSlider.value, 10);
            const quarterNoteDurationMs = (60 / bpm) * 1000;
            const noteDurationMs = quarterNoteDurationMs * duration * 4;
            nextTargetNoteIdealHitTime = currentTargetNote.idealHitTime + noteDurationMs;
        }
    }
    // --- END NEW LOGIC ---

    if (currentTargetNote) {
        // --- NEW ADVANCED SCORING LOGIC ---
        const idealTimeCurrent = currentTargetNote.idealHitTime;
        const diffCurrent = hitTime - idealTimeCurrent;
        const absDiffCurrent = Math.abs(diffCurrent);

        const idealTimeNext = nextTargetNoteIdealHitTime;
        const diffNext = hitTime - idealTimeNext;
        const absDiffNext = Math.abs(diffNext);

        let targetNote, timeDiff, absDiff, wasEarlyHitOnNext;

        // If the hit is closer to the next note AND it's not ridiculously early for the current note
        if (absDiffNext < absDiffCurrent && diffCurrent > MAX_ERROR_WINDOW / 2) {
            targetNote = null; // Placeholder for the next note
            timeDiff = diffNext;
            absDiff = absDiffNext;
            wasEarlyHitOnNext = true;
        } else {
            targetNote = currentTargetNote;
            timeDiff = diffCurrent;
            absDiff = absDiffCurrent;
            wasEarlyHitOnNext = false;
        }

        let accuracyScore = 0;
        // NEW: Fixed scoring based on accuracy tiers
        if (absDiff <= MAX_ERROR_WINDOW) {
            const accuracyPercentage = 1 - (absDiff / MAX_ERROR_WINDOW);
            if (accuracyPercentage > 0.9) {
                accuracyScore = 100; // Perfect
            } else if (accuracyPercentage > 0.7) {
                accuracyScore = 80; // Good
            } else {
                accuracyScore = 60; // OK
            }
        }

        console.log("--- HIT ANALYSIS ---");
        console.log(`User Hit Time: ${hitTime.toFixed(2)}ms`);
        console.log(`Comparing against: Current (${idealTimeCurrent.toFixed(2)}ms) and Next (${idealTimeNext.toFixed(2)}ms)`);
        console.log(`Selected Target: ${wasEarlyHitOnNext ? 'NEXT' : 'CURRENT'} Note`);
        console.log(`Time Difference: ${timeDiff.toFixed(2)}ms (${timeDiff > 0 ? 'Late' : 'Early'})`);

        if (absDiff <= MAX_ERROR_WINDOW) {
            console.log("Result: HIT");
            console.log(`Score: ${accuracyScore}`);
            if (wasEarlyHitOnNext) {
                // We are hitting the NEXT note early. We need to advance the cursor.
                clearTimeout(timeoutId);
                osmdTarget.cursor.next();
                playNextNote('early_hit'); // This sets the new currentTargetNote

                // Now, apply scoring to the NEW currentTargetNote
                if (currentTargetNote && !currentTargetNote.hit) {
                    stats.hits++;
                    currentTargetNote.hit = true;
                    currentTargetNote.NoteheadColor = "#00FF00"; // Green for early hit
                    showFeedback("Perfect!", "#FFD700");
                }

            } else {
                // We are hitting the CURRENT note.
                if (targetNote && !targetNote.hit) {
                    stats.hits++;
                    targetNote.hit = true;
                    if (accuracyScore >= 100) {
                        showFeedback("Perfect!", "#FFD700");
                        targetNote.NoteheadColor = "#00FF00";
                    } else if (accuracyScore >= 80) {
                        showFeedback("Good!", "#00FF00");
                        targetNote.NoteheadColor = "#ADFF2F";
                    } else {
                        showFeedback("OK", "#FFFFFF");
                        targetNote.NoteheadColor = "#FFFF00";
                    }
                }
            }
        } else {
            console.log("Result: MISS (Outside error window)");
            console.log(`Score: ${accuracyScore}`);
        }
        console.log("--------------------");

        accuracyHistory.push(accuracyScore);
        osmdTarget.render();
        updateScore({ score: calculateAverageAccuracy() });

    } else if (isPlaying) {
        stats.extras++;
        showFeedback("Extra!", "#808080");
        console.log("--- HIT ANALYSIS ---");
        console.log("User hit, but NO expected note. Result: EXTRA");
        console.log("--------------------");
    }

    // The transcription logic can remain as is, or be modified separately.
    // For now, we keep it.
    const now = performance.now();

    if (!isRecording) {
        isRecording = true;
        lastHitTime = now;
        console.log("Recording started.");
        userNotes.push({ type: '16th' }); // First placeholder
    } else {
        const deltaTime = now - lastHitTime;
        lastHitTime = now;

        const bpm = parseInt(domElements.bpmSlider.value, 10);
        const noteType = quantizeDuration(deltaTime, bpm);

        if (userNotes.length > 0) {
            userNotes[userNotes.length - 1].type = noteType;

            const typeToDuration = { 'whole': 16, 'half': 8, 'quarter': 4, 'eighth': 2, '16th': 1 };
            const maxTicksPerMeasure = 16;
            const durationTicks = typeToDuration[noteType] || 0;
            currentMeasureTicks += durationTicks;

            while (currentMeasureTicks >= maxTicksPerMeasure) {
                completedMeasures++;
                currentMeasureTicks -= maxTicksPerMeasure;
            }
        }

        if (completedMeasures >= 3) {
            console.log("Three measures filled. Resetting user score.");
            loadUserScore(); // Render the final state before reset
            setTimeout(() => {
                userNotes = [];
                completedMeasures = 0;
                currentMeasureTicks = 0;
                userNotes.push({ type: '16th' });
                loadUserScore();
            }, 100);
            return;
        }

        userNotes.push({ type: '16th' }); // Add next placeholder
    }

    loadUserScore();
}

// --- Controls ---
export function handlePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        domElements.playBtn.textContent = "Pause";
        osmdTarget.cursor.show();
        osmdTarget.cursor.reset();
        // FIX: Initialize the timing chain for the first note.
        nextTargetNoteIdealHitTime = performance.now();
        // Sync the clocks at the beginning of playback
        audioPerformanceOffset = metronome.audioCtx.currentTime * 1000 - nextTargetNoteIdealHitTime;
        playNextNote();
    } else {
        domElements.playBtn.textContent = "Play";
        clearTimeout(timeoutId);
    }
}

export function handleReset() {
    isPlaying = false;
    domElements.playBtn.textContent = "Play";
    clearTimeout(timeoutId);
    currentTargetNote = null;
    nextTargetNoteIdealHitTime = 0;

    stats = { totalNotes: 0, hits: 0, misses: 0, extras: 0, score: 0 };
    accuracyHistory = [];
    updateScore({ score: 0 });
    domElements.resultsSummary.style.display = 'none';

    userNotes = [];
    isRecording = false;
    lastHitTime = 0;
    completedMeasures = 0;
    currentMeasureTicks = 0;
    loadUserScore();

    loadTargetScore();
}

// --- Initialization ---
export async function initialize() {
    osmdTarget = new opensheetmusicdisplay.OpenSheetMusicDisplay(domElements.targetContainer, {
        backend: "svg",
        drawingParameters: "compact",
        drawCursor: true,
    });
    osmdUser = new opensheetmusicdisplay.OpenSheetMusicDisplay(domElements.userContainer, {
        backend: "svg",
        drawingParameters: "compact",
        drawCursor: true,
    });

    metronome = new Metronome();
    await loadTargetScore();
    osmdTarget.cursor.hide();
    await loadUserScore();
    console.log("Application initialized.");
}