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
let stats = { totalNotes: 0, hits: 0, misses: 0, extras: 0, score: 0 };
let metronome;
 
class Metronome {
    constructor(audioContext) {
        this.audioCtx = audioContext || this._createContext();
        this.isPlaying = false;
        this.frequency = 880;
        this.duration = 0.05;
    }

    _createContext() {
        if (window.AudioContext || window.webkitAudioContext) {
            return new (window.AudioContext || window.webkitAudioContext)();
        } else {
            console.error("Web Audio API is not supported in this browser.");
            return null;
        }
    }

    play() {
        if (!this.audioCtx) return;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.frequency.setValueAtTime(this.frequency, this.audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + this.duration);

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + this.duration);
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

function playNextNote() {
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
        timeoutId = setTimeout(playNextNote, 0);
        return;
    }

    const notes = osmdTarget.cursor.NotesUnderCursor();
    if (notes.length === 0) {
        osmdTarget.cursor.next();
        playNextNote();
        return;
    }
    
    currentTargetNote = notes[0];
    currentTargetNote.idealHitTime = performance.now();
    
    const duration = currentTargetNote.Length.RealValue;
    const bpm = parseInt(domElements.bpmSlider.value, 10);
    const quarterNoteDurationMs = (60 / bpm) * 1000;
    const noteDurationMs = quarterNoteDurationMs * duration * 4;

    nextTargetNoteIdealHitTime = currentTargetNote.idealHitTime + noteDurationMs;

    metronome.play();
 
    timeoutId = setTimeout(() => {
        osmdTarget.cursor.next();
        playNextNote();
    }, noteDurationMs);
}

// --- User Input ---
export function handleHit() {
    const hitTime = performance.now();

    if (currentTargetNote) {
        const idealTime = currentTargetNote.idealHitTime;
        const timeDiff = hitTime - idealTime; // Positive if late, negative if early
        const absDiff = Math.abs(timeDiff);

        let accuracyScore = 0;
        if (absDiff <= MAX_ERROR_WINDOW) {
            accuracyScore = 100 * (1 - absDiff / MAX_ERROR_WINDOW);
        }

        // --- DETAILED DEBUG LOGGING ---
        console.log("--- HIT ANALYSIS ---");
        console.log(`User Hit Time: ${hitTime.toFixed(2)}ms`);
        console.log(`Expected Note Time: ${idealTime.toFixed(2)}ms`);
        console.log(`Time Difference: ${timeDiff.toFixed(2)}ms (${timeDiff > 0 ? 'Late' : 'Early'})`);
        console.log(`Max Error Window: ${MAX_ERROR_WINDOW}ms`);
        
        if (absDiff <= MAX_ERROR_WINDOW) {
            console.log("Result: HIT");
            console.log(`Score Calculation: 100 * (1 - ${absDiff.toFixed(2)} / ${MAX_ERROR_WINDOW}) = ${accuracyScore.toFixed(2)}`);
        } else {
            console.log("Result: MISS (Outside error window)");
            console.log("Score Calculation: 0 (Time difference exceeds max error window)");
        }
        console.log("--------------------");
        // --- END DEBUG LOGGING ---

        accuracyHistory.push(accuracyScore);

        if (absDiff <= MAX_ERROR_WINDOW) {
            if (!currentTargetNote.hit) {
                stats.hits++;
                currentTargetNote.hit = true;

                if (accuracyScore > 90) {
                    showFeedback("Perfect!", "#FFD700"); // Gold
                    currentTargetNote.NoteheadColor = "#00FF00"; // Green
                } else if (accuracyScore > 70) {
                    showFeedback("Good!", "#00FF00"); // Green
                    currentTargetNote.NoteheadColor = "#ADFF2F"; // GreenYellow
                } else {
                    showFeedback("OK", "#FFFFFF"); // White
                    currentTargetNote.NoteheadColor = "#FFFF00"; // Yellow
                }
            }
        } else {
             // This logic branch is for hits that are clearly early or late for the current note
             if (timeDiff < 0) {
                showFeedback("Early!", "#00BFFF"); // DeepSkyBlue
             } else {
                showFeedback("Late!", "#FF4500"); // OrangeRed
             }
        }
        
        osmdTarget.render();
        updateScore({ score: calculateAverageAccuracy() });

    } else {
        stats.extras++;
        showFeedback("Extra!", "#808080"); // Gray
        console.log("--- HIT ANALYSIS ---");
        console.log("User hit, but NO expected note.");
        console.log("Result: EXTRA");
        console.log("--------------------");
    }

    // The transcription logic can remain as is, or be modified separately.
    // For now, we keep it.
    const now = performance.now();

    if (!isRecording) {
        isRecording = true;
        lastHitTime = now;
        console.log("Recording started, triggering target score playback...");

        if (!isPlaying) {
            handlePlay();
        }

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