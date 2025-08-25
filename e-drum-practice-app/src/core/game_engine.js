import * as fallingMode from '../game_modes/falling_mode_logic.js';
import * as scrollMode from '../game_modes/scroll_mode_logic.js';

class GameEngine {
    constructor() {
        this.modes = {
            falling: fallingMode,
            scroll: scrollMode,
        };
    }

    update(state, currentTime) {
        const mode = this.modes[state.gameMode];
        if (mode && typeof mode.update === 'function') {
            console.log(`GameEngine: Updating in ${state.gameMode} mode at time ${currentTime}`);
            return mode.update(state, currentTime);
        }
        return state;
    }

    // You might need to delegate other functions as well,
    // for example, handling MIDI input.
    handleNoteOn(note, state) {
        const mode = this.modes[state.gameMode];
        if (mode && typeof mode.handleNoteOn === 'function') {
            mode.handleNoteOn(note, state);
        }
    }
}

export { GameEngine };