import app from '@/constants/app'
import { IObject, IServerMenus } from '@/types/interface'
import baseView from '@/layout/view/base-view.vue'
import { toSysViewComponentPath } from '@/router'
import Iframe from '@/views/iframe.vue'
import { Router, RouteRecordNormalized, RouteRecordRaw } from 'vue-router'
import { getValueByKeys, isExternalLink } from './utils'

/**
 * 合并本地路由和服务端菜单，追加isIframe和isNewPage参数到meta中
 * @param serverRoutes
 * @param sysRouteMap
 * @returns
 */
export const mergeServerRoute = (serverRoutes: IServerMenus[], sysRouteMap: IObject, matched: IObject[] = []): [RouteRecordRaw[], IObject] => {
  const rs: RouteRecordRaw[] = []
  let routeToMeta: IObject = {}
  serverRoutes.forEach((x: IServerMenus) => {
    const [path, meta] = mergeRouteToOpenStyle(x.url, x)
    const viewComponent = sysRouteMap[toSysViewComponentPath(path)]
    const isNotMatchComponent = !viewComponent && !meta.isIframe && !meta.isNewPage && !(x.children && x.children.length)
    const routeMeta: IObject = {
      title: x.name,
      icon: x.icon,
      openStyle: x.openStyle,
      id: x.id,
      url: x.url,
      outsideMenu: x.outsideMenu,
      matched: [...matched, { path, title: x.name }],
      ...meta
    }
    if (path) {
      routeToMeta[path] = routeMeta
    }
    let children: RouteRecordRaw[] | undefined
    if (x.children && x.children.length) {
      const childrenRoutes = mergeServerRoute(x.children, sysRouteMap, getValueByKeys(routeMeta, 'matched', []))
      children = childrenRoutes[0]
      routeToMeta = { ...routeToMeta, ...childrenRoutes[1] }
    }
    // RouteRecordRaw 是联合类型，先声明再逐个赋值会被收窄成「无 children/redirect」那一支，
    // 所以一次性构造完再断言
    rs.push({
      path,
      name: path,
      component: meta.isIframe ? Iframe : x.children && x.children.length && !viewComponent ? baseView : viewComponent,
      meta: routeMeta,
      redirect: x.redirect || (isNotMatchComponent ? { path: '/error', query: { to: 404 }, replace: true } : ''),
      children
    } as RouteRecordRaw)
  })
  return [rs, routeToMeta]
}

/**
 * 重置路由
 * @param router
 * @param routes
 */
export const resetRoute = (router: Router, routes: RouteRecordRaw[]): void => {
  routes.forEach((route: any) => {
    const { name } = route
    router.hasRoute(name) && router.removeRoute(name)
  })
}

/**
 * 路由转换成对象格式
 * @param routes
 * @returns
 */
export const routesToObject = (routes: any[]): IObject<RouteRecordNormalized> => {
  const rs: IObject<RouteRecordNormalized> = {}
  const loop = (ms: any[]) => {
    ms.forEach((x: RouteRecordNormalized): void => {
      rs[x.path] = x
      if (x.children && x.children.length) {
        loop(x.children)
      }
    })
  }
  loop(routes)
  return rs
}

/**
 * 转化为有效的导航路由
 * @param routes
 * @returns
 */
export const toValidRoutes = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
  const rs: RouteRecordRaw[] = []
  routes.forEach((x: RouteRecordRaw) => {
    if (x.meta && x.meta.isNavigationMenu !== false) {
      if (x.children && x.children.length) {
        x.children = toValidRoutes(x.children)
      }
      rs.push(x)
    }
  })
  return rs
}

/**
 * 注册路由
 * @param router
 * @param rs
 */
export const registerToRouter = (router: Router, rs: RouteRecordRaw[]): void => {
  // 将rs扁平化
  const flatRouters = flatRoutes(rs)
  // 注册路由
  flatRouters.forEach((x) => {
    router.addRoute(x)
  })
}

export const flatRoutes = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
  const rs: RouteRecordRaw[] = []
  routes.forEach((x) => {
    rs.push(x)
    if (x.children && x.children.length) {
      rs.push(...flatRoutes(x.children))
    }
  })
  return rs
}

export const mergeRouteToOpenStyle = (url: string, item: IServerMenus): [string, IObject] => {
  url = url || `/iframe/${item.id}`
  let meta: IObject = {}
  const toRoutePath = (url: string): string => {
    return !/^\//.test(url) ? '/' + url : url
  }
  //生成变量路由数据
  const renderVariableHook = (url: string): string => {
    return url.replace('{{ApiUrl}}', app.api)
  }
  if (item.openStyle === 1) {
    //外部
    if (isExternalLink(url)) {
      url = renderVariableHook(url)
      meta = { url, isNewPage: true }
      url = `/webview/${item.id}` //虚拟无效地址
    } else {
      url = toRoutePath(url)
      meta = { url: `/#${url}?pop=true`, isNewPage: true }
    }
  } else {
    if (isExternalLink(url)) {
      url = renderVariableHook(url)
      meta = { url, isIframe: true }
      url = `/iframe/${item.id}`
    } else {
      if (item.isFrame) {
        meta = { url, isIframe: true, frameSrc: item.frameSrc }
      }
      url = toRoutePath(url)
    }
  }
  return [url, meta]
}

/**
 *
 * @param routes 获取基础路由url和meta数据
 * @returns
 */
export const getBaseRouteToMeta = (routes: RouteRecordRaw[]): IObject => {
  let routeToMeta: IObject = {}
  routes.forEach((x) => {
    if (x.path && x.meta) {
      routeToMeta[x.path] = { ...x.meta, openStyle: 0, id: x.path, url: x.path }
    }
    if (x.children && x.children.length) {
      routeToMeta = { ...routeToMeta, ...getBaseRouteToMeta(x.children) }
    }
  })
  return routeToMeta
}
