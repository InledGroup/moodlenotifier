import { MoodleApiAdapter } from './src/infrastructure/adapters/MoodleApiAdapter.js';
import { ChromeStorageAdapter } from './src/infrastructure/adapters/ChromeStorageAdapter.js';
import { Login } from './src/core/use-cases/Login.js';
import { GetPendingTasks } from './src/core/use-cases/GetPendingTasks.js';
import { ToggleTaskStatus } from './src/core/use-cases/ToggleTaskStatus.js';
import { PopupUI } from './src/ui/PopupUI.js';
import { translations } from './shared/translations.js';

class AppController {
    constructor() {
        this.ui = new PopupUI();
        this.moodleRepo = new MoodleApiAdapter();
        this.storageRepo = new ChromeStorageAdapter();
        
        this.loginUseCase = new Login(this.moodleRepo, this.storageRepo);
        this.getTasksUseCase = new GetPendingTasks(this.moodleRepo, this.storageRepo);
        this.toggleTaskUseCase = new ToggleTaskStatus(this.storageRepo);
    }

    async init() {
        this.ui.showLoader(true);
        
        const lang = await this.storageRepo.getLanguage();
        if (!lang) {
            this.ui.showLoader(false);
            this.ui.setLanguage('es'); // Default for the lang selection view
            this.ui.showView('lang');
        } else {
            this.ui.setLanguage(lang);
            await this.checkSession();
        }

        this.setupEventListeners();
    }

    async checkSession() {
        const session = await this.storageRepo.getSession();
        if (session) {
            await this.loadTasks();
        } else {
            this.ui.showLoader(false);
            this.ui.showView('login');
        }
    }

    async loadTasks() {
        this.ui.showLoader(true);
        try {
            const tasks = await this.getTasksUseCase.execute();
            this.ui.renderTasks(tasks, (id, completed) => this.toggleTaskUseCase.execute(id, completed));
            this.ui.showView('tasks');
        } catch (error) {
            console.error('Error loading tasks:', error);
            const lang = await this.storageRepo.getLanguage();
            this.ui.showView('login');
            this.ui.showLoginError(translations[lang || 'es'].load_error);
        } finally {
            this.ui.showLoader(false);
        }
    }

    setupEventListeners() {
        // Selector de Idioma
        document.getElementById('lang-es-btn').addEventListener('click', () => this.selectLanguage('es'));
        document.getElementById('lang-en-btn').addEventListener('click', () => this.selectLanguage('en'));

        // Formulario de Login
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('moodle-url').value;
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            this.ui.showLoader(true);
            try {
                await this.loginUseCase.execute(url, user, pass);
                await this.loadTasks();
            } catch (error) {
                this.ui.showLoginError(error.message);
                this.ui.showLoader(false);
            }
        });

        // Cerrar Sesión
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', async () => {
            await this.storageRepo.clearSession();
            this.ui.showView('login');
        });
    }

    async selectLanguage(lang) {
        await this.storageRepo.saveLanguage(lang);
        this.ui.setLanguage(lang);
        await this.checkSession();
    }
}

const app = new AppController();
app.init();
