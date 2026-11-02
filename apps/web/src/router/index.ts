import { createRouter, createWebHashHistory } from 'vue-router'
import baseRoutes from './base'
import { registerDynamicToRouterAndNext as registerDynamicToRouterAndNextOn, type DynamicRouteParams } from './dynamic'

/**
 * 路由入口负责：创建实例、暴露动态注册能力（守卫由 app 层安装）。
 * 具体规则拆到 guards / dynamic / view-registry，避免 index 成为 200 行的大杂烩。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: baseRoutes
})

/** 按约定路径注册视图并跳转（穿透页/详情页用）。 */
export const registerDynamicToRouterAndNext = (route: DynamicRouteParams): void => {
  registerDynamicToRouterAndNextOn(router, route)
}

export { getSysRouteMap, toSysViewComponentPath, resolveViewComponent } from './view-registry'
export { default as baseRoutes, errorRoute } from './base'
export default router
