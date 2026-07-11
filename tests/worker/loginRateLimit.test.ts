import { describe, expect, it } from 'vitest'
import { ApiError, assertLoginAllowed, recordLoginResult } from '../../worker/auth/access'
import { createTestEnv } from './testDb'

describe('login rate limiting', () => {
  it('locks an identifier after five failed login attempts', async () => {
    const { env } = createTestEnv()
    const request = new Request('https://startnest.test/api/login', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '203.0.113.10' },
    })

    for (let index = 0; index < 5; index += 1) {
      await recordLoginResult(request, env, 'Admin', false)
    }

    await expect(assertLoginAllowed(request, env, 'admin')).rejects.toMatchObject<ApiError>({
      status: 429,
      code: 'LOGIN_RATE_LIMITED',
    })
  })

  it('clears failed login attempts after a successful login', async () => {
    const { env, state } = createTestEnv()
    const request = new Request('https://startnest.test/api/login', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '203.0.113.10' },
    })

    await recordLoginResult(request, env, 'admin', false)
    expect(Object.keys(state.loginAttempts)).toHaveLength(1)

    await recordLoginResult(request, env, 'admin', true)

    expect(Object.keys(state.loginAttempts)).toHaveLength(0)
    await expect(assertLoginAllowed(request, env, 'admin')).resolves.toBeUndefined()
  })
})
