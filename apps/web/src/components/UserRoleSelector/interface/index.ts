import type { Ref, InjectionKey } from 'vue'

export type { UserInfo } from '@/api/permission/types'

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
export const CurrentUserRoleInjectionKey: InjectionKey<Ref<UserRole>> = Symbol('CurrentUserRole')
