import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '@/api/client'
import { tokenStorage } from '@/api/tokenStorage'
import { authService } from '@/services/authService'
import type { LoginCredentials, User } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  initializing: boolean
  login: (credentials: LoginCredentials, remember: boolean) => Promise<User>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, password: string, confirmation: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      if (!tokenStorage.get()) {
        setInitializing(false)
        return
      }

      try {
        const currentUser = await authService.me()
        if (currentUser.role !== 'admin') throw new ApiError('Admin access is required.', 403)
        setUser(currentUser)
      } catch {
        tokenStorage.clear()
      } finally {
        setInitializing(false)
      }
    }

    void restoreSession()
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    async login(credentials, remember) {
      const payload = await authService.login({ ...credentials, device_name: 'web-admin' })
      tokenStorage.set(payload.token, remember)
      if (payload.user.role !== 'admin') {
        try {
          await authService.logout()
        } finally {
          tokenStorage.clear()
        }
        throw new ApiError('This account cannot access the admin panel.', 403)
      }
      setUser(payload.user)
      return payload.user
    },
    async logout() {
      try {
        if (tokenStorage.get()) await authService.logout()
      } finally {
        tokenStorage.clear()
        setUser(null)
      }
    },
    async changePassword(currentPassword, password, confirmation) {
      await authService.changePassword(currentPassword, password, confirmation)
      tokenStorage.clear()
      setUser(null)
    },
  }), [initializing, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
