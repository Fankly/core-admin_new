import baseService from '@/service/baseService'
import type { UserInfo } from '@/components/UserRoleSelector/interface'

interface Result {
  code: number
  data: string[]
  msg: string
  success: boolean
}

export const getRoleByBusicode = (userId: string, busicode: string): Promise<UserInfo[]> => {
  return baseService.get('/getRoleByBusicode', { userId, busicode })
}

export const getButtonList = (menuCode: string, spRoleId: string): Promise<Result> => {
  return baseService.get('/sysMenu/getButtonList', { menuCode, spRoleId })
}
