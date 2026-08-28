<template>
  <vxe-modal
    v-model="visible"
    class-name="template-upload-modal"
    title="模板文件上传"
    width="88%"
    height="84%"
    position="center"
    resize
    fullscreen
    show-zoom
    @before-hide="onBeforeHide"
    @close="handleModalClose"
  >
    <div v-loading="fjLoading" class="upload-modal-body">
      <div class="upload-modal-header">
        <el-button size="mini" type="primary" plain @click="visible = false">关 闭</el-button>
      </div>
      <template v-if="fjTypeList.length > 0">
        <div class="fj-grid">
          <div v-for="fjType in fjTypeList" :key="fjType.code" class="fj-card">
            <div class="fj-card__header">
              <span class="fj-card__title">{{ fjType.name }}</span>
              <el-button
                size="mini"
                plain
                type="primary"
                :loading="loadingMap[fjType.code]"
                :disabled="loadingMap[fjType.code]"
                @click="uploadHandle(fjType)"
              >
                上传文件
              </el-button>
            </div>
            <div class="fj-card__table">
              <vxe-table
                show-overflow
                :row-config="{ height: 32, isHover: true }"
                header-align="center"
                :ref="(el: any) => setTableRef(fjType.code, el)"
                :data="fileListMap[fjType.code] || []"
                :loading="loadingMap[fjType.code]"
                height="100%"
                empty-text="暂无文件"
                border
              >
                <vxe-column type="seq" align="center" width="60" title="序号" />
                <vxe-column title="文件名">
                  <template #default="{ row }">
                    {{ getAttachmentName(row) }}
                  </template>
                </vxe-column>
                <vxe-column title="操作" width="180" align="center">
                  <template #default="{ row }">
                    <div class="file-actions">
                      <el-button type="text" :disabled="!row.uuid" @click="handleDownload(row)">下载</el-button>
                      <el-button v-if="singleSelection" type="text" :disabled="!hasAttachmentId(row)" @click="handleDelete(fjType.code, row)">
                        删除
                      </el-button>
                    </div>
                  </template>
                </vxe-column>
              </vxe-table>
            </div>
          </div>
        </div>
      </template>
      <div v-else-if="!fjLoading" class="fj-empty">暂无可配置的附件类型</div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { getPublicCodeList } from '@/api/common'
import { deleteAttach, getAttachList, uploadAttach } from '@/api/config/templateFileManager'
import { downloadAttach } from '@/api/common'
import type { AttachmentTypeOption, TemplateAttachmentRow } from '../types'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { computed, reactive, ref, watch } from 'vue'

// 允许上传的文件类型
const ALLOWED_FILE_TYPES = ['wps', 'et', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf', 'ofd']

// 验证文件类型
const validateFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1)
  return ALLOWED_FILE_TYPES.includes(fileExtension)
}

const props = defineProps<{
  modelValue: boolean
  protypeIds: string
  protypeId: string
  singleSelection: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const fjTypeList = ref<AttachmentTypeOption[]>([])
const fjLoading = ref(false)
const hasLoadedTypes = ref(false)
const tableRefs = ref<Record<string, any>>({})
const fileListMap = reactive<Record<string, TemplateAttachmentRow[]>>({})
const loadingMap = reactive<Record<string, boolean>>({})

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const hasActiveUploading = computed(() => Object.values(loadingMap).some((value) => value === true))
const canLoadPersistedAttachments = computed(() => props.singleSelection && !!props.protypeId)
const singleSelection = computed(() => props.singleSelection)

const setTableRef = (code: string, el: any) => {
  if (el) {
    tableRefs.value[code] = el
    return
  }
  delete tableRefs.value[code]
}

const ensureFileListKeys = () => {
  fjTypeList.value.forEach((item) => {
    if (!Array.isArray(fileListMap[item.code])) {
      fileListMap[item.code] = []
    }
  })
}

const normalizeAttachmentList = (data: any): TemplateAttachmentRow[] => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.records)) return data.records
  return []
}

const getAttachmentName = (row: TemplateAttachmentRow) => {
  return row.name || row.attachName || row.fileName || '-'
}

const hasAttachmentId = (row: TemplateAttachmentRow) => {
  return row.id !== undefined && row.id !== null && row.id !== ''
}

const resetFileListMap = () => {
  Object.keys(fileListMap).forEach((key) => {
    fileListMap[key] = []
  })
}

const resetModalState = () => {
  fjTypeList.value = []
  hasLoadedTypes.value = false
  tableRefs.value = {}
  Object.keys(fileListMap).forEach((key) => delete fileListMap[key])
  Object.keys(loadingMap).forEach((key) => delete loadingMap[key])
}

const loadFjTypes = async () => {
  if (hasLoadedTypes.value) return

  const res = await getPublicCodeList({ codes: ['XMLB_ATTACH_CONFIG_FJTYPE'] })
  if (!res.success) throw new Error(res.msg)
  fjTypeList.value = res.data?.['XMLB_ATTACH_CONFIG_FJTYPE'] || []
  hasLoadedTypes.value = true
  ensureFileListKeys()
}

