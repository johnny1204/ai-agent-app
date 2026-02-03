document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const resultContainer = document.getElementById('result-container');
    const bmiValueEl = document.getElementById('bmi-value');
    const bmiStatusEl = document.getElementById('bmi-status');
    const healthyRangeEl = document.getElementById('healthy-range');
    const statusGlow = document.getElementById('status-glow');

    function calculateBMI() {
        const heightCm = parseFloat(heightInput.value);
        const weightKg = parseFloat(weightInput.value);

        if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
            alert('身長と体重を正しく入力してください');
            return;
        }

        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        const formattedBMI = bmi.toFixed(1);

        displayResult(bmi, heightM);
    }

    function displayResult(bmi, heightM) {
        // Show container
        resultContainer.classList.remove('hidden');
        // Small delay to allow 'display: block' to apply before adding opacity class for transition
        setTimeout(() => {
            resultContainer.classList.remove('opacity-0', 'translate-y-4');
        }, 10);

        // Animate numbers
        animateValue(bmiValueEl, 0, bmi, 1000);

        // Determine Status
        let status = '';
        let colorClass = '';
        let glowColor = '';

        if (bmi < 18.5) {
            status = '低体重 (Underweight)';
            colorClass = 'from-blue-300 to-cyan-300';
            glowColor = 'bg-blue-500';
        } else if (bmi >= 18.5 && bmi < 25) {
            status = '普通体重 (Normal)';
            colorClass = 'from-emerald-300 to-green-300';
            glowColor = 'bg-emerald-500';
        } else if (bmi >= 25 && bmi < 30) {
            status = '過体重 (Overweight)';
            colorClass = 'from-yellow-300 to-orange-300';
            glowColor = 'bg-yellow-500';
        } else {
            status = '肥満 (Obese)';
            colorClass = 'from-rose-300 to-red-300';
            glowColor = 'bg-rose-500';
        }

        // Update Text & Colors
        bmiStatusEl.textContent = status;
        bmiStatusEl.className = `text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${colorClass}`;

        statusGlow.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full mix-blend-screen filter blur-3xl opacity-20 transition-colors duration-1000 ${glowColor}`;

        // Calculate healthy weight range
        const minHealthyWeight = (18.5 * heightM * heightM).toFixed(1);
        const maxHealthyWeight = (24.9 * heightM * heightM).toFixed(1);
        healthyRangeEl.textContent = `適正体重範囲: ${minHealthyWeight}kg - ${maxHealthyWeight}kg`;
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = progress * (end - start) + start;
            obj.innerHTML = value.toFixed(1);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    calculateBtn.addEventListener('click', calculateBMI);

    // Enter key support
    const handleEnter = (e) => {
        if (e.key === 'Enter') calculateBMI();
    };
    heightInput.addEventListener('keypress', handleEnter);
    weightInput.addEventListener('keypress', handleEnter);
});
