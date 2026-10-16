import { useState } from 'react'
import { Link } from 'react-router-dom'
import NotificationBell from '../components/notifications/NotificationBell.jsx'
import NotificationList from '../components/notifications/NotificationList.jsx'
import todooLogo from '../assets/todoo-logo.png'

export default function NotificationsPage({ initialNotifications = [] }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState('all')
  const [feedback, setFeedback] = useState('')
  const unreadCount = notifications.filter((notification) => !notification.leida).length
  const visibleNotifications = filter === 'unread'
    ? notifications.filter((notification) => !notification.leida)
    : notifications

  function markAsRead(id) {
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((notification) =>
      notification.id === id && !notification.leida
        ? { ...notification, leida: true, fecha_lectura: readAt }
        : notification,
    ))
    setFeedback('Notificacion marcada como leida.')
  }

  return (
    <div className="notifications-page">
      <header className="notifications-page-header">
        <Link to="/" aria-label="ToDoo: ir al inicio">
          <img src={todooLogo} alt="ToDoo" />
        </Link>
        <NotificationBell notifications={notifications} onMarkAsRead={markAsRead} />
      </header>
      <main className="notifications-page-main">
        <h1>Notificaciones</h1>
        <p className="notifications-page-intro">Consulta las tareas que te han asignado y mantente al dia.</p>
        <section className="notifications-inbox" aria-label="Bandeja de notificaciones">
          <div className="notifications-toolbar">
            <div className="notifications-filters" role="group" aria-label="Filtrar notificaciones">
              <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todas</button>
              <button type="button" aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Sin leer ({unreadCount})</button>
            </div>
            <span className="notifications-total">{notifications.length} {notifications.length === 1 ? 'notificacion' : 'notificaciones'}</span>
          </div>
          <NotificationList
            notifications={visibleNotifications}
            onMarkAsRead={markAsRead}
            emptyTitle={filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            emptyDescription={filter === 'unread' ? 'Estas al dia con tus avisos.' : 'Cuando te asignen una tarea, aparecera aqui.'}
          />
        </section>
        <p className="notifications-feedback" role="status">{feedback}</p>
      </main>
    </div>
  )
}
