import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './Routes.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
