# Detailed Design: Scoring System Module

## 1. Introduction

This document provides the detailed design for the **Scoring System Module**. This module is a stateful service that tracks the user's performance throughout a practice session. It subscribes to events from the Game Engine and calculates the score, combo, and accuracy, then publishes the updated state for the UI to display.

## 2. Module Responsibilities

*   Initialize and reset the user's score, combo, and other performance metrics at the start of a session.
*   Listen for `game:noteHit` and `game:noteMiss` events from the Game Engine.
*   Update the score and combo based on the judgement of each note.
*   Maintain statistics for a final performance report (e.g., total notes, number of perfects/goods/misses).
*   Publish `game:updateScore` events whenever the score or combo changes.
*   Calculate the final results when the session ends.

## 3. Public API / Interface

The Scoring System will be implemented as a class to manage its state.

```javascript
// Filename: scoring_system.js

class ScoringSystem {
    /**
     * @param {object} eventBus - A reference to the global Event Bus.
     * @param {number} totalNotes - The total number of notes in the score.
     */
    constructor(eventBus, totalNotes) { /* ... */ }

    /**
     * Resets all scoring metrics to their initial state.
     */
    reset() { /* ... */ }

    /**
     * Returns the final performance summary.
     * @returns {object} An object containing the final score, accuracy, etc.
     */
    getFinalResults() { /* ... */ }
}
```

## 4. Internal State

*   `eventBus`: Reference to the global event bus.
*   `score`: The current numerical score.
*   `combo`: The current combo streak.
*   `maxCombo`: The highest combo achieved in the session.
*   `judgementCounts`: An object to track the number of hits for each judgement type (e.g., `{ perfect: 0, good: 0, miss: 0 }`).
*   `totalNotes`: The total number of notes in the current score, used for accuracy calculation.

## 5. Core Logic & Behavior

### 5.1. Initialization (`constructor` and `reset`)
1.  The `constructor` will set up subscriptions to the `game:noteHit` and `game:noteMiss` events.
2.  The `reset` method will be called at the beginning of each session and will set all state variables to their default values:
    *   `score = 0`
    *   `combo = 0`
    *   `maxCombo = 0`
    *   `judgementCounts = { perfect: 0, good: 0, miss: 0 }`
3.  Immediately after resetting, it should publish an initial `game:updateScore` event to ensure the UI starts clean.

### 5.2. Event Handling

#### `onNoteHit` (Handler for `game:noteHit`)
1.  Receives payload: `{ note: object, judgement: string }`.
2.  Increment the appropriate counter in `judgementCounts` (e.g., `this.judgementCounts[judgement]++`).
3.  **Update Combo:**
    *   Increment `this.combo`.
    *   Update `this.maxCombo = Math.max(this.maxCombo, this.combo)`.
4.  **Update Score:**
    *   Calculate points for this hit based on the judgement and current combo.
    *   `basePoints = getPointsForJudgement(judgement)` (e.g., Perfect=100, Good=50).
    *   `comboBonus = getComboBonus(this.combo)` (e.g., a simple multiplier).
    *   `this.score += basePoints + comboBonus`.
5.  **Publish Update:**
    *   Publish a `game:updateScore` event with the new state: `{ score: this.score, combo: this.combo }`.

#### `onNoteMiss` (Handler for `game:noteMiss`)
1.  Receives payload: `{ note: object }`.
2.  Increment `this.judgementCounts.miss`.
3.  **Reset Combo:**
    *   Set `this.combo = 0`.
4.  **Publish Update:**
    *   Publish a `game:updateScore` event with the new state: `{ score: this.score, combo: this.combo }`.

## 6. Scoring Algorithm (Configurable)

The scoring logic should be defined in a configurable way.

```javascript
// Filename: game_config.js

const SCORING_CONFIG = {
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
```

## 7. Final Results (`getFinalResults`)

This method is called when the `game:finished` event is received. It calculates and returns a summary of the performance.

```javascript
getFinalResults() {
    const totalJudged = this.judgementCounts.perfect + this.judgementCounts.good + this.judgementCounts.miss;
    // Note: totalJudged might be less than totalNotes if the game ends early.
    
    const accuracy = (this.judgementCounts.perfect + this.judgementCounts.good) / this.totalNotes;

    return {
        finalScore: this.score,
        maxCombo: this.maxCombo,
        accuracy: (accuracy * 100).toFixed(2) + '%',
        perfectCount: this.judgementCounts.perfect,
        goodCount: this.judgementCounts.good,
        missCount: this.judgementCounts.miss,
    };
}
```

## 8. Events Published to Event Bus

*   **`game:updateScore`**: Published whenever the score or combo changes.
    *   Payload: `{ score: number, combo: number }`