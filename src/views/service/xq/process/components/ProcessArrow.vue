<template>
  <div class="process-arrow">
    <div class="arrow-icon">❯❯</div>
  </div>
</template>

<script setup lang="ts">
// 无需响应式数据或方法的简单组件
</script>

<style scoped>
.process-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0;
  flex-shrink: 0;
  line-height: 70px;
}

.arrow-icon {
  font-size: 38px;
  color: var(--color-primary);
  font-weight: bold;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.arrow-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>
