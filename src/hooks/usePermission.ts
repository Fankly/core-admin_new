import { getMenuMessage } from '@/api/process'
import baseService from '@/service/baseService'
import { checkPermission } from '@/utils/utils'
import { computed, ref, inject } from 'vue'
import { PermissionInjectionKey, PermissionContext } from '@/components/UserRoleSelector/interface'

export const usePermission = () => {
  const injectedContext = inject<PermissionContext>(PermissionInjectionKey)

  if (!injectedContext) {
    console.warn('不存在injectedContext')
  }

  const localPermissions = ref<string[]>([])
  const localIsLoading = ref(false)

  const allPermissions = computed(() => {
    if (injectedContext) {
      return injectedContext.permissions
    }
    return localPermissions.value || []
  })

  const isLoading = computed(() => {
    if (injectedContext) {
      return injectedContext.isLoading
    }
    return localIsLoading.value
  })

  const fetchPermissions = async (menuPath?: string, userInfo?: any): Promise<boolean> => {
    if (localIsLoading.value) return false
    localIsLoading.value = true
    try {
      const targetMenuPath = menuPath
      if (!targetMenuPath) return false
      const result = await getMenuMessage(targetMenuPath)
      if (!result.success || !result.data) return false
      const menuCode = result.data.outsideMenu
      if (!menuCode) return false

      // 按钮权限是按角色（spRoleId）授的，不是按用户
      const spRoleId = userInfo?.spRoleId ?? userInfo?.id
      if (!spRoleId) return false

      const res = await baseService.get(`/sysMenu/getButtonList?menuCode=${menuCode}&spRoleId=${spRoleId}`)

      if (res.success && Array.isArray(res.data)) {
        localPermissions.value = res.data
        return true
      } else {
        localPermissions.value = []
        return false
      }
    } catch (error) {
      localPermissions.value = []
      return false
    } finally {
      localIsLoading.value = false
    }
  }

  const hasPermission = (permissionKey: string): boolean => {
    return checkPermission(allPermissions.value || [], permissionKey)
  }

  const hasAnyPermission = (permissionKey: string[]): boolean => {
    return permissionKey.some((key) => hasPermission(key))
  }

  const hasAllPermissions = (permissionKey: string[]) => {
    return permissionKey.every((key) => hasPermission(key))
  }

  const checkPermissionReactive = (permissionKey: string) => {
    return computed(() => hasPermission(permissionKey))
  }

  const checkAnyPermissionReactive = (permissionKeys: string[]) => {
    return computed(() => hasAnyPermission(permissionKeys))
  }

  const checkAllPermissionsReactive = (permissionKeys: string[]) => {
    return computed(() => hasAllPermissions(permissionKeys))
  }

  const clearPermissions = () => {
    localPermissions.value = []
  }

  return {
    permissions: allPermissions,
    isLoading,
    fetchPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissionReactive,
    checkAnyPermissionReactive,
    checkAllPermissionsReactive,
    clearPermissions
  }
}
