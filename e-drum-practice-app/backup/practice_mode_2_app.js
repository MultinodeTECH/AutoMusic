import { MIDIService } from './midi_service.js';
import { eventBus } from './event_bus.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const statusDisplay = document.getElementById('status');
    const startButton = document.getElementById('start-button');
    const notesTrack = document.getElementById('notes-track');
    const playhead = document.getElementById('playhead');
    const scoreDisplay = document.getElementById('score');
    const comboCountDisplay = document.getElementById('combo-count');

    // --- Game State & Config ---
    let midiAccess = null;
    let gameRunning = false;
    let startTime = 0;
    let score = 0;
    let combo = 0;
    const activeNotes = new Map(); // 使用Map来管理屏幕上的音符

    const NOTE_SPEED = 0.1; // 像素/毫秒 (数值越大，速度越快)
    const HIT_WINDOW = 50; // 判定窗口 (毫秒)

    // --- Sample Song Data ---
    // time: a note's target hit time in ms from the start
    // note: MIDI note number
    // id: unique identifier
    const songData = [];
    const bpm = 120;
    const quarterNoteTime = 60000 / bpm;
    for (let i = 0; i < 16; i++) {
        songData.push({ id: `k-${i}`, note: 36, time: i * quarterNoteTime }); // 底鼓 on every beat
        songData.push({ id: `h-${i}`, note: 42, time: (i + 0.5) * quarterNoteTime }); // 踩镲 on the "and"
        if (i % 2 === 1) {
            songData.push({ id: `s-${i}`, note: 38, time: i * quarterNoteTime }); // 军鼓 on 2 and 4
        }
    }

    // --- Game Logic ---
    function startGame() {
        if (gameRunning) return;
        gameRunning = true;
        startTime = performance.now();
        score = 0;
        combo = 0;
        updateScore();
        // 清空轨道上的所有音符
        notesTrack.innerHTML = '';
        activeNotes.clear();
        // 渲染初始音符
        songData.forEach(spawnNote);
        requestAnimationFrame(gameLoop);
        startButton.textContent = "练习中...";
        startButton.disabled = true;
    }

    function spawnNote(noteData) {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.dataset.note = noteData.note;
        noteElement.dataset.time = noteData.time;
        noteElement.id = `note-${noteData.id}`;
        notesTrack.appendChild(noteElement);
        activeNotes.set(noteElement.id, noteElement);
    }

    function gameLoop(currentTime) {
        if (!gameRunning) return;

        const elapsedTime = currentTime - startTime;
        const playheadPosition = playhead.offsetLeft;

        activeNotes.forEach(noteElement => {
            const noteTime = parseFloat(noteElement.dataset.time);
            const targetPosition = playheadPosition + (noteTime - elapsedTime) * NOTE_SPEED;

            // 更新音符位置
            noteElement.style.left = `${targetPosition}px`;

            // 判定错过
            if (elapsedTime > noteTime + HIT_WINDOW && !noteElement.classList.contains('hit-success')) {
                noteElement.classList.add('missed');
                if (combo > 0) {
                    combo = 0;
                    updateScore();
                }
                // 延迟移除错过的音符
                setTimeout(() => {
                    if (activeNotes.has(noteElement.id)) {
                        noteElement.remove();
                        activeNotes.delete(noteElement.id);
                    }
                }, 500);
            }
        });

        if (activeNotes.size > 0) {
            requestAnimationFrame(gameLoop);
        } else {
            endGame();
        }
    }

    function endGame() {
        gameRunning = false;
        startButton.textContent = "重新开始";
        startButton.disabled = false;
    }

    function updateScore() {
        scoreDisplay.textContent = `Score: ${score}`;
        comboCountDisplay.textContent = combo;
    }

    // --- MIDI Handling ---
    function handleNoteOn(note, velocity) {
        // 1. 触发下方鼓件的视觉反馈
        const drumPad = document.getElementById(`pad-${note}`);
        if (drumPad) {
            drumPad.classList.add('hit');
            setTimeout(() => drumPad.classList.remove('hit'), 150);
        }

        // 2. 如果游戏正在运行，进行命中判定
        if (!gameRunning) return;

        const currentTime = performance.now();
        const elapsedTime = currentTime - startTime;
        let hitSuccess = false;

        activeNotes.forEach(noteElement => {
            if (noteElement.dataset.note == note && !noteElement.classList.contains('hit-success')) {
                const noteTime = parseFloat(noteElement.dataset.time);
                const timeDifference = Math.abs(elapsedTime - noteTime);

                if (timeDifference <= HIT_WINDOW) {
                    noteElement.classList.add('hit-success');
                    hitSuccess = true;
                    score += 100 + (combo * 10);
                    combo++;
                    // 命中后移除
                    setTimeout(() => {
                        noteElement.remove();
                        activeNotes.delete(noteElement.id);
                    }, 300);
                }
            }
        });

        if (!hitSuccess) {
            combo = 0;
        }
        updateScore();
    }

    // --- App Initialization ---
    async function init() {
        statusDisplay.textContent = '正在初始化 MIDI...';
        const midiInitialized = await MIDIService.init();

        if (midiInitialized) {
            statusDisplay.textContent = 'MIDI 已就绪，请连接您的设备。';
            const devices = MIDIService.getAvailableDevices();
            if (devices.length > 0) {
                // 自动连接找到的第一个设备
                await MIDIService.connectToDevice(devices[0].id);
            }
        } else {
            statusDisplay.textContent = 'MIDI 初始化失败，请检查浏览器设置。';
        }

        eventBus.subscribe('midi:connected', ({ deviceName }) => {
            statusDisplay.textContent = `已连接到: ${deviceName}`;
        });

        eventBus.subscribe('midi:disconnected', () => {
            statusDisplay.textContent = 'MIDI 设备已断开。';
        });

        eventBus.subscribe('midi:noteOn', ({ note, velocity }) => {
            handleNoteOn(note, velocity);
        });
    }

    // --- Entry Point ---
    startButton.addEventListener('click', startGame);
    init();
});