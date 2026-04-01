/**
 * @interface StorageRepository
 */
export class StorageRepository {
    async saveSession(url, token) { throw new Error('Not implemented'); }
    async getSession() { throw new Error('Not implemented'); }
    async clearSession() { throw new Error('Not implemented'); }
    async saveTaskStatus(taskId, completed) { throw new Error('Not implemented'); }
    async getTasksStatus() { throw new Error('Not implemented'); }
    async saveLanguage(lang) { throw new Error('Not implemented'); }
    async getLanguage() { throw new Error('Not implemented'); }
}
