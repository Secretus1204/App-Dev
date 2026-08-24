import { apiClient } from '@/api/client'
import type { AuthPayload, LoginCredentials, User } from '@/types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthPayload> {
    const response = await apiClient.post<AuthPayload>('/auth/login', credentials)
    return response.data
  },

  async me(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },

  async logout(): Promise<void> {
    await apiClient.post<null>('/auth/logout')
  },

  async changePassword(currentPassword: string, password: string, confirmation: string): Promise<void> {
    await apiClient.put<null>('/auth/password', {
      current_password: currentPassword,
      password,
      password_confirmation: confirmation,
    })
  },
}
