/**
 * @fileoverview Configuration file for the E-Drum Practice App.
 * This file contains constants and settings used throughout the application.
 */

/**
 * Timing windows for note hits, in milliseconds.
 * These values define the thresholds for 'Perfect' and 'Good' hits.
 * @const
 * @type {{PERFECT_THRESHOLD_MS: number, GOOD_THRESHOLD_MS: number}}
 */
export const TIMING_WINDOWS = {
    PERFECT_THRESHOLD_MS: 50, // +/- 50ms from the note's exact time
    GOOD_THRESHOLD_MS: 100,     // +/- 100ms from the note's exact time
};

/**
 * Scoring configuration.
 * Defines points for each judgement and combo bonus logic.
 * @const
 * @type {{POINTS: {PERFECT: number, GOOD: number, MISS: number}, COMBO_BONUS: function(number): number}}
 */
export const SCORING_CONFIG = {
    POINTS: {
        PERFECT: 100,
        GOOD: 50,
        MISS: 0,
    },
    // Example: A simple bonus for every 10 combos
    COMBO_BONUS: (combo) => {
        return Math.floor(combo / 10) * 5;
    }
};