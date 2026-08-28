<template>
  <div v-if="isShowPage" class="page-container">
    <div class="workspace">
      <aside class="menu-panel sgcc-card">
        <div class="panel-header">
          <div class="panel-title">
            <LayoutList class="panel-title__icon" />
            <span>业务类型选择</span>
          </div>
        </div>

        <nav class="menu-list custom-scrollbar">
          <button
            v-for="type in batchTypes"
            :key="type.code"
            type="button"
            class="menu-item"
            :class="{ 'is-active': batchType === type.code }"
            @click="batchType = type.code"
          >
            <div class="menu-item__main">
              <span class="menu-item__label">{{ type.name }}</span>
            </div>

            <div class="menu-item__meta">
              <span class="menu-item__count">{{ getBatchFileCount(type.code) }}</span>
              <span v-if="batchType === type.code" class="menu-item__dot"></span>
            </div>
          </button>

          <div v-if="batchTypes.length === 0" class="menu-empty">暂无可用批次类型</div>
        </nav>
      </aside>

      <main class="content-panel sgcc-card">
        <div class="content-header">
          <div class="content-header__title">
            <div class="content-header__bar"></div>
            <h2>{{ activeTypeLabel }}</h2>
          </div>

          <div class="content-header__actions">
            <input ref="fileInputRef" type="file" multiple class="file-input" @change="handleFileUpload" />

            <button v-if="hasButtonPermission(['UPLOAD', 'ADD'])" type="button" class="upload-button" @click="openFileDialog">
              <Plus class="upload-button__icon" />
              <span>挂接模板</span>
            </button>
          </div>
        </div>

        <div class="content-body">
          <div v-if="uploadingFiles.length > 0" class="upload-list">
            <div v-for="file in uploadingFiles" :key="file.id" class="upload-item">
              <div class="upload-item__info">
                <Loader2 class="upload-item__icon" />
                <div class="upload-item__text">正在同步并校验文件：{{ file.name }}</div>
              </div>
              <div class="upload-item__status">WAITING</div>
            </div>
          </div>

          <div class="table-wrapper">
            <vxe-table
              border
              show-overflow
              auto-resize
              sync-resize
              height="100%"
              :loading="loading"
              :data="currentFiles"
              :column-config="{ resizable: true }"
              :row-config="{ isHover: true }"
              class="file-table"
            >
              <vxe-column field="attachName" title="模板名称" min-width="360">
                <template #default="{ row }">
                  <div class="file-name-cell">
                    <div class="file-name-cell__icon" :class="{ 'is-sheet': isSheetFileType(row.attachName) }">
                      <FileSpreadsheet v-if="isSheetFileType(row.attachName)" class="file-icon" />
                      <FileText v-else class="file-icon" />
                    </div>

                    <div class="file-name-cell__content">
                      <div class="file-name-cell__name">{{ row.attachName }}</div>
                      <div class="file-name-cell__meta">UUID: {{ row.uuid }}</div>
                    </div>
                  </div>
                </template>
              </vxe-column>

              <vxe-column title="格式" width="110" align="center">
                <template #default="{ row }">
                  <span class="type-tag">{{ getFileTypeLabel(row.attachName) }}</span>
                </template>
              </vxe-column>

              <vxe-column field="createTime" title="创建时间" width="180" align="center">
                <template #default="{ row }">
                  <span class="time-text">{{ formatCreateTime(row.createTime) }}</span>
                </template>
              </vxe-column>

              <vxe-column title="管理操作" width="180" align="center" fixed="right">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <button v-if="hasButtonPermission(['DOWNLOAD', 'EXPORT'])" type="button" class="action-button" @click="handleDownload(row)">
                      <Download class="action-button__icon" />
                      <span>下载</span>
                    </button>
                    <button v-if="hasButtonPermission(['DELETE'])" type="button" class="action-button action-button--danger" @click="removeFile(row)">
                      <Trash2 class="action-button__icon" />
                      <span>删除</span>
                    </button>
                  </div>
                </template>
              </vxe-column>

              <template #empty>
                <div class="empty-state">
                  <Inbox class="empty-state__icon" />
                  <p class="empty-state__title">暂无已挂接的业务模板</p>
                  <p class="empty-state__desc">请点击右上角按钮，从本地选择文件后完成挂接。</p>
                </div>
              </template>
            </vxe-table>
          </div>
        </div>
      </main>
    </div>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/service/approval/config/templateManager/index">
import { computed, onMounted, provide, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, FileSpreadsheet, FileText, Inbox, LayoutList, Loader2, Plus, Trash2 } from 'lucide-vue-next'
import { getPublicCodeList } from '@/api/common'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import {
  deleteTemplateManagerFiles,
  downloadAttach,
  getTemplateManagerFileList,
  uploadTemplateManagerFiles
} from '@/api/service/approval/config/templateManager'
import type { TemplateManagerFile, TemplatePspcType } from '@/api/service/approval/config/templateManager'
import { VXETable } from 'vxe-table'

