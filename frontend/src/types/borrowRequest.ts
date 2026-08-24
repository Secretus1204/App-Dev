export type BorrowRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface BorrowRequestMember {
  id: number
  name: string
  member_id: string | null
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'pending'
}

export interface BorrowRequestBook {
  id: number
  isbn: string | null
  title: string
  author: string
  cover_url: string | null
  category: string | null
  total_copies: number
  available_copies: number
  availability_status: 'available' | 'limited' | 'unavailable'
  is_active: boolean
}

export interface BorrowRequestReviewer {
  id: number
  name: string
  email: string
}

export interface BorrowRequest {
  id: number
  reference: string
  status: BorrowRequestStatus
  user: BorrowRequestMember
  book: BorrowRequestBook
  reviewed_by: BorrowRequestReviewer | null
  loan: {
    id: number
    reference: string
    status: 'borrowed' | 'overdue' | 'returned'
    book_copy_id: number
    accession_number: string
    borrowed_at: string
    due_at: string
  } | null
  rejection_reason: string | null
  admin_notes: string | null
  requested_at: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface BorrowRequestFilters {
  search?: string
  status?: BorrowRequestStatus
  user_id?: number
  book_id?: number
  sort?: 'requested_at' | 'reviewed_at' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}
