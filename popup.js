document.addEventListener('DOMContentLoaded', async () => {
  const configSection = document.getElementById('config-section');
  const tasksSection = document.getElementById('tasks-section');
  const allTasksSection = document.getElementById('all-tasks-section');
  const configForm = document.getElementById('config-form');
  const statusMessage = document.getElementById('status-message');
  const tasksList = document.getElementById('tasks-list');
  const allTasksList = document.getElementById('all-tasks-list');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const menuRefreshBtn = document.getElementById('menu-refresh-btn');
  const menuAllTasksBtn = document.getElementById('menu-all-tasks-btn');
  const menuConfigBtn = document.getElementById('menu-config-btn');
  const backToPendingBtn = document.getElementById('back-to-pending-btn');
  const notificationSound = document.getElementById('notification-sound');
  const updateBanner = document.getElementById('update-banner');
  const updateDownloadBtn = document.getElementById('update-download-btn');
  const updateDismissBtn = document.getElementById('update-dismiss-btn');

  let snoozedTasks = {};
  let snoozedIntervals = {};

  // Verificar actualizaciones disponibles
  checkForUpdates();

  // Cargar configuración existente
  const config = await chrome.storage.local.get(['moodleUrl', 'username', 'password', 'token', 'snoozedTasks']);

  if (config.snoozedTasks) {
    snoozedTasks = config.snoozedTasks;
  }

  if (config.moodleUrl && config.username && config.password) {
    document.getElementById('moodle-url').value = config.moodleUrl;
    document.getElementById('username').value = config.username;
    document.getElementById('password').value = config.password;

    if (config.token) {
      showTasksSection();
      loadTasks();
    }
  }

  // Menú hamburguesa
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hamburgerMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    hamburgerMenu.classList.add('hidden');
  });

  hamburgerMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  menuRefreshBtn.addEventListener('click', () => {
    hamburgerMenu.classList.add('hidden');
    loadTasks();
  });

  menuAllTasksBtn.addEventListener('click', () => {
    hamburgerMenu.classList.add('hidden');
    showAllTasksSection();
  });

  menuConfigBtn.addEventListener('click', () => {
    hamburgerMenu.classList.add('hidden');
    showConfigSection();
  });

  backToPendingBtn.addEventListener('click', () => {
    showTasksSection();
    loadTasks();
  });

  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const moodleUrl = document.getElementById('moodle-url').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    showStatus('Conectando con Moodle...', 'success');

    try {
      // Obtener token de Moodle
      const token = await getMoodleToken(moodleUrl, username, password);

      if (token) {
        await chrome.storage.local.set({
          moodleUrl,
          username,
          password,
          token
        });

        showStatus('Configuración guardada correctamente', 'success');

        setTimeout(() => {
          showTasksSection();
          loadTasks();
        }, 1000);
      } else {
        showStatus('Error: No se pudo obtener el token. Verifica tus credenciales.', 'error');
      }
    } catch (error) {
      showStatus('Error: ' + error.message, 'error');
    }
  });

  // Escuchar mensajes del background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'playNotificationSound') {
      playNotificationSound();
    }
  });

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.classList.remove('hidden');
  }

  function showTasksSection() {
    configSection.classList.add('hidden');
    allTasksSection.classList.add('hidden');
    tasksSection.classList.remove('hidden');
  }

  function showAllTasksSection() {
    configSection.classList.add('hidden');
    tasksSection.classList.add('hidden');
    allTasksSection.classList.remove('hidden');
    loadAllTasks();
  }

  function showConfigSection() {
    tasksSection.classList.add('hidden');
    allTasksSection.classList.add('hidden');
    configSection.classList.remove('hidden');
  }

  async function getMoodleToken(moodleUrl, username, password) {
    const tokenUrl = `${moodleUrl}/login/token.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&service=moodle_mobile_app`;

    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.token) {
      return data.token;
    } else {
      throw new Error(data.error || 'No se pudo obtener el token');
    }
  }

  async function loadTasks() {
    const config = await chrome.storage.local.get(['moodleUrl', 'token', 'snoozedTasks']);

    if (!config.moodleUrl || !config.token) {
      showConfigSection();
      return;
    }

    if (config.snoozedTasks) {
      snoozedTasks = config.snoozedTasks;
    }

    tasksList.innerHTML = '<p class="no-tasks">Cargando tareas...</p>';

    try {
      // Enviar mensaje al background script para obtener las tareas
      chrome.runtime.sendMessage({ action: 'getTasks' }, (response) => {
        if (response && response.tasks) {
          displayTasks(response.tasks);
        } else {
          tasksList.innerHTML = '<p class="no-tasks">No se pudieron cargar las tareas</p>';
        }
      });
    } catch (error) {
      tasksList.innerHTML = '<p class="no-tasks">Error al cargar las tareas</p>';
    }
  }

  async function loadAllTasks() {
    const config = await chrome.storage.local.get(['moodleUrl', 'token', 'snoozedTasks']);

    if (!config.moodleUrl || !config.token) {
      showConfigSection();
      return;
    }

    if (config.snoozedTasks) {
      snoozedTasks = config.snoozedTasks;
    }

    allTasksList.innerHTML = '<p class="no-tasks">Cargando tareas...</p>';

    try {
      chrome.runtime.sendMessage({ action: 'getTasks' }, (response) => {
        if (response && response.tasks) {
          displayAllTasks(response.tasks);
        } else {
          allTasksList.innerHTML = '<p class="no-tasks">No se pudieron cargar las tareas</p>';
        }
      });
    } catch (error) {
      allTasksList.innerHTML = '<p class="no-tasks">Error al cargar las tareas</p>';
    }
  }

  function displayTasks(tasks) {
    chrome.storage.local.get(['dismissedTasks'], (result) => {
      const dismissedTasks = new Set(result.dismissedTasks || []);
      const pendingTasks = tasks.filter(task => !dismissedTasks.has(task.id));

      if (pendingTasks.length === 0) {
        tasksList.innerHTML = '<p class="no-tasks">No hay tareas pendientes</p>';
        return;
      }

      tasksList.innerHTML = '';

      pendingTasks.forEach(task => {
        const taskElement = createTaskElement(task, false);
        tasksList.appendChild(taskElement);
      });
    });
  }

  function displayAllTasks(tasks) {
    chrome.storage.local.get(['dismissedTasks'], (result) => {
      const dismissedTasks = new Set(result.dismissedTasks || []);

      if (tasks.length === 0) {
        allTasksList.innerHTML = '<p class="no-tasks">No hay tareas</p>';
        return;
      }

      allTasksList.innerHTML = '';

      tasks.forEach(task => {
        const isDismissed = dismissedTasks.has(task.id);
        const taskElement = createTaskElement(task, true, isDismissed);
        allTasksList.appendChild(taskElement);
      });
    });
  }

  function createTaskElement(task, showAll = false, isDismissed = false) {
    const div = document.createElement('div');
    div.className = 'task-item';
    if (isDismissed) {
      div.classList.add('dismissed');
    }

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.name;

    const course = document.createElement('div');
    course.className = 'task-course';
    course.textContent = task.coursename || 'Curso';

    const due = document.createElement('div');
    due.className = 'task-due';
    if (task.timedue) {
      const dueDate = new Date(task.timedue * 1000);
      due.textContent = `Vence: ${dueDate.toLocaleString('es-ES')}`;
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn btn-open';
    openBtn.textContent = 'Abrir';
    openBtn.onclick = () => openTask(task);

    if (showAll) {
      // Vista de todas las tareas
      if (isDismissed) {
        const unmarkBtn = document.createElement('button');
        unmarkBtn.className = 'btn btn-unmark';
        unmarkBtn.textContent = 'Desmarcar';
        unmarkBtn.onclick = () => unmarkTask(task);
        actions.appendChild(openBtn);
        actions.appendChild(unmarkBtn);
      } else {
        const snoozeBtn = createSnoozeButton(task);
        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'btn btn-dismiss';
        dismissBtn.textContent = 'Marcar visto';
        dismissBtn.onclick = () => dismissTask(task);

        actions.appendChild(openBtn);
        actions.appendChild(snoozeBtn);
        actions.appendChild(dismissBtn);
      }
    } else {
      // Vista de tareas pendientes
      const snoozeBtn = createSnoozeButton(task);
      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'btn btn-dismiss';
      dismissBtn.textContent = 'Marcar visto';
      dismissBtn.onclick = () => dismissTask(task);

      actions.appendChild(openBtn);
      actions.appendChild(snoozeBtn);
      actions.appendChild(dismissBtn);
    }

    div.appendChild(title);
    div.appendChild(course);
    div.appendChild(due);
    div.appendChild(actions);

    return div;
  }

  function createSnoozeButton(task) {
    const snoozeBtn = document.createElement('button');
    snoozeBtn.className = 'btn btn-snooze';
    snoozeBtn.id = `snooze-${task.id}`;

    const now = Date.now();
    const snoozeUntil = snoozedTasks[task.id];

    if (snoozeUntil && snoozeUntil > now) {
      snoozeBtn.disabled = true;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'snooze-time';
      timeSpan.id = `snooze-time-${task.id}`;

      updateSnoozeTime(task.id, snoozeUntil);

      const wrapper = document.createElement('div');
      wrapper.style.flex = '1';
      wrapper.appendChild(snoozeBtn);
      wrapper.appendChild(timeSpan);

      return wrapper;
    } else {
      snoozeBtn.textContent = 'Posponer 20min';
      snoozeBtn.onclick = () => snoozeTask(task);
      return snoozeBtn;
    }
  }

  function updateSnoozeTime(taskId, snoozeUntil) {
    const snoozeBtn = document.getElementById(`snooze-${taskId}`);
    const timeSpan = document.getElementById(`snooze-time-${taskId}`);

    if (!snoozeBtn || !timeSpan) return;

    const updateInterval = () => {
      const now = Date.now();
      const remaining = snoozeUntil - now;

      if (remaining <= 0) {
        clearInterval(snoozedIntervals[taskId]);
        delete snoozedIntervals[taskId];
        loadTasks();
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const snoozeDate = new Date(snoozeUntil);
      snoozeBtn.textContent = `Avisará: ${snoozeDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      timeSpan.textContent = `(${minutes}m ${seconds}s)`;
    };

    updateInterval();
    snoozedIntervals[taskId] = setInterval(updateInterval, 1000);
  }

  function openTask(task) {
    chrome.storage.local.get(['moodleUrl'], (config) => {
      let url = task.url || `${config.moodleUrl}/mod/assign/view.php?id=${task.cmid}`;
      chrome.tabs.create({ url });
    });
  }

  function snoozeTask(task) {
    chrome.runtime.sendMessage({
      action: 'snoozeTask',
      taskId: task.id
    }, (response) => {
      if (response && response.snoozeUntil) {
        snoozedTasks[task.id] = response.snoozeUntil;
        loadTasks();
      }
    });
  }

  function dismissTask(task) {
    chrome.storage.local.get(['dismissedTasks'], (result) => {
      const dismissed = result.dismissedTasks || [];
      dismissed.push(task.id);
      chrome.storage.local.set({ dismissedTasks: dismissed }, () => {
        loadTasks();
      });
    });
  }

  function unmarkTask(task) {
    chrome.storage.local.get(['dismissedTasks'], (result) => {
      const dismissed = result.dismissedTasks || [];
      const filtered = dismissed.filter(id => id !== task.id);
      chrome.storage.local.set({ dismissedTasks: filtered }, () => {
        loadAllTasks();
      });
    });
  }

  function playNotificationSound() {
    notificationSound.play().catch(err => {
      console.error('Error reproduciendo sonido:', err);
    });
  }

  // ==================== SISTEMA DE ACTUALIZACIONES ====================

  // Event listener para cerrar el banner de actualización
  updateDismissBtn.addEventListener('click', () => {
    updateBanner.classList.add('hidden');
    // Guardar que el usuario cerró el banner (opcional: podrías agregar un timestamp)
    chrome.storage.local.set({ updateBannerDismissed: Date.now() });
  });

  // Función para verificar actualizaciones
  async function checkForUpdates() {
    try {
      // Obtener información de actualización del background script
      chrome.runtime.sendMessage({ action: 'getUpdateInfo' }, (updateInfo) => {
        if (updateInfo && updateInfo.available) {
          showUpdateBanner(updateInfo.url, updateInfo.version);
        }
      });
    } catch (error) {
      console.error('Error al verificar actualizaciones:', error);
    }
  }

  // Mostrar banner de actualización
  function showUpdateBanner(downloadUrl, version) {
    // Verificar si el usuario ya cerró el banner recientemente (opcional)
    chrome.storage.local.get(['updateBannerDismissed'], (result) => {
      const dismissedTime = result.updateBannerDismissed || 0;
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);

      // Mostrar el banner si han pasado más de 6 horas desde que se cerró
      if (hoursSinceDismissed > 6 || dismissedTime === 0) {
        updateDownloadBtn.href = downloadUrl;

        // Actualizar texto si hay versión disponible
        if (version) {
          const updateText = updateBanner.querySelector('.update-text p');
          updateText.textContent = `Versión ${version} disponible`;
        }

        updateBanner.classList.remove('hidden');
      }
    });
  }
});
