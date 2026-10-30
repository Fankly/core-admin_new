import type { RouteLocationNormalized, RouteRecordRaw, Router } from 'vue-router'
import NProgress from 'nprogress'
import { ElMessage } from 'element-plus'
import baseRoutes, { errorRoute } from '../base'
import { registerDynamicRoute, registerDynamicToRouterAndNext } from '../dynamic'
import { isWorkflowStandalone } from '../layout'
import { getBaseRouteToMeta, registerToRouter, resetRoute } from '@/utils/router'
import { getPermissions, getToken } from '@/utils/cache'
import { useContextStore, useMenuStore, useSessionStore, useShellStore, useTabsStore } from '@/store'
import type { MenuMeta } from '@/types/domain'
import { loadWorkspacePlugins } from '@/app/plugins'

NProgress.configure({ showSpinner: false })

let documentDomainApplied = false

/**
 * 设置 document.domain 以支持旧系统的跨子域 iframe。
 * 只在域名确实匹配时执行一次；现代浏览器禁止该 API，失败时给出可操作提示。
 */
function applyDocumentDomain(domainName?: string) {
  if (documentDomainApplied) return
  const domain = domainName || 'sgcc.com.cn'
  if (!window.location.hostname.endsWith(domain) || window.location.hostname === domain) return
  documentDomainApplied = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- 旧系统跨子域 iframe 依赖该 API
    document.domain = domain
  } catch {
    ElMessage({
      type: 'warning',
      dangerouslyUseHTMLString: true,
      message: `修改域名出错,请使用域名访问,否则部分功能无法正常使用!<br>设置域名:${domain}`
    })
  }
}

/** 首次进入时加载菜单、注册动态路由，并标记应用就绪。 */
async function bootstrapApplication(router: Router, to: RouteLocationNormalized) {
  const menu = useMenuStore()
  const shell = useShellStore()
  const session = useSessionStore()

  const [serverRoutes] = await Promise.all([menu.init(), loadWorkspacePlugins()])
  const mergedRoutes: RouteRecordRaw[] = [...baseRoutes, ...serverRoutes, ...errorRoute]
  router.options.routes = mergedRoutes
  registerToRouter(router, [...serverRoutes, ...errorRoute])
  menu.mergeMeta(getBaseRouteToMeta(baseRoutes))

  // 首次直接命中的深链可能不在菜单里，但视图文件存在：实时补注册。
  if (!to.matched.length) registerDynamicRoute(router, { path: to.path })

  session.markLogin(true)
  shell.markReady()
  shell.markRendered()
}

/**
 * 路由守卫。
 *
 * 拆成“菜单信息同步 → 新窗口拦截 → 登录/初始化 → 放行”四段，
 * 不再在一个函数里用嵌套 if 处理 workflow / pop / 动态注册。
 */
export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    const menu = useMenuStore()
    const tabs = useTabsStore()
    const shell = useShellStore()
    const session = useSessionStore()

    menu.syncMenuMessage(to)

    if (to.meta.isNewPage && to.query.pop !== 'true') return false

    const token = getToken()
    const permission = getPermissions()
    const isPop = to.query.pop === 'true'
    const isWorkflow = isWorkflowStandalone(to.path)

    if (to.path === '/login') {
      resetRoute(router, menu.routes)
      menu.reset()
      tabs.reset()
      useContextStore().reset()
      session.logout()
      shell.setRouteLoading(false)
      shell.markReady()
      shell.markRendered()
      NProgress.done()
      return true
    }

    // 初始化失败时需要一个不依赖菜单的外壳出口，避免永久停在首屏。
    if (to.path === '/error') {
      shell.setRouteLoading(false)
      shell.markReady()
      shell.markRendered()
      NProgress.done()
      return true
    }

    if (!tabs.tabs.some((tab) => tab.path === to.fullPath)) shell.setRouteLoading(true)
    NProgress.start()

    applyDocumentDomain(session.user.domainName)

    // 已完成初始化：后续导航只做权限/标签页处理。
    if (menu.routes.length) {
      if (!token || !permission) return '/login'
      if (to.name === 'error') return true
      if (!isWorkflow) {
        session.markLogin(true)
        shell.markRendered()
        return true
      }
      await menu.init()
      session.markLogin(true)
      shell.markRendered()
      return true
    }

    // 流程页不依赖主框架初始化，可直接放行。
    if (isWorkflow) {
      await Promise.all([menu.init(), loadWorkspacePlugins()])
      return true
    }

    if (token && permission) {
      try {
        await bootstrapApplication(router, to)
        return { ...to, replace: true }
      } catch (error) {
        console.error('[router] workspace bootstrap failed', error)
        menu.reset()
        shell.markReady()
        shell.markRendered()
        shell.setRouteLoading(false)
        NProgress.done()
        ElMessage.error('工作区加载失败，请稍后重试')
        return { path: '/error', query: { to: '503' }, replace: true }
      }
    }

    // 新窗口打开的内页：登录态由主窗口共享，这里只负责注册路由。
    if (isPop) {
      await loadWorkspacePlugins()
      if (!to.matched.length) {
        registerDynamicToRouterAndNext(router, { path: to.path, query: to.query })
        shell.markReady()
        shell.markRendered()
        return to.fullPath
      }
      shell.markReady()
      shell.markRendered()
      return to.meta.requiresAuth ? '/login' : true
    }

    return '/login'
  })

  router.afterEach((to, _from, failure) => {
    const shell = useShellStore()
    const tabs = useTabsStore()
    const menu = useMenuStore()

    shell.setRouteLoading(false)
    NProgress.done()

    if (failure || to.query.pop || to.path === '/login') return
    const meta: MenuMeta = menu.routeToMeta[to.path] ?? to.meta
    tabs.openTab({
      path: to.fullPath,
      title: to.meta.title || meta.title || to.path,
      meta,
      keepAlive: to.meta.keepAlive !== false
    })
  })
}
