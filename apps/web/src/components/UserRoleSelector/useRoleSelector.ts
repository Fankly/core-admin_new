import { useMenuStore, useSessionStore, useShellStore, useTabsStore } from '@/store'
import { useRoute, useRouter } from 'vue-router'
import { inject, onActivated, onDeactivated, onUnmounted, provide, reactive, ref } from 'vue'
import type { UserInfo } from '@/components/UserRoleSelector/interface'
import { CurrentUserRoleInjectionKey, PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import { getButtonList, getRoleByBusicode } from '@/api/permission'
import { ElMessage } from 'element-plus'
import { getMenuMessage } from '@/api/process'
import { handleError } from '@/utils/error'

import { toUserRole } from './role'

export const useRoleSelector = (emit: (event: 'loadCompany') => void) => {
  const menu = useMenuStore()
  const session = useSessionStore()
  const shell = useShellStore()
  const tabs = useTabsStore()
  const route = useRoute()
  const router = useRouter()

  const dialogVisible = ref(false)
  const canRender = ref(false)
  const selectedRoleId = ref('')
  const roleList = ref<UserInfo[]>([])
  const loading = ref(false)
  const currentMenuId = ref('')
  const injectedRole = inject(CurrentUserRoleInjectionKey)
  if (!injectedRole) throw new Error('UserRoleSelector 需要通过 CurrentUserRoleInjectionKey 提供当前角色')
  const currentUserRole = injectedRole
  let isActive = true
  let isDisposed = false
  let requestSequence = 0

  const permissions = ref<string[]>([])
  provide(PermissionInjectionKey, reactive({ permissions, isLoading: loading }))

  onDeactivated(() => {
    isActive = false
  })
  onUnmounted(() => {
    isActive = false
    isDisposed = true
    requestSequence += 1
  })

  // 权限没取到时必须连 store 一起清空，否则页面会继续用上一个菜单残留的权限渲染
  const resetPermissions = () => {
    permissions.value = []
    canRender.value = false
    if (isActive) session.setPermissions([])
  }

  const handleNoPermission = () => {
    resetPermissions()
    if (!isActive) return
    ElMessage({
      message: '无权限访问页面',
      customClass: 'tipsBox'
    })
    if (menu.menuMsg.url === '/home') {
      shell.setMainPageRole(false)
    }
    tabs.closeTab(tabs.activePath)
    void router.replace('/home')
  }

  const handleNoMenuId = () => {
    resetPermissions()
    if (!isActive) return
    ElMessage({
      type: 'error',
      message: '当前菜单未绑定ID'
    })
    const target = tabs.tabs.find((tab) => tab.path === route.path)
    if (target) tabs.closeTab(target.path)
    router.back()
  }

  const setCurrentUserRole = (roleData: UserInfo) => {
    Object.assign(currentUserRole.value, toUserRole(roleData))
  }

  const resolveCurrentMenuId = async () => {
    const menuUrl = route.meta.url || route.path || menu.menuMsg.url || ''
    if (!menuUrl) return ''

    // 菜单信息在路由守卫里已经从 routeToMeta 提交进 menuMsg，命中缓存就不必再问一次后端
    const routeMenu = (menu.routeToMeta[route.path] as typeof route.meta | undefined) ?? route.meta
    const currentMenu = menu.menuMsg
    const cachedMenuId = routeMenu.outsideMenu || (currentMenu.url === menuUrl ? currentMenu.outsideMenu : '')
    if (cachedMenuId) return cachedMenuId

    // 缓存里没有（如直接进外链页、菜单树尚未合并）才回退到接口
    const result = await getMenuMessage(menuUrl)
    if (result.success && result.data?.outsideMenu) {
      if (isActive && !isDisposed) menu.setMenuMessage({ ...result.data, url: menuUrl })
      return result.data.outsideMenu
    }

    return ''
  }

  const getUser = async () => {
    // 页面可能在 onMounted 与 onActivated 里各调一次，重入会打出两轮请求并让后到的响应覆盖前一个
    if (loading.value || isDisposed) return
    const sequence = ++requestSequence
    const isCurrent = () => !isDisposed && sequence === requestSequence
    loading.value = true
    dialogVisible.value = false
    selectedRoleId.value = ''
    roleList.value = []
    resetPermissions()
    try {
      const userId = session.user.id
      currentMenuId.value = await resolveCurrentMenuId()
      if (!isCurrent()) return
      if (!currentMenuId.value) {
        handleNoMenuId()
        return
      }
      // 该接口直接返回数组，失败时不是数组，不能拿 length 判空（否则会落到「多角色」分支弹出空选择框）
      const roles = await getRoleByBusicode(userId, currentMenuId.value)
      if (!isCurrent()) return
      if (!Array.isArray(roles)) {
        resetPermissions()
        if (isActive) ElMessage.error('获取角色失败，请稍后重试')
        return
      }

      if (roles.length === 1) {
        setCurrentUserRole(roles[0])
        await loadPermissions(sequence)
      } else if (roles.length === 0) {
        handleNoPermission()
      } else {
        selectedRoleId.value = ''
        roleList.value = roles
        dialogVisible.value = true
      }
    } catch (e) {
      if (!isCurrent()) return
      resetPermissions()
      if (isActive) handleError(e, '获取角色失败，请稍后重试')
    } finally {
      if (isCurrent()) loading.value = false
    }
  }

  const loadPermissions = async (sequence: number) => {
    const roleId = currentUserRole.value.spRoleId
    const isCurrent = () => !isDisposed && sequence === requestSequence && roleId === currentUserRole.value.spRoleId
    try {
      const result = await getButtonList(currentMenuId.value, roleId)
      if (!isCurrent()) return
      if (!result.success || !Array.isArray(result.data)) throw new Error(result.msg || '权限响应格式错误')
      permissions.value = result.data
      if (isActive) session.setPermissions([...result.data])
      canRender.value = true
      dialogVisible.value = false
      emit('loadCompany')
    } catch (error) {
      if (!isCurrent()) return
      resetPermissions()
      if (isActive) handleError(error, '获取按钮权限失败')
    }
  }

  const confirmRole = async () => {
    if (loading.value || isDisposed) return
    if (!currentUserRole.value.bmId || !selectedRoleId.value) {
      ElMessage({ message: '请选择角色再确定', customClass: 'tipsBox' })
      return
    }
    const sequence = ++requestSequence
    loading.value = true
    try {
      await loadPermissions(sequence)
    } finally {
      if (sequence === requestSequence) loading.value = false
    }
  }

  // keep-alive 缓存页返回时组件不会重新 mounted，但 session.permissions 可能已被别的页面覆盖，
  // 这里把本页已取到的权限重新提交回去，无需再发请求
  // 判断依据只能是 canRender（权限已取到），不能用 permissions.length —— 零权限角色也是合法结果
  onActivated(() => {
    isActive = true
    if (canRender.value) {
      session.setPermissions([...permissions.value])
    }
  })

  const cancel = () => {
    requestSequence += 1
    loading.value = false
    dialogVisible.value = false
    const page = tabs.tabs.find((tab) => tab.path === route.path)
    if (page) tabs.closeTab(page.path)
    router.back()
  }

  // confirmRole 已取过按钮权限，这里直接返回缓存结果，不再重复请求
  const getButtonPermissions = (): string[] => [...permissions.value]

  return {
    dialogVisible,
    selectedRoleId,
    roleList,
    confirmRole,
    cancel,
    setCurrentUserRole,
    loading,
    getUser,
    getButtonPermissions,
    currentUserRole,
    canRender,
    permissions
  }
}
