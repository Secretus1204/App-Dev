export type LoanStatus = 'borrowed' | 'overdue' | 'returned'

export interface Loan {
  id: number
  reference: string
  status: LoanStatus
  borrow_request_id: number
  user: {
    id: number
    name: string
    member_id: string | null
    email: string
  }
  book_copy: {
    id: number
    accession_number: string
    barcode: string | null
    status: string
    book: {
      id: number
      title: string
      author: string
      isbn: string | null
      category: string | null
      cover_url: string | null
    }
  }
  issued_by: { id: number; name: string }
  received_by: { id: number; name: string } | null
  borrowed_at: string
  due_at: string
  returned_at: string | null
  days_remaining: number | null
  is_due_soon: boolean
  return_condition: 'good' | 'damaged' | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LoanFilters {
  search?: string
  status?: LoanStatus
  user_id?: number
  book_id?: number
  date_from?: string
  date_to?: string
  sort?: 'borrowed_at' | 'due_at' | 'returned_at' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface ReturnLoanInput {
  returned_at?: string | null
  return_condition: 'good' | 'damaged'
  notes: string | null
}
