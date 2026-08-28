<template>
  <div class="container" v-if="isShowPage">
    <section class="workbench-panel">
      <SmartTaskAuditToolbar
        :disabled="Boolean(gridOptions.loading)"
        :search-visible="searchVisible"
        :tool-buttons="['setting', 'search', 'help']"
        @create-task="openCreateTaskModal"
        @delete-task="deleteTaskHandle"
        @redo-task="redoTaskHandle"
        @redo-task-with-complete-rule="redoTaskWithCompleteRuleHandle"
        @open-priority="openPriorityModal"
        @export="exportHandle"
        @setting-click="openColSetting"
        @toggle-search="toggleSearchVisible"
        @open-progress="openProgressModal"
        @help="getHelpMessageHandle"
      />

      <SmartTaskAuditSearch
        ref="searchFormRef"
        :visible="searchVisible"
        :loading="Boolean(gridOptions.loading)"
        :search-form="searchForm"
        :status-options="taskStatusOptions"
        :doc-pre-status-options="docPreStatusOptions"
        :yes-no-options="yesNoOptions"
        :priority-options="priorityOptions"
        :year-list="yearList"
        :yjdw-list="yjdwList"
        :ejdw-list="searchEjdwList"
        :project-type-list="projectTypeList"
        @search="searchHandle"
        @reset="resetHandle"
        @yjdw-change="searchYjdwChangeHandle"
      />

      <div class="table-region">
        <RangeVxeTable
          ref="gridRef"
          :columns="gridOptions.columns"
          :loading="Boolean(gridOptions.loading)"
          :request-api="requestTaskList"
          :request-error="requestTaskListError"
          :page-size="20"
          :page-sizes="[10, 20, 50, 100, 500]"
          row-key="taskId"
          row-click-mode="exclusive"
          column-setting
          border
          stripe
          @selection-change="syncSelectedRows"
        >
          <template #taskName_default="{ row }">
            <button type="button" class="task-name-link" @click.stop="openDetailModal(row)">
              {{ row.taskName || '-' }}
            </button>
          </template>
        </RangeVxeTable>
      </div>
    </section>
  </div>

  <HelpModal ref="helpModalRef" />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
  <CreateTaskModal
    ref="createTaskModalRef"
    :modal="createTaskModal"
    :search-form="projectSearchForm"
    :grid-options="projectGridOptions"
    :page="projectPage"
    :selected-count="selectedProjectRows.length"
    :year-list="yearList"
    :yjdw-list="yjdwList"
    :ejdw-list="ejdwList"
    :project-type-list="projectTypeList"
    :yjfl-list="yjflList"
    :ejfl-list="ejflList"
    :sjfl-list="sjflList"
    :flow-status-list="flowStatusList"
    @close="closeCreateTaskModal"
    @search="searchProjectHandle"
    @reset="resetProjectHandle"
    @create="createTaskHandle"
    @page-change="projectPageChangeHandle"
    @limit-change="projectLimitChangeHandle"
    @selection-change="syncSelectedProjectRows"
    @yjdw-change="yjdwChangeHandle"
    @yjfl-change="yjflChangeHandle"
    @ejfl-change="ejflChangeHandle"
  />
  <DetailModal :modal="detailModal" :detail-row="detailRow" @close="closeDetailModal" />
  <PriorityModal
    ref="priorityFormRef"
    :modal="priorityModal"
    :priority-form="priorityForm"
    :priority-options="priorityOptions"
    @save="savePriorityHandle"
    @close="closePriorityModal"
  />
  <smartTaskProgress ref="progressModal" />
</template>

<script lang="ts">
export default {
  name: '/ai/smartTaskAuditAdmin/index'
}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import HelpModal from '@/components/HelpModal/index.vue'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import SmartTaskAuditToolbar from './components/SmartTaskAuditToolbar.vue'
import SmartTaskAuditSearch from './components/SmartTaskAuditSearch.vue'
import CreateTaskModal from './components/CreateTaskModal.vue'
import DetailModal from './components/DetailModal.vue'
import PriorityModal from './components/PriorityModal.vue'
import smartTaskProgress from './components/smartTaskProgress.vue'
import { useAiSmartTaskAuditPage } from './hooks/useAiSmartTaskAuditPage'

