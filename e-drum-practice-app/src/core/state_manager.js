import { getInitialState as getScrollModeInitialState } from '../game_modes/scroll_mode_logic.js';
// import { getInitialState as getFallingModeInitialState } from '../game_modes/falling_mode_logic.js';

class StateManager {
    constructor() {
        this.state = {
            gameMode: null, // 'scroll' or 'falling'
            isPlaying: false,
            score: 0,
            notes: [], // active notes
            lastTime: 0,
        };
        this.listeners = new Set();
    }

    subscribe(callback) {
        this.listeners.add(callback);
        // Provide a way to unsubscribe
        return () => {
            this.listeners.delete(callback);
        };
    }

    setState(newState) {
        const oldMode = this.state.gameMode;
        const newMode = newState.gameMode;

        let modeSpecificState = {};
        if (newMode && newMode !== oldMode) {
            if (newMode === 'scroll') {
                modeSpecificState = getScrollModeInitialState();
            } else if (newMode === 'falling') {
                // modeSpecificState = getFallingModeInitialState();
            }
        }

        this.state = { ...this.state, ...newState, ...modeSpecificState };
        this.notify();
    }

    getState() {
        return this.state;
    }

    notify() {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
}

export const stateManager = new StateManager();