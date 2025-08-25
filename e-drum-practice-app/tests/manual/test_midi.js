document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const devicesList = document.getElementById('midi-devices');

    if (!navigator.requestMIDIAccess) {
        statusElement.textContent = 'Web MIDI API is not supported in this browser.';
        console.error('Web MIDI API is not supported in this browser.');
        return;
    }

    navigator.requestMIDIAccess()
        .then(onMIDISuccess, onMIDIFailure);

    function onMIDISuccess(midiAccess) {
        statusElement.textContent = 'MIDI service initialized successfully.';
        console.log('MIDI Access Object:', midiAccess);

        // Listen for state changes
        midiAccess.onstatechange = (event) => {
            console.log('MIDI state changed:', event.port);
            updateDeviceList();
        };

        const updateDeviceList = () => {
            devicesList.innerHTML = ''; // Clear the list
            const inputs = midiAccess.inputs.values();
            let deviceFound = false;

            for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                const midiInput = input.value;
                const listItem = document.createElement('li');
                listItem.textContent = `ID: ${midiInput.id}, Name: ${midiInput.name}, State: ${midiInput.state}, Connection: ${midiInput.connection}`;
                devicesList.appendChild(listItem);
                deviceFound = true;

                // Log messages from this device
                midiInput.onmidimessage = (message) => {
                    console.log(`MIDI Message from ${midiInput.name}:`, message.data);
                };
            }

            if (deviceFound) {
                statusElement.textContent = 'MIDI devices found. See list below.';
            } else {
                statusElement.textContent = 'No MIDI input devices found. Waiting for connection...';
            }
        };

        updateDeviceList();
    }

    function onMIDIFailure(msg) {
        statusElement.textContent = `Failed to get MIDI access - ${msg}`;
        console.error(`Failed to get MIDI access - ${msg}`);
    }
});