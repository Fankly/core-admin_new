<template>
  <div class="container-table-main">
    <vxe-grid ref="gridRef" v-on="gridEvent" v-bind="gridOptions" :data="tableData">
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
      </template></vxe-grid
    >
  </div>
  <div class="container-table-pager">
    <el-pagination
      :current-page="page.page"
      background
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
import { useBatchTable } from '@/views/service/approval/batch/components/hooks/useBatchTable'

interface Props {
  search: () => void
}

const props = defineProps<Props>()

const { gridOptions, gridEvent, gridRef, page, limitChangeHandle, pageChangeHandle, tableData, getStatusTag } = useBatchTable(props)
</script>

<style scoped lang="less"></style>
