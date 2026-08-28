<template>
  <vxe-modal
    ref="targetBudgetVersionCompareRef"
    :destroy-on-close="true"
    :loading="loading"
    :height="modalHeight"
    v-model="isShowModal"
    :width="modalWidth"
    :title="modalTitle"
    @close="handleCloseModal"
    show-zoom
    resize
  >
    <div class="targetBudgetVersionCompare">
      <div class="targetBudgetVersionCompare-operation">
        <div class="left">
          <el-button type="primary" plain size="mini" @click="handlePageExport">导 出</el-button>
          <el-button type="primary" plain size="mini" @click="handleCloseModal">关 闭</el-button>
        </div>
        <div class="right">
          <div class="info">
            <div class="highlight">
              <dt>年度:</dt>
              <dd>{{ parameter?.nd }}</dd>
            </div>
            <div class="highlight">
              <dt>单位:</dt>
              <dd>{{ `万元` }}</dd>
            </div>
          </div>
        </div>
      </div>
      <div class="targetBudgetVersionCompare-table">
        <vxe-grid ref="gridRef" :data="tableData" v-on="gridEvent" v-bind="gridOptions"> </vxe-grid>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="TargetBudgetVersioncompare">
import { useTargetBudgetVersionCompare } from './hooks/useTargetBudgetVersionCompare'

const {
  parameter,
  modalTitle,
  modalWidth,
  modalHeight,
  isShowModal,
  loading,
  targetBudgetVersionCompareRef,
  handlePageExport,
  acceptParams,
  tableData,
  gridRef,
  gridEvent,
  gridOptions,
  handleCloseModal
} = useTargetBudgetVersionCompare()

defineExpose({
  acceptParams
})
</script>

<style lang="less" scoped>
.targetBudgetVersionCompare {
  height: 100%;
  display: flex;
  flex-direction: column;
  &-operation {
    margin-bottom: 10px;
  }

  &-operation {
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;

    .left {
      display: flex;
      flex-wrap: wrap;
      gap: 0px;
    }

    .right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 1 1 auto;

      .info {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0;

        .highlight {
          display: inline-flex;
          align-items: center;
          font-size: 14px;
          padding: 4px 12px;
          background-color: var(--el-fill-color-light, #f5f7fa);
          border: 1px solid var(--el-border-color-light, #dcdfe6);
          border-radius: 4px;
          white-space: nowrap;
          transition: background-color 0.2s;
          max-width: 240px;

          &:hover {
            background-color: var(--el-fill-color, #e6e8eb);
          }

          dt {
            color: var(--el-text-color-regular, #606266);
            font-weight: normal;
            margin: 0;
          }

          dd {
            font-weight: 600;
            color: var(--el-text-color-primary, #303133);
            margin: 0 0 0 6px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }

  &-table {
    flex: 1;
    min-height: 710px;
  }
}
</style>
