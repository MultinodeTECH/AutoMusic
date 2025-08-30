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
   // Now expects stats.score to be the average accuracy
   domElements.scoreDisplay.textContent = `${stats.score}%`;
}

export function showResults(stats) {
    domElements.totalNotesEl.textContent = stats.totalNotes;
    domElements.hitsEl.textContent = stats.hits;
    domElements.missesEl.textContent = stats.misses;
    domElements.extrasEl.textContent = stats.extras;
    domElements.accuracyEl.textContent = `${Math.round(stats.averageAccuracy)}%`;
    domElements.resultsSummary.style.display = 'block';
}

export function showFeedback(text, color) {
    const feedbackContainer = document.getElementById('feedback-container');
    if (feedbackContainer) {
        feedbackContainer.textContent = text;
        feedbackContainer.style.color = color;
        feedbackContainer.classList.add('show');
        setTimeout(() => {
            feedbackContainer.classList.remove('show');
        }, 500);
    }
}