export type AvailabilityStatus = 'available' | 'limited' | 'unavailable'
export type BookCopyStatus = 'available' | 'borrowed' | 'lost' | 'damaged' | 'archived'

export interface Category {
  id: number
  name: string
  description: string | null
  books_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BookCopy {
  id: number
  book_id: number
  accession_number: string
  barcode: string | null
  status: BookCopyStatus
  condition_notes: string | null
  created_at: string
  updated_at: string
}

export interface Book {
  id: number
  isbn: string | null
  title: string
  author: string
  publisher: string | null
  publication_year: number | null
  category: Category
  description: string | null
  cover_url: string | null
  total_copies: number
  available_copies: number
  availability_status: AvailabilityStatus
  is_active: boolean
  copies?: BookCopy[]
  created_at: string
  updated_at: string
}

export interface BookFilters {
  search?: string
  category_id?: number
  availability?: AvailabilityStatus
  sort?: 'title' | 'author' | 'publication_year' | 'created_at'
  direction?: 'asc' | 'desc'
  include_archived?: boolean
  page?: number
  per_page?: number
}

export interface CategoryFilters {
  search?: string
  include_archived?: boolean
}

export interface BookInput {
  category_id: number
  isbn: string | null
  title: string
  author: string
  publisher: string | null
  publication_year: number | null
  description: string | null
  initial_copies?: number
}

export interface CategoryInput {
  name: string
  description: string | null
}

export interface BookCopyInput {
  accession_number?: string | null
  barcode?: string | null
  condition_notes?: string | null
}

export interface BookCopyUpdate extends BookCopyInput {
  status?: 'available' | 'lost' | 'damaged'
}