const applyAllAttachmentRows = (rows: TemplateAttachmentRow[]) => {
  const groupedRows = fjTypeList.value.reduce<Record<string, TemplateAttachmentRow[]>>((result, item) => {
    result[item.code] = []
    return result
  }, {})

  rows.forEach((row) => {
    const code = String(row.fjId || '')
    if (!code) return
    if (!groupedRows[code]) {
      groupedRows[code] = []
    }
    groupedRows[code].push(row)
  })

  Object.keys(groupedRows).forEach((code) => {
    fileListMap[code] = groupedRows[code]
  })
  ensureFileListKeys()
}

const loadAttachmentRows = async (fjType?: string) => {
  if (!props.protypeId) return []
  const res = await getAttachList({
    protypeId: props.protypeId,
    fjType: fjType || ''
  })
  if (!res.success) throw new Error(res.msg)
  return normalizeAttachmentList(res.data)
}

const refreshAllAttachmentRows = async () => {
  if (!canLoadPersistedAttachments.value) {
    resetFileListMap()
    ensureFileListKeys()
    return
  }

  const rows = await loadAttachmentRows()
  applyAllAttachmentRows(rows)
}

const refreshAttachmentRowsByType = async (fjType: string) => {
  if (!canLoadPersistedAttachments.value) return
  const rows = await loadAttachmentRows(fjType)
  fileListMap[fjType] = rows
}

const initializeModal = async () => {
  fjLoading.value = true
  try {
    await loadFjTypes()
    await refreshAllAttachmentRows()
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    fjLoading.value = false
  }
}

const onBeforeHide = () => {
  if (hasActiveUploading.value) {
    ElMessage.warning('请等待所有文件上传完成')
    return false
  }
}

const handleModalClose = () => {
  resetModalState()
}

const uploadHandle = async (fjType: AttachmentTypeOption) => {
  if (!props.protypeIds) {
    ElMessage.warning('请先选择要上传的记录')
    return
  }

  const $table = tableRefs.value[fjType.code]
  if (!$table) return

  const { files } = await $table.readFile({ multiple: true })
  if (!files || files.length === 0) return

  loadingMap[fjType.code] = true
  try {
    const fileArr = Array.from(files) as File[]

    // 文件类型校验
    const invalidFiles = fileArr.filter((file) => !validateFileType(file))
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map((f) => f.name).join('、')
      ElMessage.error(`不支持的文件类型: ${invalidFileNames}。支持的文件类型: ${ALLOWED_FILE_TYPES.join('、')}`)
      return
    }

    const formData = new FormData()
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i]
      formData.append('files', file)
    }

    const res = await uploadAttach({
      fileNames: fileArr.map((file) => file.name),
      fjType: fjType.code,
      protypeIds: props.protypeIds,
      formData
    })

    if (!res.success) throw new Error(res.msg)

    ElMessage.success('上传成功')
    if (canLoadPersistedAttachments.value) {
      await refreshAttachmentRowsByType(fjType.code)
    }
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    loadingMap[fjType.code] = false
  }
}

const handleDownload = async (row: TemplateAttachmentRow) => {
  if (!row.uuid) {
    ElMessage.warning('附件缺少下载标识')
    return
  }

  try {
    const res = await downloadAttach(row.uuid)
    if (!res.success) throw new Error(res.msg || '附件下载失败')
    if (!res.data) throw new Error('附件下载地址为空')

    const link = document.createElement('a')
    link.href = res.data
    link.download = getAttachmentName(row)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

const handleDelete = async (fjType: string, row: TemplateAttachmentRow) => {
  if (!props.singleSelection) return
  if (!hasAttachmentId(row)) {
    ElMessage.warning('附件缺少删除标识')
    return
  }

  const type = await VXETable.modal.confirm('确认是否删除？', '温馨提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return

  loadingMap[fjType] = true
  try {
    const res = await deleteAttach({
      ids: [row.id as string]
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('删除成功')
    await refreshAttachmentRowsByType(fjType)
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    loadingMap[fjType] = false
  }
}

watch(
  () => props.modelValue,
  (visibleValue) => {
    if (visibleValue) {
      initializeModal()
    }
  }
)
</script>

<style scoped lang="less">
:deep(.template-upload-modal .vxe-modal--body) {
  padding: 0 !important;
  overflow: hidden;
}

.upload-modal-body {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  min-width: 0;
  background-color: var(--el-bg-color-page, #f5f7fa);
}

.upload-modal-header {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.fj-grid {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  grid-auto-rows: 320px;
  gap: 16px;
  overflow: auto;
  align-content: start;
  padding: 4px;
}

.fj-card {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
    flex-wrap: wrap;
  }

  &__title {
    flex: 1;
    min-width: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary, #303133);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    padding-left: 10px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 14px;
      background-color: var(--el-color-primary, #00706b);
      border-radius: 2px;
    }
  }

  &__table {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
}

.fj-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  color: var(--el-text-color-secondary, #909399);
  border: 1px dashed var(--el-border-color, #dcdfe6);
  border-radius: 6px;
}

.file-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
