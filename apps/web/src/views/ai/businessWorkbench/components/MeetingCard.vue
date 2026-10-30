<template>
  <component :is="cardComponent" :meeting="meeting" :index="index" :animate="animate" @open-project="emit('open-project', $event)" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JointReviewCard from './cards/JointReviewCard.vue'
import ProjectReserveCard from './cards/ProjectReserveCard.vue'
import RequirementLibraryCard from './cards/RequirementLibraryCard.vue'
import type { Meeting, ModuleCardType } from '../types'

interface Props {
  meeting: Meeting
  index: number
  cardType: ModuleCardType
  animate: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['open-project'])

const cardMap = {
  requirementLibrary: RequirementLibraryCard,
  jointReview: JointReviewCard,
  projectReserve: ProjectReserveCard
}

const cardComponent = computed(() => cardMap[props.cardType])
</script>
