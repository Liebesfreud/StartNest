import { z } from 'zod'
import type { Env, SearchEngineRow, User } from '../db/schema'
import { ApiError, jsonSuccess } from '../auth/access'
import {
  createId,
  createSearchEngine,
  deleteSearchEngine,
  getBootstrap,
  getSearchEngine,
  listSearchEngines,
  mapSearchEngine,
  nowIso,
  reorderSearchEngines,
  updateSearchEngine,
} from '../db/repo'

function isSearchUrlTemplate(value: string) {
  if (!value.includes('{query}')) return false
  try {
    const url = new URL(value.replaceAll('{query}', 'startnest'))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const searchEngineSchema = {
  name: z.string().trim().min(1).max(40),
  urlTemplate: z.string().trim().min(1).max(2048).refine(isSearchUrlTemplate, {
    message: 'URL template must be http/https and include {query}',
  }),
  icon: z.string().trim().max(80).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}

const createSearchEngineSchema = z.object(searchEngineSchema)

const patchSearchEngineSchema = z.object({
  name: searchEngineSchema.name.optional(),
  urlTemplate: searchEngineSchema.urlTemplate.optional(),
  icon: searchEngineSchema.icon,
  sortOrder: searchEngineSchema.sortOrder,
})

const reorderSearchEngineSchema = z.object({
  searchEngines: z.array(z.object({ id: z.string(), sortOrder: z.number().int().nonnegative() })),
})

export async function listCustomSearchEngines(env: Env) {
  return jsonSuccess({ searchEngines: await listSearchEngines(env) })
}

export async function createCustomSearchEngine(request: Request, env: Env) {
  const parsed = createSearchEngineSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(400, 'INVALID_SEARCH_ENGINE', 'Invalid search engine payload', parsed.error.flatten())

  const now = nowIso()
  const current = await listSearchEngines(env)
  const row: SearchEngineRow = {
    id: createId('se'),
    name: parsed.data.name,
    url_template: parsed.data.urlTemplate,
    icon: parsed.data.icon ?? null,
    sort_order: parsed.data.sortOrder ?? current.length,
    created_at: now,
    updated_at: now,
  }

  await createSearchEngine(env, row)
  return jsonSuccess({ searchEngine: mapSearchEngine(row), searchEngines: await listSearchEngines(env) })
}

export async function patchCustomSearchEngine(request: Request, env: Env, id: string) {
  const parsed = patchSearchEngineSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(400, 'INVALID_SEARCH_ENGINE', 'Invalid search engine payload', parsed.error.flatten())

  const existing = await getSearchEngine(env, id)
  if (!existing) throw new ApiError(404, 'SEARCH_ENGINE_NOT_FOUND', 'Search engine not found')

  const updated = await updateSearchEngine(env, id, {
    name: parsed.data.name ?? existing.name,
    url_template: parsed.data.urlTemplate ?? existing.url_template,
    icon: parsed.data.icon === undefined ? existing.icon : parsed.data.icon,
    sort_order: parsed.data.sortOrder ?? existing.sort_order,
  })

  return jsonSuccess({ searchEngine: mapSearchEngine(updated!), searchEngines: await listSearchEngines(env) })
}

export async function removeCustomSearchEngine(env: Env, user: User, id: string) {
  const existing = await getSearchEngine(env, id)
  if (!existing) throw new ApiError(404, 'SEARCH_ENGINE_NOT_FOUND', 'Search engine not found')

  await deleteSearchEngine(env, id)
  await env.DB.prepare(
    `UPDATE settings
     SET search_engine = 'bing', updated_at = ?
     WHERE id = 1 AND search_engine = ?`,
  )
    .bind(nowIso(), `custom:${id}`)
    .run()
  return jsonSuccess(await getBootstrap(env, user))
}

export async function reorderCustomSearchEngines(request: Request, env: Env) {
  const parsed = reorderSearchEngineSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(400, 'INVALID_REORDER', 'Invalid reorder payload', parsed.error.flatten())

  await reorderSearchEngines(env, parsed.data.searchEngines)
  return jsonSuccess({ searchEngines: await listSearchEngines(env) })
}
