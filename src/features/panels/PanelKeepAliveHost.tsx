import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppIcon } from '../../components/AppIcon'
import { Button } from '../../components/Button'
import type { BootstrapData, WebPanel } from '../../lib/api'

function PanelToolbar({ panel, onReload, onEdit, onClose }: { panel: WebPanel; onReload: () => void; onEdit: () => void; onClose: () => void }) {
  const openExternal = () => {
    window.open(panel.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-outline/70 bg-surface/92 px-4 py-3 backdrop-blur dark:border-dark-outline/70 dark:bg-dark-surface/92 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-low dark:bg-dark-surface-container">
          <AppIcon name={panel.icon || 'layout-dashboard'} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-headline text-lg font-medium tracking-tight text-on-background dark:text-dark-on-background">{panel.title}</h1>
          <p className="truncate text-xs text-on-surface-variant dark:text-dark-on-surface-variant">{panel.url}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {panel.openMode === 'iframe' ? (
          <Button variant="secondary" onClick={onReload} className="min-h-9 px-3 py-1.5">
            <span className="inline-flex items-center gap-1.5"><AppIcon name="routine" className="h-4 w-4" />刷新</span>
          </Button>
        ) : null}
        <Button variant="secondary" onClick={openExternal} className="min-h-9 px-3 py-1.5">
          <span className="inline-flex items-center gap-1.5"><AppIcon name="external-link" className="h-4 w-4" />新标签页</span>
        </Button>
        <Button variant="ghost" onClick={onEdit} className="min-h-9 px-3 py-1.5">
          编辑
        </Button>
        <Button variant="ghost" onClick={onClose} className="min-h-9 px-3 py-1.5">
          关闭
        </Button>
      </div>
    </header>
  )
}

function ExternalPanel({ panel }: { panel: WebPanel }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-xl border border-outline bg-surface p-6 text-center shadow-sm dark:border-dark-outline dark:bg-dark-surface">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low dark:bg-dark-surface-container">
          <AppIcon name={panel.icon || 'external-link'} className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-headline text-xl font-medium text-on-background dark:text-dark-on-background">{panel.title}</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant dark:text-dark-on-surface-variant">
          这个面板设置为外部打开，不会在 StartNest 内嵌显示。
        </p>
        <Button className="mt-5" onClick={() => window.open(panel.url, '_blank', 'noopener,noreferrer')}>
          在新标签页打开
        </Button>
      </div>
    </div>
  )
}

export function PanelKeepAliveHost({ bootstrapData, activePanelId }: { bootstrapData: BootstrapData | undefined; activePanelId: string | undefined }) {
  const navigate = useNavigate()
  const [reloadKeys, setReloadKeys] = useState<Record<string, number>>({})
  const [cachedPanelIds, setCachedPanelIds] = useState<string[]>([])

  const activePanel = useMemo(
    () => bootstrapData?.panels.find((item) => item.id === activePanelId),
    [activePanelId, bootstrapData?.panels],
  )

  useEffect(() => {
    if (!activePanel || activePanel.openMode !== 'iframe') return
    setCachedPanelIds((current) => (current.includes(activePanel.id) ? current : [...current, activePanel.id]))
  }, [activePanel])

  const cachedPanels = bootstrapData?.panels.filter((item) => cachedPanelIds.includes(item.id) && item.openMode === 'iframe') ?? []

  if (!activePanelId && cachedPanels.length === 0) return null

  if (activePanelId && !bootstrapData) {
    return <div className="flex min-h-screen items-center justify-center px-4 text-sm text-on-surface-variant dark:text-dark-on-surface-variant">正在加载面板...</div>
  }

  if (activePanelId && !activePanel) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="max-w-md rounded-xl border border-outline bg-surface p-6 text-center shadow-sm dark:border-dark-outline dark:bg-dark-surface">
          <AppIcon name="layout-dashboard" className="mx-auto h-8 w-8" />
          <h1 className="mt-4 font-headline text-xl font-medium text-on-background dark:text-dark-on-background">面板不存在</h1>
          <p className="mt-2 text-sm text-on-surface-variant dark:text-dark-on-surface-variant">它可能已经被删除或禁用。</p>
          <Link to="/" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-on-background px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f2422] dark:bg-dark-on-background dark:text-dark-background dark:hover:bg-[#dfe5df]">
            返回主页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={activePanelId ? 'flex min-h-screen flex-col bg-background/80 dark:bg-dark-background/80' : 'hidden'}>
      {activePanel ? (
        <PanelToolbar
          panel={activePanel}
          onReload={() => setReloadKeys((current) => ({ ...current, [activePanel.id]: (current[activePanel.id] ?? 0) + 1 }))}
          onEdit={() => navigate('/settings')}
          onClose={() => navigate('/')}
        />
      ) : null}
      {activePanel?.openMode === 'external' ? <ExternalPanel panel={activePanel} /> : null}
      {cachedPanels.map((cachedPanel) => {
        const isActive = cachedPanel.id === activePanel?.id && activePanel.openMode === 'iframe'
        return (
          <iframe
            key={`${cachedPanel.id}:${reloadKeys[cachedPanel.id] ?? 0}`}
            src={cachedPanel.url}
            title={cachedPanel.title}
            className={`min-h-[calc(100vh-4.25rem)] flex-1 border-0 bg-white ${isActive ? 'block' : 'hidden'}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
            referrerPolicy="no-referrer"
          />
        )
      })}
    </div>
  )
}
