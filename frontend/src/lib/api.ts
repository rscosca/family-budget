const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`))
    ?.split('=')[1]
}

let csrfReady = false

async function ensureCsrf() {
  if (csrfReady && readCookie('XSRF-TOKEN')) return
  const res = await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' })
  if (!res.ok) throw new ApiError(res.status, 'No se pudo obtener el token CSRF.')
  csrfReady = true
}

type ApiOptions = RequestInit & { json?: unknown }

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const mutates = method !== 'GET' && method !== 'HEAD'

  if (mutates) await ensureCsrf()

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.json !== undefined) headers.set('Content-Type', 'application/json')

  if (mutates) {
    const token = readCookie('XSRF-TOKEN')
    if (token) headers.set('X-XSRF-TOKEN', decodeURIComponent(token))
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  })

  if (res.status === 204) return undefined as T

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : await res.text()

  if (!res.ok) {
    const message = (isJson && (body as { message?: string }).message) || `Error ${res.status}`
    const errors = isJson ? (body as { errors?: Record<string, string[]> }).errors : undefined
    throw new ApiError(res.status, message, errors)
  }

  return body as T
}

export function resetCsrfCache() {
  csrfReady = false
}
