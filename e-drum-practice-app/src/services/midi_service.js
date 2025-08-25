import { updateStatusDisplay } from '../ui/ui_controller.js';

let onNoteOnCallback = null;

/**
 * Sets the callback function to be invoked when a MIDI note-on message is received.
 * @param {function(number, number): void} callback - The function to call with (note, velocity).
 */
export function setOnNoteOn(callback) {
    onNoteOnCallback = callback;
}

function updateDevices(access) {
    const inputs = access.inputs.values();
    let connected = false;

    console.log('Searching for MIDI input devices...');
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        console.log('Found MIDI device:', input.value.name);
        input.value.onmidimessage = getMIDIMessage;
        updateStatusDisplay(`已连接到: ${input.value.name}`);
        connected = true;
    }

    if (!connected) {
        console.warn('No MIDI input devices found.');
        updateStatusDisplay('未找到 MIDI 输入设备。');
    }
}

function onMIDISuccess(access) {
    console.log('MIDI access successful. Access object:', access);
    updateStatusDisplay('MIDI 设备已准备就绪！');

    // Initial device scan
    updateDevices(access);

    // Listen for state changes
    access.onstatechange = (event) => {
        console.log('MIDI state changed:', event);
        updateStatusDisplay(`MIDI 设备状态改变: ${event.port.name} is ${event.port.state}`);
        updateDevices(access); // Re-scan devices
    };
}

function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
    updateStatusDisplay(`MIDI 初始化失败: ${msg}`, true);
}

function getMIDIMessage(message) {
    const [command, note, velocity] = message.data;
    // command 144 = note on
    if (command === 144 && velocity > 0 && onNoteOnCallback) {
        onNoteOnCallback(note, velocity);
    }
}

/**
 * Initializes the Web MIDI API and sets up listeners.
 */
export function initMidi() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
        updateStatusDisplay('您的浏览器不支持 Web MIDI API。', true);
    }
}