import { domElements } from './ui.js';
import { initialize, handlePlay, handleReset, handleHit } from './app.js';

// --- Event Listeners ---
function setupEventListeners() {
    domElements.playBtn.addEventListener('click', handlePlay);
    domElements.resetBtn.addEventListener('click', handleReset);
    domElements.scoreSelect.addEventListener('change', handleReset); // Reset when score changes

    domElements.bpmSlider.addEventListener('input', () => {
        domElements.bpmValue.textContent = domElements.bpmSlider.value;
    });

    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            handleHit();
        }
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initialize();
});