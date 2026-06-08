import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AppIcon } from '../AppIcon'
import { useAuth } from '../../lib/auth'
import { useBootstrapQuery } from '../../hooks/useBootstrap'
import { navigationItems } from './navigationItems'

interface SideNavBarProps {
  themeMode?: 'light' | 'dark'
  onToggleTheme: () => void
  editMode: boolean
  onToggleEditMode: () => void
  visible: boolean
  onToggleVisible: () => void
}

export function SideNavBar({
  themeMode = 'light',
  onToggleTheme,
  editMode,
  onToggleEditMode,
  visible,
  onToggleVisible,
}: SideNavBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data } = useBootstrapQuery()
  const panels = (data?.panels ?? []).filter((panel) => panel.enabled)
  const itemClassName = (active: boolean) =>
    `flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 [&_svg]:!text-current [&_span]:!text-current ${active ? 'bg-primary text-primary-foreground ' : 'text-muted-foreground hover:bg-secondary hover:text-foreground '}`

  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-screen w-20 border-r border-border/80 bg-muted transition-transform duration-200 md:block ${visible ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-full flex-col items-center gap-5 px-3 py-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="隐藏侧边栏"
          aria-pressed={visible}
          onClick={onToggleVisible}
          className="h-11 w-11 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus-visible:ring-ring/20"
        >
          <AppIcon name="layout-sidebar-left-collapse" className="h-5 w-5" />
        </Button>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-sm font-semibold tracking-[0.18em] text-foreground ">
          SN
        </div>
        <div className="flex flex-1 flex-col items-center gap-3">
          {navigationItems.map((item) => {
            const isActive =
              location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.icon}
                to={item.path}
                aria-label={item.name}
                title={item.name}
                className={itemClassName(isActive)}
              >
                <AppIcon name={item.icon} className="h-5 w-5" />
              </Link>
            )
          })}
          {panels.length ? <div className="my-1 h-px w-8 bg-border/70" /> : null}
          {panels.map((panel) => {
            const path = `/panels/${panel.id}`
            const isActive = location.pathname === path
            return (
              <Link
                key={panel.id}
                to={path}
                aria-label={panel.title}
                title={panel.title}
                className={itemClassName(isActive)}
              >
                <AppIcon name={panel.icon || 'layout-dashboard'} className="h-5 w-5" />
              </Link>
            )
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-3">
          <Link
            to="/settings"
            aria-label="设置"
            title="设置"
            className={itemClassName(location.pathname.startsWith('/settings'))}
          >
            <AppIcon name="settings" className="h-5 w-5" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="退出登录"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="h-11 w-11 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20 [&_svg]:!text-current [&_span]:!text-current"
          >
            <AppIcon name="logout" className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={themeMode === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
            onClick={onToggleTheme}
            className="h-11 w-11 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus-visible:ring-ring/20 [&_svg]:!text-current [&_span]:!text-current"
          >
            <AppIcon name={themeMode === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="切换编辑模式"
            aria-pressed={editMode}
            onClick={onToggleEditMode}
            className={`h-11 w-11 rounded-xl transition-all duration-200 focus-visible:ring-ring/20 [&_svg]:!text-current [&_span]:!text-current ${editMode ? 'bg-secondary text-primary ' : 'text-muted-foreground hover:bg-secondary hover:text-foreground '}`}
          >
            <AppIcon name="pencil-cog" className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
