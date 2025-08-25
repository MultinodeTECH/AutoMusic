// A temporary mapping until it's centralized in config.js
const MIDI_TO_DRUM_MAP = {
    36: 'c/4', // Kick
    38: 'e/4', // Snare
    42: 'g/5', // Hi-Hat Closed
    46: 'g/5', // Hi-Hat Open
    49: 'a/5', // Crash
    51: 'b/5', // Ride
};


export function getInitialState() {
    return {
        scrollPositionX: 0,
        score: 0,
        notes: [], // Will be populated with { id, x, y, keys, duration, isHit, isMissed }
        hitEffects: [],
        lastTime: 0,
    };
}

export function onStart(state) {
    return { ...state, lastTime: performance.now() };
}

export function onStop(state) {
    return { ...state };
}


export function update(state, currentTime, actions) {
    const newState = { ...state };

    if (newState.gameRunning) {
        if (!newState.lastTime) newState.lastTime = currentTime;
        const deltaTime = (currentTime - newState.lastTime) / 1000; // seconds

        // --- 1. Scroll the score ---
        const scrollSpeed = 50; // pixels per second
        newState.scrollPositionX += scrollSpeed * deltaTime;

        // --- 2. Process incoming MIDI actions for hit detection ---
        const hitLineX = 800 / 4; // Assuming canvas width is 800, should come from config
        const hitWindow = 20; // pixels on either side of the hit line

        actions.forEach(action => {
            if (action.type === 'NOTE_ON') {
                const noteNumber = action.payload.note;
                const expectedKey = MIDI_TO_DRUM_MAP[noteNumber];

                if (expectedKey) {
                    // Find a corresponding note in the score that is near the hit line
                    const noteToHit = newState.notes.find(note => {
                        if (note.isHit || note.isMissed) return false;

                        const noteCurrentX = note.x - newState.scrollPositionX;
                        const isKeyMatch = note.keys.includes(expectedKey);
                        const isInHitWindow = Math.abs(noteCurrentX - hitLineX) < hitWindow;

                        return isKeyMatch && isInHitWindow;
                    });

                    if (noteToHit) {
                        noteToHit.isHit = true;
                        newState.score += 100;

                        // Add a visual effect for the hit
                        newState.hitEffects.push({
                            x: hitLineX,
                            y: noteToHit.y, // Use the note's Y position for the effect
                            startTime: Date.now(),
                            duration: 300,
                            startRadius: 10,
                            maxRadius: 50,
                        });
                    }
                }
            }
        });


        // --- 3. Check for missed notes ---
        const missThreshold = hitLineX - hitWindow; // Notes that have passed the hit window
        newState.notes.forEach(note => {
            if (!note.isHit && !note.isMissed) {
                const noteCurrentX = note.x - newState.scrollPositionX;
                if (noteCurrentX < missThreshold) {
                    note.isMissed = true;
                    // Optional: Penalize score for missed notes
                    // newState.score -= 50;
                }
            }
        });
    }

    newState.lastTime = currentTime;
    return newState;
}