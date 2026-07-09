import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError, type WebPanel, type WebPanelCreatePayload, type WebPanelUpdatePayload } from '../../lib/api'
import { useBootstrapCache } from '../../hooks/useBootstrap'
import { AppIcon } from '../../components/AppIcon'
import { SettingsItemActions } from './settingsControls'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type SettingsPanelsTabProps = {
  panels: WebPanel[]
}

type PanelFormData = {
  title: string
  url: string
  icon: string
  description: string
  openMode: 'iframe' | 'external'
  enabled: boolean
}

const emptyForm: PanelFormData = {
  title: '',
  url: '',
  icon: '',
  description: '',
  openMode: 'iframe',
  enabled: true,
}

function validateUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'URL 不能为空。'
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '仅支持 http 或 https 地址。'
    }
    return null
  } catch {
    return '请输入有效的 URL。'
  }
}

export function SettingsPanelsTab({ panels }: SettingsPanelsTabProps) {
  const { update } = useBootstrapCache()

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingPanel, setEditingPanel] = useState<WebPanel | null>(null)
  const [form, setForm] = useState<PanelFormData>(emptyForm)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<WebPanel | null>(null)

  const resetForm = useCallback(() => {
    setForm(emptyForm)
    setEditingPanel(null)
    setUrlError(null)
    setTitleError(null)
    setMutationError(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setDrawerOpen(true)
  }, [resetForm])

  const openEdit = useCallback((panel: WebPanel) => {
    setEditingPanel(panel)
    setForm({
      title: panel.title,
      url: panel.url,
      icon: panel.icon ?? '',
      description: panel.description ?? '',
      openMode: panel.openMode,
      enabled: panel.enabled,
    })
    setUrlError(null)
    setTitleError(null)
    setMutationError(null)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    resetForm()
  }, [resetForm])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: WebPanelCreatePayload) => api.createPanel(payload),
    onSuccess: ({ panels }) => {
      update({ panels })
      closeDrawer()
    },
    onError: (error) => {
      setMutationError(error instanceof ApiError ? error.message : '创建失败，请稍后重试。')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebPanelUpdatePayload }) => api.updatePanel(id, payload),
    onSuccess: ({ panels }) => {
      update({ panels })
      closeDrawer()
    },
    onError: (error) => {
      setMutationError(error instanceof ApiError ? error.message : '更新失败，请稍后重试。')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePanel(id),
    onSuccess: ({ panels }) => {
      update({ panels })
      setDeleteTarget(null)
    },
    onError: (error) => {
      setDeleteTarget(null)
      // eslint-disable-next-line no-console
      console.error('Delete panel failed:', error)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (next: WebPanel[]) => api.reorderPanels({ panels: next.map((p, i) => ({ id: p.id, sortOrder: i })) }),
    onSuccess: ({ panels }) => {
      update({ panels })
    },
  })

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.updatePanel(id, { enabled }),
    onSuccess: ({ panels }) => {
      update({ panels })
    },
  })

  // Handlers
  const handleSubmit = () => {
    setMutationError(null)

    const trimmedTitle = form.title.trim()
    if (!trimmedTitle) {
      setTitleError('标题不能为空。')
      return
    }
    setTitleError(null)

    const urlErr = validateUrl(form.url)
    if (urlErr) {
      setUrlError(urlErr)
      return
    }
    setUrlError(null)

    const payload = {
      title: trimmedTitle,
      url: form.url.trim(),
      icon: form.icon.trim() || null,
      description: form.description.trim() || null,
      openMode: form.openMode,
      enabled: form.enabled,
    }

    if (editingPanel) {
      updateMutation.mutate({ id: editingPanel.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    const next = [...panels]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    reorderMutation.mutate(next)
  }

  const handleMoveDown = (index: number) => {
    if (index >= panels.length - 1) return
    const next = [...panels]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    reorderMutation.mutate(next)
  }

  const pending = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Card className="px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
              <AppIcon name="layout-dashboard" className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Web 面板</p>
              <p className="mt-0.5 text-xs text-muted-foreground">管理导航栏中嵌入的网页面板。</p>
            </div>
          </div>
          <Button onClick={openAdd}>添加面板</Button>
        </div>
      </Card>

      {panels.length === 0 ? (
        <Card className="border-dashed px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">暂无面板，点击上方按钮添加。</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {panels.map((panel, index) => (
            <Card key={panel.id} className={`px-4 py-3 ${panel.enabled ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
                  {panel.icon ? (
                    <AppIcon name={panel.icon} className="h-[18px] w-[18px]" />
                  ) : (
                    <AppIcon name="panel-left" className="h-[18px] w-[18px]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{panel.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{panel.url}</p>
                </div>
                <SettingsItemActions
                  canMoveUp={index > 0}
                  canMoveDown={index < panels.length - 1}
                  moving={reorderMutation.isPending}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onEdit={() => openEdit(panel)}
                  onDelete={() => setDeleteTarget(panel)}
                >
                  <Switch
                    checked={panel.enabled}
                    aria-label={panel.enabled ? '已启用' : '已禁用'}
                    onCheckedChange={(enabled) => toggleEnabledMutation.mutate({ id: panel.id, enabled })}
                    disabled={toggleEnabledMutation.isPending}
                  />
                </SettingsItemActions>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={drawerOpen}
        onOpenChange={(open) => {
          if (open) setDrawerOpen(true)
          else closeDrawer()
        }}
      >
        <SheetContent className="w-[min(100vw,34rem)] overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingPanel ? '编辑面板' : '添加面板'}</SheetTitle>
            <SheetDescription className="sr-only">配置面板标题、地址和打开方式。</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="panel-title">标题</Label>
              <Input
                id="panel-title"
                value={form.title}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }))
                  if (titleError) setTitleError(null)
                }}
                placeholder="面板标题"
              />
              {titleError ? <p className="text-xs text-destructive">{titleError}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="panel-url">URL</Label>
              <Input
                id="panel-url"
                type="url"
                inputMode="url"
                value={form.url}
                onChange={(e) => {
                  setForm((f) => ({ ...f, url: e.target.value }))
                  if (urlError) setUrlError(null)
                }}
                placeholder="https://example.com"
              />
              {urlError ? <p className="text-xs text-destructive">{urlError}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="panel-icon">
                图标 <span className="font-normal text-muted-foreground">(可选)</span>
              </Label>
              <Input
                id="panel-icon"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="图标名称，如 globe"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="panel-description">
                描述 <span className="font-normal text-muted-foreground">(可选)</span>
              </Label>
              <Input
                id="panel-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="面板描述"
              />
            </div>

            <div className="space-y-1.5">
              <Label>打开方式</Label>
              <ToggleGroup
                type="single"
                value={form.openMode}
                onValueChange={(value) => {
                  if (value === 'iframe' || value === 'external') {
                    setForm((f) => ({ ...f, openMode: value }))
                  }
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="iframe" variant="outline">
                  内嵌
                </ToggleGroupItem>
                <ToggleGroupItem value="external" variant="outline">
                  新标签页
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">启用</p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
                aria-label="启用面板"
              />
            </div>

            {mutationError ? <p className="text-sm text-destructive">{mutationError}</p> : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeDrawer} disabled={pending}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={pending}>
                {pending ? '保存中' : editingPanel ? '保存' : '创建'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除面板</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除面板「{deleteTarget?.title ?? ''}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>取消</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '删除中' : '删除'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
