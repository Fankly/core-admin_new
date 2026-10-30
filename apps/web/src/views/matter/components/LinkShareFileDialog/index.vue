<!-- 关联共享文件选择弹窗：从文件目录管理处选择附件关联到预算事项 -->
<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="link-share-file-dialog"
    title="关联共享文件"
    width="900"
    height="560"
    fullscreen
    show-zoom
    resize
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading" class="link-share-file">
      <el-row :gutter="0" class="lsf-layout">
        <!-- 左侧：文件目录树 -->
        <el-col :span="6" class="lsf-left">
          <div class="lsf-panel">
            <div class="lsf-panel-header">
              <div class="lsf-section-title">
                <i class="el-icon-folder-opened lsf-section-title__icon" aria-hidden="true"></i>
                文件目录
              </div>
              <div class="lsf-panel-header__actions">
                <i
                  class="el-icon-sort lsf-section-title__icon lsf-section-title__icon--action"
                  aria-hidden="true"
                  title="一键展开/收起"
                  @click="handleExpandAll"
                />
                <i
                  class="el-icon-refresh lsf-section-title__icon lsf-section-title__icon--action"
                  aria-hidden="true"
                  title="刷新"
                  @click="handleRefreshTree"
                />
              </div>
            </div>
            <div class="lsf-tree-list">
              <el-tree
                ref="treeRef"
                :highlight-current="true"
                :props="defaultProps"
                :expand-on-click-node="false"
                node-key="id"
                :current-node-key="chooseNode || undefined"
                lazy
                :load="loadNode"
                @node-click="handleNodeClick"
              >
                <template #default="{ node, data }">
                  <span class="lsf-tree-node">
                    <i :class="data.leaf === '1' ? 'el-icon-document' : 'el-icon-folder'" class="lsf-tree-node__icon" aria-hidden="true"></i>
                    <span class="lsf-tree-node__label" :title="node.label">{{ `${node.label}(${data.attachNum || 0})` }}</span>
                  </span>
                </template>
              </el-tree>
            </div>
          </div>
        </el-col>
        <!-- 右侧：文件列表 -->
        <el-col :span="18" class="lsf-right">
          <div class="lsf-panel lsf-detail-panel">
            <div class="lsf-detail-header">
              <div class="lsf-section-title">
                <i class="el-icon-document lsf-section-title__icon" aria-hidden="true"></i>
                文件列表
              </div>
              <el-tag v-if="chooseNodeName" size="small" class="lsf-current-node-tag" effect="plain">
                {{ chooseNodeName }}
              </el-tag>
              <span v-else class="lsf-current-node-placeholder">请选择左侧文件目录</span>
            </div>
            <div class="lsf-table-panel">
              <RangeVxeTableStyle
                class="lsf-pro-table"
                :cell-style="columnStyle"
                @cell-click="downloadReport"
                @search="handleSearch"
                @reset="handleSearch"
                :pagination="true"
                :border="true"
                :tool-button="false"
                :data-callback="callBackHandle"
                :request-api="getInusePageList"
                :request-auto="false"
                :columns="inuseColumns"
                row-click-mode="exclusive"
                ref="inuseTableRef"
                stripe
                row-key="id"
                :loading="loading"
                reserve-selection
              >
                <template #tableHeader>
                  <div style="margin-bottom: 10px">
                    <el-input clearable placeholder="输入文件名进行过滤" @clear="handleSearch" v-model.trim="attachName">
                      <template #append>
                        <i class="el-icon-search" @click="handleSearch" style="color: var(--color-primary); cursor: pointer"></i>
                      </template>
                    </el-input>
                  </div>
                </template>
                <template #operation="{ row }">
                  <el-tooltip content="预览文件" placement="top">
                    <i class="el-icon-view lsf-row-action-icon" @click="handlePreview(row)"></i>
                  </el-tooltip>
                  <el-tooltip content="下载文件" placement="top">
                    <i class="el-icon-download lsf-row-action-icon" @click="downloadFile(row)"></i>
                  </el-tooltip>
                </template>
              </RangeVxeTableStyle>
            </div>
          </div>
        </el-col>
      </el-row>
      <div class="lsf-footer">
        <el-button size="small" type="primary" :loading="saving" @click="handleSave">确 定</el-button>
        <el-button size="small" @click="handleClose">取 消</el-button>
      </div>
    </div>
  </vxe-modal>
  <!-- 内嵌预览弹窗 -->
  <vxe-modal
    ref="previewModalRef"
    class-name="link-share-file-dialog lsf-preview-modal"
    resize
    show-zoom
    v-model="previewVisible"
    destroy-on-close
    :title="previewTitle"
    width="900px"
    height="600px"
    :loading="previewLoading"
  >
    <div class="lsf-preview-body">
      <OfficePreview
        v-if="previewVisible"
        ref="previewRef"
        :src="previewSource"
        :file-name="previewAttachName"
        height="100%"
        :empty-text="previewError || '暂无可预览文件'"
        @error="handlePreviewError"
      />
    </div>
  </vxe-modal>
  <el-image-viewer v-if="isImageViewerShow && imageUrl" :url-list="[imageUrl]" hide-on-click-modal teleported @close="closeImagePreview" />
