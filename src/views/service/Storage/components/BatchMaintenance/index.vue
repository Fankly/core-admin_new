<template>
  <vxe-modal
    position="center"
    class-name="modal-main"
    v-model="modalVisible"
    width="900"
    height="720"
    :title="modalTitle"
    resize
    destroy-on-close
    :mask-closable="false"
    :loading="loading"
    transfer
  >
    <div class="modal-content">
      <div class="form-card">
        <div class="form-body">
          <div class="form-row">
            <div class="form-group">
              <div class="form-item">
                <i class="el-icon-tickets form-icon"></i>
                <span class="label">{{ inputText }}：</span>
                <vxe-input maxlength="127" v-model="approvalNumber" :placeholder="'请输入' + inputText" class="approval-input"></vxe-input>
              </div>
            </div>
            <div class="upload-main">
              <vxe-button
                status="primary"
                icon="el-icon-upload"
                :disabled="loading || tableLoading || submitLoading"
                @click="handleUploadClick"
                class="upload-btn pulse"
              >
                批量文件上传
              </vxe-button>
              <input type="file" ref="fileInput" multiple style="display: none" :accept="acceptedFileTypes" @change="handleFileChange" />
            </div>
          </div>
          <div class="form-row" v-if="hasFileRestrictions">
            <div class="upload-info">
              <div class="info-header">
                <i class="el-icon-info"></i>
                <span>上传要求</span>
              </div>
              <div class="info-content">
                <div v-if="allowedFileTypesDisplay" class="restriction-item">
                  <i class="el-icon-document restriction-icon"></i>
                  <span
                    >支持的文件类型:
                    <span class="highlight">{{ allowedFileTypesDisplay }} </span>
                  </span>
                </div>
                <div v-if="maxFileSizeDisplay" class="restriction-item">
                  <i class="el-icon-warning-outline restriction-icon"></i>
                  <span
                    >单个文件大小限制:
                    <span class="highlight">{{ maxFileSizeDisplay }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="table-container">
        <div class="table-header">
          <div class="header-left">
            <i class="el-icon-document-copy"></i>
            <span>已上传文件列表</span>
          </div>
          <div class="header-right">
            <span v-if="fileList.length > 0" class="file-count">共 {{ fileList.length }} 个文件</span>
          </div>
        </div>
        <div class="content-wrapper">
          <transition-group name="content-switch" mode="out-in">
            <div v-if="fileList.length === 0" key="empty" class="empty-container">
              <div class="empty-placeholder">
                <i class="el-icon-upload empty-icon"></i>
                <p>暂无文件,请点击上传按钮添加文件</p>
              </div>
            </div>

            <div v-else key="table" class="table-body-container">
              <vxe-table
                show-overflow
                header-align="center"
                border
                stripe
                :data="fileList"
                height="auto"
                max-height="100%"
                :loading="tableLoading"
                class="file-table"
                :row-class-name="rowClassName"
                :loading-config="{ icon: 'el-icon-loading', text: '正在加载文件...' }"
              >
                <vxe-column align="center" type="seq" width="60" title="序号"></vxe-column>
                <vxe-column field="name" title="文件名称" min-width="240">
                  <template #default="{ row }">
                    <div class="file-name">
                      <i class="file-icon" :class="getFileIcon(row['name'])"></i>
                      <span class="file-text" :title="row['name']">{{ row['name'] }}</span>
                    </div>
                  </template>
                </vxe-column>
                <vxe-column align="center" title="操作" width="120">
                  <template #default="{ row }">
                    <vxe-button status="danger" size="mini" icon="el-icon-delete" @click="handleDelete(row)" class="delete-btn">删除</vxe-button>
                  </template>
                </vxe-column>
              </vxe-table>
            </div>
          </transition-group>
        </div>
      </div>
      <transition name="slide-up">
        <div class="button-row">
          <vxe-button
            type="button"
            status="primary"
            icon="el-icon-check"
            @click="handleSubmit"
            :disabled="loading || tableLoading"
            :loading="submitLoading"
            class="submit-btn"
          >
            保存
          </vxe-button>
          <vxe-button type="button" icon="el-icon-close" @click="modalVisible = false" class="close-btn">关闭</vxe-button>
        </div>
      </transition>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { VXETable } from 'vxe-table'
import baseService from '@/service/baseService'
import { ElMessage } from 'element-plus'
import { Result, RowVo } from '@/views/service/Storage/interface'

const FILE_UPLOAD_API = '/xmAttributeConfig/uploadAttach'
const NEW_FILE_HIGHLIGHT_DURATION = 2000

interface SearchAttachItem {
  name?: string
  size?: number
  uuid?: string
}

interface SearchResponseData {
  pfwh?: string
  attachLists?: SearchAttachItem[]
}

interface FileRecord {
  name: string
  size: number
  uuid: string
  file?: File
  isNew: boolean
}

interface RejectedFiles {
  type: string[]
  size: string[]
}

const normalizeFileType = (fileType: string) => {
  const normalizedType = fileType.trim().toLowerCase()
  if (!normalizedType) return ''
  return normalizedType.startsWith('.') ? normalizedType : `.${normalizedType}`
}

const formatErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export default defineComponent({
  name: 'BatchMaintenance',
  props: {
    selectData: {
      type: Array as PropType<RowVo[]>,
      default: () => [],
      required: true
    },
    inputText: {
      type: String,
      default: '批复文号'
    },
    inputKey: {
      type: String,
      default: 'wh'
    },
    modalTitle: {
      type: String,
      default: '批复文号维护'
    },
    allowedFileTypes: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    maxFileSize: {
      type: Number,
      default: 200 * 1024 * 1024
    },
    submitApi: {
      type: Function as PropType<(params: any) => Promise<Result>>,
      required: true
    },
    searchApi: {
      type: Function as PropType<(params: string) => Promise<Result>>
    }
  },
  emits: ['file-type-error', 'file-size-error', 'submitAfter'],
  setup(props, { expose, emit }) {
    const modalVisible = ref(false)
    const approvalNumber = ref('')
    const fileInput = ref<HTMLInputElement | null>(null)
    const loading = ref(false)
    const tableLoading = ref(false)
    const submitLoading = ref(false)
    const fileList = ref<FileRecord[]>([])
    const normalizedAllowedFileTypes = computed(() => {
      return props.allowedFileTypes.map((item) => normalizeFileType(String(item))).filter(Boolean)
    })

    let modalSession = 0
    let highlightTimer: ReturnType<typeof setTimeout> | null = null

    const clearHighlightTimer = () => {
      if (highlightTimer) {
        clearTimeout(highlightTimer)
        highlightTimer = null
      }
    }

    const clearFileInput = () => {
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const resetModalState = () => {
      clearHighlightTimer()
      approvalNumber.value = ''
      fileList.value = []
      loading.value = false
      tableLoading.value = false
      submitLoading.value = false
      clearFileInput()
    }

    const buildSelectedIds = () => {
      return props.selectData
        .map((item) => item.id)
        .filter(Boolean)
        .join(',')
    }

    const acceptedFileTypes = computed(() => {
      return normalizedAllowedFileTypes.value.length > 0 ? normalizedAllowedFileTypes.value.join(',') : undefined
    })

    const hasFileRestrictions = computed(() => {
      return normalizedAllowedFileTypes.value.length > 0 || props.maxFileSize > 0
    })

    const allowedFileTypesDisplay = computed(() => {
      return normalizedAllowedFileTypes.value.join(', ')
    })

    const formatFileSize = (size: number) => {
      if (size < 1024) {
        return `${size} B`
      }
      if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)} KB`
      }
      if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(2)} MB`
      }
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }

    const maxFileSizeDisplay = computed(() => {
      return props.maxFileSize > 0 ? formatFileSize(props.maxFileSize) : ''
    })

    const mapAttachItem = (attachItem: SearchAttachItem): FileRecord => {
      return {
        name: attachItem.name || '',
        size: Number(attachItem.size) || 0,
        uuid: attachItem.uuid || '',
        isNew: false
      }
    }

    const initializeModal = async (sessionId: number) => {
      const search = props.searchApi
      const ids = buildSelectedIds()
      if (!search || !ids) return

      loading.value = true
      try {
        const searchDataRes = await search(ids)
        if (sessionId !== modalSession || !modalVisible.value) return
        if (!searchDataRes.success) {
          throw new Error(searchDataRes.msg)
        }
        const searchData = (searchDataRes.data || {}) as SearchResponseData
        approvalNumber.value = searchData.pfwh || ''
        fileList.value = Array.isArray(searchData.attachLists) ? searchData.attachLists.map(mapAttachItem) : []
      } catch (error) {
        if (sessionId === modalSession && modalVisible.value) {
          ElMessage.error(formatErrorMessage(error, '数据加载失败'))
        }
      } finally {
        if (sessionId === modalSession && modalVisible.value) {
          loading.value = false
        }
      }
    }

    const openModal = () => {
      modalVisible.value = true
    }

    const handleUploadClick = () => {
      if (loading.value || tableLoading.value || submitLoading.value) return
      if (fileInput.value) fileInput.value.click()
    }

    const getFileExtension = (fileName: string) => {
      const lastDotIndex = fileName.lastIndexOf('.')
      return lastDotIndex === -1 ? '' : fileName.slice(lastDotIndex).toLowerCase()
    }

    const validateFiles = (files: File[]) => {
      const rejectedFiles: RejectedFiles = {
        type: [],
        size: []
      }

      const newFiles: FileRecord[] = []
      files.forEach((file) => {
        const fileExtension = getFileExtension(file.name)
        const isValidType = normalizedAllowedFileTypes.value.length === 0 || normalizedAllowedFileTypes.value.includes(fileExtension)
        const isValidSize = props.maxFileSize <= 0 || file.size <= props.maxFileSize

        if (!isValidType) {
          rejectedFiles.type.push(file.name)
          return
        }

        if (!isValidSize) {
          rejectedFiles.size.push(file.name)
          return
        }

        newFiles.push({
          name: file.name,
          size: file.size,
          file,
          uuid: '',
          isNew: true
        })
      })

      return {
        newFiles,
        rejectedFiles
      }
    }

    const showRejectedFileMessage = (rejectedFiles: RejectedFiles) => {
      if (rejectedFiles.type.length > 0) {
        emit('file-type-error', rejectedFiles.type)
        VXETable.modal.message({
          content: `文件类型不符合要求: ${rejectedFiles.type.join(', ')}`,
          status: 'warning'
        })
      }

      if (rejectedFiles.size.length > 0) {
        emit('file-size-error', rejectedFiles.size)
        VXETable.modal.message({
          content: `文件大小超出限制: ${rejectedFiles.size.join(', ')}`,
          status: 'warning'
        })
      }
    }

    const markUploadedFiles = (uuids: string[]) => {
      clearHighlightTimer()
      if (uuids.length === 0) return

      const highlightUuidSet = new Set(uuids)
      fileList.value = fileList.value.map((item) => {
        return highlightUuidSet.has(item.uuid) ? item : { ...item, isNew: false }
      })
      highlightTimer = setTimeout(() => {
        if (!modalVisible.value) {
          highlightTimer = null
          return
        }
        fileList.value = fileList.value.map((item) => {
          return highlightUuidSet.has(item.uuid) ? { ...item, isNew: false } : item
        })
        highlightTimer = null
      }, NEW_FILE_HIGHLIGHT_DURATION)
    }

    const handleFileChange = async (event: Event) => {
      const input = event.target as HTMLInputElement | null
      const files = Array.from(input?.files || [])
      if (files.length === 0) return

      const sessionId = modalSession
      tableLoading.value = true
      try {
        const { newFiles, rejectedFiles } = validateFiles(files)
        showRejectedFileMessage(rejectedFiles)
        if (newFiles.length === 0) return

        const data = new FormData()
        for (const newFile of newFiles) {
          if (!newFile.file) continue
          data.append('files', newFile.file)
          data.append('fileNames', newFile.name)
        }

        const res = await baseService.post(FILE_UPLOAD_API, data)
        if (sessionId !== modalSession || !modalVisible.value) return
        if (!res.success) {
          throw new Error(res.msg)
        }
        if (!Array.isArray(res.data) || res.data.length < newFiles.length) {
          throw new Error('上传返回数据异常，请稍后重试')
        }

        const uploadedFiles = newFiles.map((newFile, index) => {
          return {
            ...newFile,
            uuid: String(res.data[index] || ''),
            isNew: true
          }
        })

        if (uploadedFiles.some((item) => !item.uuid)) {
          throw new Error('部分文件上传失败，请重新上传')
        }

        fileList.value = [...fileList.value, ...uploadedFiles]
        markUploadedFiles(uploadedFiles.map((item) => item.uuid))
        VXETable.modal.message({ content: '上传成功', status: 'success', duration: 1500 })
      } catch (error) {
        if (sessionId === modalSession && modalVisible.value) {
          ElMessage.error(formatErrorMessage(error, '文件上传失败'))
        }
      } finally {
        if (input) {
          input.value = ''
        }
        if (sessionId === modalSession && modalVisible.value) {
          tableLoading.value = false
        }
      }
    }

    const getFileIcon = (fileName: string) => {
      const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : ''
      const iconMap: Record<string, string> = {
        pdf: 'el-icon-document-copy',
        doc: 'el-icon-document',
        docx: 'el-icon-document',
        xls: 'el-icon-tickets',
        xlsx: 'el-icon-tickets',
        txt: 'el-icon-document',
        jpg: 'el-icon-picture',
        jpeg: 'el-icon-picture',
        png: 'el-icon-picture',
        gif: 'el-icon-picture'
      }
      return iconMap[extension || ''] || 'el-icon-document'
    }

    const rowClassName = ({ row }: { row: FileRecord }) => {
      return row.isNew ? 'row-new' : ''
    }

    const handleDelete = async (row: FileRecord) => {
      const type = await VXETable.modal.confirm('确认是否删除?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return

      fileList.value = fileList.value.filter((item) => item !== row)
      VXETable.modal.message({ content: '文件已删除', status: 'success', duration: 1500 })
    }

    const handleSubmit = async () => {
      const submit = props.submitApi
      if (!submit) return

      const approvalValue = approvalNumber.value.trim()
      if (!approvalValue) {
        VXETable.modal.message({ content: '请输入' + props.inputText, status: 'warning' })
        return
      }

      if (tableLoading.value) {
        VXETable.modal.message({ content: '文件上传中，请稍后再试', status: 'warning' })
        return
      }

      if (fileList.value.length === 0) {
        VXETable.modal.message({ content: '请上传至少一个文件', status: 'warning' })
        return
      }

      if (fileList.value.some((item) => !item.uuid)) {
        VXETable.modal.message({ content: '存在未完成上传的文件，请重新上传后再保存', status: 'warning' })
        return
      }

      const ids = buildSelectedIds()
      if (!ids) {
        VXETable.modal.message({ content: '未找到可维护的数据', status: 'warning' })
        return
      }

      const type = await VXETable.modal.confirm('确认是否保存?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return

      const sessionId = modalSession
      submitLoading.value = true
      try {
        const res = await submit({
          xmId: ids,
          [props.inputKey]: approvalValue,
          uuids: fileList.value.map((item) => item.uuid)
        })
        if (sessionId !== modalSession || !modalVisible.value) return
        if (!res.success) {
          throw new Error(res.msg)
        }

        VXETable.modal.message({
          content: '保存成功',
          status: 'success',
          duration: 2000
        })
        emit('submitAfter')
        modalVisible.value = false
      } catch (error) {
        if (sessionId === modalSession && modalVisible.value) {
          ElMessage.error(formatErrorMessage(error, '保存失败'))
        }
      } finally {
        if (sessionId === modalSession && modalVisible.value) {
          submitLoading.value = false
        }
      }
    }

    watch(modalVisible, (visible) => {
      modalSession += 1
      resetModalState()
      if (!visible) return

      const sessionId = modalSession
      void initializeModal(sessionId)
    })

    expose({
      modalVisible,
      approvalNumber,
      fileInput,
      loading,
      tableLoading,
      submitLoading,
      fileList,
      openModal,
      handleUploadClick,
      handleFileChange,
      formatFileSize,
      getFileIcon,
      rowClassName,
      handleDelete,
      handleSubmit
    })

    return {
      modalVisible,
      approvalNumber,
      fileInput,
      loading,
      tableLoading,
      submitLoading,
      fileList,
      openModal,
      handleUploadClick,
      handleFileChange,
      formatFileSize,
      getFileIcon,
      rowClassName,
      handleDelete,
      handleSubmit,
      acceptedFileTypes,
      hasFileRestrictions,
      allowedFileTypesDisplay,
      maxFileSizeDisplay
    }
  }
})
</script>

<style scoped lang="less">
@import 'index';
</style>
