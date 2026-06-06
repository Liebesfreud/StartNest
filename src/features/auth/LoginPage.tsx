import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { readPreferredThemeMode, watchThemeMode } from '../../lib/theme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    return watchThemeMode(readPreferredThemeMode())
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="relative z-10 w-full max-w-[26rem]">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border bg-card shadow-sm">
            <span className="font-semibold tracking-[0.18em] text-foreground">SN</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">StartNest</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">私人起始页 · 书签工作台</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>输入管理员账户信息以继续。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="login-username">用户名</Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="login-password">密码</Label>
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
                  <Button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    onClick={() => setShowPassword((v) => !v)}
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? '正在登录...' : '登录'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
          StartNest · Private Startpage
        </p>
      </div>
    </div>
  )
}
