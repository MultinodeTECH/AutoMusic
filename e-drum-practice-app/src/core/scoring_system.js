// Scoring logic is now stateless.
// It calculates new scores based on current state and returns the new state.

const SCORE_VALUES = {
    perfect: 100,
    good: 50,
    ok: 10,
    miss: 0,
};

const COMBO_BONUS = 10;

/**
 * Calculates the new score and combo based on a hit or miss.
 * @param {number} currentScore - The current total score.
 * @param {number} currentCombo - The current combo count.
 * @param {string} hitType - The type of hit ('perfect', 'good', 'ok', 'miss').
 * @returns {{newScore: number, newCombo: number}} - An object with the new score and combo.
 */
export function calculateScore(currentScore, currentCombo, hitType) {
    if (hitType === 'miss') {
        return {
            newScore: currentScore,
            newCombo: 0,
        };
    }

    const newCombo = currentCombo + 1;
    const baseScore = SCORE_VALUES[hitType] || 0;
    const comboBonus = (newCombo > 1) ? (newCombo * COMBO_BONUS) : 0;
    const newScore = currentScore + baseScore + comboBonus;

    return { newScore, newCombo };
}

/**
 * Resets the score and combo.
 * In a stateless system, this just returns the initial state.
 * @returns {{score: number, combo: number}}
 */
export function resetScore() {
    return { score: 0, combo: 0 };
}