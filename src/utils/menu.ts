import { RouteRecordRaw } from 'vue-router'

/**
 * 系统管理菜单：不再出现在主导航（侧栏 / 顶栏）中，统一收进头像下拉面板
 * 标题以服务端 /sys/menu/nav 下发的 name 为准
 */
export const SYSTEM_MENU_TITLE = '系统管理'

export interface IUserMenuItem {
  /** 服务端菜单 id，缺失时退化为路由路径 */
  key: string
  title: string
  /** 侧栏收起时的简称，未配置时回退标题前两个字 */
  shortName: string
  path: string
  menuId: string
  /** 服务端配置的外部打开方式，点击时新开浏览器标签 */
  isNewPage: boolean
  /** 新窗口地址（isNewPage 时使用） */
  url: string
  /** 在菜单树中的层级：「系统管理」为第 1 层，其子菜单为第 2 层 */
  level: number
  children: IUserMenuItem[]
}

const getMenuMeta = (route: RouteRecordRaw): Record<string, any> => (route.meta || {}) as Record<string, any>

/** 是否需要在导航中展示（对齐 toValidRoutes 的 isNavigationMenu 约定） */
export const isMenuRouteVisible = (route: RouteRecordRaw): boolean => getMenuMeta(route).isNavigationMenu !== false

/** 只按服务端菜单名称匹配「系统管理」，不根据路径或子菜单推断。 */
export const isSystemMenuRoute = (route: RouteRecordRaw | null | undefined): boolean => {
  if (!route) return false
  const title = String(getMenuMeta(route).title ?? '').trim()
  return title === SYSTEM_MENU_TITLE
}

/**
 * 从菜单树中提取名称匹配的分组，保留每个分组内部的层级
 * level 是分组在传入菜单树中的层级，「系统管理」自身算第 1 层
 */
const collectSystemMenuRoutes = (routes: RouteRecordRaw[] = [], level = 1): { route: RouteRecordRaw; level: number }[] =>
  routes.flatMap((route) => {
    if (!isMenuRouteVisible(route)) return []
    return isSystemMenuRoute(route) ? [{ route, level }] : collectSystemMenuRoutes(route.children || [], level + 1)
  })

export const findSystemMenuRoutes = (routes: RouteRecordRaw[] = []): RouteRecordRaw[] => collectSystemMenuRoutes(routes).map((x) => x.route)

const toMenuItem = (route: RouteRecordRaw, level: number): IUserMenuItem => {
  const meta = getMenuMeta(route)
  const title = String(meta.title ?? '').trim()
  const children = (route.children || [])
    .filter(isMenuRouteVisible)
    .map((child) => toMenuItem(child, level + 1))
    .filter(hasClickableEntry)
  return {
    key: String(meta.id ?? route.path),
    title: title || route.path,
    shortName: String(meta.shortName ?? '').trim(),
    path: route.path,
    menuId: String(meta.id ?? ''),
    isNewPage: !!meta.isNewPage,
    url: String(meta.url ?? ''),
    level,
    children
  }
}

/** 没有子菜单、也没有可跳转地址的占位节点不渲染 */
const hasClickableEntry = (item: IUserMenuItem): boolean => item.children.length > 0 || !!item.url

/**
 * 构建头像下拉中的系统管理菜单项（保留服务端的层级）
 * 根菜单本身是叶子节点时，直接返回根节点
 */
export const buildSystemMenuItems = (routes: RouteRecordRaw[] = []): IUserMenuItem[] => {
  return collectSystemMenuRoutes(routes).flatMap(({ route: root, level }) => {
    const children = (root.children || [])
      .filter(isMenuRouteVisible)
      .map((child) => toMenuItem(child, level + 1))
      .filter(hasClickableEntry)
    if (children.length) return children
    const rootItem = toMenuItem(root, level)
    return hasClickableEntry(rootItem) ? [rootItem] : []
  })
}
