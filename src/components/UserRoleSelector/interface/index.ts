import type { Ref, InjectionKey } from 'vue'

export interface UserInfo {
  code: string
  createDate: null | string
  description: null | string
  dimId: null | string
  dispOrder: null | string
  group_id: null | string
  group_name: null | string
  id: string
  info: string
  name: string
  orgTypeId: null | string
  org_id: string
  org_name: string
  role_id: string
  rolename: string
  spRoleCode: string
  specialorgcode: string
  specialorgid: string
  specialorgname: string
  sproleAuthRange: string | null
  state: null | string
  sysRole: null | string
  systemId: string
  systemName: string
  targetDataId: null | string
  type: null | string
  typeName: null | string
}

export interface UserRole {
  bmName: string
  dwName: string
  bmId: string
  roleId: string
  roleCode: string
  dwId: string
  specialOrgCode: string
  spRoleId: string
}

export interface PermissionContext {
  permissions: string[]
  isLoading: boolean
}

export const PermissionInjectionKey: InjectionKey<PermissionContext> = Symbol('PermissionContext')
