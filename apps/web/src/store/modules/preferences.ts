import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { themeSetting } from '@/constants/config'
import { EThemeColor, ESidebarLayoutEnum, EThemeSetting } from '@/constants/enum'
import { getThemeConfigCache, getThemeConfigToClass, setThemeColor, setThemeConfigToCache } from '@/utils/theme'

export type ThemeValue = string | boolean | number
export type ThemeConfig = Record<string, ThemeValue>

/**
 * 偏好设置域：主题、导航布局、标签页开关等。
 *
 * 读取时合并默认值，写入时同步缓存；界面只依赖 store，不再通过事件总线广播。
 */
export const usePreferencesStore = defineStore('preferences', () => {
  const config = ref<ThemeConfig>({ ...themeSetting, ...getThemeConfigCache() })

  const navLayout = computed(() => (config.value[EThemeSetting.NavLayout] as ESidebarLayoutEnum) ?? ESidebarLayoutEnum.Left)
  const sidebarCollapse = computed(() => Boolean(config.value[EThemeSetting.SidebarCollapse]))
  const openTabsPage = computed(() => Boolean(config.value[EThemeSetting.OpenTabsPage]))
  const tabStyle = computed(() => String(config.value[EThemeSetting.TabStyle] ?? 'default'))
  const themeColor = computed(() => String(config.value[EThemeSetting.ThemeColor] ?? themeSetting.themeColor))
  const themeClasses = computed(() => getThemeConfigToClass(config.value))

  function set(key: EThemeSetting, value: ThemeValue) {
    config.value = { ...config.value, [key]: value }
    setThemeConfigToCache(key, value)
    if (key === EThemeSetting.ThemeColor) setThemeColor(EThemeColor.ThemeColor, String(value))
  }

  function setMany(payload: Partial<Record<EThemeSetting, ThemeValue>>) {
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) set(key as EThemeSetting, value)
    }
  }

  function setNavLayout(value: ESidebarLayoutEnum) {
    set(EThemeSetting.NavLayout, value)
  }

  function toggleSidebarCollapse() {
    set(EThemeSetting.SidebarCollapse, !sidebarCollapse.value)
  }

  /** 把缓存的品牌色真正写入 CSS 变量，应用启动时调用一次。 */
  function applyTheme() {
    setThemeColor(EThemeColor.ThemeColor, themeColor.value)
  }

  function reset() {
    config.value = { ...themeSetting }
    for (const key of Object.values(EThemeSetting)) {
      setThemeConfigToCache(key, config.value[key])
    }
    applyTheme()
  }

  return {
    config,
    navLayout,
    sidebarCollapse,
    openTabsPage,
    tabStyle,
    themeColor,
    themeClasses,
    set,
    setMany,
    setNavLayout,
    toggleSidebarCollapse,
    applyTheme,
    reset
  }
})
