// Cliente de /api/proyectos/{id}/tareas/{tareaId}/comentarios (Backend/main, paquete comentarios).
// Aún no se usa en el tablero: los comentarios siguen en localStorage hasta que existan
// login, proyectos y tareas en MySQL (ver docs/requisitos-pendientes.md).
//
// Para POST, PATCH y DELETE el backend exige el encabezado X-CSRF-TOKEN. El token se pide a
// GET /api/notificaciones/csrf, porque la sesión la comparte el módulo de notificaciones.

class ComentariosApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ComentariosApiError'
    this.status = status
  }
}

const MENSAJES = {
  401: 'Inicia sesion para ver los comentarios.',
  403: 'No tienes permiso para hacer este cambio en el comentario.',
  404: 'La tarea o el comentario ya no existe, o no perteneces al proyecto.',
  409: 'La tarea esta archivada y ya no admite cambios.',
}

async function request(path, { signal, method = 'GET', body, csrf } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (csrf) headers['X-CSRF-TOKEN'] = csrf

  let response
  try {
    response = await fetch(path, {
      method,
      signal,
      credentials: 'same-origin',
      cache: 'no-store',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ComentariosApiError('No se pudo conectar con el servidor. Intenta de nuevo.', 0)
  }
  if (!response.ok) {
    // En 400 el backend explica el motivo (vacío, demasiado largo); en el resto se usa un mensaje fijo.
    let mensaje = MENSAJES[response.status] ?? 'No se pudieron guardar o consultar los comentarios. Intenta de nuevo.'
    if (response.status === 400) {
      mensaje = (await response.json().catch(() => null))?.mensaje ?? 'El comentario no es valido.'
    }
    throw new ComentariosApiError(mensaje, response.status)
  }
  return response.status === 204 ? null : response.json()
}

async function tokenCsrf() {
  return (await request('/api/notificaciones/csrf')).token
}

const base = (proyectoId, tareaId) => `/api/proyectos/${proyectoId}/tareas/${tareaId}/comentarios`

// Convierte la respuesta del backend al formato de vista que usa el componente de comentarios.
export function adaptarComentario(comentario) {
  return {
    id: String(comentario.id),
    autorId: comentario.autor.id,
    autorNombre: comentario.autor.nombre,
    contenido: comentario.contenido,
    fechaCreacion: comentario.fecha_creacion,
    editado: comentario.editado,
    puedeModificar: comentario.puede_modificar,
  }
}

export async function getComentarios(proyectoId, tareaId, signal) {
  return (await request(base(proyectoId, tareaId), { signal })).map(adaptarComentario)
}

export async function crearComentario(proyectoId, tareaId, contenido) {
  return adaptarComentario(await request(base(proyectoId, tareaId), {
    method: 'POST', body: { contenido }, csrf: await tokenCsrf(),
  }))
}

export async function editarComentario(proyectoId, tareaId, comentarioId, contenido) {
  return adaptarComentario(await request(`${base(proyectoId, tareaId)}/${comentarioId}`, {
    method: 'PATCH', body: { contenido }, csrf: await tokenCsrf(),
  }))
}

export async function eliminarComentario(proyectoId, tareaId, comentarioId) {
  await request(`${base(proyectoId, tareaId)}/${comentarioId}`, {
    method: 'DELETE', csrf: await tokenCsrf(),
  })
}
