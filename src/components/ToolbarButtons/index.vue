<template>
  <div class="tool-button">
    <ReText
      v-if="showToolButton('setting')"
      class="tool-button__icon el-icon-s-operation"
      tooltip-content="列设置"
      role="button"
      aria-label="列设置"
      @click="emit('setting-click')"
      @keydown.enter="emit('setting-click')"
      @keydown.space.prevent="emit('setting-click')"
    />
    <ReText
      v-if="showToolButton('search')"
      class="tool-button__icon"
      tooltip-content="隐藏/展示查询"
      role="button"
      aria-label="隐藏/展示查询"
      @click="toggleSearch"
      @keydown.enter="toggleSearch"
      @keydown.space.prevent="toggleSearch"
    >
      <i :class="searchVisible ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
    </ReText>
    <ReText
      v-if="showToolButton('help')"
      class="tool-button__icon toolbar-guide-icon"
      tooltip-content="帮助"
      role="button"
      aria-label="帮助"
      @click="emit('help-click')"
      @keydown.enter="emit('help-click')"
      @keydown.space.prevent="emit('help-click')"
    >
      <i class="el-icon-question"></i>
    </ReText>
  </div>
</template>

<script setup lang="ts" name="ToolbarButtons">
import ReText from '@/components/ReText/src/index.vue'

type ToolButtonKey = 'help' | 'setting' | 'search' | 'other'

const props = withDefaults(
  defineProps<{
    toolButton?: ToolButtonKey[] | boolean
    searchVisible?: boolean
  }>(),
  {
    toolButton: () => true as ToolButtonKey[] | boolean,
    searchVisible: true
  }
)

const emit = defineEmits<{
  (e: 'setting-click'): void
  (e: 'help-click'): void
  (e: 'search-click', visible: boolean): void
  (e: 'update:searchVisible', visible: boolean): void
}>()

const showToolButton = (key: ToolButtonKey) => {
  return Array.isArray(props.toolButton) ? props.toolButton.includes(key) : props.toolButton
}

const toggleSearch = () => {
  const visible = !props.searchVisible
  emit('update:searchVisible', visible)
  emit('search-click', visible)
}
</script>

<style scoped lang="less">
.tool-button {
  display: inline-flex;
  align-items: center;
  gap: 15px;
}

:deep(.tool-button__icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  cursor: pointer;
  color: var(--el-text-color-secondary, #64748b);
  font-size: 15px;
  line-height: 1;
  outline: none;
  transition: color 0.12s ease;

  &:hover,
  &:focus-visible {
    color: #00706b;
  }

  &:focus-visible {
    outline: 2px solid #00706b;
    outline-offset: 2px;
    border-radius: 2px;
  }
}
</style>
