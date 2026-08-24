import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/userService'
import type { CreateUserInput, UpdateUserInput, UserFilters, UserStatus } from '@/types/auth'

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => userService.list(filters),
  })
}

export function useAdminUser(id?: number) {
  return useQuery({
    queryKey: ['admin-users', id],
    queryFn: () => userService.get(id!),
    enabled: Number.isInteger(id),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => userService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUserInput }) => userService.update(id, input),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.setQueryData(['admin-users', user.id], user)
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) => userService.updateStatus(id, status),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.setQueryData(['admin-users', user.id], user)
    },
  })
}

