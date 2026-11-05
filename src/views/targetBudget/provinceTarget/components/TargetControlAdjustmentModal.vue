<template>
  <vxe-modal
    v-model="isShowModal"
    :title="modalTitle"
    :width="modalWidth"
    :height="modalHeight"
    :loading="loading"
    :destroy-on-close="true"
    resize
    show-zoom
    fullscreen
    @close="handleCloseModal"
  >
    <div
      v-loading="loading"
      class="targetControlAdjustmentModal"
      element-loading-text="正在加载..."
      element-loading-background="rgba(255, 255, 255, 0.72)"
    >
      <div class="targetControlAdjustmentModal-operation">
        <div class="left">
          <el-button type="primary" plain size="mini" :disabled="loading || hasValidationError" @click="handleSave">保 存</el-button>
          <el-button plain size="mini" :disabled="loading" @click="handleCloseModal">关 闭</el-button>
        </div>
      </div>
      <div class="targetControlAdjustmentModal-grid">
        <vxe-grid ref="gridRef" auto-resize :data="tableData" v-bind="gridOptions">
          <template #bcxgYsje_edit="{ row }">
            <input
              v-number-input="DECIMAL_DIGITS"
              class="my-input"
              v-model="row.bcxgYsje"
              maxlength="20"
              @input="handleTargetControlAmountInput(row)"
              @blur="handleTargetControlAmountBlur(row)"
            />
          </template>
        </vxe-grid>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="TargetControlAdjustmentModal">
import { useTargetControlAdjustmentModal } from './hooks/useTargetControlAdjustmentModal'

interface TargetControlAdjustmentModalProps {
  search: () => void | Promise<void>
}

const props = defineProps<TargetControlAdjustmentModalProps>()

const {
  isShowModal,
  loading,
  hasValidationError,
  modalTitle,
  modalWidth,
  modalHeight,
  gridRef,
  tableData,
  gridOptions,
  handleSave,
  handleTargetControlAmountInput,
  handleTargetControlAmountBlur,
  handleCloseModal,
  acceptParams,
  DECIMAL_DIGITS
} = useTargetControlAdjustmentModal(props)

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.targetControlAdjustmentModal {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;

  &-operation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    margin-bottom: 12px;
    border-bottom: 1px solid #e4e7ed;

    .left {
      display: flex;
      gap: 8px;
    }
  }

  &-grid {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.editable-cell) {
    background-color: #338d89 !important;
    color: #fff !important;
    cursor: pointer;
  }

  :deep(.summary-row) {
    font-weight: 600;
    background-color: #f5f7fa;
  }

  :deep(.my-input) {
    width: 100%;
    height: 100%;
    padding: 0 8px;
    border: 0;
    outline: 0;
    background-color: transparent;
    color: inherit;
    font-size: inherit;
    font-family: inherit;
  }

  :deep(.vxe-body--column.col--edit-cell) {
    padding: 0;
  }

  :deep(.vxe-cell--edit-icon) {
    display: none;
  }
}
</style>
