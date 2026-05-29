export type ThemeMode = 'light' | 'dark' | 'system'

export const THEME_MODE_STORAGE_KEY = 'startnest:theme-mode'
export const DARK_THEME_COLOR = '#181716'
export const LIGHT_THEME_COLOR = '#F9F8F6'

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return mode
}

export function readStoredThemeMode(): ThemeMode | null {
  try {
    const value = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)
    return value === 'light' || value === 'dark' || value === 'system' ? value : null
  } catch {
    return null
  }
}

function persistThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
  } catch {
    return
  }
}

function applyThemeColor(theme: 'light' | 'dark') {
  const themeColor = document.querySelector('meta[name="theme-color"]')
  themeColor?.setAttribute('content', theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR)
}

export function applyTheme(mode: ThemeMode) {
  const theme = resolveTheme(mode)
  document.documentElement.classList.toggle('dark', theme === 'dark')
  applyThemeColor(theme)
  persistThemeMode(mode)
}
