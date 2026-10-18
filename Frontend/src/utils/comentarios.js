// Lógica pura de los comentarios por tarea. Mientras no existan base de datos ni login se
// guardan en el navegador (services/comentariosStorage.js); las reglas son las mismas que
// aplica el backend en com.todoo.comentarios para que el cambio a la API sea directo.
//
// Formato guardado: { id, tareaId, autorId, contenido, fechaCreacion, fechaActualizacion }
// con fechas ISO. Formato de vista (el mismo que devuelve adaptarComentario de comentariosApi):
// { id, autorId, autorNombre, contenido, fechaCreacion, editado, puedeModificar }

export const MAXIMO_COMENTARIO = 1000

// Devuelve el texto sin espacios sobrantes, o '' si no es válido.
export function textoValido(contenido) {
  const texto = typeof contenido === 'string' ? contenido.trim() : ''
  return texto && [...texto].length <= MAXIMO_COMENTARIO ? texto : ''
}

export function agregarComentario(comentarios, { id, tareaId, autorId, contenido, ahora }) {
  const texto = textoValido(contenido)
  if (!texto) return comentarios
  const fecha = ahora.toISOString()
  return [...comentarios, {
    id, tareaId, autorId, contenido: texto, fechaCreacion: fecha, fechaActualizacion: fecha,
  }]
}

// Solo el autor edita, como en el backend.
export function editarComentario(comentarios, comentarioId, usuarioId, contenido, ahora) {
  const texto = textoValido(contenido)
  const comentario = comentarios.find((actual) => actual.id === comentarioId)
  if (!texto || !comentario || comentario.autorId !== usuarioId) return comentarios
  if (texto === comentario.contenido) return comentarios
  return comentarios.map((actual) => (
    actual.id === comentarioId
      ? { ...actual, contenido: texto, fechaActualizacion: ahora.toISOString() }
      : actual
  ))
}

// El autor elimina; un administrador también puede moderar (aún no hay roles en el tablero local).
export function eliminarComentario(comentarios, comentarioId, usuarioId, esAdministrador = false) {
  const comentario = comentarios.find((actual) => actual.id === comentarioId)
  if (!comentario || (comentario.autorId !== usuarioId && !esAdministrador)) return comentarios
  return comentarios.filter((actual) => actual.id !== comentarioId)
}

// Al eliminar una tarea se elimina también su conversación.
export function eliminarComentariosDeTarea(comentarios, tareaId) {
  return comentarios.some((actual) => actual.tareaId === tareaId)
    ? comentarios.filter((actual) => actual.tareaId !== tareaId)
    : comentarios
}

export function contarPorTarea(comentarios) {
  const conteo = {}
  for (const comentario of comentarios) {
    conteo[comentario.tareaId] = (conteo[comentario.tareaId] ?? 0) + 1
  }
  return conteo
}

// Conversación de una tarea, del más antiguo al más reciente, lista para mostrar.
export function conversacionDeTarea(comentarios, tareaId, usuarioId, miembros) {
  return comentarios
    .filter((comentario) => comentario.tareaId === tareaId)
    .sort((a, b) => a.fechaCreacion.localeCompare(b.fechaCreacion))
    .map((comentario) => ({
      id: comentario.id,
      autorId: comentario.autorId,
      autorNombre: miembros.find((miembro) => miembro.id === comentario.autorId)?.nombre ?? 'Usuario desconocido',
      contenido: comentario.contenido,
      fechaCreacion: comentario.fechaCreacion,
      editado: comentario.fechaActualizacion !== comentario.fechaCreacion,
      puedeModificar: comentario.autorId === usuarioId,
    }))
}
