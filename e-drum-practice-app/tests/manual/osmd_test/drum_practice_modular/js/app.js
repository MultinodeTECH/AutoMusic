import { domElements, updateScore, showResults } from './ui.js';
import { scoreLibrary } from './config.js';

// --- OSMD Instances ---
let osmdTarget;
let osmdUser;

// --- State Management ---
let userNotes = [];
let isPlaying = false;
let timeoutId = null;
let currentTargetNote = null;
let stats = { totalNotes: 0, hits: 0, misses: 0, extras: 0, score: 0 };

// --- Realtime Transcription State ---
let isRecording = false;
let lastHitTime = 0;

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
function playNextNote() {
    if (!isPlaying) return;

    if (currentTargetNote && !currentTargetNote.hit) {
        stats.misses++;
        stats.score = Math.max(0, stats.score - 5);
        updateScore(stats);
    }

    while (osmdTarget.cursor.NotesUnderCursor().length === 0 && !osmdTarget.cursor.Iterator.EndReached) {
        osmdTarget.cursor.next();
    }

    if (osmdTarget.cursor.Iterator.EndReached) {
        osmdTarget.cursor.reset();
        const bpm = parseInt(domElements.bpmSlider.value, 10);
        const quarterNoteDurationMs = (60 / bpm) * 1000;
        timeoutId = setTimeout(playNextNote, quarterNoteDurationMs / 4);
        return;
    }

    const notes = osmdTarget.cursor.NotesUnderCursor();
    if (notes.length === 0) {
        osmdTarget.cursor.next();
        playNextNote();
        return;
    }
    const note = notes[0];
    currentTargetNote = note;

    const duration = note.Length.RealValue;
    const bpm = parseInt(domElements.bpmSlider.value, 10);
    const quarterNoteDurationMs = (60 / bpm) * 1000;
    const noteDurationMs = quarterNoteDurationMs * duration * 4;

    timeoutId = setTimeout(() => {
        currentTargetNote = null;
        osmdTarget.cursor.next();
        playNextNote();
    }, noteDurationMs);
}

// --- User Input ---
export function handleHit() {
    const now = performance.now();

    if (!isRecording) {
        isRecording = true;
        lastHitTime = now;
        console.log("Recording started, triggering target score playback...");

        if (!isPlaying) {
            handlePlay();
        }

        userNotes.push({ type: '16th' });
    } else {
        const deltaTime = now - lastHitTime;
        lastHitTime = now;

        const bpm = parseInt(domElements.bpmSlider.value, 10);
        const lastNoteType = quantizeDuration(deltaTime, bpm);

        if (userNotes.length > 0) {
            userNotes[userNotes.length - 1].type = lastNoteType;
        }

        userNotes.push({ type: '16th' });
    }

    loadUserScore();

    const typeToDuration = { 'whole': 16, 'half': 8, 'quarter': 4, 'eighth': 2, '16th': 1 };
    const maxTicksPerMeasure = 16;
    const totalTicks = userNotes.reduce((sum, note) => sum + (typeToDuration[note.type] || 0), 0);

    if (totalTicks >= maxTicksPerMeasure * 3) {
        console.log("Three measures filled. Resetting user score.");
        setTimeout(() => {
            userNotes = [];
            loadUserScore();
        }, 100);
    }
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

    stats = { totalNotes: 0, hits: 0, misses: 0, extras: 0, score: 0 };
    updateScore(stats);
    domElements.resultsSummary.style.display = 'none';

    userNotes = [];
    isRecording = false;
    lastHitTime = 0;
    loadUserScore();

    loadTargetScore();
}

// --- Initialization ---
export async function initialize() {
    osmdTarget = new opensheetmusicdisplay.OpenSheetMusicDisplay(domElements.targetContainer, {
        backend: "svg",
        drawingParameters: "compact",
    });
    osmdUser = new opensheetmusicdisplay.OpenSheetMusicDisplay(domElements.userContainer, {
        backend: "svg",
        drawingParameters: "compact",
    });

    await loadTargetScore();
    osmdTarget.cursor.hide();
    await loadUserScore();
    console.log("Application initialized.");
}