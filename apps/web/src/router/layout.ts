import type { RouteLocationNormalized } from 'vue-router'
import app from '@/constants/app'

export type LayoutMode = 'page' | 'fullscreen' | 'standalone'

/**
 * 历史遗留：流程表单页不经过主框架，也不等待应用初始化完成。
 * 新增全屏页应优先在路由 meta 上声明 `layout: 'fullscreen'`，而不是继续加路径判断。
 */
export const isWorkflowStandalone = (path: string): boolean => path.includes('workflow') && path !== '/workflow/todoTasks'

/**
 * 决定一个路由使用哪种外壳：
 * - standalone：流程页，直接全屏渲染，不显示首屏遮罩
 * - fullscreen：登录页、pop 弹窗页、显式声明 layout 的页面
 * - page：默认管理后台布局
 */
export const resolveLayoutMode = (route: Pick<RouteLocationNormalized, 'path' | 'query' | 'meta'>): LayoutMode => {
  if (isWorkflowStandalone(route.path)) return 'standalone'
  if (route.meta.layout === 'fullscreen') return 'fullscreen'
  if (route.query.pop === 'true') return 'fullscreen'
  if (app.fullscreenPages.includes(route.path)) return 'fullscreen'
  return 'page'
}
