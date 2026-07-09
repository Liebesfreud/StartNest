import { weatherResponseSchema } from './api.schemas'
import type {
  BootstrapData,
  BootstrapResult,
  BootstrapState,
  ExportPayload,
  Group,
  GroupCreatePayload,
  GroupUpdatePayload,
  LinkCreatePayload,
  LinkItem,
  LinkUpdatePayload,
  ReorderPayload,
  SearchEngine,
  SearchEngineCreatePayload,
  SearchEngineReorderPayload,
  SearchEngineUpdatePayload,
  Settings,
  SettingsUpdatePayload,
  User,
  UserUpdatePayload,
  WebPanel,
  WebPanelCreatePayload,
  WebPanelReorderPayload,
  WebPanelUpdatePayload,
} from './api.types'

export type {
  BootstrapData,
  BootstrapResult,
  BootstrapState,
  ExportPayload,
  Group,
  GroupCreatePayload,
  GroupUpdatePayload,
  LinkCreatePayload,
  LinkItem,
  LinkUpdatePayload,
  ReorderPayload,
  SearchEngine,
  SearchEngineCreatePayload,
  SearchEngineReorderPayload,
  SearchEngineUpdatePayload,
  Settings,
  SettingsUpdatePayload,
  User,
  UserUpdatePayload,
  WebPanel,
  WebPanelCreatePayload,
  WebPanelOpenMode,
  WebPanelReorderPayload,
  WebPanelUpdatePayload,
  WeatherResponse,
} from './api.types'

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

async function fetchApi(input: RequestInfo, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (error) {
    throw new ApiError({
      message: '网络请求失败，请检查连接后重试。',
      code: 'NETWORK_ERROR',
      details: error,
    })
  }
}

function handleUnauthorized(response: Response) {
  if (response.status !== 401) return

  try {
    localStorage.removeItem('startnest:auth')
    localStorage.removeItem('startnest:bootstrap')
  } catch {}
  window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
  throw new ApiError({ message: '登录已过期，请重新登录。', code: 'UNAUTHORIZED', status: 401 })
}

function unwrapApiData<T>(response: Response, json: ApiResponse<T>): T {
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
  const { headers, ...restInit } = init ?? {}
  const response = await fetchApi(input, {
    credentials: 'same-origin',
    ...restInit,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
  })

  handleUnauthorized(response)
  const json = await parseResponseBody<T>(response)
  return unwrapApiData(response, json)
}

async function requestBootstrap(version?: string | null): Promise<BootstrapResult> {
  const response = await fetchApi('/api/bootstrap', {
    credentials: 'same-origin',
    headers: version ? { 'If-None-Match': version } : undefined,
  })

  if (response.status === 304) {
    return { status: 'not-modified', version: response.headers.get('ETag') }
  }

  handleUnauthorized(response)
  const json = await parseResponseBody<BootstrapData>(response)
  return { status: 'fresh', data: unwrapApiData(response, json), version: response.headers.get('ETag') }
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
  listSearchEngines: () => request<{ searchEngines: SearchEngine[] }>('/api/search-engines'),
  createSearchEngine: (payload: SearchEngineCreatePayload) =>
    request<{ searchEngine: SearchEngine; searchEngines: SearchEngine[] }>('/api/search-engines', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSearchEngine: (id: string, payload: SearchEngineUpdatePayload) =>
    request<{ searchEngine: SearchEngine; searchEngines: SearchEngine[] }>(`/api/search-engines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteSearchEngine: (id: string) =>
    request<BootstrapData>(`/api/search-engines/${id}`, { method: 'DELETE' }),
  reorderSearchEngines: (payload: SearchEngineReorderPayload) =>
    request<{ searchEngines: SearchEngine[] }>('/api/search-engines/reorder', {
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
