// TaskFlow Pro Routing + Auth + Tasks
const STORAGE_USERS = 'taskflow_users';
const STORAGE_SESSION = 'taskflow_session';
const STORAGE_TASKS_PREFIX = 'taskflow_tasks_';
const STORAGE_THEME = 'taskflow_theme';
const STORAGE_REMINDERS = 'taskflow_reminders';
const STORAGE_REMINDER_SETTINGS = 'taskflow_reminder_settings';
const API_BASE_URL = 'http://localhost:3000';

let currentUser = null;
let tasks = [];
let currentFilter = 'all';
let currentPriority = 'low';
let editPriority = 'low';
let editingTaskId = null;
let currentPage = 'tasks';
let emailRemindersEnabled = true;

// Loader utilities using TodoLoader
function showTaskLoader() {
    showLoader('tasks', 'Loading tasks...');
}

function hideTaskLoader() {
    hideLoader('tasks');
}

function showSectionLoader(section, message) {
    showLoader(section, message || 'Loading...');
}

function hideSectionLoader(section) {
    hideLoader(section);
}

window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', () => {
    // Initialize todo loaders
    initializeLoaders();
    
    loadTheme();
    loadSession();
    displayDate();
    setupKeyboardShortcuts();
    loadReminderSettings();
    handleRoute();

    // Hide loader
    setTimeout(() => {
        const loader = document.getElementById('app-loader');
        if (loader) loader.classList.add('hidden');
    }, 800);
});

function navigate(hash) { window.location.hash = hash; }

function handleRoute() {
    const hash = window.location.hash || '#/login';
    const loggedIn = !!currentUser;
    const loginView = document.getElementById('view-login');
    const signupView = document.getElementById('view-signup');
    const appView = document.getElementById('view-app');
    const navbar = document.getElementById('app-navbar');
    const isWorkspace = window.location.pathname.includes('workspace.html');

    if (loginView) loginView.classList.add('hidden');
    if (signupView) signupView.classList.add('hidden');
    if (appView) appView.classList.add('hidden');
    if (navbar) navbar.classList.add('hidden');

    if (!loggedIn) {
        document.body.classList.remove('bg-home', 'bg-tasks', 'bg-analytics', 'bg-settings');
        document.body.classList.add('bg-auth');

        if (isWorkspace) {
            // Redirect to login page with return URL
            const returnHash = window.location.hash;
            window.location.href = 'todo.html?returnTo=' + encodeURIComponent(returnHash) + '#/login';
            return;
        }
        if (hash.startsWith('#/app')) {
            navigate('#/login');
            showInfoToast('Please sign in to access your tasks.');
            updateUserNav();
            return;
        }
    }

    if (loggedIn && (hash === '#/login' || hash === '#/signup')) {
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get('returnTo');
        if (returnTo) {
            window.location.href = 'workspace.html' + returnTo;
            return;
        }
        navigate('#/app/home');
        updateUserNav();
        return;
    }

    if (hash === '#/signup') {
        if (signupView) signupView.classList.remove('hidden');
    } else if (hash.startsWith('#/app')) {
        if (appView) appView.classList.remove('hidden');
        if (navbar) navbar.classList.remove('hidden');

        // Handle app sub-routes
        if (hash === '#/app/tasks') {
            if (!isWorkspace) {
                window.location.href = 'workspace.html#/app/tasks';
                return;
            }
            showPage('tasks');
        } else if (hash === '#/app/analytics') {
            if (!isWorkspace) {
                window.location.href = 'workspace.html#/app/analytics';
                return;
            }
            showPage('analytics');
        } else if (hash === '#/app/settings') {
            if (!isWorkspace) {
                window.location.href = 'workspace.html#/app/settings';
                return;
            }
            showPage('settings');
        } else {
            if (isWorkspace) {
                window.location.href = 'todo.html#/app/home';
                return;
            }
            showPage('home');
        }

        loadTasksForUser();
    } else {
        if (loginView) loginView.classList.remove('hidden');
    }

    updateUserNav();
    updateGreeting();
}

