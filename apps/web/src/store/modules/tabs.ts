import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { TabItem } from '@/types/domain'

/** 固定标签页：不可关闭，且始终位于最前。 */
const AFFIX_TABS: readonly TabItem[] = [{ path: '/home', title: '主页', affix: true, keepAlive: true }]

const cloneAffixTabs = (): TabItem[] => AFFIX_TABS.map((tab) => ({ ...tab }))

/**
 * 标签页域。
 *
 * 原实现把“打开/关闭/缓存/激活”散落在 tabs.vue、App.vue 与路由守卫里，
 * 并通过事件总线互相同步；这里收敛为纯状态机，组件只负责渲染与导航。
 */
export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>(cloneAffixTabs())
  const activePath = ref(tabs.value[0]?.path ?? '')
  const closedPaths = ref<string[]>([])
  const cachedViews = ref<string[]>([])

  const activeTab = computed(() => tabs.value.find((tab) => tab.path === activePath.value))
  const canClose = computed(() => tabs.value.some((tab) => !tab.affix))

  /** 各批量关闭操作实际会关掉的标签数，与 closeLeft / closeRight / closeOthers / closeAll 同一规则（跳过固定页）。 */
  const closableCounts = computed(() => {
    const index = tabs.value.findIndex((tab) => tab.path === activePath.value)
    const count = (predicate: (tab: TabItem, i: number) => boolean) => tabs.value.filter((tab, i) => !tab.affix && predicate(tab, i)).length
    return {
      left: index <= 0 ? 0 : count((_, i) => i < index),
      right: index === -1 ? 0 : count((_, i) => i > index),
      others: count((tab) => tab.path !== activePath.value),
      all: count(() => true)
    }
  })

  function isAffix(path: string): boolean {
    return tabs.value.some((tab) => tab.path === path && tab.affix)
  }

  function cacheView(tab: TabItem) {
    if (tab.keepAlive === false) return
    if (!cachedViews.value.includes(tab.path)) cachedViews.value.push(tab.path)
  }

  function uncacheView(path: string) {
    cachedViews.value = cachedViews.value.filter((item) => item !== path)
  }

  /** 打开（或激活）一个标签页。 */
  function openTab(tab: TabItem) {
    if (!tab.path || tab.path.includes('/error')) return
    const existing = tabs.value.find((item) => item.path === tab.path)
    if (existing) {
      existing.title = tab.title || existing.title
      existing.meta = tab.meta ?? existing.meta
      existing.keepAlive = tab.keepAlive ?? existing.keepAlive
      activePath.value = tab.path
      cacheView(existing)
      closedPaths.value = closedPaths.value.filter((path) => path !== tab.path)
      return
    }
    tabs.value.push({ ...tab })
    activePath.value = tab.path
    cacheView(tab)
    closedPaths.value = closedPaths.value.filter((path) => path !== tab.path)
  }

  function activate(path: string) {
    if (tabs.value.some((tab) => tab.path === path)) activePath.value = path
  }

  /** 关闭标签页，返回关闭后应跳转的路径（无需跳转时返回 undefined）。 */
  function closeTab(path: string): string | undefined {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index === -1 || tabs.value[index].affix) return undefined
    const wasActive = activePath.value === path
    tabs.value.splice(index, 1)
    uncacheView(path)
    if (!closedPaths.value.includes(path)) closedPaths.value.push(path)
    if (!wasActive) return undefined
    const fallback = tabs.value.at(Math.min(index, tabs.value.length - 1))
    activePath.value = fallback?.path ?? ''
    return activePath.value || undefined
  }

  function closeCurrent(): string | undefined {
    return closeTab(activePath.value)
  }

  function markClosed(removed: TabItem[]) {
    removed.forEach((tab) => {
      uncacheView(tab.path)
      if (!closedPaths.value.includes(tab.path)) closedPaths.value.push(tab.path)
    })
  }

  function closeOthers(): void {
    const removed = tabs.value.filter((tab) => !tab.affix && tab.path !== activePath.value)
    tabs.value = tabs.value.filter((tab) => tab.affix || tab.path === activePath.value)
    markClosed(removed)
  }

  function closeAll(): string {
    const removed = tabs.value.filter((tab) => !tab.affix)
    tabs.value = cloneAffixTabs()
    cachedViews.value = tabs.value.map((tab) => tab.path)
    markClosed(removed)
    activePath.value = tabs.value[0]?.path ?? ''
    return activePath.value
  }

  function closeLeft(): void {
    const index = tabs.value.findIndex((tab) => tab.path === activePath.value)
    if (index <= 0) return
    const removed = tabs.value.filter((tab, i) => !tab.affix && i < index)
    tabs.value = tabs.value.filter((tab, i) => tab.affix || i >= index)
    markClosed(removed)
  }

  function closeRight(): void {
    const index = tabs.value.findIndex((tab) => tab.path === activePath.value)
    if (index === -1) return
    const removed = tabs.value.filter((tab, i) => !tab.affix && i > index)
    tabs.value = tabs.value.filter((tab, i) => tab.affix || i <= index)
    markClosed(removed)
  }

  function syncActive(path: string) {
    if (tabs.value.some((tab) => tab.path === path)) activePath.value = path
  }

  /** 退出登录时恢复初始状态。 */
  function reset() {
    tabs.value = cloneAffixTabs()
    activePath.value = tabs.value[0]?.path ?? ''
    closedPaths.value = []
    cachedViews.value = AFFIX_TABS.filter((tab) => tab.keepAlive !== false).map((tab) => tab.path)
  }

  reset()

  return {
    tabs,
    activePath,
    closedPaths,
    cachedViews,
    activeTab,
    canClose,
    closableCounts,
    isAffix,
    openTab,
    activate,
    closeTab,
    closeCurrent,
    closeOthers,
    closeAll,
    closeLeft,
    closeRight,
    syncActive,
    reset
  }
})
