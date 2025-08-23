# Detailed Design: UI View & Visualization Module

## 1. Introduction

This document provides the detailed design for the **UI View & Visualization Module**. This module is the primary interface for the user, responsible for rendering all visual components of the application and reflecting the application's state in real-time. It acts as a subscriber to events from other services (like MIDI and Game Engine) and translates them into DOM updates.

## 2. Module Responsibilities

*   Render the main HTML structure of the application.
*   Manage and update the MIDI connection status display.
*   Render the virtual drum kit.
*   Trigger animations on the virtual drum kit in response to user hits.
*   Render the "falling notes" display area.
*   Display the current score, combo, and other performance metrics.
*   Handle user interactions, such as clicking buttons to connect to a MIDI device or start a game.

## 3. Component Breakdown & DOM Structure

The UI will be composed of several distinct visual components.

```html
<!-- Simplified DOM Structure -->
<body>
    <header id="status-bar">
        <div id="midi-status">Status: Disconnected</div>
        <button id="connect-btn">Connect to E-Drum</button>
    </header>

    <main id="game-container">
        <div id="score-display">
            <span id="score">0</span>
            <span id="combo"></span>
        </div>
        <div id="renderer-area">
            <!-- Falling notes will be rendered here (e.g., inside a <canvas>) -->
            <div id="hit-zone"></div>
        </div>
    </main>

    <footer id="virtual-drum-kit">
        <div class="drum-pad" id="pad-kick" data-note="36">Kick</div>
        <div class="drum-pad" id="pad-snare" data-note="38">Snare</div>
        <div class="drum-pad" id="pad-hihat" data-note="42">Hi-Hat</div>
        <!-- ... other pads ... -->
    </footer>
</body>
```

## 4. Core Logic & Behavior

The UI View module will be primarily event-driven, subscribing to the global Event Bus.

### 4.1. Initialization (`init`)
1.  Cache references to key DOM elements (e.g., `midiStatusDiv`, `connectBtn`, `drumPads`).
2.  Bind event listeners for user actions (e.g., `click` on `#connect-btn`).
3.  Subscribe to all relevant events from the Event Bus.

### 4.2. Event Subscriptions

#### MIDI Status Events
*   **`eventBus.subscribe('midi:connecting', handler)`**:
    *   Update `#midi-status` text to "Connecting...".
    *   Disable `#connect-btn`.
*   **`eventBus.subscribe('midi:connected', handler)`**:
    *   Update `#midi-status` text to `Connected: ${deviceName}`.
    *   Change the text of `#connect-btn` to "Disconnect".
    *   Enable `#connect-btn`.
*   **`eventBus.subscribe('midi:disconnected', handler)`**:
    *   Update `#midi-status` text to "Disconnected".
    *   Change the text of `#connect-btn` to "Connect".
    *   Enable `#connect-btn`.

#### Performance Visualization Events
*   **`eventBus.subscribe('midi:noteOn', handler)`**:
    *   Receives payload: `{ note: number, velocity: number }`.
    *   Find the corresponding drum pad element in the DOM (e.g., using a `data-note` attribute).
    *   If a pad is found, trigger a visual animation.
    *   **Animation Logic:**
        1.  Add a CSS class (e.g., `pad-hit`) to the element.
        2.  The CSS class will define the animation (e.g., a quick scale-up and glow).
        3.  Use the `animationend` event to remove the class once the animation is complete, making it ready for the next hit.
        4.  (Optional) The velocity can be used to modulate the animation's intensity, for example, by setting a CSS custom property: `element.style.setProperty('--hit-intensity', velocity / 127)`.

#### Game State Events
*   **`eventBus.subscribe('game:updateScore', handler)`**:
    *   Receives payload: `{ score: number, combo: number }`.
    *   Update the text content of `#score` with the new score.
    *   If `combo` is greater than 1, display it in `#combo`; otherwise, hide the combo display.

### 4.3. User Actions
*   **`#connect-btn` Click Handler**:
    *   Check the current connection status.
    *   If disconnected, it should trigger the `MIDIService.init()` and then display a list of devices for the user to choose from (this might involve creating a simple modal UI).
    *   If connected, it should call `MIDIService.disconnect()`.

## 5. MIDI Note to Drum Pad Mapping

A mapping object will be used to associate MIDI note numbers with the DOM elements of the virtual drum kit. This allows for easy configuration and customization.

```javascript
// Filename: midi_mapping.js

const DRUM_MAP = {
    36: 'pad-kick',    // Kick Drum
    38: 'pad-snare',   // Snare
    42: 'pad-hihat',   // Closed Hi-Hat
    46: 'pad-hihat-open', // Open Hi-Hat
    49: 'pad-crash',   // Crash Cymbal
    51: 'pad-ride',    // Ride Cymbal
    48: 'pad-tom-high', // High Tom
    // ... and so on, based on General MIDI drum map
};
```
The `midi:noteOn` handler will use this map to find the correct element ID from the incoming note number.

## 6. CSS Design for Animations

The visual feedback will be handled primarily by CSS for performance.

```css
/* Example CSS for hit animation */
.drum-pad {
    transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;
}

.drum-pad.pad-hit {
    transform: scale(1.1);
    box-shadow: 0 0 20px 10px rgba(255, 255, 0, 0.7);
    /* Or use a keyframe animation */
}