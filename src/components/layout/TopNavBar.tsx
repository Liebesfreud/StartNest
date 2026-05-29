import { ReactNode } from 'react'
import { AppIcon } from '../AppIcon'

interface TopNavBarProps {
  searchNode?: ReactNode
}

export function TopNavBar({ searchNode }: TopNavBarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 h-18 border-b border-outline/50 bg-surface/72 backdrop-blur-xl dark:border-dark-outline/60 dark:bg-dark-surface-elevated/72 md:h-20 md:pl-20">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 lg:gap-10">
          <span className="shrink-0 font-headline text-lg font-semibold uppercase tracking-[0.18em] text-on-background dark:text-dark-on-background sm:text-xl">StartNest</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden min-w-0 md:block">{searchNode}</div>
          <button
            aria-label="打开账户"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container dark:hover:text-accent dark:focus-visible:ring-accent/20"
          >
            <AppIcon name="user-circle" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
