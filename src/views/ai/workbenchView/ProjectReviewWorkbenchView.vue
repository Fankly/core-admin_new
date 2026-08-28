<template>
  <section v-if="isShowPage" class="review-workbench">
    <WorkbenchHeader v-if="!isPreviewOpen" :total="page.total" :refreshing="refreshing" @refresh="refreshData" @help="openHelpModal" />

    <div
      ref="previewStageRef"
      class="workbench-body"
      :class="{
        'workbench-body--left-collapsed': isLeftCollapsed,
        'workbench-body--preview-open': isPreviewOpen
      }"
      :style="{ '--preview-drawer-width': previewWidthStyle }"
    >
      <ProjectListPanel
        v-if="!isPreviewOpen"
        :projects="projects"
        :selected-project="selectedProject"
        :status-tabs="statusTabs"
        :active-status="activeStatus"
        :keyword="keyword"
        :refreshing="refreshing"
        :page="page"
        :status-class="statusClass"
        :error-text="listErrorMessage"
        @update:keyword="keyword = $event"
        @create-task="openCreateTaskModal"
        @status-change="searchProject"
        @select-project="selectProject"
        @open-progress="openProgress"
        @page-change="pageChangeHandle"
        @limit-change="limitChangeHandle"
        @reload="refreshData"
        @clear-filters="clearFilters"
      />

      <el-tooltip v-if="!isPreviewOpen" :content="isLeftCollapsed ? '展开项目列表' : '收起项目列表'" placement="right" effect="light">
        <button
          type="button"
          class="left-collapse-toggle"
          :aria-label="isLeftCollapsed ? '展开项目列表' : '收起项目列表'"
          :aria-expanded="!isLeftCollapsed"
          aria-controls="workbench-project-list"
          @click="isLeftCollapsed = !isLeftCollapsed"
        >
          <el-icon class="left-collapse-toggle__icon" :class="{ 'is-collapsed': isLeftCollapsed }" aria-hidden="true">
            <ArrowLeft />
          </el-icon>
        </button>
      </el-tooltip>

      <main class="review-detail" :key="selectedProject.id">
        <ProjectSummary
          :project="selectedProject"
          :expanded="isProjectInfoExpanded"
          :audit-summary="auditSummary"
          :conclusion-class="conclusionClass"
          @toggle="isProjectInfoExpanded = !isProjectInfoExpanded"
          @show-more="showProjectInfo"
          @retry="retryAuditSummary"
          @navigate-price-view="handlePriceViewNavigate"
        />
        <div class="review-workspace-stage">
          <RuleWorkspace
            :project-task-id="String(selectedProject.taskId || '')"
            :selected-rules="selectedRules"
            :filtered-rules="filteredRules"
            :selected-rule="selectedRule"
            :rule-filters="ruleFilters"
            :active-rule-filter="activeRuleFilter"
            :rules-loading="rulesLoading"
            :rule-detail-loading="ruleDetailLoading"
            :rule-empty-text="ruleEmptyText"
            :rule-error-text="ruleLoadError"
            :rule-classifies="ruleClassifies"
            :preview-open="isPreviewOpen"
            :can-rerun="true"
            :rerunning-rule-ids="rerunningRuleIds"
            :rerun-confirming-rule-id="rerunConfirmingRuleId"
            @filter-change="changeRuleFilter"
            @select-rule="selectRule"
            @rerun-rule="rerunRule"
            @preview-attach="openMaterialPreview"
            @reload-rules="reloadRules"
            @navigate-price-view="handlePriceViewNavigate"
          />
        </div>
        <DocumentPreviewPanel
          v-if="isPreviewOpen"
          ref="previewPanelRef"
          :visible="isPreviewOpen"
          :loading="previewLoading"
          :error-text="previewErrorText"
          :source="previewSource"
          :file-name="previewFileName"
          :file-type="previewFileType"
          :width="previewWidthStyle"
          :width-value="previewWidthValue"
          :min-width="previewMinWidth"
          :max-width="previewMaxWidth"
          :pdf-options="previewPdfOptions"
          :toolbar-options="previewToolbarOptions"
          @close="closePreview"
          @reload="reloadPreview"
          @error="handlePreviewError"
          @resize-start="startPreviewResize"
          @resize-keydown="handlePreviewResizeKeydown"
          @reset-width="resetPreviewWidth"
        />
      </main>
    </div>

    <CentralizedModification ref="projectDetailRef" transfer :user-info="currentUserRole" :form-data="projectDetailData" :flag="'VIEW'" />
  </section>

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
  <SmartTaskProgress ref="progressModal" />
  <HelpModal ref="helpModalRef" title="工作台使用说明" />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script lang="ts">
