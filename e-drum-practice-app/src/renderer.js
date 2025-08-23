export class Renderer {
    constructor(rendererAreaElement, gameEngine) {
        this.rendererArea = rendererAreaElement;
        this.gameEngine = gameEngine;
        this.noteElements = new Map(); // Maps note object to its DOM element

        // This value should be tuned based on CSS and desired speed
        this.pixelsPerMillisecond = 0.2;
    }

    update() {
        const { activeNotes, currentTime } = this.gameEngine;
        const renderedNoteIds = new Set();

        // Add/update notes on screen
        for (const note of activeNotes) {
            renderedNoteIds.add(note.time + '-' + note.note); // Unique ID for the note
            let noteEl = this.noteElements.get(note);

            if (!noteEl) {
                noteEl = document.createElement('div');
                noteEl.className = 'falling-note';
                // Add class for specific drum type for styling
                noteEl.classList.add(`note-${note.note}`);
                this.rendererArea.appendChild(noteEl);
                this.noteElements.set(note, noteEl);
            }

            const timeUntilHit = note.time - currentTime;
            const bottomPosition = timeUntilHit * this.pixelsPerMillisecond;

            // Don't render notes that are too far away
            if (bottomPosition < this.rendererArea.clientHeight) {
                noteEl.style.bottom = `${bottomPosition}px`;
            }
        }

        // Clean up notes that are no longer active
        for (const [note, element] of this.noteElements.entries()) {
            const noteId = note.time + '-' + note.note;
            if (!renderedNoteIds.has(noteId)) {
                element.remove();
                this.noteElements.delete(note);
            }
        }
    }
}