</template>

<script lang="ts">
export default {
  name: 'LinkShareFileDialog'
}
</script>

<script setup lang="ts">
import { ref, shallowRef, markRaw, nextTick } from 'vue'
import { ElMessage, ElImageViewer } from 'element-plus'
import RangeVxeTableStyle from '@/components/RangeVxeTableStyle/index.vue'
import OfficePreview from '@/components/OfficePreview/index.vue'
import type { OfficePreviewSource } from '@/components/OfficePreview'
import { getOfficeFileExtension } from '@/components/OfficePreview'
import { apiExportHandle } from '@/utils/export'
import { getChildDirectory, getAttachByDirectory, downloadAttach } from '@/api/sys/fileShare'
import { linkAttachFromDirectory } from '@/api/matter/matterBasic'

interface TreeNode {
  id: string
  name?: string
  directoryName?: string
  leaf?: string
  children?: TreeNode[]
  isLeaf?: boolean
  attachNum?: number
  [key: string]: any
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']
const isImageFile = (fileName?: string) => IMAGE_EXTS.includes(getOfficeFileExtension(fileName) || '')

const emit = defineEmits<{ (event: 'success'): void }>()

const isShowModal = ref(false)
const loading = ref(false)
const saving = ref(false)

const treeRef = ref<any>(null)
const inuseTableRef = ref<any>(null)

const chooseNode = ref<string>('')
const chooseNodeName = ref<string>('')
const attachName = ref<string>('')
const treeExpanding = ref(false)
let tableReqSeq = 0

let currentYssxIds: string[] = []

const defaultProps = markRaw({
  label: 'directoryName',
  isLeaf: (data: TreeNode) => data.leaf === '1'
})

const operationColumn = markRaw({
  field: 'operation',
  title: '操作',
  width: 100,
  fixed: 'right',
  align: 'center',
  slots: { default: 'operation' }
})

const inuseColumns = markRaw<any[]>([
  { type: 'checkbox', width: 50, fixed: 'left' },
  { type: 'seq', width: 50, title: '序号', fixed: 'left' },
  { field: 'directoryName', title: '所属目录', width: 120, fixed: 'left' },
  { field: 'attachName', title: '文件标题', minWidth: 300, headerAlign: 'center', align: 'left', fixed: 'left' },
  { field: 'majorName', title: '专业', width: 120 },
  { field: 'wjzh', title: '发文字号', width: 150 },
  { field: 'fwsj', title: '发文时间', width: 150 },
  { field: 'fwdwName', title: '文件来源', width: 150 },
  { field: 'fwbm', title: '拟稿部门', width: 150, visible: false },
  { field: 'wjsylx', title: '文件使用类型', width: 150 },
  { field: 'status', title: '状态', width: 90, align: 'center', slots: { default: 'status' } },
  { field: 'size', title: '文件大小', width: 100, visible: false },
  { field: 'uploadUser', title: '上传人', width: 100, visible: false },
  { field: 'updtime', title: '最后修改日期', width: 150, visible: false },
  { field: 'remark', title: '备注', minWidth: 300, visible: false },
  operationColumn
])

const callBackHandle = (data: any) => data

const getInusePageList = (params: any) => {
  const seq = ++tableReqSeq
  const nodeAtRequest = chooseNode.value
  loading.value = true
  return getAttachByDirectory({ ...params, id: chooseNode.value, attachName: attachName.value })
    .then((res) => {
      if (seq !== tableReqSeq || nodeAtRequest !== chooseNode.value) {
        throw new Error('STALE_TABLE_REQUEST')
      }
      loading.value = false
      return res
    })
    .catch((err) => {
      if (seq === tableReqSeq && nodeAtRequest === chooseNode.value) loading.value = false
      if ((err as Error)?.message !== 'STALE_TABLE_REQUEST' && seq === tableReqSeq) {
        ElMessage.error((err as Error)?.message || '列表加载失败，请稍后重试')
      }
      throw err
    })
}

const columnStyle = ({ column }: any) => {
  if (column.field == 'attachName') {
    return {
      color: 'var(--color-primary, #00857c)',
      cursor: 'pointer'
    }
  }
}

const reloadActiveTable = () => {
  const table = inuseTableRef.value
  table?.clearSelection()
  table?.getTableList()
}

const handleSearch = () => {
  reloadActiveTable()
}

const refreshTable = () => {
  if (!chooseNode.value) return
  inuseTableRef.value?.getTableList()
}

const downloadReport = ({ row, column }: { row: any; column: any }) => {
  if (column.field == 'attachName') {
    downloadFile(row)
  }
}

const downloadFile = (row: any) => {
  try {
    const uuid: any = row.uuid
    const fileName: any = `${row.attachName}`
    if (!uuid) return ElMessage.warning('报告未维护，请勿重复点击！')
    apiExportHandle({ uuid, fileName }, fileName, downloadAttach)
  } catch (e: any) {
    console.error(e.toString())
  }
}

// ========== 预览 ==========
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewTitle = ref('文件预览')
const previewAttachName = ref<string>('')
const previewSource = shallowRef<OfficePreviewSource>(null)
const previewError = ref('')
const previewRef = ref<InstanceType<typeof OfficePreview> | null>(null)
const isImageViewerShow = ref(false)
const imageUrl = ref<string>('')

const revokeImageUrl = () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
}

