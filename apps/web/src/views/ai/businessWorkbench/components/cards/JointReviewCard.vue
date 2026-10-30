<template>
  <div
    class="bw-meeting-card bw-project-row-card"
    :class="{ 'animate-fade-in-up': animate }"
    :style="{ animationDelay: animate ? `${index * 40}ms` : '0ms' }"
  >
    <div class="bw-project-row-main">
      <div class="bw-project-title-row">
        <h3 class="bw-project-title" :title="meeting.name">{{ meeting.name }}</h3>
        <span class="bw-project-code">{{ meeting.meetingCode }}</span>
        <span class="bw-project-status" :class="statusConfig.colorClass">{{ statusConfig.label }}</span>
      </div>

      <div class="bw-project-meta-grid">
        <span :title="meeting.reviewStartDate"><em>开始时间：</em>{{ meeting.reviewStartDate }}</span>
        <span :title="meeting.reviewEndDate"><em>结束时间：</em>{{ meeting.reviewEndDate }}</span>
        <span><em>项目数量：</em>{{ meeting.projectCount }}个</span>
        <span><em>评审人数：</em>{{ meeting.expertCount }}人</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Meeting } from '../../types'

interface Props {
  meeting: Meeting
  index: number
  animate: boolean
}

const props = defineProps<Props>()

const statusConfigMap = {
  pending: {
    label: '待开始',
    colorClass: 'is-amber'
  },
  reviewing: {
    label: '评审中',
    colorClass: 'is-blue'
  },
  completed: {
    label: '已结束',
    colorClass: 'is-green'
  },
  cancelled: {
    label: '已取消',
    colorClass: 'is-slate'
  },
  unknown: {
    label: '未知状态',
    colorClass: 'is-slate'
  }
}

const statusConfig = computed(() => statusConfigMap[props.meeting.status] || statusConfigMap.unknown)
</script>
