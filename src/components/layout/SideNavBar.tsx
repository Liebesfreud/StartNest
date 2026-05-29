import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppIcon } from '../AppIcon'
import { useAuth } from '../../lib/auth'
import { useBootstrapQuery } from '../../hooks/useBootstrap'
import type { ThemeMode } from '../../lib/theme'
import { navigationItems } from './navigationItems'

interface SideNavBarProps {
  themeMode?: ThemeMode
  onToggleTheme: () => void
  editMode: boolean
  onToggleEditMode: () => void
  visible: boolean
  onToggleVisible: () => void
}

export function SideNavBar({ themeMode = 'system', onToggleTheme, editMode, onToggleEditMode, visible, onToggleVisible }: SideNavBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data } = useBootstrapQuery()
  const panels = (data?.panels ?? []).filter((panel) => panel.enabled)
  const itemClassName = (active: boolean) =>
    `flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#99462a]/20 [&_svg]:!text-current [&_span]:!text-current ${active ? 'bg-on-background text-white dark:bg-dark-on-background dark:text-dark-background' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-background dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container/75 dark:hover:text-dark-on-background'}`

  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-screen w-24 border-r border-outline/80 bg-surface-container transition-transform duration-200 md:block dark:border-dark-outline/80 dark:bg-dark-surface-container ${visible ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-full flex-col items-center gap-5 px-4 py-6">
        <button
          type="button"
          aria-label="隐藏侧边栏"
          aria-pressed={visible}
          onClick={onToggleVisible}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant transition-all duration-200 hover:bg-surface-container-low hover:text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#99462a]/20 dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container/75 dark:hover:text-dark-on-background"
        >
          <AppIcon name="layout-sidebar-left-collapse" className="h-5 w-5" />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low text-sm font-semibold tracking-[0.18em] text-on-background dark:bg-dark-surface-container/70 dark:text-dark-on-background">
          SN
        </div>
        <div className="flex flex-1 flex-col items-center gap-3">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
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
          {panels.length ? <div className="my-1 h-px w-8 bg-outline/70 dark:bg-dark-outline/70" /> : null}
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
          <button
            type="button"
            aria-label="退出登录"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant transition-all duration-200 hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/20 dark:text-dark-on-surface-variant dark:hover:bg-red-950/30 dark:hover:text-red-400 [&_svg]:!text-current [&_span]:!text-current"
          >
            <AppIcon name="logout" className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={themeMode === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
            onClick={onToggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant transition-all duration-200 hover:bg-surface-container-low hover:text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#99462a]/20 dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container/75 dark:hover:text-dark-on-background [&_svg]:!text-current [&_span]:!text-current"
          >
            <AppIcon name={themeMode === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="切换编辑模式"
            aria-pressed={editMode}
            onClick={onToggleEditMode}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#99462a]/20 [&_svg]:!text-current [&_span]:!text-current ${editMode ? 'bg-surface-container-low text-primary dark:bg-dark-surface-container dark:text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-background dark:text-dark-on-surface-variant dark:hover:bg-dark-surface-container/75 dark:hover:text-dark-on-background'}`}
          >
            <AppIcon name="pencil-cog" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
