// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { IServerMenus } from '@/types/interface'
import { mergeServerRoute, registerToRouter, toValidRoutes } from './router'

const RouteStub = defineComponent({ name: 'RouteStub', render: () => null })
const serverMenu = (payload: Pick<IServerMenus, 'id' | 'name' | 'url'> & Partial<IServerMenus>): IServerMenus => ({
  createDate: '',
  icon: false,
  parentName: '',
  permissions: '',
  pid: '',
  sort: 0,
  type: 0,
  openStyle: 0,
  isFrame: '',
  outsideMenu: '',
  isNavigationMenu: true,
  isShow: 1,
  ...payload
})

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

describe('navigation availability', () => {
  it('keeps registered views and iframes, prunes unreachable groups and moves 系统管理 out of the navigation', () => {
    const [routes] = mergeServerRoute(
      [
        serverMenu({ id: '1', name: '已接入', url: '/available' }),
        serverMenu({ id: '2', name: '未接入', url: '/missing' }),
        serverMenu({ id: '3', name: '外部页面', url: 'https://example.com' }),
        serverMenu({ id: '4', name: '空分组', url: '/empty', children: [serverMenu({ id: '5', name: '缺少视图', url: '/empty/missing' })] }),
        serverMenu({
          id: '6',
          name: '系统管理',
          url: '/system',
          children: [serverMenu({ id: '7', name: '用户管理', url: 'https://example.com/system' })]
        })
      ],
      { '/src/views/available.vue': () => Promise.resolve(RouteStub) }
    )
    expect(routes[1].meta?.isUnavailable).toBe(true)
    expect(toValidRoutes(routes).map((route) => route.path)).toEqual(['/available', '/iframe/3'])
  })
})
