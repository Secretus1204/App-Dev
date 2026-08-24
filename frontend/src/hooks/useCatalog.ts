import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookService } from '@/services/bookService'
import { categoryService } from '@/services/categoryService'
import { bookCopyService } from '@/services/bookCopyService'
import type { BookCopyInput, BookCopyUpdate, BookFilters, BookInput, CategoryFilters, CategoryInput } from '@/types/catalog'

export function useBooks(filters: BookFilters) {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: () => bookService.list(filters),
  })
}

export function useBook(id?: number) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: () => bookService.get(id!),
    enabled: Number.isInteger(id),
  })
}

export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: ['categories', filters],
    queryFn: () => categoryService.list(filters),
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BookInput) => bookService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<BookInput> }) => bookService.update(id, input),
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.setQueryData(['books', book.id], book)
    },
  })
}

export function useSetBookActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => bookService.setActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  })
}

export function useUploadBookCover() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cover }: { id: number; cover: File }) => bookService.uploadCover(id, cover),
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.setQueryData(['books', book.id], book)
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => categoryService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CategoryInput> }) => categoryService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useSetCategoryActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => categoryService.setActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useBookCopies(bookId?: number, status?: 'available' | 'borrowed' | 'lost' | 'damaged' | 'archived') {
  return useQuery({
    queryKey: ['book-copies', bookId, status],
    queryFn: () => bookCopyService.list(bookId!, status),
    enabled: Number.isInteger(bookId),
  })
}

export function useCreateBookCopy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookId, input }: { bookId: number; input: BookCopyInput }) => bookCopyService.create(bookId, input),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['book-copies', copy.book_id] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useUpdateBookCopy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: BookCopyUpdate }) => bookCopyService.update(id, input),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['book-copies', copy.book_id] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useSetBookCopyArchived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) => bookCopyService.setArchived(id, archived),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['book-copies', copy.book_id] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}
