import { useEffect, useState } from 'react'
import { getNotifications, markNotificationRead } from '../services/notificationsApi.js'

export default function useNotifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [pendingId, setPendingId] = useState(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getNotifications(controller.signal)
      .then((notifications) => {
        if (!controller.signal.aborted) setItems(notifications)
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(failure)
          setItems([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reloadCount])

  function reload() {
    setLoading(true)
    setError(null)
    setFeedback('')
    setReloadCount((current) => current + 1)
  }

  async function markAsRead(id) {
    if (pendingId !== null) return
    setPendingId(id)
    setFeedback('')
    try {
      const updated = await markNotificationRead(id)
      setItems((current) => current.map((item) => item.id === id ? updated : item))
      setFeedback('Notificacion marcada como leida.')
    } catch (failure) {
      setFeedback(failure.message)
      if (failure.status === 401) {
        setError(failure)
        setItems([])
      }
    } finally {
      setPendingId(null)
    }
  }

  return { items, loading, error, feedback, pendingId, markAsRead, reload }
}
