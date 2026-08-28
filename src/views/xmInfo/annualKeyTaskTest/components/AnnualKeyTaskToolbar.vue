<template>
  <div class="task-toolbar">
    <div class="task-toolbar__tools">
      <ToolbarButtons
        :tool-button="['setting', 'search', 'help']"
        :search-visible="searchVisible"
        @setting-click="$emit('setting-click')"
        @search-click="$emit('toggle-search')"
        @help-click="$emit('help')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

withDefaults(
  defineProps<{
    searchVisible?: boolean
  }>(),
  {
    searchVisible: true
  }
)

defineEmits(['setting-click', 'toggle-search', 'help'])
</script>

<style scoped lang="less">
.task-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  min-height: 48px;
  padding: 10px 12px;
  box-sizing: border-box;
  border-bottom: 1px solid #eef2f6;
  background-color: #fcffff;
}

.task-toolbar__tools {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}
</style>
