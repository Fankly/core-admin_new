<template>
  <div class="header">
    <div class="project-info" v-if="projectInfo.code">
      <span class="info-item">
        <span class="info-label">项目编码:</span>
        <span class="info-value">{{ projectInfo.code }}</span>
      </span>
      <span class="info-item" v-if="projectInfo.name">
        <span class="info-label">项目名称:</span>
        <span class="info-value">{{ projectInfo.name }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import type { ProjectInfo } from "../types";

interface Props {
  projectInfo: ProjectInfo;
}

defineProps<Props>();
</script>

<style scoped>
.header {
  margin-bottom: 30px;
}

.project-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 112, 107, 0.1);
}

.info-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  margin-right: 8px;
}

.info-value {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 600;
}
</style>
