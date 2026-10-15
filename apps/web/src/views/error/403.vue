<template>
  <div class="rr-error">
    <div class="not-container">
      <img src="@/assets/images/403.png" class="not-img" alt="403" />
      <div class="not-detail">
        <h2>403</h2>
        <h4>抱歉，您无权访问该页面~️</h4>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ForbiddenPage' })
</script>

<style scoped lang="less">
@import './index.less';
</style>
