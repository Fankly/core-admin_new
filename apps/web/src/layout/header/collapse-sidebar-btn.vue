<template>
  <button class="collapse-trigger hidden-xs-only" type="button" aria-label="收起或展开侧边栏" @click="preferences.toggleSidebarCollapse()">
    <svg-icon :name="preferences.sidebarCollapse ? 'indent' : 'outdent'" />
  </button>
  <button class="collapse-trigger hidden-sm-and-up show-xs-only" type="button" aria-label="打开导航菜单" @click="shell.toggleMobileSidebar()">
    <svg-icon name="indent" />
  </button>
</template>

<script setup lang="ts">
import SvgIcon from '@/components/base/svg-icon'
import { usePreferencesStore, useShellStore } from '@/store'

/** PC 和移动端下的侧边栏展开收起按钮 */
defineOptions({ name: 'CollapseSidebarBtn' })

const preferences = usePreferencesStore()
const shell = useShellStore()
</script>

<style scoped>
.collapse-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: none;
  border: 0;
}
</style>
