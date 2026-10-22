<template>
  <button
    v-if="showCollapse"
    class="ds-icon-button ds-collapse-trigger"
    type="button"
    :aria-label="preferences.sidebarCollapse ? '展开侧边导航' : '收起侧边导航'"
    :title="preferences.sidebarCollapse ? '展开侧边导航' : '收起侧边导航'"
    @click="preferences.toggleSidebarCollapse()"
  >
    <PanelLeftOpen v-if="preferences.sidebarCollapse" :size="17" :stroke-width="1.8" aria-hidden="true" />
    <PanelLeftClose v-else :size="17" :stroke-width="1.8" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import { usePreferencesStore } from '@/store'

defineOptions({ name: 'CollapseSidebarBtn' })

interface Props {
  /** The top-navigation layout has no rail to collapse. */
  showCollapse?: boolean
}

withDefaults(defineProps<Props>(), { showCollapse: true })

const preferences = usePreferencesStore()
</script>
