import { getMenuMessage } from '@/api/process'
import baseService from '@/service/baseService'
import { useAppStore } from '@/store'

export const useUser = async (flag = 'getXqGlobalInfo'): Promise<boolean> => {
  try {
    const store = useAppStore()
    const userId = store.getUserMsg.id //用户Id
    const url = store.getMenuMsg.url //当前页面地址
    const roleId = store[flag].roleId //上级页面角色id
    const deptId = store[flag].deptId //上级页面部门id
    const result = await getMenuMessage(url) //当前页面信息
    if (result.success && result.data) {
      const code = result.data.outsideMenu
      if (code && userId) {
        const res = await baseService.get(`/getRoleByBusicode?userId=${userId}&busicode=${code}`)
        const isRole = res.some((item: any) => item.role_id == roleId && item.specialorgid == deptId)
        return isRole
      } else {
        throw new Error('获取当前页面信息数据失败')
      }
    } else {
      throw new Error('请求当前页面信息数据失败')
    }
  } catch (e) {
    const error = e as Error
    console.error(error.message)
    return false
  }
}
// 判断跳转的页面有没有权限
export const usePage = async (roleId: string, deptId: string, spRoleId: string): Promise<boolean> => {
  try {
    const store = useAppStore()
    const userId = store.getUserMsg.id //用户Id
    const url = store.getMenuMsg.url //当前页面地址
    const result = await getMenuMessage(url) //当前页面信息
    if (result.success && result.data) {
      const code = result.data.outsideMenu
      if (code && userId) {
        const getButtonList = await baseService.get(`/sysMenu/getButtonList?menuCode=${code}&spRoleId=${spRoleId}`)
        if (getButtonList.success) {
          store.setPermissions(getButtonList.data)
        }
        const res = await baseService.get(`/getRoleByBusicode?userId=${userId}&busicode=${code}`)
        const isRole = res.some((item: any) => item.role_id == roleId && item.specialorgid == deptId)
        return isRole
      } else {
        throw new Error('获取当前页面信息数据失败')
      }
    } else {
      throw new Error('请求当前页面信息数据失败')
    }
  } catch (e) {
    const error = e as Error
    console.error(error.message)
    return false
  }
}
