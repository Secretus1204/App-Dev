import { apiClient } from '@/api/client'
import type { BorrowingReport, DashboardData, ReportFilters } from '@/types/operations'

export const operationsService = {
  async dashboard(): Promise<DashboardData> {
    const response = await apiClient.get<DashboardData>('/admin/dashboard')
    return response.data
  },

  async report(filters: ReportFilters = {}): Promise<BorrowingReport> {
    const response = await apiClient.get<BorrowingReport>('/admin/reports/borrowings', { ...filters })
    return response.data
  },

  export(filters: ReportFilters = {}): Promise<Blob> {
    return apiClient.download('/admin/reports/borrowings/export', { ...filters })
  },
}
