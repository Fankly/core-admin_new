<template>
  <div class="hidden-xs-only" @click="onClickSidebarSwitcher">
    <svg-icon :name="collapseSidebar ? 'indent' : 'outdent'"></svg-icon>
  </div>
  <div class="hidden-sm-and-up show-xs-only" @click="onClickSidebarSwitcherByMobile">
    <svg-icon name="icon-indent"></svg-icon>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import SvgIcon from '@/components/base/svg-icon'
import { EMitt, EThemeSetting } from '@/constants/enum'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey, setThemeConfigToCache } from '@/utils/theme'

/**
 * PC和移动端下的侧边栏展开收起按钮
 */
defineOptions({ name: 'CollapseSidebarBtn' })

const collapseSidebar = ref(getThemeConfigCacheByKey(EThemeSetting.SidebarCollapse))

const onClickSidebarSwitcher = () => {
  const key = EThemeSetting.SidebarCollapse
  collapseSidebar.value = !collapseSidebar.value
  emits.emit(EMitt.OnSwitchLeftSidebar)
  emits.emit(EMitt.OnSetTheme, [key, key + '-' + collapseSidebar.value])
  setThemeConfigToCache(key, collapseSidebar.value)
}
const onClickSidebarSwitcherByMobile = () => {
  emits.emit(EMitt.OnMobileOpenSidebar)
}
</script>
