import type { UserRole } from '@/components/UserRoleSelector/interface'
import type { CrudQueryParams } from '@/views/suzhou/common/types/crud'

export const cleanQueryParams = (params: CrudQueryParams = {}) => {
  return Object.keys(params).reduce<CrudQueryParams>((target, key) => {
    const value = params[key]
    if (value !== '' && value !== null && value !== undefined) {
      target[key] = value
    }
    return target
  }, {})
}

export const getRoleQueryParams = (role?: UserRole) => {
  const params: CrudQueryParams = {}
  if (!role) return params
  if (role.bmId) params.bmId = role.bmId
  if (role.dwId) params.dwId = role.dwId
  if (role.roleId) params.roleId = role.roleId
  if (role.roleCode) params.roleCode = role.roleCode
  if (role.spRoleId) params.spRoleId = role.spRoleId
  return params
}
