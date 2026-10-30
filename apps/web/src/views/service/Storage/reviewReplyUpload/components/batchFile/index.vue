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
              <vxe-button status="primary" icon="el-icon-document" @click="handleSave" class="close-btn pulse"> 保存 </vxe-button>
              <vxe-button status="primary" icon="el-icon-upload" @click="handleUploadClick" class="upload-btn pulse"> 附件上传 </vxe-button>
              <input type="file" ref="fileInput" style="display: none" :accept="acceptedFileTypes" @change="handleFileChange" />
              <vxe-button type="button" icon="el-icon-close" @click="closeHandle" class="close-btn pulse">关闭</vxe-button>
            </div>
          </div>
        </div>
      </div>
      <div class="form-card">
        <div class="form-item">
          <i class="el-icon-tickets form-icon"></i>
          <span class="label">{{ modalProps.inputText }}：</span>
          <vxe-input maxlength="127" v-model="wh" :placeholder="'请输入' + modalProps.inputText" class="approval-input"></vxe-input>
        </div>
        <div class="form-item" v-if="modalProps.selectText">
          <i class="el-icon-tickets form-icon"></i>
          <span class="label">{{ modalProps.selectText }}：</span>
          <el-select v-model="nd" :placeholder="'请选择' + modalProps.selectText" class="approval-input">
            <el-option v-for="item in selectList" :key="item.code" :value="item.code" :label="item.name"></el-option>
          </el-select>
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
                ref="tableRef"
                show-overflow
                header-align="center"
                border
                stripe
                :column-config="{
                  resizable: true
                }"
                :data="fileList"
                height="auto"
                max-height="100%"
                :loading="tableLoading"
                class="file-table"
                :row-class-name="rowClassName"
                :loading-config="{ icon: 'el-icon-loading', text: '正在加载文件...' }"
              >
                <vxe-column align="center" type="seq" width="60" title="序号"></vxe-column>
                <vxe-column align="center" field="uuid" width="60" title="uuid" :visible="false"></vxe-column>
                <vxe-column field="name" title="文件名称">
                  <template #default="{ row }">
                    <div class="file-name">
                      <i class="file-icon" :class="getFileIcon(row['name'])"></i>
                      <el-button type="text" @click="handleDownload(row)">{{ row['name'] }}</el-button>
                    </div>
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
import { VXETable, VxeTableInstance } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { Result, Params } from '@/views/service/Storage/interface'
import { maintainWh } from '@/api/service/Storage/reviewReplyUpload/index'
import { downloadAttach } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { getPublicData } from '@/api/common'

interface ModalProps {
  isView: boolean
  selectData: any[]
  searchCode: string
  inputText: string
  selectText?: string
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
    const tableRef = ref<VxeTableInstance>()
    const nd = ref('')
    const wh = ref('')
    const fileInput = ref<any>(null)
    const loading = ref(false)
    const tableLoading = ref(false)
    const submitLoading = ref(false)
    const fileList = ref<any[]>([])
    const selectList = ref<any[]>([])

    const modalProps = ref<ModalProps>({
      isView: false,
      selectData: [],
      modalTitle: '附件上传',
      inputText: '评审意见文号',
      allowedFileTypes: [],
      maxFileSize: 104857600,
      submitApi: null,
      searchApi: null,
      searchCode: ''
    })

    const closeHandle = () => {
      fileList.value = []
      loading.value = false
      tableLoading.value = false
      submitLoading.value = false
      if (fileInput.value) {
        fileInput.value.value = ''
      }
      nd.value = ''
      wh.value = ''
      modalProps.value = {
        isView: false,
        selectData: [],
        modalTitle: '附件上传',
        inputText: '评审意见文号',
        allowedFileTypes: [],
        maxFileSize: 104857600,
        submitApi: null,
        searchApi: null,
        searchCode: ''
      }
      modalVisible.value = false
    }

    const searchData = async () => {
      const search = modalProps.value?.searchApi
      if (!search) return
      loading.value = true
      try {
        const IdArr = modalProps.value.selectData.map((item) => item.id)
        if (IdArr.length !== 1) {
          return
        }
        const ids = IdArr.join(',')
        const searchDataRes = await search({
          id: ids,
          searchCode: modalProps.value.searchCode
        })
        if (!searchDataRes.success) throw new Error(searchDataRes.msg)
        wh.value = searchDataRes.data.wh
        fileList.value = searchDataRes.data.attachLists.map((attachList: any) => {
          return {
            name: attachList.attachName,
            id: attachList.id,
            uuid: attachList.uuid,
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

    const handleSave = async () => {
      if (!wh.value) {
        VXETable.modal.message({
          content: `请输入${modalProps.value.inputText}!`,
          status: 'warning'
        })
        return
      }
      if (modalProps.value.searchCode === 'PFYJSC_SJTC' && !nd.value) {
        VXETable.modal.message({
          content: `请输入${modalProps.value.selectText}!`,
          status: 'warning'
        })
        return
      }
      if (fileList.value.length === 0) {
        VXETable.modal.message({
          content: `请上传文件!`,
          status: 'warning'
        })
        return
      }
      loading.value = true
      try {
        const ids = modalProps.value.selectData.map((item) => item.id)
        const res = await maintainWh({
          searchCode: modalProps.value.searchCode,
          wh: wh.value,
          ids: ids,
          nd: nd.value
        })
        if (!res.success) throw new Error(res.msg)
        VXETable.modal.message({
          content: `保存成功!`,
          status: 'success'
        })
        emit('submitAfter')
        closeHandle()
      } catch (error) {
        ElMessage.error((error as Error).message)
      } finally {
        loading.value = false
      }
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
          if (!modalProps.value.submitApi) return
          const attachNames = newFiles.map((item: any) => item.name)
          const data = new FormData()
          for (const newFile of newFiles) {
            data.append('files', newFile.file)
          }
          const ids = modalProps.value.selectData.map((item) => item.id)
          const res = await modalProps.value.submitApi({
            excelFormData: data,
            attachNames: attachNames,
            searchCode: modalProps.value.searchCode,
            ids: ids
          })
          if (!res.success) throw new Error(res.msg)
          const records = newFiles.map((file: any, index: number) => {
            return {
              name: file.name,
              uuid: res.data[index],
              isNew: true
            }
          })
          fileList.value = records
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

    const getPublicParams = async (code: string) => {
      try {
        const res = await getPublicData(code)
        if (!res.success) throw new Error(res.msg)
        selectList.value = res.data
      } catch (error) {
        ElMessage.error((error as Error).message)
      }
    }

    const acceptParams = (params: ModalProps) => {
      modalProps.value = {
        ...modalProps.value,
        ...params
      }
      if (params.selectText) {
        getPublicParams('ZLYS_XMJHSSND')
        if (modalProps.value.selectData && modalProps.value.selectData.length === 1) {
          nd.value = modalProps.value.selectData[0].nd
        } else {
          nd.value = new Date().getFullYear().toString()
        }
      }

      searchData()
      modalVisible.value = true
    }

    expose({
      acceptParams
    })

    return {
      tableRef,
      selectList,
      handleSave,
      wh,
      nd,
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
