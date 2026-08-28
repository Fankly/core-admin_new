<template>
  <vxe-modal
    position="center"
    class-name="modal-main"
    v-model="modalVisible"
    width="900"
    height="720"
    :title="modalProps.modalTitle"
    resize
    destroy-on-close
    :mask-closable="false"
    :loading="loading"
    @close="closeHandle"
    :show-footer="true"
    transfer
  >
    <div class="modal-content">
      <div class="form-card">
        <div class="form-body">
          <div class="form-title">
            <div class="upload-main" v-if="!modalProps.isView">
              <vxe-button status="primary" icon="el-icon-upload" @click="handleUploadClick" class="upload-btn pulse"> 文件上传 </vxe-button>
              <input type="file" ref="fileInput" multiple style="display: none" :accept="acceptedFileTypes" @change="handleFileChange" />
            </div>
            <vxe-button v-if="!modalProps.isView" status="danger" icon="el-icon-delete" @click="handleDeleteDatas" class="delete-btn pulse"
              >批量删除</vxe-button
            >
            <vxe-button type="button" icon="el-icon-close" @click="closeHandle" class="close-btn pulse">关闭</vxe-button>
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
                :column-config="{
                  resizable: true
                }"
                :checkbox-config="{ trigger: 'row', highlight: true }"
                :row-config="{ isCurrent: true, isHover: true }"
                :data="fileList"
                height="auto"
                max-height="100%"
                :loading="tableLoading"
                class="file-table"
                :row-class-name="rowClassName"
                :loading-config="{ icon: 'el-icon-loading', text: '正在加载文件...' }"
                @checkbox-change="handleUploadFileSelection"
                @checkbox-all="handleUploadFileSelection"
              >
                <vxe-column align="center" type="checkbox" width="60"></vxe-column>
                <vxe-column align="center" type="seq" width="60" title="序号"></vxe-column>
                <vxe-column field="name" title="文件名称" width="500">
                  <template #default="{ row }">
                    <div class="file-name">
                      <i class="file-icon" :class="getFileIcon(row['name'])"></i>
                      <span class="file-text" :title="row['name']">{{ row['name'] }}</span>
                    </div>
                  </template>
                </vxe-column>
                <vxe-column align="center" title="操作">
                  <template #default="{ row }">
                    <vxe-button
                      v-if="!modalProps.isView"
                      status="danger"
                      size="mini"
                      icon="el-icon-delete"
                      @click="handleDelete(row)"
                      class="delete-btn"
                      >删除</vxe-button
                    >
                    <vxe-button status="primary" size="mini" icon="el-icon-download" @click="handleDownload(row)" class="delete-btn"
                      >附件下载</vxe-button
                    >
                  </template>
                </vxe-column>
              </vxe-table>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { VXETable } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { Result, Params } from '@/views/service/Storage/interface'
import { deleteRemindAttach, downloadAttach, uploadRemindAttach } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'

interface ModalProps {
  isView: boolean
  selectData: any[]
  modalTitle: string
  allowedFileTypes: string[]
  maxFileSize: number
  submitApi: null | ((params: any) => Promise<Result>)
  searchApi: null | ((params: any) => Promise<Result>)
}

