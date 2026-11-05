import { computed, inject, InjectionKey, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { IObject } from '@/types/interface'
import { getFavoriteMenuList, IMenuFavorite, toggleMenuFavorite } from '@/api/menu/menuFavorite'

// 多个导航实例（桌面、移动端、顶部）共享同一份服务端收藏数据，按账号隔离
const favoritesByUser = ref<Record<string, IMenuFavorite[]>>({})
// 已拉取过收藏列表的账号，避免多个导航实例重复请求
const loadedUsers = new Set<string>()
// 切换请求进行中的菜单，同一菜单防重复点击（不可变更新以保证响应式）
const pendingMenuIds = ref<Record<string, boolean>>({})
// 列表请求状态：首页快捷入口等处需要展示加载中 / 失败重试
const loadPending = ref(false)
const loadFailed = ref(false)

// 会话内的星标切换结果：menuId → 是否收藏。
// 「是否收藏」的初始值以 /sys/menu/nav 下发的 isFavorite 为准（服务端权威），
// 这里只保存本次会话与初始值不同的项；刷新页面后由 nav 重新下发。
const overrides = ref<Record<string, boolean>>({})

// 兜底容错：服务端字段可能缺省，统一转成字符串
const normalizeFavorite = (item: IObject): IMenuFavorite => ({
  favoriteId: String(item.favoriteId ?? ''),
  menuId: String(item.menuId ?? ''),
  name: String(item.name ?? ''),
  sort: Number(item.sort ?? 0),
  url: String(item.url ?? ''),
  createTime: String(item.createTime ?? '')
})

export const useMenuFavorites = () => {
  const store = useStore()
  const userId = computed(() => String(store.state.user?.id ?? ''))
  const favorites = computed(() => favoritesByUser.value[userId.value] || [])
  const canFavorite = computed(() => !!userId.value)

  // 拉取收藏列表；force 用于切换收藏后强制取服务端权威数据
  const reload = (force = false): Promise<void> => {
    const id = userId.value
    if (!id || (!force && loadedUsers.has(id))) return Promise.resolve()
    loadedUsers.add(id)
    loadPending.value = true
    return getFavoriteMenuList()
      .then((res) => {
        if (res.code !== 0) throw new Error(res.msg)
        loadFailed.value = false
        const list = Array.isArray(res.data) ? res.data : []
        favoritesByUser.value = { ...favoritesByUser.value, [id]: list.map((x: IObject) => normalizeFavorite(x)) }
      })
      .catch(() => {
        // 拉取失败允许下次重新尝试
        loadFailed.value = true
        loadedUsers.delete(id)
      })
      .finally(() => {
        loadPending.value = false
      })
  }

  watch(userId, () => reload(), { immediate: true })

  // 星标状态：优先取会话内的切换结果，否则用菜单数据的初始值（nav.isFavorite）
  const isFavorite = (menuId: string, initial: boolean) => {
    const id = String(menuId || '')
    if (!id) return false
    return overrides.value[id] ?? !!initial
  }
  const isPending = (menuId: string) => !!pendingMenuIds.value[String(menuId || '')]

  // 本地先行翻转星标，请求失败回滚；成功后以服务端返回为准，并刷新收藏列表供其他消费方同步
  const toggleFavorite = async (menuId: string, initial: boolean): Promise<boolean> => {
    const id = String(menuId || '')
    if (!canFavorite.value || !id || isPending(id)) return false
    const current = isFavorite(id, initial)
    pendingMenuIds.value = { ...pendingMenuIds.value, [id]: true }
    overrides.value = { ...overrides.value, [id]: !current }
    try {
      const res = await toggleMenuFavorite(id)
      if (res.code !== 0) {
        overrides.value = { ...overrides.value, [id]: current }
        return false
      }
      if (typeof res.data === 'boolean') {
        overrides.value = { ...overrides.value, [id]: res.data }
      }
      reload(true)
      return true
    } catch {
      overrides.value = { ...overrides.value, [id]: current }
      return false
    } finally {
      const next = { ...pendingMenuIds.value }
      delete next[id]
      pendingMenuIds.value = next
    }
  }

  return { canFavorite, isFavorite, isPending, toggleFavorite, reload, favorites, loadPending, loadFailed }
}

export type MenuFavorites = ReturnType<typeof useMenuFavorites>

/**
 * 必须用 Symbol.for：HMR 或模块被重复求值时本文件会重新执行，
 * Symbol() 每次都会产生新值，导致 provide 与 inject 拿到不同的 key
 * （菜单收藏按钮 inject 到 undefined，渲染时读 isFavorite 报错）。
 * Symbol.for 从全局注册表取值，重复加载也始终是同一个 key。
 */
export const MenuFavoritesKey = Symbol.for('core-admin:menu-favorites') as InjectionKey<MenuFavorites>

// 没有上层提供者时的兜底实例；状态本身是模块级共享的，语义与 provide 的实例一致
let fallbackFavorites: MenuFavorites | null = null

/**
 * 取菜单收藏上下文：优先使用上层 provide 的实例；
 * 组件不在提供范围内时退回共享实例，避免 inject 得到 undefined 后在渲染期崩溃。
 */
export const useMenuFavoritesContext = (): MenuFavorites => {
  const injected = inject(MenuFavoritesKey)
  if (injected) return injected
  if (!fallbackFavorites) fallbackFavorites = useMenuFavorites()
  return fallbackFavorites
}
