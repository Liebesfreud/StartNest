import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

export function PageShell({
  title,
  actions,
  children,
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
}) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-on-background dark:bg-dark-background dark:text-dark-on-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-outline/70 bg-background/90 px-4 py-3 backdrop-blur dark:border-dark-outline/80 dark:bg-dark-background/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <div className="font-headline text-xl italic tracking-tight text-on-background dark:text-dark-on-background">StartNest</div>
              <h1 className="mt-0.5 font-headline text-[1.125rem] font-medium tracking-tight text-on-surface-variant dark:text-dark-on-surface-variant">{title}</h1>
            </div>
            <nav className="flex items-center gap-2">
              <Link
                to="/"
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${location.pathname === '/' ? 'bg-on-background text-white dark:bg-dark-on-background dark:text-dark-background' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container dark:hover:text-dark-on-background'}`}
              >
                首页
              </Link>
              <Link
                to="/settings"
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${location.pathname === '/settings' ? 'bg-on-background text-white dark:bg-dark-on-background dark:text-dark-background' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container dark:hover:text-dark-on-background'}`}
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
