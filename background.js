// Service Worker para la extensión Moodle Notifier

// Configuración de la extensión
const EXTENSION_CONFIG = {
  id: 'moodle-notifier-v1',
  version: '1.0.0',
  updateApiUrl: 'https://extupdater.inled.es/api/updates.json',
  updateCheckInterval: 24 * 60 // Verificar cada 24 horas (en minutos)
};

// Ejecutar al instalar la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log('Moodle Notifier instalado');

  // Crear alarma para verificar tareas cada 5 minutos
  chrome.alarms.create('checkTasks', { periodInMinutes: 5 });

  // Crear alarma para verificar actualizaciones cada 24 horas
  chrome.alarms.create('checkUpdates', { periodInMinutes: EXTENSION_CONFIG.updateCheckInterval });

  // Verificar actualizaciones inmediatamente después de instalar
  checkForUpdates();
});

// Ejecutar al iniciar Chrome
chrome.runtime.onStartup.addListener(async () => {
  console.log('Chrome iniciado - verificando tareas de Moodle');

  // Verificar actualizaciones al iniciar
  checkForUpdates();

  // Verificar si hay configuración
  const config = await chrome.storage.local.get(['moodleUrl', 'token']);

  if (config.moodleUrl && config.token) {
    // Abrir el popup en una nueva ventana o pestaña
    chrome.action.openPopup().catch(() => {
      // Si no se puede abrir el popup directamente, abrir en una ventana
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 440,
        height: 600
      });
    });

    // Verificar tareas
    checkAndNotifyTasks();
  }
});

// Escuchar alarmas
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkTasks') {
    checkAndNotifyTasks();
  } else if (alarm.name === 'checkUpdates') {
    checkForUpdates();
  } else if (alarm.name.startsWith('snooze_')) {
    const taskId = parseInt(alarm.name.replace('snooze_', ''));
    showSnoozeNotification(taskId);
  }
});

// Escuchar mensajes desde popup y otras partes de la extensión
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTasks') {
    getTasks().then(tasks => {
      sendResponse({ tasks });
    });
    return true; // Mantener el canal abierto para respuesta asíncrona
  } else if (request.action === 'snoozeTask') {
    snoozeTask(request.taskId).then(snoozeUntil => {
      sendResponse({ success: true, snoozeUntil });
    });
    return true;
  } else if (request.action === 'checkUpdates') {
    checkForUpdates().then(updateInfo => {
      sendResponse(updateInfo);
    });
    return true;
  } else if (request.action === 'getUpdateInfo') {
    chrome.storage.local.get(['updateAvailable']).then(result => {
      sendResponse(result.updateAvailable || null);
    });
    return true;
  }
});

// Función principal para verificar y notificar tareas
async function checkAndNotifyTasks() {
  const config = await chrome.storage.local.get(['moodleUrl', 'token']);

  if (!config.moodleUrl || !config.token) {
    console.log('No hay configuración de Moodle');
    return;
  }

  const tasks = await getTasks();
  const { dismissedTasks = [], snoozedTasks = {} } = await chrome.storage.local.get(['dismissedTasks', 'snoozedTasks']);

  const now = Date.now();
  const dismissedSet = new Set(dismissedTasks);

  // Filtrar tareas que no han sido descartadas y no están pospuestas
  const tasksToNotify = tasks.filter(task => {
    if (dismissedSet.has(task.id)) return false;
    if (snoozedTasks[task.id] && snoozedTasks[task.id] > now) return false;
    return true;
  });

  // Si hay tareas pendientes, abrir el popup y reproducir sonido
  if (tasksToNotify.length > 0) {
    openPopupWithSound();
  }
}

// Abrir popup y reproducir sonido
async function openPopupWithSound() {
  // Intentar abrir el popup
  chrome.action.openPopup().catch(() => {
    // Si no se puede abrir el popup directamente, abrir en una ventana
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 440,
      height: 600
    });
  });

  // Enviar mensaje al popup para reproducir el sonido
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: 'playNotificationSound' }).catch(err => {
      console.log('No se pudo enviar mensaje al popup:', err);
    });
  }, 500);
}

