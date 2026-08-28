<template>
  <div class="bw-page" v-if="isShowPage">
    <main class="bw-main">
      <ModuleCards :module-configs="moduleConfigs" :current-module-id="currentModuleId" @select-module="selectModule" @menu-click="handleMenuClick" />

      <section class="bw-content-grid tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-3 tw-items-stretch tw-flex-1 tw-min-h-0">
        <div class="bw-content-cell lg:tw-col-span-2 tw-h-full">
          <MeetingList
            :meetings="pagedMeetings"
            :total="meetingTotal"
            :current-level="currentLevel"
            :current-status="currentStatus"
            :search-query="searchQuery"
            :list-config="currentModule.listConfig"
            :card-type="currentModule.cardType"
            :current-page="currentPage"
            :page-size="pageSize"
            :loading="workbenchLoading"
            :year-options="yearOptions"
            :current-year="currentYear"
            :has-permission="currentModulePermission"
            :permission-loading="currentModulePermissionLoading"
            :permission-text="currentModulePermissionText"
            :animation-key="listAnimationKey"
            :animation-ready="listAnimationReady"
            @set-level="setLevelFilter"
            @set-status="setStatusFilter"
            @search="handleSearch"
            @select-meeting="selectMeeting"
            @open-project="openRequirementProject"
            @page-change="handlePageChange"
            @size-change="handlePageSizeChange"
            @year-change="handleYearChange"
          />
        </div>

        <div class="bw-content-cell lg:tw-col-span-1 tw-h-full">
          <StatisticsPanel
            :statistics="statistics"
            :card-type="currentModule.cardType"
            :animation-key="statisticsAnimationKey"
            :animation-ready="statisticsAnimationReady"
          />
        </div>
      </section>
    </main>
  </div>

  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script lang="ts">
export default {
  name: '/ai/businessWorkbench/index'
}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import ModuleCards from './components/ModuleCards.vue'
import MeetingList from './components/MeetingList.vue'
import StatisticsPanel from './components/StatisticsPanel.vue'
import { useBusinessWorkbench } from './hooks/useBusinessWorkbench'
import './styles.css'

const {
  isShowPage,
  userRoleSelectorRef,
  currentLevel,
  currentStatus,
  searchQuery,
  currentModuleId,
  currentYear,
  yearOptions,
  currentModule,
  moduleConfigs,
  filteredMeetings,
  pagedMeetings,
  meetingTotal,
  currentModulePermission,
  currentModulePermissionText,
  statistics,
  currentMeetingId,
  currentPage,
  pageSize,
  workbenchLoading,
  currentModulePermissionLoading,
  listAnimationKey,
  statisticsAnimationKey,
  listAnimationReady,
  statisticsAnimationReady,
  setLevelFilter,
  setStatusFilter,
  handleSearch,
  handleYearChange,
  selectModule,
  selectMeeting,
  handleMenuClick,
  openRequirementProject,
  getRoleHandle,
  handlePageChange,
  handlePageSizeChange
} = useBusinessWorkbench()

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>
