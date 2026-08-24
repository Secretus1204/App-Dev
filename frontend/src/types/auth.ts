export type UserRole = 'admin' | 'user'
export type UserStatus = 'active' | 'inactive' | 'pending'

export interface User {
  id: number
  name: string
  member_id: string | null
  email: string
  role: UserRole
  status: UserStatus
  must_change_password: boolean
  borrow_requests_count: number
  loans_count: number
  active_loans_count: number
  created_by?: {
    id: number
    name: string
    email: string
  } | null
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface UserFilters {
  search?: string
  role?: UserRole
  status?: UserStatus
  sort?: 'name' | 'email' | 'member_id' | 'created_at' | 'last_login_at'
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface CreateUserInput {
  name: string
  member_id: string | null
  email: string
  role: UserRole
  status: UserStatus
  password: string
  password_confirmation: string
}

export interface UpdateUserInput {
  name?: string
  member_id?: string | null
  email?: string
}

export interface AuthPayload {
  user: User
  token: string
  token_type: 'Bearer'
}

export interface LoginCredentials {
  email: string
  password: string
  device_name?: string
}
