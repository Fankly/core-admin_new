<template>
  <div class="card-header">
    <div class="header-left">
      <div class="header-indicator"></div>
      <h2 class="header-title">
        <span>{{ title }}</span>
      </h2>
    </div>
  </div>
</template>
<script setup lang="ts">
interface titleVo {
  title: string
}
const props = defineProps<titleVo>()
</script>
<style scoped lang="less">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  margin-bottom: 5px;
  background: linear-gradient(to right, rgba(203, 213, 225, 0.6), transparent);
  border-radius: 8px;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.2);
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    .header-indicator {
      width: 8px;
      height: 16px;
      background-color: #00706b;
      border-radius: 2px;
      box-shadow: 0 0 8px rgba(0, 112, 107, 0.6);
    }

    .header-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
      filter: drop-shadow(0 1px 1px rgba(255, 255, 255, 0.8));
      margin: 0;
      .sparkle-icon {
        width: 16px;
        height: 16px;
        color: #00706b;
      }
    }
  }
}
</style>
