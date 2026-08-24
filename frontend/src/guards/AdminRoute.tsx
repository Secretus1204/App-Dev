import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminRoute() {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center text-[#A50034]">
        <BookOpen className="animate-pulse" size={42} />
      </div>
    )
  }

  return user?.role === 'admin'
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />
}

