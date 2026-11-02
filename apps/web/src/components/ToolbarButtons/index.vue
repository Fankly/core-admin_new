<template>
  <div class="tool-button">
    <el-tooltip v-if="showToolButton('setting')" content="列设置" placement="top">
      <button type="button" class="tool-button__icon" aria-label="列设置" @click="emit('setting-click')"
        ><el-icon><Operation /></el-icon
      ></button>
    </el-tooltip>
    <el-tooltip v-if="showToolButton('search')" content="隐藏/展示查询" placement="top">
      <button type="button" class="tool-button__icon" aria-label="隐藏/展示查询" :aria-expanded="searchVisible" @click="toggleSearch">
        <el-icon><ArrowUp v-if="searchVisible" /><ArrowDown v-else /></el-icon>
      </button>
    </el-tooltip>
    <el-tooltip v-if="showToolButton('help')" content="帮助" placement="top">
      <button type="button" class="tool-button__icon toolbar-guide-icon" aria-label="帮助" @click="emit('help-click')"
        ><el-icon><QuestionFilled /></el-icon
      ></button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, Operation, QuestionFilled } from '@element-plus/icons-vue'
import type { ToolButtonKey } from '@/components/ProTable/interface'

defineOptions({ name: 'ToolbarButtons' })

const searchVisible = defineModel<boolean>('searchVisible', { default: true })

const props = withDefaults(
  defineProps<{
    toolButton?: ToolButtonKey[] | boolean
  }>(),
  {
    toolButton: () => true
  }
)

const emit = defineEmits<{
  (e: 'setting-click' | 'help-click'): void
  (e: 'search-click', visible: boolean): void
}>()

const showToolButton = (key: ToolButtonKey) => {
  return Array.isArray(props.toolButton) ? props.toolButton.includes(key) : props.toolButton
}

const toggleSearch = () => {
  const visible = !searchVisible.value
  searchVisible.value = visible
  emit('search-click', visible)
}
</script>

<style scoped lang="less">
.tool-button {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
}

.tool-button__icon {
  padding: 0;
  border: 1px solid var(--ds-line);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-height-sm);
  height: var(--ds-control-height-sm);
  cursor: pointer;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-lg);
  line-height: 1;
  outline: none;
  transition:
    color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease;

  &:hover,
  &:focus-visible {
    color: var(--ds-jade-700);
    background: var(--ds-jade-50);
    border-color: var(--ds-jade-200);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-jade-500);
    outline-offset: 2px;
  }
}
</style>
