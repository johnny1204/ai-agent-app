/**
 * Pomodoro Timer Logic
 */

// Constants
const WORK_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes in seconds

// State
let timeLeft = WORK_TIME;
let totalTime = WORK_TIME;
let timerId = null;
let isRunning = false;
let currentMode = 'work'; // 'work' or 'break'

// DOM Elements
const timerDisplay = document.getElementById('timer-display');
const timerStatus = document.getElementById('timer-status');
const progressRing = document.getElementById('progress-ring');
const btnToggle = document.getElementById('btn-toggle');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const btnReset = document.getElementById('btn-reset');
const btnSkip = document.getElementById('btn-skip');
const btnWork = document.getElementById('btn-work');
const btnBreak = document.getElementById('btn-break');
const tabHighlight = document.getElementById('tab-highlight');
const bgBlob = document.getElementById('bg-blob');
const soundComplete = document.getElementById('sound-complete');

// Sound Fallback (Simple Beep) if Audio fails or is blocked
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
function playBeep() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Initialization
function init() {
    updateDisplay();
    updateProgress();
    setupEventListeners();
}

function setupEventListeners() {
    btnToggle.addEventListener('click', toggleTimer);
    btnReset.addEventListener('click', resetTimer);
    btnSkip.addEventListener('click', skipTimer);
}

// Timer Logic
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (isRunning) return;

    isRunning = true;
    updateControls();
    timerStatus.innerText = currentMode === 'work' ? 'FOCUS' : 'RELAX';

    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        updateProgress();

        if (timeLeft <= 0) {
            completeTimer();
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;

    isRunning = false;
    clearInterval(timerId);
    updateControls();
    timerStatus.innerText = 'PAUSED';
}

function resetTimer() {
    pauseTimer();
    timeLeft = totalTime;
    updateDisplay();
    updateProgress();
    timerStatus.innerText = 'READY';
}

function skipTimer() {
    // Switch directly to the other mode
    switchMode(currentMode === 'work' ? 'break' : 'work');
}

function completeTimer() {
    pauseTimer();
    timeLeft = 0;
    updateDisplay();
    updateProgress();

    // Play sound
    try {
        soundComplete.currentTime = 0;
        soundComplete.play().catch(e => {
            console.warn("Audio play failed, using fallback beep", e);
            playBeep();
        });
    } catch (e) {
        playBeep();
    }

    // Determine next mode automatically? Or just stop?
    // Let's stop and let user decide, but maybe switch the UI to suggest next
    toggleModeUI(currentMode === 'work' ? 'break' : 'work');
    timerStatus.innerText = 'COMPLETED';
}

// Mode Switching
window.switchMode = function (mode) {
    pauseTimer();
    currentMode = mode;

    if (mode === 'work') {
        totalTime = WORK_TIME;
        timeLeft = totalTime;
        toggleModeUI('work');
    } else {
        totalTime = BREAK_TIME;
        timeLeft = totalTime;
        toggleModeUI('break');
    }

    updateDisplay();
    updateProgress();
    timerStatus.innerText = 'READY';
}

function toggleModeUI(mode) {
    if (mode === 'work') {
        // Tab UI
        tabHighlight.style.left = '4px';
        btnWork.classList.add('text-white');
        btnWork.classList.remove('text-slate-400');
        btnBreak.classList.add('text-slate-400');
        btnBreak.classList.remove('text-white');

        // Colors
        document.documentElement.style.setProperty('--target-color', '#FF6B6B');
        progressRing.classList.remove('text-teal-400');
        progressRing.classList.add('text-pomodoro-red');

        bgBlob.classList.remove('bg-teal-500/20');
        bgBlob.classList.add('bg-pomodoro-red/20');
    } else {
        // Tab UI
        tabHighlight.style.left = 'calc(50% + 4px)';
        btnWork.classList.add('text-slate-400');
        btnWork.classList.remove('text-white');
        btnBreak.classList.add('text-white');
        btnBreak.classList.remove('text-slate-400');

        // Colors
        document.documentElement.style.setProperty('--target-color', '#4ECDC4');
        progressRing.classList.remove('text-pomodoro-red');
        progressRing.classList.add('text-teal-400'); // Using tailwind teal for green

        bgBlob.classList.remove('bg-pomodoro-red/20');
        bgBlob.classList.add('bg-teal-500/20');
    }
}

// Display Updates
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    timerDisplay.innerText = formatted;
    document.title = `${formatted} | ${currentMode === 'work' ? 'Work' : 'Break'} - Day 12`;
}

function updateProgress() {
    // Circumference of circle with r=45 is 2 * PI * 45 ≈ 282.743
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (timeLeft / totalTime) * circumference;

    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
    progressRing.style.strokeDashoffset = offset;
}

function updateControls() {
    if (isRunning) {
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        btnToggle.classList.add('bg-slate-200'); // Slightly dimmer when pausing
        btnToggle.classList.remove('bg-slate-100');
    } else {
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        btnToggle.classList.add('bg-slate-100');
        btnToggle.classList.remove('bg-slate-200');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
