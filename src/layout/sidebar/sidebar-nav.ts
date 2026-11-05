import type { InjectionKey, Ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

/**
 * 侧栏导航树节点
 * key 用下标路径（如 0-3-1），同一路由可能挂在多个分组下，不能用 path 当唯一键
 */
export interface INavNode {
  key: string
  path: string
  title: string
  /** 侧栏收起时展示的简称，未配置时回退标题前两个字 */
  shortName: string
  /** 服务端菜单 id，收藏接口使用；本地路由没有该值 */
  menuId: string
  /** 初始是否收藏（/sys/menu/nav 下发的 isFavorite）；会话内切换结果由 MenuFavorites 覆盖 */
  isFavorite: boolean
  level: number
  ancestors: string[]
  children: INavNode[]
  isNewPage: boolean
  url: string
}

export interface INavContext {
  openKeys: Ref<Set<string>>
  activeKey: Ref<string>
  /** 当前页的所有祖先分组（路径高亮） */
  pathKeys: Ref<Set<string>>
  /** 搜索中可见的节点；null 表示未在搜索 */
  visibleKeys: Ref<Set<string> | null>
  idPrefix: string
  hrefOf: (node: INavNode) => string
  onToggle: (node: INavNode) => void
  onLeafClick: (node: INavNode, e: MouseEvent) => void
}

export const NavContextKey: InjectionKey<INavContext> = Symbol('SidebarNav')

export const buildNavNodes = (routes: RouteRecordRaw[] = [], level = 1, ancestors: string[] = [], prefix = ''): INavNode[] =>
  routes.map((x, i) => {
    const key = prefix ? `${prefix}-${i}` : String(i)
    const meta = (x.meta || {}) as Record<string, any>
    return {
      key,
      path: x.path,
      title: String(meta.title ?? ''),
      shortName: String(meta.shortName ?? '').trim(),
      menuId: String(meta.id ?? ''),
      isFavorite: !!meta.isFavorite,
      level,
      ancestors,
      children: x.children && x.children.length ? buildNavNodes(x.children, level + 1, [...ancestors, key], key) : [],
      isNewPage: !!meta.isNewPage,
      url: String(meta.url ?? '')
    }
  })

/**
 * 收起态展示的简称：优先用菜单里配置的 shortName，未配置时取标题前两个字
 * 按码点切分，避免标题以表情等代理对字符开头时被截断成半个字符
 */
export const getNavShortLabel = (node: Pick<INavNode, 'shortName' | 'title'>): string => {
  const shortName = String(node.shortName ?? '').trim()
  if (shortName) return shortName
  return Array.from(String(node.title ?? ''))
    .slice(0, 2)
    .join('')
}

export interface INavSearchOptions {
  keyword: string
  favoritesOnly: boolean
  /** 叶子是否收藏；只在 favoritesOnly 时参与命中判断 */
  isFavorite: (node: INavNode) => boolean
}

export interface INavSearchResult {
  /** 命中项及其所有祖先分组 */
  visible: Set<string>
  /** 需要自动展开的祖先分组；仅自身命中的分组不在其中 */
  open: Set<string>
  /** 自身标题命中、子树没有其他命中的分组：用户手动展开后才补全其子树 */
  expandableGroups: Set<string>
}

/**
 * 侧栏搜索：命中叶子时显示命中项与祖先路径，命中分组时默认只显示分组自身
 * 父级的命中不再向子级传递，避免搜索上级分组名时把整棵子树都当成命中展开
 */
export const searchNavNodes = (nodes: INavNode[] = [], options: INavSearchOptions): INavSearchResult | null => {
  const keyword = options.keyword.trim().toLowerCase()
  if (!keyword && !options.favoritesOnly) return null
  const visible = new Set<string>()
  const open = new Set<string>()
  const expandableGroups = new Set<string>()

  const walk = (node: INavNode, ancestors: string[]): boolean => {
    const selfMatched = !!keyword && node.title.toLowerCase().includes(keyword)
    if (!node.children.length) {
      const hit = (selfMatched || !keyword) && (!options.favoritesOnly || options.isFavorite(node))
      if (hit) {
        visible.add(node.key)
        ancestors.forEach((key) => {
          visible.add(key)
          open.add(key)
        })
      }
      return hit
    }
    let childHit = false
    node.children.forEach((child) => {
      if (walk(child, [...ancestors, node.key])) childHit = true
    })
    // 收藏模式下分组标题不单独命中，否则会带出未收藏的下级
    const hit = childHit || (selfMatched && !options.favoritesOnly)
    if (hit) {
      visible.add(node.key)
      ancestors.forEach((key) => {
        visible.add(key)
        open.add(key)
      })
      if (childHit) open.add(node.key)
      else expandableGroups.add(node.key)
    }
    return hit
  }

  nodes.forEach((node) => walk(node, []))
  return { visible, open, expandableGroups }
}

/**
 * 结合用户当前的展开状态得出可见节点：命中的分组被手动展开后，其子树整体可见
 * 未在搜索时返回 null，由节点直接全部渲染
 */
export const getSearchVisibleKeys = (nodes: INavNode[] = [], result: INavSearchResult | null, openKeys: Set<string>): Set<string> | null => {
  if (!result) return null
  const visible = new Set(result.visible)
  const collect = (node: INavNode) => {
    visible.add(node.key)
    node.children.forEach(collect)
  }
  const walk = (node: INavNode) => {
    if (result.expandableGroups.has(node.key) && openKeys.has(node.key)) {
      node.children.forEach(collect)
      return
    }
    node.children.forEach(walk)
  }
  nodes.forEach(walk)
  return visible
}
