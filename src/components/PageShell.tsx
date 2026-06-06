import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

export function PageShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground ">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <div className="text-xl italic tracking-tight text-foreground ">StartNest</div>
              <h1 className="mt-0.5 text-[1.125rem] font-medium tracking-tight text-muted-foreground ">{title}</h1>
            </div>
            <nav className="flex items-center gap-2">
              <Link
                to="/"
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${location.pathname === '/' ? 'bg-primary text-primary-foreground ' : 'text-muted-foreground hover:bg-muted hover:text-foreground '}`}
              >
                首页
              </Link>
              <Link
                to="/settings"
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${location.pathname === '/settings' ? 'bg-primary text-primary-foreground ' : 'text-muted-foreground hover:bg-muted hover:text-foreground '}`}
              >
                设置
              </Link>
              {actions}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