// Obtener tareas pendientes desde Moodle
async function getTasks() {
  const config = await chrome.storage.local.get(['moodleUrl', 'token']);

  if (!config.moodleUrl || !config.token) {
    return [];
  }

  try {
    // Usar la API de Moodle para obtener tareas pendientes
    const wsFunction = 'mod_assign_get_assignments';
    const url = `${config.moodleUrl}/webservice/rest/server.php?wstoken=${config.token}&wsfunction=${wsFunction}&moodlewsrestformat=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.courses) {
      const allAssignments = [];

      // Recorrer todos los cursos y sus asignaciones
      data.courses.forEach(course => {
        if (course.assignments) {
          course.assignments.forEach(assignment => {
            // Solo incluir tareas con fecha de entrega futura
            if (assignment.duedate && assignment.duedate > Date.now() / 1000) {
              allAssignments.push({
                id: assignment.id,
                cmid: assignment.cmid,
                name: assignment.name,
                coursename: course.fullname,
                timedue: assignment.duedate,
                url: `${config.moodleUrl}/mod/assign/view.php?id=${assignment.cmid}`
              });
            }
          });
        }
      });

      // Ordenar por fecha de entrega
      allAssignments.sort((a, b) => a.timedue - b.timedue);

      return allAssignments;
    }

    return [];
  } catch (error) {
    console.error('Error al obtener tareas:', error);

    // Intentar con otro endpoint
    try {
      const wsFunction = 'core_calendar_get_action_events_by_timesort';
      const timesortfrom = Math.floor(Date.now() / 1000);
      const timesortto = timesortfrom + (30 * 24 * 60 * 60); // 30 días

      const url = `${config.moodleUrl}/webservice/rest/server.php?wstoken=${config.token}&wsfunction=${wsFunction}&moodlewsrestformat=json&timesortfrom=${timesortfrom}&timesortto=${timesortto}&limitnum=50`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.events) {
        return data.events.map(event => ({
          id: event.id,
          cmid: event.instance,
          name: event.name,
          coursename: event.course ? event.course.fullname : 'Curso',
          timedue: event.timesort,
          url: event.url
        }));
      }
    } catch (error2) {
      console.error('Error con endpoint alternativo:', error2);
    }

    return [];
  }
}

// Posponer tarea por 20 minutos
async function snoozeTask(taskId) {
  const { snoozedTasks = {} } = await chrome.storage.local.get(['snoozedTasks']);

  const snoozeUntil = Date.now() + (20 * 60 * 1000); // 20 minutos
  snoozedTasks[taskId] = snoozeUntil;

  await chrome.storage.local.set({ snoozedTasks });

  // Crear alarma para recordar en 20 minutos
  chrome.alarms.create(`snooze_${taskId}`, { delayInMinutes: 20 });

  return snoozeUntil;
}

// Mostrar notificación después de posponer
async function showSnoozeNotification(taskId) {
  const tasks = await getTasks();
  const task = tasks.find(t => t.id === taskId);

  if (task) {
    // Limpiar el snooze
    const { snoozedTasks = {} } = await chrome.storage.local.get(['snoozedTasks']);
    delete snoozedTasks[taskId];
    await chrome.storage.local.set({ snoozedTasks });

    // Abrir popup y reproducir sonido
    openPopupWithSound();
  }
}

// Marcar tarea como vista
async function dismissTask(taskId) {
  const { dismissedTasks = [] } = await chrome.storage.local.get(['dismissedTasks']);

  if (!dismissedTasks.includes(taskId)) {
    dismissedTasks.push(taskId);
    await chrome.storage.local.set({ dismissedTasks });
  }
}

// Abrir tarea desde notificación
async function openTaskFromNotification(taskId) {
  const tasks = await getTasks();
  const task = tasks.find(t => t.id === taskId);

  if (task && task.url) {
    chrome.tabs.create({ url: task.url });
  }
}

// ==================== SISTEMA DE ACTUALIZACIONES ====================

// Verificar si hay actualizaciones disponibles
async function checkForUpdates() {
  try {
    console.log('Verificando actualizaciones...');

    const response = await fetch(EXTENSION_CONFIG.updateApiUrl);

    if (!response.ok) {
      console.error('Error al verificar actualizaciones:', response.status);
      return { available: false, error: 'Error al conectar con el servidor de actualizaciones' };
    }

    const updates = await response.json();

    // Buscar actualización para esta extensión
    const updateInfo = updates.find(update => update.id === EXTENSION_CONFIG.id);

    if (updateInfo && updateInfo.url) {
      console.log('Actualización encontrada:', updateInfo);

      // Guardar información de actualización
      await chrome.storage.local.set({
        updateAvailable: {
          available: true,
          url: updateInfo.url,
          version: updateInfo.version || 'más nueva',
          checkedAt: Date.now()
        }
      });

      return {
        available: true,
        url: updateInfo.url,
        version: updateInfo.version
      };
    } else {
      console.log('No hay actualizaciones disponibles');

      // Limpiar información de actualización anterior
      await chrome.storage.local.set({
        updateAvailable: {
          available: false,
          checkedAt: Date.now()
        }
      });

      return { available: false };
    }
  } catch (error) {
    console.error('Error al verificar actualizaciones:', error);
    return { available: false, error: error.message };
  }
}

// Comparar versiones (opcional, para mejorar la lógica)
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}
