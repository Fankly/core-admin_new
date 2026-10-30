import type { RouteRecordRaw } from 'vue-router'

/**
 * 系统管理菜单：不出现在主导航（侧栏 / 顶栏），统一收进头像下拉面板。
 * 标题以服务端菜单下发的 name 为准，不按路径或子菜单推断。
 */
export const SYSTEM_MENU_TITLE = '系统管理'

export interface UserMenuItem {
  /** 服务端菜单 id，缺失时退化为路由路径 */
  key: string
  title: string
  path: string
  menuId: string
  /** 服务端配置的外部打开方式，点击时新开浏览器标签 */
  isNewPage: boolean
  /** 新窗口地址（isNewPage 时使用） */
  url: string
  /** 在菜单树中的层级：「系统管理」为第 1 层，其子菜单为第 2 层 */
  level: number
  children: UserMenuItem[]
}

/** 是否需要在导航中展示（对齐 toValidRoutes 的 isNavigationMenu 约定）。 */
export const isMenuRouteVisible = (route: RouteRecordRaw): boolean => route.meta?.isNavigationMenu !== false

/** 只按服务端菜单名称匹配「系统管理」，不根据路径或子菜单推断。 */
export const isSystemMenuRoute = (route: RouteRecordRaw | null | undefined): boolean => (route?.meta?.title ?? '').trim() === SYSTEM_MENU_TITLE

/**
 * 从菜单树中提取名称匹配的分组，保留每个分组在树中的层级
 * level 是分组在传入菜单树中的层级，「系统管理」自身算第 1 层
 */
const collectSystemMenuRoutes = (routes: RouteRecordRaw[] = [], level = 1): Array<{ route: RouteRecordRaw; level: number }> => {
  const result: Array<{ route: RouteRecordRaw; level: number }> = []
  routes.forEach((route) => {
    if (!isMenuRouteVisible(route)) return
    if (isSystemMenuRoute(route)) result.push({ route, level })
    else result.push(...collectSystemMenuRoutes(route.children ?? [], level + 1))
  })
  return result
}

export const findSystemMenuRoutes = (routes: RouteRecordRaw[] = []): RouteRecordRaw[] => collectSystemMenuRoutes(routes).map((item) => item.route)

/** 没有子菜单、也没有可跳转地址的占位节点不渲染 */
const hasClickableEntry = (item: UserMenuItem): boolean => item.children.length > 0 || !!item.url

const toMenuItem = (route: RouteRecordRaw, level: number): UserMenuItem => {
  const meta = route.meta
  const title = (meta?.title ?? '').trim()
  const children = (route.children ?? [])
    .filter(isMenuRouteVisible)
    .map((child) => toMenuItem(child, level + 1))
    .filter(hasClickableEntry)
  return {
    key: meta?.id ?? route.path,
    title: title || route.path,
    path: route.path,
    menuId: meta?.id ?? '',
    isNewPage: Boolean(meta?.isNewPage),
    url: meta?.url ?? '',
    level,
    children
  }
}

/**
 * 构建头像下拉中的系统管理菜单项（保留服务端的层级）。
 * 根菜单本身是叶子节点时，直接返回根节点。
 */
export const buildSystemMenuItems = (routes: RouteRecordRaw[] = []): UserMenuItem[] =>
  collectSystemMenuRoutes(routes).flatMap(({ route, level }) => {
    const children = (route.children ?? [])
      .filter(isMenuRouteVisible)
      .map((child) => toMenuItem(child, level + 1))
      .filter(hasClickableEntry)
    if (children.length) return children
    const rootItem = toMenuItem(route, level)
    return hasClickableEntry(rootItem) ? [rootItem] : []
  })
