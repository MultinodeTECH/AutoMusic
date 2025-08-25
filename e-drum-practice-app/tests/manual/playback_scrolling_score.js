document.addEventListener('DOMContentLoaded', () => {
    const { Factory, Stave, StaveNote, Formatter, Renderer } = Vex.Flow;

    // DOM Elements
    const canvas = document.getElementById('score-canvas');
    const ctx = canvas.getContext('2d');
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-btn');

    // --- Configuration ---
    const BPM = 120; // Beats Per Minute
    const staveWidth = 300; // Width of each measure
    const cursorX = canvas.width / 2; // Fixed cursor position in the middle

    // --- Score Data (Drum Notation) ---
    const simpleScore = {
        timeSignature: '4/4',
        measures: [
            { notes: [{ keys: ['c/5'], duration: 'q' }, { keys: ['a/4'], duration: 'q' }, { keys: ['c/5'], duration: 'q' }, { keys: ['a/4'], duration: 'q' }] },
            { notes: [{ keys: ['g/5'], duration: '8' }, { keys: ['g/5'], duration: '8' }, { keys: ['g/5'], duration: '8' }, { keys: ['g/5'], duration: '8' }, { keys: ['c/5', 'a/4'], duration: 'q' }] },
            { notes: [{ keys: ['f/5'], duration: 'q' }, { keys: ['c/5'], duration: 'q' }, { keys: ['e/5'], duration: 'q' }, { keys: ['d/5'], duration: 'q' }] },
            { notes: [{ keys: ['c/5'], duration: 'q' }, { keys: ['c/5'], duration: 'q' }, { keys: ['c/5'], duration: 'q' }, { keys: ['c/5'], duration: 'q' }] }
        ]
    };

    const totalMeasures = simpleScore.measures.length;
    const totalWidth = totalMeasures * staveWidth + cursorX * 2; // Total width for the offscreen canvas

    // --- Offscreen Canvas for Performance ---
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = totalWidth;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    // --- Animation State ---
    let animationFrameId = null;
    let scrollX = 0;
    let lastFrameTime = 0;

    // --- Calculate Scrolling Speed based on BPM ---
    const beatsPerMeasure = 4; // Assuming 4/4 time
    const pixelsPerBeat = (staveWidth) / beatsPerMeasure;
    const beatsPerSecond = BPM / 60;
    const pixelsPerSecond = pixelsPerBeat * beatsPerSecond;

    // --- Render the entire score to an offscreen canvas ---
    function renderScoreToOffscreenCanvas() {
        const renderer = new Renderer(offscreenCanvas, Renderer.Backends.CANVAS);
        const context = renderer.getContext();
        context.clear();

        let x = cursorX; // Start drawing from the cursor position to have lead-in space
        simpleScore.measures.forEach((measure, index) => {
            const stave = new Stave(x, 40, staveWidth);
            if (index === 0) {
                stave.addClef('percussion').addTimeSignature(simpleScore.timeSignature);
            }
            stave.setContext(context).draw();

            const notes = measure.notes.map(noteData => new StaveNote({
                keys: noteData.keys,
                duration: noteData.duration,
                clef: 'percussion',
                auto_stem: true
            }));

            const voice = new Vex.Flow.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
            voice.addTickables(notes);
            new Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
            voice.draw(context, stave);

            x += staveWidth;
        });
    }

    // --- Draw the visible part of the score and the cursor ---
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the relevant part of the offscreen canvas to the main canvas
        ctx.drawImage(offscreenCanvas, scrollX, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

        // Draw the fixed playback cursor
        ctx.save();
        ctx.strokeStyle = '#007BFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 150, 255, 0.7)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(cursorX, 0);
        ctx.lineTo(cursorX, canvas.height);
        ctx.stroke();
        ctx.restore();
    }

    // --- Animation Loop ---
    function animate(currentTime) {
        if (lastFrameTime === 0) {
            lastFrameTime = currentTime;
        }
        const deltaTime = (currentTime - lastFrameTime) / 1000; // seconds
        lastFrameTime = currentTime;

        // Update scroll position based on time and BPM
        scrollX += pixelsPerSecond * deltaTime;

        // Stop condition (optional, can be adjusted)
        if (scrollX > totalWidth - canvas.width) {
            stopAnimation();
        }

        draw();
        animationFrameId = requestAnimationFrame(animate);
    }

    // --- Control Functions ---
    function startAnimation() {
        if (!animationFrameId) {
            lastFrameTime = 0; // Reset time to prevent a large jump on resume
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    function stopAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function resetAnimation() {
        stopAnimation();
        scrollX = 0;
        draw();
    }

    // --- Event Listeners ---
    playBtn.addEventListener('click', startAnimation);
    stopBtn.addEventListener('click', stopAnimation);
    resetBtn.addEventListener('click', resetAnimation);

    // --- Initial Render ---
    renderScoreToOffscreenCanvas();
    draw();
});