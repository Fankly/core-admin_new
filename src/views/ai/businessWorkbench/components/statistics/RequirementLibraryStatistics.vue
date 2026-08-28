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
import { Archive, CheckCircle, Clock, Coins, Folder, ShieldCheck, TrendingUp, XCircle } from 'lucide-vue-next'
import StatsShell from './StatsShell.vue'
import type { Statistics } from '../../types'
import type { StatItem } from './types'

interface Props {
  statistics: Statistics
  animationKey: number
  animationReady: boolean
}

const props = defineProps<Props>()

const mainLabel = '需求入库率'

const mainValue = computed(() => props.statistics.requirementEntryRate)

const statItems = computed<StatItem[]>(() => [
  {
    label: '我的项目总数',
    value: props.statistics.totalCount,
    suffix: '个',
    color: 'tw-text-sggreen-600',
    bgColor: 'tw-bg-sggreen-50 tw-border-sggreen-100/50',
    iconComponent: Folder
  },
  {
    label: '未纳入需求库项目数',
    value: props.statistics.notInRequirementEntryRate,
    suffix: '个',
    color: 'tw-text-amber-600',
    bgColor: 'tw-bg-amber-50 tw-border-amber-100/50',
    iconComponent: Clock
  },
  {
    label: '需求库项目数',
    value: props.statistics.requirementCount,
    suffix: '个',
    color: 'tw-text-emerald-600',
    bgColor: 'tw-bg-emerald-50 tw-border-emerald-100/50',
    iconComponent: CheckCircle
  },
  {
    label: '省级联合会审项目数',
    value: props.statistics.jointReviewCount,
    suffix: '个',
    color: 'tw-text-cyan-600',
    bgColor: 'tw-bg-cyan-50 tw-border-cyan-100/50',
    iconComponent: ShieldCheck
  },
  {
    label: '储备库项目数',
    value: props.statistics.reserveCount,
    suffix: '个',
    color: 'tw-text-purple-600',
    bgColor: 'tw-bg-purple-50 tw-border-purple-100/50',
    iconComponent: Archive
  },
  {
    label: '计划预算编制中项目数',
    value: props.statistics.budgetingCount,
    suffix: '个',
    color: 'tw-text-sky-600',
    bgColor: 'tw-bg-sky-50 tw-border-sky-100/50',
    iconComponent: Coins
  },
  {
    label: '已立项项目数',
    value: props.statistics.approvedCount,
    suffix: '个',
    color: 'tw-text-emerald-600',
    bgColor: 'tw-bg-emerald-50 tw-border-emerald-100/50',
    iconComponent: TrendingUp
  },
  {
    label: '已关闭项目数',
    value: props.statistics.closedCount,
    suffix: '个',
    color: 'tw-text-rose-600',
    bgColor: 'tw-bg-rose-50 tw-border-rose-100/50',
    iconComponent: XCircle
  }
])
</script>
