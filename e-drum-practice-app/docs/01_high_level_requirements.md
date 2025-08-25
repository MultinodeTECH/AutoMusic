# E-Drum Practice App - High-Level Requirements Specification

## 1. Introduction

This document outlines the high-level functional and non-functional requirements for the E-Drum Practice App's Minimum Viable Product (MVP). The goal of the MVP is to deliver a core set of features that allow users to connect their electronic drum kits to a web application for practice and real-time feedback.

## 2. User Profile & Target Audience

*   **Primary Users:** Beginner to intermediate drummers who own a MIDI-compatible electronic drum kit.
*   **Key User Goals:**
    *   Improve timing and rhythm.
    *   Learn new beats and patterns.
    *   Make practice sessions more engaging and fun.
    *   Receive instant feedback on their playing accuracy.

## 3. Functional Requirements (FR)

### FR1: MIDI Device Connectivity
*   **FR1.1:** The system MUST allow users to initiate a search for available MIDI devices through the browser's Web MIDI API.
*   **FR1.2:** The system MUST display a list of detected MIDI input devices to the user.
*   **FR1.3:** The user MUST be able to select a device from the list to establish a connection.
*   **FR1.4:** The system MUST provide clear visual feedback on the connection status, including "Disconnected", "Connecting", and "Connected [Device Name]".
*   **FR1.5:** The system MUST gracefully handle device disconnection and provide a mechanism for the user to reconnect.

### FR2: Real-Time Performance Visualization
*   **FR2.1:** The application MUST display a visual representation of a standard drum kit (e.g., kick, snare, hi-hat, cymbals, toms).
*   **FR2.2:** Upon receiving a MIDI `noteOn` message, the corresponding visual element on the UI MUST trigger an immediate animation (e.g., flash, scale, or glow).
*   **FR2.3:** The intensity of the visual feedback (e.g., brightness of the glow) SHOULD correspond to the MIDI velocity value, providing a visual cue for how hard the pad was hit.
*   **FR2.4:** The mapping between MIDI notes and drum kit elements MUST be configurable or based on the General MIDI (GM) standard drum map.

### FR3: "Follow the Score" Practice Mode
*   **FR3.1:** The system MUST be able to load a predefined drum score from a local data source (e.g., a JSON file).
*   **FR3.2:** The score MUST be visually represented on the screen, with notes that scroll or "fall" towards a "hit zone" synchronized with the music's timeline.
*   **FR3.3:** The system MUST provide a visual metronome or a countdown before the score begins to play.
*   **FR3.4:** The user's drum hits MUST be processed in real-time to determine their accuracy relative to the notes in the score. (Detailed logic in a separate design document).

## 4. Non-Functional Requirements (NFR)

### NFR1: Performance
*   **NFR1.1:** The latency between a physical drum hit and the corresponding visual feedback on the screen MUST be minimized to feel instantaneous (ideally < 50ms).
*   **NFR1.2:** The application's animations and score scrolling MUST be smooth and free of stutter, running at a consistent frame rate (ideally 60 FPS).

### NFR2: Usability
*   **NFR2.1:** The user interface MUST be simple, intuitive, and require minimal setup to start a practice session.
*   **NFR2.2:** All interactive elements MUST be clearly labeled and provide immediate feedback upon interaction.

### NFR3: Compatibility
*   **NFR3.1:** The application MUST be compatible with modern web browsers that support the Web MIDI API (e.g., Chrome, Edge, Opera).
*   **NFR3.2:** The application SHOULD function correctly with a wide range of common electronic drum kits that use standard MIDI messages.

## 5. Out of Scope for MVP

The following features are explicitly excluded from the MVP to ensure a focused and timely initial release:

*   User accounts and progress saving.
*   Importing or editing custom drum scores.
*   Recording and playback of user performances.
*   Advanced game modes beyond "Follow the Score".
*   On-screen keyboard or mouse-based drumming.