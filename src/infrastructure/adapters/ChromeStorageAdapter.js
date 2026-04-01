import { StorageRepository } from '../../core/ports/StorageRepository.js';

export class ChromeStorageAdapter extends StorageRepository {
    async saveSession(url, token) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ moodle_url: url, moodle_token: token }, resolve);
        });
    }

    async getSession() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['moodle_url', 'moodle_token'], (result) => {
                if (result.moodle_url && result.moodle_token) {
                    resolve({ url: result.moodle_url, token: result.moodle_token });
                } else {
                    resolve(null);
                }
            });
        });
    }

    async clearSession() {
        return new Promise((resolve) => {
            chrome.storage.local.remove(['moodle_url', 'moodle_token'], resolve);
        });
    }

    async saveTaskStatus(taskId, completed) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['tasks_status'], (result) => {
                const status = result.tasks_status || {};
                status[taskId] = completed;
                chrome.storage.local.set({ tasks_status: status }, resolve);
            });
        });
    }

    async getTasksStatus() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['tasks_status'], (result) => {
                resolve(result.tasks_status || {});
            });
        });
    }

    async saveLanguage(lang) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ language: lang }, resolve);
        });
    }

    async getLanguage() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['language'], (result) => {
                resolve(result.language || null);
            });
        });
    }
}
