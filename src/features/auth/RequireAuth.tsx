import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { AppIcon } from '../../components/AppIcon'

/**
 * Wrap protected routes with this guard.
 * Unauthenticated users are redirected to /login with a ?redirect= parameter
 * so they return to their original destination after login.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background ">
        <div className="flex items-center gap-2 text-sm text-muted-foreground ">
          <AppIcon name="aperture" className="h-4 w-4 animate-spin" />
          正在验证...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirectPath = location.pathname === '/login' ? '/' : `${location.pathname}${location.search}`
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectPath)}`} replace />
  }

  return <>{children}</>
}
