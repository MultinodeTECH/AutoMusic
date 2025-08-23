import { eventBus } from './event_bus.js';

/**
 * @fileoverview MIDI Service for handling Web MIDI API interactions.
 */

const MIDIService = {
    midiAccess: null,
    connectedDevice: null,
    devices: [],
    connectionStatus: 'disconnected',

    /**
     * Initializes the service. Must be called first, typically in response to a user action.
     * @returns {Promise<boolean>} A promise that resolves to true if MIDI access is granted, false otherwise.
     */
    async init() {
        if (!navigator.requestMIDIAccess) {
            console.error('Web MIDI API is not supported in this browser.');
            return false;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.midiAccess.onstatechange = this._onStateChange.bind(this);
            this._updateDevices();
            return true;
        } catch (error) {
            console.error('Could not access MIDI devices.', error);
            return false;
        }
    },

    /**
     * Gets a list of available MIDI input devices.
     * @returns {Array<{id: string, name: string}>} An array of device objects.
     */
    getAvailableDevices() {
        return this.devices;
    },

    /**
     * Connects to a specific MIDI device by its ID.
     * @param {string} deviceId - The ID of the device to connect to.
     * @returns {Promise<boolean>} A promise that resolves to true on successful connection, false otherwise.
     */
    async connectToDevice(deviceId) {
        if (this.connectedDevice) {
            this.disconnect();
        }

        const device = this.midiAccess.inputs.get(deviceId);
        if (!device) {
            console.error(`Device with ID ${deviceId} not found.`);
            return false;
        }

        this.connectionStatus = 'connecting';
        eventBus.publish('midi:connecting', { deviceId });

        this.connectedDevice = device;
        this.connectedDevice.onmidimessage = this._onMIDIMessage.bind(this);

        this.connectionStatus = 'connected';
        eventBus.publish('midi:connected', { deviceId: this.connectedDevice.id, deviceName: this.connectedDevice.name });

        return true;
    },

    /**
     * Disconnects from the currently connected device.
     */
    disconnect() {
        if (this.connectedDevice) {
            this.connectedDevice.onmidimessage = null;
            const deviceId = this.connectedDevice.id;
            this.connectedDevice = null;
            this.connectionStatus = 'disconnected';
            eventBus.publish('midi:disconnected', { deviceId });
        }
    },

    /**
     * Private method to handle MIDI messages.
     * @param {MIDIMessageEvent} event
     */
    _onMIDIMessage(event) {
        const [command, note, velocity] = event.data;
        // Note On command
        if (command >= 0x90 && command <= 0x9F && velocity > 0) {
            eventBus.publish('midi:noteOn', {
                note,
                velocity,
                type: 'noteOn'
            });
        }
    },

    /**
     * Private method to handle MIDI device state changes.
     */
    _onStateChange() {
        this._updateDevices();
    },

    /**
     * Private method to update the list of available devices.
     */
    _updateDevices() {
        this.devices = [];
        if (this.midiAccess) {
            this.midiAccess.inputs.forEach(input => {
                this.devices.push({ id: input.id, name: input.name });
            });
        }
    }
};

export { MIDIService };