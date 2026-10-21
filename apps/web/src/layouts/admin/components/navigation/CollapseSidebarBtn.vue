<template>
  <button
    v-if="showCollapse"
    class="ds-icon-button ds-collapse-trigger ds-collapse-trigger--desktop"
    type="button"
    :aria-label="preferences.sidebarCollapse ? '展开侧边导航' : '收起侧边导航'"
    :title="preferences.sidebarCollapse ? '展开侧边导航' : '收起侧边导航'"
    @click="preferences.toggleSidebarCollapse()"
  >
    <PanelLeftOpen v-if="preferences.sidebarCollapse" :size="17" :stroke-width="1.8" aria-hidden="true" />
    <PanelLeftClose v-else :size="17" :stroke-width="1.8" aria-hidden="true" />
  </button>
  <button
    class="ds-icon-button ds-collapse-trigger ds-collapse-trigger--mobile"
    type="button"
    aria-label="打开导航菜单"
    title="打开导航菜单"
    @click="shell.toggleMobileSidebar()"
  >
    <Menu :size="18" :stroke-width="1.8" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { Menu, PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import { usePreferencesStore, useShellStore } from '@/store'

defineOptions({ name: 'CollapseSidebarBtn' })

interface Props {
  /** The top-navigation layout has no rail to collapse. */
  showCollapse?: boolean
}

withDefaults(defineProps<Props>(), { showCollapse: true })

const preferences = usePreferencesStore()
const shell = useShellStore()
</script>

<style scoped>
.ds-collapse-trigger--mobile {
  display: none;
}

@media (max-width: 960px) {
  .ds-collapse-trigger--desktop {
    display: none;
  }

  .ds-collapse-trigger--mobile {
    display: inline-flex;
  }
}
</style>
