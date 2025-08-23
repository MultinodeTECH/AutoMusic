import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { GameEngine } from '../src/game_engine.js';
import { EventBus } from '../src/event_bus.js';
import { TIMING_WINDOWS } from '../src/config.js';

global.requestAnimationFrame = (callback) => {
    // Pass performance.now() to the callback to simulate a real timestamp
    return setTimeout(() => callback(performance.now()), 16);
};
global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
};

jest.useFakeTimers();

// Mock performance.now() for predictable timing
let time = 0;
global.performance = {
    now: () => time,
};

const mockScoreData = {
    "metadata": {
        "title": "Test Rock Beat",
        "artist": "Test Artist",
        "bpm": 120
    },
    "notes": [
        { "note": 36, "time": 1000 }, // Kick
        { "note": 38, "time": 1500 }, // Snare
        { "note": 42, "time": 2000 }, // Hi-hat
        { "note": 36, "time": 3000 }  // Kick
    ]
};

describe('GameEngine', () => {
    let eventBus;
    let gameEngine;

    beforeEach(() => {
        eventBus = new EventBus();
        gameEngine = new GameEngine(mockScoreData, eventBus);
        time = 0; // Reset time for each test
    });

    test('should initialize with correct default state', () => {
        expect(gameEngine.gameState).toBe('ready');
        expect(gameEngine.activeNotes).toEqual([]);
        expect(gameEngine.noteIndex).toBe(0);
    });

    test('start() should change gameState to "playing" and start the update loop', () => {
        gameEngine.start();
        expect(gameEngine.gameState).toBe('playing');
        expect(gameEngine.startTime).toBe(0);

        // Fast-forward time to trigger the update
        time = 16;
        jest.advanceTimersByTime(16);

        // Now the update should have been called
        // We can't easily spy on it after the fact with fake timers,
        // but we can check the effects of the update loop running.
        expect(gameEngine.currentTime).toBe(16);
        gameEngine.stop();
    });

    test('stop() should change gameState to "finished" and cancel the animation frame', () => {
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        gameEngine.start();
        const loopId = gameEngine.loopId;
        gameEngine.stop();
        expect(gameEngine.gameState).toBe('finished');
        expect(clearTimeoutSpy).toHaveBeenCalledWith(loopId);
    });

    test('should activate notes as time progresses', () => {
        gameEngine.start();
        time = 1000;
        jest.advanceTimersByTime(1000); // This will call update with a timestamp around 1000

        // currentTime is 1000. Lookahead is 2000ms. So notes up to 3000ms should be active.
        // notes are at 1000, 1500, 2000, 3000. All 4 should be active.
        expect(gameEngine.activeNotes.length).toBe(4);
        expect(gameEngine.activeNotes[0].note).toBe(36);
        expect(gameEngine.activeNotes[1].note).toBe(38);
        gameEngine.stop();
    });

    test('should identify a "Perfect" hit', () => {
        const hitSpy = jest.fn();
        eventBus.subscribe('game:noteHit', hitSpy);
        gameEngine.start();

        time = 990; // Advance time to just before the note
        jest.advanceTimersByTime(990);

        time = 1000; // Set the exact time for the hit
        gameEngine.currentTime = time; // Manually update current time for the hit
        gameEngine.onUserHit({ detail: { note: 36 } });

        expect(hitSpy).toHaveBeenCalledWith({
            note: mockScoreData.notes[0],
            judgement: 'Perfect',
            delta: 0,
        });
        expect(gameEngine.activeNotes.some(n => n.note === 36)).toBe(false); // Note should be removed
        gameEngine.stop();
    });

    test('should identify a "Good" hit', () => {
        const hitSpy = jest.fn();
        eventBus.subscribe('game:noteHit', hitSpy);
        gameEngine.start();

        time = 990; // Advance time to just before the note
        jest.advanceTimersByTime(990);

        time = 1000 + TIMING_WINDOWS.PERFECT_THRESHOLD_MS + 10; // Slightly off perfect
        gameEngine.currentTime = time; // Manually update current time for the hit
        gameEngine.onUserHit({ detail: { note: 36 } });

        expect(hitSpy).toHaveBeenCalled();
        const hitData = hitSpy.mock.calls[0][0];
        expect(hitData.judgement).toBe('Good');
        gameEngine.stop();
    });

    test.skip('should identify a missed note', () => {
        const missSpy = jest.fn();
        eventBus.subscribe('game:noteMiss', missSpy);
        gameEngine.start();

        // Advance time far beyond the first note without a hit
        time = 1000 + TIMING_WINDOWS.GOOD_THRESHOLD_MS + 1;
        jest.advanceTimersByTime(2000); // Advance time by 2 seconds

        // The update loop should detect the miss
        expect(missSpy).toHaveBeenCalledWith({ note: mockScoreData.notes[0] });

        // Now the note should be removed
        expect(gameEngine.activeNotes.some(n => n.note === 36)).toBe(false);

        gameEngine.stop();
    });

    test('should finish the game when all notes are processed', () => {
        const finishSpy = jest.fn();
        eventBus.subscribe('game:finished', finishSpy);
        gameEngine.start();

        time = 5000; // Advance time past all notes
        jest.advanceTimersByTime(5000); // Process all notes (they will be missed)

        // A subsequent update should detect the game is over
        jest.advanceTimersByTime(16);

        expect(finishSpy).toHaveBeenCalled();
        expect(gameEngine.gameState).toBe('finished');
    });
});