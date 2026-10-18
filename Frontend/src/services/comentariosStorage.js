import { MAXIMO_COMENTARIO } from '../utils/comentarios.js'

const STORAGE_KEY = 'todoo.kanban.comentarios'

const esFecha = (valor) => typeof valor === 'string' && !Number.isNaN(Date.parse(valor))

// Misma política que cargarTablero: se recuperan los comentarios válidos y los datos
// guardados no se tocan hasta que el usuario haga un cambio.
export function cargarComentarios(storage) {
  try {
    const guardados = JSON.parse((storage ?? localStorage).getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(guardados)) throw new Error('Formato de comentarios inválido')

    const ids = new Set()
    const comentarios = guardados.filter((comentario) => {
      const valido = comentario &&
        typeof comentario.id === 'string' && comentario.id.length > 0 && !ids.has(comentario.id) &&
        typeof comentario.tareaId === 'string' && comentario.tareaId.length > 0 &&
        Number.isInteger(comentario.autorId) && comentario.autorId > 0 &&
        typeof comentario.contenido === 'string' && comentario.contenido.trim().length > 0 &&
        [...comentario.contenido].length <= MAXIMO_COMENTARIO &&
        esFecha(comentario.fechaCreacion) && esFecha(comentario.fechaActualizacion)

      if (valido) ids.add(comentario.id)
      return valido
    })

    return {
      comentarios,
      error: comentarios.length === guardados.length ? '' :
        'Se recuperaron solo los comentarios válidos. Los datos guardados no cambiarán hasta que modifiques un comentario.',
    }
  } catch {
    return {
      comentarios: [],
      error: 'No se pudieron cargar los comentarios. Los datos guardados no cambiarán hasta que modifiques un comentario.',
    }
  }
}

export function guardarComentarios(comentarios, storage) {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(comentarios))
    return ''
  } catch {
    return 'No se pudieron guardar los comentarios. Tus cambios están solo en esta pestaña; reintenta antes de salir.'
  }
}