const {
  isShowPage,
  searchVisible,
  userRoleSelectorRef,
  helpModalRef,
  gridRef,
  searchFormRef,
  createTaskModalRef,
  priorityFormRef,
  searchForm,
  projectSearchForm,
  taskStatusOptions,
  docPreStatusOptions,
  yesNoOptions,
  priorityOptions,
  yearList,
  yjdwList,
  ejdwList,
  projectTypeList,
  searchEjdwList,
  yjflList,
  ejflList,
  sjflList,
  flowStatusList,
  gridOptions,
  requestTaskList,
  requestTaskListError,
  projectGridOptions,
  projectPage,
  createTaskModal,
  detailModal,
  detailRow,
  priorityModal,
  priorityForm,
  selectedProjectRows,
  getRoleHandle,
  resetHandle,
  resetProjectHandle,
  searchHandle,
  searchProjectHandle,
  projectPageChangeHandle,
  projectLimitChangeHandle,
  getHelpMessageHandle,
  openColSetting,
  toggleSearchVisible,
  openCreateTaskModal,
  closeCreateTaskModal,
  openDetailModal,
  closeDetailModal,
  openPriorityModal,
  closePriorityModal,
  savePriorityHandle,
  createTaskHandle,
  deleteTaskHandle,
  redoTaskHandle,
  redoTaskWithCompleteRuleHandle,
  exportHandle,
  searchYjdwChangeHandle,
  yjdwChangeHandle,
  yjflChangeHandle,
  ejflChangeHandle,
  syncSelectedRows,
  syncSelectedProjectRows,
  openProgressModal,
  progressModal
} = useAiSmartTaskAuditPage()

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@primary-color: #00706b;
@primary-hover: #2a9a92;
@primary-active: #005f5a;
@primary-disabled: #a8cfcb;
@primary-soft: #f2f9f8;
@primary-hover-fill: #e6f4f3;
@primary-border-soft: #b8ddd9;
@table-header: #dff3f0;
@table-stripe: #f7fcfb;
@table-current: #d8efec;
@border-soft: #e2e8f0;
@border-faint: #eef2f6;
@text-primary: #1e293b;
@text-regular: #475569;
@text-muted: #64748b;

.container {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f5fbfb;

  :deep(.el-button) {
    height: 28px;
    min-height: 28px;
    margin-left: 0;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }

  :deep(.el-button--primary),
  :deep(.el-button--primary.is-plain) {
    color: @primary-color !important;
    background-color: @primary-soft !important;
    border-color: @primary-border-soft !important;
    background-image: none !important;
  }

  :deep(.el-button--primary:hover:not(.is-disabled)),
  :deep(.el-button--primary:focus:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:hover:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:focus:not(.is-disabled)) {
    color: @primary-color !important;
    background-color: @primary-hover-fill !important;
    border-color: @primary-color !important;
  }

  :deep(.el-button--primary:active:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:active:not(.is-disabled)) {
    color: @primary-active !important;
    background-color: @primary-hover-fill !important;
    border-color: @primary-active !important;
  }

  :deep(.el-button--primary.is-disabled),
  :deep(.el-button--primary.is-disabled:hover),
  :deep(.el-button--primary.is-plain.is-disabled),
  :deep(.el-button--primary.is-plain.is-disabled:hover) {
    color: @primary-disabled !important;
    background-color: @primary-soft !important;
    border-color: @primary-border-soft !important;
  }

  :deep(.el-input__inner) {
    height: 32px;
    border-radius: 6px;
    color: @text-regular;
  }

  :deep(.el-input__inner:hover) {
    border-color: @primary-border-soft;
  }

  :deep(.el-input__inner:focus) {
    border-color: @primary-color;
  }
}

.workbench-panel {
  flex: 1 1 0;
  height: 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
  border: 1px solid @border-soft;
  border-radius: 12px;
  box-sizing: border-box;
}

