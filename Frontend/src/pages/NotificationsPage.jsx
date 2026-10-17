import { useState } from 'react'
import { Link } from 'react-router-dom'
import NotificationBell from '../components/notifications/NotificationBell.jsx'
import NotificationList from '../components/notifications/NotificationList.jsx'
import useNotifications from '../hooks/useNotifications.js'
import todooLogo from '../assets/todoo-logo.png'

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all')
  const notifications = useNotifications()
  const unreadCount = notifications.items.filter((item) => !item.leida).length
  const visibleNotifications = filter === 'unread'
    ? notifications.items.filter((item) => !item.leida)
    : notifications.items

  return (
    <div className="notifications-page">
      <header className="notifications-page-header">
        <Link to="/" aria-label="ToDoo: ir al inicio">
          <img src={todooLogo} alt="ToDoo" />
        </Link>
        <NotificationBell
          notifications={notifications.items}
          onMarkAsRead={notifications.markAsRead}
          loading={notifications.loading}
          error={notifications.error}
          pendingId={notifications.pendingId}
        />
      </header>
      <main className="notifications-page-main">
        <h1>Notificaciones</h1>
        <p className="notifications-page-intro">Consulta las tareas que te han asignado y mantente al dia.</p>
        <section className="notifications-inbox" aria-label="Bandeja de notificaciones">
          <div className="notifications-toolbar">
            <div className="notifications-filters" role="group" aria-label="Filtrar notificaciones">
              <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todas</button>
              <button type="button" aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Sin leer{!notifications.loading && !notifications.error ? ` (${unreadCount})` : ''}</button>
            </div>
            <button type="button" className="notification-read-button" disabled={notifications.loading || notifications.pendingId !== null} onClick={notifications.reload}>Actualizar</button>
          </div>
          {notifications.loading ? <p className="notification-empty" role="status">Cargando notificaciones...</p>
            : notifications.error ? (
              <div className="notification-empty" role="alert">
                <p>{notifications.error.message}</p>
                {notifications.error.status === 401 && <Link className="notification-read-button" to="/">Ir al inicio de sesion</Link>}
              </div>
            ) : (
                <NotificationList
                  notifications={visibleNotifications}
                  onMarkAsRead={notifications.markAsRead}
                  pendingId={notifications.pendingId}
                  emptyTitle={filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
                  emptyDescription={filter === 'unread' ? 'Estas al dia con tus avisos.' : 'Cuando te asignen una tarea, aparecera aqui.'}
                />
            )}
        </section>
        <p className="notifications-feedback" role="status">{notifications.feedback}</p>
      </main>
    </div>
  )
}
