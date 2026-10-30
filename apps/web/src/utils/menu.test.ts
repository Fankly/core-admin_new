import { describe, expect, it } from 'vitest'
import type { RouteMeta, RouteRecordRaw } from 'vue-router'
import { buildSystemMenuItems, findSystemMenuRoutes } from './menu'

const route = (path: string, title: string, extra: Partial<RouteMeta> = {}, children?: RouteRecordRaw[]): RouteRecordRaw => ({
  path,
  component: {},
  meta: { title, ...extra },
  children
})

describe('system menu', () => {
  it('finds the group by server title at any depth', () => {
    const routes = [route('/platform', '业务平台', {}, [route('/platform/system', ' 系统管理 ', { id: 'sys' })])]
    expect(findSystemMenuRoutes(routes).map((item) => item.path)).toEqual(['/platform/system'])
  })

  it('builds dropdown items from the system group children and keeps their levels', () => {
    const routes = [
      route('/system', '系统管理', { id: 'sys' }, [
        route('/system/user', '用户管理', { id: 'user', url: 'https://example.com' }),
        route('/system/org', '组织架构', { id: 'org' }, [route('/system/org/dept', '部门管理', { id: 'dept', url: 'https://example.com' })]),
        route('/system/empty', '空分组', { id: 'empty' }, [route('/system/empty/hidden', '隐藏页', { isNavigationMenu: false })])
      ])
    ]

    const items = buildSystemMenuItems(routes)
    expect(items.map((item) => [item.title, item.level])).toEqual([
      ['用户管理', 2],
      ['组织架构', 2]
    ])
    expect(items[1].children[0]).toMatchObject({ title: '部门管理', level: 3, path: '/system/org/dept', url: 'https://example.com' })
  })

  it('returns the system group itself when it has no clickable children', () => {
    const routes = [route('/system', '系统管理', { id: 'sys', url: 'https://example.com/system' })]
    expect(buildSystemMenuItems(routes)).toMatchObject([{ title: '系统管理', url: 'https://example.com/system', level: 1 }])
  })
})