export default {
  name: '/ai/workbenchView/ProjectReviewWorkbenchView'
}
</script>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import { openPopPage } from '../smartTaskAudit/components/auditDetailHelpers'
import type { AuditPriceViewPayload } from '../smartTaskAudit/components/auditDetailHelpers'
import HelpModal from '@/components/HelpModal/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import CreateTaskModal from '../smartTaskAudit/components/CreateTaskModal.vue'
import SmartTaskProgress from '../smartTaskAudit/components/smartTaskProgress.vue'
import WorkbenchHeader from './components/WorkbenchHeader.vue'
import ProjectListPanel from './components/ProjectListPanel.vue'
import ProjectSummary from './components/ProjectSummary.vue'
import RuleWorkspace from './components/RuleWorkspace.vue'
import DocumentPreviewPanel from './components/DocumentPreviewPanel.vue'
import { useDocumentPreviewDrawer } from './composables/useDocumentPreviewDrawer'
import { ArrowLeft } from './icons'
import { useProjectReviewWorkbench } from './useProjectReviewWorkbench'

const {
  isShowPage,
  userRoleSelectorRef,
  currentUserRole,
  page,
  getRoleHandle,
  pageChangeHandle,
  limitChangeHandle,
  projects,
  statusTabs,
  ruleFilters,
  ruleClassifies,
  activeStatus,
  keyword,
  activeRuleFilter,
  rulesLoading,
  ruleDetailLoading,
  ruleEmptyText,
  ruleLoadError,
  listErrorMessage,
  helpModalRef,
  rerunningRuleIds,
  rerunConfirmingRuleId,
  refreshing,
  selectedProject,
  selectedRules,
  filteredRules,
  selectedRule,
  auditSummary,
  statusClass,
  conclusionClass,
  selectProject,
  selectRule,
  changeRuleFilter,
  rerunRule,
  openProgress,
  progressModal,
  refreshData,
  searchProject,
  reloadRules,
  retryAuditSummary,
  openHelpModal,
  clearFilters,
  createTaskModalRef,
  projectSearchForm,
  projectGridOptions,
  projectPage,
  createTaskModal,
  yearList,
  yjdwList,
  ejdwList,
  projectTypeList,
  yjflList,
  ejflList,
  sjflList,
  flowStatusList,
  selectedProjectRows,
  openCreateTaskModal,
  closeCreateTaskModal,
  resetProjectHandle,
  searchProjectHandle,
  projectPageChangeHandle,
  projectLimitChangeHandle,
  createTaskHandle,
  syncSelectedProjectRows,
  yjdwChangeHandle,
  yjflChangeHandle,
  ejflChangeHandle
} = useProjectReviewWorkbench()

const isLeftCollapsed = ref(false)
const isProjectInfoExpanded = ref(false)
const previewStageRef = ref<HTMLElement | null>(null)
const previewPanelRef = ref<InstanceType<typeof DocumentPreviewPanel> | null>(null)
const projectDetailRef = ref<InstanceType<typeof CentralizedModification> | null>(null)
const projectDetailData = ref({ id: '', xmlx: '' })

const {
  visible: isPreviewOpen,
  loading: previewLoading,
  errorText: previewErrorText,
  source: previewSource,
  fileName: previewFileName,
  fileType: previewFileType,
  widthStyle: previewWidthStyle,
  widthValue: previewWidthValue,
  minWidth: previewMinWidth,
  maxWidth: previewMaxWidth,
  pdfOptions: previewPdfOptions,
  toolbarOptions: previewToolbarOptions,
  open: openPreview,
  close: closePreview,
  reload: reloadPreview,
  resetWidth: resetPreviewWidth,
  startResize: startPreviewResize,
  handleResizeKeydown: handlePreviewResizeKeydown,
  handleError: handlePreviewError
} = useDocumentPreviewDrawer(previewStageRef)

const openMaterialPreview = (file: TXmAttach, trigger?: HTMLElement | null) => {
  void openPreview(file, trigger)
}

const showProjectInfo = async () => {
  const project = selectedProject.value
  const id = String(project.xmId || project.proId || project.id || '').trim()
  if (!id) {
    ElMessage.warning('请选择一条项目数据')
    return
  }

  const xmlx = String(project.pro_type_id || project.proType || project.proTypeId || '').trim()
  if (!xmlx) {
    ElMessage.warning('当前项目缺少项目类型，无法查看详情')
    return
  }

  projectDetailData.value = { id, xmlx }
  await nextTick()
  if (projectDetailRef.value) projectDetailRef.value.isShowModal = true
}

const PRICE_LIBRARY_PATH = '/ai/materialPriceLibrary/index'

/** 点击 .gwPriceView / .materialNewestPriceView：新标签页打开物料价格库对应 tab，携带当前角色 spRoleId 供目标页比对 */
const handlePriceViewNavigate = (payload: AuditPriceViewPayload) => {
  const tab = payload.type === 'gwPriceView' ? 'materialPriceLibrary' : 'historyPrice'
  const spRoleId = currentUserRole.value?.spRoleId || ''
  openPopPage(PRICE_LIBRARY_PATH, spRoleId ? { tab, spRoleId } : { tab })
}

watch(
  () => selectedProject.value.taskId,
  () => {
    isProjectInfoExpanded.value = false
    closePreview({ restoreFocus: false })
  }
)

watch(isPreviewOpen, (visible) => {
  if (visible) void nextTick(() => previewPanelRef.value?.focus({ preventScroll: true }))
})
</script>

<style lang="less">
@import './css/index.less';
@import './css/preview.less';
</style>
