import app from '@/constants/app'
import { CacheToken } from '@/constants/cacheKey'
import baseService from '@/service/baseService'
import { useSessionStore } from '@/store'
import { setCache } from '@/utils/cache'

/**
 * 旧工具函数入口。
 *
 * 新代码直接用 `useSessionStore()` / `useMenuStore()`；这里保留薄适配，
 * 避免业务页一次性全改。
 */
export const getData = () => {
  return useSessionStore()
}

export const isLogin = (): boolean => {
  return getData().isLogin
}

export const getUserData = () => {
  return getData().user
}

export const getPermissions = (): string[] => {
  return getData().permissions
}

export const hasPermission = (permission: string): boolean => {
  return getPermissions().includes(permission)
}

export const getServerUrl = (): string => {
  if (app.api === '/') return ''
  return app.api
}

export const loginTempUser = async (username: string): Promise<boolean> => {
  try {
    const res = await baseService.post('/loginTest', { username })
    if (res.code !== 0) return false
    setCache(CacheToken, res.data, true)
    return true
  } catch {
    return false
  }
}

export default {
  getData
}
