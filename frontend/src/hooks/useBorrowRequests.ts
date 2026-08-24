import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { borrowRequestService } from '@/services/borrowRequestService'
import type { BorrowRequestFilters } from '@/types/borrowRequest'

export function useAdminBorrowRequests(filters: BorrowRequestFilters) {
  return useQuery({
    queryKey: ['admin-borrow-requests', filters],
    queryFn: () => borrowRequestService.listAdmin(filters),
  })
}

export function useAdminBorrowRequest(id?: number) {
  return useQuery({
    queryKey: ['admin-borrow-requests', id],
    queryFn: () => borrowRequestService.getAdmin(id!),
    enabled: Number.isInteger(id),
  })
}

export function useApproveBorrowRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adminNotes, bookCopyId, dueAt }: { id: number; adminNotes: string | null; bookCopyId?: number; dueAt?: string }) => borrowRequestService.approve(id, { adminNotes, bookCopyId, dueAt }),
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['admin-borrow-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-loans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.setQueryData(['admin-borrow-requests', request.id], request)
    },
  })
}

export function useRejectBorrowRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rejectionReason, adminNotes }: { id: number; rejectionReason: string; adminNotes: string | null }) => borrowRequestService.reject(id, rejectionReason, adminNotes),
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['admin-borrow-requests'] })
      queryClient.setQueryData(['admin-borrow-requests', request.id], request)
    },
  })
}
