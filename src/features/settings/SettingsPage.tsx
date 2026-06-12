import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import { exportPayloadSchema } from '../../lib/api.schemas'
import { AppIcon } from '../../components/AppIcon'
import { PageContainer } from '../../components/layout/PageContainer'
import { applyTheme } from '../../lib/theme'
import { useBootstrapCache } from '../../hooks/useBootstrap'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AppOutletContext } from '../../app/App'
import { SettingsAdminTab } from './SettingsAdminTab'
import { SettingsAppearanceTab } from './SettingsAppearanceTab'
import { SettingsDataTab } from './SettingsDataTab'
import { SettingsGeneralTab } from './SettingsGeneralTab'
import { SettingsPanelsTab } from './SettingsPanelsTab'
import { SettingsSearchEnginesTab } from './SettingsSearchEnginesTab'

const settingsSections = [
  { value: 'general', label: '常规', icon: 'sliders' },
  { value: 'appearance', label: '外观', icon: 'palette' },
  { value: 'search', label: '搜索', icon: 'search' },
  { value: 'panels', label: '面板', icon: 'layout-dashboard' },
  { value: 'account', label: '账户', icon: 'user-circle' },
] as const

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
}

function normalizeWallpaperUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return { value: null, error: null }
  }

  if (trimmed.length > 2048) {
    return { value: null, error: '壁纸地址不能超过 2048 个字符。' }
  }

  try {
    const url = new URL(trimmed)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { value: null, error: '仅支持 http 或 https 图片地址。' }
    }

    return { value: url.toString(), error: null }
  } catch {
    return { value: null, error: '请输入有效的图片 URL。' }
  }
}

