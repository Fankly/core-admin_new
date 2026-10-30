<template>
  <component :is="statisticsComponent" :statistics="statistics" :animation-key="animationKey" :animation-ready="animationReady" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JointReviewStatistics from './statistics/JointReviewStatistics.vue'
import ProjectReserveStatistics from './statistics/ProjectReserveStatistics.vue'
import RequirementLibraryStatistics from './statistics/RequirementLibraryStatistics.vue'
import type { ModuleCardType, Statistics } from '../types'

interface Props {
  statistics: Statistics
  cardType: ModuleCardType
  animationKey: number
  animationReady: boolean
}

const props = defineProps<Props>()

const statisticsMap = {
  requirementLibrary: RequirementLibraryStatistics,
  jointReview: JointReviewStatistics,
  projectReserve: ProjectReserveStatistics
}

const statisticsComponent = computed(() => statisticsMap[props.cardType])
</script>
