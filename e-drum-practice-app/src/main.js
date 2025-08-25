import { stateManager } from './core/state_manager.js';
import { CanvasRenderer } from './rendering/canvas_renderer.js';
import { initMidi, setOnNoteOn } from './services/midi_service.js';
import * as scrollMode from './game_modes/scroll_mode_logic.js';
import * as fallingMode from './game_modes/falling_mode_logic.js';
import { songData as basicRockScore1 } from '../scores/basic_rock_1.js';

const gameModes = {
    scroll: scrollMode,
    falling: fallingMode,
};

async function main() {
    const stateManagerInstance = stateManager;
    const canvasRenderer = new CanvasRenderer('game-container');
    initMidi();

    // --- Pre-load score data ---
    const noteCoordinates = canvasRenderer.loadScore(basicRockScore1);


    // --- State and Rendering Setup ---
    stateManagerInstance.subscribe(canvasRenderer.render.bind(canvasRenderer));

    // --- MIDI Input Handling ---
    setOnNoteOn((note, velocity) => {
        const action = { type: 'NOTE_ON', payload: { note, velocity } };
        stateManagerInstance.setState(prevState => ({
            ...prevState,
            actions: [...(prevState.actions || []), action]
        }));
    });

    // --- UI Event Listeners ---
    const scrollModeButton = document.getElementById('scroll-mode-btn');
    const fallingModeButton = document.getElementById('falling-mode-btn');
    const startStopButton = document.getElementById('start-stop-btn');

    scrollModeButton.addEventListener('click', () => {
        const initialState = scrollMode.getInitialState();
        stateManagerInstance.setState({
            ...initialState,
            gameMode: 'scroll',
            gameRunning: false,
            notes: noteCoordinates // Load the pre-calculated notes
        });
    });

    fallingModeButton.addEventListener('click', () => {
        const initialState = fallingMode.getInitialState();
        stateManagerInstance.setState({
            ...initialState,
            gameMode: 'falling',
            gameRunning: false
        });
    });

    startStopButton.addEventListener('click', () => {
        const currentState = stateManagerInstance.getState();
        const isStarting = !currentState.gameRunning;
        const currentModeLogic = gameModes[currentState.gameMode];

        if (currentModeLogic) {
            let nextState;
            if (isStarting) {
                // Pass a clean, initial state to the onStart function
                const initialState = {
                    ...currentState,
                    currentSongData: basicRockScore1.notes, // Assuming this is the format
                    startTime: performance.now()
                };
                nextState = currentModeLogic.onStart(initialState);
            } else {
                nextState = currentModeLogic.onStop(currentState);
            }
            stateManagerInstance.setState({ ...nextState, gameRunning: isStarting });
        }
    });

    // --- Game Loop ---
    let lastTime = 0;
    function gameLoop(currentTime) {
        if (!lastTime) lastTime = currentTime;
        // const deltaTime = currentTime - lastTime;

        const currentState = stateManagerInstance.getState();
        const currentModeLogic = gameModes[currentState.gameMode];

        if (currentState.gameRunning && currentModeLogic && currentModeLogic.update) {
            const actions = currentState.actions || [];
            const newState = currentModeLogic.update(currentState, currentTime, actions);

            // Clear actions after they've been processed
            newState.actions = [];

            stateManagerInstance.setState(newState);
        }

        lastTime = currentTime;
        requestAnimationFrame(gameLoop);
    }

    // --- Initial State ---
    stateManagerInstance.setState({
        gameMode: 'falling',
        gameRunning: false,
        actions: [],
        notes: [],
        hitEffects: [],
        score: 0,
        combo: 0,
    });

    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', main);