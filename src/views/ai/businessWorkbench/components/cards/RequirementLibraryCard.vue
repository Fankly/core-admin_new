<template>
  <div
    class="bw-meeting-card bw-project-row-card"
    :class="{ 'animate-fade-in-up': animate }"
    :style="{ animationDelay: animate ? `${index * 40}ms` : '0ms' }"
  >
    <div class="bw-project-row-main">
      <div class="bw-project-title-row">
        <h3 class="bw-project-title" :title="meeting.name">{{ meeting.name }}</h3>
        <span v-if="projectCode" class="bw-project-code">{{ projectCode }}</span>
        <span class="bw-project-status" :class="statusConfig.colorClass">{{ statusLabel }}</span>
      </div>

      <div class="bw-project-meta-grid">
        <span :title="meeting.primaryUnit"><em>一级单位：</em>{{ meeting.primaryUnit }}</span>
        <span :title="meeting.secondaryUnit"><em>二级单位：</em>{{ meeting.secondaryUnit }}</span>
        <span :title="meeting.cityManagementDepartment"><em>市归口管理部门：</em>{{ meeting.cityManagementDepartment }}</span>
        <span :title="meeting.createDepartment"><em>创建部门：</em>{{ meeting.createDepartment }}</span>
      </div>
    </div>

    <div class="bw-project-budget bw-project-budget--plain" :title="`${meeting.declaredBudget} 万元`">
      <strong>{{ meeting.declaredBudget }}</strong>
      <span>万元</span>
    </div>

    <div class="bw-project-hover-action">
      <button type="button" class="bw-project-action-button" @click.stop="emit('open-project', meeting)">
        <span>{{ actionLabel }}</span>
        <ArrowRight class="bw-project-action-icon" :stroke-width="2.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import type { Meeting } from '../../types'

interface Props {
  meeting: Meeting
  index: number
  animate: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['open-project'])

const statusConfigMap = {
  pending: {
    label: '待提交',
    colorClass: 'is-amber'
  },
  reviewing: {
    label: '流转中',
    colorClass: 'is-blue'
  },
  completed: {
    label: '在库',
    colorClass: 'is-green'
  },
  cancelled: {
    label: '已出库',
    colorClass: 'is-slate'
  },
  unknown: {
    label: '未知状态',
    colorClass: 'is-slate'
  }
}

const statusConfig = computed(() => statusConfigMap[props.meeting.status] || statusConfigMap.unknown)
const statusLabel = computed(() => props.meeting.statusName || statusConfig.value.label)
const actionLabel = computed(() => (props.meeting.status === 'pending' ? '集中修改' : '查看详情'))
const projectCode = computed(() => {
  const value = props.meeting.projectCode?.trim() || ''
  const normalizedValue = value.toLowerCase()
  return normalizedValue === 'null' || normalizedValue === 'undefined' ? '' : value
})
</script>
