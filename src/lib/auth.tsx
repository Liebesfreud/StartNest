import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const AUTH_KEY = 'startnest:auth'

function readStoredAuth() {
  try {
    return localStorage.getItem(AUTH_KEY) === 'true'
  } catch {
    return false
  }
}

function storeAuth(value: boolean) {
  try {
    if (value) {
      localStorage.setItem(AUTH_KEY, 'true')
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  } catch {
    // storage unavailable — session-only auth
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(readStoredAuth)
  const [isLoading, setIsLoading] = useState(false)

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) {
        setAuthenticated(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      let json: unknown
      try {
        json = await response.json()
      } catch {
        return { success: false, error: '服务器响应解析失败。' }
      }

      if (!response.ok) {
        const message =
          (typeof json === 'object' && json !== null && 'error' in json && typeof (json as { error: { message?: string } }).error?.message === 'string')
            ? (json as { error: { message: string } }).error.message
            : response.status === 401
              ? '用户名或密码不正确。'
              : response.status === 429
                ? '尝试次数过多，请稍后再试。'
                : '登录失败，请稍后重试。'
        return { success: false, error: message }
      }

      // Accept both { ok: true, data: { ... } } and { ok: true }
      const ok = typeof json === 'object' && json !== null && 'ok' in json && (json as { ok: boolean }).ok === true
      if (!ok && response.status >= 400) {
        return { success: false, error: '登录失败，请稍后重试。' }
      }

      setAuthenticated(true)
      storeAuth(true)
      return { success: true }
    } catch {
      return { success: false, error: '网络请求失败，请检查连接后重试。' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setAuthenticated(false)
    storeAuth(false)
    try {
      localStorage.removeItem('startnest:bootstrap')
    } catch {
      // ignore
    }
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      // ignore logout network errors
    }
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, login, logout }),
    [isAuthenticated, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
