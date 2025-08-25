const { Factory, Stave, StaveNote, Beam, Formatter, Tuplet, StaveConnector } = Vex.Flow;

export class CanvasRenderer {
    constructor(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id #${containerId} not found.`);
            return;
        }
        container.style.position = 'relative'; // Ensure container can position children absolutely

        // Create background canvas
        this.bgCanvas = document.createElement('canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.setupCanvas(this.bgCanvas, container);

        // Create foreground canvas
        this.fgCanvas = document.createElement('canvas');
        this.fgCtx = this.fgCanvas.getContext('2d');
        this.setupCanvas(this.fgCanvas, container);

        // Offscreen canvas for performance
        this.scoreCacheCanvas = document.createElement('canvas');
        this.scoreCacheCtx = this.scoreCacheCanvas.getContext('2d');


        // Set dimensions (example dimensions, can be made dynamic)
        this.resize(800, 600);
    }

    setupCanvas(canvas, container) {
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        container.appendChild(canvas);
    }

    resize(width, height) {
        this.bgCanvas.width = this.fgCanvas.width = width;
        this.bgCanvas.height = this.fgCanvas.height = height;
    }

    /**
     * Renders the state onto the canvas.
     * @param {object} state - The current game state from the StateManager.
     */
    render(state) {
        // Clear foreground canvas for dynamic elements
        this.fgCtx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);

        switch (state.gameMode) {
            case 'falling':
                this._renderFallingNotes(state);
                break;
            case 'scroll':
                this._renderScrollingScore(state);
                break;
            // Other game modes can be handled here
            default:
                // Default rendering if no mode is matched
                break;
        }

