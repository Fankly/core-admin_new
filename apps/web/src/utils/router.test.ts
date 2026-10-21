// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { registerToRouter } from './router'

const RouteStub = defineComponent({ name: 'RouteStub', render: () => null })

describe('registerToRouter', () => {
  it('registers the top-level tree once so child routes keep their parent', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    registerToRouter(router, [
      {
        path: '/system',
        name: '/system',
        component: RouteStub,
        children: [
          {
            path: '/system/user',
            name: '/system/user',
            component: RouteStub
          }
        ]
      }
    ])

    await router.push('/system/user')

    expect(router.currentRoute.value.matched.map((record) => record.path)).toEqual(['/system', '/system/user'])
  })
})
