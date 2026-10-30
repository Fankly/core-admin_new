<template>
  <div class="document-parsing">
    <ParseSearch
      :loading="loading"
      :search-form="searchForm"
      :year-list="yearList"
      :yjdw-list="yjdwList"
      :project-type-list="projectTypeList"
      :flow-status-list="flowStatusList"
      @search="searchHandle"
      @reset="resetHandle"
    />

    <section class="parse-panel">
      <header class="parse-panel__header">
        <el-tabs v-model="activeTab" class="parse-tabs">
          <el-tab-pane v-for="tab in PARSE_TABS" :key="tab.key" :label="tab.label" :name="tab.key" />
        </el-tabs>
        <div class="parse-panel__actions">
          <el-tooltip :content="editDisabledReason" :disabled="!editDisabledReason" placement="bottom" effect="light">
            <span class="parse-action">
              <el-button type="primary" size="small" plain :disabled="loading || selectedRows.length !== 1" @click="openEditModal"> 修 改 </el-button>
            </span>
          </el-tooltip>
          <el-button type="primary" size="small" plain :disabled="loading" :loading="exporting" @click="exportHandle">导 出</el-button>
        </div>
      </header>

      <div class="parse-panel__body">
        <vxe-grid
          ref="gridRef"
          border
          stripe
          height="100%"
          :loading="loading"
          :columns="columns"
          :data="rows"
          :row-config="{ height: 32 }"
          :column-config="{ resizable: true }"
          :radio-config="{ trigger: 'row', highlight: true }"
          @radio-change="syncSelectedRows"
        />
      </div>

      <el-pagination
        background
        align="center"
        :current-page="page.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="page.limit"
        :total="page.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      />
    </section>

    <AttachTypeEditModal :modal="editModal" :detail="editDetail" @save="saveEdit" @close="closeEditModal" />
  </div>
</template>

<script lang="ts">
export default {
  name: '/ai/documentParsing/index'
}
</script>

<script setup lang="ts">
import ParseSearch from './components/ParseSearch.vue'
import AttachTypeEditModal from '@/views/ai/document/components/AttachTypeEditModal.vue'
import { PARSE_TABS } from './constants'
import { useDocumentParsing } from './hooks/useDocumentParsing'

const {
  activeTab,
  searchForm,
  yearList,
  yjdwList,
  projectTypeList,
  flowStatusList,
  rows,
  loading,
  exporting,
  selectedRows,
  gridRef,
  page,
  columns,
  editModal,
  editDetail,
  editDisabledReason,
  searchHandle,
  resetHandle,
  pageChangeHandle,
  limitChangeHandle,
  exportHandle,
  syncSelectedRows,
  openEditModal,
  closeEditModal,
  saveEdit
} = useDocumentParsing()
</script>

<style scoped lang="less">
.document-parsing {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.parse-panel {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.parse-panel__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid #e2e8f0;
}

.parse-tabs {
  flex: 1 1 auto;
  min-width: 0;
}

.parse-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.parse-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.parse-tabs :deep(.el-tabs__item) {
  height: 46px;
  line-height: 46px;
  font-size: 13px;
}

.parse-tabs :deep(.el-tabs__content) {
  display: none;
}

.parse-panel__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
}

.parse-panel__body {
  flex: 1 1 0;
  min-height: 0;
  padding: 10px 16px 0;
}

.parse-panel :deep(.el-pagination) {
  flex: none;
  padding: 8px 16px 12px;
}
</style>
