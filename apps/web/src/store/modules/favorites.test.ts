import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSessionStore } from './session'
import { useFavoritesStore } from './favorites'

const api = vi.hoisted(() => ({ list: vi.fn(), toggle: vi.fn() }))

vi.mock('@/api/menu/favorite', () => ({
  getFavoriteMenuList: api.list,
  toggleMenuFavorite: api.toggle
}))

const favorite = {
  favoriteId: 'fav-1',
  menuId: 'embed',
  name: '项目查询',
  sort: 1,
  url: 'https://example.com/project',
  createTime: ''
}

const response = <T>(data: T) => ({ code: 0, success: true, msg: '', data })

describe('favorites store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useSessionStore().setUser({ id: 'user-1' })
    api.list.mockResolvedValue(response([favorite]))
    api.toggle.mockResolvedValue(response(true))
  })

  it('loads favorites for the current account and toggles against the server list', async () => {
    api.list.mockResolvedValue(response([]))
    const favorites = useFavoritesStore()
    await vi.waitFor(() => {
      expect(api.list).toHaveBeenCalledTimes(1)
    })
    expect(favorites.favorites).toEqual([])
    expect(favorites.isFavorite('embed', false)).toBe(false)

    api.list.mockResolvedValue(response([favorite]))
    await expect(favorites.toggleFavorite('embed', false)).resolves.toBe(true)
    expect(api.toggle).toHaveBeenCalledWith('embed')
    // 切换成功后以服务端返回的列表为准，快捷入口与星标都拿到最新状态
    expect(favorites.favorites).toHaveLength(1)
    expect(favorites.isFavorite('embed', false)).toBe(true)
    expect(api.list).toHaveBeenCalledTimes(2)
  })

  it('treats the server list as the source of truth once it is loaded', async () => {
    const favorites = useFavoritesStore()
    // 列表返回前，星标以菜单下发的 isFavorite 为准
    expect(favorites.isFavorite('embed', true)).toBe(true)
    await vi.waitFor(() => {
      expect(api.list).toHaveBeenCalledTimes(1)
    })
    // 列表返回后，即使导航没有下发 isFavorite，收藏集合中的菜单也应为已收藏
    expect(favorites.isFavorite('embed', false)).toBe(true)
    expect(favorites.isFavorite('other', false)).toBe(false)
  })

  it('rolls back the optimistic star when the request fails', async () => {
    api.list.mockResolvedValue(response([]))
    api.toggle.mockRejectedValue(new Error('network'))
    const favorites = useFavoritesStore()
    await vi.waitFor(() => {
      expect(api.list).toHaveBeenCalledTimes(1)
    })
    expect(favorites.isFavorite('embed', false)).toBe(false)

    await expect(favorites.toggleFavorite('embed', false)).resolves.toBe(false)
    expect(favorites.isFavorite('embed', false)).toBe(false)
    expect(favorites.isPending('embed')).toBe(false)
  })

  it('does not fetch without an authenticated user and reports load failures', async () => {
    setActivePinia(createPinia())
    const anonymous = useFavoritesStore()
    expect(api.list).not.toHaveBeenCalled()
    await anonymous.reload(true)
    expect(api.list).not.toHaveBeenCalled()
    expect(anonymous.canFavorite).toBe(false)

    setActivePinia(createPinia())
    useSessionStore().setUser({ id: 'user-2' })
    api.list.mockResolvedValue({ code: 500, success: false, msg: '失败', data: null })
    const failing = useFavoritesStore()
    await vi.waitFor(() => {
      expect(failing.loadFailed).toBe(true)
    })
    expect(failing.loadPending).toBe(false)
  })
})
