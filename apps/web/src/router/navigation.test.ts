import { describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { collectNavigationEntries, findNavigationRoot, resolveBreadcrumb, searchNavigationEntries } from './navigation'

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
  it('resolves the breadcrumb trail with reachable siblings at every level', () => {
    const tree: RouteRecordRaw[] = [
      {
        path: '/platform',
        meta: { title: '业务平台' },
        children: [
          {
            path: '/platform/pm',
            meta: { title: '项目管理' },
            children: [
              { path: '/iframe/plan', meta: { title: '计划编制' }, component: {} },
              { path: '/iframe/draft', meta: { title: '草稿', isNavigationMenu: false }, component: {} }
            ]
          },
          {
            path: '/platform/empty',
            meta: { title: '空分组' },
            children: [{ path: '/platform/empty/x', meta: { title: '缺视图', isUnavailable: true }, component: {} }]
          },
          { path: '/webview/9', meta: { title: '外部平台', isNewPage: true, url: 'https://example.com' }, component: {} }
        ]
      }
    ]
    const trail = resolveBreadcrumb(tree, '/iframe/plan')
    expect(trail?.ancestors.map((node) => [node.title, node.level])).toEqual([
      ['业务平台', 1],
      ['项目管理', 2]
    ])
    expect(trail?.current).toMatchObject({ title: '计划编制', level: 3 })
    // 空分组与隐藏、无视图的入口不出现在下拉里；外链保留真实地址
    expect(trail?.ancestors[0].children.map((node) => node.title)).toEqual(['项目管理', '外部平台'])
    expect(trail?.ancestors[0].children[1]).toMatchObject({ external: true, href: 'https://example.com' })
    expect(trail?.ancestors[1].children.map((node) => node.path)).toEqual(['/iframe/plan'])
  })
  it('keeps the real position of hidden pages and ignores routes outside the menu', () => {
    expect(resolveBreadcrumb(routes, '/budget/hidden')?.ancestors.map((node) => node.title)).toEqual(['预算管理'])
    expect(resolveBreadcrumb(routes, '/budget')?.ancestors).toEqual([])
    expect(resolveBreadcrumb(routes, '/home')).toBeNull()
  })
  it('matches all search terms across name, group and path', () => {
    const entries = collectNavigationEntries(routes)
    expect(searchNavigationEntries(entries, '  预算  LIST ')).toHaveLength(1)
    expect(searchNavigationEntries(entries, '报表')).toEqual([])
    expect(searchNavigationEntries(entries, '', '其他分组')).toEqual([])
    expect(searchNavigationEntries(entries, '', '预算管理')).toHaveLength(2)
  })
})
