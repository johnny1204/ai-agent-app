const units = {
    length: [
        { value: 'm', label: 'メートル (m)', factor: 1 },
        { value: 'km', label: 'キロメートル (km)', factor: 1000 },
        { value: 'cm', label: 'センチメートル (cm)', factor: 0.01 },
        { value: 'mm', label: 'ミリメートル (mm)', factor: 0.001 },
        { value: 'in', label: 'インチ (in)', factor: 0.0254 },
        { value: 'ft', label: 'フィート (ft)', factor: 0.3048 },
        { value: 'yd', label: 'ヤード (yd)', factor: 0.9144 },
        { value: 'mi', label: 'マイル (mi)', factor: 1609.344 }
    ],
    weight: [
        { value: 'kg', label: 'キログラム (kg)', factor: 1 },
        { value: 'g', label: 'グラム (g)', factor: 0.001 },
        { value: 'mg', label: 'ミリグラム (mg)', factor: 0.000001 },
        { value: 'lb', label: 'ポンド (lb)', factor: 0.45359237 },
        { value: 'oz', label: 'オンス (oz)', factor: 0.028349523125 }
    ]
};

let currentCategory = 'length';

const categoryBtns = document.querySelectorAll('.category-btn');
const inputUnitSelect = document.getElementById('input-unit');
const outputUnitSelect = document.getElementById('output-unit');
const inputValue = document.getElementById('input-value');
const outputValue = document.getElementById('output-value');
const swapBtn = document.getElementById('swap-btn');

function populateUnits(category) {
    const selectedUnits = units[category];
    const unitOptions = selectedUnits.map(u => `<option value="${u.value}">${u.label}</option>`).join('');

    // Save current selections if possible, otherwise default
    const prevInput = inputUnitSelect.value;
    const prevOutput = outputUnitSelect.value;

    inputUnitSelect.innerHTML = unitOptions;
    outputUnitSelect.innerHTML = unitOptions;

    // Default defaults
    if (category === 'length') {
        inputUnitSelect.value = 'm';
        outputUnitSelect.value = 'ft';
    } else {
        inputUnitSelect.value = 'kg';
        outputUnitSelect.value = 'lb';
    }
}

function convert() {
    const inputUnit = inputUnitSelect.value;
    const outputUnit = outputUnitSelect.value;
    const val = parseFloat(inputValue.value);

    if (isNaN(val)) {
        outputValue.value = '';
        return;
    }

    const categoryUnits = units[currentCategory];
    const fromFactor = categoryUnits.find(u => u.value === inputUnit).factor;
    const toFactor = categoryUnits.find(u => u.value === outputUnit).factor;

    // Convert to base unit (m or kg) then to target unit
    const result = val * fromFactor / toFactor;

    // Format result to avoid long decimals
    outputValue.value = Number(result.toPrecision(7)).toString(); // Clean up trailing zeros
}

// Event Listeners
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update styling
        categoryBtns.forEach(b => {
            // Reset to inactive style
            b.className = 'category-btn flex-1 py-3 px-6 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-200 transition-all duration-300 flex items-center justify-center gap-2';
        });
        // Set to active style
        btn.className = 'category-btn active flex-1 py-3 px-6 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-slate-800 text-indigo-400 shadow-lg';

        currentCategory = btn.dataset.category;
        populateUnits(currentCategory);
        convert();

        // Visual feedback animation
        const card = document.getElementById('converter-card');
        if (card) {
            card.animate([
                { transform: 'scale(0.98)' },
                { transform: 'scale(1)' }
            ], { duration: 200 });
        }
    });
});

inputValue.addEventListener('input', convert);
inputUnitSelect.addEventListener('change', convert);
outputUnitSelect.addEventListener('change', convert);

swapBtn.addEventListener('click', () => {
    const temp = inputUnitSelect.value;
    inputUnitSelect.value = outputUnitSelect.value;
    outputUnitSelect.value = temp;
    convert();

    // Rotation animation
    const icon = swapBtn.querySelector('i');
    icon.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(180deg)' }
    ], { duration: 300 });
});

// Initialize
populateUnits('length');
convert();
