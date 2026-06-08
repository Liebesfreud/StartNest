import type { GroupRow, LinkRow, SettingsRow, Env, UserProfileRow, User, WebPanelRow, SearchEngineRow } from './schema'

export function nowIso() {
  return new Date().toISOString()
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export function applyUserProfile(user: User, profile: UserProfileRow | null) {
  const displayName = profile?.display_name?.trim() || user.name || null

  return {
    ...user,
    name: user.name,
    displayName,
  }
}

export async function getUserProfile(env: Env, subject: string) {
  return await env.DB.prepare('SELECT * FROM user_profiles WHERE subject = ?').bind(subject).first<UserProfileRow>()
}

export async function upsertUserProfile(env: Env, subject: string, displayName: string | null) {
  const now = nowIso()
  await env.DB.prepare(
    `INSERT INTO user_profiles (subject, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(subject) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at`,
  )
    .bind(subject, displayName, now, now)
    .run()

  return await getUserProfile(env, subject)
}

export function mapGroup(row: GroupRow) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapLink(row: LinkRow) {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    url: row.url,
    icon: row.icon,
    iconMode: row.icon_mode,
    iconImageUrl: row.icon_image_url,
    iconText: row.icon_text,
    description: row.description,
    tileSize: row.tile_size,
    openMode: row.open_mode,
    backgroundColor: row.background_color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapSettings(row: SettingsRow) {
  return {
    themeMode: row.theme_mode,
    cardDensity: row.card_density,
    openInNewTab: Boolean(row.open_in_new_tab),
    showGroupIcons: Boolean(row.show_group_icons),
    searchEngine: row.search_engine,
    weatherEnabled: Boolean(row.weather_enabled),
    weatherAutoLocate: Boolean(row.weather_auto_locate),
    temperatureUnit: row.temperature_unit,
    wallpaperUrl: row.wallpaper_url,
    wallpaperOverlayOpacity: row.wallpaper_overlay_opacity,
    wallpaperBlur: row.wallpaper_blur,
    updatedAt: row.updated_at,
  }
}

export function mapSearchEngine(row: SearchEngineRow) {
  return {
    id: row.id,
    name: row.name,
    urlTemplate: row.url_template,
    icon: row.icon,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listGroups(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM groups ORDER BY sort_order ASC, created_at ASC').all<GroupRow>()
  return results.map(mapGroup)
}

export async function listLinks(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM links ORDER BY sort_order ASC, created_at ASC').all<LinkRow>()
  return results.map(mapLink)
}

export async function getSettings(env: Env) {
  const row = await env.DB.prepare('SELECT * FROM settings WHERE id = 1').first<SettingsRow>()
  if (!row) {
    throw new Error('settings missing')
  }
  return mapSettings(row)
}

export function mapWebPanel(row: WebPanelRow) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    icon: row.icon,
    description: row.description,
    openMode: row.open_mode,
    enabled: Boolean(row.enabled),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listWebPanels(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM web_panels ORDER BY sort_order ASC, created_at ASC').all<WebPanelRow>()
  return results.map(mapWebPanel)
}

export async function listSearchEngines(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM search_engines ORDER BY sort_order ASC, created_at ASC').all<SearchEngineRow>()
  return results.map(mapSearchEngine)
}

export async function getSearchEngine(env: Env, id: string) {
  return await env.DB.prepare('SELECT * FROM search_engines WHERE id = ?').bind(id).first<SearchEngineRow>()
}

export async function createSearchEngine(env: Env, row: SearchEngineRow) {
  await env.DB.prepare(
    'INSERT INTO search_engines (id, name, url_template, icon, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(row.id, row.name, row.url_template, row.icon, row.sort_order, row.created_at, row.updated_at)
    .run()
}

export async function updateSearchEngine(env: Env, id: string, row: Partial<Omit<SearchEngineRow, 'id' | 'created_at'>>) {
  const existing = await getSearchEngine(env, id)
  if (!existing) return null
  const updated = {
    ...existing,
    ...row,
    updated_at: nowIso(),
  }
  await env.DB.prepare(
    'UPDATE search_engines SET name = ?, url_template = ?, icon = ?, sort_order = ?, updated_at = ? WHERE id = ?',
  )
    .bind(updated.name, updated.url_template, updated.icon, updated.sort_order, updated.updated_at, id)
    .run()
  return updated
}

export async function deleteSearchEngine(env: Env, id: string) {
  await env.DB.prepare('DELETE FROM search_engines WHERE id = ?').bind(id).run()
}

export async function reorderSearchEngines(env: Env, items: { id: string; sortOrder: number }[]) {
  const statements: D1PreparedStatement[] = []
  const now = nowIso()
  for (const item of items) {
    statements.push(env.DB.prepare('UPDATE search_engines SET sort_order = ?, updated_at = ? WHERE id = ?').bind(item.sortOrder, now, item.id))
  }
  if (statements.length) {
    await env.DB.batch(statements)
  }
}

export async function getWebPanel(env: Env, id: string) {
  return await env.DB.prepare('SELECT * FROM web_panels WHERE id = ?').bind(id).first<WebPanelRow>()
}

export async function createWebPanel(env: Env, row: WebPanelRow) {
  await env.DB.prepare(
    'INSERT INTO web_panels (id, title, url, icon, description, open_mode, enabled, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(row.id, row.title, row.url, row.icon, row.description, row.open_mode, row.enabled, row.sort_order, row.created_at, row.updated_at)
    .run()
}

export async function updateWebPanel(env: Env, id: string, row: Partial<Omit<WebPanelRow, 'id' | 'created_at'>>) {
  const existing = await getWebPanel(env, id)
  if (!existing) return null
  const updated = {
    ...existing,
    ...row,
    updated_at: nowIso(),
  }
  await env.DB.prepare(
    'UPDATE web_panels SET title = ?, url = ?, icon = ?, description = ?, open_mode = ?, enabled = ?, sort_order = ?, updated_at = ? WHERE id = ?',
  )
    .bind(updated.title, updated.url, updated.icon, updated.description, updated.open_mode, updated.enabled, updated.sort_order, updated.updated_at, id)
    .run()
  return updated
}

export async function deleteWebPanel(env: Env, id: string) {
  await env.DB.prepare('DELETE FROM web_panels WHERE id = ?').bind(id).run()
}

export async function reorderWebPanels(env: Env, items: { id: string; sortOrder: number }[]) {
  const statements: D1PreparedStatement[] = []
  const now = nowIso()
  for (const item of items) {
    statements.push(env.DB.prepare('UPDATE web_panels SET sort_order = ?, updated_at = ? WHERE id = ?').bind(item.sortOrder, now, item.id))
  }
  if (statements.length) {
    await env.DB.batch(statements)
  }
}

export async function getBootstrap(env: Env, user?: User) {
  const [groups, links, settings, panels, searchEngines] = await Promise.all([
    listGroups(env),
    listLinks(env),
    getSettings(env),
    listWebPanels(env),
    listSearchEngines(env),
  ])

  if (!user) {
    return { groups, links, settings, panels, searchEngines }
  }

  const profile = await getUserProfile(env, user.subject)
  return { user: applyUserProfile(user, profile), groups, links, settings, panels, searchEngines }
}

export async function getBootstrapVersion(env: Env, user?: User) {
  const [groups, links, settings, panels, searchEngines, profile] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) || ":" || COALESCE(MAX(updated_at), "") AS version FROM groups').first<{ version: string }>(),
    env.DB.prepare('SELECT COUNT(*) || ":" || COALESCE(MAX(updated_at), "") AS version FROM links').first<{ version: string }>(),
    env.DB.prepare('SELECT COUNT(*) || ":" || COALESCE(MAX(updated_at), "") AS version FROM settings').first<{ version: string }>(),
    env.DB.prepare('SELECT COUNT(*) || ":" || COALESCE(MAX(updated_at), "") AS version FROM web_panels').first<{ version: string }>(),
    env.DB.prepare('SELECT COUNT(*) || ":" || COALESCE(MAX(updated_at), "") AS version FROM search_engines').first<{ version: string }>(),
    user ? env.DB.prepare('SELECT COALESCE(updated_at, "") AS version FROM user_profiles WHERE subject = ?').bind(user.subject).first<{ version: string }>() : null,
  ])

  return [groups?.version, links?.version, settings?.version, panels?.version, searchEngines?.version, profile?.version]
    .filter(Boolean)
    .join('|')
}
