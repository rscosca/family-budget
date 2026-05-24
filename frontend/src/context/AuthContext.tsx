import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, ApiError, resetCsrfCache } from '../lib/api'

export type AuthUser = {
  id: number
  username: string
  name: string
  email: string
  role: 'admin' | 'collaborator'
  avatar_initials: string
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiFetch<AuthUser>('/api/user')
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch((err) => {
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.error('Auth hydrate failed:', err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function login(username: string, password: string) {
    const res = await apiFetch<{ data: AuthUser }>('/api/auth/login', {
      method: 'POST',
      json: { username, password },
    })
    setUser(res.data)
  }

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      resetCsrfCache()
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
