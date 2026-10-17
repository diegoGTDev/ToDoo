const baseUrl = '/api/notificaciones'

class NotificationsApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'NotificationsApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json', ...options.headers },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new NotificationsApiError('No se pudo conectar con el servidor. Intenta de nuevo.', 0)
  }
  if (!response.ok) {
    const message = response.status === 401
      ? 'Inicia sesion para consultar tus notificaciones.'
      : response.status === 403
        ? 'Tu sesion necesita actualizarse. Recarga la pagina.'
        : 'No se pudieron guardar o consultar las notificaciones. Intenta de nuevo.'
    throw new NotificationsApiError(message, response.status)
  }
  return response.json()
}

export function getNotifications(signal) {
  return request('', { signal })
}

export async function markNotificationRead(id) {
  const { token } = await request('/csrf')
  return request(`/${id}/leida`, {
    method: 'PATCH',
    headers: { 'X-CSRF-TOKEN': token },
  })
}
