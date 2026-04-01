export class Login {
    constructor(moodleRepo, storageRepo) {
        this.moodleRepo = moodleRepo;
        this.storageRepo = storageRepo;
    }

    async execute(url, username, password) {
        // Asegurar protocolo
        let normalizedUrl = url.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
            normalizedUrl = 'https://' + normalizedUrl;
        }
        
        // Asegurar que termina con / para que new URL(relativo, base) funcione bien
        if (!normalizedUrl.endsWith('/')) {
            normalizedUrl += '/';
        }
        
        const token = await this.moodleRepo.getToken(normalizedUrl, username, password);
        await this.storageRepo.saveSession(normalizedUrl, token);
        
        return { url: normalizedUrl, token };
    }
}
