# Acuerdos para las próximas etapas

Estos requisitos se registran para conservar el contexto del equipo. No representan funcionalidades ya implementadas por el merge de notificaciones.

- Base de datos prevista: MySQL, administrada con HeidiSQL. Todavía no se ha creado ni aprobado el esquema definitivo.
- Usuarios con cuentas y autenticación. La API de notificaciones requiere una sesión del servidor con el atributo `usuarioId`; el login futuro debe establecerlo tras validar las credenciales y renovar la sesión.
- Proyectos con miembros del equipo y sus tareas. Validar permisos y pertenencia al proyecto desde el backend.
- Cada tarea tendrá título, descripción, responsable, prioridad alta/media/baja y fecha límite.
- Comentarios para discutir dentro del sistema. La propuesta permite comentarios del proyecto y comentarios asociados a una tarea.
- Crear una notificación para la cuenta del nuevo responsable al asignarle una tarea. Una reasignación notifica al nuevo responsable; editar otros campos sin cambiarlo no genera otro aviso.
- Guardar la asignación y su notificación en la misma transacción. La rama integrada ofrece `NotificacionService.notificarAsignacion`; invocarlo desde el futuro servicio de tareas después de comprobar permisos. No hay todavía un servicio de tareas que haga esa llamada.
- La bandeja consulta la API al entrar y al pulsar Actualizar. Las notificaciones en tiempo real mediante polling, SSE o WebSocket siguen pendientes de decisión.
- Los datos actuales del tablero y proyectos siguen en `localStorage`; su migración a MySQL requiere las futuras API de usuarios, proyectos, tareas y comentarios.

## Configuración integrada

Se conservan Java 25, el proyecto Maven y las rutas del frontend existentes. El punto de arranque de Spring es `com.todoo.TodooApplication`; el anterior `com.todoo.main.MainApplication` delega en él para conservar el acceso desde el IDE.

MySQL usa Connector/J con las variables `DB_URL`, `DB_USER` y `DB_PASSWORD`. No guardar credenciales en Git. Los tiempos se almacenan e interpretan en UTC. Las pruebas usan H2 en memoria, no una base MySQL real.

Ejecutar desde `Backend/main`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

El segundo comando requiere un servidor y un esquema configurados. No se ejecuta SQL automáticamente (`spring.sql.init.mode=never`). El frontend usa el proxy `/api` a `127.0.0.1:8080` durante el desarrollo. Sin backend o sesión válidos, muestra un error y permite reintentar o ir a `/login`.

## Propuesta SQL

`Backend/main/database/propuesta_mysql.sql` es una propuesta para una base nueva y vacía en MySQL 8.4. No se ha ejecutado ni validado contra un servidor MySQL real. Requiere revisar el esquema con el equipo antes de usarlo. No ejecutar además `001_notificaciones.sql`: ambos definen la misma tabla y el archivo 001 se conserva para las pruebas aisladas del módulo.

La propuesta requiere responsable y fecha límite por tarea, y usa IDs enteros compatibles con la tabla de notificaciones integrada. Los usuarios se desactivan y los proyectos/tareas se archivan para conservar las referencias y discusiones. La pertenencia se conserva mediante `activo` en los miembros; el servicio futuro deberá comprobar ese estado.

No se agregan triggers de notificación: duplicarían los avisos si el servicio de tareas llama también a `notificarAsignacion`. La creación automática debe tener un único responsable, en este diseño el servicio transaccional del backend. El esquema prepara el almacenamiento, pero por sí solo no implementa el flujo de asignación ni la autenticación.

## Filtros del tablero (rama `Filtros`)

El tablero filtra por prioridad, responsable y "solo mis tareas" sobre las tareas de `localStorage`. El backend ya expone la consulta equivalente, pero el frontend todavía no la usa.

- `GET /api/proyectos/{id}/tareas` acepta `prioridad` (`alta`, `media`, `baja`), `responsableId` y `soloMias=true`. Devuelve las tareas no archivadas del proyecto ordenadas por estado, posición e id, con el responsable como `{ id, nombre }`.
- `GET /api/proyectos/{id}/responsables` lista los miembros activos del proyecto para el selector.
- Ambas rutas exigen el atributo de sesión `usuarioId` (401 sin sesión) y que el usuario sea miembro activo del proyecto (404 en caso contrario, para no revelar proyectos ajenos). Un filtro inválido devuelve 400.
- `soloMias` usa siempre el usuario de la sesión. Si además se envía otro `responsableId`, la respuesta es una lista vacía.

Todo el SQL está en `com.todoo.tareas.TareaRepository` y sigue `database/propuesta_mysql.sql` (`tareas`, `miembros_proyecto`, `usuarios`). Si el esquema definitivo cambia nombres de tablas o columnas, solo ese archivo y `src/test/resources/tareas_schema.sql` deben ajustarse. Las pruebas usan H2; la consulta no se ha ejecutado contra un MySQL real.

