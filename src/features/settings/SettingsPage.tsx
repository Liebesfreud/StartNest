import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError, exportPayloadSchema } from '../../lib/api'
import { AppIcon } from '../../components/AppIcon'
import { PageContainer } from '../../components/layout/PageContainer'
import { applyTheme } from '../../lib/theme'
import { useBootstrapCache } from '../../hooks/useBootstrap'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AppOutletContext } from '../../app/App'
import { SettingsAdminTab } from './SettingsAdminTab'
import { SettingsAppearanceTab } from './SettingsAppearanceTab'
import { SettingsDataTab } from './SettingsDataTab'
import { SettingsGeneralTab } from './SettingsGeneralTab'
import { SettingsPanelsTab } from './SettingsPanelsTab'
import { SettingsSearchEnginesTab } from './SettingsSearchEnginesTab'

type SettingsTab = 'general' | 'search' | 'appearance' | 'data' | 'panels' | 'admin'

const settingTabs: Array<{ value: SettingsTab; label: string; icon: string }> = [
  { value: 'general', label: '常规', icon: 'sliders' },
  { value: 'search', label: '搜索', icon: 'search' },
  { value: 'appearance', label: '外观', icon: 'palette' },
  { value: 'panels', label: '面板', icon: 'layout-dashboard' },
  { value: 'data', label: '数据', icon: 'database' },
  { value: 'admin', label: '管理', icon: 'user-circle' },
]

function SettingSection({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AppIcon name={icon} className="h-[18px] w-[18px] text-primary" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
          </div>
        </div>
        <Separator />
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
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
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
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

  useEffect(() => {
    if (!data || Object.keys(settingsDraft).length === 0) return

    const timer = window.setTimeout(() => {
      updateSettings.mutate(settingsDraft)
      setSettingsDraft({})
    }, 400)

    return () => window.clearTimeout(timer)
  }, [data, settingsDraft, updateSettings])

  const previewSettings = useMemo(() => (data ? { ...data.settings, ...settingsDraft } : null), [data, settingsDraft])

  const handleSaveSetting = (
    payload: Partial<Omit<NonNullable<AppOutletContext['bootstrapData']>['settings'], 'updatedAt'>>,
  ) => {
    update((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...payload,
      },
    }))

    if (payload.themeMode) {
      applyTheme(payload.themeMode)
    }

    setSettingsDraft((current) => ({ ...current, ...payload }))
  }

  const handleSaveWallpaper = () => {
    const parsed = normalizeWallpaperUrl(wallpaperDraft)

    if (parsed.error) {
      setWallpaperError(parsed.error)
      return
    }

    setWallpaperError(null)
    handleSaveSetting({ wallpaperUrl: parsed.value })
  }

  const handleClearWallpaper = () => {
    setWallpaperError(null)
    setWallpaperDraft('')
    handleSaveSetting({ wallpaperUrl: null })
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
  const currentTab = settingTabs.find((tab) => tab.value === activeTab) ?? settingTabs[0]

  return (
    <PageContainer className="py-6 lg:py-8">
      <div className="space-y-6 lg:space-y-7">
        <header className="border-b pb-5">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[13px] font-medium text-muted-foreground">StartNest Settings</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem]">个性化设置</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              在更克制的界面里统一管理主题、导航行为、天气信息与数据备份。
            </p>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)}>
          <TabsList className="h-auto max-w-full justify-start overflow-x-auto bg-transparent p-0 scrollbar-hide">
            {settingTabs.map((tab) => {
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="min-w-fit gap-2">
                  <AppIcon name={tab.icon} className="h-[18px] w-[18px]" />
                  {tab.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        <div className="space-y-5">
          <SettingSection icon={currentTab.icon} title={currentTab.label}>
            {activeTab === 'general' ? (
              <SettingsGeneralTab settings={settings} onSaveSetting={handleSaveSetting} />
            ) : null}
            {activeTab === 'search' ? (
              <SettingsSearchEnginesTab
                settings={settings}
                searchEngines={data.searchEngines}
                onSaveSetting={handleSaveSetting}
              />
            ) : null}
            {activeTab === 'appearance' ? (
              <SettingsAppearanceTab
                settings={settings}
                pending={updateSettings.isPending}
                wallpaperDraft={wallpaperDraft}
                wallpaperError={wallpaperError}
                onWallpaperChange={handleWallpaperChange}
                onSaveWallpaper={handleSaveWallpaper}
                onClearWallpaper={handleClearWallpaper}
                onSaveSetting={handleSaveSetting}
              />
            ) : null}
            {activeTab === 'panels' ? <SettingsPanelsTab panels={data.panels} /> : null}
            {activeTab === 'data' ? (
              <SettingsDataTab
                importPending={importMutation.isPending}
                importError={importError}
                onExport={handleExport}
                onImportFile={handleImportFile}
              />
            ) : null}
            {activeTab === 'admin' ? (
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
            ) : null}
          </SettingSection>

          {settingsMutationError ? <p className="text-sm text-destructive">{settingsMutationError}</p> : null}
        </div>
      </div>
    </PageContainer>
  )
}
