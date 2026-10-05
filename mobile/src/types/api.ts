export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';
export type BorrowRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LoanStatus = 'borrowed' | 'overdue' | 'returned';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta & { unread_count?: number };
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface User {
  id: number;
  name: string;
  member_id: string;
  library_card_code: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  must_change_password: boolean;
  active_loans_count: number;
  created_at: string | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  books_count: number;
  is_active: boolean;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string | null;
  publication_year: number | null;
  category?: Category;
  description: string | null;
  cover_url: string | null;
  total_copies: number;
  available_copies: number;
  availability_status: AvailabilityStatus;
  is_active: boolean;
}

export interface BorrowRequestBook {
  id: number;
  isbn: string;
  title: string;
  author: string;
  cover_url: string | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  availability_status: AvailabilityStatus;
  is_active: boolean;
}

export interface BorrowRequest {
  id: number;
  reference: string;
  status: BorrowRequestStatus;
  book: BorrowRequestBook;
  rejection_reason: string | null;
  requested_at: string;
  reviewed_at: string | null;
}

export interface Loan {
  id: number;
  reference: string;
  status: LoanStatus;
  book_copy: {
    id: number;
    accession_number: string;
    barcode: string | null;
    status: string;
    book: {
      id: number;
      title: string;
      author: string;
      isbn: string;
      category: string | null;
      cover_url: string | null;
    };
  };
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  days_remaining: number | null;
  is_due_soon: boolean;
}

export interface LibraryNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AuthPayload {
  user: User;
  token: string;
  token_type: 'Bearer';
}
