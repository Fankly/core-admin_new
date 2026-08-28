<template>
  <div class="review-table-grid" :class="{ 'is-fill': fill }">
    <vxe-grid v-if="table" :key="tableKey" v-bind="gridOptions" class="review-table-grid__table" />
    <div v-else class="review-table-grid__empty">暂无评审明细</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReviewTable } from './auditDetailHelpers'
import { getReviewGridOptions } from './auditDetailHelpers'

const props = withDefaults(
  defineProps<{
    table?: ReviewTable
    fill?: boolean
  }>(),
  {
    fill: false
  }
)

const tableKey = computed(() => `${props.table?.tableMeta?.title || 'review-table'}-${props.table?.rows?.length || 0}`)
const gridOptions = computed(() => getReviewGridOptions(props.table, props.fill))
</script>

<style scoped lang="less">
.review-table-grid {
  width: 100%;
  max-width: 100%;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-color: rgba(74, 150, 145, 0.35) transparent;
  scrollbar-width: thin;
}

.review-table-grid__table {
  width: 100%;
  min-width: 860px;
}

.review-table-grid.is-fill {
  height: 100%;
  overflow: hidden;
}

.review-table-grid.is-fill .review-table-grid__table {
  height: 100%;
}

.review-table-grid :deep(.vxe-table--header-wrapper) {
  background: linear-gradient(180deg, #f2fbfa 0%, #edf8f7 100%);
}

.review-table-grid :deep(.vxe-header--column) {
  color: #00706b;
  font-size: 13px;
}

.review-table-grid :deep(.vxe-body--column) {
  color: #475569;
  font-size: 13px;
}

.review-table-grid :deep(.vxe-table--border-line),
.review-table-grid :deep(.vxe-table--header-border-line) {
  border-color: #dcebea;
}

.review-table-grid :deep(.vxe-table) {
  border-radius: 8px;
}

.review-table-grid__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: #64748b;
  font-size: 14px;
}
</style>
