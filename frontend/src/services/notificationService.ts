import { apiClient } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { LibraryNotification } from '@/types/notification'

export const notificationService = {
  list(perPage = 20): Promise<ApiEnvelope<LibraryNotification[]>> {
    return apiClient.get<LibraryNotification[]>('/notifications', { per_page: perPage })
  },

  async markRead(id: string): Promise<LibraryNotification> {
    const response = await apiClient.post<LibraryNotification>(`/notifications/${id}/read`)
    return response.data
  },

  async markAllRead(): Promise<number> {
    const response = await apiClient.post<{ updated: number }>('/notifications/read-all')
    return response.data.updated
  },
}
