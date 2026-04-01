import { translations } from '../../shared/translations.js';

export class PopupUI {
    constructor() {
        this.loader = document.getElementById('loader');
        this.langView = document.getElementById('lang-view');
        this.loginView = document.getElementById('login-view');
        this.tasksView = document.getElementById('tasks-view');
        this.tasksList = document.getElementById('tasks-list');
        this.emptyTasks = document.getElementById('empty-tasks');
        this.loginError = document.getElementById('login-error');
        this.currentLang = 'es';
    }

    setLanguage(lang) {
        this.currentLang = lang;
        this.updateStaticText();
    }

    updateStaticText() {
        const t = translations[this.currentLang];
        
        // Loader
        document.getElementById('loading-text').textContent = t.loading_tasks;

        // Language view
        document.getElementById('lang-title').textContent = t.select_lang;
        document.getElementById('lang-es-btn').textContent = t.lang_es;
        document.getElementById('lang-en-btn').textContent = t.lang_en;

        // Login view
        document.getElementById('label-url').textContent = t.moodle_url;
        document.getElementById('label-user').textContent = t.username;
        document.getElementById('label-pass').textContent = t.password;
        document.getElementById('login-btn').textContent = t.login_btn;

        // Tasks view
        document.getElementById('tasks-title').textContent = t.tasks_title;
        document.getElementById('logout-btn').textContent = t.logout_btn;
        document.getElementById('empty-msg').textContent = t.empty_tasks;
    }

    showLoader(show) {
        this.loader.style.display = show ? 'flex' : 'none';
    }

    showView(viewName) {
        this.langView.style.display = viewName === 'lang' ? 'block' : 'none';
        this.loginView.style.display = viewName === 'login' ? 'block' : 'none';
        this.tasksView.style.display = viewName === 'tasks' ? 'block' : 'none';
    }

    showLoginError(message) {
        const t = translations[this.currentLang];
        this.loginError.textContent = t.login_error + message;
        this.loginError.style.display = 'block';
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    renderTasks(tasks, onToggle) {
        this.tasksList.innerHTML = '';
        if (tasks.length === 0) {
            this.emptyTasks.style.display = 'block';
            return;
        }

        this.emptyTasks.style.display = 'none';

        // Ordenar: pendientes primero, completadas al final
        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.completed === b.completed) {
                return a.dueDate - b.dueDate; // Ordenar por fecha dentro del mismo estado
            }
            return a.completed ? 1 : -1;
        });

        sortedTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-card ${task.completed ? 'completed' : ''}`;
            li.style.animationDelay = `${index * 0.05}s`;
            
            const dateStr = task.dueDate.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            const escapedName = this.escapeHTML(task.name);
            const escapedCourse = this.escapeHTML(task.course);

            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-info">
                    <div class="task-name">${escapedName}</div>
                    <div class="task-course">${escapedCourse}</div>
                    <div class="task-date">📅 ${dateStr}</div>
                </div>
            `;

            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => {
                task.toggle();
                // Notificar el cambio
                onToggle(task.id, task.completed);
                // Volver a renderizar para que se mueva de posición
                this.renderTasks(tasks, onToggle);
            });

            this.tasksList.appendChild(li);
        });
    }
}
