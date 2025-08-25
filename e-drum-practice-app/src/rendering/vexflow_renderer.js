// Import from a CDN URL that the browser can resolve directly.
// Reverted to the bare module specifier, which is the correct way for a Vite server.
import { Factory, EasyScore, System, VexFlow } from 'vexflow';

class VexflowRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found.`);
        }
    }

    async render() {
        // Wait for fonts to load.
        await VexFlow.loadFonts('Bravura', 'Academico');
        VexFlow.setFonts('Bravura', 'Academico');

        // Clear the container
        this.container.innerHTML = '';

        const vf = new Factory({
            renderer: { elementId: 'staff-container', width: 500, height: 200 },
        });

        const score = vf.EasyScore();
        const system = vf.System();

        system
            .addStave({
                voices: [
                    score.voice(score.notes('C#5/q, B4, A4, G#4', { stem: 'up' })),
                    score.voice(score.notes('C#4/h, C#4', { stem: 'down' })),
                ],
            })
            .addClef('treble')
            .addTimeSignature('4/4');

        vf.draw();
    }
}

export const vexflowRenderer = new VexflowRenderer('staff-container');