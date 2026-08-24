import { apiClient } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { Loan, LoanFilters, ReturnLoanInput } from '@/types/loan'

export const loanService = {
  listMine(filters: LoanFilters = {}): Promise<ApiEnvelope<Loan[]>> {
    return apiClient.get<Loan[]>('/loans', { ...filters })
  },

  listAdmin(filters: LoanFilters = {}): Promise<ApiEnvelope<Loan[]>> {
    return apiClient.get<Loan[]>('/admin/loans', { ...filters })
  },

  async getAdmin(id: number): Promise<Loan> {
    const response = await apiClient.get<Loan>(`/admin/loans/${id}`)
    return response.data
  },

  async recordReturn(id: number, input: ReturnLoanInput): Promise<Loan> {
    const response = await apiClient.post<Loan>(`/admin/loans/${id}/return`, input)
    return response.data
  },
}
