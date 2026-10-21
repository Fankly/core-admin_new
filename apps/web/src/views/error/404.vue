<template>
  <ErrorPage :code="page.code" :title="page.title" :description="page.description" :reload="isBootFailure" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ErrorPage from '@/features/errors/ErrorPage.vue'

defineOptions({ name: 'NotFoundPage' })

const route = useRoute()
const isBootFailure = computed(() => route.query.to === '503')

const page = computed(() => {
  if (isBootFailure.value) {
    return {
      code: '503',
      title: '工作区暂时无法加载',
      description: '菜单或身份信息没有成功返回。请检查网络连接后重新加载；若持续失败，请联系系统管理员。'
    }
  }
  return {
    code: '404',
    title: '这条路径没有对应页面',
    description: '页面可能已迁移、被移除，或当前链接不完整。你可以回到工作台，或使用浏览器返回上一页。'
  }
})
</script>
