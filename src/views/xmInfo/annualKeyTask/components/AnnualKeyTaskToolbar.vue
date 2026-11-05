<template>
  <div class="task-toolbar">
    <div class="task-toolbar__commands" aria-label="年度重点任务操作">
      <el-button v-if="hasPermission('ADD')" type="primary" size="mini" plain :disabled="disabled" @click="$emit('add')">新 增</el-button>
      <el-button v-if="hasPermission('EDIT')" type="primary" size="mini" plain :disabled="disabled || selectedCount !== 1" @click="$emit('edit')">
        修 改
      </el-button>
      <el-button v-if="hasPermission('VIEW')" type="primary" size="mini" plain :disabled="disabled || selectedCount !== 1" @click="$emit('view')">
        查 看
      </el-button>
      <el-button v-if="hasPermission('DELETE')" type="danger" size="mini" plain :disabled="disabled || selectedCount === 0" @click="$emit('remove')">
        删 除
      </el-button>
      <span v-if="hasMaintenancePermission && hasFilePermission" class="task-toolbar__divider" aria-hidden="true"></span>
      <el-button v-if="hasPermission('IMPORT')" type="primary" size="mini" plain :disabled="disabled" @click="$emit('import')">导 入</el-button>
      <el-button v-if="hasPermission('EXPORT')" type="primary" size="mini" plain :loading="exporting" :disabled="disabled" @click="$emit('export')">
        导 出
      </el-button>
    </div>
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
import { computed } from 'vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    exporting?: boolean
    searchVisible?: boolean
    selectedCount?: number
    permissions?: string[]
  }>(),
  {
    disabled: false,
    exporting: false,
    searchVisible: true,
    selectedCount: 0,
    permissions: () => []
  }
)

defineEmits(['add', 'edit', 'view', 'remove', 'import', 'export', 'setting-click', 'toggle-search', 'help'])

const hasPermission = (code: string) => props.permissions.includes(code)
const hasMaintenancePermission = computed(() => ['ADD', 'EDIT', 'VIEW', 'DELETE'].some(hasPermission))
const hasFilePermission = computed(() => hasPermission('IMPORT') || hasPermission('EXPORT'))
</script>

<style scoped lang="less">
.task-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 48px;
  padding: 10px 12px;
  box-sizing: border-box;
  border-bottom: 1px solid #eef2f6;
  background-color: #fcffff;
}

.task-toolbar__commands,
.task-toolbar__tools {
  display: flex;
  align-items: center;
}

.task-toolbar__commands {
  min-width: 0;
  gap: 10px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.task-toolbar__tools {
  flex-shrink: 0;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

.task-toolbar__divider {
  width: 1px;
  height: 20px;
  margin: 0 2px;
  background-color: #e2e8f0;
}
</style>
