<template>
  <div class="table">
    <vxe-grid ref="gridRef" :data="tableData" v-on="gridEvent" v-bind="gridOptions">
      <template #statusSlot="{ row }">
        <template v-if="row">
          <el-tag
            v-bind="
              (() => {
                const tag = getStatusTag(row.status)
                return {
                  type: tag.type,
                  effect: tag.effect || 'light'
                }
              })()
            "
          >
            {{ getStatusTag(row.status).label }}
          </el-tag>
        </template>
      </template>
    </vxe-grid>
  </div>
  <div class="pager">
    <el-pagination
      :current-page="page.page"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="limitChangeHandle"
      @current-change="pageChangeHandle"
    ></el-pagination>
  </div>
</template>

<script setup lang="ts">
import { useTable } from '@/views/targetBudget/provinceTarget/components/hooks/useTable'

interface Props {
  search: () => void
}

const props = defineProps<Props>()

const { gridOptions, gridEvent, gridRef, page, limitChangeHandle, pageChangeHandle, tableData, getStatusTag } = useTable(props)
</script>

<style scoped>
.table {
  flex: 1;
  min-height: calc(100% - 42px);
}
</style>
