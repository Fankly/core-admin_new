<template>
  <vxe-modal
    ref="modalRef"
    :model-value="visible"
    :destroy-on-close="true"
    :show-footer="false"
    :show-close="false"
    show-zoom
    resize
    draggable
    esc-closable
    position="center"
    width="1100"
    height="660"
    title="评审明细"
    class-name="smart-task-audit-review-table-modal"
    @hide="handleHide"
    @show="syncModalZoomState"
    @zoom="syncModalZoomState"
  >
    <template #header>
      <div class="review-table-modal__header">
        <div class="review-table-modal__title-wrap">
          <span class="review-table-modal__title-icon" aria-hidden="true">
            <TableProperties :size="16" />
          </span>
          <span class="review-table-modal__title">评审明细</span>
        </div>
        <div class="review-table-modal__window-controls">
          <button
            type="button"
            class="review-table-modal__window-control"
            :aria-label="isMaximized ? '还原窗口' : '最大化窗口'"
            :title="isMaximized ? '还原窗口' : '最大化窗口'"
            @mousedown.stop
            @dblclick.stop
            @click.stop="handleToggleZoom"
          >
            <img :src="isMaximized ? windowRestoreIcon : windowMaximizeIcon" alt="" />
          </button>
          <button
            type="button"
            class="review-table-modal__window-control review-table-modal__window-control--close"
            aria-label="关闭评审明细"
            title="关闭"
            @mousedown.stop
            @dblclick.stop
            @click.stop="handleClose"
          >
            <X :size="17" aria-hidden="true" />
          </button>
        </div>
      </div>
    </template>
    <div class="review-table-modal__body">
      <div class="review-table-modal__toolbar">
        <el-button
          class="review-table-modal__export"
          type="primary"
          plain
          size="small"
          :loading="exporting"
          :disabled="!detailId || !tables.length"
          @click="handleExport"
        >
          <Download :size="14" aria-hidden="true" />
          <span>导 出</span>
        </el-button>
      </div>
      <div v-if="tables.length" class="review-table-modal__table-section">
        <el-tabs v-if="tables.length > 1" v-model="activeTab" class="review-table-modal__tabs">
          <el-tab-pane
            v-for="(table, tableIndex) in tables"
            :key="`${table.tableMeta?.title || 'table'}-${tableIndex}`"
            :label="getReviewTableTitle(table, `表格 ${tableIndex + 1}`)"
            :name="String(tableIndex)"
          />
        </el-tabs>
        <div class="review-table-modal__grid-wrap">
          <ReviewTableGrid :table="selectedTable" fill />
        </div>
      </div>
      <div v-else class="review-table-modal__empty">
        <span class="review-table-modal__empty-icon" aria-hidden="true">
          <FileSearch :size="22" />
        </span>
        <div class="review-table-modal__empty-copy">
          <span class="review-table-modal__empty-title">暂无评审明细</span>
          <span class="review-table-modal__empty-description">当前规则暂无可展示的表格数据</span>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeModalInstance } from 'vxe-table'
import { Download, FileSearch, TableProperties, X } from 'lucide-vue-next'
import { exportReviewTable } from '@/api/ai/smartTaskAudit'
import { apiExportHandle } from '@/utils/export'
import windowMaximizeIcon from '@/assets/images/smart-review/rule-review-detail/window-maximize.svg'
import windowRestoreIcon from '@/assets/images/smart-review/rule-review-detail/window-restore.svg'
import ReviewTableGrid from './ReviewTableGrid.vue'
import type { ReviewTable } from './auditDetailHelpers'
import { getReviewTableTitle } from './auditDetailHelpers'

const props = withDefaults(
  defineProps<{
    visible: boolean
    tables: ReviewTable[]
    detailId?: string
    ruleName?: string
    initialIndex?: number
  }>(),
  {
    detailId: '',
    ruleName: '',
    initialIndex: 0
  }
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const activeTab = ref('0')
const exporting = ref(false)
const modalRef = ref<VxeModalInstance>()
const isMaximized = ref(false)

const selectedTableIndex = computed(() => {
  const index = Number.parseInt(activeTab.value, 10)
  return Number.isInteger(index) && index >= 0 && index < props.tables.length ? index : 0
})

const selectedTable = computed(() => props.tables[selectedTableIndex.value])

const syncActiveTab = () => {
  const index = Number.isInteger(props.initialIndex) && props.initialIndex >= 0 && props.initialIndex < props.tables.length ? props.initialIndex : 0
  activeTab.value = String(index)
}

const syncModalZoomState = () => {
  isMaximized.value = Boolean(modalRef.value?.isMaximized())
}

const handleToggleZoom = async () => {
  await modalRef.value?.zoom()
  syncModalZoomState()
}

const handleClose = () => {
  emit('close')
}

watch([() => props.visible, () => props.initialIndex, () => props.tables.length], () => syncActiveTab(), { immediate: true })

const handleHide = () => {
  activeTab.value = '0'
  isMaximized.value = false
  emit('close')
}

const handleExport = async () => {
  if (!props.detailId) {
    ElMessage.warning('缺少评审明细标识，无法导出')
    return
  }

  try {
    exporting.value = true
    await apiExportHandle(props.detailId, `${props.ruleName || '审核规则'}-评审明细`, exportReviewTable)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || '')
    ElMessage.error(message || '评审明细导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped lang="less">
.review-table-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 0 8px 0 16px;
  box-sizing: border-box;
}

.review-table-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.review-table-modal__title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  color: #00706b;
  border: 1px solid #b8ddd9;
  border-radius: 6px;
  background-color: #f2f9f8;
}

.review-table-modal__title {
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
}

.review-table-modal__window-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex: 0 0 auto;
}

