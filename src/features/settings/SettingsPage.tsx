import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import { exportPayloadSchema } from '../../lib/api.schemas'
import { AppIcon } from '../../components/AppIcon'
import { PageContainer } from '../../components/layout/PageContainer'
import { applyTheme } from '../../lib/theme'
import { useBootstrapCache } from '../../hooks/useBootstrap'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AppOutletContext } from '../../app/App'
import { SettingsAdminTab } from './SettingsAdminTab'
import { SettingsAppearanceTab } from './SettingsAppearanceTab'
import { SettingsDataTab } from './SettingsDataTab'
import { SettingsGeneralTab } from './SettingsGeneralTab'
import { SettingsPanelsTab } from './SettingsPanelsTab'
import { SettingsSearchEnginesTab } from './SettingsSearchEnginesTab'

function SettingSection({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 shadow-sm">
      <section className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <AppIcon name={icon} className="h-[18px] w-[18px]" />
          </div>
          <h2 className="min-w-0 text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        <div className="space-y-3">{children}</div>
      </section>
    </Card>
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

        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start xl:gap-5">
            <SettingSection icon="sliders" title="常规">
              <SettingsGeneralTab settings={settings} onSaveSetting={handleChangeSetting} />
            </SettingSection>

            <SettingSection icon="search" title="搜索">
              <SettingsSearchEnginesTab
                settings={settings}
                searchEngines={data.searchEngines}
                onSaveSetting={handleChangeSetting}
              />
            </SettingSection>

            <SettingSection icon="palette" title="外观">
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
            </SettingSection>

            <SettingSection icon="layout-dashboard" title="面板">
              <SettingsPanelsTab panels={data.panels} />
            </SettingSection>

            <SettingSection icon="database" title="数据">
              <SettingsDataTab
                importPending={importMutation.isPending}
                importError={importError}
                onExport={handleExport}
                onImportFile={handleImportFile}
              />
            </SettingSection>

            <SettingSection icon="user-circle" title="管理">
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
            </SettingSection>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {hasSettingsDraft ? '有未保存的设置更改，确认后才会写入。' : '修改设置后，请点击保存才会生效。'}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleResetSettings} disabled={!hasSettingsDraft || updateSettings.isPending}>
                撤销更改
              </Button>
              <Button onClick={handleSaveSettings} disabled={!hasSettingsDraft || updateSettings.isPending}>
                {updateSettings.isPending ? '保存中' : '保存设置'}
              </Button>
            </div>
          </div>

          {settingsMutationError ? <p className="text-sm text-destructive">{settingsMutationError}</p> : null}
        </div>
      </div>
    </PageContainer>
  )
}
