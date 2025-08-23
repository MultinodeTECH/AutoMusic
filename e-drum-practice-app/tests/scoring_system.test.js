import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { ScoringSystem } from '../src/scoring_system.js';
import { EventBus } from '../src/event_bus.js';
import { SCORING_CONFIG } from '../src/config.js';

// Mock the config to ensure tests are not dependent on actual values which might change.
jest.mock('../src/config.js', () => ({
    SCORING_CONFIG: {
        POINTS: {
            PERFECT: 100,
            GOOD: 50,
        },
        COMBO_BONUS: (combo) => (combo > 1 ? (combo - 1) * 10 : 0),
    },
}));

describe('ScoringSystem', () => {
    let eventBus;
    let scoringSystem;
    const totalNotes = 10;

    beforeEach(() => {
        eventBus = new EventBus();
        // Spy on the publish method to track calls
        jest.spyOn(eventBus, 'publish');
        scoringSystem = new ScoringSystem(eventBus, totalNotes);
    });

    test('should initialize with score and combo at 0', () => {
        expect(scoringSystem.score).toBe(0);
        expect(scoringSystem.combo).toBe(0);
        expect(scoringSystem.maxCombo).toBe(0);
        expect(scoringSystem.judgementCounts).toEqual({ perfect: 0, good: 0, miss: 0 });
    });

    test('reset() should set score and combo to 0 and publish an update', () => {
        // Simulate some activity
        scoringSystem.score = 500;
        scoringSystem.combo = 5;
        scoringSystem.reset();

        expect(scoringSystem.score).toBe(0);
        expect(scoringSystem.combo).toBe(0);
        expect(eventBus.publish).toHaveBeenCalledWith('game:updateScore', { score: 0, combo: 0 });
    });

    test('should correctly increase score and combo on a "Perfect" hit', () => {
        scoringSystem.subscribeToEvents();

        // First hit
        eventBus.publish('game:noteHit', { detail: { judgement: 'Perfect' } });
        let expectedScore = SCORING_CONFIG.POINTS.PERFECT;
        expect(scoringSystem.score).toBe(expectedScore);
        expect(scoringSystem.combo).toBe(1);
        expect(scoringSystem.maxCombo).toBe(1);
        expect(eventBus.publish).toHaveBeenCalledWith('game:updateScore', { score: expectedScore, combo: 1 });

        // Second hit (with combo bonus)
        eventBus.publish('game:noteHit', { detail: { judgement: 'Perfect' } });
        expectedScore += SCORING_CONFIG.POINTS.PERFECT + SCORING_CONFIG.COMBO_BONUS(2);
        expect(scoringSystem.score).toBe(expectedScore);
        expect(scoringSystem.combo).toBe(2);
        expect(scoringSystem.maxCombo).toBe(2);
        expect(eventBus.publish).toHaveBeenCalledWith('game:updateScore', { score: expectedScore, combo: 2 });
    });

    test('should correctly increase score and combo on a "Good" hit', () => {
        scoringSystem.subscribeToEvents();

        // First hit
        eventBus.publish('game:noteHit', { detail: { judgement: 'Good' } });
        let expectedScore = SCORING_CONFIG.POINTS.GOOD;
        expect(scoringSystem.score).toBe(expectedScore);
        expect(scoringSystem.combo).toBe(1);
        expect(scoringSystem.maxCombo).toBe(1);
        expect(eventBus.publish).toHaveBeenCalledWith('game:updateScore', { score: expectedScore, combo: 1 });

        // Second hit (with combo bonus)
        eventBus.publish('game:noteHit', { detail: { judgement: 'Good' } });
        expectedScore += SCORING_CONFIG.POINTS.GOOD + SCORING_CONFIG.COMBO_BONUS(2);
        expect(scoringSystem.score).toBe(expectedScore);
        expect(scoringSystem.combo).toBe(2);
        expect(scoringSystem.maxCombo).toBe(2);
        expect(eventBus.publish).toHaveBeenCalledWith('game:updateScore', { score: expectedScore, combo: 2 });
    });

    test('should reset combo to 0 on a note miss', () => {
        scoringSystem.subscribeToEvents();

        // Build up a combo
        eventBus.publish('game:noteHit', { detail: { judgement: 'Perfect' } });
        eventBus.publish('game:noteHit', { detail: { judgement: 'Perfect' } });
        expect(scoringSystem.combo).toBe(2);

        // Miss a note
        const scoreBeforeMiss = scoringSystem.score;
        eventBus.publish('game:noteMiss');
        expect(scoringSystem.combo).toBe(0);
        expect(scoringSystem.score).toBe(scoreBeforeMiss); // Score should not change on miss
        expect(eventBus.publish).toHaveBeenCalledWith('game:updateScore', { score: scoreBeforeMiss, combo: 0 });
    });

    test('should correctly track maxCombo', () => {
        scoringSystem.subscribeToEvents();

        eventBus.publish('game:noteHit', { detail: { judgement: 'Perfect' } }); // combo = 1, maxCombo = 1
        eventBus.publish('game:noteHit', { detail: { judgement: 'Perfect' } }); // combo = 2, maxCombo = 2
        eventBus.publish('game:noteMiss');                                    // combo = 0, maxCombo = 2
        eventBus.publish('game:noteHit', { detail: { judgement: 'Perfect' } }); // combo = 1, maxCombo = 2

        expect(scoringSystem.maxCombo).toBe(2);
    });

    test('getFinalResults should calculate and return correct final statistics', () => {
        // Simulate a game session
        scoringSystem.onNoteHit({ detail: { judgement: 'Perfect' } }); // Score: 100, Combo: 1
        scoringSystem.onNoteHit({ detail: { judgement: 'Perfect' } }); // Score: 100 + 100 + 10 = 210, Combo: 2
        scoringSystem.onNoteHit({ detail: { judgement: 'Good' } });    // Score: 210 + 50 + 20 = 280, Combo: 3
        scoringSystem.onNoteMiss();                                    // Combo: 0
        scoringSystem.onNoteHit({ detail: { judgement: 'Perfect' } }); // Score: 280 + 100 = 380, Combo: 1

        const results = scoringSystem.getFinalResults();

        expect(results.finalScore).toBe(380);
        expect(results.maxCombo).toBe(3);
        expect(results.perfectCount).toBe(3);
        expect(results.goodCount).toBe(1);
        expect(results.missCount).toBe(1);

        // Accuracy = (perfect + good) / (perfect + good + miss) = 4 / 5 = 0.8
        expect(results.accuracy).toBe('80.00%');
    });

    test('getFinalResults should handle division by zero for accuracy', () => {
        const results = scoringSystem.getFinalResults();
        expect(results.accuracy).toBe('0.00%');
    });
});