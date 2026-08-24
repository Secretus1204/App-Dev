import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { loanService } from '@/services/loanService'
import type { LoanFilters, ReturnLoanInput } from '@/types/loan'

export function useAdminLoans(filters: LoanFilters) {
  return useQuery({ queryKey: ['admin-loans', filters], queryFn: () => loanService.listAdmin(filters) })
}

export function useAdminLoan(id?: number) {
  return useQuery({
    queryKey: ['admin-loans', id],
    queryFn: () => loanService.getAdmin(id!),
    enabled: Number.isInteger(id),
  })
}

export function useRecordReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ReturnLoanInput }) => loanService.recordReturn(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-report'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}
