import Layout from '@/layout/layout.vue'
import Error404 from '@/views/error/404.vue'
import Iframe from '@/views/iframe.vue'
import { RouteRecordRaw } from 'vue-router'
import { whiteList } from './modules/whiteList'
import { workflow } from './modules/workflow'

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
        meta: { title: '主页', icon: 'icon-home' }
      },
      {
        path: '/baseHome',
        name: '/baseHome',
        component: () => import('@/views/baseHome.vue'),
        meta: { title: '主页', icon: 'icon-home', isNavigationMenu: false }
      },
      ...workflow,
      ...whiteList
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login.vue'),
    meta: { title: '登录', isNavigationMenu: false }
  },
  {
    path: '/iframe/:id?',
    component: Iframe,
    meta: { isNavigationMenu: false, isIframe: true }
  },
  {
    path: '/error',
    name: 'error',
    component: Error404,
    meta: { title: '错误页面', isNavigationMenu: false }
  }
]

export const errorRoute: Array<RouteRecordRaw> = [
  {
    path: '/:path(.*)*',
    redirect: { path: '/error', query: { to: 404 }, replace: true },
    meta: { isNavigationMenu: false }
  }
]

export default routes
