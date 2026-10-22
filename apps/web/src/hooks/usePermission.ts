import { getMenuMessage } from '@/api/process'
import { getButtonList } from '@/api/permission'
import { checkPermission } from '@/utils/utils'
import { handleError } from '@/utils/error'
import { computed, ref, inject, onScopeDispose } from 'vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'

interface PermissionUser {
  spRoleId?: string
  id?: string
}

export const usePermission = () => {
  const injectedContext = inject(PermissionInjectionKey, undefined)

  const localPermissions = ref<string[]>([])
  const localIsLoading = ref(false)
  let requestId = 0
  let isDisposed = false

  onScopeDispose(() => {
    isDisposed = true
    requestId++
    localIsLoading.value = false
  })

  const allPermissions = computed(() => {
    if (injectedContext) {
      return injectedContext.permissions
    }
    return localPermissions.value
  })

  const isLoading = computed(() => {
    if (injectedContext) {
      return injectedContext.isLoading
    }
    return localIsLoading.value
  })

  const fetchPermissions = async (menuPath?: string, userInfo?: PermissionUser): Promise<boolean> => {
    if (isDisposed) return false
    const currentRequest = ++requestId
    localPermissions.value = []
    localIsLoading.value = true
    try {
      const targetMenuPath = menuPath
      if (!targetMenuPath) return false
      const result = await getMenuMessage(targetMenuPath)
      if (currentRequest !== requestId) return false
      if (!result.success || !result.data) throw new Error(result.msg || '获取菜单信息失败')
      const menuCode = result.data.outsideMenu
      if (!menuCode) return false

      // 按钮权限是按角色（spRoleId）授的，不是按用户
      const spRoleId = userInfo?.spRoleId ?? userInfo?.id
      if (!spRoleId) return false

      const res = await getButtonList(menuCode, spRoleId)
      if (currentRequest !== requestId) return false

      if (res.success && Array.isArray(res.data)) {
        localPermissions.value = res.data
        return true
      } else {
        throw new Error(res.msg || '获取按钮权限失败')
      }
    } catch (error) {
      if (currentRequest !== requestId) return false
      handleError(error, '获取权限失败')
      return false
    } finally {
      if (currentRequest === requestId) localIsLoading.value = false
    }
  }

  const hasPermission = (permissionKey: string): boolean => {
    return checkPermission(allPermissions.value, permissionKey)
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
    // 清除权限也使在途响应失效，避免退出页面后恢复旧角色的权限。
    requestId++
    localPermissions.value = []
    localIsLoading.value = false
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
