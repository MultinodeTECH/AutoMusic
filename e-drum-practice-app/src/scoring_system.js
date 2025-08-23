import { SCORING_CONFIG } from './config.js';

export class ScoringSystem {
    constructor(eventBus, totalNotes) {
        this.eventBus = eventBus;
        this.totalNotes = totalNotes;
        this.reset();

        this.onNoteHit = this.onNoteHit.bind(this);
        this.onNoteMiss = this.onNoteMiss.bind(this);
    }

    subscribeToEvents() {
        this.eventBus.subscribe('game:noteHit', this.onNoteHit);
        this.eventBus.subscribe('game:noteMiss', this.onNoteMiss);
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.judgementCounts = { perfect: 0, good: 0, miss: 0 };
        this.eventBus.publish('game:updateScore', { score: this.score, combo: this.combo });
    }

    onNoteHit({ detail: { judgement } }) {
        this.judgementCounts[judgement.toLowerCase()]++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        const basePoints = SCORING_CONFIG.POINTS[judgement.toUpperCase()] || 0;
        const comboBonus = SCORING_CONFIG.COMBO_BONUS(this.combo);
        this.score += basePoints + comboBonus;

        this.eventBus.publish('game:updateScore', { score: this.score, combo: this.combo });
    }

    onNoteMiss() {
        this.judgementCounts.miss++;
        this.combo = 0;
        this.eventBus.publish('game:updateScore', { score: this.score, combo: this.combo });
    }

    getFinalResults() {
        const totalJudged = this.judgementCounts.perfect + this.judgementCounts.good + this.judgementCounts.miss;
        const accuracy = totalJudged > 0 ? (this.judgementCounts.perfect + this.judgementCounts.good) / totalJudged : 0;

        return {
            finalScore: this.score,
            maxCombo: this.maxCombo,
            accuracy: (accuracy * 100).toFixed(2) + '%',
            perfectCount: this.judgementCounts.perfect,
            goodCount: this.judgementCounts.good,
            missCount: this.judgementCounts.miss,
        };
    }
}