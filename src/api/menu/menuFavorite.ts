import baseService from '@/service/baseService'

// 收藏列表项：/sys/menu/favorite/list 返回字段
export interface IMenuFavorite {
  favoriteId: string
  menuId: string
  name: string
  sort: number
  url: string
  createTime: string
}

// 收藏 / 取消收藏：menuId 拼接在 URL 后面
export const toggleMenuFavorite = (menuId: string) => {
  return baseService.post(`/sys/menu/favorite/toggle?menuId=${encodeURIComponent(menuId)}`)
}

// 查询当前用户的收藏菜单列表
export const getFavoriteMenuList = () => {
  return baseService.get('/sys/menu/favorite/list')
}
