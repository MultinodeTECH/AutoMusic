export const domElements = {
    playBtn: document.getElementById('playBtn'),
    resetBtn: document.getElementById('resetBtn'),
    scoreSelect: document.getElementById('score-select'),
    bpmSlider: document.getElementById('bpm-slider'),
    bpmValue: document.getElementById('bpm-value'),
    targetContainer: document.getElementById('osmd-target-container'),
    userContainer: document.getElementById('osmd-user-container'),
    scoreDisplay: document.getElementById('score-display'),
    resultsSummary: document.getElementById('results-summary'),
    totalNotesEl: document.getElementById('total-notes'),
    hitsEl: document.getElementById('hits'),
    missesEl: document.getElementById('misses'),
    extrasEl: document.getElementById('extras'),
    accuracyEl: document.getElementById('accuracy'),
};

export function updateScore(stats) {
    domElements.scoreDisplay.textContent = stats.score;
}

export function showResults(stats) {
    domElements.totalNotesEl.textContent = stats.totalNotes;
    domElements.hitsEl.textContent = stats.hits;
    domElements.missesEl.textContent = stats.misses;
    domElements.extrasEl.textContent = stats.extras;
    const accuracy = stats.totalNotes > 0 ? (stats.hits / stats.totalNotes) * 100 : 0;
    domElements.accuracyEl.textContent = `${accuracy.toFixed(1)}%`;
    domElements.resultsSummary.style.display = 'block';
}