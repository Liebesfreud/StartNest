import { CSSProperties, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AppIcon } from '../AppIcon'
import { SideNavBar } from './SideNavBar'

interface LayoutProps {
  children: ReactNode
  activeOverlay?: ReactNode
  activeOverlayVisible?: boolean
  themeMode?: 'light' | 'dark'
  wallpaperUrl?: string | null
  wallpaperOverlayOpacity?: number
  wallpaperBlur?: number
  onToggleTheme: () => void
  editMode: boolean
  onToggleEditMode: () => void
  sidebarVisible: boolean
  onToggleSidebar: () => void
  bootstrapLoading?: boolean
  bootstrapRefreshing?: boolean
  bootstrapError?: boolean
}

export function Layout({
  children,
  activeOverlay,
  activeOverlayVisible = false,
  themeMode,
  wallpaperUrl,
  wallpaperOverlayOpacity = 78,
  wallpaperBlur = 0,
  onToggleTheme,
  editMode,
  onToggleEditMode,
  sidebarVisible,
  onToggleSidebar,
  bootstrapLoading = false,
  bootstrapRefreshing = false,
  bootstrapError = false,
}: LayoutProps) {
  const wallpaperStyle = wallpaperUrl
    ? ({
        backgroundImage: `url("${encodeURI(wallpaperUrl)}")`,
        ['--wallpaper-blur' as string]: `${wallpaperBlur}px`,
      } satisfies CSSProperties)
    : undefined

  const wallpaperOverlayStyle = wallpaperUrl
    ? ({
        ['--wallpaper-overlay-opacity' as string]: `${Math.max(0, Math.min(100, wallpaperOverlayOpacity)) / 100}`,
      } satisfies CSSProperties)
    : undefined

  return (
    <div className="relative min-h-screen bg-background text-foreground ">
      {wallpaperUrl ? <div className="app-wallpaper" style={wallpaperStyle} aria-hidden="true" /> : null}
      {wallpaperUrl ? <div className="app-wallpaper-overlay" style={wallpaperOverlayStyle} aria-hidden="true" /> : null}
      <div className="relative z-10 min-h-screen">
        {!sidebarVisible ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="显示侧边栏"
            aria-pressed={false}
            onClick={onToggleSidebar}
            className="fixed left-6 top-6 z-40 hidden h-11 w-11 rounded-xl border border-border/70 bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-all duration-200 hover:bg-secondary hover:text-foreground focus-visible:ring-ring/20 md:flex"
          >
            <AppIcon name="menu-2" className="h-5 w-5" />
          </Button>
        ) : null}
        <SideNavBar
          themeMode={themeMode}
          onToggleTheme={onToggleTheme}
          editMode={editMode}
          onToggleEditMode={onToggleEditMode}
          visible={sidebarVisible}
          onToggleVisible={onToggleSidebar}
        />
        {bootstrapRefreshing ? (
          <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-primary/70" aria-hidden="true" />
        ) : null}
        <main
          className={`min-h-screen w-full transition-[padding,opacity] duration-200 ${sidebarVisible ? 'md:pl-20' : 'md:pl-0'} ${bootstrapLoading ? 'opacity-80' : 'opacity-100'}`}
        >
          {bootstrapError ? (
            <div className="mx-auto flex min-h-screen w-full max-w-[32rem] items-center justify-center px-6 py-16 text-center">
              <div className="space-y-3 rounded-xl border border-border bg-card px-6 py-8 shadow-sm ">
                <p className="text-xl font-semibold text-foreground ">StartNest 加载失败</p>
                <p className="text-sm text-muted-foreground ">启动数据暂时不可用，请稍后刷新重试。</p>
              </div>
            </div>
          ) : (
            <>
              <div className={activeOverlayVisible ? 'hidden' : 'min-h-screen'}>{children}</div>
              {activeOverlay}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
