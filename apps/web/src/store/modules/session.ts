import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserProfile } from '@/types/domain'
import { createEmptyUser } from '@/types/domain'
import { removeCache } from '@/utils/cache'
import { CacheToken, Permissions } from '@/constants/cacheKey'

/**
 * 会话域：登录用户、按钮权限、登录态。
 *
 * 与菜单域分开后，页面只依赖自己真正需要的状态；退出登录也不会再误清菜单路由。
 */
export const useSessionStore = defineStore('session', () => {
  const user = ref<UserProfile>(createEmptyUser())
  const permissions = ref<string[]>([])
  const hasPermission = ref(false)
  const isLogin = ref(false)

  const userId = computed(() => user.value.id)
  const userName = computed(() => user.value.name)

  function setUser(payload: Partial<UserProfile> | null | undefined) {
    user.value = { ...createEmptyUser(), ...(payload ?? {}) }
  }

  function setPermissions(payload: string[]) {
    permissions.value = Array.isArray(payload) ? payload : []
  }

  function setHasPermission(payload: boolean) {
    hasPermission.value = Boolean(payload)
  }

  function markLogin(payload = true) {
    isLogin.value = payload
  }

  /** 只重置会话相关状态，不动路由与标签页。 */
  function reset() {
    user.value = createEmptyUser()
    permissions.value = []
    hasPermission.value = false
    isLogin.value = false
  }

  /** 退出登录：清缓存 + 重置会话。导航由调用方决定。 */
  function logout() {
    removeCache(CacheToken, true)
    removeCache(Permissions, true)
    reset()
  }

  return {
    user,
    permissions,
    hasPermission,
    isLogin,
    userId,
    userName,
    setUser,
    setPermissions,
    setHasPermission,
    markLogin,
    reset,
    logout
  }
})
