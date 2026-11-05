<template>
  <div class="container" v-if="isShowPage">
    <DocumentToolbar
      :disabled="Boolean(gridOptions.loading)"
      :search-visible="searchVisible"
      :exporting="exporting"
      :selected-count="selectedCount"
      :selected-fj-id="selectedFjId"
      :tool-buttons="['setting', 'search', 'help']"
      @create-task="openCreateTaskModal"
      @redo-task="redoTaskHandle"
      @async-task="asyncTaskHandle"
      @open-detail="openDetailModal"
      @open-edit="openEditModal"
      @edit-attach-type="openAttachTypeEdit"
      @batch-update="batchUpdateHandle"
      @open-priority="openPriorityModal"
      @delete-task="deleteTaskHandle"
      @open-chapter="openChapterModal"
      @export="exportHandle"
      @setting-click="openColSetting"
      @toggle-search="toggleSearchVisible"
      @help="getHelpMessageHandle"
    />

    <DocumentSearch
      ref="searchFormRef"
      :visible="searchVisible"
      :loading="Boolean(gridOptions.loading)"
      :search-form="searchForm"
      :year-list="yearList"
      :yjdw-list="yjdwList"
      :attach-type-list="attachTypeList"
      :project-type-list="projectTypeList"
      :flow-status-list="flowStatusList"
      @search="searchHandle"
      @reset="resetHandle"
    />

    <DocumentTable
      ref="gridRef"
      :grid-options="gridOptions"
      @cell-click="cellClickHandle"
      @checkbox-change="syncSelectedRows"
      @checkbox-all="syncSelectedRows"
      @download-attach="downloadAttachHandle"
    />

    <el-pagination
      :current-page="page.page"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="limitChangeHandle"
      @current-change="pageChangeHandle"
    ></el-pagination>
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
    :project-type-list="projectTypeList"
    :flow-status-list="flowStatusList"
    @close="closeCreateTaskModal"
    @search="searchProjectHandle"
    @reset="resetProjectHandle"
    @create="createTaskHandle"
    @page-change="projectPageChangeHandle"
    @limit-change="projectLimitChangeHandle"
    @selection-change="syncSelectedProjectRows"
  />
  <DetailModal :modal="detailModal" :detail-data="detailData" @close="closeDetailModal" />
  <EditModal
    :modal="editModal"
    :edit-form="editForm"
    :detail-data="detailData"
    @save="saveEditHandle"
    @update="updateEditHandle"
    @close="closeEditModal"
  />
  <AttachTypeEditModal :modal="attachTypeEditModal" :detail="attachTypeEditDetail" @save="saveAttachTypeEdit" @close="closeAttachTypeEdit" />
  <PriorityModal ref="priorityFormRef" :modal="priorityModal" :priority-form="priorityForm" @save="savePriorityHandle" @close="closePriorityModal" />
  <ChapterModal :modal="chapterModal" @close="closeChapterModal" />
</template>

<script lang="ts">
export default {
  name: '/ai/document/index'
}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import HelpModal from '@/components/HelpModal/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import DocumentToolbar from './components/DocumentToolbar.vue'
import DocumentSearch from './components/DocumentSearch.vue'
import DocumentTable from './components/DocumentTable.vue'
import CreateTaskModal from './components/CreateTaskModal.vue'
import DetailModal from './components/DetailModal.vue'
import EditModal from './components/EditModal.vue'
import AttachTypeEditModal from './components/AttachTypeEditModal.vue'
import PriorityModal from './components/PriorityModal.vue'
import ChapterModal from './components/ChapterModal.vue'
import { useAiDocumentPage } from './hooks/useAiDocumentPage'

const {
  isShowPage,
  searchVisible,
  exporting,
  userRoleSelectorRef,
  helpModalRef,
  gridRef,
  searchFormRef,
  createTaskModalRef,
  priorityFormRef,
  searchForm,
  projectSearchForm,
  yearList,
  yjdwList,
  attachTypeList,
  projectTypeList,
  flowStatusList,
  gridOptions,
  projectGridOptions,
  page,
  projectPage,
  createTaskModal,
  selectedProjectRows,
  detailModal,
  detailData,
  editModal,
  editForm,
  attachTypeEditModal,
  attachTypeEditDetail,
  selectedFjId,
  openAttachTypeEdit,
  closeAttachTypeEdit,
  saveAttachTypeEdit,
  priorityModal,
  priorityForm,
  getRoleHandle,
  resetHandle,
  resetProjectHandle,
  searchHandle,
  searchProjectHandle,
  pageChangeHandle,
  limitChangeHandle,
  projectPageChangeHandle,
  projectLimitChangeHandle,
  getHelpMessageHandle,
  openColSetting,
  toggleSearchVisible,
  openCreateTaskModal,
  closeCreateTaskModal,
  createTaskHandle,
  redoTaskHandle,
  asyncTaskHandle,
  openDetailModal,
  closeDetailModal,
  openEditModal,
  closeEditModal,
  saveEditHandle,
  updateEditHandle,
  batchUpdateHandle,
  deleteTaskHandle,
  exportHandle,
  downloadAttachHandle,
  chapterModal,
  selectedCount,
  openChapterModal,
  closeChapterModal,
  openPriorityModal,
  closePriorityModal,
  savePriorityHandle,
  cellClickHandle,
  syncSelectedRows,
  syncSelectedProjectRows
} = useAiDocumentPage()

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
.container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}
</style>
