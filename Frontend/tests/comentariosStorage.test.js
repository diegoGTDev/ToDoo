import test from 'node:test'
import assert from 'node:assert/strict'
import { cargarComentarios, guardarComentarios } from '../src/services/comentariosStorage.js'

function memoria(valor = null) {
  return {
    getItem: () => valor,
    setItem: (_key, nuevo) => { valor = nuevo },
  }
}

const fecha = '2026-10-18T10:00:00.000Z'
const comentario = {
  id: 'c1', tareaId: 'a', autorId: 1, contenido: 'Revisé el diseño',
  fechaCreacion: fecha, fechaActualizacion: fecha,
}

test('un navegador sin comentarios empieza vacío', () => {
  assert.deepEqual(cargarComentarios(memoria()), { comentarios: [], error: '' })
})

test('conserva los comentarios y su orden después de guardar y cargar', () => {
  const storage = memoria()
  const lista = [{ ...comentario, id: 'c2' }, comentario]
  assert.equal(guardarComentarios(lista, storage), '')
  assert.deepEqual(cargarComentarios(storage), { comentarios: lista, error: '' })
})

test('no sobrescribe datos dañados al cargarlos', () => {
  for (const valor of ['JSON dañado', '{}', 'null']) {
    const storage = memoria(valor)
    const resultado = cargarComentarios(storage)
    assert.deepEqual(resultado.comentarios, [])
    assert.ok(resultado.error)
    assert.equal(storage.getItem(), valor)
  }
})

test('recupera los comentarios válidos y descarta duplicados y campos incorrectos', () => {
  const guardados = [comentario, comentario, null, { ...comentario, id: 'c2', contenido: '   ' },
    { ...comentario, id: 'c3', autorId: 'Ana' }, { ...comentario, id: 'c4', tareaId: 7 },
    { ...comentario, id: 'c5', fechaCreacion: 'ayer' }, { ...comentario, id: 'c6', contenido: 'a'.repeat(1001) }]
  const storage = memoria(JSON.stringify(guardados))
  const resultado = cargarComentarios(storage)
  assert.deepEqual(resultado.comentarios, [comentario])
  assert.ok(resultado.error)
  assert.deepEqual(JSON.parse(storage.getItem()), guardados)
})

test('informa cuando el almacenamiento no se puede leer o guardar', () => {
  assert.ok(cargarComentarios({ getItem() { throw new Error('Bloqueado') } }).error)
  assert.ok(guardarComentarios([comentario], { setItem() { throw new Error('Cuota excedida') } }))
})
