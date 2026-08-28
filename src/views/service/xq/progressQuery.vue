<template>
  <div class="progress-query-container" v-loading="loading">
    <ProjectInfo :project-info="projectInfo" />
    <Timeline :process-steps="processSteps" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import ProjectInfo from "@/views/service/xq/progressQuery/components/ProjectInfo.vue";
import Timeline from "@/views/service/xq/progressQuery/components/Timeline.vue";
import { useProgressQuery } from "@/views/service/xq/progressQuery/composables/useProgressQuery";

// 使用组合式函数
const { loading, processSteps, projectInfo, reload } = useProgressQuery();

// 组件挂载时初始化
onMounted(async () => {
  await reload();
});
</script>

<style scoped>
.progress-query-container {
  padding: 20px;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6f4ff 100%);
  min-height: 100vh;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-y: auto;
  max-height: 100vh;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .progress-query-container {
    padding: 15px;
  }
}
</style>
