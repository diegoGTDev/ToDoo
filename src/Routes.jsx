import { Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
    </Routes>
  )
}