interface BatchType {
  code: TemplatePspcType
  name: string
}

interface UploadingFile {
  id: string
  name: string
}

const BATCH_TYPE_CODE = 'LHHS_PSPC_TYPE'
const sheetFileTypes = ['XLS', 'XLSX', 'CSV']

const batchTypes = ref<BatchType[]>([])
const batchType = ref<TemplatePspcType>('1')
const isShowPage = ref(false)
const loading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const buttonPermissions = ref<string[]>([])
const uploadingFiles = ref<UploadingFile[]>([])
const currentUserRole = ref<UserRole>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

const fileData = reactive<Record<string, TemplateManagerFile[]>>({})

let nextUploadingId = 1

const activeTypeLabel = computed(() => {
  return batchTypes.value.find((item) => item.code === batchType.value)?.name || '模板管理'
})

const currentFiles = computed(() => {
  return fileData[batchType.value] || []
})

const syncFileDataKeys = () => {
  const validKeys = new Set(batchTypes.value.map((item) => item.code))

  Object.keys(fileData).forEach((key) => {
    if (!validKeys.has(key as TemplatePspcType)) {
      delete fileData[key]
    }
  })

  batchTypes.value.forEach((item) => {
    if (!Array.isArray(fileData[item.code])) {
      fileData[item.code] = []
    }
  })
}

const initBatchTypes = async () => {
  const res = await getPublicCodeList({
    codes: [BATCH_TYPE_CODE]
  })
  if (!res.success) throw new Error(res.msg)

  batchTypes.value = (Array.isArray(res.data?.[BATCH_TYPE_CODE]) ? res.data[BATCH_TYPE_CODE] : []).map((item: { code: string; name: string }) => {
    return {
      code: item.code as TemplatePspcType,
      name: item.name
    }
  })

  syncFileDataKeys()

  if (batchTypes.value.length > 0 && !batchTypes.value.some((item) => item.code === batchType.value)) {
    batchType.value = batchTypes.value[0].code
  }
}

const loadFileList = async (typeCode: TemplatePspcType) => {
  const res = await getTemplateManagerFileList({
    pspcType: typeCode
  })
  if (!res.success) throw new Error(res.msg)
  fileData[typeCode] = Array.isArray(res.data) ? res.data : []
}

const loadAllFileList = async () => {
  if (batchTypes.value.length === 0) {
    return
  }

  loading.value = true
  try {
    await Promise.all(batchTypes.value.map((item) => loadFileList(item.code)))
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const getRoleHandle = async () => {
  if (userRoleSelectorRef.value) {
    isShowPage.value = userRoleSelectorRef.value.canRender
    buttonPermissions.value = (await userRoleSelectorRef.value.getButtonPermissions()) || []

    try {
      await initBatchTypes()
      await loadAllFileList()
    } catch (error) {
      batchTypes.value = []
      syncFileDataKeys()
      ElMessage.error((error as Error).message)
    }
  }
}

const hasButtonPermission = (codes: string[]) => {
  return codes.some((code) => buttonPermissions.value.includes(code))
}

const openFileDialog = () => {
  if (!batchType.value) {
    ElMessage.warning('请选择批次类型')
    return
  }

  fileInputRef.value?.click()
}

const getBatchFileCount = (typeCode: TemplatePspcType) => {
  return fileData[typeCode]?.length || 0
}

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return ''
  }

  return fileName.slice(dotIndex + 1).toUpperCase()
}

const getFileTypeLabel = (fileName: string) => {
  return getFileExtension(fileName) || '未知'
}

const isSheetFileType = (fileName: string) => {
  return sheetFileTypes.includes(getFileExtension(fileName))
}

