<template>
  <div class="opeartion">
    <div class="left">
      <el-dropdown trigger="click" :disabled="disabled" @command="handleTaskCommand">
        <el-button type="primary" size="mini" plain :disabled="disabled"> 任务管理<i class="el-icon-arrow-down task-manage__icon"></i> </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="create-task" :disabled="disabled">创建任务</el-dropdown-item>
            <el-dropdown-item command="redo-task" :disabled="disabled">原规则重新执行</el-dropdown-item>
            <el-dropdown-item command="redo-task-with-complete-rule" :disabled="disabled">补全规则重新执行</el-dropdown-item>
            <el-dropdown-item command="delete-task" :disabled="disabled">删除任务</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button type="primary" size="mini" plain :disabled="disabled" @click="$emit('open-priority')">修改优先级</el-button>
      <el-button type="primary" size="mini" plain :disabled="disabled" @click="$emit('open-progress')">任务进度</el-button>
      <el-button type="primary" size="mini" plain :disabled="disabled" @click="$emit('export')">导出</el-button>
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
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import type { PropType } from 'vue'

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

const handleTaskCommand = (command: TaskCommand) => {
  if (props.disabled) return
  emit(command)
}
</script>

<style scoped lang="less">
.opeartion {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  min-height: 48px;
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f6;
  background-color: #fcffff;
  box-sizing: border-box;

  .left,
  .right {
    display: flex;
    align-items: center;
  }

  .left {
    gap: 10px;
    min-width: 0;
  }

  .right {
    flex-shrink: 0;
    gap: 4px;
    padding-left: 12px;
    border-left: 1px solid #e2e8f0;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.task-manage__icon {
  margin-left: 6px;
}
</style>
