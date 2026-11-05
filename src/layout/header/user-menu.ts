import type { INavNode } from '@/layout/sidebar/sidebar-nav'
import type { IUserMenuItem } from '@/utils/menu'

/**
 * 头像下拉「系统管理」面板（user-menu-panel.vue）的树操作
 * 渲染复用侧栏节点（sidebar-nav-node.vue），交互对齐侧栏（sidebar-nav.vue）：
 * 同层手风琴、当前页所在分组自动展开、同一路由挂在多处时以用户点的那一项为准
 */

export interface IUserMenuIndex {
  roots: IUserMenuItem[]
  byKey: Map<string, IUserMenuItem>
  /** 父分组 key，顶层为空串 */
  parentOf: Map<string, string>
  /** 同一路由挂在多处时取第一处 */
  firstByPath: Map<string, IUserMenuItem>
}

export const buildUserMenuIndex = (roots: IUserMenuItem[] = []): IUserMenuIndex => {
  const byKey = new Map<string, IUserMenuItem>()
  const parentOf = new Map<string, string>()
  const firstByPath = new Map<string, IUserMenuItem>()
  const walk = (items: IUserMenuItem[], parent: string) =>
    items.forEach((item) => {
      byKey.set(item.key, item)
      parentOf.set(item.key, parent)
      if (!item.children.length && !firstByPath.has(item.path)) firstByPath.set(item.path, item)
      walk(item.children, item.key)
    })
  walk(roots, '')
  return { roots, byKey, parentOf, firstByPath }
}

/**
 * 转成侧栏节点：层级沿用菜单树（「系统管理」算第 1 层，所以下拉里的顶层项是第 2 层），
 * 渲染时由 level 决定图标、缩进与列表底色，与左侧导航同口径
 * 收藏只属于左侧导航，头像下拉不展示收藏按钮
 */
export const buildUserNavNodes = (items: IUserMenuItem[] = [], ancestors: string[] = []): INavNode[] =>
  items.map((item) => ({
    key: item.key,
    path: item.path,
    title: item.title,
    shortName: item.shortName ?? '',
    menuId: item.menuId,
    isFavorite: false,
    // 缺失时按「系统管理的子菜单」兜底，避免退化成第 1 层的业务域图标
    level: item.level || 2,
    ancestors,
    children: buildUserNavNodes(item.children, [...ancestors, item.key]),
    isNewPage: item.isNewPage,
    url: item.url
  }))

const siblingKeys = (index: IUserMenuIndex, key: string): string[] => {
  const parent = index.parentOf.get(key) || ''
  const list = parent ? index.byKey.get(parent)?.children ?? [] : index.roots
  return list.filter((x) => x.key !== key).map((x) => x.key)
}

/** 从顶层到直接父分组 */
export const getAncestorKeys = (index: IUserMenuIndex, key: string): string[] => {
  const trail: string[] = []
  let parent = index.parentOf.get(key) || ''
  while (parent) {
    trail.unshift(parent)
    parent = index.parentOf.get(parent) || ''
  }
  return trail
}

/** 手风琴：展开一项时收起同层其他分组 */
export const toggleOpenKey = (index: IUserMenuIndex, openKeys: Set<string>, key: string): Set<string> => {
  const next = new Set(openKeys)
  if (next.has(key)) {
    next.delete(key)
    return next
  }
  siblingKeys(index, key).forEach((k) => next.delete(k))
  next.add(key)
  return next
}

/** 展开当前页所在的整条路径，沿途同层分组收起，其余分支保持原状 */
export const openTrailKeys = (index: IUserMenuIndex, openKeys: Set<string>, key: string): Set<string> => {
  const next = new Set(openKeys)
  getAncestorKeys(index, key).forEach((k) => {
    siblingKeys(index, k).forEach((s) => next.delete(s))
    next.add(k)
  })
  return next
}

/** 当前页对应的菜单项：用户点过且路由一致时取点的那一项，否则取该路由的第一处 */
export const resolveActiveKey = (index: IUserMenuIndex, activePath: string, selectedKey: string): string => {
  const picked = index.byKey.get(selectedKey)
  if (picked && !picked.children.length && picked.path === activePath) return picked.key
  return index.firstByPath.get(activePath)?.key ?? ''
}
