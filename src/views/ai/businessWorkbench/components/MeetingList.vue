<template>
  <div
    v-loading="loading || permissionLoading"
    class="tw-bg-white tw-rounded-xl tw-border tw-border-slate-200 tw-p-4 bw-panel-card bw-meeting-list tw-flex tw-flex-col"
  >
    <div
      class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-gap-3 tw-mb-3.5 tw-shrink-0 tw-border-b tw-border-slate-200 tw-pb-3.5"
    >
      <div class="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
        <h2 class="tw-font-bold tw-text-slate-800 tw-text-lg tw-tracking-tight tw-m-0">
          {{ listConfig.title }}
        </h2>
        <span
          class="tw-text-xs tw-font-bold tw-px-2 tw-py-0.5 tw-bg-sggreen-50/80 tw-text-sggreen-700 tw-rounded-full tw-shrink-0 tw-border tw-border-sggreen-200/30"
        >
          共 {{ total }} {{ listConfig.unitLabel }}
        </span>
      </div>
      <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-end tw-gap-3 tw-w-full sm:tw-w-auto tw-shrink-0">
        <div class="tw-relative tw-w-full sm:tw-w-48 md:tw-w-56 tw-shrink-0">
          <span class="tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3 tw-pointer-events-none">
            <Search class="tw-h-3.5 tw-w-3.5 tw-text-slate-400" :stroke-width="2" />
          </span>
          <input
            type="text"
            :value="localSearchQuery"
            :placeholder="listConfig.searchPlaceholder"
            class="tw-block tw-w-full tw-pl-9 tw-pr-3 tw-py-1.5 tw-text-sm tw-bg-slate-50 hover:tw-bg-slate-100/50 focus:tw-bg-white tw-border tw-border-slate-200 focus:tw-border-sggreen-500 tw-rounded-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-sggreen-500/20 tw-transition-all placeholder:tw-text-slate-400 tw-font-semibold"
            :disabled="permissionLoading || hasPermission === false"
            @input="handleSearchInput"
          />
        </div>
        <div class="tw-flex tw-items-center tw-justify-end tw-gap-1.5 tw-shrink-0">
          <span class="tw-text-sm tw-font-bold tw-text-slate-600 tw-whitespace-nowrap">年度：</span>
          <el-select
            :model-value="currentYear"
            class="bw-year-select"
            size="small"
            placeholder="请选择"
            :disabled="permissionLoading || yearOptions.length === 0 || hasPermission === false"
            @change="handleYearChange"
          >
            <el-option v-for="year in yearOptions" :key="year.code" :label="year.name" :value="year.code" />
          </el-select>
        </div>
      </div>
    </div>

    <div class="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-gap-2.5 tw-mb-4 tw-shrink-0 lg:tw-justify-between">
      <div class="tw-flex tw-items-center tw-gap-2 tw-w-full lg:tw-w-auto">
        <SegmentedFilter
          v-if="listConfig.showLevelFilter"
          :model-value="currentLevel"
          :options="listConfig.levelOptions"
          :disabled="permissionLoading || hasPermission === false"
          @change="setLevel"
        />
      </div>

      <SegmentedFilter
        :model-value="currentStatus"
        :options="listConfig.statusOptions"
        :disabled="permissionLoading || hasPermission === false"
        @change="setStatus"
      />
    </div>

    <div class="tw-flex-1 tw-min-h-0 tw-overflow-y-auto scrollbar-thin tw-pr-1">
      <div v-if="permissionLoading" class="tw-h-full tw-min-h-40"></div>

      <div
        v-else-if="hasPermission === false"
        :key="`permission-${animationKey}`"
        class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-py-20 tw-text-center tw-select-none"
        :class="{ 'animate-fade-in-up': animationReady }"
      >
        <div class="tw-p-3 tw-rounded-xl tw-bg-slate-100 tw-text-slate-400 tw-mb-2.5">
          <Lock class="tw-w-8 tw-h-8" :stroke-width="1.8" />
        </div>
        <p class="tw-text-sm tw-font-bold tw-text-slate-400 tw-mb-0">暂无权限</p>
        <p class="tw-text-xs tw-text-slate-400/80 tw-mt-1">{{ permissionText || '该角色无此模块操作权限' }}</p>
      </div>

      <div
        v-else-if="meetings.length === 0"
        :key="`empty-${animationKey}`"
        class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-py-20 tw-text-center"
        :class="{ 'animate-fade-in-up': animationReady }"
      >
        <div class="tw-p-4 tw-rounded-full tw-bg-slate-50 tw-border tw-border-slate-100 tw-text-slate-300 tw-mb-3">
          <FileText class="tw-w-10 tw-h-10" :stroke-width="1.5" />
        </div>
        <p class="tw-text-base tw-font-bold tw-text-slate-400">{{ listConfig.emptyTitle }}</p>
        <p class="tw-text-sm tw-text-slate-400/70 tw-mt-1">请尝试调整筛选条件或搜索关键词</p>
      </div>

      <div v-else class="tw-flex tw-flex-col tw-gap-2 tw-pr-1">
        <MeetingCard
          v-for="(meeting, index) in meetings"
          :key="`${meeting.id}-${animationKey}`"
          :meeting="meeting"
          :index="index"
          :card-type="cardType"
          :animate="animationReady"
          @click="emit('select-meeting', meeting.id)"
          @open-project="emit('open-project', $event)"
        />
      </div>
    </div>

    <div v-if="total > 0 && !permissionLoading && hasPermission !== false" class="tw-pt-3 tw-shrink-0 tw-border-t tw-border-slate-100">
      <el-pagination
        :current-page="currentPage"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { Search, FileText, Lock } from 'lucide-vue-next'
import MeetingCard from './MeetingCard.vue'
import SegmentedFilter from './SegmentedFilter.vue'
import type { LevelFilter, Meeting, ModuleCardType, ModuleListConfig, StatusFilter, YearOption } from '../types'

const SEARCH_DEBOUNCE_MS = 300

interface Props {
  meetings: Meeting[]
  total: number
  currentLevel: LevelFilter
  currentStatus: StatusFilter
  searchQuery: string
  listConfig: ModuleListConfig
  cardType: ModuleCardType
  currentPage: number
  pageSize: number
  loading?: boolean
  yearOptions: YearOption[]
  currentYear: string
  hasPermission?: boolean
  permissionLoading?: boolean
  permissionText?: string
  animationKey: number
  animationReady: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['set-level', 'set-status', 'search', 'select-meeting', 'open-project', 'page-change', 'size-change', 'year-change'])
const localSearchQuery = ref(props.searchQuery)
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.searchQuery,
  (query) => {
    localSearchQuery.value = query
  }
)

const setLevel = (level: LevelFilter | StatusFilter) => {
  emit('set-level', level as LevelFilter)
}

const setStatus = (status: LevelFilter | StatusFilter) => {
  emit('set-status', status as StatusFilter)
}

const handleSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  localSearchQuery.value = target.value

  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    emit('search', localSearchQuery.value)
    searchTimer = null
  }, SEARCH_DEBOUNCE_MS)
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

const handleYearChange = (year: string) => {
  emit('year-change', year)
}
</script>
