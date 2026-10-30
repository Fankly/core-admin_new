import baseService from '@/service/baseService'
import type { ApiResponse } from '@/service/http/types'

/** 收藏菜单项：/sys/menu/favorite/list 返回字段 */
export interface MenuFavorite {
  favoriteId: string
  menuId: string
  name: string
  sort: number
  url: string
  createTime: string
}

/** 收藏 / 取消收藏：menuId 拼接在 URL 后面 */
export const toggleMenuFavorite = (menuId: string): Promise<ApiResponse<boolean>> => {
  return baseService.post<boolean>(`/sys/menu/favorite/toggle?menuId=${encodeURIComponent(menuId)}`)
}

/** 查询当前用户的收藏菜单列表 */
export const getFavoriteMenuList = (): Promise<ApiResponse<MenuFavorite[] | null>> => {
  return baseService.get<MenuFavorite[]>('/sys/menu/favorite/list')
}
