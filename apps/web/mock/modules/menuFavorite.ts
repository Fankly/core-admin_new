/**
 * 菜单收藏 mock。
 *
 * 侧栏菜单星标（收藏 / 取消收藏）链路：
 * - POST sys/menu/favorite/toggle?menuId=...  收藏 / 取消收藏，data 返回 true 表示当前已收藏
 * - GET  sys/menu/favorite/list               收藏列表，项含 favoriteId / menuId / name / sort / url / createTime
 *
 * toggle 只上送 menuId，name / url 后端按菜单表补充，mock 里无法反查真实菜单名，留空；
 * 收藏数据同时写 localStorage，仅便于开发期刷新页面后不丢，与真实后端无关。
 */
import Mock from 'mockjs'
import { fail, getQueryValue, success } from '../helpers'
import type { MockOptions } from '../helpers'

const STORAGE_KEY = 'mock@menu-favorite:list'

interface FavoriteRecord {
  favoriteId: string
  menuId: string
  name: string
  sort: number
  url: string
  createTime: string
}

const formatTime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const readList = (): FavoriteRecord[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? (value as FavoriteRecord[]) : []
  } catch {
    return []
  }
}

const writeList = (list: FavoriteRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // 存储不可用时仅保存在内存，刷新后丢失
  }
}

const favorites = readList()

// 收藏 / 取消收藏：menuId 拼接在 URL 上（POST，无请求体）
Mock.mock(/sys\/menu\/favorite\/toggle/, 'post', (options: MockOptions) => {
  const menuId = getQueryValue(options.url, 'menuId')
  if (!menuId) return fail('menuId 不能为空')
  const index = favorites.findIndex((x) => x.menuId === menuId)
  let favorited: boolean
  if (index > -1) {
    favorites.splice(index, 1)
    favorited = false
  } else {
    favorites.push({
      favoriteId: `fav-${menuId}`,
      menuId,
      name: '',
      sort: favorites.length + 1,
      url: '',
      createTime: formatTime(new Date())
    })
    favorited = true
  }
  favorites.forEach((x, i) => (x.sort = i + 1))
  writeList(favorites)
  return success(favorited, favorited ? '收藏成功' : '已取消收藏')
})

// 收藏列表
Mock.mock(/sys\/menu\/favorite\/list/, 'get', () => success(favorites.map((x) => ({ ...x }))))
