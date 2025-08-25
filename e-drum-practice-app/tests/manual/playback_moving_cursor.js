document.addEventListener('DOMContentLoaded', () => {
    const { Stave, StaveNote, Formatter, Renderer, Voice } = Vex.Flow;

    // DOM Elements
    const canvas = document.getElementById('score-canvas');
    const ctx = canvas.getContext('2d');
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Configuration
    const BPM = 120;
    const staveWidth = 350;
    const totalMeasures = 4;
    const totalWidth = staveWidth * totalMeasures + 100; // Add padding

    // Offscreen canvas for performance
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = totalWidth;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    const renderer = new Renderer(offscreenCanvas, Renderer.Backends.CANVAS);

    // --- Score Data (Drum Notation) ---
    const simpleScore = {
        timeSignature: '4/4',
        measures: [
            { notes: [{ keys: ['c/5'], duration: 'q' }, { keys: ['a/4'], duration: 'q' }, { keys: ['c/5'], duration: 'q' }, { keys: ['a/4'], duration: 'q' }] },
            { notes: [{ keys: ['g/5'], duration: '8' }, { keys: ['g/5'], duration: '8' }, { keys: ['g/5'], duration: '8' }, { keys: ['g/5'], duration: '8' }, { keys: ['c/5', 'a/4'], duration: 'q' }] },
            { notes: [{ keys: ['f/5'], duration: 'q' }, { keys: ['c/5'], duration: 'q' }, { keys: ['e/5'], duration: 'q' }, { keys: ['d/5'], duration: 'q' }] },
            { notes: [{ keys: ['c/5'], duration: 'h' }, { keys: ['a/4'], duration: 'h' }] }
        ]
    };

    // Animation state
    let animationFrameId = null;
    const startX = 50;
    let cursorX = startX;
    let lastFrameTime = 0;
    let pixelsPerSecond = 0;

    // Note state and positions
    const noteEvents = [];

    function calculatePixelsPerSecond() {
        const beatsPerMeasure = 4; // From 4/4 time signature
        const pixelsPerBeat = (staveWidth) / beatsPerMeasure;
        const beatsPerSecond = BPM / 60;
        return pixelsPerBeat * beatsPerSecond;
    }

    function renderScoreToOffscreenCanvas() {
        renderer.resize(totalWidth, offscreenCanvas.height);
        const context = renderer.getContext();
        context.clear();
        noteEvents.length = 0; // Clear previous events

        let x = 10;
        simpleScore.measures.forEach((measure, index) => {
            const stave = new Stave(x, 20, staveWidth);
            if (index === 0) {
                stave.addClef('percussion').addTimeSignature(simpleScore.timeSignature);
            }
            stave.setContext(context).draw();

            const notes = measure.notes.map(noteData => {
                const note = new StaveNote({
                    keys: noteData.keys,
                    duration: noteData.duration,
                    clef: 'percussion',
                    auto_stem: true
                });
                note.setStyle({ fillStyle: 'black', strokeStyle: 'black' });
                return note;
            });

            const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
            voice.addTickables(notes);
            new Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
            voice.draw(context, stave);

            notes.forEach(note => {
                noteEvents.push({
                    note: note,
                    x: note.getStemX() + stave.getX(),
                    isPlayed: false
                });
            });
            x += staveWidth;
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvas, 0, 0);
        drawCursor();
    }

    function drawCursor() {
        ctx.save();
        ctx.strokeStyle = '#007BFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursorX, 30);
        ctx.lineTo(cursorX, 160);
        ctx.stroke();
        ctx.restore();
    }

    function updateNoteStyle(event, color) {
        if (!event || !event.note) return;
        const context = renderer.getContext();
        event.note.setStyle({ fillStyle: color, strokeStyle: color });
        // For simplicity in this version, we will re-render the whole offscreen canvas
        // to ensure staves are drawn correctly under the notes. A more advanced
        // implementation would clear and redraw only the affected note area.
        renderScoreToOffscreenCanvas();
        noteEvents.forEach(e => {
            if (e.isPlayed) {
                e.note.setStyle({ fillStyle: 'gray', strokeStyle: 'gray' });
            }
        });
    }


    let currentTargetNoteIndex = 0;
    let noteChangeTimeoutId = null;

    function animate() {
        // This function is now simpler. It just draws the state.
        // The logic for advancing the cursor is handled by advanceCursor.
        draw();
        animationFrameId = requestAnimationFrame(animate);
    }

    function advanceCursor() {
        if (currentTargetNoteIndex >= noteEvents.length) {
            stopPlayback();
            return;
        }

        // Mark previous note as played
        if (currentTargetNoteIndex > 0) {
            const previousNote = noteEvents[currentTargetNoteIndex - 1];
            previousNote.isPlayed = true;
            updateNoteStyle(previousNote, 'gray');
        }

        const targetNote = noteEvents[currentTargetNoteIndex];
        cursorX = targetNote.x; // Snap cursor to the note's X position

        // Calculate duration to wait until the next note
        const duration = targetNote.note.getDuration();
        // This regex handles durations like 'q', '8', 'h' etc.
        const noteDurationNumber = { 'w': 1, 'h': 2, 'q': 4, '8': 8, '16': 16, '32': 32 }[duration.replace('r', '').replace('d', '')];
        const quarterNoteDurationMs = (60 / BPM) * 1000;
        const timeToNextNote = (quarterNoteDurationMs * 4) / noteDurationNumber;

        currentTargetNoteIndex++;

        // Set a timeout to advance to the next note
        noteChangeTimeoutId = setTimeout(advanceCursor, timeToNextNote);
    }

    function startPlayback() {
        if (animationFrameId) return;
        resetPlayback(); // Ensure we start from a clean state
        currentTargetNoteIndex = 0;
        animationFrameId = requestAnimationFrame(animate); // Start the drawing loop
        advanceCursor(); // Start the note progression logic
    }

    function stopPlayback() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        clearTimeout(noteChangeTimeoutId);
        noteChangeTimeoutId = null;
    }

    function resetPlayback() {
        stopPlayback();
        cursorX = startX;
        currentTargetNoteIndex = 0;
        noteEvents.forEach(event => {
            event.isPlayed = false;
            event.note.setStyle({ fillStyle: 'black', strokeStyle: 'black' });
        });
        renderScoreToOffscreenCanvas(); // Redraws the score with original colors
        draw();
    }

    // Event Listeners
    playBtn.addEventListener('click', startPlayback);
    stopBtn.addEventListener('click', stopPlayback);
    resetBtn.addEventListener('click', resetPlayback);

    // Initial Render
    resetPlayback();
});