.review-table-modal__window-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #64748b;
  cursor: pointer;
  border: 0;
  border-radius: 6px;
  background-color: transparent;
}

.review-table-modal__window-control img {
  display: block;
  width: 16px;
  height: 16px;
}

.review-table-modal__window-control:hover,
.review-table-modal__window-control:focus-visible {
  color: #00706b;
  background-color: #e6f4f3;
}

.review-table-modal__window-control:focus-visible {
  outline: 2px solid rgba(0, 112, 107, 0.24);
  outline-offset: 1px;
}

.review-table-modal__window-control--close:hover,
.review-table-modal__window-control--close:focus-visible {
  color: #e3574c;
  background-color: #fff1f0;
}

.review-table-modal__toolbar :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.review-table-modal__toolbar :deep(.review-table-modal__export) {
  height: 30px;
  padding: 0 13px;
  color: #00706b;
  border-color: #b8ddd9;
  border-radius: 6px;
  background-color: #f2f9f8;
}

.review-table-modal__toolbar :deep(.review-table-modal__export:hover),
.review-table-modal__toolbar :deep(.review-table-modal__export:focus-visible) {
  color: #00706b;
  border-color: #00706b;
  background-color: #e6f4f3;
}

.review-table-modal__toolbar :deep(.review-table-modal__export:focus-visible) {
  outline: 2px solid rgba(0, 112, 107, 0.24);
  outline-offset: 2px;
}

.review-table-modal__toolbar :deep(.review-table-modal__export.is-disabled) {
  color: #94a3b8;
  border-color: #e2e8f0;
  background-color: #f8fafc;
}

.review-table-modal__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f5fbfb;
}

.review-table-modal__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  min-height: 50px;
  padding: 9px 16px;
  box-sizing: border-box;
  flex: 0 0 auto;
  border-bottom: 1px solid #e2e8f0;
  background-color: #ffffff;
}

.review-table-modal__table-section {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 12px 16px 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.review-table-modal__tabs {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 40px;
}

.review-table-modal__tabs :deep(.el-tabs__header) {
  margin: 0 0 12px;
}

.review-table-modal__tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e2e8f0;
}

.review-table-modal__tabs :deep(.el-tabs__item) {
  height: 36px;
  padding: 0 16px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  line-height: 36px;
}

.review-table-modal__tabs :deep(.el-tabs__item:hover),
.review-table-modal__tabs :deep(.el-tabs__item.is-active) {
  color: #00706b;
}

.review-table-modal__tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px 3px 0 0;
  background-color: #00706b;
}

.review-table-modal__tabs :deep(.el-tabs__item:focus-visible) {
  outline: 2px solid rgba(0, 112, 107, 0.24);
  outline-offset: -3px;
}

.review-table-modal__grid-wrap {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.review-table-modal__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 220px;
  background-color: #f5fbfb;
}

.review-table-modal__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  color: #00706b;
  border: 1px solid #b8ddd9;
  border-radius: 8px;
  background-color: #f2f9f8;
}

.review-table-modal__empty-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.review-table-modal__empty-title {
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.review-table-modal__empty-description {
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}
</style>

<style lang="less">
.smart-task-audit-review-table-modal .vxe-modal--box {
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
}

.smart-task-audit-review-table-modal .vxe-modal--header {
  min-height: 58px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #fcffff;
}

.smart-task-audit-review-table-modal .vxe-modal--body,
.smart-task-audit-review-table-modal .vxe-modal--content {
  padding: 0;
  overflow: hidden;
  background-color: #f5fbfb;
}

.smart-task-audit-review-table-modal .vxe-modal--content {
  height: 100%;
}
</style>
