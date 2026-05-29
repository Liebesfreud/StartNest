import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { applyTheme, readStoredThemeMode } from '../../lib/theme'
import { AppIcon } from '../../components/AppIcon'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Apply persisted theme so the login page respects dark/light mode
  useEffect(() => {
    const mode = readStoredThemeMode()
    if (mode) applyTheme(mode)
  }, [])

  const redirectTo = searchParams.get('redirect') || '/'

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      const trimmedUsername = username.trim()
      const trimmedPassword = password.trim()

      if (!trimmedUsername) {
        setError('请输入用户名。')
        return
      }
      if (!trimmedPassword) {
        setError('请输入密码。')
        return
      }

      const result = await login(trimmedUsername, trimmedPassword)
      if (result.success) {
        navigate(redirectTo, { replace: true })
      } else {
        setError(result.error ?? '登录失败，请稍后重试。')
      }
    },
    [username, password, login, navigate, redirectTo],
  )

  // Already authenticated → redirect away
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 dark:bg-dark-background">
      {/* Ambient decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/[0.04] blur-3xl dark:bg-primary/[0.06]" />
        <div className="absolute -bottom-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-accent/[0.03] blur-3xl dark:bg-accent/[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-[26rem]">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-outline/60 bg-surface shadow-sm dark:border-dark-outline/60 dark:bg-dark-surface">
            <span className="font-headline text-xl font-semibold tracking-[0.18em] text-on-background dark:text-dark-on-background">SN</span>
          </div>
          <h1 className="font-headline text-3xl font-normal italic tracking-tight text-on-background dark:text-dark-on-background sm:text-4xl">
            StartNest
          </h1>
          <p className="mt-2 font-label text-xs uppercase tracking-[0.18em] text-on-surface-variant dark:text-dark-on-surface-variant">
            私人起始页 · 书签工作台
          </p>
        </div>

        {/* Card */}
        <div className="card-panel rounded-xl p-6 sm:p-8">
          <div className="mb-6 border-b border-outline pb-4 dark:border-dark-outline">
            <h2 className="font-headline text-xl font-medium tracking-tight text-on-background dark:text-dark-on-background">
              登录
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant dark:text-dark-on-surface-variant">
              输入管理员账户信息以继续。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="block text-sm font-medium text-on-surface dark:text-dark-on-surface">
                用户名
              </label>
              <Input
                id="login-username"
                type="text"
                autoComplete="username"
                placeholder="输入管理员用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-on-surface dark:text-dark-on-surface">
                密码
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-11"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 transition-colors hover:text-on-surface-variant dark:text-dark-on-surface-variant/60 dark:hover:text-dark-on-surface-variant"
                >
                  <AppIcon name={showPassword ? 'aperture' : 'password'} className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>

            {/* Error */}
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            ) : null}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '正在登录...' : '登录'}
            </Button>
          </form>
        </div>

        {/* Footer whisper */}
        <p className="mt-8 text-center font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40 dark:text-dark-on-surface-variant/40">
          StartNest · Private Startpage
        </p>
      </div>
    </div>
  )
}
