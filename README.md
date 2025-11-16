# Moodle Notifier

Extensión de Chrome que te notifica sobre las actividades pendientes en tu plataforma Moodle.

## Características

- **Popup automático al iniciar Chrome** con tus tareas pendientes
- **Notificación sonora** cuando hay tareas pendientes o se cumple un recordatorio
- Verificación periódica de tareas pendientes cada 5 minutos
- Acceso directo a las actividades desde el popup
- **Posponer tareas por 20 minutos** con temporizador visual en tiempo real
- **Marcar actividades como vistas** para ocultarlas de la lista principal
- **Ver todas las tareas** (incluidas las marcadas como vistas) con opción de desmarcarlas
- **Menú hamburguesa** con acceso rápido a todas las funciones
- Autenticación segura usando la API oficial de Moodle
- Interfaz intuitiva para gestionar tus tareas

## Requisitos

- Google Chrome o navegador basado en Chromium
- Cuenta en una plataforma Moodle
- La plataforma Moodle debe tener habilitado el servicio web "moodle_mobile_app"
- Un archivo de audio `sound.mp3` para las notificaciones (ver instrucciones más abajo)

## Instalación


### 1. Cargar la extensión en Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa el "Modo de desarrollador" en la esquina superior derecha
3. Haz clic en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta `moodlenotifier`

## Configuración

1. Haz clic en el icono de la extensión en la barra de herramientas de Chrome
2. Introduce la configuración de tu Moodle:
   - **URL de Moodle**: La dirección de tu plataforma (ej: `https://moodle.example.com`)
   - **Usuario**: Tu nombre de usuario de Moodle
   - **Contraseña**: Tu contraseña de Moodle
3. Haz clic en "Guardar Configuración"

La extensión guardará tus credenciales de forma segura y obtendrá un token de acceso a la API de Moodle.

## Uso

### Inicio automático

- **Al abrir Chrome**, la extensión mostrará automáticamente el popup con tus tareas pendientes
- Si hay tareas, se reproducirá el sonido de notificación (`sound.mp3`)
- El popup se abrirá en una ventana emergente para que no interrumpa tu flujo de trabajo

### Verificación periódica

- Cada 5 minutos, la extensión verificará si hay nuevas tareas
- Si detecta tareas nuevas o pendientes, abrirá el popup y reproducirá el sonido

### Menú hamburguesa

Haz clic en el icono de hamburguesa (☰) en la parte superior derecha del popup para acceder a:

- **🔄 Actualizar Tareas**: Obtiene las últimas tareas desde Moodle
- **📋 Ver Todas las Tareas**: Muestra todas las tareas, incluidas las marcadas como vistas
- **⚙️ Cambiar Configuración**: Permite modificar la URL de Moodle y credenciales

### Gestionar tareas pendientes

Desde la vista principal de tareas pendientes, cada tarea tiene tres botones:

1. **Abrir** (verde): Abre la actividad directamente en Moodle en una nueva pestaña
2. **Posponer 20min** (amarillo): Pospone la notificación por 20 minutos
   - El botón se deshabilita y muestra la hora exacta del próximo aviso
   - Se muestra un temporizador en tiempo real (ej: "19m 45s")
   - Cuando se cumplen los 20 minutos, se abre el popup y se reproduce el sonido
3. **Marcar visto** (rojo): Marca la tarea como vista y la oculta de la lista principal

### Ver todas las tareas

1. Haz clic en **📋 Ver Todas las Tareas** en el menú hamburguesa
2. Verás todas las tareas, incluidas las marcadas como vistas (aparecen con opacidad reducida)
3. Las tareas marcadas como vistas tienen un botón **Desmarcar** para restaurarlas a la lista principal
4. Haz clic en **Volver a Pendientes** para regresar a la vista principal

## Sistema de Actualizaciones Automáticas

La extensión incluye un sistema de actualización automática que verifica periódicamente si hay nuevas versiones disponibles.

### Cómo funciona

1. **Verificación automática**: La extensión verifica actualizaciones cada 1 hora
2. **Al iniciar Chrome**: También verifica al abrir el navegador
3. **Notificación visual**: Si hay una actualización, verás un banner naranja en la parte superior del popup
4. **Descarga fácil**: Haz clic en "Descargar Actualización" para obtener la nueva versión

### Banner de actualización

Cuando hay una actualización disponible:
- Aparecerá un banner naranja en la parte superior con el mensaje: "¡Actualización disponible!"
- Muestra el número de versión disponible
- Incluye un botón para descargar directamente
- Puedes cerrar el banner con la X (volverá a aparecer después de 6 horas)



## Seguridad

- Las credenciales se almacenan localmente en tu navegador
- Se utiliza la API oficial de Moodle para autenticación
- No se comparten datos con terceros
- El token de acceso se genera usando el servicio oficial de Moodle
- Las actualizaciones se verifican desde un servidor seguro (HTTPS)

## Verificar que tu Moodle tiene la API habilitada

1. Accede a tu plataforma Moodle
2. Prueba esta URL (cambia `moodle.example.com` por tu URL):
   ```
   https://moodle.example.com/login/token.php?username=TU_USUARIO&password=TU_CONTRASEÑA&service=moodle_mobile_app
   ```
3. Si devuelve un token JSON, la API está habilitada
4. Si recibes un error, contacta al administrador de tu plataforma Moodle

## Solución de problemas

### No se obtiene el token

- Verifica que la URL de Moodle sea correcta (sin `/` al final)
- Comprueba que tu usuario y contraseña sean correctos
- Asegúrate de que la plataforma Moodle tenga habilitado el servicio web

### No aparecen tareas

- Verifica que tengas tareas asignadas con fecha de entrega futura
- Haz clic en "Actualizar Tareas" en el popup
- Revisa la consola de Chrome para ver posibles errores

### Las notificaciones no aparecen

- Asegúrate de haber dado permisos de notificación a Chrome
- Verifica que la extensión esté activa en `chrome://extensions/`

## Tecnologías utilizadas

- Manifest V3 (última versión de extensiones de Chrome)
- API Web de Moodle
- Chrome Storage API
- Chrome Notifications API
- Chrome Alarms API

## Licencia

GNU GPLv3.0
