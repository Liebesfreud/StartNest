import { describe, expect, it } from 'vitest'
import { ApiError } from '../../worker/auth/access'
import { exportData, importData } from '../../worker/routes/importExport'
import { createTestEnv, testUser } from './testDb'

describe('import/export routes', () => {
  it('rejects imports when a link references a missing group', async () => {
    const { env } = createTestEnv()
    const request = new Request('https://startnest.test/api/import', {
      method: 'POST',
      body: JSON.stringify({
        groups: [],
        links: [
          {
            id: 'l1',
            groupId: 'missing',
            title: 'Broken',
            url: 'https://broken.example',
            sortOrder: 0,
          },
        ],
        settings: {
          themeMode: 'system',
          cardDensity: 'comfortable',
          openInNewTab: true,
          showGroupIcons: true,
        },
      }),
    })

    await expect(importData(request, env, testUser)).rejects.toMatchObject<ApiError>({
      status: 400,
      code: 'INVALID_IMPORT',
      message: 'Link references a missing group',
    })
  })

  it('rejects settings-only import selecting an unknown custom search engine', async () => {
    const { env } = createTestEnv()
    const request = new Request('https://startnest.test/api/import', {
      method: 'POST',
      body: JSON.stringify({
        settingsOnly: true,
        settings: { searchEngine: 'custom:missing' },
      }),
    })

    await expect(importData(request, env, testUser)).rejects.toMatchObject<ApiError>({
      status: 400,
      code: 'INVALID_SETTINGS',
    })
  })

  it('exports bootstrap data with search engines and panels', async () => {
    const { env } = createTestEnv({
      searchEngines: [
        {
          id: 'se_1',
          name: 'Docs',
          url_template: 'https://docs.example.com?q={query}',
          icon: 'book',
          sort_order: 0,
          created_at: 'a',
          updated_at: 'a',
        },
      ],
      webPanels: [
        {
          id: 'p1',
          title: 'Panel',
          url: 'https://panel.example',
          icon: null,
          description: null,
          open_mode: 'iframe',
          enabled: 1,
          sort_order: 0,
          created_at: 'a',
          updated_at: 'a',
        },
      ],
    })

    const response = await exportData(env, testUser)
    const body = await response.json() as any

    expect(response.status).toBe(200)
    expect(body.data.version).toBe('1')
    expect(body.data.searchEngines).toHaveLength(1)
    expect(body.data.panels).toHaveLength(1)
  })
})