Para conectar el tablero cuando existan la base, el login y la API para crear y editar tareas:

1. Reemplazar `MIEMBROS_EQUIPO` por `getResponsables(proyectoId)` y `USUARIO_ACTUAL_ID` por el usuario de la sesión (`constants/tareas.js`).
2. Cargar las tareas con `getTareas(proyectoId, filtros)` de `services/tareasApi.js` en lugar de `cargarTablero`. La búsqueda de texto sigue aplicándose en el navegador con `filtrarTareas`.
3. `adaptarTarea` convierte la respuesta al formato del tablero. Las tarjetas pueden mostrar `responsableNombre` en lugar de buscar el nombre en `MIEMBROS_EQUIPO`.
4. El frontend usa `PROYECTO_PRINCIPAL.id = 'principal'`; la API espera un id numérico de `proyectos`.

## Comentarios por tarea (rama `Comentarios`)

Cada tarea tiene una conversación para el equipo. El tablero guarda los comentarios en `localStorage`; el backend ya expone la API equivalente, pero el frontend todavía no la usa. Esta rama parte de `main` y sigue `database/propuesta_mysql.sql`: la tabla `comentarios` con `tarea_id`, que la propuesta ya prevé.

- `GET /api/proyectos/{proyectoId}/tareas/{tareaId}/comentarios` devuelve la conversación del más antiguo al más reciente. Cada comentario trae `autor { id, nombre }`, `contenido`, `fecha_creacion`, `fecha_actualizacion`, `editado` y `puede_modificar` (calculado por el servidor para el usuario de la sesión).
- `POST` publica (`{ "contenido": "..." }`, entre 1 y 1000 caracteres tras recortar espacios; responde 201). `PATCH /{id}` edita y `DELETE /{id}` elimina (204).
- El autor se toma siempre de la sesión. Solo edita el autor (403 para otra persona); eliminan el autor o un miembro con rol `administrador`.
- Exigen el atributo de sesión `usuarioId` (401) y ser miembro activo del proyecto (404, para no revelar proyectos ajenos). Una tarea que no pertenece al proyecto, o un comentario que no pertenece a la tarea, responden 404. Una tarea archivada se puede leer, pero publicar o editar responde 409.
- POST, PATCH y DELETE exigen el encabezado `X-CSRF-TOKEN`. Se reutiliza la sesión del módulo de notificaciones: el token se pide con `GET /api/notificaciones/csrf`. Si el login definitivo trae su propio manejo de CSRF, solo debe cambiarse `ComentarioWebConfig` y `tokenCsrf()` en `comentariosApi.js`.

Todo el SQL está en `com.todoo.comentarios.ComentarioRepository`. Si el esquema definitivo cambia nombres de tablas o columnas, solo ese archivo y `src/test/resources/comentarios_schema.sql` deben ajustarse. Las pruebas usan H2; las consultas no se han ejecutado contra un MySQL real. Detalles a tener en cuenta al revisar el esquema:

- `fecha_creacion` y `fecha_actualizacion` se escriben explícitamente con el mismo valor al publicar, y `editado` se calcula comparándolas. No depender de los `DEFAULT CURRENT_TIMESTAMP(6)`, porque dos valores por defecto pueden diferir en microsegundos.
- El límite de 1000 caracteres se valida en la aplicación (`NuevoComentario`); la columna `contenido` de la propuesta es `TEXT`. Se puede agregar un `CHECK` si el equipo quiere reforzarlo en la base.
- Eliminar un comentario lo borra de verdad. Si el equipo prefiere conservar el historial, hay que agregar una columna de archivado y ajustar `eliminar` y `listar`.
- No se crean notificaciones al comentar: la propuesta de notificaciones solo cubre asignaciones. Avisar al responsable de la tarea o a quien participa en la conversación queda pendiente de decisión; el punto de enganche sería `ComentarioService.crear`, dentro de la misma transacción, igual que `notificarAsignacion`.

Para conectar el tablero cuando existan la base, el login y las tareas en MySQL:

1. Cargar la conversación al abrir una tarjeta con `getComentarios(proyectoId, tareaId)`, en lugar de `conversacionDeTarea` sobre `localStorage`. El formato de vista es el mismo que devuelve `adaptarComentario`.
2. Reemplazar `agregarComentario`, `editarComentario` y `eliminarComentario` de `KanbanPage.jsx` por `crearComentario`, `editarComentario` y `eliminarComentario` de `services/comentariosApi.js`, y actualizar la lista con el comentario devuelto. Los mensajes de error de la API ya están en español y listos para mostrarse.
3. Quitar `comentariosStorage.js` y `utils/comentarios.js` cuando ya no se usen. `puedeModificar` pasa a venir del servidor, así que ya no hace falta `USUARIO_ACTUAL_ID` para los comentarios.
4. Los ids de la API son numéricos: el tablero actual usa UUID como id de tarea y `'principal'` como proyecto, igual que en los filtros.
