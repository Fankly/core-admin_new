import Layout from '@/layouts/RouteHost.vue'
import Error404 from '@/views/error/404.vue'
import type { RouteRecordRaw } from 'vue-router'
import { whiteList } from './modules/whiteList'
import { workflow } from './modules/workflow'
import { UNMATCHED_ROUTE_NAME } from './workspace'

// 首次深链先保留目标地址，等待守卫加载菜单；初始化后仍未匹配才跳转 404。
export const errorRoute: Array<RouteRecordRaw> = [
  {
    path: '/:path(.*)*',
    name: UNMATCHED_ROUTE_NAME,
    component: Error404,
    meta: { isNavigationMenu: false }
  }
]

/**
 * 框架基础路由
 */
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    meta: { title: '工作台', icon: 'icon-desktop' },
    children: [
      {
        path: '/home',
        name: '/home',
        component: () => import('@/views/home.vue'),
        meta: { title: '主页', icon: 'icon-home', fullBleed: true }
      },
      {
        path: '/baseHome',
        name: '/baseHome',
        component: () => import('@/views/baseHome.vue'),
        meta: { title: '工作台', icon: 'icon-home', isNavigationMenu: false }
      },
      ...workflow,
      ...whiteList
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login.vue'),
    meta: { title: '登录', isNavigationMenu: false, layout: 'fullscreen' }
  },
  {
    path: '/iframe/:id?',
    component: () => import('@/views/iframe.vue'),
    meta: { isNavigationMenu: false, isIframe: true, fullBleed: true }
  },
  {
    path: '/error',
    name: 'error',
    component: Error404,
    meta: { title: '错误页面', isNavigationMenu: false }
  },
  ...errorRoute
]

export default routes
