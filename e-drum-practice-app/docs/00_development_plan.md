# E-Drum Practice App Development Plan

## 1. Core Goal

Create a web-based application that connects to a user's electronic drum kit via Bluetooth MIDI. The app will provide real-time visual feedback and various practice modes to help drummers (especially beginners and intermediates) improve their rhythm, accuracy, and technique.

## 2. Core Features (MVP - Minimum Viable Product)

In the initial phase, we should focus on the most essential features to quickly validate the concept and gather user feedback. The following are the proposed MVP features:

*   **MIDI Device Connection & Management:**
    *   Automatically detect and connect to MIDI e-drum kits via Bluetooth or USB.
    *   Clearly display the current device connection status (Connected / Disconnected / Connecting).
    *   Handle device disconnection and reconnection logic gracefully.
*   **Real-time Performance Visualization:**
    *   Create a virtual drum kit UI.
    *   When the user hits a pad on the e-drum kit (e.g., snare, kick), the corresponding element on the UI will immediately animate (e.g., highlight, scale).
    *   Accurately reflect the incoming MIDI Note (which drum was hit) and Velocity (how hard it was hit).
*   **Basic Practice Mode - "Follow the Score":**
    *   Load a preset, simple drum score (e.g., a basic 4/4 rock beat).
    *   Display the notes to be played in a "falling-note" style (similar to Guitar Hero).
    *   The user plays along with the on-screen prompts.

## 3. Technology Stack

Prioritizing cross-platform compatibility, ease of access, and rapid development, we will choose Web Technologies.

*   **Core Technology:** Web MIDI API. This is the cornerstone of the project, allowing the browser to communicate directly with MIDI devices.
*   **Frontend Framework (Optional):**
    *   **Vanilla HTML/CSS/JavaScript:** For the MVP, vanilla tech is sufficient and the most straightforward approach (as seen in the initial code prototype).
    *   **Vue.js / React:** If more complex features and state management are planned for the future, a modern framework will provide better structure and scalability.
*   **Graphics Rendering (Optional):**
    *   **CSS Animations:** Ideal for simple hit-highlight effects. It's performant and easy to implement.
    *   **HTML5 Canvas / SVG:** A better choice for more complex animations or custom score rendering.
*   **Deployment:** Can be deployed to any static site hosting platform like GitHub Pages, Vercel, or Netlify for global access.

## 4. Development Phases

We can break down the development process into several clear phases:

*   **Phase 1: Connection & Visualization (80% Complete)**
    *   **Goal:** Achieve a stable connection between the e-drum kit and the web app, providing accurate, real-time visual feedback.
    *   **Tasks:** Refine the initial code prototype to ensure compatibility with major e-drum models and improve the visual feedback effects.
*   **Phase 2: Core Practice Engine**
    *   **Goal:** Create an engine that can read score data and render it as a gamified interface.
    *   **Tasks:**
        *   Design a simple data format for drum scores (e.g., JSON).
        *   Write the logic to make the score data scroll or "fall" along a timeline.
        *   Implement a basic metronome.
*   **Phase 3: Judging & Scoring System**
    *   **Goal:** Provide real-time feedback and a final score based on the user's performance.
    *   **Tasks:**
        *   Write judging logic to determine if a hit is Perfect, Good, or a Miss.
        *   Develop a combo counter and scoring system.
        *   Generate a simple performance report (e.g., accuracy, max combo) after a song is completed.
*   **Phase 4: Content & User Experience**
    *   **Goal:** Enrich the practice content and optimize the overall user flow.
    *   **Tasks:**
        *   Create a simple song/exercise library for users to choose from.
        *   Add difficulty levels.
        *   Improve the UI/UX for a more polished and user-friendly experience.

## 5. Future Roadmap

Once the core features are stable, we can consider adding the following advanced features to enhance the product:

*   **User Profile System:** Allow users to save their practice history and track their progress over time.
*   **Score Importer / Editor:** Allow users to upload their own MIDI drum score files or create simple beats online.
*   **Recording & Playback:** Enable users to record their sessions and compare them against the standard track.
*   **More Game Modes:** Such as a free-play mode, rhythm challenges, etc.

This plan provides a clear blueprint for the project. I suggest we start by focusing on Phase 2: Core Practice Engine.

## 6. How to Run

This application is a static web page that requires a simple local HTTP server to run correctly due to browser security policies (e.g., for loading local files via AJAX).

### On Windows

1.  Ensure you have Python installed.
2.  Double-click the `run.bat` file.
3.  This will start a local server. Open your web browser and navigate to `http://localhost:8000`.

### On macOS / Linux

1.  Ensure you have Python installed.
2.  Open a terminal in the project's root directory.
3.  Run the command: `sh ./run.sh`
4.  This will start a local server. Open your web browser and navigate to `http://localhost:8000`.