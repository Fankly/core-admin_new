import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTabsStore } from './tabs'

describe('tabs store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with the affix tabs and does not duplicate them', () => {
    const tabs = useTabsStore()
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home'])
    expect(tabs.activePath).toBe('/home')

    tabs.openTab({ path: '/home', title: '主页' })
    expect(tabs.tabs).toHaveLength(1)
  })

  it('opens, activates and deduplicates by full path', () => {
    const tabs = useTabsStore()
    tabs.openTab({ path: '/order/list?page=2', title: '订单列表', meta: { id: 'order' } })
    tabs.openTab({ path: '/order/list?page=2', title: '订单列表（新）' })

    expect(tabs.tabs).toHaveLength(2)
    expect(tabs.activePath).toBe('/order/list?page=2')
    expect(tabs.tabs[1].title).toBe('订单列表（新）')
    expect(tabs.cachedViews).toContain('/order/list?page=2')
  })

  it('keeps affix tabs when closing, closing others and closing all', () => {
    const tabs = useTabsStore()
    tabs.openTab({ path: '/a', title: 'A' })
    tabs.openTab({ path: '/b', title: 'B' })
    tabs.openTab({ path: '/c', title: 'C' })

    expect(tabs.closeTab('/home')).toBeUndefined()
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home', '/a', '/b', '/c'])

    tabs.closeOthers()
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home', '/c'])
    expect(tabs.cachedViews).not.toContain('/a')
    expect(tabs.cachedViews).not.toContain('/b')

    tabs.closeAll()
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home'])
    expect(tabs.activePath).toBe('/home')
  })

  it('selects a neighbour when the active tab closes', () => {
    const tabs = useTabsStore()
    tabs.openTab({ path: '/a', title: 'A' })
    tabs.openTab({ path: '/b', title: 'B' })
    tabs.openTab({ path: '/c', title: 'C' })

    tabs.activate('/b')
    expect(tabs.closeTab('/b')).toBe('/c')
    expect(tabs.activePath).toBe('/c')
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home', '/a', '/c'])
  })

  it('closes tabs to the left and right of the active one while preserving affix tabs', () => {
    const tabs = useTabsStore()
    ;['/a', '/b', '/c', '/d'].forEach((path) => {
      tabs.openTab({ path, title: path })
    })
    tabs.activate('/c')

    tabs.closeLeft()
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home', '/c', '/d'])
    expect(tabs.cachedViews).not.toContain('/a')
    expect(tabs.cachedViews).not.toContain('/b')
    expect(tabs.closedPaths).toEqual(expect.arrayContaining(['/a', '/b']))

    tabs.closeRight()
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home', '/c'])
    expect(tabs.cachedViews).not.toContain('/d')
    expect(tabs.closedPaths).toContain('/d')
  })

  it('counts what each bulk close would remove, skipping affix tabs', () => {
    const tabs = useTabsStore()
    expect(tabs.closableCounts).toEqual({ left: 0, right: 0, others: 0, all: 0 })

    ;['/a', '/b', '/c', '/d'].forEach((path) => {
      tabs.openTab({ path, title: path })
    })
    tabs.activate('/c')
    expect(tabs.closableCounts).toEqual({ left: 2, right: 1, others: 3, all: 4 })

    tabs.activate('/home')
    expect(tabs.closableCounts).toEqual({ left: 0, right: 4, others: 4, all: 4 })

    tabs.activate('/c')
    tabs.closeLeft()
    tabs.closeRight()
    expect(tabs.closableCounts).toEqual({ left: 0, right: 0, others: 0, all: 1 })
  })

  it('honours keepAlive=false and ignores error routes', () => {
    const tabs = useTabsStore()
    tabs.openTab({ path: '/no-cache', title: 'No cache', keepAlive: false })
    tabs.openTab({ path: '/error?to=404', title: '404' })

    expect(tabs.cachedViews).not.toContain('/no-cache')
    expect(tabs.tabs.some((tab) => tab.path.includes('/error'))).toBe(false)
  })
})
