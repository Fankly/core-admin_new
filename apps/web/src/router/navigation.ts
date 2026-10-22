import type { RouteRecordRaw } from 'vue-router'

export interface NavigationEntry {
  path: string
  title: string
  group: string
  icon: string
  external: boolean
  href: string
}

/** Menu search and the workbench share the same permission and availability rules. */
export function collectNavigationEntries(routes: RouteRecordRaw[], parentTitles: string[] = []): NavigationEntry[] {
  return routes.flatMap((route) => {
    if (route.meta?.isNavigationMenu === false || route.meta?.isUnavailable || route.path.startsWith('/__')) return []
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
