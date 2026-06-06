import { useEffect, useState } from 'react'
import { Outlet, useMatch } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Layout } from '../components/layout/Layout'
import { PanelKeepAliveHost } from '../features/panels/PanelKeepAliveHost'
import { useBootstrapCache, useBootstrapQuery } from '../hooks/useBootstrap'
import { api, type BootstrapData } from '../lib/api'
import { applyTheme, watchThemeMode } from '../lib/theme'

export type AppOutletContext = {
  editMode: boolean
  bootstrapData: BootstrapData | undefined
  bootstrapLoading: boolean
  bootstrapRefreshing: boolean
  bootstrapError: boolean
}

export function App() {
  const { data, isLoading, isFetching, isError } = useBootstrapQuery()
  const panelMatch = useMatch('/panels/:panelId')
  const activePanelId = panelMatch?.params.panelId
  const { update } = useBootstrapCache()
  const [editMode, setEditMode] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  useEffect(() => {
    if (!data) return
    return watchThemeMode(data.settings.themeMode, setResolvedTheme)
  }, [data?.settings.themeMode])

  const updateSettingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: ({ settings }) => {
      update({ settings })
      setResolvedTheme(applyTheme(settings.themeMode))
    },
  })

  const handleToggleTheme = () => {
    if (!data) return
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    updateSettingsMutation.mutate({ themeMode: nextTheme })
  }

  return (
    <Layout
      activeOverlay={<PanelKeepAliveHost bootstrapData={data} activePanelId={activePanelId} />}
      activeOverlayVisible={!!activePanelId}
      themeMode={resolvedTheme}
      wallpaperUrl={data?.settings.wallpaperUrl}
      wallpaperOverlayOpacity={data?.settings.wallpaperOverlayOpacity}
      wallpaperBlur={data?.settings.wallpaperBlur}
      onToggleTheme={handleToggleTheme}
      editMode={editMode}
      onToggleEditMode={() => setEditMode((current) => !current)}
      sidebarVisible={sidebarVisible}
      onToggleSidebar={() => setSidebarVisible((current) => !current)}
      bootstrapLoading={isLoading && !data}
      bootstrapRefreshing={isFetching && !!data}
      bootstrapError={isError && !data}
    >
      <Outlet context={{
        editMode,
        bootstrapData: data,
        bootstrapLoading: isLoading && !data,
        bootstrapRefreshing: isFetching && !!data,
        bootstrapError: isError && !data,
      }} />
    </Layout>
  )
}
