let timerInterval;
let totalSeconds = 0;
let isRunning = false;

const display = document.getElementById('display');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');

function updateDisplay() {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
    if (isRunning) return;

    if (totalSeconds === 0) {
        const mins = parseInt(minutesInput.value) || 0;
        const secs = parseInt(secondsInput.value) || 0;
        totalSeconds = mins * 60 + secs;

        if (totalSeconds <= 0) {
            alert('時間を設定してください');
            return;
        }
    }

    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    minutesInput.disabled = true;
    secondsInput.disabled = true;

    updateDisplay();

    timerInterval = setInterval(() => {
        if (totalSeconds > 0) {
            totalSeconds--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            minutesInput.disabled = false;
            secondsInput.disabled = false;
            alert('時間です！');
        }
    }, 1000);
}

function stopTimer() {
    if (!isRunning) return;

    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

function resetTimer() {
    stopTimer();
    totalSeconds = 0;
    updateDisplay();
    minutesInput.value = '';
    secondsInput.value = '';
    minutesInput.disabled = false;
    secondsInput.disabled = false;
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);
