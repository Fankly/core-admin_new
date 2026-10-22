<template>
  <!-- 分页组件 -->
  <div class="table-pagination">
    <el-pagination
      background
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100, 500]"
      :total="pageable.total"
      layout="total, sizes, prev, pager, next, jumper"
    ></el-pagination>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TablePageable } from '@/hooks/interface'

// 保留历史组件名称。
// eslint-disable-next-line vue/multi-word-component-names
defineOptions({ name: 'Pagination' })

interface PaginationProps {
  pageable: TablePageable
  handleSizeChange: (size: number) => void | Promise<void>
  handleCurrentChange: (currentPage: number) => void | Promise<void>
}

const props = defineProps<PaginationProps>()

// element-plus 2.x 推荐 v-model:current-page / v-model:page-size 双向绑定，
// 状态仍由父组件通过回调维护，这里用计算属性做桥接
const currentPage = computed({
  get: () => props.pageable.current,
  set: (value) => {
    void props.handleCurrentChange(value)
  }
})
const pageSize = computed({
  get: () => props.pageable.size,
  set: (value) => {
    void props.handleSizeChange(value)
  }
})
</script>

<style lang="less" scoped>
.table-pagination {
  max-width: 100%;
  overflow-x: auto;
}
.el-pagination {
  width: max-content;
  margin-left: auto;
  :deep(.btn-prev),
  :deep(.btn-next) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
