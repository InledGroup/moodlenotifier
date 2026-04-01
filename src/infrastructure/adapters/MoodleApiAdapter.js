import { MoodleRepository } from '../../core/ports/MoodleRepository.js';

export class MoodleApiAdapter extends MoodleRepository {
    async getToken(baseUrl, username, password) {
        try {
            const url = new URL('login/token.php', baseUrl);
            url.searchParams.append('username', username);
            url.searchParams.append('password', password);
            url.searchParams.append('service', 'moodle_mobile_app');

            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`Servidor respondió con código ${response.status}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Error parseando JSON. Respuesta del servidor:', text);
                throw new Error('La respuesta de Moodle no es un JSON válido (posible error de PHP o URL incorrecta).');
            }

            if (data.error) {
                throw new Error(data.error);
            }

            return data.token;
        } catch (error) {
            console.error('Fetch error (getToken):', error);
            throw error;
        }
    }

    async getPendingTasks(baseUrl, token) {
        try {
            const url = new URL('webservice/rest/server.php', baseUrl);
            url.searchParams.append('wstoken', token);
            url.searchParams.append('wsfunction', 'core_calendar_get_action_events_by_timesort');
            url.searchParams.append('moodlewsrestformat', 'json');
            
            // Solo tareas desde "ahora" (en segundos)
            const now = Math.floor(Date.now() / 1000);
            url.searchParams.append('timesortfrom', now);

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`Servidor respondió con código ${response.status}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Error parseando JSON (tasks). Respuesta del servidor:', text);
                throw new Error('Error al leer las tareas de Moodle.');
            }

            if (data.exception) {
                throw new Error(data.message);
            }

            return (data.events || []).map(event => ({
                id: event.id,
                name: event.name,
                course: event.course.fullname,
                dueDate: new Date(event.timesort * 1000),
                url: event.url
            }));
        } catch (error) {
            console.error('Fetch error (tasks):', error);
            throw error;
        }
    }
}
