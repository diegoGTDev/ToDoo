import { useId } from 'react'
import NotificationList from './NotificationList.jsx'
import './notifications.css'

export default function NotificationBell({ notifications = [], onMarkAsRead, loading = false, error = null, pendingId = null }) {
  const headingId = useId()
  const unreadCount = notifications.filter((notification) => !notification.leida).length
  const statusText = loading ? 'Cargando notificaciones...' : error ? error.message : unreadCount === 0 ? 'Estas al dia' : `${unreadCount} sin leer`

  function closeOnEscape(event) {
    if (event.key === 'Escape') {
      event.currentTarget.open = false
      event.currentTarget.querySelector('summary').focus()
    }
  }

  return (
    <details className="notification-menu" onKeyDown={closeOnEscape}>
      <summary className="notification-trigger" aria-label={loading || error ? 'Notificaciones' : `Notificaciones: ${unreadCount} sin leer`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {!loading && !error && unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </summary>
      <section className="notification-panel" aria-labelledby={headingId}>
        <header className="notification-panel-header">
          <h2 id={headingId}>Notificaciones</h2>
          <p role="status">{statusText}</p>
        </header>
        {!loading && !error && <NotificationList notifications={notifications} onMarkAsRead={onMarkAsRead} pendingId={pendingId} />}
      </section>
    </details>
  )
}
