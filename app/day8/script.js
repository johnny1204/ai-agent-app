document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const noteListEl = document.getElementById('note-list');
    const addNoteBtn = document.getElementById('add-note-btn');
    const noteTitleInput = document.getElementById('note-title');
    const noteContentInput = document.getElementById('note-content');
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const emptyState = document.getElementById('empty-state');
    const statusMsg = document.getElementById('status-msg');
    const lastSavedLabel = document.getElementById('last-saved');

    // State
    let notes = [];
    let currentNoteId = null;

    // Load notes from LocalStorage
    function loadNotes() {
        const stored = localStorage.getItem('day8_notes');
        if (stored) {
            try {
                notes = JSON.parse(stored);
                // Sort by updated desc
                notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            } catch (e) {
                console.error('Failed to parse notes', e);
                notes = [];
            }
        }
        renderNoteList();
    }

    // Save notes to LocalStorage
    function saveNotesToStorage() {
        localStorage.setItem('day8_notes', JSON.stringify(notes));
    }

    // Render the Sidebar List
    function renderNoteList() {
        noteListEl.innerHTML = '';
        if (notes.length === 0) {
            noteListEl.innerHTML = `
                <div class="text-center text-slate-500 py-8 text-sm">
                    メモはありません
                </div>`;
            return;
        }

        notes.forEach(note => {
            const div = document.createElement('div');
            const isActive = note.id === currentNoteId;
            div.className = `p-3 rounded-lg cursor-pointer transition-colors duration-200 border border-transparent group ${isActive ? 'bg-indigo-600/20 border-indigo-500/30' : 'hover:bg-slate-800 hover:border-slate-700'}`;
            
            const date = new Date(note.updatedAt).toLocaleDateString('ja-JP', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            div.innerHTML = `
                <h3 class="font-bold text-slate-200 truncate ${isActive ? 'text-indigo-300' : ''}">${note.title || '無題のメモ'}</h3>
                <div class="flex justify-between items-center mt-1">
                    <p class="text-xs text-slate-500 truncate max-w-[120px]">${note.content.substring(0, 20).replace(/\n/g, ' ')}...</p>
                    <span class="text-[10px] text-slate-600">${date}</span>
                </div>
            `;

            div.addEventListener('click', () => selectNote(note.id));
            noteListEl.appendChild(div);
        });
    }

    // Select a note to edit
    function selectNote(id) {
        currentNoteId = id;
        const note = notes.find(n => n.id === id);
        if (!note) return;

        // UI Updates
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        
        enableEditor();
        renderNoteList(); // refresh to update active state
        updateStatus('メモを開きました');
    }

    // Create a new note
    function createNote() {
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            updatedAt: new Date().toISOString()
        };
        notes.unshift(newNote); // Add to top
        saveNotesToStorage();
        selectNote(newNote.id);
        
        // Focus title
        noteTitleInput.focus();
        updateStatus('新規メモを作成しました');
    }

    // Save current note (update array and storage)
    function saveCurrentNote() {
        if (!currentNoteId) return;

        const noteIndex = notes.findIndex(n => n.id === currentNoteId);
        if (noteIndex === -1) return;

        const updatedNote = {
            ...notes[noteIndex],
            title: noteTitleInput.value,
            content: noteContentInput.value,
            updatedAt: new Date().toISOString()
        };

        // Move to top
        notes.splice(noteIndex, 1);
        notes.unshift(updatedNote);

        saveNotesToStorage();
        renderNoteList();
        
        // Visual Feedback
        const now = new Date();
        lastSavedLabel.textContent = `保存: ${now.toLocaleTimeString()}`;
        updateStatus('保存しました');
        
        // Optional: flash save button
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> 保存完了';
        saveBtn.classList.add('text-emerald-300');
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('text-emerald-300');
        }, 1500);
    }

    // Delete current note
    function deleteCurrentNote() {
        if (!currentNoteId) return;
        
        if (!confirm('このメモを削除してもよろしいですか？')) return;

        notes = notes.filter(n => n.id !== currentNoteId);
        saveNotesToStorage();
        
        currentNoteId = null;
        disableEditor();
        renderNoteList();
        
        noteTitleInput.value = '';
        noteContentInput.value = '';
        updateStatus('メモを削除しました');
    }

    // Helper functions for UI interaction
    function enableEditor() {
        noteTitleInput.disabled = false;
        noteContentInput.disabled = false;
        saveBtn.disabled = false;
        deleteBtn.disabled = false;
        
        saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        deleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        emptyState.style.display = 'none';
    }

    function disableEditor() {
        noteTitleInput.disabled = true;
        noteContentInput.disabled = true;
        saveBtn.disabled = true;
        deleteBtn.disabled = true;

        saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
        deleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
        emptyState.style.display = 'flex';
        lastSavedLabel.textContent = '';
    }

    function updateStatus(msg) {
        statusMsg.textContent = msg;
        setTimeout(() => {
            statusMsg.textContent = '準備完了';
        }, 3000);
    }

    // Event Listeners
    addNoteBtn.addEventListener('click', createNote);
    saveBtn.addEventListener('click', saveCurrentNote);
    deleteBtn.addEventListener('click', deleteCurrentNote);

    // Auto-save logic (optional, but good for UX) - forcing manual save per design but let's add shortcut
    // Ctrl+S
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCurrentNote();
        }
    });

    // Initialize
    loadNotes();
    disableEditor();
});
