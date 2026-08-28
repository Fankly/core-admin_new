<template>
  <!-- 分页组件 -->
  <el-pagination
    background
    :current-page="pageable.current"
    :page-size="pageable.size"
    :page-sizes="[10, 20, 50, 100, 500]"
    :total="pageable.total"
    layout="total, sizes, prev, pager, next, jumper"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  ></el-pagination>
</template>

<script setup lang="ts">
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

defineProps<PaginationProps>()
</script>

<script lang="ts">
export default {
  name: 'Pagination'
}
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
