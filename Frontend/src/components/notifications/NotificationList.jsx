const dateFormatter = new Intl.DateTimeFormat('es-GT', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function NotificationList({
  notifications = [],
  onMarkAsRead,
  pendingId = null,
  emptyTitle = 'No tienes notificaciones',
  emptyDescription = 'Cuando te asignen una tarea, aparecera aqui.',
}) {
  if (notifications.length === 0) {
    return (
      <div className="notification-empty">
        <strong>{emptyTitle}</strong>
        <p>{emptyDescription}</p>
      </div>
    )
  }

  return (
    <ul className="notification-list">
      {notifications.map((notification) => (
        <li key={notification.id} className={`notification-item ${notification.leida ? '' : 'notification-unread'}`}>
          <div className="notification-item-meta">
            <span>{notification.leida ? 'Leida' : 'Sin leer'}</span>
            <time dateTime={notification.fecha_creacion}>
              {dateFormatter.format(new Date(notification.fecha_creacion))}
            </time>
          </div>
          <p>{notification.mensaje}</p>
          {!notification.leida && (
            <button
              type="button"
              className="notification-read-button"
              disabled={pendingId !== null}
              onClick={() => onMarkAsRead(notification.id)}
              aria-label={`Marcar como leida: ${notification.mensaje}`}
            >
              {pendingId === notification.id ? 'Guardando...' : 'Marcar como leida'}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
