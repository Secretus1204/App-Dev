import { apiClient } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { Book, BookFilters, BookInput } from '@/types/catalog'

export const bookService = {
  list(filters: BookFilters = {}): Promise<ApiEnvelope<Book[]>> {
    return apiClient.get<Book[]>('/books', { ...filters })
  },

  async get(id: number): Promise<Book> {
    const response = await apiClient.get<Book>(`/books/${id}`)
    return response.data
  },

  async create(input: BookInput): Promise<Book> {
    const response = await apiClient.post<Book>('/books', input)
    return response.data
  },

  async update(id: number, input: Partial<BookInput>): Promise<Book> {
    const { initial_copies: _initialCopies, ...attributes } = input
    const response = await apiClient.patch<Book>(`/books/${id}`, attributes)
    return response.data
  },

  async setActive(id: number, isActive: boolean): Promise<Book> {
    const response = await apiClient.patch<Book>(`/books/${id}/archive`, { is_active: isActive })
    return response.data
  },

  async uploadCover(id: number, cover: File): Promise<Book> {
    const formData = new FormData()
    formData.append('cover', cover)
    const response = await apiClient.post<Book>(`/books/${id}/cover`, formData)
    return response.data
  },
}
