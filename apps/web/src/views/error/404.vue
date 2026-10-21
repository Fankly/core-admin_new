<template>
  <ErrorPage
    code="404"
    title="这条路径没有对应页面"
    description="页面可能已迁移、被移除，或当前链接不完整。你可以回到工作台，或使用浏览器返回上一页。"
  />
</template>

<script setup lang="ts">
import ErrorPage from '@/features/errors/ErrorPage.vue'

defineOptions({ name: 'NotFoundPage' })
</script>
