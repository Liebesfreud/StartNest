import { z } from 'zod'

const userSchema = z.object({
  email: z.string().min(1),
  subject: z.string().min(1),
  name: z.string().nullable(),
  displayName: z.string().nullable(),
})

export const updateUserSchema = z.object({
  displayName: z.string().trim().max(80),
})

export const groupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const linkSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  title: z.string().min(1),
  url: z.string().url(),
  icon: z.string().nullable(),
  iconMode: z.enum(['favicon', 'material', 'image', 'text']),
  iconImageUrl: z.string().url().nullable(),
  iconText: z.string().nullable(),
  description: z.string().nullable(),
  tileSize: z.enum(['1x1', '1x3']),
  openMode: z.enum(['global', 'same-tab', 'new-tab']),
  backgroundColor: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const webPanelSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  url: z.string().url(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  openMode: z.enum(['iframe', 'external']),
  enabled: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

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

export const settingsSchema = z.object({
  themeMode: z.enum(['light', 'dark', 'system']),
  cardDensity: z.enum(['compact', 'comfortable']),
  openInNewTab: z.boolean(),
  showGroupIcons: z.boolean(),
  searchEngine: z.enum(['google', 'bing']).default('bing'),
  weatherEnabled: z.boolean().default(true),
  weatherAutoLocate: z.boolean().default(false),
  temperatureUnit: z.enum(['system', 'c', 'f']).default('system'),
  wallpaperUrl: wallpaperUrlSchema.default(null),
  wallpaperOverlayOpacity: wallpaperOverlayOpacitySchema.default(78),
  wallpaperBlur: wallpaperBlurSchema.default(0),
  updatedAt: z.string(),
})

export const bootstrapSchema = z.object({
  user: userSchema,
  groups: z.array(groupSchema),
  links: z.array(linkSchema),
  settings: settingsSchema,
  panels: z.array(webPanelSchema),
})

export const exportPayloadSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  groups: z.array(groupSchema),
  links: z.array(linkSchema),
  settings: settingsSchema,
  panels: z.array(webPanelSchema).default([]),
})

const weatherResponseSchema = z.object({
  temperature: z.number(),
  unit: z.enum(['C', 'F']),
  condition: z.string().min(1),
  icon: z.string().min(1),
  locationName: z.string().nullable(),
  fetchedAt: z.string(),
})

export type User = z.infer<typeof userSchema>
export type Group = z.infer<typeof groupSchema>
export type LinkItem = z.infer<typeof linkSchema>
export type WebPanel = z.infer<typeof webPanelSchema>
export type WebPanelOpenMode = WebPanel['openMode']
export type Settings = z.infer<typeof settingsSchema>
export type BootstrapData = z.infer<typeof bootstrapSchema>
export type ExportPayload = z.infer<typeof exportPayloadSchema>
export type WeatherResponse = z.infer<typeof weatherResponseSchema>
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
export type UserUpdatePayload = z.infer<typeof updateUserSchema>

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

export class ApiError extends Error {
  code: string
  status: number
  details?: unknown

  constructor({ message, code = 'UNKNOWN_ERROR', status = 0, details }: { message: string; code?: string; status?: number; details?: unknown }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export type ApiSuccess<T> = {
  ok: true
  data: T
  error: null
}

export type ApiFailure = {
  ok: false
  data: null
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return typeof value === 'object' && value !== null && 'ok' in value
}

async function parseResponseBody<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    throw new ApiError({
      message: '服务器返回了无法识别的响应格式。',
      code: 'INVALID_RESPONSE_FORMAT',
      status: response.status,
    })
  }

  let json: unknown

  try {
    json = await response.json()
  } catch {
    throw new ApiError({
      message: '服务器响应解析失败。',
      code: 'INVALID_RESPONSE_BODY',
      status: response.status,
    })
  }

  if (!isApiResponse<T>(json)) {
    throw new ApiError({
      message: '服务器返回的数据结构不正确。',
      code: 'INVALID_RESPONSE_SHAPE',
      status: response.status,
      details: json,
    })
  }

  return json
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(input, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    })
  } catch (error) {
    throw new ApiError({
      message: '网络请求失败，请检查连接后重试。',
      code: 'NETWORK_ERROR',
      details: error,
    })
  }

  // Auto-logout on 401 — session expired or invalid
  if (response.status === 401) {
    try {
      localStorage.removeItem('aeronav:auth')
      localStorage.removeItem('aeronav:bootstrap')
    } catch {}
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
    throw new ApiError({ message: '登录已过期，请重新登录。', code: 'UNAUTHORIZED', status: 401 })
  }

  const json = await parseResponseBody<T>(response)

  if (!response.ok) {
    if (!json.ok) {
      throw new ApiError({
        message: json.error.message || '请求失败。',
        code: json.error.code || 'REQUEST_FAILED',
        status: response.status,
        details: json.error.details,
      })
    }

    throw new ApiError({
      message: '请求失败。',
      code: 'HTTP_ERROR',
      status: response.status,
      details: json,
    })
  }

  if (!json.ok) {
    throw new ApiError({
      message: json.error.message || '请求失败。',
      code: json.error.code || 'REQUEST_FAILED',
      status: response.status,
      details: json.error.details,
    })
  }

  return json.data
}

