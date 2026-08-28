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
import { BarChart3, ClipboardCheck, Clock, Coins, Folder, TrendingUp } from 'lucide-vue-next'
import StatsShell from './StatsShell.vue'
import type { Statistics } from '../../types'
import type { StatItem } from './types'

interface Props {
  statistics: Statistics
  animationKey: number
  animationReady: boolean
}

const props = defineProps<Props>()

const mainLabel = '立项率'

const mainValue = computed(() => props.statistics.approvalRate)

const statItems = computed<StatItem[]>(() => [
  {
    label: '我的项目总数',
    value: props.statistics.totalCount3,
    suffix: '个',
    color: 'tw-text-sggreen-600',
    bgColor: 'tw-bg-sggreen-50 tw-border-sggreen-100/50',
    iconComponent: Folder
  },
  {
    label: '待出库总数',
    value: props.statistics.pendingOutboundCount,
    suffix: '个',
    color: 'tw-text-amber-600',
    bgColor: 'tw-bg-amber-50 tw-border-amber-100/50',
    iconComponent: Clock
  },
  {
    label: '待出库确认项目数',
    value: props.statistics.pendingOutboundConfirmCount,
    suffix: '个',
    color: 'tw-text-emerald-600',
    bgColor: 'tw-bg-emerald-50 tw-border-emerald-100/50',
    iconComponent: ClipboardCheck
  },
  {
    label: '待预算编制项目数',
    value: props.statistics.pendingBudgetingCount,
    suffix: '个',
    color: 'tw-text-sky-600',
    bgColor: 'tw-bg-sky-50 tw-border-sky-100/50',
    iconComponent: Coins
  },
  {
    label: '预算编制审核中项目数',
    value: props.statistics.budgetingReviewingCount,
    suffix: '个',
    color: 'tw-text-purple-600',
    bgColor: 'tw-bg-purple-50 tw-border-purple-100/50',
    iconComponent: BarChart3
  },
  {
    label: '待立项项目数',
    value: props.statistics.pendingApprovalCount,
    suffix: '个',
    color: 'tw-text-orange-600',
    bgColor: 'tw-bg-orange-50 tw-border-orange-100/50',
    iconComponent: Clock
  },
  {
    label: '已立项项目数',
    value: props.statistics.approvedCount3,
    suffix: '个',
    color: 'tw-text-emerald-600',
    bgColor: 'tw-bg-emerald-50 tw-border-emerald-100/50',
    iconComponent: TrendingUp
  }
])
</script>
