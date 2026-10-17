import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { getNotifications, markNotificationRead } from './notificationsApi.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('consulta los avisos con sesion y sin cache', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/notificaciones')
    assert.equal(options.credentials, 'same-origin')
    assert.equal(options.cache, 'no-store')
    return Response.json([])
  }
  assert.deepEqual(await getNotifications(), [])
})

test('obtiene el token de la sesion antes de marcar como leida', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push(url)
    if (url.endsWith('/csrf')) return Response.json({ token: 'session-token' })
    assert.equal(options.method, 'PATCH')
    assert.equal(options.headers['X-CSRF-TOKEN'], 'session-token')
    return Response.json({ id: 7, leida: true })
  }
  assert.equal((await markNotificationRead(7)).leida, true)
  assert.deepEqual(calls, ['/api/notificaciones/csrf', '/api/notificaciones/7/leida'])
})

test('una sesion vencida exige login y no simula una lista vacia', async () => {
  globalThis.fetch = async () => new Response(null, { status: 401 })
  await assert.rejects(getNotifications(), { status: 401, message: 'Inicia sesion para consultar tus notificaciones.' })
})

test('no intenta actualizar si falla la obtencion del token', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls += 1; return new Response(null, { status: 503 }) }
  await assert.rejects(markNotificationRead(7), { status: 503 })
  assert.equal(calls, 1)
})

test('distingue una cancelacion de un fallo de conexion', async () => {
  globalThis.fetch = async () => { throw new DOMException('Cancelado', 'AbortError') }
  await assert.rejects(getNotifications(), { name: 'AbortError' })
  globalThis.fetch = async () => { throw new TypeError('Network error') }
  await assert.rejects(getNotifications(), { status: 0 })
})