function showPage(page) {
    currentPage = page;

    // Update background
    document.body.classList.remove('bg-home', 'bg-tasks', 'bg-analytics', 'bg-settings', 'bg-auth');
    document.body.classList.add(`bg-${page}`);

    const pages = ['home', 'tasks', 'analytics', 'settings'];
    pages.forEach(p => {
        const el = document.getElementById(`page-${p}`);
        if (el) el.classList.toggle('hidden', p !== page);
    });

    // Update navbar active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Update page-specific content with loaders
    if (page === 'analytics') {
        showSectionLoader('analytics', 'Calculating analytics...');
        setTimeout(() => {
            updateAnalytics();
            hideSectionLoader('analytics');
        }, 400);
    }
    if (page === 'settings') {
        showSectionLoader('settings', 'Loading settings...');
        setTimeout(() => {
            updateSettings();
            hideSectionLoader('settings');
        }, 300);
    }
    if (page === 'home') {
        showSectionLoader('home', 'Loading dashboard...');
        setTimeout(() => {
            updateHome();
            hideSectionLoader('home');
        }, 350);
    }
    if (page === 'tasks') {
        showTaskLoader();
        setTimeout(() => {
            renderTasks();
        }, 300);
    }
}

function updateUserNav() {
    const whenAuth = document.getElementById('user-info-when-auth');
    const whenGuest = document.getElementById('user-info-when-guest');
    if (currentUser) {
        whenAuth.classList.remove('hidden');
        whenGuest.classList.add('hidden');
        document.getElementById('nav-username').textContent = currentUser.name;
        document.getElementById('nav-avatar').textContent = (currentUser.name || '?').charAt(0).toUpperCase();
    } else {
        whenAuth.classList.add('hidden');
        whenGuest.classList.remove('hidden');
    }
}

function updateGreeting() {
    if (!currentUser) return;
    const name = (currentUser.name || 'there').split(' ')[0];
    document.getElementById('app-greeting').textContent = `Hi, ${name} 👋`;
}

function getUsers() { return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]'); }
function saveUsers(users) { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }
function loadSession() {
    const session = JSON.parse(localStorage.getItem(STORAGE_SESSION) || 'null');
    if (session) {
        const user = getUsers().find(u => u.email === session.email);
        if (user) { currentUser = user; loadTasksForUser(); }
        else localStorage.removeItem(STORAGE_SESSION);
    }
}
function saveSession(remember) {
    if (!currentUser) return;
    if (remember) localStorage.setItem(STORAGE_SESSION, JSON.stringify({ email: currentUser.email }));
    else localStorage.removeItem(STORAGE_SESSION);
}
function logout() { currentUser = null; tasks = []; localStorage.removeItem(STORAGE_SESSION); showInfoToast('Signed out.'); navigate('#/login'); }

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value.trim();
    if (!name || !email || !password) return;
    if (password.length < 6) { showErrorToast('Password must be at least 6 characters.'); return; }
    const users = getUsers();
    if (users.some(u => u.email === email)) { showErrorToast('Account already exists for that email.'); return; }
    const user = { name, email, password }; users.push(user); saveUsers(users);
    currentUser = user; saveSession(true); showSuccessToast('Account created.');

    // Check for returnTo param
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get('returnTo');
    if (returnTo) {
        window.location.href = 'workspace.html' + returnTo;
    } else {
        navigate('#/app/home');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value.trim();
    const remember = document.getElementById('remember-me').checked;

    const users = getUsers();
    if (users.length === 0) {
        showErrorToast('No accounts found. Please create an account.');
        return;
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        // Debug help
        console.log('Login failed for:', email);
        console.log('Available users:', users.map(u => u.email));
        showErrorToast('Invalid email or password.');
        return;
    }
    currentUser = user; saveSession(remember); showSuccessToast('Signed in.');

    // Check for returnTo param
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get('returnTo');
    if (returnTo) {
        window.location.href = 'workspace.html' + returnTo;
    } else {
        navigate('#/app/home');
    }
}

function storageKeyForCurrentUser() { return currentUser ? STORAGE_TASKS_PREFIX + currentUser.email : null; }
function loadTasksForUser() {
    const key = storageKeyForCurrentUser();
    if (!key) return;
    // Show per-task list loader while reading from storage
    showTaskLoader();
    // Simulate short async file read to make loader visible for UX
    setTimeout(() => {
        tasks = JSON.parse(localStorage.getItem(key) || '[]');
        renderTasks();
    }, 150);
}
function saveTasksForUser() { const key = storageKeyForCurrentUser(); if (!key) return; localStorage.setItem(key, JSON.stringify(tasks)); }

