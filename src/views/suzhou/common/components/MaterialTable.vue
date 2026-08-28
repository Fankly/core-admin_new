<template>
  <div class="table">
    <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents">
      <template v-for="name in tableSlotNames" #[name]="slotProps" :key="name">
        <slot :name="name" v-bind="slotProps"></slot>
      </template>
    </vxe-grid>
  </div>
  <div class="main-pagination">
    <el-pagination
      :current-page="page.page"
      background
      :page-sizes="[20, 50, 100, 200]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleChangeSizeChange"
      @current-change="handleChangeCurrentChange"
    ></el-pagination>
  </div>
</template>

<script setup lang="ts" name="materialTable">
import { computed, useSlots } from 'vue'
import { useCrudTable } from '@/views/suzhou/common/hooks/useCrudTable'
import type { VxeGridProps } from 'vxe-table'

const props = defineProps<{
  columns?: VxeGridProps<any>['columns']
}>()

const slots = useSlots()
const tableSlotNames = computed(() => Object.keys(slots).filter((name) => name !== 'default'))

const { gridOptions, gridEvents, page, handleChangeSizeChange, handleChangeCurrentChange, searchData, reloadData, getSearchParams, gridRef } =
  useCrudTable(props.columns)

defineExpose({
  searchData,
  reloadData,
  getSearchParams
})
</script>
