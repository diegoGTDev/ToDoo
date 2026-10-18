import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAXIMO_COMENTARIO, agregarComentario, contarPorTarea, conversacionDeTarea, editarComentario,
  eliminarComentario, eliminarComentariosDeTarea, textoValido,
} from '../src/utils/comentarios.js'

const miembros = [{ id: 1, nombre: 'Yo' }, { id: 2, nombre: 'Compañero 1' }]
const t = (minuto) => new Date(Date.UTC(2026, 9, 18, 10, minuto))

function nuevo(comentarios, id, tareaId, autorId, contenido, minuto) {
  return agregarComentario(comentarios, { id, tareaId, autorId, contenido, ahora: t(minuto) })
}

test('valida el texto: recorta espacios y rechaza vacíos o demasiado largos', () => {
  assert.equal(textoValido('  Hola equipo  '), 'Hola equipo')
  assert.equal(textoValido('   '), '')
  assert.equal(textoValido(null), '')
  assert.equal(textoValido('a'.repeat(MAXIMO_COMENTARIO)), 'a'.repeat(MAXIMO_COMENTARIO))
  assert.equal(textoValido('a'.repeat(MAXIMO_COMENTARIO + 1)), '')
  // Los emojis cuentan como un carácter, igual que en el backend.
  assert.equal(textoValido('😀'.repeat(MAXIMO_COMENTARIO)).length > 0, true)
})

test('agrega comentarios sin modificar la lista original y no guarda los inválidos', () => {
  const inicial = []
  const con = nuevo(inicial, 'c1', 'a', 1, ' Revisé el diseño ', 0)
  assert.deepEqual(inicial, [])
  assert.deepEqual(con, [{
    id: 'c1', tareaId: 'a', autorId: 1, contenido: 'Revisé el diseño',
    fechaCreacion: t(0).toISOString(), fechaActualizacion: t(0).toISOString(),
  }])
  assert.equal(nuevo(con, 'c2', 'a', 1, '   ', 1), con)
})

test('solo el autor edita y la edición se marca como editado', () => {
  const base = nuevo([], 'c1', 'a', 2, 'Texto original', 0)
  assert.equal(editarComentario(base, 'c1', 1, 'Reescrito', t(5)), base)
  assert.equal(editarComentario(base, 'c1', 2, '  ', t(5)), base)
  assert.equal(editarComentario(base, 'c1', 2, 'Texto original', t(5)), base)
  assert.equal(editarComentario(base, 'nope', 2, 'Hola', t(5)), base)

  const editado = editarComentario(base, 'c1', 2, 'Texto corregido', t(5))
  assert.equal(editado[0].contenido, 'Texto corregido')
  assert.equal(editado[0].fechaCreacion, t(0).toISOString())
  assert.equal(conversacionDeTarea(editado, 'a', 2, miembros)[0].editado, true)
  assert.equal(conversacionDeTarea(base, 'a', 2, miembros)[0].editado, false)
})

test('el autor elimina; otra persona no, salvo que sea administradora', () => {
  const base = nuevo(nuevo([], 'c1', 'a', 1, 'De Yo', 0), 'c2', 'a', 2, 'De otro', 1)
  assert.equal(eliminarComentario(base, 'c2', 1), base)
  assert.deepEqual(eliminarComentario(base, 'c2', 2).map((c) => c.id), ['c1'])
  assert.deepEqual(eliminarComentario(base, 'c2', 1, true).map((c) => c.id), ['c1'])
  assert.equal(eliminarComentario(base, 'nope', 1, true), base)
})

test('la conversación va de más antigua a más reciente, solo de su tarea, con autor y permisos', () => {
  let lista = nuevo([], 'c2', 'a', 2, 'Segundo', 5)
  lista = nuevo(lista, 'c3', 'b', 1, 'Otra tarea', 6)
  lista = nuevo(lista, 'c1', 'a', 1, 'Primero', 1)
  lista = nuevo(lista, 'c4', 'a', 99, 'De alguien que ya no está', 9)

  assert.deepEqual(conversacionDeTarea(lista, 'a', 1, miembros), [
    { id: 'c1', autorId: 1, autorNombre: 'Yo', contenido: 'Primero', fechaCreacion: t(1).toISOString(), editado: false, puedeModificar: true },
    { id: 'c2', autorId: 2, autorNombre: 'Compañero 1', contenido: 'Segundo', fechaCreacion: t(5).toISOString(), editado: false, puedeModificar: false },
    { id: 'c4', autorId: 99, autorNombre: 'Usuario desconocido', contenido: 'De alguien que ya no está', fechaCreacion: t(9).toISOString(), editado: false, puedeModificar: false },
  ])
  assert.deepEqual(contarPorTarea(lista), { a: 3, b: 1 })
})

test('al eliminar una tarea se elimina su conversación y no la de otras', () => {
  const lista = nuevo(nuevo([], 'c1', 'a', 1, 'Uno', 0), 'c2', 'b', 1, 'Dos', 1)
  assert.deepEqual(eliminarComentariosDeTarea(lista, 'a').map((c) => c.id), ['c2'])
  assert.equal(eliminarComentariosDeTarea(lista, 'zzz'), lista)
})
