import { scoreDisplay, comboCountDisplay, startButton, statusDisplay, drumPads } from './dom_elements.js';
import { stateManager } from '../core/state_manager.js';

/**
 * Updates the score and combo display on the screen.
 */
export function updateScoreDisplay() {
    const state = stateManager.getState();
    scoreDisplay.textContent = `Score: ${state.score || 0}`;
    comboCountDisplay.textContent = state.combo || 0;
}

/**
 * Sets the start button to its "in-progress" state.
 */
export function setGameInProgressUI() {
    startButton.textContent = "练习中...";
    startButton.disabled = true;
}

/**
 * Resets the start button to its initial state, allowing the game to be started again.
 */
export function setGameEndedUI() {
    startButton.textContent = "重新开始";
    startButton.disabled = false;
}

/**
 * Updates the status text display.
 * @param {string} text - The message to display.
 * @param {boolean} isError - If true, displays the text in an error color.
 */
export function updateStatusDisplay(text, isError = false) {
    statusDisplay.textContent = text;
    statusDisplay.style.color = isError ? '#ef4444' : '#facc15';
}

/**
 * Triggers a visual "hit" effect on a specific drum pad.
 * @param {number} note - The MIDI note number of the pad to activate.
 */
export function triggerPadHitEffect(note) {
    const drumPad = drumPads[note];
    if (drumPad) {
        drumPad.classList.add('hit');
        setTimeout(() => drumPad.classList.remove('hit'), 150);
    }
}