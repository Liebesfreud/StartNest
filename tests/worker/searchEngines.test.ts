import { describe, expect, it } from 'vitest'
import { ApiError } from '../../worker/auth/access'
import { createCustomSearchEngine, removeCustomSearchEngine } from '../../worker/routes/searchEngines'
import { createTestEnv, testUser } from './testDb'

describe('search engine routes', () => {
  it('rejects URL templates that do not include a query placeholder', async () => {
    const { env } = createTestEnv()
    const request = new Request('https://startnest.test/api/search-engines', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bad', urlTemplate: 'https://example.com/search?q=startnest' }),
    })

    await expect(createCustomSearchEngine(request, env)).rejects.toMatchObject<ApiError>({
      status: 400,
      code: 'INVALID_SEARCH_ENGINE',
    })
  })

  it('resets settings to Bing when deleting the selected custom search engine', async () => {
    const { env, state } = createTestEnv({
      settings: { search_engine: 'custom:se_1' },
      searchEngines: [
        {
          id: 'se_1',
          name: 'Docs',
          url_template: 'https://docs.example.com?q={query}',
          icon: null,
          sort_order: 0,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    })

    const response = await removeCustomSearchEngine(env, testUser, 'se_1')
    const body = await response.json() as any

    expect(response.status).toBe(200)
    expect(state.searchEngines.se_1).toBeUndefined()
    expect(state.settings['1'].search_engine).toBe('bing')
    expect(body.data.settings.searchEngine).toBe('bing')
  })
})