        // Always render hit effects on top
        this._renderHitEffects(state);
    }

    _renderHitEffects(state) {
        if (!state.hitEffects || state.hitEffects.length === 0) {
            return;
        }

        const now = Date.now();
        const ctx = this.fgCtx; // Effects are on the foreground

        for (let i = state.hitEffects.length - 1; i >= 0; i--) {
            const effect = state.hitEffects[i];
            const elapsedTime = now - effect.startTime;

            if (elapsedTime >= effect.duration) {
                // Animation finished, remove it.
                // Note: This is a direct state mutation, which is generally bad.
                // A better approach would be for the logic module to handle this,
                // but for now, we'll keep it simple.
                state.hitEffects.splice(i, 1);
                continue;
            }

            const progress = elapsedTime / effect.duration;
            const radius = effect.startRadius + (effect.maxRadius - effect.startRadius) * progress;
            const opacity = 0.8 * (1 - progress);

            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.closePath();
        }
    }

    _renderFallingNotes(state) {
        const HIT_ZONE_HEIGHT = 50; // TODO: Move to config
        const NOTE_RADIUS = 15; // TODO: Move to config

        // Draw hit zone
        this.fgCtx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        this.fgCtx.fillRect(0, this.fgCanvas.height - HIT_ZONE_HEIGHT, this.fgCanvas.width, HIT_ZONE_HEIGHT);
        this.fgCtx.strokeStyle = 'green';
        this.fgCtx.strokeRect(0, this.fgCanvas.height - HIT_ZONE_HEIGHT, this.fgCanvas.width, HIT_ZONE_HEIGHT);

        // Draw notes
        if (state.notes) {
            state.notes.forEach(note => {
                this.fgCtx.beginPath();
                this.fgCtx.arc(note.x, note.y, NOTE_RADIUS, 0, Math.PI * 2);
                this.fgCtx.fillStyle = 'blue';
                this.fgCtx.fill();
                this.fgCtx.closePath();
            });
        }
    }
    loadScore(songData) {
        // Configuration
        const staveWidth = 300;
        const totalMeasures = songData.measures.length;
        const totalWidth = totalMeasures * staveWidth + 100; // Add some padding

        // Offscreen canvas for performance
        this.scoreCacheCanvas.width = totalWidth;
        this.scoreCacheCanvas.height = this.bgCanvas.height;

        // --- VexFlow Rendering on Offscreen Canvas ---
        const vf = new Factory({
            renderer: { elementId: null, context: this.scoreCacheCtx, width: totalWidth, height: this.scoreCacheCanvas.height },
        });

        let currentX = 10;
        const staves = [];

        songData.measures.forEach((measure, index) => {
            const stave = new Stave(currentX, 40, staveWidth);
            if (index === 0) {
                stave.addClef('percussion').addTimeSignature('4/4');
            }
            staves.push(stave);
            currentX += staveWidth;
        });

        // Draw staves
        staves.forEach(stave => stave.setContext(this.scoreCacheCtx).draw());

        // Draw connectors
        for (let i = 0; i < staves.length - 1; i++) {
            new StaveConnector(staves[i], staves[i + 1]).setType(StaveConnector.type.SINGLE).setContext(this.scoreCacheCtx).draw();
        }
        new StaveConnector(staves[staves.length - 1], staves[0]).setType(StaveConnector.type.END).setContext(this.scoreCacheCtx).draw();


        // Process and draw notes for each measure
        const allNotes = songData.measures.flatMap((measure, measureIndex) => {
            const stave = staves[measureIndex];
            const notes = measure.notes.map(noteData => {
                const staveNote = new StaveNote({
                    keys: noteData.keys,
                    duration: noteData.duration,
                    clef: 'percussion'
                });

                noteData.modifiers?.forEach(mod => {
                    if (mod.type === 'stem') {
                        staveNote.setStemDirection(mod.direction === 'up' ? 1 : -1);
                    }
                });
                return staveNote;
            });
            return notes;
        });

        // Helper to group notes for beaming
        const beams = Beam.generateBeams(allNotes.filter(note => !note.isRest()));

        // A bit of a hack for now, assuming 4 notes per measure
        Formatter.FormatAndDraw(this.scoreCacheCtx, staves[0], allNotes.slice(0, 4));
        Formatter.FormatAndDraw(this.scoreCacheCtx, staves[1], allNotes.slice(4, 8));
        Formatter.FormatAndDraw(this.scoreCacheCtx, staves[2], allNotes.slice(8, 12));
        Formatter.FormatAndDraw(this.scoreCacheCtx, staves[3], allNotes.slice(12, 16));


        beams.forEach(beam => {
            beam.setContext(this.scoreCacheCtx).draw();
        });

        // --- Extract Note Coordinates ---
        const noteCoordinates = allNotes.map((note, index) => {
            // We need to find which stave the note belongs to in order to get the correct Y coordinate.
            // This is a simplification. A more robust solution would track this better.
            const staveIndex = Math.floor(index / 4); // HACK: assuming 4 notes per measure
            const stave = staves[staveIndex];

            return {
                id: index,
                x: note.getAbsoluteX(),
                y: note.getStave().getYForLine(note.getLineForRest()), // A bit of a guess for Y, might need refinement
                keys: note.getKeys(),
                duration: note.getDuration(),
                isHit: false,
                isMissed: false,
            };
        });

        return noteCoordinates;
    }

    _renderScrollingScore(state) {
        // Clear the visible canvas
        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

        // Draw the relevant part of the offscreen canvas
        this.bgCtx.drawImage(this.scoreCacheCanvas, state.scrollPositionX, 0, this.bgCanvas.width, this.bgCanvas.height, 0, 0, this.bgCanvas.width, this.bgCanvas.height);

        // --- Draw Hit Line ---
        const hitLineX = this.fgCanvas.width / 4; // Position the hit line at 1/4 of the canvas width
        const ctx = this.fgCtx; // Draw on the foreground canvas

        ctx.beginPath();
        ctx.moveTo(hitLineX, 0);
        ctx.lineTo(hitLineX, this.fgCanvas.height);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}