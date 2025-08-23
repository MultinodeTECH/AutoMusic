document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('status-text');
    const statusLight = document.getElementById('status-light');
    const startBtn = document.getElementById('start-btn');
    const guideBall = document.getElementById('guide-ball');
    const feedbackText = document.getElementById('feedback-text');

    let midiAccess = null;
    let activeInput = null;
    let gameRunning = false;
    let currentStep = 0;
    let sequenceTimeout;

    const song = [
        { note: 36, duration: 500 }, { note: 42, duration: 500 },
        { note: 38, duration: 500 }, { note: 42, duration: 500 },
        { note: 36, duration: 500 }, { note: 42, duration: 500 },
        { note: 38, duration: 500 }, { note: 49, duration: 500 },
    ];

    function setDrumLayout() {
        const layout = {
            'pad-36': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }, // Kick
            'pad-38': { top: '300px', left: '250px' }, // Snare
            'pad-42': { top: '150px', left: '80px' }, // Hi-Hat
            'pad-48': { top: '180px', left: '400px' }, // Tom 1
            'pad-45': { top: '180px', left: '550px' }, // Tom 2
            'pad-41': { top: '300px', right: '80px' }, // Floor Tom
            'pad-49': { top: '20px', left: '220px' }, // Crash
            'pad-51': { top: '20px', right: '150px' }, // Ride
        };

        for (const id in layout) {
            const pad = document.getElementById(id);
            if (pad) {
                Object.assign(pad.style, layout[id]);
            }
        }
    }

    function updateDeviceStatus(connected, deviceName = '') {
        if (connected) {
            statusLight.classList.remove('disconnected');
            statusLight.classList.add('connected');
            statusText.textContent = deviceName;
            startBtn.disabled = false;
        } else {
            statusLight.classList.remove('connected');
            statusLight.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
            startBtn.disabled = true;
        }
    }

    function showFeedback(text, good = true) {
        feedbackText.textContent = text;
        feedbackText.style.color = good ? '#22c55e' : '#ef4444';
        feedbackText.classList.remove('opacity-0');
        setTimeout(() => feedbackText.classList.add('opacity-0'), 500);
    }

    function moveGuideBall(targetPad) {
        if (!targetPad) return;
        guideBall.style.left = `${targetPad.offsetLeft + targetPad.offsetWidth / 2 - guideBall.offsetWidth / 2}px`;
        guideBall.style.top = `${targetPad.offsetTop + targetPad.offsetHeight / 2 - guideBall.offsetHeight / 2}px`;
    }

    function playNextStep() {
        if (!gameRunning || currentStep >= song.length) {
            endGame();
            return;
        }
        const step = song[currentStep];
        const targetPad = document.getElementById(`pad-${step.note}`);
        moveGuideBall(targetPad);
        sequenceTimeout = setTimeout(playNextStep, step.duration);
    }

    function startGame() {
        if (gameRunning) return;
        gameRunning = true;
        currentStep = 0;
        startBtn.textContent = 'Stop';
        guideBall.classList.remove('hidden');
        showFeedback('开始!', true);
        playNextStep();
    }

    function endGame() {
        gameRunning = false;
        clearTimeout(sequenceTimeout);
        startBtn.textContent = 'Start';
        guideBall.classList.add('hidden');
        showFeedback('练习结束!', true);
    }

    function onMidiMessage(event) {
        const [command, note, velocity] = event.data;
        if (command === 144 && velocity > 0) {
            const hitPad = document.querySelector(`.drum-pad[data-note="${note}"]`);
            if (hitPad) {
                hitPad.classList.add('hit');
                setTimeout(() => hitPad.classList.remove('hit'), 150);
                if (gameRunning) {
                    const expectedNote = song[currentStep].note;
                    if (note === expectedNote) {
                        showFeedback('准确!', true);
                        currentStep++;
                        clearTimeout(sequenceTimeout);
                        playNextStep();
                    } else {
                        showFeedback('打错了!', false);
                    }
                }
            }
        }
    }

    function onMidiSuccess(access) {
        midiAccess = access;
        const inputs = midiAccess.inputs.values();
        let deviceFound = false;
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            activeInput = input.value;
            updateDeviceStatus(true, activeInput.name);
            activeInput.onmidimessage = onMidiMessage;
            deviceFound = true;
            break;
        }
        if (!deviceFound) updateDeviceStatus(false);

        midiAccess.onstatechange = (event) => {
            if (event.port.type === 'input' && event.port.state === 'connected' && !activeInput) {
                activeInput = event.port;
                updateDeviceStatus(true, activeInput.name);
                activeInput.onmidimessage = onMidiMessage;
            } else if (event.port.type === 'input' && event.port.state === 'disconnected' && activeInput && activeInput.id === event.port.id) {
                activeInput = null;
                updateDeviceStatus(false);
            }
        };
    }

    function onMidiFailure() {
        updateDeviceStatus(false);
        statusText.textContent = 'MIDI 访问失败';
    }

    function setupMidi() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMidiSuccess, onMidiFailure);
        } else {
            updateDeviceStatus(false);
            statusText.textContent = '浏览器不支持 Web MIDI';
        }
    }

    setDrumLayout();
    startBtn.addEventListener('click', () => gameRunning ? endGame() : startGame());
    setupMidi();
});