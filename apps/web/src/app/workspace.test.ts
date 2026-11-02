// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { getCurrentUser, getNavigationMenus } from '@/api/system/session'
import baseRoutes from '@/router/base'
import { registerDynamicRoute } from '@/router/dynamic'
import { useMenuStore, useSessionStore } from '@/store'
import { createWorkspace } from './workspace'

vi.mock('@/api/system/session', () => ({ getCurrentUser: vi.fn(), getNavigationMenus: vi.fn() }))

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function setup(loadPlugins = vi.fn(() => Promise.resolve())) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: baseRoutes })
  const workspace = createWorkspace(router, pinia, loadPlugins)
  return { router, workspace, menu: useMenuStore(pinia), session: useSessionStore(pinia), loadPlugins }
}

beforeEach(() => {
  vi.mocked(getNavigationMenus).mockReset().mockResolvedValue({ code: 0, success: true, msg: '', data: [] })
  vi.mocked(getCurrentUser)
    .mockReset()
    .mockResolvedValue({ code: 0, success: true, msg: '', data: { id: 'user-1', name: '测试用户' } })
})

describe('workspace lifecycle', () => {
  it('initializes an empty menu once and shares concurrent bootstrap work', async () => {
    const { router, workspace, menu, loadPlugins } = setup()
    const target = router.resolve('/home')
    const first = workspace.initialize(target)
    expect(workspace.initialize(target)).toBe(first)
    await first
    await workspace.initialize(target)
    await menu.init()
    expect(workspace.isReady).toBe(true)
    expect(menu.isLoaded).toBe(true)
    expect(menu.routes).toEqual([])
    expect(getNavigationMenus).toHaveBeenCalledOnce()
    expect(loadPlugins).toHaveBeenCalledOnce()
  })

  it('removes deep links and fallback routes and restores static routes on logout', async () => {
    const { router, workspace, menu, session } = setup()
    const staticCount = router.getRoutes().length
    await workspace.initialize(router.resolve('/home'))
    registerDynamicRoute(router, { path: '/temporary-detail' })
    expect(router.hasRoute('/temporary-detail')).toBe(true)
    expect(router.getRoutes().length).toBeGreaterThan(staticCount)
    workspace.reset()
    expect(router.getRoutes()).toHaveLength(staticCount)
    expect(router.hasRoute('/temporary-detail')).toBe(false)
    expect(router.hasRoute('/home')).toBe(true)
    expect(router.resolve('/login').matched).toHaveLength(1)
    expect(menu.isLoaded).toBe(false)
    expect(session.isLogin).toBe(false)
    expect(workspace.isReady).toBe(false)
  })

  it('keeps every deep link requested during one shared initialization', async () => {
    const { router, workspace } = setup()
    const first = workspace.initialize({ path: '/first-detail', matched: [] })
    const second = workspace.initialize({ path: '/second-detail', matched: [] })
    expect(first).toBe(second)
    await first
    expect(router.hasRoute('/first-detail')).toBe(true)
    expect(router.hasRoute('/second-detail')).toBe(true)
  })

  it('preserves server menu metadata when the first navigation is a deep link', async () => {
    const { router, workspace, menu } = setup()
    vi.spyOn(menu, 'init').mockResolvedValue([
      {
        path: '/menu-detail',
        name: '/menu-detail',
        component: { template: '<div />' },
        meta: { id: 'menu-id', title: '服务端详情', keepAlive: false }
      }
    ])
    await workspace.initialize({ path: '/menu-detail', matched: [] })
    expect(router.resolve('/menu-detail').meta).toMatchObject({ id: 'menu-id', title: '服务端详情', keepAlive: false })
  })

  it('discards a plugin completion from a previous session without clearing the new session', async () => {
    const plugins = deferred()
    const loadPlugins = vi.fn(() => Promise.resolve()).mockImplementationOnce(() => plugins.promise)
    const { router, workspace, menu, session } = setup(loadPlugins)
    const old = workspace.initialize(router.resolve('/home'))
    const rejected = expect(old).rejects.toMatchObject({ name: 'AbortError' })
    await menu.init()
    workspace.reset()
    vi.mocked(getCurrentUser).mockResolvedValue({ code: 0, success: true, msg: '', data: { id: 'user-2' } })
    await workspace.initialize(router.resolve('/home'))
    plugins.resolve()
    await rejected
    expect(session.user.id).toBe('user-2')
    expect(workspace.isReady).toBe(true)
    expect(menu.isLoaded).toBe(true)
  })

  it('ignores menu responses received after reset', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof getNavigationMenus>>) => void
    vi.mocked(getNavigationMenus).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { router, workspace, menu, session } = setup()
    const pending = workspace.initialize(router.resolve('/home'))
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    workspace.reset()
    resolve({ code: 0, success: true, msg: '', data: [] })
    await rejected
    expect(menu.isLoaded).toBe(false)
    expect(session.isLogin).toBe(false)
    expect(workspace.isReady).toBe(false)
  })

  it('rolls back failed initialization and retries both menus and plugins', async () => {
    const loadPlugins = vi.fn(() => Promise.resolve()).mockRejectedValueOnce(new Error('插件下载失败'))
    const { router, workspace, menu } = setup(loadPlugins)
    await expect(workspace.initialize(router.resolve('/home'))).rejects.toThrow('插件下载失败')
    expect(menu.isLoaded).toBe(false)
    expect(workspace.isReady).toBe(false)
    expect(router.hasRoute('/home')).toBe(true)
    await workspace.initialize(router.resolve('/home'))
    expect(workspace.isReady).toBe(true)
    expect(getNavigationMenus).toHaveBeenCalledTimes(2)
    expect(loadPlugins).toHaveBeenCalledTimes(2)
  })
})