const closeImagePreview = () => {
  isImageViewerShow.value = false
  revokeImageUrl()
}

const handlePreviewError = (error: Error) => {
  previewError.value = error.message || '文件预览失败'
}

const handlePreview = async (row: any) => {
  if (!row.uuid) return ElMessage.warning('报告未维护，无法预览！')
  previewError.value = ''
  previewAttachName.value = row.attachName || ''
  previewTitle.value = `文件预览 - ${row.attachName || ''}`
  const isImage = isImageFile(row.attachName)
  previewSource.value = null
  revokeImageUrl()
  isImageViewerShow.value = false
  previewVisible.value = !isImage
  previewLoading.value = true
  try {
    const blob: any = await downloadAttach({ uuid: row.uuid, fileName: row.attachName || '' })
    if (!blob || !(blob instanceof Blob)) {
      throw new Error('文件下载失败，未获取到有效内容')
    }
    if (isImage) {
      imageUrl.value = URL.createObjectURL(blob)
      isImageViewerShow.value = true
    } else {
      previewSource.value = blob
    }
  } catch (e) {
    const msg = (e as Error)?.message || '文件预览失败，请稍后重试'
    previewError.value = msg
    ElMessage.error(msg)
    previewVisible.value = false
    isImageViewerShow.value = false
    revokeImageUrl()
  } finally {
    previewLoading.value = false
  }
}

// ========== 目录树 ==========
const loadNode = async (node: any, resolve: (data: TreeNode[]) => void) => {
  const parentId = node.level === 0 ? '0' : node.data?.id
  try {
    const res = await getChildDirectory(parentId, '')
    if (!res.success) {
      ElMessage.error(res.msg || '文件目录加载失败')
      resolve([])
      return
    }
    const list: TreeNode[] = Array.isArray(res.data) ? res.data : []
    resolve(list)
  } catch (e) {
    ElMessage.error((e as Error)?.message || '文件目录加载失败，请稍后重试')
    resolve([])
  }
}

const reloadTree = () => {
  const tree = treeRef.value
  if (!tree) return
  tree.store.root.loaded = false
  tree.store.root.expand()
}

