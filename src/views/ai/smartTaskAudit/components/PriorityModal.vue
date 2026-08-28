<template>
  <vxe-modal
    :model-value="modal.visible"
    :destroy-on-close="true"
    :loading="modal.loading"
    show-footer
    show-zoom
    resize
    position="center"
    width="480"
    height="248"
    title="修改优先级"
    @close="$emit('close')"
  >
    <!-- 弹窗会遮住表格选中态，这里回显受影响任务，避免用户凭记忆确认 -->
    <div class="priority-target">
      <span class="priority-target__count">将对 {{ targetTaskNames.length }} 个任务生效</span>
      <span v-if="targetSummary" class="priority-target__names" :title="targetTaskNames.join('、')">{{ targetSummary }}</span>
    </div>

    <el-form ref="formRef" :model="formModel" label-width="90px" label-suffix="：">
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="formModel.priority" placeholder="请选择" style="width: 100%">
          <el-option v-for="item in priorityOptions" :key="item.code" :value="item.code" :label="item.name"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="modal-footer">
        <el-tooltip content="请先选择优先级" :disabled="Boolean(formModel.priority)" placement="top" effect="light">
          <span class="modal-footer__action">
            <el-button :disabled="modal.loading || !formModel.priority" type="primary" size="mini" plain @click="$emit('save')">保 存</el-button>
          </span>
        </el-tooltip>
        <el-button :disabled="modal.loading" size="mini" plain @click="$emit('close')">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { ModalState, OptionItem, PriorityForm } from '../types'

const TARGET_NAME_PREVIEW_COUNT = 3

const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  priorityForm: {
    type: Object as PropType<PriorityForm>,
    required: true
  },
  priorityOptions: {
    type: Array as PropType<OptionItem[]>,
    default: () => []
  },
  /** 当前选中的任务名称，用于弹窗内回显受影响对象 */
  targetTaskNames: {
    type: Array as PropType<string[]>,
    default: () => []
  }
})

defineEmits(['save', 'close'])

const formRef = ref()
const formModel = computed(() => props.priorityForm)
const targetSummary = computed(() => {
  const names = props.targetTaskNames
  if (!names.length) return ''
  const shown = names.slice(0, TARGET_NAME_PREVIEW_COUNT).join('、')
  return names.length > TARGET_NAME_PREVIEW_COUNT ? `${shown} 等 ${names.length} 个` : shown
})

defineExpose({
  clearValidate: () => formRef.value?.clearValidate?.()
})
</script>

<style scoped lang="less">
@import '../css/tokens.less';

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

.priority-target {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 14px;
  padding: 8px 12px;
  border: 1px solid @primary-border-light;
  border-radius: 8px;
  background: @primary-bg-light;
  font-size: 12px;
  line-height: 1.6;
}

.priority-target__count {
  flex-shrink: 0;
  color: @primary-solid;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.priority-target__names {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: @text-secondary;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
