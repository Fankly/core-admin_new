import type { UserInfo, UserRole } from './interface'

export const toUserRole = (role: UserInfo): UserRole => ({
  bmId: role.specialorgid,
  bmName: role.specialorgname,
  dwId: role.org_id,
  dwName: role.org_name,
  specialOrgCode: role.specialorgcode,
  roleId: role.role_id,
  roleCode: role.code,
  spRoleId: role.id
})
