import type { RouteRecordRaw } from 'vue-router'

export interface NavigationEntry {
  path: string
  title: string
  group: string
  icon: string
  external: boolean
  href: string
}

/** 服务端子菜单可以使用绝对路径，所属模块由菜单树确定。 */
export function findNavigationRoot(routes: RouteRecordRaw[], path: string): RouteRecordRaw | undefined {
  return routes.find((route) => route.path === path || (route.children && findNavigationRoot(route.children, path)))
}

/** 隐藏、无视图或内部占位的菜单不作为入口展示。 */
const isHiddenEntry = (route: RouteRecordRaw): boolean =>
  route.meta?.isNavigationMenu === false || Boolean(route.meta?.isUnavailable) || route.path.startsWith('/__')

/** Menu search and the workbench share the same permission and availability rules. */
export function collectNavigationEntries(routes: RouteRecordRaw[], parentTitles: string[] = []): NavigationEntry[] {
  return routes.flatMap((route) => {
    if (isHiddenEntry(route)) return []
    const title = route.meta?.title || route.path
    if (route.children?.length) return collectNavigationEntries(route.children, [...parentTitles, title])
    if (route.path === '/home' || route.path === '/baseHome') return []
    return [
      {
        path: route.path,
        title,
        group: parentTitles.join(' / ') || '工作区',
        icon: typeof route.meta?.icon === 'string' ? route.meta.icon : '',
        external: Boolean(route.meta?.isNewPage),
        href: typeof route.meta?.url === 'string' ? route.meta.url : route.path
      }
    ]
  })
}

export function searchNavigationEntries(entries: NavigationEntry[], query: string, group = ''): NavigationEntry[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return entries.filter((entry) => {
    const text = `${entry.title} ${entry.group} ${entry.path}`.toLocaleLowerCase()
    return (!group || entry.group === group) && terms.every((term) => text.includes(term))
  })
}

/** 面包屑展示的路径与标题。 */
export interface BreadcrumbNode {
  path: string
  title: string
}

export interface BreadcrumbTrail {
  /** 从模块到直接父级的分组 */
  ancestors: BreadcrumbNode[]
  current: BreadcrumbNode
}

const toBreadcrumbNode = (route: RouteRecordRaw): BreadcrumbNode => ({
  path: route.path,
  title: route.meta?.title || route.path
})

const findMenuTrail = (routes: RouteRecordRaw[], path: string): RouteRecordRaw[] | null => {
  for (const route of routes) {
    if (route.path === path) return [route]
    const trail = route.children?.length ? findMenuTrail(route.children, path) : null
    if (trail) return [route, ...trail]
  }
  return null
}

/**
 * 按服务端菜单树解析当前页的面包屑。
 *
 * 分组路由只挂 RouteHost，没有自己的视图，所以祖先只展示标题；
 * 「系统管理」虽然不进主导航，仍按真实位置展示。不在菜单树里的页面返回 null。
 */
export function resolveBreadcrumb(routes: RouteRecordRaw[], path: string): BreadcrumbTrail | null {
  const trail = findMenuTrail(routes, path)
  if (!trail) return null
  const nodes = trail.map(toBreadcrumbNode)
  const current = nodes[nodes.length - 1]
  return { ancestors: nodes.slice(0, -1), current }
}
