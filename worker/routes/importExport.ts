import { z } from 'zod'
import type { Env, User } from '../db/schema'
import { ApiError, jsonSuccess } from '../auth/access'
import { getBootstrap, nowIso } from '../db/repo'

const wallpaperUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  })
  .nullable()

const wallpaperBlurSchema = z.number().min(0).max(100)
const wallpaperOverlayOpacitySchema = z.number().min(0).max(100)

function isSearchUrlTemplate(value: string) {
  if (!value.includes('{query}')) return false
  try {
    const url = new URL(value.replaceAll('{query}', 'startnest'))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const searchEngineSelectionSchema = z.string().trim().min(1).max(120)
const searchEngineImportSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(40),
  urlTemplate: z.string().trim().min(1).max(2048).refine(isSearchUrlTemplate),
  icon: z.string().trim().max(80).nullable().optional(),
  sortOrder: z.number().int().nonnegative(),
})

const settingsOnlySchema = z.object({
  settingsOnly: z.literal(true),
  settings: z.object({
    themeMode: z.enum(['light', 'dark', 'system']).optional(),
    cardDensity: z.enum(['compact', 'comfortable']).optional(),
    openInNewTab: z.boolean().optional(),
    showGroupIcons: z.boolean().optional(),
    searchEngine: searchEngineSelectionSchema.optional(),
    weatherEnabled: z.boolean().optional(),
    weatherAutoLocate: z.boolean().optional(),
    temperatureUnit: z.enum(['system', 'c', 'f']).optional(),
    wallpaperUrl: wallpaperUrlSchema.optional(),
    wallpaperOverlayOpacity: wallpaperOverlayOpacitySchema.optional(),
    wallpaperBlur: wallpaperBlurSchema.optional(),
  }),
})

const panelUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  })

const importSchema = z.object({
  version: z.string().optional(),
  groups: z.array(z.object({ id: z.string(), name: z.string().min(1), icon: z.string().nullable().optional(), sortOrder: z.number().int().nonnegative() })),
  links: z.array(z.object({ id: z.string(), groupId: z.string(), title: z.string().min(1), url: z.string().url(), icon: z.string().nullable().optional(), iconMode: z.enum(['favicon', 'material', 'image', 'text']).default('favicon'), iconImageUrl: z.string().url().nullable().optional(), iconText: z.string().nullable().optional(), description: z.string().nullable().optional(), tileSize: z.enum(['1x1', '1x3']).default('1x3'), openMode: z.enum(['global', 'same-tab', 'new-tab']).default('global'), backgroundColor: z.string().nullable().optional(), sortOrder: z.number().int().nonnegative() })),
  panels: z.array(z.object({ id: z.string(), title: z.string().trim().min(1).max(80), url: panelUrlSchema, icon: z.string().trim().max(80).nullable().optional(), description: z.string().trim().max(200).nullable().optional(), openMode: z.enum(['iframe', 'external']).default('iframe'), enabled: z.boolean().default(true), sortOrder: z.number().int().nonnegative() })).default([]),
  searchEngines: z.array(searchEngineImportSchema).default([]),
  settings: z.object({
    themeMode: z.enum(['light', 'dark', 'system']),
    cardDensity: z.enum(['compact', 'comfortable']),
    openInNewTab: z.boolean(),
    showGroupIcons: z.boolean(),
    searchEngine: searchEngineSelectionSchema.default('bing'),
    weatherEnabled: z.boolean().default(true),
    weatherAutoLocate: z.boolean().default(false),
    temperatureUnit: z.enum(['system', 'c', 'f']).default('system'),
    wallpaperUrl: wallpaperUrlSchema.default(null),
    wallpaperOverlayOpacity: wallpaperOverlayOpacitySchema.default(78),
    wallpaperBlur: wallpaperBlurSchema.default(0),
  }),
})

async function assertSearchEngineSelection(env: Env, searchEngine: string, importedCustomIds?: Set<string>) {
  if (searchEngine === 'bing' || searchEngine === 'google') return

  if (!searchEngine.startsWith('custom:')) {
    throw new ApiError(400, 'INVALID_SETTINGS', 'Invalid search engine selection')
  }

  const id = searchEngine.slice('custom:'.length)
  if (!id) {
    throw new ApiError(400, 'INVALID_SETTINGS', 'Invalid search engine selection')
  }

  if (importedCustomIds) {
    if (!importedCustomIds.has(id)) {
      throw new ApiError(400, 'INVALID_IMPORT', 'Selected search engine is missing from import data', { searchEngine })
    }
    return
  }

  const existing = await env.DB.prepare('SELECT id FROM search_engines WHERE id = ?').bind(id).first<{ id: string }>()
  if (!existing) {
    throw new ApiError(400, 'INVALID_SETTINGS', 'Selected search engine does not exist', { searchEngine })
  }
}

export async function exportData(env: Env, user: User) {
  const data = await getBootstrap(env, user)
  return jsonSuccess({
    version: '1',
    exportedAt: nowIso(),
    groups: data.groups,
    links: data.links,
    panels: data.panels,
    searchEngines: data.searchEngines,
    settings: data.settings,
  })
}

