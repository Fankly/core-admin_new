import type { RouteLocationNormalized, RouteRecordRaw, Router } from 'vue-router'
import NProgress from 'nprogress'
import { ElMessage } from 'element-plus'
import 'nprogress/nprogress.css'
import baseRoutes, { errorRoute } from '../base'
import { registerDynamicRoute, registerDynamicToRouterAndNext } from '../dynamic'
import { isWorkflowStandalone } from '../layout'
import { getBaseRouteToMeta, registerToRouter } from '@/utils/router'
import { getPermissions, getToken } from '@/utils/cache'
import { useMenuStore, useSessionStore, useShellStore, useTabsStore } from '@/store'
import type { MenuMeta } from '@/types/domain'

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

  const serverRoutes = await menu.init()
  const mergedRoutes: RouteRecordRaw[] = [...baseRoutes, ...serverRoutes, ...errorRoute]
  router.options.routes = mergedRoutes
  registerToRouter(router, mergedRoutes)
  menu.mergeMeta(getBaseRouteToMeta(baseRoutes))

  // 首次直接命中的深链可能不在菜单里，但视图文件存在：实时补注册。
  if (!to.matched.length) registerDynamicRoute(router, { path: to.path })

  session.markLogin(true)
  shell.markReady()
  // 保留原有的 600ms 过渡，避免首屏骨架与页面内容同时闪现。
  window.setTimeout(() => {
    shell.markRendered()
  }, 600)
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

    if (!tabs.tabs.some((tab) => tab.path === to.path)) shell.setRouteLoading(true)
    NProgress.start()

    if (to.path === '/login') {
      shell.markReady()
      shell.markRendered()
      return true
    }

    applyDocumentDomain(session.user.domainName)

    // 已完成初始化：后续导航只做权限/标签页处理。
    if (menu.routes.length) {
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
      await menu.init()
      return true
    }

    if (token && permission) {
      await bootstrapApplication(router, to)
      return { ...to, replace: true }
    }

    // 新窗口打开的内页：登录态由主窗口共享，这里只负责注册路由。
    if (isPop) {
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

    window.setTimeout(() => {
      shell.setRouteLoading(false)
    }, 300)
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
