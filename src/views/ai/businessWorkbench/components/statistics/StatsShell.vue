<template>
  <div class="tw-bg-white tw-rounded-xl tw-border tw-border-slate-200 tw-p-4 bw-panel-card bw-stats-shell tw-overflow-hidden tw-flex tw-flex-col">
    <div
      class="tw-flex tw-items-center tw-h-[38px] tw-mb-2 tw-shrink-0 tw-border-b tw-border-t-0 tw-border-l-0 tw-border-r-0 tw-border-solid tw-border-slate-200 tw-pb-2"
    >
      <h2 class="tw-font-extrabold tw-text-slate-800 tw-text-lg tw-tracking-tight tw-m-0">项目统计</h2>
    </div>
    <div
      :key="animationKey"
      class="bw-stats-body scrollbar-thin tw-flex-1 tw-flex tw-flex-col tw-gap-3"
      :class="{ 'animate-fade-in-up': animationReady }"
    >
      <div
        class="tw-h-[135px] tw-rounded-xl tw-border tw-border-sggreen-200/80 hover:tw-border-sggreen-300 tw-bg-gradient-to-br tw-from-sggreen-100 tw-via-sggreen-50/70 tw-to-emerald-50/30 tw-p-4 tw-relative tw-overflow-hidden tw-group tw-transition-all tw-duration-300 tw-flex tw-flex-col tw-justify-between"
      >
        <div
          class="tw-absolute -tw-right-4 -tw-bottom-4 tw-w-16 tw-h-16 tw-rounded-full tw-bg-sggreen-200/20 tw-blur-lg tw-pointer-events-none"
        ></div>

        <div class="tw-flex tw-items-center tw-justify-between">
          <div>
            <p class="tw-text-sm tw-font-bold tw-text-sggreen-800/70 tw-mb-0.5">{{ mainLabel }}</p>
            <div class="tw-flex tw-items-baseline tw-gap-0.5">
              <span class="tw-text-4xl tw-font-extrabold tw-text-sggreen-700 tw-tracking-tight">{{ mainValue }}</span>
              <span class="tw-text-sm tw-font-bold tw-text-sggreen-700/80">%</span>
            </div>
          </div>
          <div class="tw-p-2.5 tw-rounded-lg tw-bg-white/80 tw-border tw-border-sggreen-200/60 tw-text-sggreen-700 tw-backdrop-blur-sm">
            <BarChart3 class="tw-w-7 tw-h-7" :stroke-width="2" />
          </div>
        </div>

        <div class="tw-mt-2">
          <div class="tw-h-2 tw-bg-sggreen-200/40 tw-rounded-full tw-overflow-hidden">
            <div
              class="tw-h-full tw-bg-gradient-to-r tw-from-sggreen-500 tw-to-emerald-600 tw-rounded-full tw-transition-all tw-duration-1000 tw-ease-out"
              :style="{ width: `${mainValue}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="bw-stats-grid tw-grid tw-grid-cols-2 tw-grid-rows-4 tw-auto-rows-fr tw-gap-2 tw-flex-1 tw-min-h-0">
        <div
          v-for="item in statItems"
          :key="item.label"
          class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-py-3 tw-px-3.5 hover:tw-border-sggreen-300 tw-transition-all tw-duration-300 tw-flex tw-items-center tw-gap-2.5 tw-group hover:tw-shadow-sm"
        >
          <div class="tw-p-2 tw-rounded-lg tw-border tw-shrink-0" :class="[item.bgColor, item.color]">
            <component :is="item.iconComponent" class="tw-w-6 tw-h-6" :stroke-width="2" />
          </div>
          <div class="tw-min-w-0 tw-flex-1">
            <p class="tw-text-base tw-text-slate-500 tw-font-bold tw-leading-tight tw-truncate" :title="item.label">{{ item.label }}</p>
            <p class="tw-text-2xl tw-font-extrabold tw-text-slate-800 tw-tracking-tight tw-mt-0.5">
              {{ item.value }}<span class="tw-text-sm tw-text-slate-400 tw-font-bold tw-ml-0.5">{{ item.suffix }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next'
import type { StatItem } from './types'

interface Props {
  mainLabel: string
  mainValue: number
  statItems: StatItem[]
  animationKey: number
  animationReady: boolean
}

defineProps<Props>()
</script>
