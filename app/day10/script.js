document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const modeCoinBtn = document.getElementById('mode-coin');
    const modeDiceBtn = document.getElementById('mode-dice');
    const trialsInput = document.getElementById('trials-input');
    const quickSetBtns = document.querySelectorAll('.quick-set-btn');
    const runBtn = document.getElementById('run-btn');

    const coinStage = document.getElementById('coin-stage');
    const diceStage = document.getElementById('dice-stage');
    const placeholderMsg = document.getElementById('placeholder-msg');

    const resultsContainer = document.getElementById('results-container');
    const coinStats = document.getElementById('coin-stats');
    const diceStats = document.getElementById('dice-stats');
    const totalCountEl = document.getElementById('total-count');

    // State
    let currentMode = 'coin'; // 'coin' or 'dice'

    // Init
    switchMode('coin');

    // Event Listeners
    modeCoinBtn.addEventListener('click', () => switchMode('coin'));
    modeDiceBtn.addEventListener('click', () => switchMode('dice'));

    quickSetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            trialsInput.value = btn.dataset.val;
        });
    });

    runBtn.addEventListener('click', runSimulation);

    function switchMode(mode) {
        currentMode = mode;

        // Update Buttons
        if (mode === 'coin') {
            modeCoinBtn.classList.replace('text-slate-500', 'text-orange-400');
            modeCoinBtn.classList.replace('bg-transparent', 'bg-slate-800'); // Assuming default state
            modeCoinBtn.classList.add('shadow-md');

            modeDiceBtn.classList.replace('text-orange-400', 'text-slate-500');
            modeDiceBtn.classList.remove('bg-slate-800', 'shadow-md');

            // Show proper stage preview
            placeholderMsg.style.display = 'none';
            coinStage.classList.remove('hidden');
            diceStage.classList.add('hidden');
        } else {
            modeDiceBtn.classList.replace('text-slate-500', 'text-orange-400');
            modeDiceBtn.classList.add('bg-slate-800', 'shadow-md');

            modeCoinBtn.classList.replace('text-orange-400', 'text-slate-500');
            modeCoinBtn.classList.remove('bg-slate-800', 'shadow-md');

            placeholderMsg.style.display = 'none';
            coinStage.classList.add('hidden');
            diceStage.classList.remove('hidden');
        }

        // Reset Results
        resultsContainer.classList.add('hidden');
    }

    async function runSimulation() {
        const trials = parseInt(trialsInput.value);
        if (!trials || trials <= 0) {
            alert('有効な試行回数を入力してください');
            return;
        }

        // Reset UI
        resultsContainer.classList.add('hidden');
        runBtn.disabled = true;
        runBtn.classList.add('opacity-50', 'cursor-not-allowed');

        // Simple visual feedback before showing results
        if (currentMode === 'coin') {
            await animateCoin();
            const results = performCoinSim(trials);
            renderCoinStats(results, trials);
        } else {
            await animateDice();
            const results = performDiceSim(trials);
            renderDiceStats(results, trials);
        }

        resultsContainer.classList.remove('hidden');
        totalCountEl.textContent = trials.toLocaleString();

        runBtn.disabled = false;
        runBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // --- Math Logic ---

    function performCoinSim(n) {
        let heads = 0;
        let tails = 0;
        for (let i = 0; i < n; i++) {
            if (Math.random() < 0.5) heads++;
            else tails++;
        }
        return { heads, tails };
    }

    function performDiceSim(n) {
        const counts = [0, 0, 0, 0, 0, 0]; // 1-6
        for (let i = 0; i < n; i++) {
            const roll = Math.floor(Math.random() * 6); // 0-5
            counts[roll]++;
        }
        return counts;
    }

    // --- Rendering ---

    function renderCoinStats(res, total) {
        coinStats.classList.remove('hidden');
        diceStats.classList.add('hidden');
        coinStats.innerHTML = '';

        const createBar = (label, count, colorClass) => {
            const percent = ((count / total) * 100).toFixed(1);
            return `
                <div class="space-y-1">
                    <div class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                        <span>${label}</span>
                        <span>${count.toLocaleString()} (${percent}%)</span>
                    </div>
                    <div class="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out" style="width: 0%" data-width="${percent}%"></div>
                    </div>
                </div>
            `;
        };

        coinStats.innerHTML += createBar('表 (Heads)', res.heads, 'from-yellow-400 to-yellow-600');
        coinStats.innerHTML += createBar('裏 (Tails)', res.tails, 'from-slate-400 to-slate-600');

        // Trigger animation
        requestAnimationFrame(() => {
            coinStats.querySelectorAll('[data-width]').forEach(el => {
                el.style.width = el.dataset.width;
            });
        });
    }

    function renderDiceStats(counts, total) {
        diceStats.classList.remove('hidden');
        coinStats.classList.add('hidden');
        diceStats.innerHTML = '';

        // colors for 1-6
        const colors = [
            'from-red-400 to-red-600',
            'from-orange-400 to-orange-600',
            'from-yellow-400 to-yellow-600',
            'from-green-400 to-green-600',
            'from-blue-400 to-blue-600',
            'from-purple-400 to-purple-600'
        ];

        counts.forEach((count, idx) => {
            const num = idx + 1;
            const percent = ((count / total) * 100).toFixed(1);

            const html = `
                <div class="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                    <div class="text-2xl mb-2 text-slate-300">
                        <i class="fas fa-dice-${['one', 'two', 'three', 'four', 'five', 'six'][idx]}"></i>
                    </div>
                    <div class="text-xl font-bold text-slate-100 mb-1">${percent}%</div>
                    <div class="text-xs text-slate-500 mb-3">${count.toLocaleString()}回</div>
                    
                    <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div class="h-full bg-gradient-to-r ${colors[idx]} transition-all duration-1000 ease-out" style="width: 0%" data-width="${percent}%"></div>
                    </div>
                </div>
            `;
            diceStats.innerHTML += html;
        });

        // Trigger animation
        requestAnimationFrame(() => {
            diceStats.querySelectorAll('[data-width]').forEach(el => {
                el.style.width = el.dataset.width;
            });
        });
    }

    // --- Visual Animations (Just for flourish) ---

    function animateCoin() {
        return new Promise(resolve => {
            const coin = document.getElementById('coin-inner');
            coin.style.transform = 'rotateY(0deg)'; // reset

            // Spin rapidly
            setTimeout(() => {
                coin.style.transform = 'rotateY(1440deg)'; // 4 spins
            }, 10);

            setTimeout(resolve, 600);
        });
    }

    function animateDice() {
        return new Promise(resolve => {
            const dice = document.getElementById('dice-cube');
            // Shake
            dice.classList.add('animate-spin');
            setTimeout(() => {
                dice.classList.remove('animate-spin');
                resolve();
            }, 500);
        });
    }

});
