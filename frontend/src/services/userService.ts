import { apiClient } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { CreateUserInput, UpdateUserInput, User, UserFilters, UserStatus } from '@/types/auth'

export const userService = {
  list(filters: UserFilters = {}): Promise<ApiEnvelope<User[]>> {
    return apiClient.get<User[]>('/admin/users', { ...filters })
  },

  async get(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/admin/users/${id}`)
    return response.data
  },

  async create(input: CreateUserInput): Promise<User> {
    const response = await apiClient.post<User>('/admin/users', input)
    return response.data
  },

  async update(id: number, input: UpdateUserInput): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${id}`, input)
    return response.data
  },

  async updateStatus(id: number, status: UserStatus): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${id}/status`, { status })
    return response.data
  },
}

