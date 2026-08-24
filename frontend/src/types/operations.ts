import type { BorrowRequest } from '@/types/borrowRequest'
import type { Loan } from '@/types/loan'

export interface MonthlyActivity {
  month: string
  year: number
  borrowed: number
  returned: number
}

export interface PopularBook {
  id: number
  title: string
  author: string
  cover_url: string | null
  borrow_count: number
}

export interface DashboardData {
  summary: {
    total_books: number
    available_copies: number
    borrowed_copies: number
    pending_requests: number
    overdue_loans: number
    active_members: number
  }
  monthly_activity: MonthlyActivity[]
  popular_books: PopularBook[]
  recent_requests: BorrowRequest[]
  current_loans: Loan[]
}

export interface BorrowingReport {
  period: { from: string; to: string }
  summary: {
    total_transactions: number
    total_returns: number
    overdue_count: number
    most_active_user: { id: number; name: string; borrow_count: number } | null
  }
  monthly_activity: MonthlyActivity[]
  category_distribution: { name: string; value: number }[]
  popular_books: PopularBook[]
}

export interface ReportFilters {
  date_from?: string
  date_to?: string
}
