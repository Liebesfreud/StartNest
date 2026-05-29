import type { Env, User } from '../db/schema'

const SESSION_COOKIE_NAME = 'startnest_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const LOGIN_WINDOW_SECONDS = 15 * 60
const MAX_LOGIN_ATTEMPTS = 5
const textEncoder = new TextEncoder()

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data, error: null }, init)
}

export function jsonError(error: ApiError) {
  return Response.json(
    {
      ok: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status: error.status },
  )
}

type SessionPayload = {
  username: string
  exp: number
  iat: number
}

type LoginAttemptRow = {
  identifier: string
  attempts: number
  first_attempt_at: number
  locked_until: number | null
}

function toBase64Url(input: string | Uint8Array) {
  const bytes = typeof input === 'string' ? textEncoder.encode(input) : input
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

async function importSessionKey(secret: string) {
  return crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

async function signSessionPayload(payloadBase64: string, secret: string) {
  const key = await importSessionKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payloadBase64))
  return toBase64Url(new Uint8Array(signature))
}

function getRequiredEnv(env: Env, key: 'ADMIN_USERNAME' | 'ADMIN_PASSWORD' | 'SESSION_SECRET') {
  const value = env[key]
  if (!value) {
    throw new ApiError(500, 'AUTH_CONFIG_MISSING', `Missing required auth config: ${key}`)
  }
  return value
}


function getClientIp(request: Request) {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'
}

function loginIdentifier(request: Request, username: string) {
  return `${getClientIp(request)}:${username.toLowerCase()}`.slice(0, 256)
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

function constantTimeEqual(a: string, b: string) {
  const left = textEncoder.encode(a)
  const right = textEncoder.encode(b)
  const length = Math.max(left.length, right.length)
  let diff = left.length ^ right.length

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0)
  }

  return diff === 0
}

function getSessionNotBefore(env: Env) {
  const raw = env.SESSION_NOT_BEFORE
  if (!raw) return 0
  const parsed = Number(raw)
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed)
  const date = Date.parse(raw)
  return Number.isFinite(date) ? Math.floor(date / 1000) : 0
}

export async function assertLoginAllowed(request: Request, env: Env, username: string) {
  const identifier = loginIdentifier(request, username)
  const row = await env.DB.prepare('SELECT * FROM login_attempts WHERE identifier = ?')
    .bind(identifier)
    .first<LoginAttemptRow>()
  const now = nowSeconds()

  if (row?.locked_until && row.locked_until > now) {
    throw new ApiError(429, 'LOGIN_RATE_LIMITED', 'Too many failed login attempts. Please try again later.', {
      retryAfterSeconds: row.locked_until - now,
    })
  }
}

export async function recordLoginResult(request: Request, env: Env, username: string, success: boolean) {
  const identifier = loginIdentifier(request, username)

  if (success) {
    await env.DB.prepare('DELETE FROM login_attempts WHERE identifier = ?').bind(identifier).run()
    return
  }

  const now = nowSeconds()
  const row = await env.DB.prepare('SELECT * FROM login_attempts WHERE identifier = ?')
    .bind(identifier)
    .first<LoginAttemptRow>()

  const inWindow = row !== null && now - row.first_attempt_at <= LOGIN_WINDOW_SECONDS
  const attempts = inWindow && row ? row.attempts + 1 : 1
  const firstAttemptAt = inWindow && row ? row.first_attempt_at : now
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_WINDOW_SECONDS : null

  await env.DB.prepare(
    `INSERT INTO login_attempts (identifier, attempts, first_attempt_at, locked_until, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(identifier) DO UPDATE SET
       attempts = excluded.attempts,
       first_attempt_at = excluded.first_attempt_at,
       locked_until = excluded.locked_until,
       updated_at = excluded.updated_at`,
  )
    .bind(identifier, attempts, firstAttemptAt, lockedUntil, new Date().toISOString())
    .run()
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=')
    if (rawName === name) {
      return rawValue.join('=')
    }
  }

  return null
}

function buildUser(username: string): User {
  return {
    email: username,
    subject: `admin:${username}`,
    name: username,
    displayName: username,
  }
}

function getSessionExpiresAt() {
  return nowSeconds() + SESSION_TTL_SECONDS
}

function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === 'https:'
}

export async function createSessionCookie(env: Env, username: string, request: Request) {
  const payload = toBase64Url(JSON.stringify({ username, exp: getSessionExpiresAt(), iat: nowSeconds() } satisfies SessionPayload))
  const signature = await signSessionPayload(payload, getRequiredEnv(env, 'SESSION_SECRET'))
  const secure = isSecureRequest(request) ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`
}

export function clearSessionCookie(request: Request) {
  const secure = isSecureRequest(request) ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

export async function verifyAdminCredentials(env: Env, username: string, password: string) {
  const expectedUsername = getRequiredEnv(env, 'ADMIN_USERNAME')
  const expectedPassword = getRequiredEnv(env, 'ADMIN_PASSWORD')
  return username === expectedUsername && password === expectedPassword
}

export async function getSessionUser(request: Request, env: Env): Promise<User | null> {
  const cookie = getCookieValue(request, SESSION_COOKIE_NAME)
  if (!cookie) return null

  const [payloadBase64, signature] = cookie.split('.')
  if (!payloadBase64 || !signature) return null

  const expectedSignature = await signSessionPayload(payloadBase64, getRequiredEnv(env, 'SESSION_SECRET'))
  if (!constantTimeEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadBase64))) as Partial<SessionPayload>
    if (typeof payload.username !== 'string' || typeof payload.exp !== 'number' || typeof payload.iat !== 'number') {
      return null
    }
    if (payload.exp <= nowSeconds() || payload.iat < getSessionNotBefore(env)) {
      return null
    }
    return buildUser(payload.username)
  } catch {
    return null
  }
}

export async function requireUser(request: Request, env: Env): Promise<User> {
  const user = await getSessionUser(request, env)
  if (!user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid admin session')
  }
  return user
}

export function unauthorizedHtml(appName = 'StartNest') {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
    <style>
      body { margin:0; font-family: Inter, system-ui, sans-serif; background:#020617; color:#f8fafc; display:grid; min-height:100vh; place-items:center; padding:24px; }
      .card { width:min(100%, 420px); background:rgba(15,23,42,.78); border:1px solid rgba(148,163,184,.18); border-radius:24px; padding:28px; box-shadow:0 20px 60px rgba(0,0,0,.35); }
      .eyebrow { color:#94a3b8; font-size:12px; letter-spacing:.2em; text-transform:uppercase; }
      h1 { margin:10px 0 8px; font-size:28px; }
      p { margin:0; color:#cbd5e1; line-height:1.7; }
      code { color:#f8fafc; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="eyebrow">Private navigation</div>
      <h1>需要先登录管理员账户</h1>
      <p>当前请求没有携带有效的后台会话。请先调用 <code>/api/login</code> 完成登录，再访问业务页面或 API。</p>
    </div>
  </body>
</html>`
}