async function requestBootstrap(version?: string | null): Promise<BootstrapResult> {
  let response: Response

  try {
    response = await fetch('/api/bootstrap', {
      credentials: 'same-origin',
      headers: version ? { 'If-None-Match': version } : undefined,
    })
  } catch (error) {
    throw new ApiError({
      message: '网络请求失败，请检查连接后重试。',
      code: 'NETWORK_ERROR',
      details: error,
    })
  }

  if (response.status === 304) {
    return { status: 'not-modified', version: response.headers.get('ETag') }
  }

  if (response.status === 401) {
    try {
      localStorage.removeItem('aeronav:auth')
      localStorage.removeItem('aeronav:bootstrap')
    } catch {}
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
    throw new ApiError({ message: '登录已过期，请重新登录。', code: 'UNAUTHORIZED', status: 401 })
  }

  const json = await parseResponseBody<BootstrapData>(response)

  if (!response.ok) {
    if (!json.ok) {
      throw new ApiError({
        message: json.error.message || '请求失败。',
        code: json.error.code || 'REQUEST_FAILED',
        status: response.status,
        details: json.error.details,
      })
    }

    throw new ApiError({
      message: '请求失败。',
      code: 'HTTP_ERROR',
      status: response.status,
      details: json,
    })
  }

  if (!json.ok) {
    throw new ApiError({
      message: json.error.message || '请求失败。',
      code: json.error.code || 'REQUEST_FAILED',
      status: response.status,
      details: json.error.details,
    })
  }

  return { status: 'fresh', data: json.data, version: response.headers.get('ETag') }
}

export const api = {
  bootstrap: () => request<BootstrapData>('/api/bootstrap'),
  bootstrapIncremental: requestBootstrap,
  createGroup: (payload: GroupCreatePayload) =>
    request<{ group: Group; groups: Group[] }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateGroup: (id: string, payload: GroupUpdatePayload) =>
    request<{ group: Group; groups: Group[] }>(`/api/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteGroup: (id: string) =>
    request<BootstrapState>(`/api/groups/${id}`, { method: 'DELETE' }),
  createLink: (payload: LinkCreatePayload) =>
    request<{ link: LinkItem; links: LinkItem[] }>('/api/links', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateLink: (id: string, payload: LinkUpdatePayload) =>
    request<{ link: LinkItem; links: LinkItem[] }>(`/api/links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteLink: (id: string) =>
    request<BootstrapState>(`/api/links/${id}`, { method: 'DELETE' }),
  reorder: (payload: ReorderPayload) =>
    request<BootstrapState>('/api/reorder', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSettings: (payload: SettingsUpdatePayload) =>
    request<{ settings: Settings }>('/api/import?settings=1', {
      method: 'POST',
      body: JSON.stringify({ settingsOnly: true, settings: payload }),
    }),
  updateUser: (payload: UserUpdatePayload) =>
    request<{ user: User }>('/api/user', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listPanels: () => request<{ panels: WebPanel[] }>('/api/panels'),
  createPanel: (payload: WebPanelCreatePayload) =>
    request<{ panel: WebPanel; panels: WebPanel[] }>('/api/panels', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePanel: (id: string, payload: WebPanelUpdatePayload) =>
    request<{ panel: WebPanel; panels: WebPanel[] }>(`/api/panels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePanel: (id: string) =>
    request<{ panels: WebPanel[] }>(`/api/panels/${id}`, { method: 'DELETE' }),
  reorderPanels: (payload: WebPanelReorderPayload) =>
    request<{ panels: WebPanel[] }>('/api/panels/reorder', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  exportAll: () => request<ExportPayload>('/api/export'),
  importAll: (payload: unknown) =>
    request<BootstrapState>('/api/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getWeather: async (params: { latitude: number; longitude: number; temperatureUnit: 'system' | 'c' | 'f' }) => {
    const searchParams = new URLSearchParams({
      lat: params.latitude.toString(),
      lon: params.longitude.toString(),
      unit: params.temperatureUnit,
    })
    const data = await request<unknown>(`/api/weather?${searchParams.toString()}`)
    return weatherResponseSchema.parse(data)
  },
}
