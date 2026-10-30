<template>
  <vxe-modal
    :model-value="modal.visible"
    :loading="modal.loading"
    :destroy-on-close="true"
    show-footer
    show-close
    resize
    position="center"
    width="640"
    height="500"
    :title="isCreate ? '新建单要点审核任务' : '修改单要点审核任务'"
    @close="$emit('close')"
  >
    <div class="point-task-modal">
      <el-form label-width="100px" label-suffix="：" @submit.prevent>
        <el-form-item label="审核要点" required>
          <el-select
            v-model="form.ruleId"
            clearable
            filterable
            :loading="ruleLoading"
            placeholder="请选择审核要点（可输入编码/名称筛选）"
            style="width: 100%"
          >
            <el-option v-for="item in ruleOptions" :key="item.value" :value="item.value" :label="item.label">
              <span class="point-rule-option">
                <span class="point-rule-option__label">{{ item.label || item.value }}</span>
                <span v-if="item.ruleName" class="point-rule-option__sub">{{ item.ruleName }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <div class="point-task-scope">
        <div class="point-task-scope__hd">
          <span class="point-task-scope__title">任务清单</span>
          <span class="point-task-scope__count">已选 {{ selectedTaskIds.length }} / {{ taskRows.length }} 个任务</span>
          <el-checkbox class="point-task-scope__all" :model-value="allChecked" :indeterminate="partChecked" @change="toggleAll"> 全选 </el-checkbox>
        </div>
        <div v-if="taskRows.length" class="point-task-scope__list">
          <el-checkbox
            v-for="row in taskRows"
            :key="row.taskId"
            class="point-task-scope__item"
            :model-value="selectedTaskIds.includes(row.taskId)"
            @change="toggleTask(row.taskId, $event)"
          >
            <span class="point-task-scope__name" :title="row.taskName">{{ row.taskName || row.taskId }}</span>
          </el-checkbox>
        </div>
        <div v-else class="point-task-scope__empty">
          {{ modal.loading ? '任务明细加载中…' : '没有可用的任务' }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <el-tooltip :content="saveDisabledReason" :disabled="!saveDisabledReason" placement="top" effect="light">
          <span class="modal-footer__action">
            <el-button type="primary" size="small" plain :disabled="modal.loading || Boolean(saveDisabledReason)" @click="submit">保 存</el-button>
          </span>
        </el-tooltip>
        <el-button size="small" plain :disabled="modal.loading" @click="$emit('close')">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { PointTaskEditState, PointTaskSavePayload } from '../hooks/usePointTaskPanel'
import type { PointTaskRuleOption } from '../pointTask'

const props = defineProps({
  modal: {
    type: Object as PropType<PointTaskEditState>,
    required: true
  },
  ruleOptions: {
    type: Array as PropType<PointTaskRuleOption[]>,
    default: () => []
  },
  ruleLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const form = reactive({ ruleId: '' })
const selectedTaskIds = ref<string[]>([])

const isCreate = computed(() => props.modal.mode === 'create')
const taskRows = computed(() => props.modal.taskRows)
const allChecked = computed(() => taskRows.value.length > 0 && selectedTaskIds.value.length === taskRows.value.length)
const partChecked = computed(() => selectedTaskIds.value.length > 0 && !allChecked.value)

const saveDisabledReason = computed(() => {
  if (!form.ruleId) return '请选择审核要点'
  if (!selectedTaskIds.value.length) return '请至少保留一个任务'
  return ''
})

/** 打开弹窗（或明细异步返回）时初始化：默认全选当前任务 */
watch(
  () => [props.modal.visible, props.modal.loading, props.modal.mode, props.modal.pointTaskId, props.modal.taskRows.length] as const,
  () => {
    if (!props.modal.visible || props.modal.loading) return
    form.ruleId = props.modal.ruleId
    selectedTaskIds.value = props.modal.taskRows.map((row) => row.taskId)
  },
  { immediate: true }
)

const toggleTask = (taskId: string, checked: boolean | string | number) => {
  if (checked) {
    if (!selectedTaskIds.value.includes(taskId)) selectedTaskIds.value = [...selectedTaskIds.value, taskId]
  } else {
    selectedTaskIds.value = selectedTaskIds.value.filter((id) => id !== taskId)
  }
}

const toggleAll = (checked: boolean | string | number) => {
  selectedTaskIds.value = checked ? taskRows.value.map((row) => row.taskId) : []
}

const submit = () => {
  if (saveDisabledReason.value) return
  const payload: PointTaskSavePayload = { ruleId: form.ruleId, taskIdList: [...selectedTaskIds.value] }
  emit('save', payload)
}
</script>

<style scoped lang="less">
@import '../css/tokens.less';

.point-task-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  /* 必填星号 + 「审核要点：」在 90px 宽里会折成两行，这里禁掉折行（宽度已由 label-width 100px 兜住） */
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}

.point-rule-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.point-rule-option__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-rule-option__sub {
  margin-left: auto;
  flex-shrink: 0;
  max-width: 40%;
  overflow: hidden;
  color: @text-muted;
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-task-scope {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  margin-top: 6px;
  border: 1px solid @border-main;
  border-radius: 8px;
  overflow: hidden;
}

.point-task-scope__hd {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding: 8px 12px;
  background: @primary-bg-light;
  border-bottom: 1px solid @border-main;
}

.point-task-scope__title {
  color: @text-main;
  font-size: 12.5px;
  font-weight: 600;
}

.point-task-scope__count {
  color: @text-muted;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.point-task-scope__all {
  margin-left: auto;
  margin-right: 0;
}

.point-task-scope__list {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 12px;
}

.point-task-scope__item {
  display: flex;
  align-items: center;
  height: 30px;
  margin-right: 0;
  width: 100%;
}

.point-task-scope__name {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  color: @text-secondary;
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-task-scope__empty {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: @text-muted;
  font-size: 12.5px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.modal-footer__action {
  display: inline-flex;
  align-items: center;
}
</style>
