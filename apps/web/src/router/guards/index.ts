import type { Router } from 'vue-router'
import type { WorkspaceController } from '../workspace'
import NProgress from 'nprogress'
import { ElMessage } from 'element-plus'
import { registerDynamicRoute } from '../dynamic'
import { isWorkflowStandalone } from '../layout'
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
  if (!window.location.hostname.endsWith(`.${domain}`) || window.location.hostname === domain) return
  documentDomainApplied = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- 旧系统跨子域 iframe 依赖该 API
    document.domain = domain
  } catch {
    ElMessage({
      type: 'warning',
      message: `修改域名出错,请使用域名访问,否则部分功能无法正常使用! 设置域名:${domain}`
    })
  }
}

/**
 * 路由守卫。
 *
 * 拆成“菜单信息同步 → 新窗口拦截 → 登录/初始化 → 放行”四段，
 * 不再在一个函数里用嵌套 if 处理 workflow / pop / 动态注册。
 */
export function setupRouterGuards(router: Router, workspace: WorkspaceController) {
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
      workspace.reset()
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
    if (workspace.isReady) {
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

    // 流程页保持原有独立访问契约，也复用同一套初始化和失败恢复。
    if (isWorkflow || (token && permission)) {
      try {
        await workspace.initialize(to)
        if (isWorkflow) return true
        return { path: to.path, query: to.query, hash: to.hash, replace: true }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return false
        console.error('[router] workspace bootstrap failed', error)
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
      await workspace.prepareStandalone()
      if (!to.matched.length) {
        registerDynamicRoute(router, { path: to.path })
        shell.markReady()
        shell.markRendered()
        return { path: to.path, query: to.query, hash: to.hash, replace: true }
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
