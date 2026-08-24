import { apiClient } from '@/api/client'
import type { Category, CategoryFilters, CategoryInput } from '@/types/catalog'

export const categoryService = {
  async list(filters: CategoryFilters = {}): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories', { ...filters })
    return response.data
  },

  async create(input: CategoryInput): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', input)
    return response.data
  },

  async update(id: number, input: Partial<CategoryInput>): Promise<Category> {
    const response = await apiClient.patch<Category>(`/categories/${id}`, input)
    return response.data
  },

  async setActive(id: number, isActive: boolean): Promise<Category> {
    const response = await apiClient.patch<Category>(`/categories/${id}/archive`, { is_active: isActive })
    return response.data
  },
}
