// --- Game Configuration ---
export const NOTE_SPEED = 0.1; // pixels per millisecond
export const HIT_WINDOW = 80; // milliseconds

// --- Standard Drum Notation Mapping ---
// MIDI Note: [yPosition (%), noteType, stemDirection]
// yPosition is based on standard 5-line staff positions.
export const NOTE_MAP = {
    36: [87.5, 'note', 'down'], // Kick Drum (F space below staff)
    38: [62.5, 'note', 'up'],   // Snare Drum (C space)
    40: [62.5, 'note', 'up'],   // Rimshot (Same as snare)
    41: [75, 'note', 'down'], // Floor Tom (A space)
    42: [37.5, 'cross', 'up'],  // Hi-Hat (G space above staff)
    45: [50, 'note', 'up'],   // Mid Tom (D space)
    46: [37.5, 'cross', 'up'],  // Hi-Hat Open
    48: [37.5, 'note', 'up'],   // High Tom (E space)
    49: [25, 'cross', 'up'],  // Crash Cymbal (On ledger line above staff)
    51: [25, 'cross', 'up'],  // Ride Cymbal (Same as crash)
    57: [12.5, 'cross', 'up'],  // Crash 2 (Higher ledger line)
};