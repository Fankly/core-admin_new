<template>
  <!-- 分页组件 -->
  <el-pagination
    background
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :page-sizes="[10, 20, 50, 100, 500]"
    :total="pageable.total"
    layout="total, sizes, prev, pager, next, jumper"
  ></el-pagination>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'Pagination' })

interface Pageable {
  current: number
  size: number
  total: number
}

interface PaginationProps {
  pageable: Pageable
  handleSizeChange: (size: number) => void
  handleCurrentChange: (currentPage: number) => void
}

const props = defineProps<PaginationProps>()

// element-plus 2.x 推荐 v-model:current-page / v-model:page-size 双向绑定，
// 状态仍由父组件通过回调维护，这里用计算属性做桥接
const currentPage = computed({
  get: () => props.pageable.current,
  set: (value) => {
    props.handleCurrentChange(value)
  }
})
const pageSize = computed({
  get: () => props.pageable.size,
  set: (value) => {
    props.handleSizeChange(value)
  }
})
</script>

<style lang="less" scoped>
.el-pagination {
  :deep(.btn-prev),
  :deep(.btn-next) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
