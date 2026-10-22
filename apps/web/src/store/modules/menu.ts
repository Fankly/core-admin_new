import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import type { IServerMenus } from '@/types/interface'
import type { MenuMeta, UserProfile } from '@/types/domain'
import baseService from '@/service/baseService'
import { getSysRouteMap } from '@/router/view-registry'
import { mergeServerRoute } from '@/utils/router'
import { collectNavigationEntries } from '@/router/navigation'
import { useSessionStore } from './session'

/**
 * 菜单与动态路由域。
 *
 * 服务端菜单是唯一的路由来源：init() 拉菜单 + 用户信息，合并成本地路由表。
 * 与 session 拆开后，重新登录/退出不会把路由表和用户信息绑在一起清空。
 */
export const useMenuStore = defineStore('menu', () => {
  const menus = ref<IServerMenus[]>([])
  const routes = ref<RouteRecordRaw[]>([])
  const routeToMeta = ref<Record<string, MenuMeta>>({})
  const menuMsg = ref<MenuMeta>({})

  const isLoaded = computed(() => routes.value.length > 0)
  const navigationEntries = computed(() => collectNavigationEntries(routes.value))

  let pending: Promise<RouteRecordRaw[]> | null = null
  let generation = 0

  async function init(): Promise<RouteRecordRaw[]> {
    if (isLoaded.value) return routes.value
    if (pending) return pending
    const currentGeneration = generation
    const operation = (async () => {
      const session = useSessionStore()
      const [menuResponse, userResponse] = await Promise.all([
        baseService.get<IServerMenus[]>('/sys/menu/nav'),
        baseService.get<Partial<UserProfile>>('/sys/getUserInfo')
      ])

      if (currentGeneration !== generation) throw new Error('工作区已重置，请重新载入')

      if (menuResponse.code !== 0) throw new Error(menuResponse.msg || '菜单加载失败')
      if (!Array.isArray(menuResponse.data)) throw new Error('菜单数据格式异常')

      if (userResponse.code !== 0) console.error('初始化用户数据错误', userResponse.msg)
      session.setUser(userResponse.data)
      session.markLogin(true)

      const serverMenus = menuResponse.data
      const [serverRoutes, routeMeta] = mergeServerRoute(serverMenus, getSysRouteMap())
      menus.value = serverMenus
      routes.value = serverRoutes
      routeToMeta.value = routeMeta
      return serverRoutes
    })()
    pending = operation

    try {
      return await operation
    } finally {
      if (pending === operation) pending = null
    }
  }

  /** 合并基础路由的 meta（基础路由不来自服务端）。 */
  function mergeMeta(payload: Record<string, MenuMeta>) {
    routeToMeta.value = { ...routeToMeta.value, ...payload }
  }

  function setRoutes(payload: RouteRecordRaw[]) {
    routes.value = payload
  }

  function setMenuMessage(payload: MenuMeta) {
    menuMsg.value = payload
  }

  /** 路由切换时同步当前菜单信息，供权限/帮助等模块读取。 */
  function syncMenuMessage(to: { path: string; meta: MenuMeta }) {
    const source = typeof to.meta.url === 'string' && to.meta.url ? to.meta.url : to.path
    menuMsg.value = { ...routeToMeta.value[source], ...to.meta, url: source }
  }

  function reset() {
    generation += 1
    menus.value = []
    routes.value = []
    routeToMeta.value = {}
    menuMsg.value = {}
    pending = null
  }

  return {
    menus,
    routes,
    routeToMeta,
    menuMsg,
    isLoaded,
    navigationEntries,
    init,
    mergeMeta,
    setRoutes,
    setMenuMessage,
    syncMenuMessage,
    reset
  }
})
