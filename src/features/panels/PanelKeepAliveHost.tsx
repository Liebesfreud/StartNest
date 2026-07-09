import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconExternalLink, IconPencil, IconRefresh, IconX } from '@tabler/icons-react'
import { AppIcon } from '../../components/AppIcon'
import type { BootstrapData, WebPanel } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function PanelToolbar({
  panel,
  onReload,
  onEdit,
  onClose,
}: {
  panel: WebPanel
  onReload: () => void
  onEdit: () => void
  onClose: () => void
}) {
  const openExternal = () => {
    window.open(panel.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border/70 bg-card/92 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary ">
          <AppIcon name={panel.icon || 'layout-dashboard'} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-medium tracking-tight text-foreground ">{panel.title}</h1>
          <p className="truncate text-xs text-muted-foreground ">{panel.url}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {panel.openMode === 'iframe' ? (
          <Button variant="secondary" onClick={onReload} className="min-h-9 px-3 py-1.5">
            <IconRefresh className="h-4 w-4" />
            刷新
          </Button>
        ) : null}
        <Button variant="secondary" onClick={openExternal} className="min-h-9 px-3 py-1.5">
          <IconExternalLink className="h-4 w-4" />
          新标签页
        </Button>
        <Button variant="ghost" onClick={onEdit} className="min-h-9 px-3 py-1.5">
          <IconPencil className="h-4 w-4" />
          编辑
        </Button>
        <Button variant="ghost" onClick={onClose} className="min-h-9 px-3 py-1.5">
          <IconX className="h-4 w-4" />
          关闭
        </Button>
      </div>
    </header>
  )
}

function ExternalPanel({ panel }: { panel: WebPanel }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="max-w-md p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary ">
          <AppIcon name={panel.icon || 'external-link'} className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-medium text-foreground ">{panel.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground ">
          这个面板设置为外部打开，不会在 StartNest 内嵌显示。
        </p>
        <Button className="mt-5" onClick={() => window.open(panel.url, '_blank', 'noopener,noreferrer')}>
          在新标签页打开
        </Button>
      </Card>
    </div>
  )
}

// 最多同时保活的 iframe 面板数量；超出后按最近使用顺序淘汰最旧的，
// 避免访问过的 iframe 无限累积占用内存/CPU/网络。
const MAX_CACHED_PANELS = 5

export function PanelKeepAliveHost({
  bootstrapData,
  activePanelId,
}: {
  bootstrapData: BootstrapData | undefined
  activePanelId: string | undefined
}) {
  const navigate = useNavigate()
  const [reloadKeys, setReloadKeys] = useState<Record<string, number>>({})
  const [cachedPanelIds, setCachedPanelIds] = useState<string[]>([])

  const activePanel = useMemo(
    () => bootstrapData?.panels.find((item) => item.id === activePanelId),
    [activePanelId, bootstrapData?.panels],
  )

  useEffect(() => {
    if (!activePanel || activePanel.openMode !== 'iframe') return
    setCachedPanelIds((current) => {
      // 把当前面板移到末尾标记为最近使用，并保留最近 MAX_CACHED_PANELS 个。
      const next = current.filter((id) => id !== activePanel.id)
      next.push(activePanel.id)
      return next.length > MAX_CACHED_PANELS ? next.slice(next.length - MAX_CACHED_PANELS) : next
    })
  }, [activePanel])

  const cachedPanels =
    bootstrapData?.panels.filter((item) => cachedPanelIds.includes(item.id) && item.openMode === 'iframe') ?? []

  if (!activePanelId && cachedPanels.length === 0) return null

  if (activePanelId && !bootstrapData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-muted-foreground ">
        正在加载面板...
      </div>
    )
  }

  if (activePanelId && !activePanel) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="max-w-md p-6 text-center">
          <AppIcon name="layout-dashboard" className="mx-auto h-8 w-8" />
          <h1 className="mt-4 text-xl font-medium text-foreground ">面板不存在</h1>
          <p className="mt-2 text-sm text-muted-foreground ">它可能已经被删除或禁用。</p>
          <Button asChild className="mt-5">
            <Link to="/">返回主页</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className={activePanelId ? 'flex min-h-screen flex-col bg-background/80' : 'hidden'}>
      {activePanel ? (
        <PanelToolbar
          panel={activePanel}
          onReload={() =>
            setReloadKeys((current) => ({ ...current, [activePanel.id]: (current[activePanel.id] ?? 0) + 1 }))
          }
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
            className={`min-h-[calc(100vh-4.25rem)] flex-1 border-0 bg-background ${isActive ? 'block' : 'hidden'}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
            referrerPolicy="no-referrer"
          />
        )
      })}
    </div>
  )
}
