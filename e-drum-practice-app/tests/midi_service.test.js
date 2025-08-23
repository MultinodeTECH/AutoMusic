import { MIDIService } from '../src/midi_service.js';
import { eventBus } from '../src/event_bus.js';

// Mock the EventBus
jest.mock('../src/event_bus.js', () => ({
    eventBus: {
        publish: jest.fn(),
        subscribe: jest.fn(),
    },
}));

// Mock MIDIInput and MIDIAccess
const mockMidiInput = {
    id: 'mock-device-id',
    name: 'Mock MIDI Device',
    manufacturer: 'MockManufacturer',
    onmidimessage: null,
};

const mockMidiAccess = {
    inputs: new Map([
        [mockMidiInput.id, mockMidiInput]
    ]),
    onstatechange: null,
};

describe('MIDIService', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        global.navigator = {};
        global.navigator.requestMIDIAccess = jest.fn().mockResolvedValue(mockMidiAccess);
        MIDIService.midiAccess = null;
        MIDIService.connectedDevice = null;
        MIDIService.devices = [];
        MIDIService.connectionStatus = 'disconnected';
    });

    it('should initialize and get available devices', async () => {
        const result = await MIDIService.init();
        expect(result).toBe(true);
        expect(navigator.requestMIDIAccess).toHaveBeenCalled();
        const devices = MIDIService.getAvailableDevices();
        expect(devices).toHaveLength(1);
        expect(devices[0].name).toBe('Mock MIDI Device');
    });

    it('should connect to a device and publish midi:connected event', async () => {
        await MIDIService.init();
        await MIDIService.connectToDevice('mock-device-id');

        expect(MIDIService.connectionStatus).toBe('connected');
        expect(eventBus.publish).toHaveBeenCalledWith('midi:connected', {
            deviceId: 'mock-device-id',
            deviceName: 'Mock MIDI Device',
        });
    });

    it('should disconnect from a device and publish midi:disconnected event', async () => {
        await MIDIService.init();
        await MIDIService.connectToDevice('mock-device-id');
        MIDIService.disconnect();

        expect(MIDIService.connectionStatus).toBe('disconnected');
        expect(eventBus.publish).toHaveBeenCalledWith('midi:disconnected', {
            deviceId: 'mock-device-id'
        });
    });

    it('should handle incoming MIDI messages and publish midi:noteOn event', async () => {
        await MIDIService.init();
        await MIDIService.connectToDevice('mock-device-id');

        const midiMessageEvent = {
            data: new Uint8Array([0x90, 36, 127]), // Note On, Note 36, Velocity 127
        };

        // Directly call the onmidimessage handler
        MIDIService.connectedDevice.onmidimessage(midiMessageEvent);

        expect(eventBus.publish).toHaveBeenCalledWith('midi:noteOn', {
            note: 36,
            velocity: 127,
            type: 'noteOn',
        });
    });
});