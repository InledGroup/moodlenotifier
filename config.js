// Configuración de la extensión
const EXTENSION_CONFIG = {
  id: 'moodle-notifier-v1',
  version: '1.0.0',
  updateApiUrl: 'https://extupdater.inled.es/api/updates.json',
  updateCheckInterval: 60 // Verificar cada 1 horas (en minutos)
};

// Exportar para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EXTENSION_CONFIG;
}
