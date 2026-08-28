<template>
  <div class="container" v-if="isShowPage">
    <section class="workbench-panel">
      <SmartTaskAuditToolbar
        :disabled="Boolean(gridOptions.loading)"
        :search-visible="searchVisible"
        :selected-count="selectedTaskCount"
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
    :target-task-names="selectedTaskNames"
    @save="savePriorityHandle"
    @close="closePriorityModal"
  />
  <smartTaskProgress ref="progressModal" />
</template>

<script lang="ts">
export default {
  name: '/ai/smartTaskAudit/index'
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
  selectedTaskCount,
  selectedTaskNames,
  openProgressModal,
  progressModal
} = useAiSmartTaskAuditPage()

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/tokens.less';

// 业务根：外边距交给 .rr-view-ctx（10px），此处不再叠一层
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
  background: @page-bg;

  /* 命令按钮基准：28px 高、6px 圆角、12px/500 */
  :deep(.el-button) {
    height: 28px;
    min-height: 28px;
    margin-left: 0;
    padding: 7px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    transition: color 0.12s ease, background-color 0.12s ease, border-color 0.12s ease;
  }

  /* ========== 按钮锁色：浅青绿 plain 基准，禁止 Element 默认蓝 ========== */
  :deep(.el-button--primary),
  :deep(.el-button--primary.is-plain) {
    color: @primary-solid !important;
    background-color: @primary-bg-light !important;
    border-color: @primary-border-light !important;
    background-image: none !important;
    box-shadow: none;
  }

  :deep(.el-button--primary:hover:not(.is-disabled)),
  :deep(.el-button--primary:focus:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:hover:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:focus:not(.is-disabled)) {
    color: @primary-solid !important;
    background-color: @primary-bg-hover !important;
    border-color: @primary-solid !important;
    background-image: none !important;
    box-shadow: none;
    opacity: 1 !important;
    transform: none;
  }

  :deep(.el-button--primary:active:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:active:not(.is-disabled)) {
    color: @primary-solid-active !important;
    background-color: @primary-bg-hover !important;
    border-color: @primary-solid-active !important;
    background-image: none !important;
    transform: none;
  }

  :deep(.el-button--primary.is-disabled),
  :deep(.el-button--primary.is-disabled:hover),
  :deep(.el-button--primary.is-disabled:focus),
  :deep(.el-button--primary.is-disabled:active),
  :deep(.el-button--primary.is-plain.is-disabled),
  :deep(.el-button--primary.is-plain.is-disabled:hover) {
    color: @primary-text-disabled !important;
    background-color: @primary-bg-light !important;
    border-color: @primary-border-light !important;
    background-image: none !important;
    box-shadow: none;
    transform: none;
  }

  /* 次级命令（重置 / 展开收起）：白底、正文墨字、结构边，悬停走青绿雾面 */
  :deep(.el-button.is-plain:not(.el-button--primary)) {
    color: @text-secondary !important;
    background: @surface !important;
    border-color: @border-main !important;

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      color: @primary-solid !important;
      background: @primary-bg-light !important;
      border-color: @primary-border-light !important;
    }
  }

  :deep(.el-input__inner) {
    height: 32px;
    line-height: 32px;
    border-radius: 6px;
    border-color: @border-main;
    color: @text-secondary;
  }

  :deep(.el-input__inner:hover) {
    border-color: @primary-border-light;
  }

  :deep(.el-input__inner:focus),
  :deep(.el-input.is-focus .el-input__inner),
  :deep(.el-select .el-input.is-focus .el-input__inner) {
    border-color: @primary-solid;
  }
}

/* 唯一一层业务外框：白底、1px 结构边、12px 圆角、无阴影 */
.workbench-panel {
  flex: 1 1 0;
  height: 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: @surface;
  border: 1px solid @border-main;
  border-radius: 12px;
  box-sizing: border-box;
  box-shadow: none;
}

