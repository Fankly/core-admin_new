import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 应用外壳域：启动生命周期、全局 loading、刷新信号、移动端抽屉。
 *
 * 这里不保存业务数据，只保存“界面外壳”状态，方便 layout 与页面解耦。
 */
export const useShellStore = defineStore('shell', () => {
  /** 动态路由与用户信息已就绪 */
  const isReady = ref(false)
  /** 首屏遮罩可以撤下（与 isReady 分开是为了留出过渡时间） */
  const isRendered = ref(false)
  /** 路由级加载条 */
  const isRouteLoading = ref(false)
  /** 页面级全屏 loading */
  const isLoading = ref(false)
  /** 自增后 layout 会重建 router-view，实现“刷新当前页” */
  const reloadToken = ref(0)
  /** 首页是否有当前角色权限，由 UserRoleSelector 写入 */
  const mainPageRole = ref(true)
  /** 移动端侧边栏抽屉 */
  const mobileSidebarOpen = ref(false)
  /** 混合导航当前选中的一级菜单 */
  const activeTopMenu = ref('')

  const canRender = computed(() => isReady.value)

  function markReady() {
    isReady.value = true
  }

  function markRendered() {
    isRendered.value = true
  }

  function reset() {
    isReady.value = false
    isRendered.value = false
    isRouteLoading.value = false
    isLoading.value = false
    mainPageRole.value = true
    mobileSidebarOpen.value = false
    activeTopMenu.value = ''
  }

  function setRouteLoading(payload: boolean) {
    isRouteLoading.value = payload
  }

  function setLoading(payload: boolean) {
    isLoading.value = payload
  }

  function showLoading() {
    isLoading.value = true
  }

  function hideLoading() {
    isLoading.value = false
  }

  function reloadCurrentPage() {
    reloadToken.value += 1
  }

  function setMainPageRole(payload: boolean) {
    mainPageRole.value = payload
  }

  function toggleMobileSidebar(payload?: boolean) {
    mobileSidebarOpen.value = payload ?? !mobileSidebarOpen.value
  }

  function setActiveTopMenu(path: string) {
    activeTopMenu.value = path
  }

  return {
    isReady,
    isRendered,
    isRouteLoading,
    isLoading,
    reloadToken,
    mainPageRole,
    mobileSidebarOpen,
    activeTopMenu,
    canRender,
    markReady,
    markRendered,
    reset,
    setRouteLoading,
    setLoading,
    showLoading,
    hideLoading,
    reloadCurrentPage,
    setMainPageRole,
    toggleMobileSidebar,
    setActiveTopMenu
  }
})
