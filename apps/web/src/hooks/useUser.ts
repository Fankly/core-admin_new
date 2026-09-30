import { getMenuMessage } from '@/api/process'
import { getButtonList, getRoleByBusicode } from '@/api/permission'
import { useAppStore } from '@/store'
import { handleError } from '@/utils/error'

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
        const res = await getRoleByBusicode(userId, code)
        if (!Array.isArray(res)) throw new Error('获取角色失败')
        const isRole = res.some((item) => item.role_id == roleId && item.specialorgid == deptId)
        return isRole
      } else {
        throw new Error('获取当前页面信息数据失败')
      }
    } else {
      throw new Error('请求当前页面信息数据失败')
    }
  } catch (e) {
    handleError(e, '验证角色失败')
    return false
  }
}
// 判断跳转的页面有没有权限
export const usePage = async (roleId: string, deptId: string, spRoleId: string): Promise<boolean> => {
  const store = useAppStore()
  store.setPermissions([])
  try {
    const userId = store.getUserMsg.id //用户Id
    const url = store.getMenuMsg.url //当前页面地址
    const result = await getMenuMessage(url) //当前页面信息
    if (result.success && result.data) {
      const code = result.data.outsideMenu
      if (code && userId) {
        const roles = await getRoleByBusicode(userId, code)
        if (!Array.isArray(roles)) throw new Error('获取角色失败')
        const isRole = roles.some((item) => item.role_id == roleId && item.specialorgid == deptId && item.id == spRoleId)
        if (!isRole) return false
        const result = await getButtonList(code, spRoleId)
        if (!result.success || !Array.isArray(result.data)) throw new Error(result.msg || '获取按钮权限失败')
        // 页面已经变化时，不能把上一页的迟到权限写入全局状态。
        if (store.getMenuMsg.url !== url) return false
        store.setPermissions(result.data)
        return true
      } else {
        throw new Error('获取当前页面信息数据失败')
      }
    } else {
      throw new Error('请求当前页面信息数据失败')
    }
  } catch (e) {
    handleError(e, '验证页面权限失败')
    return false
  }
}
