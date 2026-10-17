import { Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/notificaciones" element={<NotificationsPage />} />
    </Routes>
  )
}
