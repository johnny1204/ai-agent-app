
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

    // Initialize
    loadTodos();

    // Event Listeners
    todoForm.addEventListener('submit', handleAddTodo);

    // Functions
    function loadTodos() {
        const todos = getTodosFromStorage();
        renderTodos(todos);
        updateUIState(todos.length);
    }

    function getTodosFromStorage() {
        const stored = sessionStorage.getItem('day2_todos');
        return stored ? JSON.parse(stored) : [];
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
                <div class="empty-state">
                    <p>TODOはまだありません</p>
                    <p class="text-xs mt-2">新しいタスクを追加してください</p>
                </div>
            `;
            return;
        }

        todos.forEach(todo => {
            const isOverdue = checkOverdue(todo.dueDate);
            const item = document.createElement('div');
            item.className = `todo-item ${isOverdue ? 'overdue' : ''}`;

            item.innerHTML = `
                <div class="todo-content">
                    <div class="todo-title">${escapeHtml(todo.title)}</div>
                    <div class="todo-meta">
                        <div class="reg-date">登録: <span>${formatDate(todo.regDate)}</span></div>
                        <div class="due-date">期日: <span>${formatDate(todo.dueDate)}</span> ${isOverdue ? '(期限切れ)' : ''}</div>
                    </div>
                </div>
                <button class="btn-delete" data-id="${todo.id}" aria-label="削除">
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

        if (count >= MAX_ITEMS) {
            addBtn.textContent = 'リストがいっぱいです';
        } else {
            addBtn.textContent = '追加する';
        }
    }

    function checkOverdue(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to start of day
        const due = new Date(dateString);
        due.setHours(0, 0, 0, 0); // Normalize due date

        return due < today;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