.table-region {
  flex: 1 1 0;
  height: 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  overflow: hidden;

  :deep(.vxe-grid),
  :deep(.vxe-table) {
    width: 100% !important;
    height: 100% !important;
    color: @text-regular;
    --vxe-font-color: @text-regular;
    --vxe-table-header-font-color: @primary-color;
    --vxe-table-header-background-color: @table-header;
    --vxe-table-header-font-weight: 600;
    --vxe-table-border-color: @border-soft;
    --vxe-table-border-width: 1px;
    --vxe-table-row-hover-background-color: @primary-hover-fill;
    --vxe-table-row-striped-background-color: @table-stripe;
    --vxe-table-row-current-background-color: @table-current;
    --vxe-table-row-checkbox-checked-background-color: @table-current;
  }

  :deep(.vxe-table--border-line) {
    border-color: @border-soft !important;
  }

  :deep(.vxe-table--header-wrapper),
  :deep(.vxe-table--header),
  :deep(.vxe-header--column) {
    background-color: @table-header !important;
  }

  :deep(.vxe-header--column) {
    height: 44px;
    color: @primary-color !important;
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.vxe-body--column) {
    color: @text-regular;
    font-size: 13px;
  }

  :deep(.vxe-body--row.row--stripe) {
    background-color: @table-stripe !important;
  }

  :deep(.vxe-body--row.row--checked),
  :deep(.vxe-body--row.row--current) {
    background-color: @table-current !important;
  }

  :deep(.vxe-body--row.row--hover),
  :deep(.vxe-body--row.row--hover.row--stripe),
  :deep(.vxe-body--row.row--hover.row--checked),
  :deep(.vxe-body--row.row--hover.row--current) {
    background-color: @primary-hover-fill !important;
  }

  :deep(.vxe-body--row.row--stripe .vxe-body--column),
  :deep(.vxe-body--row.row--checked .vxe-body--column),
  :deep(.vxe-body--row.row--hover .vxe-body--column),
  :deep(.vxe-body--row.row--current .vxe-body--column) {
    background-color: transparent !important;
  }

  :deep(.vxe-checkbox--icon),
  :deep(.vxe-cell--checkbox .vxe-checkbox--checked-icon),
  :deep(.vxe-cell--checkbox .vxe-checkbox--indeterminate-icon) {
    color: @primary-color !important;
  }
}

.task-name-link {
  display: inline-block;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
  color: @primary-color;
  font: inherit;
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
  outline: none;
}

.task-name-link:hover,
.task-name-link:focus-visible {
  color: @primary-active;
  text-decoration: underline;
  text-underline-offset: 3px;
}

:deep(.el-pagination) {
  flex-shrink: 0;
  justify-content: flex-end;
  margin: 0 !important;
  padding: 8px 12px;
  border-top: 1px solid @border-faint;
  color: @text-muted;
  background-color: #ffffff;

  &.is-background .btn-prev,
  &.is-background .btn-next,
  &.is-background .el-pager li,
  .btn-prev,
  .btn-next,
  .el-pager li {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
    margin: 0 2px;
    border-radius: 6px;
    color: @text-primary !important;
    background-color: transparent !important;
    border: 1px solid transparent !important;
  }

  &.is-background .el-pager li:not(.disabled):not(.is-active):hover,
  &.is-background .el-pager li:not(.disabled):not(.active):hover,
  &.is-background .btn-prev:not(:disabled):hover,
  &.is-background .btn-next:not(:disabled):hover,
  .el-pager li:not(.disabled):not(.is-active):hover,
  .el-pager li:not(.disabled):not(.active):hover,
  .btn-prev:not(:disabled):hover,
  .btn-next:not(:disabled):hover {
    color: @primary-color !important;
    background-color: @primary-soft !important;
    border-color: @primary-border-soft !important;
  }

  &.is-background .el-pager li:not(.disabled).is-active,
  &.is-background .el-pager li:not(.disabled).active,
  .el-pager li:not(.disabled).is-active,
  .el-pager li:not(.disabled).active {
    color: #ffffff !important;
    background-color: @primary-color !important;
    border-color: @primary-color !important;
    font-weight: 600;
  }

  .btn-prev:disabled,
  .btn-next:disabled,
  .btn-prev.is-disabled,
  .btn-next.is-disabled,
  .el-pager li.disabled {
    color: #94a3b8 !important;
    background-color: transparent !important;
  }
}
</style>
