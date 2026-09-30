import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { session } from '@/state/session'
import type { PageMeta } from '@/types/api'

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  status: number
  code: string
  details: unknown

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type Envelope<T> = {
  success: boolean
  data: T
  meta?: PageMeta
  error?: { code: string; message: string; details: unknown }
}

export type ApiResult<T> = { data: T; meta?: PageMeta }

const http = axios.create({
  baseURL,
  headers: { 'X-Client-Platform': 'web' },
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = session.getRefresh()
  if (!refreshToken || !baseURL) return null
  try {
    const response = await axios.post<Envelope<{ accessToken: string; refreshToken: string }>>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { headers: { 'X-Client-Platform': 'web' } },
    )
    const next = response.data.data
    session.setTokens(next.accessToken, next.refreshToken)
    return next.accessToken
  } catch {
    session.clear()
    window.dispatchEvent(new Event('auth:expired'))
    return null
  }
}

function toApiError(error: AxiosError<Envelope<unknown>>): ApiError {
  const payload = error.response?.data?.error
  if (payload) return new ApiError(error.response?.status ?? 500, payload.code, payload.message, payload.details)
  if (!baseURL) return new ApiError(0, 'API_URL_MISSING', 'Set VITE_API_BASE_URL before using the app.')
  if (!error.response) return new ApiError(0, 'NETWORK', 'The API could not be reached.')
  return new ApiError(error.response.status, 'REQUEST_FAILED', 'Request failed')
}

http.interceptors.request.use((config) => {
  const token = session.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Envelope<unknown>>) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const url = original?.url ?? ''
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const token = await refreshPromise
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
        return http(original)
      }
    }
    return Promise.reject(toApiError(error))
  },
)

export async function request<T>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  if (!baseURL) throw new ApiError(0, 'API_URL_MISSING', 'Set VITE_API_BASE_URL before using the app.')
  const response = await http.request<Envelope<T>>(config)
  return { data: response.data.data, meta: response.data.meta }
}

export const api = {
  get<T>(url: string, params?: object) {
    return request<T>({ method: 'GET', url, params })
  },
  post<T>(url: string, data?: unknown) {
    return request<T>({ method: 'POST', url, data: data ?? {} })
  },
  patch<T>(url: string, data?: unknown) {
    return request<T>({ method: 'PATCH', url, data: data ?? {} })
  },
  delete<T>(url: string) {
    return request<T>({ method: 'DELETE', url })
  },
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (Array.isArray(error.details) && error.details.length > 0) {
      const first = error.details[0] as { message?: string }
      if (first?.message) return first.message
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
