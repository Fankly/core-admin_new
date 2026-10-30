import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { getFavoriteMenuList, toggleMenuFavorite, type MenuFavorite } from '@/api/menu/favorite'
import { useSessionStore } from './session'

/**
 * 菜单收藏域。
 *
 * 收藏结果按账号隔离，导航星标与首页快捷入口共用同一份服务端数据。
 * 收藏列表加载完成后，「是否收藏」以该列表为准；列表尚未返回时才退回
 * /sys/menu/nav 下发的 isFavorite。会话内的切换记录在 overrides 里，
 * 操作失败时回滚，成功后重新拉取列表。
 */
export const useFavoritesStore = defineStore('favorites', () => {
  const session = useSessionStore()

  const favoritesByUser = ref<Record<string, MenuFavorite[]>>({})
  const loadedUsers = ref<Record<string, boolean>>({})
  const pendingMenuIds = ref<Record<string, boolean>>({})
  const overrides = ref<Record<string, boolean>>({})
  const loadPending = ref(false)
  const loadFailed = ref(false)
  let sessionVersion = 0
  let loadVersion = 0

  const userId = computed(() => session.user.id)
  const favorites = computed<MenuFavorite[]>(() => favoritesByUser.value[userId.value] ?? [])
  const favoriteIds = computed(() => new Set(favorites.value.map((item) => item.menuId)))
  const canFavorite = computed(() => Boolean(userId.value))
  // loadedUsers 是 Record，未加载时取到 undefined，用 !!
  const listLoaded = computed(() => loadedUsers.value[userId.value])

  /** 拉取收藏列表；force 用于切换收藏后强制取服务端权威数据。 */
  async function reload(force = false): Promise<void> {
    const id = userId.value
    if (!id) return
    if (!force && loadedUsers.value[id]) return
    const sessionId = sessionVersion
    const requestId = ++loadVersion
    const isCurrent = () => sessionId === sessionVersion && id === userId.value && requestId === loadVersion
    loadPending.value = true
    loadFailed.value = false
    try {
      const res = await getFavoriteMenuList()
      if (!isCurrent()) return
      if (!res.success) throw new Error(res.msg || '收藏菜单加载失败')
      favoritesByUser.value = {
        ...favoritesByUser.value,
        [id]: Array.isArray(res.data) ? res.data : []
      }
      // 只有拿到服务端列表才算已加载；失败时保持未加载，下次仍会重试
      loadedUsers.value = { ...loadedUsers.value, [id]: true }
      loadFailed.value = false
    } catch {
      if (isCurrent()) loadFailed.value = true
    } finally {
      if (isCurrent()) loadPending.value = false
    }
  }

  function isFavorite(menuId: string, initial: boolean): boolean {
    if (!menuId) return false
    if (Object.hasOwn(overrides.value, menuId)) return overrides.value[menuId]
    // 列表已加载时以服务端收藏集合为准，避免导航漏下发 isFavorite 时星标与快捷入口不一致
    return listLoaded.value ? favoriteIds.value.has(menuId) : initial
  }

  function isPending(menuId: string): boolean {
    return Object.hasOwn(pendingMenuIds.value, menuId)
  }

  /** 本地先行翻转星标，请求失败回滚；成功后刷新收藏列表供首页快捷入口同步。 */
  async function toggleFavorite(menuId: string, initial: boolean): Promise<boolean> {
    const id = menuId
    if (!id || !canFavorite.value || isPending(id)) return false

    const accountId = userId.value
    const sessionId = sessionVersion
    const isCurrent = () => sessionId === sessionVersion && accountId === userId.value
    const current = isFavorite(id, initial)
    pendingMenuIds.value = { ...pendingMenuIds.value, [id]: true }
    overrides.value = { ...overrides.value, [id]: !current }
    try {
      const res = await toggleMenuFavorite(id)
      if (!isCurrent()) return false
      if (!res.success) throw new Error(res.msg || '收藏操作失败')
      await reload(true)
      return isCurrent()
    } catch {
      if (isCurrent()) overrides.value = { ...overrides.value, [id]: current }
      return false
    } finally {
      if (isCurrent()) {
        const next = { ...pendingMenuIds.value }
        Reflect.deleteProperty(next, id)
        pendingMenuIds.value = next
      }
    }
  }

  // 切换账号后清空会话内的星标覆盖，并按新账号重新拉取收藏
  watch(
    userId,
    () => {
      sessionVersion += 1
      loadVersion += 1
      overrides.value = {}
      pendingMenuIds.value = {}
      loadPending.value = false
      loadFailed.value = false
      void reload(true)
    },
    { immediate: true, flush: 'sync' }
  )

  return {
    favoritesByUser,
    favorites,
    canFavorite,
    loadPending,
    loadFailed,
    reload,
    isFavorite,
    isPending,
    toggleFavorite
  }
})
