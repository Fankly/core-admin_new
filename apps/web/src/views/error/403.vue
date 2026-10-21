<template>
  <ErrorPage code="403" title="当前账号没有访问权限" description="这个页面属于当前角色尚未开通的访问范围。如需使用，请联系系统管理员调整权限。" />
</template>

<script setup lang="ts">
import ErrorPage from '@/features/errors/ErrorPage.vue'

defineOptions({ name: 'ForbiddenPage' })
</script>