const expandNodeRecursive = async (node: any) => {
  if (!node) return
  if (node.isLeaf) return
  if (!node.loaded) {
    await new Promise<void>((resolve) => {
      node.loadData(() => resolve())
    })
  }
  if (!node.expanded) node.expand()
  const children = node.childNodes || []
  for (const child of children) {
    await expandNodeRecursive(child)
  }
}

const collapseNodeRecursive = (node: any) => {
  if (!node) return
  if (node.expanded) node.collapse()
  const children = node.childNodes || []
  for (const child of children) {
    collapseNodeRecursive(child)
  }
}

const isAllExpanded = (node: any): boolean => {
  if (!node || node.isLeaf) return true
  if (!node.loaded || !node.expanded) return false
  const children = node.childNodes || []
  return children.every((child: any) => isAllExpanded(child))
}

const handleExpandAll = async () => {
  const tree = treeRef.value
  if (!tree || treeExpanding.value) return
  treeExpanding.value = true
  try {
    const root = tree.store.root
    if (isAllExpanded(root)) {
      collapseNodeRecursive(root)
    } else {
      await expandNodeRecursive(root)
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '操作失败，请稍后重试')
  } finally {
    treeExpanding.value = false
  }
}

const handleRefreshTree = async () => {
  if (treeExpanding.value) return
  reloadTree()
  await nextTick()
  await handleExpandAll()
}

const handleNodeClick = (data: TreeNode) => {
  if (chooseNode.value === data.id) return
  chooseNode.value = data.id
  chooseNodeName.value = data.directoryName || data.name || ''
  refreshTable()
}

// ========== 打开 / 保存 ==========
const acceptParams = (params: { yssxIds: string[] }) => {
  currentYssxIds = (params.yssxIds || []).map(String)
  chooseNode.value = ''
  chooseNodeName.value = ''
  attachName.value = ''
  isShowModal.value = true
  // 等树挂载后默认展开
  nextTick(() => {
    handleExpandAll()
  })
}

