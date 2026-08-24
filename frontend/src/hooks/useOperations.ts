import { useQuery } from '@tanstack/react-query'
import { operationsService } from '@/services/operationsService'
import type { ReportFilters } from '@/types/operations'

export function useDashboard() {
  return useQuery({ queryKey: ['admin-dashboard'], queryFn: operationsService.dashboard })
}

export function useBorrowingReport(filters: ReportFilters) {
  return useQuery({ queryKey: ['admin-report', filters], queryFn: () => operationsService.report(filters) })
}
