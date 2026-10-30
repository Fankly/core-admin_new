<template>
  <div class="opeartion">
    <div class="left">
      <el-button v-if="hasPermission(ADD_PERMISSION)" type="primary" size="small" plain :disabled="disabled" @click="$emit('create-task')">
        创建任务
      </el-button>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="small" plain :disabled="disabled" @click="$emit('redo-task')">
        重新执行
      </el-button>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="small" plain :disabled="disabled" @click="$emit('async-task')">
        异步执行
      </el-button>
      <el-button v-if="hasPermission(DETAIL_PERMISSION)" type="primary" size="small" plain :disabled="disabled" @click="$emit('open-detail')">
        查看详情
      </el-button>
      <!-- 查看章节：跟「查看详情」同组（都是单行查看），受勾选条数控制（需求 2026-10-20） -->
      <el-tooltip
        v-if="hasPermission(DETAIL_PERMISSION)"
        :content="chapterDisabledReason"
        :disabled="!chapterDisabledReason"
        placement="bottom"
        effect="light"
      >
        <span class="toolbar-action">
          <el-button type="primary" size="small" plain :disabled="disabled || selectedCount !== 1" @click="$emit('open-chapter')">
            查看章节
          </el-button>
        </span>
      </el-tooltip>
      <span v-if="hasPermission(EDIT_PERMISSION)" class="toolbar-dropdown">
        <el-dropdown trigger="click" :disabled="disabled" @command="handleTaskCommand">
          <el-button type="primary" size="small" plain :disabled="disabled"> 编辑<i class="el-icon-arrow-down task-manage__icon"></i> </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit-task">编辑任务</el-dropdown-item>
              <el-dropdown-item command="edit-jys" :disabled="!canEditType('1')">
                编辑建议书
                <span v-if="!canEditType('1')" class="dropdown-item-hint">{{ typeHint('建议书') }}</span>
              </el-dropdown-item>
              <el-dropdown-item command="edit-kybg" :disabled="!canEditType('2')">
                编辑可研报告
                <span v-if="!canEditType('2')" class="dropdown-item-hint">{{ typeHint('可研报告') }}</span>
              </el-dropdown-item>
              <el-dropdown-item command="edit-gss" :disabled="!canEditType('38')">
                编辑估算书
                <span v-if="!canEditType('38')" class="dropdown-item-hint">{{ typeHint('估算书') }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </span>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="small" plain :disabled="disabled" @click="$emit('batch-update')">
        批量更新
      </el-button>
      <el-button v-if="hasPermission(EDIT_PERMISSION)" type="primary" size="small" plain :disabled="disabled" @click="$emit('open-priority')">
        修改优先级
      </el-button>
      <el-button v-if="hasPermission(DELETE_PERMISSION)" type="primary" size="small" plain :disabled="disabled" @click="$emit('delete-task')">
        删除任务
      </el-button>
      <el-button
        v-if="hasPermission(EXPORT_PERMISSION)"
        type="primary"
        size="small"
        plain
        :disabled="disabled"
        :loading="exporting"
        @click="$emit('export')"
      >
        导 出
      </el-button>
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
import { computed } from 'vue'
import type { PropType } from 'vue'
import { usePermission } from '@/hooks/usePermission'
import { ADD_PERMISSION, DELETE_PERMISSION, DETAIL_PERMISSION, EDIT_PERMISSION, EXPORT_PERMISSION } from '../constants'

type ToolButtonKey = 'setting' | 'search' | 'help'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  searchVisible: {
    type: Boolean,
    default: true
  },
  exporting: {
    type: Boolean,
    default: false
  },
  /** 表格已勾选条数：查看章节只支持单条数据 */
  selectedCount: {
    type: Number,
    default: 0
  },
  /** 当前唯一勾选行的附件类型（fjId）：1 建议书 / 2 可研报告 / 38 估算书 */
  selectedFjId: {
    type: String,
    default: ''
  },
  toolButtons: {
    type: Array as PropType<ToolButtonKey[]>,
    default: () => ['setting', 'search', 'help']
  }
})

const emit = defineEmits([
  'create-task',
  'redo-task',
  'async-task',
  'open-detail',
  'open-edit',
  'edit-attach-type',
  'batch-update',
  'open-priority',
  'delete-task',
  'open-chapter',
  'export',
  'setting-click',
  'toggle-search',
  'help'
])

const { hasPermission } = usePermission()

/** 任务管理下拉：编辑任务沿用原弹窗；其余三项按附件类型打开对应文档编辑弹窗 */
const handleTaskCommand = (command: string) => {
  if (command === 'edit-task') {
    emit('open-edit')
    return
  }
  emit('edit-attach-type', command.replace('edit-', ''))
}

/** 三类文档编辑只对「恰好勾选 1 条且附件类型匹配」的行开放 */
const canEditType = (fjId: string) => props.selectedCount === 1 && props.selectedFjId === fjId
const typeHint = (label: string) => {
  if (props.selectedCount > 1) return '仅支持单条数据'
  return props.selectedCount === 1 ? `请选中${label}附件` : '需选择一条数据'
}

/** 查看章节：必须恰好勾选 1 条（未选/多选都禁用，并给出原因提示） */
const chapterDisabledReason = computed(() => {
  if (props.disabled) return ''
  if (props.selectedCount === 0) return '请先选择一条数据查看章节'
  if (props.selectedCount > 1) return '查看章节仅支持单条数据'
  return ''
})
</script>

<style scoped lang="less">
.opeartion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .left,
  .right {
    display: flex;
    align-items: center;
  }

  .right {
    gap: 12px;
  }
}

/* 包一层 span，让按钮禁用时 el-tooltip 仍能接到 hover 说明禁用原因 */
.toolbar-action {
  display: inline-flex;
  align-items: center;
  /* 包了 span 会打断 .el-button + .el-button 的默认 10px 间距，这里自己补两侧（与相邻按钮一致） */
  margin: 0 10px;
}

/* 下拉按钮包一层 span：.el-dropdown 会打断相邻按钮的 10px 间距，由这层补右侧间距 */
.toolbar-dropdown {
  display: inline-flex;
  align-items: center;
  margin-right: 10px;
}

.task-manage__icon {
  margin-left: 6px;
}

.dropdown-item-hint {
  margin-left: 8px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: normal;
}
</style>
