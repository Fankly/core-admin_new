<template>
  <div
    class="timeline-item"
    :class="{
      completed: step.status === '1',
      current: step.status === '2',
      pending: step.status === '3'
    }"
  >
    <div class="step-label-left">{{ step.name }}</div>

    <div class="timeline-marker">
      <div class="marker-dot" :class="getMarkerClass(step.status)">
        <div v-if="step.status === '1'" class="check-icon">&check;</div>
        <div v-else-if="step.status === '2'" class="current-pulse"></div>
      </div>
    </div>

    <div class="timeline-content">
      <div class="step-header">
        <div class="step-name">{{ step.name }}</div>
      </div>

      <div class="step-details">
        <div class="detail-row">
          <span class="detail-label status-label">状态:</span>
          <span class="detail-value status-value" :class="getStatusClass(step.status)">{{ step.statusText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import type { ProcessStep } from "../types";

interface Props {
  step: ProcessStep;
}

defineProps<Props>();

const getMarkerClass = (status: string) => {
  const classMap = {
    "1": "completed",
    "2": "current",
    "3": "pending"
  };
  return classMap[status as keyof typeof classMap] || "pending";
};

const getStatusClass = (status: string) => {
  const classMap = {
    "1": "completed",
    "2": "current",
    "3": "pending"
  };
  return classMap[status as keyof typeof classMap] || "pending";
};
</script>

<style scoped>
.timeline-item {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 24px;
}

.timeline-marker {
  position: relative;
  margin-right: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #d1d5db;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.marker-dot.completed {
  background: #10b981;
  box-shadow: 0 0 0 1px #10b981;
}

.check-icon {
  color: white;
  font-size: 8px;
  font-weight: bold;
  line-height: 1;
}

.marker-dot.current {
  background: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
  animation: pulse 2s infinite;
}

.current-pulse {
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  animation: innerPulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 1px #3b82f6, 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 0 1px #3b82f6, 0 0 0 6px rgba(59, 130, 246, 0.1);
  }
}

@keyframes innerPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.marker-dot.pending {
  background: #e5e7eb;
  box-shadow: 0 0 0 1px #e5e7eb;
}

.timeline-content {
  flex: 1;
  background: rgba(243, 244, 246, 0.5);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-left: 0;
  transition: all 0.3s ease;
}

.timeline-item.completed .timeline-content {
  background: rgba(209, 250, 229, 0.3);
  border-color: #10b981;
}

.timeline-item.completed .step-name {
  color: #065f46;
  text-decoration: line-through;
  text-decoration-color: #10b981;
}

.timeline-item.current .timeline-content {
  background: rgba(219, 244, 254, 1);
  border-color: #3bcaf6ff;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.timeline-item.current .step-name {
  color: #1dacd8ff;
  font-weight: 700;
}

.timeline-item.pending .timeline-content {
  background: rgba(249, 250, 251, 0.5);
  border-color: #e5e7eb;
  opacity: 0.6;
}

.timeline-item.pending .step-name {
  color: #9ca3af;
}

.timeline-content:hover {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.step-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.step-label-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 24px;
  font-weight: 700;
  font-size: 14px;
  margin-right: 16px;
  flex-shrink: 0;
  color: #374151;
}

.step-name {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  flex: 1;
  margin-bottom: 8px;
}

.step-details {
  margin-top: 0;
}

.detail-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.detail-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
}

.detail-value {
  font-size: 14px;
  color: #374151;
  font-weight: 400;
}

.status-label {
  margin-left: 0;
}

.status-value {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-value.completed {
  background: #d1fae5;
  color: #065f46;
  border-radius: 4px;
}

.status-value.current {
  background: #dbeafe;
  color: #1d9dd8ff;
  border-radius: 4px;
  animation: statusBlink 2s infinite;
}

.status-value.pending {
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 4px;
}

@keyframes statusBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.type-label {
  margin-left: 0;
}

@media (max-width: 768px) {
  .timeline-item {
    margin-bottom: 30px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .status-label,
  .type-label {
    margin-left: 0;
  }
}
</style>
