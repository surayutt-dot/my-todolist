// APP STATE
let tasks = [];
let categories = [];
let selectedCategoryId = 'all';
let currentFilter = 'all'; // all, active, completed, high
let searchQuery = '';
let tempSubtasks = []; // holds subtasks during task creation
let activeEditingTaskId = null;

// SVG ICONS MAP
const ICONS = {
    all: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
    work: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    personal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    shopping: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
    health: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    custom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path></svg>`
};

// INITIALIZATION
function init() {
    initDate();
    initTheme();
    initAvatar();
    loadData();
    renderCategories();
    renderTasks();
    updateStats();
    setupEventListeners();
    registerServiceWorker();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
// DATE DISPLAY
function initDate() {
    const dateEl = document.getElementById('current-date');
    if (!dateEl) return;
    
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const today = new Date();
    // Thai local format (automatically CE + 543)
    let dateStr = today.toLocaleDateString('th-TH', options);
    dateEl.textContent = dateStr;
}

// THEME MANAGEMENT (LIGHT/DARK)
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        updateMetaThemeColor('#090d16');
    } else {
        document.body.classList.remove('dark');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        updateMetaThemeColor('#f6f8fc');
    }
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        if (isDark) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            updateMetaThemeColor('#090d16');
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            updateMetaThemeColor('#f6f8fc');
        }
    });
}

function updateMetaThemeColor(color) {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', color);
}

// LOCAL STORAGE PERSISTENCE
function loadData() {
    const savedTasks = localStorage.getItem('tasks');
    const savedCategories = localStorage.getItem('categories');
    
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    } else {
        // Default categories
        categories = [
            { id: 'work', name: 'งาน', color: '#3b82f6', icon: 'work' },
            { id: 'personal', name: 'ส่วนตัว', color: '#8b5cf6', icon: 'personal' },
            { id: 'shopping', name: 'ช้อปปิ้ง', color: '#f59e0b', icon: 'shopping' },
            { id: 'health', name: 'สุขภาพ', color: '#10b981', icon: 'health' }
        ];
        saveCategories();
    }
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        // Welcome tasks
        tasks = [
            {
                id: 'welcome-1',
                text: 'ยินดีต้อนรับสู่ TaskFlow! ลองกดปุ่ม "+" เพื่อสร้างงานใหม่กันดูนะครับ',
                category: 'personal',
                priority: 'medium',
                dueDate: getFormattedDate(0),
                completed: false,
                subtasks: [
                    { id: 'sub-1', text: 'ทดสอบกดยกเลิกในงานย่อย', completed: false },
                    { id: 'sub-2', text: 'ลองกดแชร์แอปนี้ลงบนหน้าจอมือถือของคุณ', completed: false }
                ]
            },
            {
                id: 'welcome-2',
                text: 'แตะที่รายการนี้เพื่อดูรายละเอียดหรือจัดการงานย่อย',
                category: 'work',
                priority: 'high',
                dueDate: getFormattedDate(0),
                completed: false,
                subtasks: []
            }
        ];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

function getFormattedDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// RENDERING - CATEGORIES LIST
function renderCategories() {
    const listEl = document.getElementById('categories-list');
    const modalSelectEl = document.getElementById('modal-category-select');
    if (!listEl) return;
    
    // Count tasks per category
    const counts = {};
    categories.forEach(c => counts[c.id] = 0);
    tasks.forEach(t => {
        if (!t.completed && counts[t.category] !== undefined) {
            counts[t.category]++;
        }
    });
    
    const activeTasksTotal = tasks.filter(t => !t.completed).length;
    
    // 1. Render main categories list
    let html = `
        <div class="category-card ${selectedCategoryId === 'all' ? 'active' : ''}" data-id="all">
            <div class="category-icon-wrapper" style="--accent-light: rgba(79, 70, 229, 0.1); --accent-color: #4f46e5;">
                ${ICONS.all}
            </div>
            <div class="category-info">
                <span class="category-name">ทั้งหมด</span>
                <span class="category-count">${activeTasksTotal} งาน</span>
            </div>
        </div>
    `;
    
    categories.forEach(cat => {
        const isActive = selectedCategoryId === cat.id;
        const count = counts[cat.id] || 0;
        const lightColor = hexToRgba(cat.color, 0.12);
        
        html += `
            <div class="category-card ${isActive ? 'active' : ''}" data-id="${cat.id}" style="--accent-color: ${cat.color}; --accent-light: ${lightColor};">
                <div class="category-icon-wrapper">
                    ${ICONS[cat.icon] || ICONS.custom}
                </div>
                <div class="category-info">
                    <span class="category-name">${cat.name}</span>
                    <span class="category-count">${count} งาน</span>
                </div>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
    
    // Add Event Listeners for category selection
    listEl.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedCategoryId = card.getAttribute('data-id');
            renderCategories();
            renderTasks();
        });
    });
    
    // 2. Render Modal Category Selector Pills
    if (modalSelectEl) {
        let modalHtml = '';
        categories.forEach((cat, index) => {
            // Select first category by default if none selected
            const isSelected = index === 0; 
            modalHtml += `
                <button type="button" class="modal-cat-pill ${isSelected ? 'selected' : ''}" 
                    data-id="${cat.id}" 
                    style="--accent-color: ${cat.color}; --accent-light: ${hexToRgba(cat.color, 0.15)}">
                    ${cat.name}
                </button>
            `;
        });
        modalSelectEl.innerHTML = modalHtml;
        
        // Add click events to pills
        modalSelectEl.querySelectorAll('.modal-cat-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                modalSelectEl.querySelectorAll('.modal-cat-pill').forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
            });
        });
    }
}

