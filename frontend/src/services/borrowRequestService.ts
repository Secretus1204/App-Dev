import { apiClient } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { BorrowRequest, BorrowRequestFilters } from '@/types/borrowRequest'

export const borrowRequestService = {
  listMine(filters: BorrowRequestFilters = {}): Promise<ApiEnvelope<BorrowRequest[]>> {
    return apiClient.get<BorrowRequest[]>('/borrow-requests', { ...filters })
  },

  async create(bookId: number): Promise<BorrowRequest> {
    const response = await apiClient.post<BorrowRequest>('/borrow-requests', { book_id: bookId })
    return response.data
  },

  async cancel(id: number): Promise<BorrowRequest> {
    const response = await apiClient.patch<BorrowRequest>(`/borrow-requests/${id}/cancel`)
    return response.data
  },

  listAdmin(filters: BorrowRequestFilters = {}): Promise<ApiEnvelope<BorrowRequest[]>> {
    return apiClient.get<BorrowRequest[]>('/admin/borrow-requests', { ...filters })
  },

  async getAdmin(id: number): Promise<BorrowRequest> {
    const response = await apiClient.get<BorrowRequest>(`/admin/borrow-requests/${id}`)
    return response.data
  },

  async approve(id: number, input: { adminNotes: string | null; bookCopyId?: number; dueAt?: string }): Promise<BorrowRequest> {
    const response = await apiClient.patch<BorrowRequest>(`/admin/borrow-requests/${id}/approve`, {
      admin_notes: input.adminNotes,
      book_copy_id: input.bookCopyId,
      due_at: input.dueAt,
    })
    return response.data
  },

  async reject(id: number, rejectionReason: string, adminNotes: string | null): Promise<BorrowRequest> {
    const response = await apiClient.patch<BorrowRequest>(`/admin/borrow-requests/${id}/reject`, {
      rejection_reason: rejectionReason,
      admin_notes: adminNotes,
    })
    return response.data
  },
}
