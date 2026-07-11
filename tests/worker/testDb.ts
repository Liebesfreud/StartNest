import type { Env } from '../../worker/db/schema'

type TableState = {
  groups: Record<string, any>
  links: Record<string, any>
  settings: Record<string, any>
  webPanels: Record<string, any>
  searchEngines: Record<string, any>
  loginAttempts: Record<string, any>
  userProfiles: Record<string, any>
}

type InitialState = Partial<{
  groups: any[]
  links: any[]
  settings: any
  webPanels: any[]
  searchEngines: any[]
  loginAttempts: any[]
  userProfiles: any[]
}>

function byId(rows: any[] = []) {
  return Object.fromEntries(rows.map((row) => [row.id ?? row.identifier ?? row.subject, { ...row }]))
}

function ordered(rows: Record<string, any>) {
  return Object.values(rows).sort((left, right) => {
    const sortDelta = (left.sort_order ?? 0) - (right.sort_order ?? 0)
    if (sortDelta !== 0) return sortDelta
    return String(left.created_at ?? '').localeCompare(String(right.created_at ?? ''))
  })
}

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, ' ').trim()
}

class TestPreparedStatement {
  private params: unknown[] = []

  constructor(
    private readonly state: TableState,
    private readonly sql: string,
  ) {}

  bind(...params: unknown[]) {
    this.params = params
    return this
  }

  async first<T>() {
    const sql = normalizeSql(this.sql)
    const [first] = this.params

    if (sql.startsWith('SELECT * FROM login_attempts WHERE identifier = ?')) {
      return (this.state.loginAttempts[first as string] ?? null) as T | null
    }
    if (sql.startsWith('SELECT id FROM search_engines WHERE id = ?')) {
      const row = this.state.searchEngines[first as string]
      return (row ? { id: row.id } : null) as T | null
    }
    if (sql.startsWith('SELECT * FROM search_engines WHERE id = ?')) {
      return (this.state.searchEngines[first as string] ?? null) as T | null
    }
    if (sql.startsWith('SELECT * FROM settings WHERE id = 1')) {
      return (this.state.settings['1'] ?? null) as T | null
    }
    if (sql.startsWith('SELECT * FROM user_profiles WHERE subject = ?')) {
      return (this.state.userProfiles[first as string] ?? null) as T | null
    }

    throw new Error(`Unhandled first SQL: ${sql}`)
  }

  async all<T>() {
    const sql = normalizeSql(this.sql)

    if (sql.startsWith('SELECT * FROM groups ORDER BY')) return { results: ordered(this.state.groups) as T[] }
    if (sql.startsWith('SELECT * FROM links ORDER BY')) return { results: ordered(this.state.links) as T[] }
    if (sql.startsWith('SELECT * FROM web_panels ORDER BY')) return { results: ordered(this.state.webPanels) as T[] }
    if (sql.startsWith('SELECT * FROM search_engines ORDER BY')) return { results: ordered(this.state.searchEngines) as T[] }

    throw new Error(`Unhandled all SQL: ${sql}`)
  }

