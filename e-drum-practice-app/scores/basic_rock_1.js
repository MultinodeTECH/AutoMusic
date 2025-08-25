const bpm = 100;
const quarterNoteTime = 60000 / bpm;
const eighthNoteTime = quarterNoteTime / 2;
const sixteenthNoteTime = quarterNoteTime / 4;

export const songData = [
    // Bar 1
    { id: 'b1-k1', note: 36, time: 0, duration: 'quarter' },
    { id: 'b1-s1', note: 38, time: quarterNoteTime, duration: 'quarter' },
    { id: 'b1-k2', note: 36, time: 2 * quarterNoteTime, duration: 'quarter' },
    { id: 'b1-s2', note: 38, time: 3 * quarterNoteTime, duration: 'quarter' },
];