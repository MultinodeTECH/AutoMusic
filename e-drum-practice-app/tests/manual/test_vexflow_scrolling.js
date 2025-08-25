document.addEventListener('DOMContentLoaded', () => {
    const { Factory, Stave, StaveNote, Formatter, Renderer } = Vex.Flow;

    // DOM Elements
    const canvas = document.getElementById('score-canvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Configuration
    const staveWidth = 300;
    const cursorX = 150; // X-position of the playback cursor
    const HIT_WINDOW_WIDTH = 10; // The "active" zone width around the cursor

    const BPM = 120; // Beats Per Minute

    const durationMap = { 'q': 4, '8': 8, 'h': 2, 'w': 1, '16': 16, '32': 32 };

    // --- Simple Score Data (Drum Notation) ---
    const simpleScore = {
        timeSignature: '4/4',
        measures: [
            {
                notes: [
                    { keys: ['c/5'], duration: 'q' }, // Snare
                    { keys: ['a/4'], duration: 'q' }, // Kick
                    { keys: ['c/5'], duration: 'q' }, // Snare
                    { keys: ['a/4'], duration: 'q' }, // Kick
                ]
            },
            {
                notes: [
                    { keys: ['g/5'], duration: '8' }, // Hi-hat
                    { keys: ['g/5'], duration: '8' }, // Hi-hat
                    { keys: ['g/5'], duration: '8' }, // Hi-hat
                    { keys: ['g/5'], duration: '8' }, // Hi-hat
                    { keys: ['c/5', 'a/4'], duration: 'q' }, // Snare + Kick
                ]
            },
            {
                notes: [
                    { keys: ['f/5'], duration: 'q' }, // Crash
                    { keys: ['c/5'], duration: 'q' }, // Snare
                    { keys: ['e/5'], duration: 'q' }, // High Tom
                    { keys: ['d/5'], duration: 'q' }, // Mid Tom
                ]
            },
            {
                notes: [
                    { keys: ['c/5'], duration: 'q' },
                    { keys: ['c/5'], duration: 'q' },
                    { keys: ['c/5'], duration: 'q' },
                    { keys: ['c/5'], duration: 'q' },
                ]
            }
        ]
    };

    const totalMeasures = simpleScore.measures.length;
    const totalWidth = totalMeasures * staveWidth + 200; // Add padding

    // Offscreen canvas for performance
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = totalWidth;
    offscreenCanvas.height = canvas.height;

    const renderer = new Renderer(offscreenCanvas, Renderer.Backends.CANVAS);
    const context = renderer.getContext();

    // Animation state
    let animationFrameId = null;
    let scrollX = 0;
    let initialScrollX = 0;
    // const scrollSpeed = 0.8; // Replaced with time-based animation
    // Calculate scrolling speed based on BPM and score layout
    const beatsPerStave = 4; // Assuming 4/4 time
    const pixelsPerBeat = (staveWidth - 20) / beatsPerStave; // -20 for padding
    const beatsPerSecond = BPM / 60;
    const pixelsPerSecond = pixelsPerBeat * beatsPerSecond;
    let lastFrameTime = 0;

    // --- Interactive Logic Data ---
    const noteEvents = [];
    let activeNotes = [];
    let currentTargetNoteIndex = 0;
    let missTimeoutId = null; // Timer for auto-missing a note

    function renderScoreToOffscreenCanvas() {
        renderer.resize(totalWidth, offscreenCanvas.height);
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

            const voice = new Vex.Flow.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
            voice.addTickables(notes);
            new Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
            voice.draw(context, stave);

            notes.forEach(note => {
                // Use the note's stem x-position for precise alignment with the cursor.
                const noteX = note.getStemX() + stave.getX();
                noteEvents.push({
                    note: note,
                    stave: stave,
                    x: noteX,
                    isHit: false,
                    isActive: false,
                    isMissed: false,
                });
            });
            x += staveWidth;
        });

        x += staveWidth;

        if (noteEvents.length > 0) {
            const firstNoteX = noteEvents[0].x;
            initialScrollX = firstNoteX - cursorX;
        }

    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreenCanvas, scrollX, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 150, 255, 0.7)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#007BFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursorX, 0);
        ctx.lineTo(cursorX, canvas.height);
        ctx.stroke();
        ctx.restore();
    }

    function updateNoteStyle(event, color) {
        if (!event || !event.note) return;
        event.note.setStyle({ fillStyle: color, strokeStyle: color });
        const bb = event.note.getBoundingBox();
        // Clear a slightly larger area to avoid artifacts
        context.clearRect(bb.getX() - 5, bb.getY() - 5, bb.getW() + 10, bb.getH() + 10);
        // Redraw the stave first to restore the lines
        event.stave.setContext(context).draw();
        // Then redraw all notes on that stave to avoid erasing them
        noteEvents.forEach(e => {
            if (e.stave === event.stave) {
                e.note.setContext(context).draw();
            }
        });
    }

    function animate(currentTime) {
        if (currentTargetNoteIndex >= noteEvents.length) {
            stopScrolling();
            return;
        }

        const targetNote = noteEvents[currentTargetNoteIndex];
        const targetScrollX = targetNote.x - cursorX;

        // Move scrollX towards targetScrollX
        const distance = targetScrollX - scrollX;
        // A simple easing/lerp function to make the scroll smooth
        const easing = 0.05; // Adjust this value for faster/slower smoothing
        scrollX += distance * easing;


        // If we are very close to the target, snap to it to avoid tiny movements
        if (Math.abs(distance) < 0.5 && missTimeoutId === null) {
            scrollX = targetScrollX;
            // Once we've settled on the note, set a timer. If the user doesn't
            // hit it in time, we'll count it as a miss and move on.
            const duration = noteEvents[currentTargetNoteIndex].note.getDuration();
            // Estimate time window based on duration.
            const noteDurationNumber = durationMap[duration.replace('r', '').replace('d', '')]; // ignore rests and dots for simplicity
            const quarterNoteDurationMs = (60 / BPM) * 1000;
            const timeToHit = (quarterNoteDurationMs * 4) / noteDurationNumber;


            missTimeoutId = setTimeout(() => {
                advanceToNextNote();
            }, timeToHit);
        }


        const cursorAbsoluteX = scrollX + cursorX;
        if (scrollX + canvas.width > totalWidth) {
            stopScrolling();
            return;
        }

        const hitWindowStart = cursorAbsoluteX - (HIT_WINDOW_WIDTH / 2);
        const hitWindowEnd = cursorAbsoluteX + (HIT_WINDOW_WIDTH / 2);

        activeNotes = [];

        noteEvents.forEach((event, index) => {
            // 如果音符已经被成功击中，就跳过所有逻辑
            if (event.isHit) {
                return;
            }

            const notePosition = event.x;
            const noteScreenX = notePosition - scrollX; // Calculate note's current position on the visible canvas

            // --- New判定逻辑 ---

            // Active Logic: 音符在击中区域内
            // We only care about the *current* target note being active.
            if (index === currentTargetNoteIndex && notePosition >= hitWindowStart && notePosition <= hitWindowEnd) {
                if (!event.isActive) {
                    event.isActive = true;
                    updateNoteStyle(event, 'blue');
                }
                activeNotes.push(event);
            }
            // Upcoming Logic: 音符还未到达击中区域
            else { // notePosition > hitWindowEnd
                if (event.isActive) {
                    event.isActive = false;
                    updateNoteStyle(event, 'black');
                }
            }
        });

        draw();
        animationFrameId = requestAnimationFrame(animate);
    }

    function handleHit() {
        let hitOccurred = false;
        const targetNote = noteEvents[currentTargetNoteIndex];

        // Check if the current target note is active and can be hit
        if (activeNotes.includes(targetNote)) {
            if (targetNote && !targetNote.isHit) {
                targetNote.isHit = true;
                targetNote.isMissed = false;
                targetNote.isActive = false;
                updateNoteStyle(targetNote, 'green');
                hitOccurred = true;
            }
        }

        if (hitOccurred) {
            clearTimeout(missTimeoutId); // Clear the miss timer
            missTimeoutId = null;
            advanceToNextNote();
        }
        // Clear active notes regardless of hit, as the state is re-evaluated each frame.
        activeNotes = [];
    }

    function startScrolling() {
        if (!animationFrameId) {
            currentTargetNoteIndex = 0; // Start from the first note
            // Set initial scroll position to the first note instantly
            if (noteEvents.length > 0) {
                scrollX = noteEvents[0].x - cursorX;
            }
            lastFrameTime = 0; // Reset time for the new animation sequence
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    function stopScrolling() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        clearTimeout(missTimeoutId);
        missTimeoutId = null;
    }

    function resetScrolling() {
        stopScrolling();
        renderScoreToOffscreenCanvas(); // Re-render to reset all note colors
        scrollX = initialScrollX;
        currentTargetNoteIndex = 0;
        draw();
    }

    function advanceToNextNote() {
        clearTimeout(missTimeoutId);
        missTimeoutId = null;

        const previousNote = noteEvents[currentTargetNoteIndex];
        if (previousNote && !previousNote.isHit && !previousNote.isMissed) {
            // If the note wasn't hit, it's a miss.
            previousNote.isMissed = true;
            updateNoteStyle(previousNote, 'red');
        }

        currentTargetNoteIndex++;
        if (currentTargetNoteIndex >= noteEvents.length) {
            stopScrolling();
        }
    }


    startBtn.addEventListener('click', startScrolling);
    stopBtn.addEventListener('click', stopScrolling);
    resetBtn.addEventListener('click', resetScrolling);


    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            handleHit();
        }
    });

    // --- Debugging Click Listener ---
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        console.log(`Canvas Clicked at X: ${x.toFixed(2)}`);
    });

    // --- Initial Render ---
    renderScoreToOffscreenCanvas();
    scrollX = initialScrollX;
    draw();
});