import { eventBus } from '../event_bus.js';

const UIView = {
    // DOM Element Cache
    elements: {
        midiStatus: null,
        connectBtn: null,
        midiDevices: null,
        drumPads: null,
        startGameBtn: null,
    },

    /**
     * Initializes the UI View module.
     */
    init() {
        this.cacheDOMElements();
        this.subscribeToEvents();
        this.addEventListeners();
    },

    /**
     * Caches references to key DOM elements.
     */
    cacheDOMElements() {
        this.elements.midiStatus = document.getElementById('midi-status');
        this.elements.connectBtn = document.getElementById('connect-btn');
        this.elements.midiDevices = document.getElementById('midi-devices');
        this.elements.drumPads = document.querySelectorAll('.drum-pad');
        this.elements.startGameBtn = document.getElementById('start-game-btn');
    },

    /**
     * Adds event listeners to DOM elements.
     */
    addEventListeners() {
        this.elements.connectBtn.addEventListener('click', () => {
            const selectedDeviceId = this.elements.midiDevices.value;
            if (selectedDeviceId) {
                eventBus.publish('ui:connect', selectedDeviceId);
            }
        });

        this.elements.startGameBtn.addEventListener('click', () => {
            eventBus.publish('ui:startGame');
        });
    },

    /**
     * Subscribes to events from the EventBus.
     */
    subscribeToEvents() {
        eventBus.subscribe('midi:connected', (data) => this.onMidiConnected(data));
        eventBus.subscribe('midi:disconnected', () => this.onMidiDisconnected());
        eventBus.subscribe('midi:noteOn', (data) => this.onMidiNoteOn(data));
    },

    /**
     * Handles the 'midi:connected' event.
     * @param {object} data - The connection data.
     * @param {string} data.deviceName - The name of the connected MIDI device.
     */
    onMidiConnected({ deviceName }) {
        this.elements.midiStatus.textContent = `Connected: ${deviceName}`;
        this.elements.connectBtn.textContent = 'Disconnect';
        this.elements.startGameBtn.style.display = 'block';
    },

    /**
     * Handles the 'midi:disconnected' event.
     */
    onMidiDisconnected() {
        this.elements.midiStatus.textContent = 'Status: Disconnected';
        this.elements.connectBtn.textContent = 'Connect to E-Drum';
    },

    /**
     * Handles the 'midi:noteOn' event to trigger a visual animation.
     * @param {object} data - The event data.
     * @param {number} data.note - The MIDI note number.
     */
    onMidiNoteOn({ note }) {
        const pad = document.querySelector(`.drum-pad[data-note="${note}"]`);
        if (pad) {
            pad.classList.add('pad-hit');
            setTimeout(() => {
                pad.classList.remove('pad-hit');
            }, 100); // Remove the highlight after 100ms
        }
    },

    /**
     * Updates the MIDI device list in the UI.
     * @param {Array<object>} devices - An array of MIDI device objects.
     */
    updateDeviceList(devices) {
        this.elements.midiDevices.innerHTML = '';
        if (devices.length > 0) {
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.textContent = device.name;
                this.elements.midiDevices.appendChild(option);
            });
            this.elements.midiDevices.disabled = false;
            this.elements.connectBtn.disabled = false;
        } else {
            const option = document.createElement('option');
            option.textContent = 'No MIDI devices found';
            this.elements.midiDevices.appendChild(option);
            this.elements.midiDevices.disabled = true;
            this.elements.connectBtn.disabled = true;
        }
    }
};

export default UIView;