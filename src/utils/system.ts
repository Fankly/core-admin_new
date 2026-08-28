import app from '@/constants/app'
import { CacheToken } from '@/constants/cacheKey'
import baseService from '@/service/baseService'
import { useAppStore } from '@/store'
import { setCache } from '@/utils/cache'

/**
 * 获取 store 中存储的所有数据
 * 注意：必须在函数内部调用 useAppStore()，模块顶层调用会早于 app.use(pinia)
 * @returns
 */
export const getData = () => {
  return useAppStore()
}

export const isLogin = (): boolean => {
  return getData().appIsLogin
}

/**
 *
 * @returns {
 *    createDate:创建时间
 *    deptId:部门编号
 *    deptName:部门名称
 *    email:邮箱
 *    gender:性别
 *    id:用户编号
 *    mobile:手机号
 *    realName:角色名称"
 *    roleIdList:角色集合
 *    status:账户状态
 *    superAdmin:是否为超级管理员
 *    username:用户名称
 * }
 */
export const getUserData = () => {
  return getData().user
}

/**
 * 获取当前用户拥有的权限
 * @returns [
 * "sys:xxx:update",
 * "sys:xxx:delete",
 * "sys:xxx:info",
 *       ……
 *  ]
 */
export const getPermissions = (): string[] => {
  return getData().permissions
}

/**
 * 是否拥有某个权限
 * @param permission 权限文本
 * @returns
 */
export const hasPermission = (permission: string): boolean => {
  return getPermissions().indexOf(permission) != -1
}

export const getServerUrl = (): string => {
  if (app.api == '/') {
    return ''
  }
  return app.api
}

// export const getFile

export const loginTempUser = (username: string) => {
  return new Promise((resolve, reject) => {
    baseService
      .post('/loginTest', {
        username
      })
      .then((res) => {
        let result = false
        if (res.code === 0) {
          setCache(CacheToken, res.data, true)
          result = true
        }
        resolve(result)
      })
      .catch((e) => {
        resolve(false)
      })
  })
}

export default {
  getData
}