  async run() {
    const sql = normalizeSql(this.sql)

    if (sql.startsWith('DELETE FROM login_attempts WHERE identifier = ?')) {
      delete this.state.loginAttempts[this.params[0] as string]
      return { success: true }
    }
    if (sql.startsWith('INSERT INTO login_attempts')) {
      const [identifier, attempts, firstAttemptAt, lockedUntil, updatedAt] = this.params
      this.state.loginAttempts[identifier as string] = {
        identifier,
        attempts,
        first_attempt_at: firstAttemptAt,
        locked_until: lockedUntil,
        updated_at: updatedAt,
      }
      return { success: true }
    }
    if (sql.startsWith('UPDATE groups SET sort_order')) {
      const [sortOrder, updatedAt, id] = this.params
      Object.assign(this.state.groups[id as string], { sort_order: sortOrder, updated_at: updatedAt })
      return { success: true }
    }
    if (sql.startsWith('UPDATE links SET group_id')) {
      const [groupId, sortOrder, updatedAt, id] = this.params
      Object.assign(this.state.links[id as string], { group_id: groupId, sort_order: sortOrder, updated_at: updatedAt })
      return { success: true }
    }
    if (sql.startsWith('UPDATE search_engines SET sort_order')) {
      const [sortOrder, updatedAt, id] = this.params
      Object.assign(this.state.searchEngines[id as string], { sort_order: sortOrder, updated_at: updatedAt })
      return { success: true }
    }
    if (sql.startsWith('DELETE FROM search_engines WHERE id = ?')) {
      delete this.state.searchEngines[this.params[0] as string]
      return { success: true }
    }
    if (sql.startsWith("UPDATE settings SET search_engine = 'bing'")) {
      const [updatedAt, searchEngine] = this.params
      const settings = this.state.settings['1']
      if (settings.search_engine === searchEngine) {
        settings.search_engine = 'bing'
        settings.updated_at = updatedAt
      }
      return { success: true }
    }
    if (sql.startsWith('UPDATE settings SET theme_mode')) {
      const [
        themeMode,
        cardDensity,
        openInNewTab,
        showGroupIcons,
        searchEngine,
        weatherEnabled,
        weatherAutoLocate,
        temperatureUnit,
        wallpaperUrl,
        wallpaperOverlayOpacity,
        wallpaperBlur,
        updatedAt,
      ] = this.params
      Object.assign(this.state.settings['1'], {
        theme_mode: themeMode,
        card_density: cardDensity,
        open_in_new_tab: openInNewTab,
        show_group_icons: showGroupIcons,
        search_engine: searchEngine,
        weather_enabled: weatherEnabled,
        weather_auto_locate: weatherAutoLocate,
        temperature_unit: temperatureUnit,
        wallpaper_url: wallpaperUrl,
        wallpaper_overlay_opacity: wallpaperOverlayOpacity,
        wallpaper_blur: wallpaperBlur,
        updated_at: updatedAt,
      })
      return { success: true }
    }
    if (sql.startsWith('DELETE FROM links')) {
      this.state.links = {}
      return { success: true }
    }
    if (sql.startsWith('DELETE FROM groups')) {
      this.state.groups = {}
      return { success: true }
    }
    if (sql.startsWith('DELETE FROM web_panels')) {
      this.state.webPanels = {}
      return { success: true }
    }
    if (sql.startsWith('DELETE FROM search_engines')) {
      this.state.searchEngines = {}
      return { success: true }
    }
    if (sql.startsWith('INSERT INTO groups')) {
      const [id, name, icon, sortOrder, createdAt, updatedAt] = this.params
      this.state.groups[id as string] = { id, name, icon, sort_order: sortOrder, created_at: createdAt, updated_at: updatedAt }
      return { success: true }
    }
    if (sql.startsWith('INSERT INTO links')) {
      const [
        id,
        groupId,
        title,
        url,
        icon,
        iconMode,
        iconImageUrl,
        iconText,
        description,
        tileSize,
        openMode,
        backgroundColor,
        sortOrder,
        createdAt,
        updatedAt,
      ] = this.params
      this.state.links[id as string] = {
        id,
        group_id: groupId,
        title,
        url,
        icon,
        icon_mode: iconMode,
        icon_image_url: iconImageUrl,
        icon_text: iconText,
        description,
        tile_size: tileSize,
        open_mode: openMode,
        background_color: backgroundColor,
        sort_order: sortOrder,
        created_at: createdAt,
        updated_at: updatedAt,
      }
      return { success: true }
    }
    if (sql.startsWith('INSERT INTO web_panels')) {
      const [id, title, url, icon, description, openMode, enabled, sortOrder, createdAt, updatedAt] = this.params
      this.state.webPanels[id as string] = {
        id,
        title,
        url,
        icon,
        description,
        open_mode: openMode,
        enabled,
        sort_order: sortOrder,
        created_at: createdAt,
        updated_at: updatedAt,
      }
      return { success: true }
    }
    if (sql.startsWith('INSERT INTO search_engines')) {
      const [id, name, urlTemplate, icon, sortOrder, createdAt, updatedAt] = this.params
      this.state.searchEngines[id as string] = {
        id,
        name,
        url_template: urlTemplate,
        icon,
        sort_order: sortOrder,
        created_at: createdAt,
        updated_at: updatedAt,
      }
      return { success: true }
    }

    throw new Error(`Unhandled run SQL: ${sql}`)
  }
}

export function createTestEnv(initial: InitialState = {}) {
  const state: TableState = {
    groups: byId(initial.groups),
    links: byId(initial.links),
    settings: {
      '1': {
        id: 1,
        theme_mode: 'system',
        card_density: 'comfortable',
        open_in_new_tab: 1,
        show_group_icons: 1,
        search_engine: 'bing',
        weather_enabled: 1,
        weather_auto_locate: 0,
        temperature_unit: 'system',
        wallpaper_url: null,
        wallpaper_overlay_opacity: 78,
        wallpaper_blur: 0,
        updated_at: '2026-01-01T00:00:00.000Z',
        ...(initial.settings ?? {}),
      },
    },
    webPanels: byId(initial.webPanels),
    searchEngines: byId(initial.searchEngines),
    loginAttempts: byId(initial.loginAttempts),
    userProfiles: byId(initial.userProfiles),
  }

  const env = {
    APP_NAME: 'StartNest',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'password',
    SESSION_SECRET: 'test-secret',
    DB: {
      prepare: (sql: string) => new TestPreparedStatement(state, sql),
      batch: async (statements: TestPreparedStatement[]) => {
        for (const statement of statements) {
          await statement.run()
        }
        return []
      },
    },
    ASSETS: { fetch: async () => new Response('') },
  } as unknown as Env

  return { env, state }
}

export const testUser = {
  email: 'admin',
  subject: 'admin:admin',
  name: 'admin',
  displayName: 'admin',
}
