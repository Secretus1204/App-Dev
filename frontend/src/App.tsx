import { Route, Routes } from 'react-router-dom'
import AdminRoute from '@/guards/AdminRoute'
import AdminLayout from '@/layouts/AdminLayout'
import LoginPage from '@/pages/Auth/LoginPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminRoute />}>
        <Route path="/*" element={<AdminLayout />} />
      </Route>
    </Routes>
  )
}

