import { describe, expect, it } from 'vitest'
import { reorderEntities } from '../../worker/routes/reorder'
import { createTestEnv, testUser } from './testDb'

describe('reorder route', () => {
  it('updates group order and moves links to their target groups', async () => {
    const { env, state } = createTestEnv({
      groups: [
        { id: 'g1', name: 'One', icon: null, sort_order: 0, created_at: 'a', updated_at: 'a' },
        { id: 'g2', name: 'Two', icon: null, sort_order: 1, created_at: 'b', updated_at: 'b' },
      ],
      links: [
        {
          id: 'l1',
          group_id: 'g1',
          title: 'One',
          url: 'https://one.example',
          icon: null,
          icon_mode: 'favicon',
          icon_image_url: null,
          icon_text: null,
          description: null,
          tile_size: '1x3',
          open_mode: 'global',
          background_color: null,
          sort_order: 0,
          created_at: 'a',
          updated_at: 'a',
        },
      ],
    })
    const request = new Request('https://startnest.test/api/reorder', {
      method: 'POST',
      body: JSON.stringify({
        groups: [{ id: 'g2', sortOrder: 0 }, { id: 'g1', sortOrder: 1 }],
        links: [{ id: 'l1', groupId: 'g2', sortOrder: 0 }],
      }),
    })

    const response = await reorderEntities(request, env, testUser)
    const body = await response.json() as any

    expect(response.status).toBe(200)
    expect(state.groups.g2.sort_order).toBe(0)
    expect(state.groups.g1.sort_order).toBe(1)
    expect(state.links.l1.group_id).toBe('g2')
    expect(body.data.groups.map((group: any) => group.id)).toEqual(['g2', 'g1'])
  })
})
