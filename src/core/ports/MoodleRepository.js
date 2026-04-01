/**
 * @interface MoodleRepository
 */
export class MoodleRepository {
    async getToken(url, username, password) { throw new Error('Not implemented'); }
    async getPendingTasks(url, token) { throw new Error('Not implemented'); }
}
