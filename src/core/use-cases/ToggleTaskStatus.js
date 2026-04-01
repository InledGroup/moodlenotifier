export class ToggleTaskStatus {
    constructor(storageRepo) {
        this.storageRepo = storageRepo;
    }

    async execute(taskId, completed) {
        await this.storageRepo.saveTaskStatus(taskId, completed);
    }
}