// RENDERING - TASKS LIST
function renderTasks() {
    const listEl = document.getElementById('tasks-list');
    const emptyStateEl = document.getElementById('empty-state');
    const visibleCountEl = document.getElementById('visible-tasks-count');
    const listTitleEl = document.getElementById('tasks-list-title');
    
    if (!listEl) return;
    
    // Set section title based on selected category
    if (selectedCategoryId === 'all') {
        listTitleEl.textContent = 'รายการงานทั้งหมด';
    } else {
        const cat = categories.find(c => c.id === selectedCategoryId);
        listTitleEl.textContent = `งานในหมวด "${cat ? cat.name : ''}"`;
    }
    
    // Filter tasks
    let filteredTasks = tasks.filter(task => {
        // Category Filter
        if (selectedCategoryId !== 'all' && task.category !== selectedCategoryId) {
            return false;
        }
        
        // Tab Filter
        if (currentFilter === 'active' && task.completed) return false;
        if (currentFilter === 'completed' && !task.completed) return false;
        if (currentFilter === 'high' && task.priority !== 'high') return false;
        
        // Search query filter
        if (searchQuery.trim() !== '') {
            return task.text.toLowerCase().includes(searchQuery.toLowerCase());
        }
        
        return true;
    });
    
    // Sort tasks: Active first, then by priority (high > medium > low), then by date
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // incomplete first
        }
        // sort by priority
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        if (pA !== pB) return pB - pA;
        
        // sort by due date
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    visibleCountEl.textContent = filteredTasks.length;
    
    if (filteredTasks.length === 0) {
        listEl.innerHTML = '';
        emptyStateEl.style.display = 'flex';
        return;
    }
    
    emptyStateEl.style.display = 'none';
    
    let html = '';
    filteredTasks.forEach(task => {
        const cat = categories.find(c => c.id === task.category);
        const catName = cat ? cat.name : 'ทั่วไป';
        const catColor = cat ? cat.color : '#64748b';
        
        // Subtask counts
        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
        const subtasksDone = hasSubtasks ? task.subtasks.filter(s => s.completed).length : 0;
        const subtasksTotal = hasSubtasks ? task.subtasks.length : 0;
        
        // Due date status
        let dateHtml = '';
        let dateClass = '';
        if (task.dueDate) {
            const todayStr = getFormattedDate(0);
            const isOverdue = task.dueDate < todayStr && !task.completed;
            const isToday = task.dueDate === todayStr;
            
            dateClass = isOverdue ? 'overdue' : '';
            let label = formatThaiDateShort(task.dueDate);
            if (isToday) label = 'วันนี้';
            else if (task.dueDate === getFormattedDate(1)) label = 'พรุ่งนี้';
            
            dateHtml = `
                <div class="task-due-meta ${dateClass}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>${label}</span>
                </div>
            `;
        }
        
        html += `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <!-- Circular Checkbox -->
                <div class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleTaskCompletion('${task.id}');">
                    <div class="custom-checkbox">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
                
                <!-- Task Details Trigger -->
                <div class="task-content" onclick="openDetailModal('${task.id}')">
                    <h4 class="task-title">${escapeHTML(task.text)}</h4>
                    <div class="task-meta">
                        <span class="task-tag" style="background-color: ${hexToRgba(catColor, 0.08)}; color: ${catColor};">${escapeHTML(catName)}</span>
                        
                        ${hasSubtasks ? `
                            <span class="subtasks-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-4 4 4 4m6-14 4 4-4 4"></path><path d="M5 15h11a4 4 0 0 0 4-4V5"></path></svg>
                                <span>${subtasksDone}/${subtasksTotal}</span>
                            </span>
                        ` : ''}
                        
                        ${dateHtml}
                    </div>
                </div>
                
                <!-- Priority Border Indicator -->
                <div class="priority-indicator ${task.priority}"></div>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
}

// DASHBOARD STATS UPDATE
function updateStats() {
    const doneCountEl = document.getElementById('tasks-done-count');
    const todoCountEl = document.getElementById('tasks-todo-count');
    const statsTextEl = document.getElementById('dashboard-stats-text');
    const percentTextEl = document.getElementById('progress-percent-text');
    const circle = document.getElementById('progress-ring-circle');
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    doneCountEl.textContent = completed;
    todoCountEl.textContent = active;
    
    // Circle progress calculation
    // R = 32, C = 2 * PI * R = 201.0619
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    
    let percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    percentTextEl.textContent = `${percent}%`;
    
    if (circle) {
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }
    
    // Thai stats text
    if (total === 0) {
        statsTextEl.textContent = 'สร้างงานแรกของคุณเพื่อเริ่มต้น!';
    } else if (percent === 100) {
        statsTextEl.textContent = 'ยอดเยี่ยมมาก! คุณทำงานเสร็จครบทุกอย่างแล้ว 🎉';
    } else {
        statsTextEl.textContent = `วันนี้ทำเสร็จแล้ว ${percent}% สู้ๆ ครับ!`;
    }
}

// EVENTS - STATE ACTIONS
function toggleTaskCompletion(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderCategories();
        renderTasks();
        updateStats();
    }
}

function addTask(text, categoryId, priority, dueDate, subtasksList) {
    const newTask = {
        id: 'task-' + Date.now(),
        text,
        category: categoryId,
        priority,
        dueDate: dueDate || null,
        completed: false,
        subtasks: subtasksList.map((stText, idx) => ({
            id: `sub-${Date.now()}-${idx}`,
            text: stText,
            completed: false
        }))
    };
    
    tasks.push(newTask);
    saveTasks();
    
    selectedCategoryId = 'all'; // reset filter view
    renderCategories();
    renderTasks();
    updateStats();
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderCategories();
    renderTasks();
    updateStats();
}

function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;
            
            // Auto complete parent task if all subtasks are complete? 
            // Better to let user handle it, but we update stats
            saveTasks();
            renderTasks();
            updateStats();
            renderDetailModalBody(task); // refresh detail modal
        }
    }
}

// EVENT LISTENERS SETUP
function setupEventListeners() {
    // 1. FLOATING ACTION BUTTON (FAB) & ADD TASK MODAL
    const fabBtn = document.getElementById('fab-btn');
    const addTaskModal = document.getElementById('add-task-modal');
    const closeAddModalBtn = document.getElementById('close-add-modal-btn');
    const addTaskForm = document.getElementById('add-task-form');
    
    fabBtn.addEventListener('click', () => {
        tempSubtasks = [];
        renderSubtasksPreview();
        
        // Reset inputs
        document.getElementById('task-input').value = '';
        document.getElementById('task-due-date').value = '';
        document.getElementById('new-subtask-input').value = '';
        
        // Set default category selected (first category pill)
        const catSelect = document.getElementById('modal-category-select');
        catSelect.querySelectorAll('.modal-cat-pill').forEach((p, idx) => {
            if (idx === 0) p.classList.add('selected');
            else p.classList.remove('selected');
        });
        
        // Set default priority (medium)
        document.querySelector('input[name="priority"][value="medium"]').checked = true;
        
        openModal(addTaskModal);
    });
    
    closeAddModalBtn.addEventListener('click', () => {
        closeModal(addTaskModal);
    });
    
    // Save new task
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('task-input').value.trim();
        const selectedCatEl = document.querySelector('#modal-category-select .modal-cat-pill.selected');
        const categoryId = selectedCatEl ? selectedCatEl.getAttribute('data-id') : 'personal';
        const priority = document.querySelector('input[name="priority"]:checked').value;
        const dueDate = document.getElementById('task-due-date').value;
        
        if (text) {
            addTask(text, categoryId, priority, dueDate, tempSubtasks);
            closeModal(addTaskModal);
        }
    });
    
    // Subtask Creator inside Modal
    const addSubtaskBtn = document.getElementById('add-subtask-btn');
    const newSubtaskInput = document.getElementById('new-subtask-input');
    
    addSubtaskBtn.addEventListener('click', () => {
        const text = newSubtaskInput.value.trim();
        if (text) {
            tempSubtasks.push(text);
            newSubtaskInput.value = '';
            renderSubtasksPreview();
        }
    });
    
    newSubtaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSubtaskBtn.click();
        }
    });
    
    // 2. SEARCH & FILTER TABS
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTasks();
    });
    
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            renderTasks();
        });
    });
    
    // 3. ADD CATEGORY DIALOG
    const addCategoryBtn = document.getElementById('add-category-btn');
    const addCategoryModal = document.getElementById('add-category-modal');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    
    addCategoryBtn.addEventListener('click', () => {
        document.getElementById('new-category-name').value = '';
        document.querySelector('input[name="cat-color"][value="#3b82f6"]').checked = true;
        openModal(addCategoryModal, true);
    });
    
    cancelCategoryBtn.addEventListener('click', () => {
        closeModal(addCategoryModal, true);
    });
    
    saveCategoryBtn.addEventListener('click', () => {
        const name = document.getElementById('new-category-name').value.trim();
        const color = document.querySelector('input[name="cat-color"]:checked').value;
        
        if (name) {
            const id = 'cat-' + Date.now();
            categories.push({
                id,
                name,
                color,
                icon: 'custom'
            });
            saveCategories();
            renderCategories();
            closeModal(addCategoryModal, true);
        }
    });
    
    // Close overlays if clicking outside card/sheet
    window.addEventListener('click', (e) => {
        if (e.target === addTaskModal) {
            closeModal(addTaskModal);
        }
        if (e.target === document.getElementById('task-detail-modal')) {
            closeModal(document.getElementById('task-detail-modal'));
        }
        if (e.target === addCategoryModal) {
            closeModal(addCategoryModal, true);
        }
    });
}

// SUBTASKS MODAL PREVIEW RENDER
function renderSubtasksPreview() {
    const listEl = document.getElementById('subtasks-list-preview');
    if (!listEl) return;
    
    if (tempSubtasks.length === 0) {
        listEl.innerHTML = '';
        return;
    }
    
    listEl.innerHTML = tempSubtasks.map((st, index) => `
        <li class="subtask-preview-item">
            <span>${escapeHTML(st)}</span>
            <button type="button" class="remove-subtask-btn" onclick="removeTempSubtask(${index})">&times;</button>
        </li>
    `).join('');
}

window.removeTempSubtask = function(index) {
    tempSubtasks.splice(index, 1);
    renderSubtasksPreview();
};

// DETAIL MODAL RENDER & ACTIONS
function openDetailModal(taskId) {
    const modal = document.getElementById('task-detail-modal');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    activeEditingTaskId = taskId;
    renderDetailModalBody(task);
    openModal(modal);
}

function renderDetailModalBody(task) {
    const container = document.getElementById('detail-modal-body');
    if (!container) return;
    
    const cat = categories.find(c => c.id === task.category);
    const catName = cat ? cat.name : 'ทั่วไป';
    const catColor = cat ? cat.color : '#64748b';
    
    // Priority label
    let priLabel = 'ปกติ';
    let priClass = 'low';
    if (task.priority === 'medium') { priLabel = 'ปานกลาง'; priClass = 'medium'; }
    if (task.priority === 'high') { priLabel = 'ด่วนที่สุด 🚨'; priClass = 'high'; }
    
    // Due Date
    let dateHtml = 'ไม่มีกำหนดส่ง';
    let isOverdue = false;
    if (task.dueDate) {
        const todayStr = getFormattedDate(0);
        isOverdue = task.dueDate < todayStr && !task.completed;
        const formatted = formatThaiDateLong(task.dueDate);
        dateHtml = isOverdue ? `ช้ากว่ากำหนด: ${formatted} ⚠️` : `กำหนดส่ง: ${formatted}`;
    }
    
    // Subtasks List
    let subtasksHtml = '';
    if (task.subtasks && task.subtasks.length > 0) {
        subtasksHtml = `
            <div class="detail-subtasks-container">
                <label>งานย่อย (${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length})</label>
                <ul class="detail-subtasks-list">
                    ${task.subtasks.map(sub => `
                        <li class="detail-subtask-item ${sub.completed ? 'completed' : ''}" onclick="toggleSubtask('${task.id}', '${sub.id}')">
                            <div class="checkbox-container">
                                <input type="checkbox" ${sub.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleSubtask('${task.id}', '${sub.id}');">
                                <div class="custom-checkbox" style="width: 20px; height: 20px; border-width: 1.5px;">
                                    <svg style="width: 10px; height: 10px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            </div>
                            <span class="subtask-text">${escapeHTML(sub.text)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="detail-meta-row">
            <span class="task-tag" style="background-color: ${hexToRgba(catColor, 0.08)}; color: ${catColor}; font-size: 0.75rem; padding: 4px 8px;">
                ${escapeHTML(catName)}
            </span>
            <span class="priority-pill ${priClass}" style="font-size: 0.75rem; padding: 4px 8px; border-radius: 6px;">
                ความสำคัญ: ${priLabel}
            </span>
        </div>
        
        <h2 class="detail-title">${escapeHTML(task.text)}</h2>
        
        <div class="detail-due-box ${isOverdue ? 'overdue' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>${dateHtml}</span>
        </div>
        
        ${subtasksHtml}
        
        <div class="detail-actions-row">
            <button class="detail-action-btn delete-btn" onclick="handleDeleteFromDetail('${task.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                ลบงาน
            </button>
            <button class="detail-action-btn complete-btn" onclick="handleToggleFromDetail('${task.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 12 12 14 14"></polyline></svg>
                ${task.completed ? 'ทำอีกครั้ง' : 'เสร็จสิ้นงานนี้'}
            </button>
        </div>
    `;
}

window.handleDeleteFromDetail = function(taskId) {
    deleteTask(taskId);
    closeModal(document.getElementById('task-detail-modal'));
};

window.handleToggleFromDetail = function(taskId) {
    toggleTaskCompletion(taskId);
    closeModal(document.getElementById('task-detail-modal'));
};

// HELPER TRANSITION MODAL FUNCTION
function openModal(modalEl, isDialog = false) {
    modalEl.style.opacity = '0';
    modalEl.style.display = 'flex';
    
    // Trigger reflow
    modalEl.offsetHeight;
    
    modalEl.style.opacity = '1';
    
    if (!isDialog) {
        const sheet = modalEl.querySelector('.bottom-sheet');
        if (sheet) {
            sheet.style.transform = 'translateY(100%)';
            sheet.offsetHeight; // reflow
            sheet.style.transform = 'translateY(0)';
        }
    }
}

function closeModal(modalEl, isDialog = false) {
    modalEl.style.opacity = '0';
    
    if (!isDialog) {
        const sheet = modalEl.querySelector('.bottom-sheet');
        if (sheet) {
            sheet.style.transform = 'translateY(100%)';
        }
    }
    
    setTimeout(() => {
        modalEl.style.display = 'none';
    }, 300);
}

// UTILITY FUNCTIONS
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function formatThaiDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${String(d.getFullYear() + 543).slice(-2)}`;
}

function formatThaiDateLong(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// REGISTER PWA SERVICE WORKER
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('ServiceWorker registration successful with scope: ', reg.scope))
                .catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }
}

// PROFILE AVATAR MANAGEMENT
function initAvatar() {
    const avatarBtn = document.getElementById('avatar-btn');
    const avatarInput = document.getElementById('avatar-input');
    
    if (!avatarBtn || !avatarInput) return;
    
    // Load saved avatar on startup
    loadAvatar();
    
    // Click avatar to trigger file input
    avatarBtn.addEventListener('click', () => {
        avatarInput.click();
    });
    
    // Handle image file selection
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (limit to 2MB to fit in LocalStorage)
            if (file.size > 2 * 1024 * 1024) {
                alert('ขนาดรูปภาพใหญ่เกินไป (กรุณาเลือกรูปขนาดไม่เกิน 2MB)');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function() {
                localStorage.setItem('profile_avatar', reader.result);
                loadAvatar();
            };
            reader.readAsDataURL(file);
        }
    });
}

function loadAvatar() {
    const avatarImage = document.getElementById('avatar-image');
    const savedAvatar = localStorage.getItem('profile_avatar');
    
    if (avatarImage && savedAvatar) {
        avatarImage.style.backgroundImage = `url(${savedAvatar})`;
        // Clear default SVG icon
        avatarImage.innerHTML = '';
    }
}
