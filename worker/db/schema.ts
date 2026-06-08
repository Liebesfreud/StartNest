export type Env = {
  DB: D1Database
  ASSETS: Fetcher
  APP_NAME?: string
  ADMIN_USERNAME?: string
  ADMIN_PASSWORD?: string
  SESSION_SECRET?: string
  SESSION_NOT_BEFORE?: string
}

export type User = {
  email: string
  subject: string
  name: string | null
  displayName: string | null
}

export type UserProfileRow = {
  subject: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export type GroupRow = {
  id: string
  name: string
  icon: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type LinkRow = {
  id: string
  group_id: string
  title: string
  url: string
  icon: string | null
  icon_mode: 'favicon' | 'material' | 'image' | 'text'
  icon_image_url: string | null
  icon_text: string | null
  description: string | null
  tile_size: '1x1' | '1x3'
  open_mode: 'global' | 'same-tab' | 'new-tab'
  background_color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type WebPanelRow = {
  id: string
  title: string
  url: string
  icon: string | null
  description: string | null
  open_mode: 'iframe' | 'external'
  enabled: number
  sort_order: number
  created_at: string
  updated_at: string
}

export type SearchEngineRow = {
  id: string
  name: string
  url_template: string
  icon: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type SettingsRow = {
  id: number
  theme_mode: 'light' | 'dark' | 'system'
  card_density: 'compact' | 'comfortable'
  open_in_new_tab: number
  show_group_icons: number
  search_engine: string
  weather_enabled: number
  weather_auto_locate: number
  temperature_unit: 'system' | 'c' | 'f'
  wallpaper_url: string | null
  wallpaper_overlay_opacity: number
  wallpaper_blur: number
  updated_at: string
}
