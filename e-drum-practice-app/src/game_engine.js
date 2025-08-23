import { TIMING_WINDOWS } from './config.js';

/**
 * @fileoverview Manages the core game logic for the E-Drum Practice App.
 */

export class GameEngine {
    /**
     * @param {object} scoreData - The parsed score data.
     * @param {import('./event_bus.js').EventBus} eventBus - The application's event bus.
     */
    constructor(scoreData, eventBus) {
        this.scoreData = scoreData;
        this.eventBus = eventBus;

        this.gameState = 'ready'; // 'ready', 'playing', 'finished'
        this.startTime = 0;
        this.currentTime = 0;
        this.activeNotes = [];
        this.noteIndex = 0; // To keep track of the next note to activate from the score
        this.loopId = null;

        // Pre-sort notes by time to ensure correct processing order
        this.notes = [...this.scoreData.notes].sort((a, b) => a.time - b.time);

        this.onUserHit = this.onUserHit.bind(this);
        this.update = this.update.bind(this);
    }

    /**
     * Subscribes to MIDI events.
     */
    subscribeToEvents() {
        this.eventBus.subscribe('midi:noteOn', this.onUserHit);
    }

    /**
     * Starts the game loop.
     */
    start() {
        if (this.gameState === 'playing') return;

        this.gameState = 'playing';
        this.startTime = performance.now();
        this.subscribeToEvents();

        this.loopId = requestAnimationFrame(this.update);
    }

    /**
     * Stops the game loop.
     */
    stop() {
        if (this.loopId) {
            cancelAnimationFrame(this.loopId);
            this.loopId = null;
        }
        this.gameState = 'finished';
        this.eventBus.publish('game:finished', null);
    }

    /**
     * The main game loop, called on every frame.
     * @param {number} timestamp - The current time from requestAnimationFrame.
     */
    update(timestamp) {
        if (this.gameState !== 'playing') return;

        this.currentTime = timestamp - this.startTime;

        // Activate upcoming notes
        while (this.noteIndex < this.notes.length && this.notes[this.noteIndex].time <= this.currentTime + 2000) { // 2000ms lookahead
            this.activeNotes.push(this.notes[this.noteIndex]);
            this.noteIndex++;
        }

        // Check for missed notes
        this.activeNotes = this.activeNotes.filter(note => {
            // A note is missed if its time is past the latest "good" hit window
            if (note.time < this.currentTime - TIMING_WINDOWS.GOOD_THRESHOLD_MS) {
                this.eventBus.publish('game:noteMiss', { note });
                return false; // Remove from active notes
            }
            return true; // Keep in active notes
        });

        // Continue the loop
        this.loopId = requestAnimationFrame(this.update);

        // Check for end of score
        if (this.noteIndex >= this.notes.length && this.activeNotes.length === 0) {
            this.stop();
        }
    }

    /**
     * Handles user drum hits from MIDI events.
     * @param {{detail: {note: number}}} eventData - The event data from midi:noteOn.
     */
    onUserHit({ detail: { note: hitNote } }) {
        if (this.gameState !== 'playing') return;

        let bestMatch = null;
        let smallestDelta = Infinity;

        // Find the closest note of the same type in the active notes
        for (const activeNote of this.activeNotes) {
            if (activeNote.note === hitNote) {
                const delta = Math.abs(this.currentTime - activeNote.time);
                if (delta < smallestDelta) {
                    smallestDelta = delta;
                    bestMatch = activeNote;
                }
            }
        }

        if (bestMatch) {
            const timeDifference = this.currentTime - bestMatch.time;
            const absTimeDifference = Math.abs(timeDifference);
            let judgement = 'Miss'; // Default to miss if outside thresholds

            if (absTimeDifference <= TIMING_WINDOWS.PERFECT_THRESHOLD_MS) {
                judgement = 'Perfect';
            } else if (absTimeDifference <= TIMING_WINDOWS.GOOD_THRESHOLD_MS) {
                judgement = 'Good';
            }

            if (judgement !== 'Miss') {
                this.eventBus.publish('game:noteHit', {
                    note: bestMatch,
                    judgement,
                    delta: timeDifference,
                });

                // Remove the note from activeNotes so it can't be hit again
                this.activeNotes = this.activeNotes.filter(n => n !== bestMatch);
            }
        }
    }
}