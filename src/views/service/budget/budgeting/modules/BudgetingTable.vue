<template>
  <div class="table">
    <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents" />
  </div>
  <div class="main-pagination">
    <el-pagination
      :current-page="page.currentPage"
      background
      :page-sizes="[20, 50, 100, 200]"
      :page-size="page.pageSize"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleChangeSizeChange"
      @current-change="handleChangeCurrentChange"
    ></el-pagination>
  </div>
</template>

<script setup lang="ts" name="BudgetingTable">
import { useBudgetingTable } from '@/views/service/budget/budgeting/hooks/useBudgetingTable'
import { onMounted } from 'vue'

const { gridOptions, gridEvents, page, handleChangeSizeChange, handleChangeCurrentChange, searchData, getColumnsData, gridRef } = useBudgetingTable()

onMounted(async () => {
  await searchData()
})

defineExpose({
  getColumnsData
})
</script>

<style scoped></style>