const formatCreateTime = (value?: string | number) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const rawValue = String(value).trim()
  let date: Date
  if (/^\d+$/.test(rawValue)) {
    const timestamp = Number(rawValue)
    const normalizedTimestamp = rawValue.length === 10 ? timestamp * 1000 : timestamp
    date = new Date(normalizedTimestamp)
  } else {
    date = new Date(rawValue)
  }

  if (Number.isNaN(date.getTime())) {
    return rawValue
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const buildUploadPayload = (files: File[]) => {
  const formData = new FormData()
  const fileNames: string[] = []

  files.forEach((file) => {
    fileNames.push(file.name)
    formData.append('files', file)
  })

  return {
    formData,
    fileNames
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files ? Array.from(target.files) : []

  if (files.length === 0) {
    return
  }

  const currentBatchType = batchType.value
  const uploadingItems = files.map((file) => {
    return {
      id: `upload-${nextUploadingId++}`,
      name: file.name
    }
  })

  uploadingFiles.value = [...uploadingFiles.value, ...uploadingItems]

  try {
    const { formData, fileNames } = buildUploadPayload(files)
    const res = await uploadTemplateManagerFiles({
      pspcType: currentBatchType,
      formData,
      fileNames
    })
    if (!res.success) throw new Error(res.msg)
    await loadFileList(currentBatchType)
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    const uploadingIdSet = new Set(uploadingItems.map((item) => item.id))
    uploadingFiles.value = uploadingFiles.value.filter((item) => !uploadingIdSet.has(item.id))
    target.value = ''
  }
}

const handleDownload = async (row: TemplateManagerFile) => {
  loading.value = true
  try {
    const res = await downloadAttach({
      uuid: row.uuid
    })
    if (!res.success) throw new Error(res.msg || '附件下载失败')
    if (!res.data) throw new Error('附件下载地址为空')

    const link = document.createElement('a')
    link.href = res.data
    link.download = row.attachName
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const removeFile = async (row: TemplateManagerFile) => {
  // 确认是否删除
  const type = await VXETable.modal.confirm('确认是否删除？', '温馨提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return
  const currentPspcType = row.pspcType || batchType.value

  try {
    loading.value = true
    const res = await deleteTemplateManagerFiles({
      pspcType: currentPspcType,
      ids: row.id ? [row.id] : undefined,
      uuids: [row.uuid]
    })
    if (!res.success) throw new Error(res.msg)
    await loadFileList(currentPspcType)
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

provide('currentUserRole', currentUserRole)

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped>
.page-container {
  height: 100%;
  overflow: hidden;
  color: #1e293b;
  background: #f1f5f9;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
}

.workspace {
  display: flex;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.sgcc-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.menu-panel {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
}

.panel-title__icon {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.menu-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
}

.menu-item:hover {
  background: #f8fafc;
  color: #334155;
}

.menu-item.is-active {
  color: #007b5e;
  font-weight: 600;
  background: #effdf5;
  border-color: #d1fae5;
}

.menu-item__main {
  display: flex;
  align-items: center;
  min-width: 0;
}

.menu-item__label {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;
}

.menu-item__count {
  min-width: 20px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
}

.menu-item.is-active .menu-item__count {
  background: #ffffff;
  color: #007b5e;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.menu-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px #d1fae5;
}

.menu-empty {
  padding: 16px 12px;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}

.content-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  background: #ffffff;
}

.content-header__title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.content-header__title h2 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.content-header__bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: #007b5e;
}

.content-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-input {
  display: none;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #007b5e;
  border-radius: 6px;
  background: #007b5e;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 123, 94, 0.1);
}

.upload-button:hover {
  background: #006950;
  border-color: #006950;
  box-shadow: 0 2px 4px rgba(0, 123, 94, 0.2);
}

.upload-button__icon {
  width: 16px;
  height: 16px;
}

.content-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px;
  overflow: hidden;
  background: #fcfcfc;
}

.upload-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.upload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
}

.upload-item__info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.upload-item__icon {
  width: 16px;
  height: 16px;
  color: #2563eb;
  flex-shrink: 0;
  animation: spin 1s linear infinite;
}

.upload-item__text {
  min-width: 0;
  color: #1e40af;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-item__status {
  padding: 2px 10px;
  border-radius: 999px;
  background: #ffffff;
  color: #3b82f6;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #dbeafe;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.file-table {
  height: 100%;
}

.file-name-cell {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}

.file-name-cell__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  flex-shrink: 0;
  margin-top: 2px;
}

.file-name-cell__icon.is-sheet {
  background: #ecfdf5;
  color: #059669;
}

.file-icon {
  width: 16px;
  height: 16px;
}

.file-name-cell__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name-cell__name {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-name-cell__meta {
  color: #94a3b8;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
}

.time-text {
  color: #64748b;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #dbeafe;
  border-radius: 4px;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.action-button:hover {
  background: #dbeafe;
}

.action-button--danger {
  border-color: #fecdd3;
  background: #fff1f2;
  color: #e11d48;
}

.action-button--danger:hover {
  background: #ffe4e6;
}

.action-button__icon {
  width: 14px;
  height: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: #94a3b8;
}

.empty-state__icon {
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  color: #e2e8f0;
}

.empty-state__title {
  margin: 0;
  color: #475569;
  font-size: 15px;
  font-weight: 500;
}

.empty-state__desc {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13px;
}

:deep(.vxe-table--render-default .vxe-table--border-line) {
  border-color: #e2e8f0;
}

:deep(.vxe-table--header-wrapper) {
  background-color: #f8fafc;
}

:deep(.vxe-table .vxe-header--column) {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  padding: 10px 0;
}

:deep(.vxe-table .vxe-body--column) {
  padding: 8px 0;
}

:deep(.vxe-table--render-default .vxe-body--row.row--hover),
:deep(.vxe-table--render-default .vxe-body--row.row--hover.row--stripe) {
  background: #f8fafc;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .workspace {
    flex-direction: column;
  }

  .menu-panel {
    width: 100%;
    min-width: 0;
    max-height: 240px;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-header__actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 10px;
  }

  .content-body,
  .content-header {
    padding-left: 10px;
    padding-right: 10px;
  }

  .menu-item,
  .panel-header {
    padding-left: 10px;
    padding-right: 10px;
  }

  .upload-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .upload-item__status {
    align-self: flex-end;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
