import { NOTE_MAP } from '../config.js';
import { notesTrack } from '../ui/dom_elements.js';

/**
 * Creates an SVG element representing a musical note based on its data.
 * @param {object} noteData - The data for the note to be rendered.
 * @returns {SVGSVGElement | null} The SVG element for the note, or null if mapping is not found.
 */
function createNoteSVG(noteData) {
    const mapping = NOTE_MAP[noteData.note];
    if (!mapping) return null;

    const [yPos, noteType, stemDir] = mapping;
    const duration = noteData.duration;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute('class', 'note-svg');
    svg.setAttribute('viewBox', '0 0 40 100');

    const headY = 50;
    const headX = 20;

    // Draw Note Head
    if (noteType === 'cross') {
        const line1 = document.createElementNS(svgNS, 'line');
        line1.setAttribute('x1', headX - 5); line1.setAttribute('y1', headY - 5);
        line1.setAttribute('x2', headX + 5); line1.setAttribute('y2', headY + 5);
        line1.setAttribute('class', 'note-cross');
        svg.appendChild(line1);
        const line2 = document.createElementNS(svgNS, 'line');
        line2.setAttribute('x1', headX - 5); line2.setAttribute('y1', headY + 5);
        line2.setAttribute('x2', headX + 5); line2.setAttribute('y2', headY - 5);
        line2.setAttribute('class', 'note-cross');
        svg.appendChild(line2);
    } else { // 'note'
        const head = document.createElementNS(svgNS, "ellipse");
        head.setAttribute("cx", headX); head.setAttribute("cy", headY);
        head.setAttribute("rx", 6); head.setAttribute("ry", 4.5);
        head.setAttribute('transform', `rotate(-20 ${headX} ${headY})`);
        head.setAttribute("class", "note-head");
        svg.appendChild(head);
    }

    // Draw Stem and Flags based on duration
    const stem = document.createElementNS(svgNS, "line");
    stem.setAttribute('class', 'note-stem');
    const stemX = stemDir === 'up' ? headX + 5 : headX - 5;
    const stemY1 = headY;
    const stemY2 = stemDir === 'up' ? headY - 35 : headY + 35;
    stem.setAttribute('x1', stemX); stem.setAttribute('y1', stemY1);
    stem.setAttribute('x2', stemX); stem.setAttribute('y2', stemY2);
    svg.appendChild(stem);

    const drawFlag = (yOffset) => {
        const flag = document.createElementNS(svgNS, 'path');
        const path = stemDir === 'up'
            ? `M ${stemX} ${stemY2 + yOffset} C ${stemX + 10} ${stemY2 + 10 + yOffset}, ${stemX + 20} ${stemY2 + 5 + yOffset}, ${stemX + 10} ${stemY2 + 20 + yOffset}`
            : `M ${stemX} ${stemY2 - yOffset} C ${stemX - 10} ${stemY2 - 10 - yOffset}, ${stemX - 20} ${stemY2 - 5 - yOffset}, ${stemX - 10} ${stemY2 - 20 - yOffset}`;
        flag.setAttribute('d', path);
        flag.setAttribute('class', 'note-flag');
        svg.appendChild(flag);
    };

    if (duration === '8th') {
        drawFlag(0);
    } else if (duration === '16th') {
        drawFlag(0);
        drawFlag(stemDir === 'up' ? 8 : -8);
    }

    return svg;
}

/**
 * Creates and appends a note container to the notes track.
 * @param {object} noteData - The data for the note to be spawned.
 * @returns {HTMLElement | null} The created note container element, or null if mapping is not found.
 */
export function spawnNote(noteData) {
    const mapping = NOTE_MAP[noteData.note];
    if (!mapping) return null;

    const container = document.createElement('div');
    container.classList.add('note-container');
    container.dataset.note = noteData.note;
    container.dataset.time = noteData.time;
    container.id = `note-${noteData.id}`;
    container.style.top = `calc(${mapping[0]}% - 50px)`; // Center SVG vertically

    const svgElement = createNoteSVG(noteData);
    if (svgElement) {
        container.appendChild(svgElement);
        notesTrack.appendChild(container);
        return container;
    }
    return null;
}

/**
 * Updates the position of a note container based on elapsed time.
 * @param {HTMLElement} noteContainer - The note element to update.
 * @param {number} elapsedTime - The total time elapsed since the game started.
 * @param {number} playheadPosition - The current pixel position of the playhead.
 * @param {number} noteSpeed - The speed at which notes travel.
 */
export function updateNotePosition(noteContainer, elapsedTime, playheadPosition, noteSpeed) {
    const noteTime = parseFloat(noteContainer.dataset.time);
    const targetPosition = playheadPosition + (noteTime - elapsedTime) * noteSpeed;
    noteContainer.style.left = `${targetPosition}px`;
}

/**
 * Applies a "hit" effect to a note and removes it after a delay.
 * @param {HTMLElement} noteContainer - The note element to apply the effect to.
 */
export function applyHitEffect(noteContainer) {
    noteContainer.classList.add('hit-success');
    setTimeout(() => {
        noteContainer.remove();
    }, 300);
}

/**
 * Applies a "missed" effect to a note and removes it after a delay.
 * @param {HTMLElement} noteContainer - The note element to apply the effect to.
 */
export function applyMissEffect(noteContainer) {
    noteContainer.classList.add('missed');
    setTimeout(() => {
        noteContainer.remove();
    }, 500);
}