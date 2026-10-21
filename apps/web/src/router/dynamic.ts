import type { LocationQueryRaw, RouteRecordRaw, Router } from 'vue-router'
import { resolveViewComponent } from './view-registry'

export interface DynamicRouteParams {
  path: string
  query?: LocationQueryRaw
  /** 菜单标题，用于标签页；缺省时由调用方/路由 meta 补 */
  title?: string
}

/**
 * 按约定路径实时注册一个视图路由（菜单里没有、但文件存在的穿透页）。
 * 返回是否注册成功，缺组件时注册 404 兜底。
 */
export const registerDynamicRoute = (router: Router, route: DynamicRouteParams): boolean => {
  const component = resolveViewComponent(route.path)
  const record: RouteRecordRaw = {
    path: route.path,
    name: route.path,
    component,
    meta: route.title ? { title: route.title } : undefined,
    redirect: component ? undefined : { path: '/error', query: { to: 404 }, replace: true }
  } as RouteRecordRaw
  router.addRoute(record)
  return Boolean(component)
}

/** 注册并跳转。 */
export const registerDynamicToRouterAndNext = (router: Router, route: DynamicRouteParams): void => {
  if (!router.hasRoute(route.path)) registerDynamicRoute(router, route)
  void router.push({ path: route.path, query: route.query })
}
