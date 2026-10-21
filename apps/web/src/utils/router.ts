import type { RouteRecordRaw, Router } from 'vue-router'
import app from '@/constants/app'
import type { MenuMeta } from '@/types/domain'
import type { IServerMenus } from '@/types/interface'
import baseView from '@/layout/view/base-view.vue'
import { toSysViewComponentPath, type ViewModuleMap } from '@/router/view-registry'
import { isExternalLink } from './utils'

/**
 * 合并本地路由和服务端菜单，追加 isIframe / isNewPage 等 meta。
 * 返回 [路由, path → meta 映射]，映射供路由守卫与菜单组件反查。
 */
export const mergeServerRoute = (
  serverRoutes: IServerMenus[],
  sysRouteMap: ViewModuleMap,
  matched: Array<{ path: string; title?: string }> = []
): [RouteRecordRaw[], Record<string, MenuMeta>] => {
  const routes: RouteRecordRaw[] = []
  let routeToMeta: Record<string, MenuMeta> = {}

  serverRoutes.forEach((item) => {
    const [path, openStyleMeta] = mergeRouteToOpenStyle(item.url, item)
    const viewComponent = sysRouteMap[toSysViewComponentPath(path)]
    const hasChildren = Boolean(item.children?.length)
    const isNotMatchComponent = !viewComponent && !openStyleMeta.isIframe && !openStyleMeta.isNewPage && !hasChildren

    const routeMeta: MenuMeta = {
      title: item.name,
      icon: item.icon,
      openStyle: item.openStyle,
      id: item.id,
      url: item.url,
      outsideMenu: item.outsideMenu,
      matched: [...matched, { path, title: item.name }],
      ...openStyleMeta
    }

    if (path) routeToMeta[path] = routeMeta

    let children: RouteRecordRaw[] | undefined
    if (item.children?.length) {
      const [childrenRoutes, childrenMeta] = mergeServerRoute(item.children, sysRouteMap, routeMeta.matched ?? [])
      children = childrenRoutes
      routeToMeta = { ...routeToMeta, ...childrenMeta }
    }

    routes.push({
      path,
      name: path,
      component: openStyleMeta.isIframe ? () => import('@/views/iframe.vue') : hasChildren && !viewComponent ? baseView : viewComponent,
      meta: routeMeta,
      redirect: item.redirect || (isNotMatchComponent ? { path: '/error', query: { to: 404 }, replace: true } : undefined),
      children
    } as RouteRecordRaw)
  })

  return [routes, routeToMeta]
}

/** 重置动态路由（退出登录/切换租户时使用）。 */
export const resetRoute = (router: Router, routes: RouteRecordRaw[]): void => {
  routes.forEach((route) => {
    if (route.name && router.hasRoute(route.name)) router.removeRoute(route.name)
  })
}

/** 路由树转 path → 路由对象，便于按 path 查找。 */
export const routesToObject = (routes: RouteRecordRaw[]): Record<string, RouteRecordRaw> => {
  const result: Record<string, RouteRecordRaw> = {}
  const walk = (items: RouteRecordRaw[]) => {
    items.forEach((item) => {
      result[item.path] = item
      if (item.children?.length) walk(item.children)
    })
  }
  walk(routes)
  return result
}

/** 过滤掉 isNavigationMenu === false 的路由，返回新数组，不修改入参。 */
export const toValidRoutes = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
  return routes
    .filter((route) => route.meta?.isNavigationMenu !== false)
    .map((route) => (route.children?.length ? { ...route, children: toValidRoutes(route.children) } : route))
}

/** 展平路由树后注册，动态路由按 name 覆盖。 */
export const registerToRouter = (router: Router, routes: RouteRecordRaw[]): void => {
  flatRoutes(routes).forEach((route) => router.addRoute(route))
}

export const flatRoutes = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
  const result: RouteRecordRaw[] = []
  routes.forEach((route) => {
    result.push(route)
    if (route.children?.length) result.push(...flatRoutes(route.children))
  })
  return result
}

/**
 * 根据菜单打开方式生成实际 path 与 meta：
 * - openStyle=1：新窗口打开（外链直接跳，内页拼 #/path?pop=true）
 * - 外链 iframe、内嵌 frame、普通内页
 */
export const mergeRouteToOpenStyle = (rawUrl: string | undefined, item: IServerMenus): [string, MenuMeta] => {
  let url = rawUrl || `/iframe/${item.id}`
  let meta: MenuMeta = {}

  const toRoutePath = (value: string): string => (/^\//.test(value) ? value : `/${value}`)
  const renderVariableHook = (value: string): string => value.replace('{{ApiUrl}}', app.api)

  if (item.openStyle === 1) {
    if (isExternalLink(url)) {
      url = renderVariableHook(url)
      meta = { url, isNewPage: true }
      url = `/webview/${item.id}`
    } else {
      url = toRoutePath(url)
      meta = { url: `/#${url}?pop=true`, isNewPage: true }
    }
  } else if (isExternalLink(url)) {
    url = renderVariableHook(url)
    meta = { url, isIframe: true }
    url = `/iframe/${item.id}`
  } else {
    if (item.isFrame) meta = { url, isIframe: true, frameSrc: item.frameSrc }
    url = toRoutePath(url)
  }

  return [url, meta]
}

/** 基础路由（本地静态路由）的 path → meta 映射。 */
export const getBaseRouteToMeta = (routes: RouteRecordRaw[]): Record<string, MenuMeta> => {
  let routeToMeta: Record<string, MenuMeta> = {}
  routes.forEach((route) => {
    if (route.path && route.meta) {
      routeToMeta[route.path] = { ...route.meta, openStyle: 0, id: route.path, url: route.path }
    }
    if (route.children?.length) {
      routeToMeta = { ...routeToMeta, ...getBaseRouteToMeta(route.children) }
    }
  })
  return routeToMeta
}
