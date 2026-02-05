
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const totalAmountInput = document.getElementById('totalAmount');
    const totalPeopleInput = document.getElementById('totalPeople');
    const standardCountDisplay = document.getElementById('standardCountDisplay');
    const groupsContainer = document.getElementById('groupsContainer');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const groupRowTemplate = document.getElementById('groupRowTemplate');
    
    const displayTotalAmount = document.getElementById('displayTotalAmount');
    const resultBreakdown = document.getElementById('resultBreakdown');
    const remainderRow = document.getElementById('remainderRow');
    const remainderAmountFn = document.getElementById('remainderAmount');
    const peopleCountWarning = document.getElementById('peopleCountWarning');

    let customGroups = []; // Array of objects: { id, name, count, rate, element }
    let nextGroupId = 1;

    // --- Helper Functions ---

    const formatCurrency = (num) => {
        return num.toLocaleString('en-US');
    };

    const getStandardCount = () => {
        const totalPeople = parseInt(totalPeopleInput.value) || 0;
        const customCount = customGroups.reduce((acc, g) => acc + (parseInt(g.count) || 0), 0);
        return totalPeople - customCount;
    };

    const validatePeopleCount = () => {
        const standardCount = getStandardCount();
        if (standardCount < 0) {
            peopleCountWarning.classList.remove('hidden');
            standardCountDisplay.classList.add('text-red-400');
            standardCountDisplay.classList.remove('text-slate-100');
            standardCountDisplay.textContent = `${standardCount} 人 (不足)`;
            return false;
        } else {
            peopleCountWarning.classList.add('hidden');
            standardCountDisplay.classList.remove('text-red-400');
            standardCountDisplay.classList.add('text-slate-100');
            standardCountDisplay.textContent = `${standardCount} 人`;
            return true;
        }
    };

    const calculate = () => {
        const totalAmount = parseInt(totalAmountInput.value) || 0;
        const totalPeople = parseInt(totalPeopleInput.value) || 0;
        
        displayTotalAmount.textContent = formatCurrency(totalAmount);

        if (totalAmount <= 0) {
            resultBreakdown.innerHTML = `<div class="text-center text-slate-500 py-4 text-sm">計算金額を入力してください</div>`;
            remainderRow.classList.add('hidden');
            return;
        }

        if (totalPeople <= 0) {
            resultBreakdown.innerHTML = `<div class="text-center text-slate-500 py-4 text-sm">参加人数を入力してください</div>`;
            remainderRow.classList.add('hidden');
            return;
        }

        if (!validatePeopleCount()) {
             resultBreakdown.innerHTML = `<div class="text-center text-red-400 py-4 text-sm">グループ人数の合計が参加人数を超えています。<br>人数を調整してください。</div>`;
             remainderRow.classList.add('hidden');
             return;
        }

        const standardCount = getStandardCount();
        
        // Calculate Total Weighted Units
        // Standard group = weight 1.0 * count
        // Custom groups = weight N * count
        let totalUnits = standardCount * 1.0;
        customGroups.forEach(g => {
            totalUnits += (g.count * g.rate);
        });

        if (totalUnits <= 0) {
            resultBreakdown.innerHTML = `<div class="text-center text-slate-500 py-4 text-sm">有効な支払い人数がいません</div>`;
            return;
        }

        // Calculate Cost Per Unit
        // We floor it to 100 yen or 10 yen unit usually, but let's go with 1 yen unit for exact math first, 
        // traditionally in Japan it's often 100 yen units.
        // Let's use 100 yen units for "clean" split, and remainder goes to adjustment.
        // Or simple exact split. Detailed spec wasn't given, but "1 yen unit" is easiest.
        // Let's try to round to nearest 100 yen? No, let's Stick to 10 or 1 yen to be precise first.
        // Let's implement 1-yen precision first.
        
        const costPerUnit = totalAmount / totalUnits;

        // Build result items
        const results = [];

        // Standard Group
        if (standardCount > 0) {
            // Round cost to nearest 1 yen (floor/ceil?) Usually ceiling to cover bill?
            // Actually let's floor and calculate remainder.
            const rawCost = costPerUnit * 1.0;
            const finalCost = Math.floor(rawCost); // Payment per person
            results.push({
                name: '通常支払い',
                count: standardCount,
                costPerPerson: finalCost,
                totalCost: finalCost * standardCount,
                type: 'standard'
            });
        }

        // Custom Groups
        customGroups.forEach(g => {
            if (g.count > 0) {
                const rawCost = costPerUnit * g.rate;
                const finalCost = Math.floor(rawCost);
                 results.push({
                    name: g.name || `グループ ${g.id}`,
                    count: g.count,
                    costPerPerson: finalCost,
                    totalCost: finalCost * g.count,
                    type: 'custom'
                });
            }
        });

        // Calculate Remainder
        const totalCalculated = results.reduce((acc, r) => acc + r.totalCost, 0);
        const remainder = totalAmount - totalCalculated;

        // Render Results
        let html = '';
        results.forEach(r => {
            html += `
                <div class="p-4 rounded-xl ${r.type === 'standard' ? 'bg-slate-800/60 border-slate-700/50' : 'bg-slate-800/40 border-slate-700/30'} border flex justify-between items-center">
                    <div>
                        <div class="font-bold text-slate-200">${r.name}</div>
                        <div class="text-xs text-slate-500">${r.count} 名</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold text-sky-400">¥${formatCurrency(r.costPerPerson)}</div>
                        <div class="text-xs text-slate-500">1人あたり</div>
                    </div>
                </div>
            `;
        });

        resultBreakdown.innerHTML = html;

        if (remainder > 0) {
            remainderRow.classList.remove('hidden');
            remainderAmountFn.textContent = formatCurrency(remainder);
        } else {
            remainderRow.classList.add('hidden');
        }
    };

    const addGroup = () => {
        const id = nextGroupId++;
        const clone = groupRowTemplate.content.cloneNode(true);
        const row = clone.querySelector('.group-row');
        
        // Inputs
        const nameInput = row.querySelector('.group-name-input');
        const countInput = row.querySelector('.group-count-input');
        const rateInput = row.querySelector('.group-rate-input');
        const rateDisplay = row.querySelector('.group-rate-display');
        const removeBtn = row.querySelector('.remove-group-btn');

        // Initial Data
        const groupData = {
            id: id,
            name: '',
            count: 1,
            rate: 1.5,
            element: row
        };
        customGroups.push(groupData);

        // Sync Rate Display
        rateDisplay.textContent = 'x1.5';

        // Event Listeners
        nameInput.addEventListener('input', (e) => {
            groupData.name = e.target.value;
            calculate();
        });

        countInput.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (val < 0) val = 0;
            groupData.count = val;
            validatePeopleCount();
            calculate();
        });

        rateInput.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (val < 0) val = 0;
            groupData.rate = val;
            rateDisplay.textContent = 'x' + val;
            calculate();
        });

        removeBtn.addEventListener('click', () => {
            row.remove();
            customGroups = customGroups.filter(g => g.id !== id);
            validatePeopleCount();
            calculate();
        });

        groupsContainer.appendChild(row);
        validatePeopleCount();
        calculate();
    };

    // --- Main Event Listeners ---

    totalAmountInput.addEventListener('input', calculate);
    totalPeopleInput.addEventListener('input', () => {
        validatePeopleCount();
        calculate();
    });

    addGroupBtn.addEventListener('click', addGroup);

    // Initial state
    validatePeopleCount();
    calculate();
});
