<template>
  <div class="opeartion">
    <div class="left">
      <el-dropdown trigger="click" :disabled="disabled" @command="handleTaskCommand">
        <el-button type="primary" size="mini" plain :disabled="disabled">
          <el-icon class="btn-icon"><SlidersHorizontal /></el-icon>
          任务管理<i class="el-icon-arrow-down task-manage__icon"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="create-task" :disabled="disabled">
              <el-icon class="dropdown-item-icon"><Plus /></el-icon>
              创建任务
            </el-dropdown-item>
            <el-dropdown-item command="redo-task" :disabled="disabled || !isSingleSelected">
              <el-icon class="dropdown-item-icon"><RotateCcw /></el-icon>
              原规则重新执行
              <span v-if="!isSingleSelected" class="dropdown-item-hint">{{ singleSelectHint }}</span>
            </el-dropdown-item>
            <el-dropdown-item command="redo-task-with-complete-rule" :disabled="disabled || !isSingleSelected">
              <el-icon class="dropdown-item-icon"><Sparkles /></el-icon>
              补全规则重新执行
              <span v-if="!isSingleSelected" class="dropdown-item-hint">{{ singleSelectHint }}</span>
            </el-dropdown-item>
            <el-dropdown-item command="delete-task" divided class="dropdown-item--danger" :disabled="disabled || !hasSelected">
              <el-icon class="dropdown-item-icon dropdown-item-icon--danger"><Trash2 /></el-icon>
              删除任务
              <span v-if="!hasSelected" class="dropdown-item-hint">需先选择任务</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-tooltip :content="priorityDisabledReason" :disabled="!priorityDisabledReason" placement="bottom" effect="light">
        <span class="toolbar-action">
          <el-button type="primary" size="mini" plain :disabled="disabled || !hasSelected" @click="$emit('open-priority')">
            <el-icon class="btn-icon"><SlidersHorizontal /></el-icon>
            修改优先级
          </el-button>
        </span>
      </el-tooltip>

      <el-tooltip :content="progressDisabledReason" :disabled="!progressDisabledReason" placement="bottom" effect="light">
        <span class="toolbar-action">
          <el-button type="primary" size="mini" plain :disabled="disabled || !isSingleSelected" @click="$emit('open-progress')">
            <el-icon class="btn-icon"><Activity /></el-icon>
            任务进度
          </el-button>
        </span>
      </el-tooltip>

      <el-button type="primary" size="mini" plain :disabled="disabled" @click="$emit('export')">
        <el-icon class="btn-icon"><Download /></el-icon>
        导出
      </el-button>

      <span v-if="hasSelected" class="toolbar-selected-count" aria-live="polite">已选 {{ selectedCount }} 条</span>
    </div>
    <div class="right">
      <ToolbarButtons
        :tool-button="toolButtons"
        :search-visible="searchVisible"
        @setting-click="$emit('setting-click')"
        @search-click="$emit('toggle-search')"
        @help-click="$emit('help')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import type { PropType } from 'vue'
import { Activity, Download, Plus, RotateCcw, SlidersHorizontal, Sparkles, Trash2 } from '@/views/ai/workbenchView/icons'

type ToolButtonKey = 'setting' | 'search' | 'help'
type TaskCommand = 'create-task' | 'redo-task' | 'redo-task-with-complete-rule' | 'delete-task'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  searchVisible: {
    type: Boolean,
    default: true
  },
  /** 表格已勾选的任务条数，用于前置约束需要选中行的操作 */
  selectedCount: {
    type: Number,
    default: 0
  },
  toolButtons: {
    type: Array as PropType<ToolButtonKey[]>,
    default: () => ['setting', 'search', 'help']
  }
})

const emit = defineEmits([
  'create-task',
  'redo-task',
  'redo-task-with-complete-rule',
  'delete-task',
  'open-priority',
  'setting-click',
  'toggle-search',
  'help',
  'open-progress',
  'export'
])

const hasSelected = computed(() => props.selectedCount > 0)
const isSingleSelected = computed(() => props.selectedCount === 1)
const singleSelectHint = computed(() => (hasSelected.value ? '仅支持单条任务' : '需先选择任务'))
const priorityDisabledReason = computed(() => {
  if (props.disabled) return ''
  return hasSelected.value ? '' : '请先在列表中选择任务'
})
const progressDisabledReason = computed(() => {
  if (props.disabled || isSingleSelected.value) return ''
  return hasSelected.value ? '任务进度仅支持查看单条任务，请只选择一条' : '请选择一个任务查看进度'
})

/** 命令项虽已 disabled，仍在此复核选中数，避免键盘触发绕过 */
const commandGuards: Record<TaskCommand, () => boolean> = {
  'create-task': () => true,
  'redo-task': () => isSingleSelected.value,
  'redo-task-with-complete-rule': () => isSingleSelected.value,
  'delete-task': () => hasSelected.value
}

const handleTaskCommand = (command: TaskCommand) => {
  if (props.disabled) return
  if (!commandGuards[command]?.()) return
  emit(command)
}
</script>

<style scoped lang="less">
@import '../css/tokens.less';

/* 工具栏：并入大卡、底部轻分割；命令组内 10px，命令区与图标工具区 24px */
.opeartion {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  min-height: 48px;
  padding: 10px 12px;
  border-bottom: 1px solid @border-light;
  background: @surface;
  box-sizing: border-box;

  .left,
  .right {
    display: flex;
    align-items: center;
  }

  .left {
    gap: 10px;
    min-width: 0;
    flex-wrap: wrap;
  }

  .right {
    flex-shrink: 0;
    gap: 10px;
    padding-left: 12px;
    border-left: 1px solid @border-main;
  }

  .btn-icon {
    margin-right: 4px;
    font-size: 13px;
    vertical-align: -1px;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

/* 包一层 span，让按钮禁用时 el-tooltip 仍能接到 hover 说明禁用原因 */
.toolbar-action {
  display: inline-flex;
  align-items: center;
}

.toolbar-selected-count {
  flex-shrink: 0;
  height: 24px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border: 1px solid @primary-border-light;
  border-radius: 6px;
  color: @primary-solid;
  background: @primary-bg-light;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dropdown-item-icon {
  margin-right: 6px;
  font-size: 13px;
  vertical-align: -1px;
  color: @primary-solid;
}

.dropdown-item-hint {
  margin-left: 8px;
  color: @text-disabled;
  font-size: 11px;
  font-weight: normal;
}

.task-manage__icon {
  margin-left: 6px;
}
</style>

<style lang="less">
@import '../css/tokens.less';

/* 删除是不可恢复操作，用 @danger 与其余项区分（下拉挂在 body 上，需非 scoped） */
.el-dropdown-menu__item.dropdown-item--danger:not(.is-disabled) {
  color: @danger;
}

.el-dropdown-menu__item.dropdown-item--danger:not(.is-disabled) .dropdown-item-icon--danger {
  color: @danger;
}

.el-dropdown-menu__item.dropdown-item--danger:not(.is-disabled):focus,
.el-dropdown-menu__item.dropdown-item--danger:not(.is-disabled):hover {
  color: @danger-hover;
  background-color: @danger-bg-light;
}
</style>
