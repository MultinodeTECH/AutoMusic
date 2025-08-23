import UIView from './ui_view.js';
import { MIDIService } from './midi_service.js';
import { eventBus } from './event_bus.js';
import { ScoreLoader } from './score_loader.js';
import { GameEngine } from './game_engine.js';
import { ScoringSystem } from './scoring_system.js';
import { Renderer } from './renderer.js';

document.addEventListener('DOMContentLoaded', async () => {
    UIView.init();

    const midiInitialized = await MIDIService.init();
    const LAST_DEVICE_ID_KEY = 'eDrumPracticeApp.lastConnectedDeviceId';

    if (midiInitialized) {
        const devices = MIDIService.getAvailableDevices();
        UIView.updateDeviceList(devices);

        // Attempt to auto-connect to the last used device
        const lastDeviceId = localStorage.getItem(LAST_DEVICE_ID_KEY);
        if (lastDeviceId && devices.some(d => d.id === lastDeviceId)) {
            await MIDIService.connectToDevice(lastDeviceId);
        }
    }

    // Handle manual connect button clicks
    eventBus.subscribe('ui:connect', async (deviceId) => {
        await MIDIService.connectToDevice(deviceId);
    });

    // Save the device ID on successful connection
    eventBus.subscribe('midi:connected', ({ deviceId }) => {
        localStorage.setItem(LAST_DEVICE_ID_KEY, deviceId);
    });

    // Load the score and initialize the game
    const scoreLoader = new ScoreLoader();
    const scoreData = await scoreLoader.loadScore('scores/funky_beat.json');

    const gameEngine = new GameEngine(scoreData, eventBus);
    const scoringSystem = new ScoringSystem(eventBus, scoreData.notes.length);
    const renderer = new Renderer(document.getElementById('renderer-area'), gameEngine);

    // Modify the game engine's update loop to include rendering
    const originalUpdate = gameEngine.update.bind(gameEngine);
    gameEngine.update = (timestamp) => {
        originalUpdate(timestamp);
        renderer.update();
    };

    eventBus.subscribe('ui:startGame', () => {
        gameEngine.start();
        scoringSystem.subscribeToEvents();
        document.getElementById('start-game-btn').style.display = 'none';
    });
});