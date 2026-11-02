import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import type { WorkspaceController, WorkspaceTarget } from '@/router/workspace'
import baseRoutes from '@/router/base'
import { isUnmatchedRoute } from '@/router/workspace'
import { registerDynamicRoute } from '@/router/dynamic'
import { getBaseRouteToMeta, registerToRouter } from '@/utils/router'
import { useContextStore, useMenuStore, useSessionStore, useShellStore, useTabsStore } from '@/store'

/** 菜单、插件和路由一次就绪；空菜单也算初始化成功，退出后丢弃在途结果。 */
export function createWorkspace(router: Router, pinia: Pinia, loadPlugins: () => Promise<void>): WorkspaceController {
  const menu = useMenuStore(pinia)
  const session = useSessionStore(pinia)
  const shell = useShellStore(pinia)
  let ready = false
  let generation = 0
  let pending: Promise<void> | undefined
  const pendingPaths = new Set<string>()

  function restoreBaseRoutes() {
    // 菜单路由和穿透页都属于会话；重置时恢复基础路由及首次匹配兜底。
    router.clearRoutes()
    registerToRouter(router, baseRoutes)
    router.options.routes = baseRoutes
  }

  function initialize(to: WorkspaceTarget): Promise<void> {
    if (ready) return Promise.resolve()
    if (isUnmatchedRoute(to)) pendingPaths.add(to.path)
    if (pending) return pending
    const currentGeneration = generation
    const operation = Promise.all([menu.init(), loadPlugins()])
      .then(([serverRoutes]) => {
        if (currentGeneration !== generation) throw new DOMException('工作区已重置', 'AbortError')
        registerToRouter(router, serverRoutes)
        router.options.routes = [...baseRoutes, ...serverRoutes]
        menu.mergeMeta(getBaseRouteToMeta(baseRoutes))
        // 初始化期间可能切换深链；保留每次导航目标，且不覆盖菜单刚注册的 meta。
        for (const path of pendingPaths) {
          if (!router.hasRoute(path)) registerDynamicRoute(router, { path })
        }
        pendingPaths.clear()
        session.markLogin(true)
        ready = true
        shell.markReady()
        shell.markRendered()
      })
      .catch((error: unknown) => {
        if (currentGeneration !== generation) throw new DOMException('工作区已重置', 'AbortError')
        pendingPaths.clear()
        menu.reset()
        restoreBaseRoutes()
        throw error
      })
      .finally(() => {
        if (pending === operation) pending = undefined
      })
    pending = operation
    return operation
  }

  return {
    get isReady() {
      return ready
    },
    initialize,
    prepareStandalone: loadPlugins,
    reset() {
      generation += 1
      pending = undefined
      pendingPaths.clear()
      ready = false
      menu.reset()
      restoreBaseRoutes()
      useTabsStore(pinia).reset()
      useContextStore(pinia).reset()
      session.logout()
    }
  }
}