// Tasks
function displayDate() { const el = document.getElementById('current-date'); if (!el) return; el.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }); }
function setupKeyboardShortcuts() { const t = document.getElementById('task-input'); if (t) { t.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); }); } const eI = document.getElementById('edit-input'); if (eI) { eI.addEventListener('keypress', e => { if (e.key === 'Enter') saveEdit(); }); } document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); }); }
function setPriority(p) { currentPriority = p; document.querySelectorAll('.priority-selector:not(#edit-priority-selector) .priority-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.priority === p)); }
function setEditPriority(p) { editPriority = p; document.querySelectorAll('#edit-priority-selector .priority-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.priority === p)); }
function addTask() {
    if (!currentUser) { showInfoToast('Please sign in to add tasks.'); navigate('#/login'); return; }
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    const start = document.getElementById('task-start').value;
    const end = document.getElementById('task-end').value;

    if (!text) { showErrorToast('Please enter a task.'); input.focus(); return; }
    const task = {
        id: Date.now(),
        text,
        completed: false,
        priority: currentPriority,
        createdAt: new Date().toISOString(),
        startDate: start,
        endDate: end,
        reminderSent: false
    };
    tasks.unshift(task);
    saveTasksForUser();

    // Schedule reminder if end date is set
    if (end) {
        scheduleTaskReminder(task);
    }

    // Show loader while rendering update
    showTaskLoader();
    setTimeout(() => {
        renderTasks();
        showSuccessToast('Task added.');
    }, 200);
    input.value = '';
    document.getElementById('task-start').value = '';
    document.getElementById('task-end').value = '';
}
function toggleTask(id) {
    showTaskLoader();
    tasks = tasks.map(t => {
        if (t.id === id) {
            const wasCompleted = t.completed;
            t.completed = !t.completed;
            if (t.completed && !wasCompleted) {
                t.completedAt = new Date().toISOString();
            }
        }
        return t;
    });
    saveTasksForUser();
    setTimeout(() => renderTasks(), 150);
}
function deleteTask(id, event) {
    event.stopPropagation();
    showTaskLoader();
    tasks = tasks.filter(t => t.id !== id);
    saveTasksForUser();
    setTimeout(() => {
        renderTasks();
        showInfoToast('Task deleted.');
    }, 150);
}
function editTask(id, event) {
    event.stopPropagation();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    editPriority = task.priority || 'low';
    const input = document.getElementById('edit-input');
    input.value = task.text;
    document.getElementById('edit-start').value = task.startDate || '';
    document.getElementById('edit-end').value = task.endDate || '';
    document.querySelectorAll('#edit-priority-selector .priority-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.priority === editPriority));
    document.getElementById('edit-modal').classList.add('active');
    input.focus();
}
function saveEdit() {
    if (editingTaskId == null) return;
    const input = document.getElementById('edit-input');
    const text = input.value.trim();
    const start = document.getElementById('edit-start').value;
    const end = document.getElementById('edit-end').value;

    if (!text) { showErrorToast('Task cannot be empty.'); return; }
    // Show loader during update
    showTaskLoader();
    tasks = tasks.map(t => t.id === editingTaskId ? { ...t, text, priority: editPriority, startDate: start, endDate: end } : t);
    saveTasksForUser();
    setTimeout(() => {
        renderTasks();
        closeModal();
        showSuccessToast('Task updated.');
    }, 150);
}
function closeModal() { document.getElementById('edit-modal').classList.remove('active'); editingTaskId = null; }
function clearCompleted() {
    const c = tasks.filter(t => t.completed).length;
    if (c === 0) { showInfoToast('No completed tasks to clear.'); return; }
    showTaskLoader();
    tasks = tasks.filter(t => !t.completed);
    saveTasksForUser();
    setTimeout(() => {
        renderTasks();
        showSuccessToast(`Cleared ${c} task${c > 1 ? 's' : ''}.`);
    }, 200);
}
function filterTasks(f) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.textContent.toLowerCase() === f));
    showTaskLoader();
    setTimeout(() => renderTasks(), 150);
}
function renderTasks() {
    const list = document.getElementById('task-list'); if (!list) return; let filtered = tasks; if (currentFilter === 'pending') filtered = tasks.filter(t => !t.completed); else if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);
    const total = tasks.length; const pending = tasks.filter(t => !t.completed).length; const done = total - pending;
    document.getElementById('total-count').textContent = total;
    document.getElementById('pending-count').textContent = pending;
    document.getElementById('done-count').textContent = done;
    document.getElementById('footer-pending').textContent = pending;
    list.innerHTML = '';
    if (!filtered.length) {
        list.innerHTML = '<div class="empty-state">No ' + (currentFilter === 'all' ? '' : currentFilter + ' ') + 'tasks yet.</div>';
        // Hide loader when empty
        hideTaskLoader();
        return;
    }
    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority || 'low'}${task.completed ? ' completed' : ''}`;

        let dateHtml = `<span><i class="far fa-calendar"></i> ${new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`;
        if (task.startDate) {
            dateHtml += `<span><i class="fas fa-hourglass-start"></i> ${new Date(task.startDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>`;
        }
        if (task.endDate) {
            dateHtml += `<span><i class="fas fa-hourglass-end"></i> ${new Date(task.endDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>`;
        }

        li.innerHTML = `
      <div class="checkbox-wrapper" onclick="toggleTask(${task.id})">
        <div class="custom-checkbox">${task.completed ? '<i class=\"fas fa-check\"></i>' : ''}</div>
      </div>
      <div class="task-content" onclick="toggleTask(${task.id})">
        <div class="task-text">${escapeHtml(task.text)}</div>
        <div class="task-meta">
          <div class="task-dates">${dateHtml}</div>
          <span class="priority-badge ${task.priority || 'low'}">${task.priority || 'low'}</span>
        </div>
      </div>
      <div class="actions">
        <button class="action-btn edit-btn" onclick="editTask(${task.id}, event)"><i class="fas fa-pen"></i></button>
        <button class="action-btn delete-btn" onclick="deleteTask(${task.id}, event)"><i class="fas fa-trash"></i></button>
      </div>`;
        list.appendChild(li);
    });
    // Hide loader after rendering
    hideTaskLoader();
}

// Toasts
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    msg.textContent = message; toast.className = 'toast ' + type;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    icon.className = 'fas ' + (icons[type] || icons.info);
    toast.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}
const showSuccessToast = (m) => showToast(m, 'success');
const showErrorToast = (m) => showToast(m, 'error');
const showInfoToast = (m) => showToast(m, 'info');

// Per-page (tasks list) loader helpers
function showTaskLoader() {
    const el = document.getElementById('task-list-loader');
    if (el) el.classList.remove('hidden');
}

function hideTaskLoader() {
    const el = document.getElementById('task-list-loader');
    if (el) el.classList.add('hidden');
}

// Util
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// Theme Management
function loadTheme() {
    const theme = localStorage.getItem(STORAGE_THEME) || 'dark';
    setTheme(theme);
}

function toggleTheme() {
    const current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    const body = document.body;
    const mainBtn = document.getElementById('theme-toggle-btn');
    const tasksBtn = document.getElementById('theme-toggle-btn-tasks');
    const analyticsBtn = document.getElementById('theme-toggle-btn-analytics');
    const settingsBtn = document.getElementById('theme-toggle-btn-settings');

    if (theme === 'light') {
        body.classList.add('light-theme');
        if (mainBtn) mainBtn.innerHTML = '<i class="fas fa-sun"></i>';
        if (tasksBtn) tasksBtn.innerHTML = '<i class="fas fa-sun"></i>';
        if (analyticsBtn) analyticsBtn.innerHTML = '<i class="fas fa-sun"></i>';
        if (settingsBtn) settingsBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        body.classList.remove('light-theme');
        if (mainBtn) mainBtn.innerHTML = '<i class="fas fa-moon"></i>';
        if (tasksBtn) tasksBtn.innerHTML = '<i class="fas fa-moon"></i>';
        if (analyticsBtn) analyticsBtn.innerHTML = '<i class="fas fa-moon"></i>';
        if (settingsBtn) settingsBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }

    localStorage.setItem(STORAGE_THEME, theme);

    // Update settings UI
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === theme);
    });
}

// Analytics
function updateAnalytics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('completion-rate').textContent = completionRate + '%';
    document.getElementById('total-completed').textContent = completed;

    // Calculate Avg. Tasks/Day: average completed tasks per day since first task
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);
    let avgPerDay = 0;
    if (completedTasks.length > 0) {
        const firstTaskDate = new Date(Math.min(...tasks.map(t => new Date(t.createdAt))));
        const now = new Date();
        const daysDiff = Math.max(1, Math.ceil((now - firstTaskDate) / (1000 * 60 * 60 * 24)));
        avgPerDay = Math.round(completed / daysDiff);
    }
    document.getElementById('avg-per-day').textContent = avgPerDay;

    // Calculate Day Streak: current consecutive days with at least one completion
    const streakDays = calculateCurrentStreak();
    document.getElementById('streak-days').textContent = streakDays;

    // Priority distribution
    const low = tasks.filter(t => t.priority === 'low').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const high = tasks.filter(t => t.priority === 'high').length;

    const lowPercent = total > 0 ? (low / total) * 100 : 0;
    const mediumPercent = total > 0 ? (medium / total) * 100 : 0;
    const highPercent = total > 0 ? (high / total) * 100 : 0;

    document.getElementById('low-bar').style.width = lowPercent + '%';
    document.getElementById('medium-bar').style.width = mediumPercent + '%';
    document.getElementById('high-bar').style.width = highPercent + '%';

    document.getElementById('low-count').textContent = low;
    document.getElementById('medium-count').textContent = medium;
    document.getElementById('high-count').textContent = high;
}

function calculateCurrentStreak() {
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);
    if (completedTasks.length === 0) return 0;

    // Get unique completion dates (YYYY-MM-DD)
    const completionDates = [...new Set(completedTasks.map(t => new Date(t.completedAt).toISOString().split('T')[0]))];
    completionDates.sort();

    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date(today);

    // Check backwards from today
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (completionDates.includes(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// Settings
function updateSettings() {
    if (currentUser) {
        document.getElementById('user-email').textContent = currentUser.email;
    }
}

function updateHome() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('home-total-tasks').textContent = total;
    document.getElementById('home-completed-tasks').textContent = completed;
    document.getElementById('home-pending-tasks').textContent = pending;
}

function clearAllData() {
    if (confirm('Are you sure? This will delete all your tasks permanently!')) {
        const key = storageKeyForCurrentUser();
        if (key) localStorage.removeItem(key);
        tasks = [];
        showTaskLoader();
        renderTasks();
        showSuccessToast('All tasks cleared.');
    }
}

// Email Reminder Functions
async function scheduleTaskReminder(task) {
    if (!currentUser || !task.endDate || !emailRemindersEnabled) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule-reminder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                taskText: task.text,
                dueDate: task.endDate,
                userName: currentUser.name
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Reminder scheduled:', data);
            // Store reminder info locally
            saveReminderSchedule(task.id, true);
        } else {
            console.error('Failed to schedule reminder');
        }
    } catch (error) {
        console.error('Error scheduling reminder:', error);
    }
}

async function sendTaskReminder(task) {
    if (!currentUser || task.reminderSent) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/send-reminder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                taskText: task.text,
                dueDate: task.endDate,
                userName: currentUser.name
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Reminder sent:', data);
            // Mark task reminder as sent
            tasks = tasks.map(t => t.id === task.id ? { ...t, reminderSent: true } : t);
            saveTasksForUser();
            showSuccessToast('Task reminder sent to your email!');
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
    }
}

function saveReminderSchedule(taskId, scheduled) {
    const reminders = JSON.parse(localStorage.getItem(STORAGE_REMINDERS) || '{}');
    reminders[taskId] = { scheduled, scheduledAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_REMINDERS, JSON.stringify(reminders));
}

// Reminder Settings Management
function loadReminderSettings() {
    const settings = JSON.parse(localStorage.getItem(STORAGE_REMINDER_SETTINGS) || '{"emailReminders": true}');
    emailRemindersEnabled = settings.emailReminders !== false;

    const toggle = document.getElementById('email-reminders-toggle');
    if (toggle) {
        toggle.checked = emailRemindersEnabled;
        toggle.addEventListener('change', toggleReminderSettings);
    }
}

function toggleReminderSettings(e) {
    emailRemindersEnabled = e.target.checked;
    const settings = { emailReminders: emailRemindersEnabled };
    localStorage.setItem(STORAGE_REMINDER_SETTINGS, JSON.stringify(settings));

    const message = emailRemindersEnabled ? 'Email reminders enabled' : 'Email reminders disabled';
    showInfoToast(message);
}

function showReminderInfo() {
    const modal = document.getElementById('reminder-info-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeReminderInfo() {
    const modal = document.getElementById('reminder-info-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function closeBanner() {
    const banner = document.getElementById('reminder-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