const handleSave = async () => {
  const rows = inuseTableRef.value?.getCheckboxRecords?.() || []
  if (rows.length === 0) {
    ElMessage.warning('请至少选择一个文件')
    return
  }
  if (currentYssxIds.length === 0) {
    ElMessage.warning('未获取到预算事项，无法关联')
    return
  }
  const attachIds = rows
    .map((r: any) => r.id)
    .filter(Boolean)
    .map(String)
  if (attachIds.length === 0) {
    ElMessage.warning('未获取到文件id，无法关联')
    return
  }
  saving.value = true
  try {
    const res = await linkAttachFromDirectory({ yssxIds: currentYssxIds, attachIds })
    if (res.success) {
      ElMessage.success('关联成功')
      emit('success')
      handleClose()
    } else {
      ElMessage.error(res.msg || '关联失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '关联失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  isShowModal.value = false
  chooseNode.value = ''
  chooseNodeName.value = ''
  attachName.value = ''
  inuseTableRef.value?.clearSelection?.()
}

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
:global(.link-share-file-dialog) {
  --vxe-modal-body-background-color: #f5fbfb;
  --vxe-modal-header-background-color: #fcffff;
}

:global(.link-share-file-dialog .vxe-modal--box) {
  overflow: hidden;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
  background: #f5fbfb !important;
  box-shadow: 0 8px 28px rgba(0, 112, 107, 0.12) !important;
}

:global(.link-share-file-dialog .vxe-modal--header) {
  min-height: 48px !important;
  padding: 10px 16px !important;
  color: #1e293b !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  background: #fcffff !important;
  border-bottom: 1px solid #eef2f6 !important;
}

:global(.link-share-file-dialog .vxe-modal--header-title) {
  color: #1e293b !important;
  font-weight: 700 !important;
}

:global(.link-share-file-dialog .vxe-modal--close-btn) {
  color: #64748b !important;

  &:hover {
    color: #00706b !important;
  }
}

:global(.link-share-file-dialog .vxe-modal--body),
:global(.link-share-file-dialog .vxe-modal--content) {
  overflow: hidden;
  background: #f5fbfb !important;
}

:global(.link-share-file-dialog .vxe-modal--content) {
  padding: 10px !important;
}

.link-share-file {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
}

.lsf-layout {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
}

.lsf-left,
.lsf-right {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.lsf-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.lsf-detail-panel {
  margin-left: 10px;
}

.lsf-panel-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f6;
  background: #fcffff;
}

.lsf-section-title {
  display: inline-flex;
  align-items: center;
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;

  &__icon {
    margin-right: 6px;
    color: #00706b;
    font-size: 16px;

    &--action {
      margin-right: 0;
      margin-left: 12px;
      cursor: pointer;
      color: #64748b;

      &:hover {
        color: #00706b;
      }
    }
  }
}

.lsf-panel-header__actions {
  display: inline-flex;
  align-items: center;
}

.lsf-tree-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 4px;

  :deep(.el-tree) {
    background: transparent;

    .el-tree-node__content {
      height: 30px;
    }

    .el-tree-node.is-current > .el-tree-node__content {
      background-color: #e6f4f3;
    }
  }
}

.lsf-tree-node {
  display: inline-flex;
  align-items: center;
  flex: 1;
  min-width: 0;

  &__icon {
    margin-right: 6px;
    color: #00706b;
    font-size: 14px;
  }

  &__label {
    overflow: hidden;
    color: #475569;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.lsf-detail-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f6;
  background: #fcffff;
}

.lsf-current-node-tag {
  :deep(.el-tag) {
    color: #00706b;
    border-color: #b8ddd9;
    background: #f2f9f8;
  }
}

:deep(.lsf-current-node-tag) {
  color: #00706b;
  border-color: #b8ddd9;
  background: #f2f9f8;
}

.lsf-current-node-placeholder {
  color: #94a3b8;
  font-size: 12px;
}

.lsf-table-panel {
  flex: 1;
  min-height: 0;
  padding-left: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :deep(.range-vxe-table) {
    flex: 1;
    min-height: 0;
  }

  :deep(.vxe-table) {
    --vxe-font-color: #475569;
    --vxe-table-header-font-color: #00706b;
    --vxe-table-header-background-color: #dff3f0;
    --vxe-table-border-color: #e2e8f0;
    --vxe-table-row-hover-background-color: #e6f4f3;
    --vxe-table-row-striped-background-color: #f7fcfb;
    --vxe-table-row-current-background-color: #d8efec;
    color: #475569;
    font-size: 13px;
    background-color: #ffffff;
  }

  :deep(.vxe-header--column) {
    height: 40px;
    color: #00706b;
    font-size: 13px;
    font-weight: 600;
    background-color: #dff3f0 !important;
  }

  :deep(.vxe-body--column) {
    height: 32px;
    color: #475569;
    font-size: 13px;
  }

  :deep(.vxe-body--row.row--stripe) {
    background-color: #f7fcfb !important;
  }

  :deep(.vxe-body--row.row--checked),
  :deep(.vxe-body--row.row--current) {
    background-color: #d8efec !important;
  }

  :deep(.vxe-body--row.row--hover) {
    background-color: #e6f4f3 !important;
  }

  :deep(.vxe-cell--checkbox .vxe-checkbox--checked-icon),
  :deep(.vxe-cell--checkbox .vxe-checkbox--indeterminate-icon) {
    color: #00706b;
  }
}

.lsf-row-action-icon {
  margin: 0 6px;
  color: #00706b;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    color: #005a56;
  }
}

.lsf-footer {
  display: flex;
  gap: 8px;
  padding: 10px 0 0;
  margin: 0 auto;

  :deep(.el-button) {
    height: 30px;
    min-height: 30px;
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
  }

  :deep(.el-button--primary) {
    color: #ffffff;
    background: #00706b;
    border-color: #00706b;
  }

  :deep(.el-button--primary:hover),
  :deep(.el-button--primary:focus) {
    color: #ffffff;
    background: #005a56;
    border-color: #005a56;
  }

  :deep(.el-button:not(.el-button--primary)) {
    color: #475569;
    background: #ffffff;
    border-color: #cbd5e1;
  }

  :deep(.el-button:not(.el-button--primary):hover) {
    color: #00706b;
    border-color: #00706b;
  }
}

.lsf-preview-modal {
  .vxe-modal--body {
    padding: 0;
  }
}

.lsf-preview-body {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 12px;
  box-sizing: border-box;

  .office-preview {
    width: 100%;
    height: 100%;
  }
}
</style>
