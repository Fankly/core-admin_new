import type { IServerMenus } from '@/types/interface'

export interface MenuTableRow {
  id: string
  level: number
  menu: IServerMenus
}

/** 只遍历展开的分支，保留原始菜单供新增、编辑和删除使用。 */
export const flattenVisibleMenuRows = (menus: IServerMenus[], expandedKeys: ReadonlySet<string>): MenuTableRow[] => {
  const rows: MenuTableRow[] = []
  const walk = (items: IServerMenus[], level: number) => {
    items.forEach((menu) => {
      const id = String(menu.id)
      rows.push({ id, level, menu })
      if (expandedKeys.has(id) && menu.children?.length) walk(menu.children, level + 1)
    })
  }
  walk(menus, 0)
  return rows
}
