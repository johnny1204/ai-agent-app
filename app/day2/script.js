
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoForm = document.getElementById('todo-form');
    const titleInput = document.getElementById('title');
    const regDateInput = document.getElementById('reg-date');
    const dueDateInput = document.getElementById('due-date');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const countDisplay = document.getElementById('count-display');
    const toast = document.getElementById('toast');

    // State
    const MAX_ITEMS = 3;

    // Set default registration date to today
    const today = new Date().toISOString().split('T')[0];
    regDateInput.value = today;

    // Event Listeners first to ensure they bind even if loading fails
    todoForm.addEventListener('submit', handleAddTodo);

    // Initialize
    try {
        loadTodos();
    } catch (e) {
        console.error('Init error:', e);
    }

    // Functions
    function loadTodos() {
        const todos = getTodosFromStorage();
        renderTodos(todos);
        updateUIState(todos.length);
    }

    function getTodosFromStorage() {
        try {
            const stored = sessionStorage.getItem('day2_todos');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('JSON Parse error:', e);
            sessionStorage.removeItem('day2_todos'); // Clear bad data
            return [];
        }
    }

    function saveTodosToStorage(todos) {
        sessionStorage.setItem('day2_todos', JSON.stringify(todos));
    }

    function handleAddTodo(e) {
        e.preventDefault();

        const todos = getTodosFromStorage();
        if (todos.length >= MAX_ITEMS) {
            showToast(`登録できるのは${MAX_ITEMS}件までです`, 'error');
            return;
        }

        const title = titleInput.value.trim();
        const regDate = regDateInput.value;
        const dueDate = dueDateInput.value;

        if (!title || !regDate || !dueDate) {
            showToast('すべての項目を入力してください', 'error');
            return;
        }

        // Date Validation: Due date cannot be before registration date
        if (new Date(dueDate) < new Date(regDate)) {
            showToast('期日は登録日より前に設定できません', 'error');
            return;
        }

        const newTodo = {
            id: Date.now().toString(),
            title,
            regDate,
            dueDate,
            createdAt: new Date().toISOString()
        };

        todos.push(newTodo);
        saveTodosToStorage(todos);

        // Reset form but keep today's date
        todoForm.reset();
        regDateInput.value = today;

        renderTodos(todos);
        updateUIState(todos.length);
        showToast('TODOを追加しました');
    }

    function handleDeleteTodo(id) {
        const todos = getTodosFromStorage();
        const updatedTodos = todos.filter(t => t.id !== id);
        saveTodosToStorage(updatedTodos);

        renderTodos(updatedTodos);
        updateUIState(updatedTodos.length);
        showToast('TODOを削除しました');
    }

    function renderTodos(todos) {
        todoList.innerHTML = '';

        if (todos.length === 0) {
            todoList.innerHTML = `
                <div class="text-center py-10 bg-slate-900/50 border border-slate-800 rounded-2xl border-dashed">
                    <p class="text-slate-500 mb-2">TODOはまだありません</p>
                    <p class="text-xs text-slate-600">新しいタスクを追加してください</p>
                </div>
            `;
            return;
        }

        todos.forEach(todo => {
            const isOverdue = checkOverdue(todo.dueDate);
            const item = document.createElement('div');
            // Tailwind classes for item
            const overdueClass = isOverdue ? 'border-rose-900/50 bg-rose-950/10' : 'border-slate-800 bg-slate-900/80';
            const overdueText = isOverdue ? 'text-rose-400' : 'text-slate-400';

            item.className = `group flex items-center justify-between p-5 rounded-2xl border ${overdueClass} backdrop-blur-sm hover:border-sky-500/30 transition-all duration-300`;

            item.innerHTML = `
                <div class="flex-grow">
                    <div class="text-lg font-bold text-slate-200 mb-1">${escapeHtml(todo.title)}</div>
                    <div class="flex gap-4 text-xs">
                        <div class="text-slate-500">登録: <span class="font-mono">${formatDate(todo.regDate)}</span></div>
                        <div class="${overdueText}">期日: <span class="font-mono text-slate-300">${formatDate(todo.dueDate)}</span> ${isOverdue ? '<span class="text-rose-500 font-bold ml-1">(期限切れ)</span>' : ''}</div>
                    </div>
                </div>
                <button class="btn-delete w-10 h-10 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 hover:border hover:border-rose-900/50 transition-all duration-300 flex items-center justify-center flex-shrink-0 ml-4 group-hover:opacity-100 opacity-100 md:opacity-0" data-id="${todo.id}" aria-label="削除">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
            `;

            // Add click listener for delete
            const deleteBtn = item.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', () => handleDeleteTodo(todo.id));

            todoList.appendChild(item);
        });
    }

    function updateUIState(count) {
        countDisplay.textContent = `${count} / ${MAX_ITEMS}`;
        addBtn.disabled = count >= MAX_ITEMS;
    }

    function checkOverdue(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(dateString);
        return date < today;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function (match) {
            const escape = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escape[match];
        });
    }

    function showToast(message, type = 'success') {
        toast.textContent = message;

        // Tailwind styling logic for toast
        const baseClasses = "fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg border flex items-center gap-3 transition-all duration-300 z-50 font-medium";
        const typeClasses = type === 'error'
            ? "bg-rose-950/90 border-rose-800 text-rose-100"
            : "bg-emerald-950/90 border-emerald-800 text-emerald-100";

        toast.className = `${baseClasses} ${typeClasses} translate-y-0 opacity-100`;

        setTimeout(() => {
            toast.className = `${baseClasses} ${typeClasses} translate-y-10 opacity-0 pointer-events-none`;
        }, 3000);
    }
});
