import type { Env } from './db/schema'
import { ApiError, getSessionUser, jsonError, requireUser, unauthorizedHtml } from './auth/access'
import { login, logout } from './routes/auth'
import { bootstrap } from './routes/bootstrap'
import { createGroup, deleteGroup, updateGroup } from './routes/groups'
import { createLink, deleteLink, updateLink } from './routes/links'
import { exportData, importData } from './routes/importExport'
import { health } from './routes/health'
import { reorderEntities } from './routes/reorder'
import { updateUser } from './routes/user'
import { getWeather } from './routes/weather'
import { getIcon } from './routes/icon'
import { listPanels, createPanel, patchPanel, removePanel, reorderPanels } from './routes/panels'
import {
  createCustomSearchEngine,
  listCustomSearchEngines,
  patchCustomSearchEngine,
  removeCustomSearchEngine,
  reorderCustomSearchEngines,
} from './routes/searchEngines'

function notFound() {
  throw new ApiError(404, 'NOT_FOUND', 'Route not found')
}

function getIdFromPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.at(-1) ?? ''
}

const STATIC_ASSET_PREFIXES = ['/assets/']
const STATIC_ASSET_PATHS = new Set([
  '/favicon.ico',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sw.js',
])

function isStaticAssetRequest(pathname: string) {
  if (STATIC_ASSET_PATHS.has(pathname)) return true
  if (STATIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  return /\/[^/]+\.[^/]+$/.test(pathname)
}

function isHtmlResponse(response: Response) {
  return response.headers.get('content-type')?.toLowerCase().includes('text/html') ?? false
}

function staticAssetNotFound(pathname: string) {
  return new Response(`Static asset not found: ${pathname}`, {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=UTF-8',
      'cache-control': 'no-store',
    },
  })
}

// 关闭未使用的浏览器特性；geolocation 保留给天气自动定位（同源）使用。
const PERMISSIONS_POLICY = 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)'

function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // index.html 内联了主题初始化脚本（防止主题闪烁），需要 'unsafe-inline'。
    "script-src 'self' 'unsafe-inline'",
    // Radix、拖拽以及卡片背景色等使用内联 style。
    "style-src 'self' 'unsafe-inline'",
    // 链接 favicon、外链自定义图标、壁纸允许任意 https 图源。
    "img-src 'self' https: data:",
    "font-src 'self' data:",
    // 前端只与同源 /api 通信（天气等均走同源代理）。
    "connect-src 'self'",
    // 面板以 iframe 形式内嵌外部站点。
    "frame-src https:",
    "worker-src 'self'",
    "manifest-src 'self'",
  ].join('; ')
}

function withSecurityHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers)
  headers.set('Content-Security-Policy', buildContentSecurityPolicy())
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', PERMISSIONS_POLICY)
  if (new URL(request.url).protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)

  if (url.pathname === '/api/health' && request.method === 'GET') {
    return await health(env)
  }

  if (url.pathname === '/api/login' && request.method === 'POST') {
    return await login(request, env)
  }

  if (url.pathname === '/api/logout' && request.method === 'POST') {
    return await logout(request)
  }

  if (url.pathname.startsWith('/api/')) {
    const user = await requireUser(request, env)

    if (url.pathname === '/api/bootstrap' && request.method === 'GET') {
      return await bootstrap(request, env, user)
    }
    if (url.pathname === '/api/user' && request.method === 'PATCH') {
      return await updateUser(request, env, user)
    }
    if (url.pathname === '/api/groups' && request.method === 'POST') {
      return await createGroup(request, env)
    }
    if (url.pathname.startsWith('/api/groups/') && request.method === 'PATCH') {
      return await updateGroup(request, env, getIdFromPath(url.pathname))
    }
    if (url.pathname.startsWith('/api/groups/') && request.method === 'DELETE') {
      return await deleteGroup(env, user, getIdFromPath(url.pathname))
    }
    if (url.pathname === '/api/links' && request.method === 'POST') {
      return await createLink(request, env)
    }
    if (url.pathname.startsWith('/api/links/') && request.method === 'PATCH') {
      return await updateLink(request, env, getIdFromPath(url.pathname))
    }
    if (url.pathname.startsWith('/api/links/') && request.method === 'DELETE') {
      return await deleteLink(env, user, getIdFromPath(url.pathname))
    }
    if (url.pathname === '/api/reorder' && request.method === 'POST') {
      return await reorderEntities(request, env, user)
    }
    if (url.pathname === '/api/export' && request.method === 'GET') {
      return await exportData(env, user)
    }
    if (url.pathname === '/api/import' && request.method === 'POST') {
      return await importData(request, env, user)
    }
    if (url.pathname === '/api/weather' && request.method === 'GET') {
      return await getWeather(request)
    }
    if (url.pathname === '/api/icon' && request.method === 'GET') {
      return await getIcon(request)
    }
    if (url.pathname === '/api/panels' && request.method === 'GET') {
      return await listPanels(env)
    }
    if (url.pathname === '/api/panels' && request.method === 'POST') {
      return await createPanel(request, env)
    }
    if (url.pathname === '/api/panels/reorder' && request.method === 'POST') {
      return await reorderPanels(request, env)
    }
    if (url.pathname === '/api/search-engines' && request.method === 'GET') {
      return await listCustomSearchEngines(env)
    }
    if (url.pathname === '/api/search-engines' && request.method === 'POST') {
      return await createCustomSearchEngine(request, env)
    }
    if (url.pathname === '/api/search-engines/reorder' && request.method === 'POST') {
      return await reorderCustomSearchEngines(request, env)
    }
    if (url.pathname.startsWith('/api/search-engines/') && request.method === 'PATCH') {
      return await patchCustomSearchEngine(request, env, getIdFromPath(url.pathname))
    }
    if (url.pathname.startsWith('/api/search-engines/') && request.method === 'DELETE') {
      return await removeCustomSearchEngine(env, user, getIdFromPath(url.pathname))
    }
    if (url.pathname.startsWith('/api/panels/') && request.method === 'PATCH') {
      return await patchPanel(request, env, getIdFromPath(url.pathname))
    }
    if (url.pathname.startsWith('/api/panels/') && request.method === 'DELETE') {
      return await removePanel(env, getIdFromPath(url.pathname))
    }

    notFound()
  }

  if (!(await getSessionUser(request, env))) {
    return new Response(unauthorizedHtml(env.APP_NAME), {
      status: 401,
      headers: { 'content-type': 'text/html; charset=UTF-8' },
    })
  }

  const assetsResponse = await env.ASSETS.fetch(request)

  if (isStaticAssetRequest(url.pathname) && isHtmlResponse(assetsResponse)) {
    return staticAssetNotFound(url.pathname)
  }

  return assetsResponse
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return withSecurityHeaders(await handleRequest(request, env), request)
    } catch (error) {
      if (error instanceof ApiError) {
        return withSecurityHeaders(jsonError(error), request)
      }
      return withSecurityHeaders(
        jsonError(new ApiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error')),
        request,
      )
    }
  },
}
