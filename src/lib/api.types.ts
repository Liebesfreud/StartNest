export type User = {
  email: string
  subject: string
  name: string | null
  displayName: string | null
}

export type Group = {
  id: string
  name: string
  icon: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type LinkItem = {
  id: string
  groupId: string
  title: string
  url: string
  icon: string | null
  iconMode: 'favicon' | 'material' | 'image' | 'text'
  iconImageUrl: string | null
  iconText: string | null
  description: string | null
  tileSize: '1x1' | '1x3'
  openMode: 'global' | 'same-tab' | 'new-tab'
  backgroundColor: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type WebPanelOpenMode = 'iframe' | 'external'

export type WebPanel = {
  id: string
  title: string
  url: string
  icon: string | null
  description: string | null
  openMode: WebPanelOpenMode
  enabled: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type SearchEngine = {
  id: string
  name: string
  urlTemplate: string
  icon: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type Settings = {
  themeMode: 'light' | 'dark' | 'system'
  cardDensity: 'compact' | 'comfortable'
  openInNewTab: boolean
  showGroupIcons: boolean
  searchEngine: string
  weatherEnabled: boolean
  weatherAutoLocate: boolean
  temperatureUnit: 'system' | 'c' | 'f'
  wallpaperUrl: string | null
  wallpaperOverlayOpacity: number
  wallpaperBlur: number
  updatedAt: string
}

export type BootstrapData = {
  user: User
  groups: Group[]
  links: LinkItem[]
  settings: Settings
  panels: WebPanel[]
  searchEngines: SearchEngine[]
}

export type ExportPayload = {
  version: string
  exportedAt: string
  groups: Group[]
  links: LinkItem[]
  settings: Settings
  panels: WebPanel[]
  searchEngines: SearchEngine[]
}

export type WeatherResponse = {
  temperature: number
  unit: 'C' | 'F'
  condition: string
  icon: string
  locationName: string | null
  fetchedAt: string
}

export type BootstrapState = Omit<BootstrapData, 'user'>

export type BootstrapResult =
  | { status: 'fresh'; data: BootstrapData; version: string | null }
  | { status: 'not-modified'; version: string | null }

export type GroupCreatePayload = {
  name: string
  icon?: string | null
}

export type GroupUpdatePayload = Partial<{
  name: string
  icon: string | null
  sortOrder: number
}>

export type LinkCreatePayload = {
  groupId: string
  title: string
  url: string
  icon?: string | null
  iconMode?: 'favicon' | 'material' | 'image' | 'text'
  iconImageUrl?: string | null
  iconText?: string | null
  description?: string | null
  tileSize?: '1x1' | '1x3'
  openMode?: 'global' | 'same-tab' | 'new-tab'
  backgroundColor?: string | null
}

export type LinkUpdatePayload = Partial<{
  groupId: string
  title: string
  url: string
  icon: string | null
  iconMode: 'favicon' | 'material' | 'image' | 'text'
  iconImageUrl: string | null
  iconText: string | null
  description: string | null
  tileSize: '1x1' | '1x3'
  openMode: 'global' | 'same-tab' | 'new-tab'
  backgroundColor: string | null
  sortOrder: number
}>

export type ReorderPayload = {
  groups: Array<{ id: string; sortOrder: number }>
  links: Array<{ id: string; groupId: string; sortOrder: number }>
}

export type SettingsUpdatePayload = Partial<Omit<Settings, 'updatedAt'>>

export type UserUpdatePayload = {
  displayName: string
}

export type WebPanelCreatePayload = {
  title: string
  url: string
  icon?: string | null
  description?: string | null
  openMode?: WebPanelOpenMode
  enabled?: boolean
  sortOrder?: number
}

export type WebPanelUpdatePayload = Partial<WebPanelCreatePayload>

export type WebPanelReorderPayload = {
  panels: Array<{ id: string; sortOrder: number }>
}

export type SearchEngineCreatePayload = {
  name: string
  urlTemplate: string
  icon?: string | null
  sortOrder?: number
}

export type SearchEngineUpdatePayload = Partial<SearchEngineCreatePayload>

export type SearchEngineReorderPayload = {
  searchEngines: Array<{ id: string; sortOrder: number }>
}