export default defineComponent({
  name: 'batchFile',
  props: {
    allowedFileTypes: {
      type: Array,
      default: () => []
    },
    maxFileSize: {
      type: Number,
      default: 104857600
    }
  },
  emits: ['file-type-error', 'file-size-error', 'submitAfter'],
  setup(props, { expose, emit }) {
    const modalVisible = ref(false)
    const fileInput = ref<any>(null)
    const loading = ref(false)
    const tableLoading = ref(false)
    const submitLoading = ref(false)
    const fileList = ref<any[]>([])
    const uploadFileSelection = ref<any[]>([])

    const modalProps = ref<ModalProps>({
      isView: false,
      selectData: [],
      modalTitle: '会议通知附件',
      allowedFileTypes: [],
      maxFileSize: 104857600,
      submitApi: null,
      searchApi: null
    })

    const handleDeleteDatas = async () => {
      if (uploadFileSelection.value && uploadFileSelection.value.length === 0) {
        VXETable.modal.message({
          content: `请至少选择一条数据进行删除操作!`,
          status: 'warning'
        })
        return
      }
      const type = await VXETable.modal.confirm('确认是否删除?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
      loading.value = true
      try {
        const ids = uploadFileSelection.value.map((item) => item.id)
        const uuids = uploadFileSelection.value.map((item) => item.uuid).join(',')
        const res = await deleteRemindAttach({
          ids: ids,
          uuid: uuids
        })
        if (!res.success) throw new Error(res.msg)
        searchData()
        VXETable.modal.message({ content: '文件已删除', status: 'success', duration: 1500 })
      } catch (error) {
        ElMessage.error((error as Error).message || '删除失败!')
      } finally {
        loading.value = false
      }
    }

    const closeHandle = () => {
      fileList.value = []
      uploadFileSelection.value = []
      loading.value = false
      tableLoading.value = false
      submitLoading.value = false
      if (fileInput.value) {
        fileInput.value.value = ''
      }
      modalVisible.value = false
    }

    const searchData = async () => {
      const search = modalProps.value?.searchApi
      if (!search) return
      loading.value = true
      try {
        const meetingIdArr = modalProps.value.selectData.map((item) => item.meetingId)
        if (meetingIdArr.length !== 1) {
          return
        }
        uploadFileSelection.value.length = 0
        const ids = meetingIdArr.join(',')
        const searchDataRes = await search({
          meetingId: ids
        })
        if (!searchDataRes.success) throw new Error(searchDataRes.msg)
        fileList.value = searchDataRes.data.map((attachList: any) => {
          return {
            name: attachList.attachName,
            meetingId: attachList.meetingId,
            id: attachList.id,
            uuid: attachList.uuid,
            fjType: attachList.fjType,
            isNew: false
          }
        })
      } catch (error) {
        ElMessage.error((error as Error).message)
      } finally {
        loading.value = false
      }
    }

    const acceptedFileTypes = computed(() => {
      return props.allowedFileTypes.length > 0 ? props.allowedFileTypes.join(',') : undefined
    })

    const hasFileRestrictions = computed(() => {
      return props.allowedFileTypes.length > 0 || props.maxFileSize > 0
    })

    const allowedFileTypesDisplay = computed(() => {
      return props.allowedFileTypes.join(', ')
    })

    const maxFileSizeDisplay = computed(() => {
      return formatFileSize(modalProps.value.maxFileSize)
    })

    const openModal = () => {
      modalVisible.value = true
    }

    const handleUploadClick = () => {
      if (fileInput.value) fileInput.value.click()
    }

    const handleFileChange = (event: any) => {
      const files: any = event.target.files
      if (!files || files.length === 0) return
      tableLoading.value = true

      const processFile = () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const now = new Date()
            const timeStr = now.toLocaleTimeString()

            const newFiles = []

            const rejectedFiles: any = {
              type: [],
              size: []
            }

            for (let i = 0; i < files.length; i++) {
              const file: Params = files[i]

              // 检查类型
              const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
              const isValidType =
                props.allowedFileTypes.length === 0 ||
                props.allowedFileTypes.includes(fileExtension) ||
                props.allowedFileTypes.includes(fileExtension.substring(1))
              const isValidSize = file.size <= props.maxFileSize
              if (!isValidType) {
                rejectedFiles.type.push(file.name)
                continue
              }
              if (!isValidSize) {
                rejectedFiles.size.push(file.name)
                continue
              }
              newFiles.push({
                name: file.name,
                size: file.size,
                file: file,
                createTime: timeStr,
                isNew: true
              })
            }
            if (rejectedFiles.type.length > 0) {
              emit('file-type-error', rejectedFiles.type)
              VXETable.modal.message({
                content: `文件类型不符合要求:${rejectedFiles.type.join(', ')}`,
                status: 'warning'
              })
            }
            resolve(newFiles)
          }, 500)
        })
      }
      processFile()
        .then(async (newFiles: any) => {
          const attachNames = newFiles.map((item: any) => item.name)
          const data = new FormData()
          for (const newFile of newFiles) {
            data.append('files', newFile.file)
          }
          const meetingIds = modalProps.value.selectData.map((item) => item.meetingId)
          const res = await uploadRemindAttach({
            excelFormData: data,
            attachNames: attachNames,
            meetingIds: meetingIds
          })
          if (!res.success) throw new Error(res.msg)
          searchData()
          ElMessage.success('上传成功!')
        })
        .finally(() => {
          tableLoading.value = false
        })
    }

    const formatFileSize = (size: any) => {
      if (size < 1024) {
        return size + ' B'
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB'
      } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + ' MB'
      } else {
        return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
      }
    }

    const getFileIcon = (fileName: any) => {
      const extension = fileName.split('.').pop().toLowerCase()
      const iconMap: any = {
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
      return iconMap[extension] || 'el-icon-document'
    }
    const rowClassName = ({ row }: any) => {
      return row.isNew ? 'row-new' : ''
    }

    const handleDelete = async (row: any) => {
      const type = await VXETable.modal.confirm('确认是否删除?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
      loading.value = true
      try {
        const index = fileList.value.findIndex((item: any) => item === row)
        if (index !== -1) {
          const fileItem = fileList.value[index]
          if (fileItem) {
            const res = await deleteRemindAttach({
              ids: [fileItem.id],
              uuid: fileItem.uuid
            })
            if (!res.success) throw new Error(res.msg)
            searchData()
            VXETable.modal.message({ content: '文件已删除', status: 'success', duration: 1500 })
          }
        }
      } catch (error) {
        ElMessage.error((error as Error).message || '删除失败!')
      } finally {
        loading.value = false
      }
    }

    const handleDownload = async (row: any) => {
      loading.value = true
      const index = fileList.value.findIndex((item: any) => item === row)
      if (index !== -1) {
        const fileItem = fileList.value[index]
        if (fileItem) {
          const res = await downloadAttach({
            uuid: fileItem.uuid
          })
          if (!res.success) {
            ElMessage.error(res.msg || '附件下载失败!')
            return
          }
          const link = document.createElement('a')
          link.href = res.data
          link.download = `${fileItem.attachName}.xlsx` // 获取文件名
          document.body.appendChild(link)
          link.click()
          link.remove()
        }
      }
      loading.value = false
    }

    const acceptParams = (params: ModalProps) => {
      modalProps.value = {
        ...modalProps.value,
        ...params
      }
      searchData()
      modalVisible.value = true
    }

    const handleUploadFileSelection = ({ records }: any) => {
      uploadFileSelection.value = records
    }

    expose({
      acceptParams
    })

    return {
      handleDeleteDatas,
      handleUploadFileSelection,
      handleDownload,
      modalProps,
      closeHandle,
      modalVisible,
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