export function SettingsPage() {
  const [nameDraft, setNameDraft] = useState('')
  const [wallpaperDraft, setWallpaperDraft] = useState('')
  const [settingsDraft, setSettingsDraft] = useState<
    Partial<Omit<NonNullable<AppOutletContext['bootstrapData']>['settings'], 'updatedAt'>>
  >({})
  const [wallpaperError, setWallpaperError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const { update } = useBootstrapCache()
  const { bootstrapData: data, bootstrapError: isError } = useOutletContext<AppOutletContext>()

  const updateSettings = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: ({ settings }) => {
      update({ settings })
      applyTheme(settings.themeMode)
      setSettingsDraft({})
    },
  })

  const importMutation = useMutation({
    mutationFn: api.importAll,
    onSuccess: (next) => {
      update(next)
      applyTheme(next.settings.themeMode)
      setImportError(null)
    },
    onError: (error) => {
      setImportError(error instanceof Error ? error.message : '导入失败，请稍后重试。')
    },
  })

  const updateUser = useMutation({
    mutationFn: api.updateUser,
    onSuccess: ({ user }) => {
      update((current) => ({ ...current, user }))
    },
  })

  useEffect(() => {
    if (!data) return
    setWallpaperDraft(data.settings.wallpaperUrl ?? '')
    setNameDraft(data.user.displayName ?? '')
  }, [data])

  const previewSettings = useMemo(() => (data ? { ...data.settings, ...settingsDraft } : null), [data, settingsDraft])
  const hasSettingsDraft = Object.keys(settingsDraft).length > 0

  const handleChangeSetting = (
    payload: Partial<Omit<NonNullable<AppOutletContext['bootstrapData']>['settings'], 'updatedAt'>>,
  ) => {
    setSettingsDraft((current) => ({ ...current, ...payload }))
  }

  const handleSaveSettings = () => {
    if (!hasSettingsDraft || updateSettings.isPending) return
    updateSettings.mutate(settingsDraft)
  }

  const handleResetSettings = () => {
    if (!data) return
    setSettingsDraft({})
    setWallpaperDraft(data.settings.wallpaperUrl ?? '')
    setWallpaperError(null)
    applyTheme(data.settings.themeMode)
  }

  const handleSaveWallpaper = () => {
    const parsed = normalizeWallpaperUrl(wallpaperDraft)

    if (parsed.error) {
      setWallpaperError(parsed.error)
      return
    }

    setWallpaperError(null)
    handleChangeSetting({ wallpaperUrl: parsed.value })
  }

  const handleClearWallpaper = () => {
    setWallpaperError(null)
    setWallpaperDraft('')
    handleChangeSetting({ wallpaperUrl: null })
  }

  const handleWallpaperChange = (value: string) => {
    setWallpaperDraft(value)
    if (wallpaperError) {
      setWallpaperError(null)
    }
  }

  const handleSaveName = () => {
    updateUser.mutate({ displayName: nameDraft.trim() })
  }

  const handleExport = async () => {
    const payload = await api.exportAll()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `startnest-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(href)
  }

  const handleImportFile = async (file: File | null) => {
    if (!file) return

    setImportError(null)

    let parsed: unknown

    try {
      const text = await file.text()
      parsed = JSON.parse(text)
    } catch {
      setImportError('导入文件不是有效的 JSON。')
      return
    }

    const validated = exportPayloadSchema.safeParse(parsed)
    if (!validated.success) {
      setImportError('导入文件格式不正确，请选择系统导出的 JSON 文件。')
      return
    }

    importMutation.mutate(validated.data)
  }

  if (isError || !data) {
    return <div className="flex items-center justify-center px-4 py-24 text-sm text-destructive">加载配置失败。</div>
  }

  const updateUserError = updateUser.error instanceof ApiError ? updateUser.error.message : null
  const settingsMutationError = updateSettings.error instanceof ApiError ? updateSettings.error.message : null
  const settings = previewSettings ?? data.settings
  const { user } = data
  const displayName = user.displayName || user.name || user.subject || '当前用户'
  const canSaveName = nameDraft.trim() !== (user.displayName ?? '').trim()

  return (
    <PageContainer className="max-w-6xl py-6 lg:py-8">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">设置</h1>
        </header>

        <Tabs defaultValue="general" orientation="vertical" className="grid gap-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/70 p-1 lg:sticky lg:top-6 lg:flex-col lg:self-start lg:overflow-visible">
            {settingsSections.map((section) => (
              <TabsTrigger
                key={section.value}
                value={section.value}
                className="h-10 flex-none justify-start gap-2.5 px-3 data-[state=active]:shadow-sm lg:w-full"
              >
                <AppIcon name={section.icon} className="h-4 w-4" />
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-w-0 max-w-3xl">
            <TabsContent value="general" className="mt-0 space-y-3">
              <SectionHeading title="常规" />
              <SettingsGeneralTab settings={settings} onSaveSetting={handleChangeSetting} />
            </TabsContent>

            <TabsContent value="appearance" className="mt-0 space-y-3">
              <SectionHeading title="外观" />
              <SettingsAppearanceTab
                settings={settings}
                pending={updateSettings.isPending}
                wallpaperDraft={wallpaperDraft}
                wallpaperError={wallpaperError}
                onWallpaperChange={handleWallpaperChange}
                onSaveWallpaper={handleSaveWallpaper}
                onClearWallpaper={handleClearWallpaper}
                onSaveSetting={handleChangeSetting}
              />
            </TabsContent>

            <TabsContent value="search" className="mt-0 space-y-3">
              <SectionHeading title="搜索" />
              <SettingsSearchEnginesTab
                settings={settings}
                searchEngines={data.searchEngines}
                onSaveSetting={handleChangeSetting}
              />
            </TabsContent>

            <TabsContent value="panels" className="mt-0 space-y-3">
              <SectionHeading title="面板" />
              <SettingsPanelsTab panels={data.panels} />
            </TabsContent>

            <TabsContent value="account" className="mt-0 space-y-6">
              <section className="space-y-3">
                <SectionHeading title="账户" />
                <SettingsAdminTab
                  user={user}
                  displayName={displayName}
                  nameDraft={nameDraft}
                  canSaveName={canSaveName}
                  updatePending={updateUser.isPending}
                  updateError={updateUserError}
                  onNameDraftChange={setNameDraft}
                  onSaveName={handleSaveName}
                />
              </section>

              <section className="space-y-3 border-t pt-6">
                <SectionHeading title="备份" />
                <SettingsDataTab
                  importPending={importMutation.isPending}
                  importError={importError}
                  onExport={handleExport}
                  onImportFile={handleImportFile}
                />
              </section>
            </TabsContent>

            {hasSettingsDraft ? (
              <div className="sticky bottom-4 mt-5 flex items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
                <p className="hidden text-sm text-muted-foreground sm:block">设置尚未保存</p>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" onClick={handleResetSettings} disabled={updateSettings.isPending}>
                    撤销
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? '保存中' : '保存'}
                  </Button>
                </div>
              </div>
            ) : null}

            {settingsMutationError ? <p className="mt-3 text-sm text-destructive">{settingsMutationError}</p> : null}
          </div>
        </Tabs>
      </div>
    </PageContainer>
  )
}
