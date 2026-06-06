export type ThemeMode = 'light' | 'dark' | 'system'

export const THEME_MODE_STORAGE_KEY = 'startnest:theme-mode'
export const DARK_THEME_COLOR = '#0b0b0b'
export const LIGHT_THEME_COLOR = '#ffffff'

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'
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

export function readPreferredThemeMode(): ThemeMode {
  return readStoredThemeMode() ?? 'system'
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

export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const theme = resolveTheme(mode)
  document.documentElement.classList.toggle('dark', theme === 'dark')
  applyThemeColor(theme)
  persistThemeMode(mode)
  return theme
}

export function watchThemeMode(mode: ThemeMode, onResolvedTheme?: (theme: 'light' | 'dark') => void) {
  const sync = () => {
    const theme = applyTheme(mode)
    onResolvedTheme?.(theme)
  }

  sync()

  if (mode !== 'system' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', sync)

  return () => media.removeEventListener('change', sync)
}
