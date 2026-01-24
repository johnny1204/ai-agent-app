document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const moodBtns = document.querySelectorAll('.mood-btn');
    const body = document.body;
    const memoInput = document.getElementById('memo-input');
    const saveBtn = document.getElementById('save-btn');
    const diaryList = document.getElementById('diary-list');
    const clearBtn = document.getElementById('clear-btn');

    // Debug check
    if (moodBtns.length === 0) {
        console.error('Mood buttons not found');
    }

    // State
    let currentMood = null;
    let currentColor = null;
    let currentEmoji = null;
    let currentLabel = null;

    // Load saved entries safely
    try {
        loadEntries();
    } catch (e) {
        console.error('Failed to load entries:', e);
        localStorage.removeItem('moodDiaryEntries'); // Reset if corrupted
    }

    // Event Listeners
    moodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove selected class from all
            moodBtns.forEach(b => b.classList.remove('selected'));

            // Add to clicked
            btn.classList.add('selected');

            // Update state
            currentMood = btn.dataset.mood;
            currentColor = btn.dataset.color;
            // Safe query selector
            const emojiEl = btn.querySelector('.emoji');
            const labelEl = btn.querySelector('.label');

            currentEmoji = emojiEl ? emojiEl.textContent : '';
            currentLabel = labelEl ? labelEl.textContent : currentMood;

            // Change background color
            applyBackgroundColor(currentColor);
        });
    });

    if (saveBtn) saveBtn.addEventListener('click', saveEntry);
    if (clearBtn) clearBtn.addEventListener('click', clearAllEntries);

    // Functions
    function applyBackgroundColor(color) {
        body.style.backgroundColor = color;
    }

    function saveEntry() {
        if (!currentMood) {
            alert('今日の気分を選んでください！');
            return;
        }

        const memo = memoInput.value.trim();
        // Allow empty memo if mood is selected, or ask confirmation?
        // Let's just allow it if the user wants purely mood tracking, or conform to previous requirement
        if (!memo && !confirm('メモが空ですが保存しますか？')) {
            return;
        }

        const entry = {
            id: Date.now(),
            date: new Date().toLocaleString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            mood: currentLabel,
            emoji: currentEmoji,
            color: currentColor,
            memo: memo
        };

        // Save to LocalStorage
        const entries = getEntries();
        entries.unshift(entry); // Add to top
        localStorage.setItem('moodDiaryEntries', JSON.stringify(entries));

        // Reset text (keep mood for rapid entry if desired? No, usually reset is better)
        memoInput.value = '';

        // Render
        renderEntries();
    }

    function getEntries() {
        try {
            const entries = localStorage.getItem('moodDiaryEntries');
            return entries ? JSON.parse(entries) : [];
        } catch (e) {
            console.error('Error parsing entries:', e);
            return [];
        }
    }

    function renderEntries() {
        const entries = getEntries();
        diaryList.innerHTML = '';

        if (entries.length === 0) {
            diaryList.innerHTML = '<div class="empty-state">まだ記録がありません。<br>今日の気分を記録してみましょう！</div>';
            return;
        }

        entries.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            card.style.borderLeftColor = entry.color;

            const header = document.createElement('div');
            header.className = 'entry-header';

            const dateSpan = document.createElement('span');
            dateSpan.textContent = entry.date;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&times;';
            // Use local function directly
            deleteBtn.onclick = () => deleteEntry(entry.id);

            header.appendChild(dateSpan);
            header.appendChild(deleteBtn);

            const moodDiv = document.createElement('div');
            moodDiv.className = 'entry-mood';
            moodDiv.textContent = `${entry.emoji} ${entry.mood}`;

            const memoP = document.createElement('div');
            memoP.className = 'entry-memo';
            memoP.textContent = entry.memo;

            card.appendChild(header);
            card.appendChild(moodDiv);
            card.appendChild(memoP);

            diaryList.appendChild(card);
        });
    }

    // Define as local function, hoisted
    function deleteEntry(id) {
        if (confirm('この記録を削除しますか？')) {
            const entries = getEntries().filter(e => e.id !== id);
            localStorage.setItem('moodDiaryEntries', JSON.stringify(entries));
            renderEntries();
        }
    }

    function clearAllEntries() {
        if (confirm('全ての履歴を削除しますか？この操作は取り消せません。')) {
            localStorage.removeItem('moodDiaryEntries');
            renderEntries();
        }
    }
});
