<template>
  <StatsShell
    :main-label="mainLabel"
    :main-value="mainValue"
    :stat-items="statItems"
    :animation-key="animationKey"
    :animation-ready="animationReady"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, Clock, FileCheck, FileUp, Folder, ShieldCheck, XCircle } from 'lucide-vue-next'
import StatsShell from './StatsShell.vue'
import type { Statistics } from '../../types'
import type { StatItem } from './types'

interface Props {
  statistics: Statistics
  animationKey: number
  animationReady: boolean
}

const props = defineProps<Props>()

const mainLabel = '会审通过率'

const mainValue = computed(() => props.statistics.jointReviewPassRate)

const statItems = computed<StatItem[]>(() => [
  {
    label: '我的项目总数',
    value: props.statistics.totalCount2,
    suffix: '个',
    color: 'tw-text-sggreen-600',
    bgColor: 'tw-bg-sggreen-50 tw-border-sggreen-100/50',
    iconComponent: Folder
  },
  {
    label: '评审中项目数',
    value: props.statistics.reviewingCount,
    suffix: '个',
    color: 'tw-text-amber-600',
    bgColor: 'tw-bg-amber-50 tw-border-amber-100/50',
    iconComponent: Clock
  },
  {
    label: '评审通过项目数',
    value: props.statistics.reviewPassedCount,
    suffix: '个',
    color: 'tw-text-emerald-600',
    bgColor: 'tw-bg-emerald-50 tw-border-emerald-100/50',
    iconComponent: CheckCircle
  },
  {
    label: '评审退回项目数',
    value: props.statistics.reviewRejectedCount,
    suffix: '个',
    color: 'tw-text-rose-600',
    bgColor: 'tw-bg-rose-50 tw-border-rose-100/50',
    iconComponent: XCircle
  },
  {
    label: '评审意见待上传项目数',
    value: props.statistics.reviewOpinionPendingCount,
    suffix: '个',
    color: 'tw-text-emerald-600',
    bgColor: 'tw-bg-emerald-50 tw-border-emerald-100/50',
    iconComponent: FileUp
  },
  {
    label: '可研批复待上传项目数',
    value: props.statistics.pendingFeasibilityUploadCount,
    suffix: '个',
    color: 'tw-text-cyan-600',
    bgColor: 'tw-bg-cyan-50 tw-border-cyan-100/50',
    iconComponent: FileCheck
  },
  {
    label: '发展合规审核中项目数',
    value: props.statistics.complianceReviewingCount,
    suffix: '个',
    color: 'tw-text-purple-600',
    bgColor: 'tw-bg-purple-50 tw-border-purple-100/50',
    iconComponent: ShieldCheck
  }
])
</script>
