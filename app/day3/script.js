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
    // Event Listeners
    moodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove selected styling from all
            moodBtns.forEach(b => {
                b.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-slate-900', 'bg-slate-800');
                // Reset border
                b.style.borderColor = '';
                b.style.backgroundColor = '';
            });

            // Add selected styling
            btn.classList.add('ring-2', 'ring-offset-2', 'ring-offset-slate-900', 'bg-slate-800');

            // Update state
            currentMood = btn.dataset.mood;
            currentColor = btn.dataset.color;

            // Apply color to border and ring
            btn.style.borderColor = currentColor;
            btn.style.boxShadow = `0 0 15px ${currentColor}40`; // Soft glow

            // Safe query selector
            const emojiEl = btn.querySelector('span:first-child'); // Text content is in first span
            const labelEl = btn.querySelector('span:last-child');  // Label is in last span

            currentEmoji = emojiEl ? emojiEl.textContent : '';
            currentLabel = labelEl ? labelEl.textContent : currentMood;

            applyBackgroundColor(currentColor);
        });
    });

    if (saveBtn) saveBtn.addEventListener('click', saveEntry);
    if (clearBtn) clearBtn.addEventListener('click', clearAllEntries);

    // Functions
    function loadEntries() {
        const entries = getEntries();
        renderEntries();
    }

    function saveEntry() {
        if (!currentMood) {
            alert('今日の気分を選んでください！');
            return;
        }

        const memo = memoInput.value.trim();
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

        const entries = getEntries();
        entries.unshift(entry);
        localStorage.setItem('moodDiaryEntries', JSON.stringify(entries));

        memoInput.value = '';
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
            diaryList.innerHTML = `
                <div class="text-center py-10 bg-slate-900/50 border border-slate-800 rounded-2xl border-dashed">
                    <p class="text-slate-500 mb-2">まだ記録がありません</p>
                    <p class="text-xs text-slate-600">今日の気分を記録してみましょう！</p>
                </div>
            `;
            return;
        }

        entries.forEach(entry => {
            const card = document.createElement('div');
            // Tailwind classes for card
            card.className = 'group relative overflow-hidden bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:bg-slate-900 transition-colors';

            // Add a colored bar on the left
            const bar = document.createElement('div');
            bar.className = 'absolute top-0 left-0 w-1.5 h-full';
            bar.style.backgroundColor = entry.color;
            card.appendChild(bar);

            const header = document.createElement('div');
            header.className = 'flex justify-between items-start mb-3 pl-2';

            const dateSpan = document.createElement('span');
            dateSpan.className = 'text-xs text-slate-500 font-mono';
            dateSpan.textContent = entry.date;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-slate-600 hover:text-rose-400 transition-colors p-1 opacity-100 md:opacity-0 group-hover:opacity-100';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.onclick = () => deleteEntry(entry.id);

            header.appendChild(dateSpan);
            header.appendChild(deleteBtn);

            const moodDiv = document.createElement('div');
            moodDiv.className = 'text-lg font-bold text-slate-200 mb-2 flex items-center gap-2 pl-2';
            // Tint the mood text with the color
            moodDiv.style.color = entry.color;
            moodDiv.innerHTML = `<span class="text-2xl">${entry.emoji}</span> ${entry.mood}`;

            // Only show memo if exists
            if (entry.memo) {
                const memoP = document.createElement('div');
                memoP.className = 'text-sm text-slate-400 leading-relaxed pl-2 border-l-2 border-slate-800 ml-1 mt-2 py-1';
                memoP.textContent = entry.memo;
                card.appendChild(memoP);
            }

            card.insertBefore(moodDiv, card.lastChild ? undefined : null); // Insert before memo if memo exists (handled by append order actually)
            card.prepend(header);
            // Re-ordering logic: Header -> Mood -> Memo (already appended)
            // But wait, I constructed it weirdly.

            // Let's rebuild structure cleanly
            card.innerHTML = '';
            card.appendChild(bar);
            card.appendChild(header);
            card.appendChild(moodDiv);
            if (entry.memo) {
                const memoP = document.createElement('div');
                memoP.className = 'text-sm text-slate-400 leading-relaxed pl-3 border-l-2 border-slate-800 ml-1 mt-2';
                memoP.textContent = entry.memo;
                card.appendChild(memoP);
            }

            // Re-attach delete listener because innerHTML wiped it
            const newDeleteBtn = card.querySelector('button');
            newDeleteBtn.onclick = () => deleteEntry(entry.id);

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
    function applyBackgroundColor(color) {
        const blob1 = document.getElementById('blob-1');
        const blob2 = document.getElementById('blob-2');
        const bgTint = document.getElementById('bg-tint');

        if (blob1) blob1.style.backgroundColor = color;
        if (blob2) blob2.style.backgroundColor = color;
        if (bgTint) bgTint.style.backgroundColor = color;
    }
});
