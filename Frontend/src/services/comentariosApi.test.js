import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { crearComentario, eliminarComentario, getComentarios } from './comentariosApi.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

const respuesta = {
  id: 7, proyecto_id: 1, tarea_id: 10, autor: { id: 2, nombre: 'Beto' }, contenido: 'Ya lo revisé',
  fecha_creacion: '2026-10-18T10:00:00Z', fecha_actualizacion: '2026-10-18T10:05:00Z',
  editado: true, puede_modificar: true,
}

test('consulta la conversación con sesión y la adapta al formato de vista', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/proyectos/1/tareas/10/comentarios')
    assert.equal(options.credentials, 'same-origin')
    assert.equal(options.cache, 'no-store')
    return Response.json([respuesta])
  }
  assert.deepEqual(await getComentarios(1, 10), [{
    id: '7', autorId: 2, autorNombre: 'Beto', contenido: 'Ya lo revisé',
    fechaCreacion: '2026-10-18T10:00:00Z', editado: true, puedeModificar: true,
  }])
})

test('pide el token CSRF antes de publicar y no envía el autor', async () => {
  const llamadas = []
  globalThis.fetch = async (url, options) => {
    llamadas.push([url, options])
    return url === '/api/notificaciones/csrf' ? Response.json({ token: 'abc' }) : Response.json(respuesta, { status: 201 })
  }
  const comentario = await crearComentario(1, 10, 'Ya lo revisé')
  assert.equal(comentario.id, '7')
  assert.equal(llamadas[0][0], '/api/notificaciones/csrf')
  const [url, options] = llamadas[1]
  assert.equal(url, '/api/proyectos/1/tareas/10/comentarios')
  assert.equal(options.method, 'POST')
  assert.equal(options.headers['X-CSRF-TOKEN'], 'abc')
  assert.deepEqual(JSON.parse(options.body), { contenido: 'Ya lo revisé' })
})

test('elimina con DELETE y token CSRF, y acepta la respuesta vacía 204', async () => {
  const llamadas = []
  globalThis.fetch = async (url, options) => {
    llamadas.push([url, options])
    return url === '/api/notificaciones/csrf' ? Response.json({ token: 'abc' }) : new Response(null, { status: 204 })
  }
  assert.equal(await eliminarComentario(1, 10, 7), undefined)
  assert.equal(llamadas[1][0], '/api/proyectos/1/tareas/10/comentarios/7')
  assert.equal(llamadas[1][1].method, 'DELETE')
  assert.equal(llamadas[1][1].headers['X-CSRF-TOKEN'], 'abc')
})

test('muestra mensajes claros según el error del servidor', async () => {
  globalThis.fetch = async () => Response.json({ mensaje: 'Escribe un comentario.' }, { status: 400 })
  await assert.rejects(getComentarios(1, 10), { status: 400, message: 'Escribe un comentario.' })
  globalThis.fetch = async () => new Response(null, { status: 409 })
  await assert.rejects(getComentarios(1, 10), { status: 409, message: 'La tarea esta archivada y ya no admite cambios.' })
  globalThis.fetch = async () => { throw new TypeError('fallo de red') }
  await assert.rejects(getComentarios(1, 10), { status: 0 })
})
