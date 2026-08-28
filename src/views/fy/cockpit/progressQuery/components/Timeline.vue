<template>
  <div class="timeline-container">
    <div class="timeline" :style="{ '--progress-height': processHeight }">
      <TimelineItem v-for="step in processSteps" :key="step.id" :step="step" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import type { ProcessStep } from "../types";
import TimelineItem from "./TimelineItem.vue";

interface Props {
  processSteps: ProcessStep[];
}

const props = defineProps<Props>();
const processHeight = computed(() => {
  const totalSteps = props.processSteps.length;
  if (totalSteps === 0) return "0%";

  let lastActiveIndex = -1;
  for (let i = 0; i < props.processSteps.length; i++) {
    if (props.processSteps[i].status === "1" || props.processSteps[i].status === "2") {
      lastActiveIndex = i;
    }
  }
  if (lastActiveIndex === -1) return "0%";
  return `calc(${lastActiveIndex}* 125px + 42px)`;
});
</script>

<style scoped>
.timeline-container {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.timeline {
  position: relative;
  padding-bottom: 60px;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 120px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
  z-index: 1;
}

.timeline::after {
  content: "";
  position: absolute;
  left: 120px;
  top: 0;
  width: 2px;
  height: var(--progress-height);
  background: linear-gradient(to bottom, #10b981, #3b82f6);
  z-index: 1;
  transition: height 0.8s ease;
}
</style>
