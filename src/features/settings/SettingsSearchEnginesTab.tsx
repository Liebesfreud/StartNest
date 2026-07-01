import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  api,
  ApiError,
  type SearchEngine,
  type SearchEngineCreatePayload,
  type SearchEngineUpdatePayload,
  type Settings,
} from '../../lib/api'
import { getCustomSearchEngineValue, getSearchEngineOptions, validateSearchUrlTemplate } from '../../lib/searchEngines'
import { useBootstrapCache } from '../../hooks/useBootstrap'
import { AppIcon } from '../../components/AppIcon'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type SettingsSearchEnginesTabProps = {
  settings: Settings
  searchEngines: SearchEngine[]
  onSaveSetting: (payload: Partial<Omit<Settings, 'updatedAt'>>) => void
}

type SearchEngineForm = {
  name: string
  urlTemplate: string
  icon: string
}

const emptyForm: SearchEngineForm = {
  name: '',
  urlTemplate: '',
  icon: '',
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  return error instanceof Error ? error.message : fallback
}

export function SettingsSearchEnginesTab({
  settings,
  searchEngines,
  onSaveSetting,
}: SettingsSearchEnginesTabProps) {
  const { update } = useBootstrapCache()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SearchEngine | null>(null)
  const [form, setForm] = useState<SearchEngineForm>(emptyForm)
  const [nameError, setNameError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const options = getSearchEngineOptions(searchEngines)

  const resetForm = useCallback(() => {
    setEditingEngine(null)
    setForm(emptyForm)
    setNameError(null)
    setUrlError(null)
    setMutationError(null)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    resetForm()
  }, [resetForm])

  const openCreate = useCallback(() => {
    resetForm()
    setForm({ ...emptyForm, urlTemplate: 'https://duckduckgo.com/?q={query}' })
    setDrawerOpen(true)
  }, [resetForm])

  const openEdit = useCallback((engine: SearchEngine) => {
    setEditingEngine(engine)
    setForm({
      name: engine.name,
      urlTemplate: engine.urlTemplate,
      icon: engine.icon ?? '',
    })
    setNameError(null)
    setUrlError(null)
    setMutationError(null)
    setDrawerOpen(true)
  }, [])

  const createMutation = useMutation({
    mutationFn: (payload: SearchEngineCreatePayload) => api.createSearchEngine(payload),
    onSuccess: ({ searchEngine, searchEngines }) => {
      update({ searchEngines })
      onSaveSetting({ searchEngine: getCustomSearchEngineValue(searchEngine.id) })
      closeDrawer()
    },
    onError: (error) => setMutationError(getErrorMessage(error, '创建搜索引擎失败。')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SearchEngineUpdatePayload }) =>
      api.updateSearchEngine(id, payload),
    onSuccess: ({ searchEngines }) => {
      update({ searchEngines })
      closeDrawer()
    },
    onError: (error) => setMutationError(getErrorMessage(error, '保存搜索引擎失败。')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSearchEngine(id),
    onSuccess: (next) => {
      update(next)
      setDeleteTarget(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (next: SearchEngine[]) =>
      api.reorderSearchEngines({ searchEngines: next.map((engine, index) => ({ id: engine.id, sortOrder: index })) }),
    onSuccess: ({ searchEngines }) => {
      update({ searchEngines })
    },
  })

  const handleSubmit = () => {
    setMutationError(null)

    const name = form.name.trim()
    if (!name) {
      setNameError('名称不能为空。')
      return
    }
    if (name.length > 40) {
      setNameError('名称不能超过 40 个字符。')
      return
    }
    setNameError(null)

    const urlTemplate = form.urlTemplate.trim()
    const nextUrlError = validateSearchUrlTemplate(urlTemplate)
    if (nextUrlError) {
      setUrlError(nextUrlError)
      return
    }
    setUrlError(null)

    const payload = {
      name,
      urlTemplate,
      icon: form.icon.trim() || null,
    }

    if (editingEngine) {
      updateMutation.mutate({ id: editingEngine.id, payload })
      return
    }

    createMutation.mutate(payload)
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= searchEngines.length) return
    const next = [...searchEngines]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    reorderMutation.mutate(next)
  }

  const pending = createMutation.isPending || updateMutation.isPending
  const deleteError = deleteMutation.error ? getErrorMessage(deleteMutation.error, '删除搜索引擎失败。') : null

  return (
    <>
      <Card className="px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
              <AppIcon name="search" className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">默认搜索引擎</p>
            </div>
          </div>
          <Select value={settings.searchEngine} onValueChange={(searchEngine) => onSaveSetting({ searchEngine })}>
            <SelectTrigger className="w-full sm:w-56" aria-label="默认搜索引擎">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((engine) => (
                <SelectItem key={engine.value} value={engine.value}>
                  {engine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
              <AppIcon name="settings" className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">自定义搜索引擎</p>
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            添加
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {searchEngines.length === 0 ? (
          <Card className="border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">暂无自定义搜索引擎。</p>
          </Card>
        ) : (
          searchEngines.map((engine, index) => (
            <Card key={engine.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                  <AppIcon name={engine.icon || 'search'} className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{engine.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{engine.urlTemplate}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    title="上移"
                    aria-label="上移"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => handleMove(index, -1)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    title="下移"
                    aria-label="下移"
                    disabled={index === searchEngines.length - 1 || reorderMutation.isPending}
                    onClick={() => handleMove(index, 1)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    title="编辑"
                    aria-label="编辑"
                    onClick={() => openEdit(engine)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    title="删除"
                    aria-label="删除"
                    onClick={() => setDeleteTarget(engine)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Sheet
        open={drawerOpen}
        onOpenChange={(open) => {
          if (open) setDrawerOpen(true)
          else closeDrawer()
        }}
      >
        <SheetContent className="w-[min(100vw,34rem)] overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingEngine ? '编辑搜索引擎' : '添加搜索引擎'}</SheetTitle>
            <SheetDescription className="sr-only">配置搜索引擎名称、查询地址和图标。</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="search-engine-name">名称</Label>
              <Input
                id="search-engine-name"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }))
                  if (nameError) setNameError(null)
                }}
                placeholder="DuckDuckGo"
              />
              {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="search-engine-url">搜索 URL</Label>
              <Input
                id="search-engine-url"
                type="url"
                inputMode="url"
                value={form.urlTemplate}
                onChange={(event) => {
                  setForm((current) => ({ ...current, urlTemplate: event.target.value }))
                  if (urlError) setUrlError(null)
                }}
                placeholder="https://duckduckgo.com/?q={query}"
              />
              {urlError ? <p className="text-xs text-destructive">{urlError}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="search-engine-icon">
                图标 <span className="font-normal text-muted-foreground">(可选)</span>
              </Label>
              <Input
                id="search-engine-icon"
                value={form.icon}
                onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                placeholder="search"
              />
            </div>

            {mutationError ? <p className="text-sm text-destructive">{mutationError}</p> : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeDrawer} disabled={pending}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={pending}>
                {pending ? '保存中' : editingEngine ? '保存' : '创建'}
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
            <AlertDialogTitle>删除搜索引擎</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget?.name ?? ''}」吗？使用中的默认搜索引擎会切回必应。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
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
