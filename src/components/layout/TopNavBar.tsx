import { ReactNode } from 'react'
import { AppIcon } from '../AppIcon'

interface TopNavBarProps {
  searchNode?: ReactNode
}

export function TopNavBar({ searchNode }: TopNavBarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 h-18 border-b border-border/50 bg-card/72 backdrop-blur-xl md:h-20 md:pl-20">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 lg:gap-10">
          <span className="shrink-0 text-lg font-semibold uppercase tracking-[0.18em] text-foreground sm:text-xl">
            StartNest
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden min-w-0 md:block">{searchNode}</div>
          <button
            aria-label="打开账户"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 "
          >
            <AppIcon name="user-circle" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
