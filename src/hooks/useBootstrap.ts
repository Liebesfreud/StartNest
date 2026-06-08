import { useRef } from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, type BootstrapData } from '../lib/api'
import { bootstrapSchema } from '../lib/api.schemas'

export const bootstrapQueryKey = ['bootstrap'] as const
const BOOTSTRAP_CACHE_KEY = 'startnest:bootstrap'

type BootstrapCache = {
  data: BootstrapData
  version: string | null
  cachedAt: number
}

function readBootstrapCache(): BootstrapCache | null {
  try {
    const raw = window.localStorage.getItem(BOOTSTRAP_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<BootstrapCache>
    const data = bootstrapSchema.safeParse(parsed.data)
    if (!data.success) return null

    return {
      data: data.data,
      version: typeof parsed.version === 'string' ? parsed.version : null,
      cachedAt: typeof parsed.cachedAt === 'number' ? parsed.cachedAt : Date.now(),
    }
  } catch {
    return null
  }
}

function writeBootstrapCache(data: BootstrapData, version: string | null) {
  try {
    window.localStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify({ data, version, cachedAt: Date.now() }))
  } catch {
    // Storage can be unavailable in private browsing or strict browser modes.
  }
}

export function useBootstrapQuery() {
  const queryClient = useQueryClient()
  const cachedRef = useRef<BootstrapCache | null>(readBootstrapCache())
  const versionRef = useRef<string | null>(cachedRef.current?.version ?? null)

  return useQuery({
    queryKey: bootstrapQueryKey,
    queryFn: async () => {
      const result = await api.bootstrapIncremental(versionRef.current)

      if (result.version) {
        versionRef.current = result.version
      }

      if (result.status === 'not-modified') {
        const current = queryClient.getQueryData<BootstrapData>(bootstrapQueryKey)
        if (current) return current
        if (cachedRef.current) return cachedRef.current.data
        const fallback = await api.bootstrap()
        writeBootstrapCache(fallback, result.version)
        return fallback
      }

      writeBootstrapCache(result.data, result.version)
      return result.data
    },
    initialData: () => cachedRef.current?.data,
    initialDataUpdatedAt: () => cachedRef.current?.cachedAt,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnMount: false,
  })
}

export function updateBootstrapCache(
  queryClient: QueryClient,
  updater: Partial<BootstrapData> | ((current: BootstrapData) => BootstrapData),
) {
  queryClient.setQueryData<BootstrapData>(bootstrapQueryKey, (current) => {
    if (!current) return current
    const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
    writeBootstrapCache(next, readBootstrapCache()?.version ?? null)
    return next
  })
}

export function replaceBootstrapCache(queryClient: QueryClient, next: BootstrapData) {
  writeBootstrapCache(next, readBootstrapCache()?.version ?? null)
  queryClient.setQueryData<BootstrapData>(bootstrapQueryKey, next)
}

export function useBootstrapCache() {
  const queryClient = useQueryClient()

  return {
    update: (updater: Partial<BootstrapData> | ((current: BootstrapData) => BootstrapData)) =>
      updateBootstrapCache(queryClient, updater),
    replace: (next: BootstrapData) => replaceBootstrapCache(queryClient, next),
  }
}
