<template>
  <vxe-modal v-model="isShowModal" title="项目明细" width="90%" height="820" destroy-on-close show-zoom resize fullscreen @close="handleClose">
    <div class="project-detail">
      <div class="project-detail-operation">
        <div>
          <el-button type="primary" plain size="small" :loading="exporting" :disabled="loading || !page.total" @click="handleExport">导 出</el-button>
          <el-button type="primary" plain size="small" :disabled="loading" @click="loadData">刷 新</el-button>
          <el-button type="primary" plain size="small" @click="handleClose">关 闭</el-button>
        </div>
        <span>已选 {{ versionCount }} 个版本<span class="project-detail-unit">单位：万元</span></span>
      </div>
      <div class="project-detail-grid">
        <vxe-grid auto-resize :loading="loading" :data="tableData" :seq-config="{ startIndex: (page.page - 1) * page.limit }" v-bind="gridOptions" />
      </div>
      <div class="project-detail-pager">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[20, 50, 100, 500]"
          :page-size="page.limit"
          :total="page.total"
          :disabled="loading"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleLimitChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
defineOptions({ name: "TargetBudgetProjectDetail" })
import { useTargetBudgetProjectDetail } from './hooks/useTargetBudgetProjectDetail'

const {
  isShowModal,
  loading,
  exporting,
  versionCount,
  tableData,
  page,
  gridOptions,
  acceptParams,
  loadData,
  handleClose,
  handleExport,
  handlePageChange,
  handleLimitChange
} = useTargetBudgetProjectDetail()

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
.project-detail {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &-operation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }

  &-unit {
    margin-left: 24px;
  }

  &-grid {
    flex: 1;
    min-height: 0;
  }

  &-pager {
    padding-top: 12px;
    text-align: center;
  }
}
</style>
