import type { RouteRecordRaw } from 'vue-router'

/**
 * 动态视图注册表。
 *
 * 路由、store 与工具层都需要“path → 视图组件”的映射。把 import.meta.glob
 * 收在这里，避免 store ↔ router 的循环依赖，也让匹配规则只有一个实现。
 *
 * 注意 glob 使用 Vite root 相对路径：monorepo 下 root 是 apps/web，
 * 因此不需要写成 ../../views。
 */
const viewModules = import.meta.glob('/src/views/**/*.vue')

export type ViewModuleMap = Record<string, () => Promise<unknown>>

export const getSysRouteMap = (): ViewModuleMap => viewModules

/**
 * 菜单 url → 视图文件路径。
 * 约定：下划线对应文件名里的连字符，其余路径保持一致。
 */
export const toSysViewComponentPath = (path: string): string => `/src/views${path.replace(/_/g, '-')}.vue`

/** 按路由 path 查视图组件加载器，找不到返回 undefined。 */
export const resolveViewComponent = (path: string): ViewModuleMap[string] | undefined => {
  return getSysRouteMap()[toSysViewComponentPath(path)]
}

/** 只保留匹配到视图的路由，用于产生“有效路由”的诊断信息。 */
export const getRegisteredViewPaths = (): string[] => Object.keys(getSysRouteMap())

export type { RouteRecordRaw }