export async function importData(request: Request, env: Env, user: User) {
  const body = await request.json()
  const settingsOnly = settingsOnlySchema.safeParse(body)

  if (settingsOnly.success) {
    if (settingsOnly.data.settings.searchEngine) {
      await assertSearchEngineSelection(env, settingsOnly.data.settings.searchEngine)
    }

    const current = (await getBootstrap(env, user)).settings
    const next = { ...current, ...settingsOnly.data.settings, updatedAt: nowIso() }
    await env.DB.prepare('UPDATE settings SET theme_mode = ?, card_density = ?, open_in_new_tab = ?, show_group_icons = ?, search_engine = ?, weather_enabled = ?, weather_auto_locate = ?, temperature_unit = ?, wallpaper_url = ?, wallpaper_overlay_opacity = ?, wallpaper_blur = ?, updated_at = ? WHERE id = 1')
      .bind(
        next.themeMode,
        next.cardDensity,
        next.openInNewTab ? 1 : 0,
        next.showGroupIcons ? 1 : 0,
        next.searchEngine,
        next.weatherEnabled ? 1 : 0,
        next.weatherAutoLocate ? 1 : 0,
        next.temperatureUnit,
        next.wallpaperUrl,
        next.wallpaperOverlayOpacity,
        next.wallpaperBlur,
        next.updatedAt,
      )
      .run()
    return jsonSuccess({ settings: next })
  }

  const parsed = importSchema.safeParse(body)
  if (!parsed.success) throw new ApiError(400, 'INVALID_IMPORT', 'Invalid import payload', parsed.error.flatten())

  const groupIds = new Set(parsed.data.groups.map((item) => item.id))
  const searchEngineIds = new Set(parsed.data.searchEngines.map((item) => item.id))
  for (const link of parsed.data.links) {
    if (!groupIds.has(link.groupId)) {
      throw new ApiError(400, 'INVALID_IMPORT', 'Link references a missing group', { linkId: link.id, groupId: link.groupId })
    }
  }
  await assertSearchEngineSelection(env, parsed.data.settings.searchEngine, searchEngineIds)

  const statements: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM links'),
    env.DB.prepare('DELETE FROM groups'),
    env.DB.prepare('DELETE FROM web_panels'),
    env.DB.prepare('DELETE FROM search_engines'),
  ]

  for (const group of parsed.data.groups) {
    statements.push(
      env.DB.prepare('INSERT INTO groups (id, name, icon, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(group.id, group.name, group.icon ?? null, group.sortOrder, nowIso(), nowIso()),
    )
  }

  for (const link of parsed.data.links) {
    statements.push(
      env.DB.prepare('INSERT INTO links (id, group_id, title, url, icon, icon_mode, icon_image_url, icon_text, description, tile_size, open_mode, background_color, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(link.id, link.groupId, link.title, link.url, link.icon ?? null, link.iconMode, link.iconImageUrl ?? null, link.iconText ?? null, link.description ?? null, link.tileSize, link.openMode, link.backgroundColor ?? null, link.sortOrder, nowIso(), nowIso()),
    )
  }

  for (const panel of parsed.data.panels) {
    statements.push(
      env.DB.prepare('INSERT INTO web_panels (id, title, url, icon, description, open_mode, enabled, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(panel.id, panel.title, panel.url, panel.icon ?? null, panel.description ?? null, panel.openMode, panel.enabled ? 1 : 0, panel.sortOrder, nowIso(), nowIso()),
    )
  }

  for (const searchEngine of parsed.data.searchEngines) {
    statements.push(
      env.DB.prepare('INSERT INTO search_engines (id, name, url_template, icon, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(searchEngine.id, searchEngine.name, searchEngine.urlTemplate, searchEngine.icon ?? null, searchEngine.sortOrder, nowIso(), nowIso()),
    )
  }

  statements.push(
    env.DB.prepare('UPDATE settings SET theme_mode = ?, card_density = ?, open_in_new_tab = ?, show_group_icons = ?, search_engine = ?, weather_enabled = ?, weather_auto_locate = ?, temperature_unit = ?, wallpaper_url = ?, wallpaper_overlay_opacity = ?, wallpaper_blur = ?, updated_at = ? WHERE id = 1')
      .bind(
        parsed.data.settings.themeMode,
        parsed.data.settings.cardDensity,
        parsed.data.settings.openInNewTab ? 1 : 0,
        parsed.data.settings.showGroupIcons ? 1 : 0,
        parsed.data.settings.searchEngine,
        parsed.data.settings.weatherEnabled ? 1 : 0,
        parsed.data.settings.weatherAutoLocate ? 1 : 0,
        parsed.data.settings.temperatureUnit,
        parsed.data.settings.wallpaperUrl,
        parsed.data.settings.wallpaperOverlayOpacity,
        parsed.data.settings.wallpaperBlur,
        nowIso(),
      ),
  )

  await env.DB.batch(statements)
  return jsonSuccess(await getBootstrap(env, user))
}
