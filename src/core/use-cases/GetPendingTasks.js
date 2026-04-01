import { Task } from '../entities/Task.js';

export class GetPendingTasks {
    constructor(moodleRepo, storageRepo) {
        this.moodleRepo = moodleRepo;
        this.storageRepo = storageRepo;
    }

    async execute() {
        const session = await this.storageRepo.getSession();
        if (!session) return [];

        const [remoteTasks, tasksStatus] = await Promise.all([
            this.moodleRepo.getPendingTasks(session.url, session.token),
            this.storageRepo.getTasksStatus()
        ]);

        return remoteTasks.map(taskData => {
            return new Task({
                ...taskData,
                completed: !!tasksStatus[taskData.id]
            });
        });
    }
}
