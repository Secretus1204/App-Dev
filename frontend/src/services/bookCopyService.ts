import { apiClient } from '@/api/client'
import type { BookCopy, BookCopyInput, BookCopyStatus, BookCopyUpdate } from '@/types/catalog'

export const bookCopyService = {
  async list(bookId: number, status?: BookCopyStatus): Promise<BookCopy[]> {
    const response = await apiClient.get<BookCopy[]>(`/books/${bookId}/copies`, { status })
    return response.data
  },

  async create(bookId: number, input: BookCopyInput): Promise<BookCopy> {
    const response = await apiClient.post<BookCopy>(`/books/${bookId}/copies`, input)
    return response.data
  },

  async update(id: number, input: BookCopyUpdate): Promise<BookCopy> {
    const response = await apiClient.patch<BookCopy>(`/book-copies/${id}`, input)
    return response.data
  },

  async setArchived(id: number, archived: boolean): Promise<BookCopy> {
    const response = await apiClient.patch<BookCopy>(`/book-copies/${id}/archive`, { archived })
    return response.data
  },
}

