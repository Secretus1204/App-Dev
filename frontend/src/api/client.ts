import { tokenStorage } from '@/api/tokenStorage'
import type { ApiEnvelope, ValidationErrors } from '@/types/api'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: ValidationErrors = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(`${API_BASE_URL}${path}`)

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
    }
  })

  return url.toString()
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<ApiEnvelope<T>> {
  const token = tokenStorage.get()
  const isFormData = body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({
    success: false,
    message: 'The server returned an invalid response.',
    errors: {},
  }))

  if (!response.ok) {
    if (response.status === 401 && token) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('auth:unauthorized'))
    }

    throw new ApiError(
      payload.message ?? 'The request could not be completed.',
      response.status,
      payload.errors ?? {},
    )
  }

  return payload as ApiEnvelope<T>
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>('GET', path, undefined, params),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  async download(path: string, params?: Record<string, unknown>): Promise<Blob> {
    const token = tokenStorage.get()
    const response = await fetch(buildUrl(path, params), {
      headers: {
        Accept: 'text/csv',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'The download could not be completed.' }))
      throw new ApiError(payload.message ?? 'The download could not be completed.', response.status, payload.errors ?? {})
    }

    return response.blob()
  },
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const validationMessage = Object.values(error.errors).flat()[0]
    return validationMessage ?? error.message
  }

  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export function assetUrl(path: string | null): string | null {
  if (!path || /^https?:\/\//i.test(path)) return path
  return new URL(path, API_BASE_URL).toString()
}
