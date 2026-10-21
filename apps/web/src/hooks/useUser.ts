import { getMenuMessage } from '@/api/process'
import { getButtonList, getRoleByBusicode } from '@/api/permission'
import { useContextStore, useMenuStore, useSessionStore } from '@/store'
import type { GlobalContextKey } from '@/store/modules/context'
import { handleError } from '@/utils/error'

/** 兼容旧的 getter 名称：getXqGlobalInfo → xqGlobalInfo。 */
const normalizeContextKey = (flag: string): GlobalContextKey => {
  if (flag.startsWith('get')) {
    const key = flag.slice(3)
    return `${key.charAt(0).toLowerCase()}${key.slice(1)}` as GlobalContextKey
  }
  return flag as GlobalContextKey
}

export const useUser = async (flag = 'getXqGlobalInfo'): Promise<boolean> => {
  try {
    const session = useSessionStore()
    const menu = useMenuStore()
    const context = useContextStore()
    const userId = session.user.id
    const url = menu.menuMsg.url
    const current = context.globalInfo[normalizeContextKey(flag)] ?? {}
    const roleId = current.roleId
    const deptId = current.deptId
    const result = await getMenuMessage(url ?? '')
    if (!result.success || !result.data) throw new Error('请求当前页面信息数据失败')
    const code = result.data.outsideMenu
    if (!code || !userId) throw new Error('获取当前页面信息数据失败')
    const roles = await getRoleByBusicode(userId, code)
    if (!Array.isArray(roles)) throw new Error('获取角色失败')
    return roles.some((item) => item.role_id === roleId && item.specialorgid === deptId)
  } catch (error) {
    handleError(error, '验证角色失败')
    return false
  }
}

/** 判断跳转的页面有没有权限。 */
export const usePage = async (roleId: string, deptId: string, spRoleId: string): Promise<boolean> => {
  const session = useSessionStore()
  const menu = useMenuStore()
  session.setPermissions([])
  try {
    const userId = session.user.id
    const url = menu.menuMsg.url
    const result = await getMenuMessage(url ?? '')
    if (!result.success || !result.data) throw new Error('请求当前页面信息数据失败')
    const code = result.data.outsideMenu
    if (!code || !userId) throw new Error('获取当前页面信息数据失败')
    const roles = await getRoleByBusicode(userId, code)
    if (!Array.isArray(roles)) throw new Error('获取角色失败')
    const isRole = roles.some((item) => item.role_id === roleId && item.specialorgid === deptId && item.id === spRoleId)
    if (!isRole) return false

    const buttons = await getButtonList(code, spRoleId)
    if (!buttons.success || !Array.isArray(buttons.data)) throw new Error(buttons.msg || '获取按钮权限失败')
    // 页面已经变化时，不能把上一页的迟到权限写入全局状态。
    if (menu.menuMsg.url !== url) return false
    session.setPermissions(buttons.data)
    return true
  } catch (error) {
    handleError(error, '验证页面权限失败')
    return false
  }
}