.table-region {
  flex: 1 1 0;
  height: 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  overflow: hidden;

  /* 表格区吃满剩余高度，纵向滚动只归表体 */
  :deep(.table-main) {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    height: 0;
    background: @surface;
    contain: layout paint;
  }

  /*
   * vxe border=true → .border--full，用 background-image 画网格。
   * 列上只写 background-color，禁止 background 简写 / background-image:none。
   */
  :deep(.vxe-grid),
  :deep(.vxe-table) {
    width: 100% !important;
    height: 100% !important;
    color: @text-secondary;
    --vxe-font-color: @text-secondary;
    --vxe-table-header-font-color: @table-header-text;
    --vxe-table-header-background-color: @table-header-bg;
    --vxe-table-header-font-weight: 600;
    --vxe-table-border-color: @border-main;
    --vxe-table-border-width: 1px;
    --vxe-table-row-hover-background-color: @table-hover-bg;
    --vxe-table-row-striped-background-color: @table-stripe-bg;
    --vxe-table-row-current-background-color: @table-current-bg;
    --vxe-table-row-checkbox-checked-background-color: @table-current-bg;
    --vxe-table-row-hover-current-background-color: @table-hover-bg;
    --vxe-table-row-hover-checkbox-checked-background-color: @table-hover-bg;
    --vxe-table-row-hover-striped-background-color: @table-hover-bg;
    background-color: @surface !important;
  }

  :deep(.vxe-table--border-line) {
    border-color: @border-main !important;
  }

  :deep(.vxe-table--header-wrapper),
  :deep(.vxe-table--header),
  :deep(.vxe-header--column) {
    background-color: @table-header-bg !important;
  }

  :deep(.vxe-header--column) {
    height: 44px;
    color: @table-header-text !important;
    font-size: 13px;
    font-weight: 600;

    .vxe-cell {
      color: inherit;
      font-size: 13px;
    }
  }

  :deep(.vxe-body--column) {
    height: 44px;
    color: @text-secondary;
    font-size: 13px;

    .vxe-cell {
      line-height: 20px;
      font-size: 13px;
    }
  }

  :deep(.vxe-body--row.row--stripe) {
    background-color: @table-stripe-bg !important;
  }

  /* 行态只铺底，不强制改字色 */
  :deep(.vxe-body--row.row--checked),
  :deep(.vxe-body--row.row--checked.row--stripe),
  :deep(.vxe-body--row.row--radio),
  :deep(.vxe-body--row.row--current) {
    background-color: @table-current-bg !important;
  }

  :deep(.vxe-body--row.row--hover),
  :deep(.vxe-body--row.row--hover.row--stripe),
  :deep(.vxe-body--row.row--hover.row--checked),
  :deep(.vxe-body--row.row--hover.row--checked.row--stripe),
  :deep(.vxe-body--row.row--hover.row--current),
  :deep(.vxe-body--row.row--hover.row--radio) {
    background-color: @table-hover-bg !important;
  }

  :deep(.vxe-body--row.row--stripe .vxe-body--column),
  :deep(.vxe-body--row.row--checked .vxe-body--column),
  :deep(.vxe-body--row.row--hover .vxe-body--column),
  :deep(.vxe-body--row.row--current .vxe-body--column),
  :deep(.vxe-body--row.row--radio .vxe-body--column) {
    background-color: transparent !important;
  }

  /* 表头勾选：主色压在雾面表头上 */
  :deep(.vxe-header--column .vxe-checkbox--icon),
  :deep(.vxe-header--column .vxe-checkbox--checked-icon),
  :deep(.vxe-header--column .vxe-checkbox--indeterminate-icon),
  :deep(.vxe-header--column .vxe-checkbox--unchecked-icon) {
    color: @table-header-text !important;
  }

  :deep(.vxe-checkbox--icon) {
    font-size: 15px;
  }

  :deep(.vxe-cell--checkbox .vxe-checkbox--checked-icon),
  :deep(.vxe-cell--checkbox .vxe-checkbox--indeterminate-icon) {
    color: @primary-solid !important;
  }

  /* 空态 */
  :deep(.vxe-table--empty-placeholder),
  :deep(.vxe-table--empty-content) {
    color: @text-muted;
    font-size: 13px;
  }
}

.task-name-link {
  display: inline-block;
  max-width: 100%;
  padding: 0;
  overflow: hidden;
  color: @primary-solid;
  font: inherit;
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  outline: none;
  transition: color 0.12s ease;
}

.task-name-link:hover,
.task-name-link:focus-visible {
  color: @primary-solid-active;
  text-decoration: underline;
}

.task-name-link:focus-visible {
  outline: 2px solid @primary-solid;
  outline-offset: 2px;
  border-radius: 2px;
}

/* 分页：融入白卡片底，右对齐，顶部轻分割线 */
:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-button-bg-color: transparent;
  --el-pagination-button-color: @text-secondary;
  --el-pagination-hover-color: @primary-solid;
  --el-pagination-font-size: 12px;
  flex-shrink: 0;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 2px;
  margin: 0 !important;
  padding: 8px 12px;
  border-top: 1px solid @border-light;
  color: @text-muted;
  background: @surface;

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
    color: @text-secondary !important;
    background-color: transparent !important;
    border: none !important;
    font-size: 12px;
    font-weight: 500;
    transition: color 0.12s ease, background-color 0.12s ease;
  }

  .btn-prev .el-icon,
  .btn-next .el-icon,
  .btn-prev i,
  .btn-next i {
    color: inherit !important;
  }

  &.is-background .el-pager li:not(.disabled):not(.is-active):hover,
  &.is-background .btn-prev:not(:disabled):hover,
  &.is-background .btn-next:not(:disabled):hover,
  .el-pager li:not(.disabled):not(.is-active):hover,
  .btn-prev:not(:disabled):hover,
  .btn-next:not(:disabled):hover {
    color: @primary-solid !important;
    background-color: @primary-bg-light !important;
  }

  &.is-background .el-pager li:not(.disabled).is-active,
  .el-pager li:not(.disabled).is-active {
    color: #ffffff !important;
    background-color: @primary-solid !important;
    border-color: transparent !important;
    font-weight: 600;
    box-shadow: none;
  }

  &.is-background .btn-prev:disabled,
  &.is-background .btn-next:disabled,
  &.is-background .el-pager li.disabled,
  .btn-prev:disabled,
  .btn-next:disabled,
  .btn-prev.is-disabled,
  .btn-next.is-disabled,
  .el-pager li.disabled {
    color: #cbd5e1 !important;
    background-color: transparent !important;
    border-color: transparent !important;
  }

  .el-pagination__total,
  .el-pagination__sizes,
  .el-pagination__jump {
    height: 28px;
    line-height: 28px;
    color: @text-muted !important;
    font-size: 12px;
    font-weight: 400;
  }

  .el-pagination__total {
    margin-right: 10px;
  }

  .el-pagination__sizes {
    margin-right: 8px;
  }

  .el-pagination__jump {
    margin-left: 8px;
  }

  .el-pagination__sizes .el-input,
  .el-pagination__jump .el-input {
    margin: 0 4px;
  }

  .el-pagination__sizes .el-input__inner,
  .el-pagination__jump .el-input__inner,
  .el-pagination__editor.el-input .el-input__inner {
    height: 28px;
    line-height: 28px;
    border: 1px solid @border-main;
    border-radius: 6px;
    background: @surface;
    color: @text-secondary !important;
    font-size: 12px;
  }

  .el-select .el-input .el-select__caret {
    color: @text-muted;
  }
}
</style>
