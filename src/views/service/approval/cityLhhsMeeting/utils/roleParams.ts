export interface RoleRequestParams {
  bmId?: string
  roleId?: string
  roleCode?: string
  dwId?: string
}

export const buildRoleRequestParams = (roleInfo: any = {}): RoleRequestParams => ({
  bmId: roleInfo.bmId ?? roleInfo.deptId ?? '',
  roleId: roleInfo.roleId ?? '',
  roleCode: roleInfo.roleCode ?? '',
  dwId: roleInfo.dwId ?? ''
})

export const appendRoleRequestParams = <T extends Record<string, any>>(params: T, roleInfo: any = {}): T & RoleRequestParams => {
  return Object.assign(params, buildRoleRequestParams(roleInfo))
}
