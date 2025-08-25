# Detailed Design: Core Practice Engine Module

## 1. Introduction

This document details the design of the **Core Practice Engine**, the heart of the "Follow the Score" practice mode. This module is responsible for managing the game's state, timing, user input processing, and judging logic. It orchestrates the entire practice session from start to finish.

## 2. Module Responsibilities

*   Load and hold the parsed score data for the current session.
*   Manage the main game loop, which drives all time-sensitive operations.
*   Track the current playback time and game state (e.g., 'ready', 'playing', 'finished').
*   Calculate the visual positions of the "falling notes" for the Renderer.
*   Process incoming user drum hits (`midi:noteOn` events).
*   Implement the core judging logic to determine the accuracy of each hit.
*   Publish events related to game progress and user performance (e.g., `game:noteHit`, `game:noteMiss`).

## 3. Public API / Interface

The Game Engine will be implemented as a class to manage its complex internal state.

```javascript
// Filename: game_engine.js

class GameEngine {
    /**
     * @param {object} scoreData - The parsed score data from the Score Loader.
     * @param {object} eventBus - A reference to the global Event Bus.
     */
    constructor(scoreData, eventBus) { /* ... */ }

    /**
     * Starts the practice session.
     */
    start() { /* ... */ }

    /**
     * Stops the practice session.
     */
    stop() { /* ... */ }
}
```

## 4. Internal State

*   `scoreData`: The full, parsed score object.
*   `eventBus`: Reference to the global event bus.
*   `gameState`: String representing the current state ('ready', 'countdown', 'playing', 'paused', 'finished').
*   `startTime`: The timestamp (`performance.now()`) when the 'playing' state began.
*   `currentTime`: The current time elapsed in the song, in milliseconds.
*   `activeNotes`: An array of notes from the score that are currently visible on screen.
*   `noteIndex`: An index pointing to the next note in the score to be activated.
*   `loopId`: The ID returned by `requestAnimationFrame`, used to control the game loop.

## 5. Core Logic & Behavior

### 5.1. The Game Loop (`update`)
The `update` method is the core of the engine, called on every frame via `requestAnimationFrame`.
1.  **Calculate Time:**
    *   If `gameState` is 'playing', calculate `currentTime = performance.now() - this.startTime`.
2.  **Update Active Notes:**
    *   Iterate through `this.scoreData.notes` starting from `this.noteIndex`.
    *   If a note's `time` is within the upcoming visual window (e.g., `currentTime + 2000ms`), move it from the main score list to the `this.activeNotes` array and increment `this.noteIndex`.
3.  **Process User Input (Indirectly):** The engine doesn't directly handle the input loop, but it maintains the state that the input handler uses for judging.
4.  **Judging Logic (Missed Notes):**
    *   Iterate through `this.activeNotes`.
    *   If a note's `time` is now in the past by more than the "miss" threshold (e.g., `note.time < this.currentTime - MISS_THRESHOLD_MS`), it's a missed note.
    *   Publish a `game:noteMiss` event with the note details.
    *   Remove the note from `this.activeNotes`.
5.  **Update Renderer:**
    *   Provide the Renderer with the `activeNotes` and `currentTime` so it can calculate and draw their visual positions.
6.  **Loop Control:**
    *   Call `this.loopId = requestAnimationFrame(this.update.bind(this))` to schedule the next frame.

### 5.2. User Input Handling (`onUserHit`)
1.  The engine subscribes to the `midi:noteOn` event from the Event Bus.
2.  The `onUserHit` handler receives the user's hit: `{ note: number, velocity: number }`.
3.  **Find Target Note:**
    *   Search `this.activeNotes` for a note that matches the `note` number from the user's hit.
    *   The search should be for the note of that type that is closest to the `hit-zone` (i.e., its `time` is closest to `this.currentTime`).
4.  **Judging Logic (Hit Notes):**
    *   If no matching note is found in `activeNotes`, the hit is ignored (or could be flagged as an "extra" hit in a future version).
    *   If a target note is found, calculate the timing difference: `delta = this.currentTime - targetNote.time`.
    *   Compare `delta` against predefined timing windows:
        *   `if (abs(delta) <= PERFECT_THRESHOLD_MS)` -> Judgement: 'Perfect'
        *   `else if (abs(delta) <= GOOD_THRESHOLD_MS)` -> Judgement: 'Good'
        *   `else` -> Judgement: 'Miss' (This case handles hits that are too early or too late but still target a note).
5.  **Publish Result:**
    *   Publish a `game:noteHit` event with the details: `{ note: targetNote, judgement: 'Perfect', delta: delta }`.
6.  **Cleanup:**
    *   Remove the judged note from `this.activeNotes` so it cannot be hit again.

### 5.3. State Management
*   **`constructor`**: Sets initial state, sets up the subscription to `midi:noteOn`.
*   **`start`**:
    1.  Sets `gameState` to 'countdown'.
    2.  (Optional) Starts a visual countdown on the UI.
    3.  After the countdown, sets `gameState` to 'playing'.
    4.  Records the `startTime`.
    5.  Initiates the game loop by calling `requestAnimationFrame`.
*   **`stop`**:
    1.  Cancels the game loop using `cancelAnimationFrame(this.loopId)`.
    2.  Sets `gameState` to 'finished'.
    3.  Performs any cleanup.

## 6. Timing Windows (Configurable)

The accuracy of judging depends on timing thresholds. These should be configurable constants.

```javascript
// Filename: game_config.js

const TIMING_WINDOWS = {
    PERFECT_THRESHOLD_MS: 50, // +/- 50ms from the note's exact time
    GOOD_THRESHOLD_MS: 100,   // +/- 100ms
    MISS_THRESHOLD_MS: 150,     // After this, the note is considered missed
};
```

## 7. Events Published to Event Bus

*   **`game:noteHit`**: Published when a user's hit is successfully judged against a note.
    *   Payload: `{ note: object, judgement: string, delta: number }`
*   **`game:noteMiss`**: Published when a note scrolls past the hit zone without being hit correctly.
    *   Payload: `{ note: object }`
*   **`game:finished`**: Published when the song/score is completed.
    *   Payload: `null`