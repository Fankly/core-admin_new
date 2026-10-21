import { createRouter, createWebHashHistory } from 'vue-router'
import baseRoutes from './base'
import { registerDynamicToRouterAndNext as registerDynamicToRouterAndNextOn, type DynamicRouteParams } from './dynamic'
import { setupRouterGuards } from './guards'

/**
 * 路由入口只做三件事：创建实例、挂守卫、暴露动态注册能力。
 * 具体规则拆到 guards / dynamic / view-registry，避免 index 成为 200 行的大杂烩。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: baseRoutes
})

setupRouterGuards(router)

/** 按约定路径注册视图并跳转（穿透页/详情页用）。 */
export const registerDynamicToRouterAndNext = (route: DynamicRouteParams): void => {
  registerDynamicToRouterAndNextOn(router, route)
}

export { getSysRouteMap, toSysViewComponentPath, resolveViewComponent } from './view-registry'
export { default as baseRoutes, errorRoute } from './base'
export default router
