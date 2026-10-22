import { describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { collectNavigationEntries, findNavigationRoot, searchNavigationEntries } from './navigation'

const routes: RouteRecordRaw[] = [
  {
    path: '/budget',
    meta: { title: '预算管理' },
    children: [
      { path: '/budget/list', meta: { title: '预算编制' }, component: {} },
      { path: '/budget/report', meta: { title: '执行报表', isUnavailable: true }, component: {} },
      { path: '/budget/hidden', meta: { title: '内部页', isNavigationMenu: false }, component: {} },
      { path: '/webview/1', meta: { title: '外部平台', isNewPage: true, url: 'https://example.com', icon: 'icon-earth' }, component: {} }
    ]
  }
]

describe('navigation directory', () => {
  it('resolves the owning module from the tree for absolute child paths', () => {
    expect(findNavigationRoot(routes, '/webview/1')).toBe(routes[0])
    expect(findNavigationRoot(routes, '/budget')).toBe(routes[0])
    expect(findNavigationRoot(routes, '/home')).toBeUndefined()
  })
  it('respects hidden and unavailable menus and preserves external targets', () => {
    const entries = collectNavigationEntries(routes)
    expect(entries.map((entry) => entry.path)).toEqual(['/budget/list', '/webview/1'])
    expect(entries[1]).toMatchObject({ group: '预算管理', external: true, href: 'https://example.com', icon: 'icon-earth' })
  })
  it('does not expose descendants of a hidden group', () => {
    expect(collectNavigationEntries([{ ...routes[0], meta: { isNavigationMenu: false } }])).toEqual([])
  })
  it('matches all search terms across name, group and path', () => {
    const entries = collectNavigationEntries(routes)
    expect(searchNavigationEntries(entries, '  预算  LIST ')).toHaveLength(1)
    expect(searchNavigationEntries(entries, '报表')).toEqual([])
    expect(searchNavigationEntries(entries, '', '其他分组')).toEqual([])
    expect(searchNavigationEntries(entries, '', '预算管理')).toHaveLength(2)
  })
})
