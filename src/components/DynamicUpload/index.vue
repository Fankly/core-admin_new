<template>
  <!-- 表格式上传组件 -->
  <div class="dynamic-upload-table" v-loading="loading">
    <div class="upload-header">
      <div class="upload-title">{{ title }}</div>
      <div class="upload-action" v-if="showDelete || showStandardTemplateDownload">
        <div class="upload-action-group">
          <el-button v-if="showStandardTemplateDownload" plain type="primary" :loading="templateDownloadLoading" @click="handleTemplateDownload">
            标准模版下载
          </el-button>
          <el-button v-if="showDelete" :disabled="loading || disabled" type="primary" @click="insertEvent(true)"> 上传文件 </el-button>
        </div>
      </div>
    </div>

    <vxe-table
      :row-config="{
        height: 32
      }"
      :show-overflow="true"
      :loading="loading"
      ref="tableRef"
      :data="fileList"
      :height="typeof tableHeight === 'number' || tableHeight.includes('px') ? tableHeight : tableHeight"
      stripe
      border
      class="file-table"
      v-show="fileList.length > 0"
    >
      <vxe-column field="index" title="序号" width="80" align="center">
        <template #default="{ $rowIndex }">
          {{ $rowIndex + 1 }}
        </template>
      </vxe-column>

      <vxe-column field="name" title="附件名称" min-width="200">
        <template #default="{ row }">
          <div class="file-name">
            <i class="el-icon-document" />
            <span>{{ row.name }}</span>
          </div>
        </template>
      </vxe-column>

      <vxe-column v-if="showStatus" field="status" title="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="success" v-if="row.status === 'success'">已上传</el-tag>
          <el-tag type="warning" v-else-if="row.status === 'uploading'">上传中</el-tag>
          <el-tag type="danger" v-else-if="row.status === 'error'">上传失败</el-tag>
          <el-tag v-else>{{ row.status }}</el-tag>
        </template>
      </vxe-column>

      <vxe-column v-if="showActions" title="操作" :width="showDelete ? 180 : 100" align="center">
        <template #default="{ row }">
          <div class="file-actions">
            <el-button v-if="showDownload" type="text" @click="handleDownload(row)"> <i class="el-icon-download"></i> 下载 </el-button>
            <el-button v-if="showDelete" type="text" @click="handleDelete(row)"> <i class="el-icon-delete"></i> 删除 </el-button>
          </div>
        </template>
      </vxe-column>
    </vxe-table>

    <div v-show="fileList.length === 0" class="empty-files">
      <p>{{ emptyText }}</p>
    </div>

    <div v-if="tip" class="upload-tip"><i class="el-icon-info-circle"></i> {{ tip }}</div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { downloadAttach } from '@/api/service/requirement'
import VXETable from 'vxe-table'
import { downloadStandardTemplate, loadStandardTemplateMeta, StandardTemplateMeta } from './templateDownload'

interface FileItem {
  name: string
  url?: string
  status: string
  uid: string
  uuid?: string
  raw?: File
  response?: any
}

export default defineComponent({
  name: 'DynamicUpload',
  props: {
    modelValue: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    fjTypes: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: '批复文件'
    },
    limit: {
      type: Number,
      default: 5
    },
    accept: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      default: '/api/upload'
    },
    tip: {
      type: String,
      default: ''
    },
    attachType: {
      type: String,
      default: ''
    },
    listType: {
      type: String,
      default: 'text'
    },
    multiple: {
      type: Boolean,
      default: true
    },
    autoUpload: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    drag: {
      type: Boolean,
      default: false
    },
    styleType: {
      type: String,
      default: 'table'
    },
    buttonText: {
      type: String,
      default: '点击上传'
    },
    icon: {
      type: String,
      default: 'el-icon-upload'
    },
    tableHeight: {
      type: [String, Number],
      default: 'auto'
    },
    showPreview: {
      type: Boolean,
      default: false
    },
    showDownload: {
      type: Boolean,
      default: true
    },
    showDelete: {
      type: Boolean,
      default: true
    },
    showStatus: {
      type: Boolean,
      default: true
    },
    showActions: {
      type: Boolean,
      default: true
    },
    allData: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    fjId: {
      type: String,
      default: '1'
    },
    selectData: {
      type: Object as any,
      default: null
    }
  },
  emits: ['update:modelValue', 'change', 'success', 'error', 'exceed', 'remove'],
  setup(props, { emit }) {
    const uploadRef = ref()
    const tableRef = ref()
    const fileList = ref<FileItem[]>([])
    const loading = ref(false)
    const templateMeta = ref<StandardTemplateMeta | null>(null)
    const templateDownloadLoading = ref(false)
    const showStandardTemplateDownload = computed(() => !props.disabled && Boolean(templateMeta.value))
    const emptyText = computed(() => (props.showDelete && !props.disabled ? '暂无文件，请点击上传按钮添加文件' : '暂无附件'))

    const loadTemplateMeta = async () => {
      templateMeta.value = null
      try {
        templateMeta.value = await loadStandardTemplateMeta(props.selectData, props.fjId)
      } catch (error) {
        console.error(error)
      }
    }

    const handleTemplateDownload = async () => {
      if (!templateMeta.value) return

      templateDownloadLoading.value = true
      try {
        await downloadStandardTemplate(templateMeta.value)
      } catch (error: any) {
        ElMessage.error(error?.message || '标准模版下载失败')
      } finally {
        templateDownloadLoading.value = false
      }
    }

    // 移除文件回调
    const handleRemove = async (file: any, uploadedFiles: any[]) => {
      const type = await VXETable.modal.confirm('是否确认删除?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'confirm') {
        loading.value = true
        let id = null
        if (props.selectData && (props.selectData['id'] || props.selectData['xmid'] || props.selectData['xmId'])) {
          id = props.selectData['id']
            ? props.selectData['id']
            : props.selectData['xmid']
            ? props.selectData['xmid']
            : props.selectData['xmId']
            ? props.selectData['xmId']
            : null
        }
        let apiUrl = id ? `/xmAttributeConfig/deleteAttach?xmId=${id}&uuid=${file.uuid}` : `/xmAttributeConfig/deleteAttach?uuid=${file.uuid}`

        try {
          const res = await baseService.post(apiUrl)
          if (res.success) {
            ElMessage.success('删除成功!')
            // 从文件列表中移除
            const index = fileList.value.findIndex((item) => item.uid === (file.uid || '') || item.name === file.name)
            if (index !== -1) {
              fileList.value.splice(index, 1)
            }
          } else {
            throw new Error(res.msg)
          }
        } catch (error) {
          const e = error as Error
          ElMessage.error(e.message)
        } finally {
          loading.value = false
          // 触发事件
          emit('remove', file, fileList.value)
          emit('change', fileList.value)
        }
      }
    }

    // 删除文件
    const handleDelete = (file: FileItem) => {
      handleRemove(file, fileList.value)
    }

    // 下载文件
    const handleDownload = async (file: FileItem) => {
      if (file.uuid) {
        try {
          let isLhhs = ''
          if (props.attachType) {
            isLhhs = '1'
          }
          loading.value = true
          const blob: any = await downloadAttach(file.uuid, isLhhs)
          let dom = document.createElement('a')
          let url = window.URL.createObjectURL(blob)
          dom.href = url
          // 获取文件名
          let filename = file.name
          dom.download = `${decodeURI(decodeURI(filename))}`
          document.body.appendChild(dom)
          dom.click()
          document.body.removeChild(dom)
          window.URL.revokeObjectURL(url)
          loading.value = false
        } catch (e: any) {
          console.error(e.toString())
        }
      }
    }

    const insertEvent = async (isMultiple: boolean) => {
      if (props.disabled) return
      const $table = tableRef.value
      if ($table) {
        const types = props.fjTypes
        const { files } = await $table.readFile({ multiple: isMultiple })
        try {
          const records = Array.from(files).map((file: any) => {
            if (props.fjTypes) {
              const ns = file.name.split('.')
              const type = ns[ns.length - 1].toLowerCase()
              if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
            }
            return {
              name: file.name,
              file: file
            }
          })
          getInsertEvent(records)
        } catch (error: any) {
          ElMessage.error(error.message)
        }
      }
    }
    const getInsertEvent = async (records: any) => {
      const $table = tableRef.value
      if ($table) {
        loading.value = true
        const data = new FormData()
        for (const record of records) {
          data.append('files', record.file)
          data.append('fileNames', record.name)
        }
        let id = null
        if (props.selectData && (props.selectData['id'] || props.selectData['xmid'] || props.selectData['xmId'])) {
          id = props.selectData['id']
            ? props.selectData['id']
            : props.selectData['xmid']
            ? props.selectData['xmid']
            : props.selectData['xmId']
            ? props.selectData['xmId']
            : null
        }

        let apiUrl = id ? `/xmAttributeConfig/uploadAttach?xmId=${id}&fjId=${props.fjId}` : `/xmAttributeConfig/uploadAttach?fjId=${props.fjId}`
        try {
          if ($table) {
            let tableData = await baseService.post(apiUrl, data)
            if (tableData.success) {
              ElMessage.success('上传成功')
              const result = records.map((record: any, index: number) => ({
                ...record,
                uuid: tableData.data[index]
              }))
              fileList.value.push(...result)
              emit(
                'change',
                fileList.value.map((item) => item.uuid)
              )
              emit(
                'update:modelValue',
                fileList.value.map((item) => item.uuid)
              )
              loading.value = false
            } else {
              // 清除上传文件
              loading.value = false
              ElMessage.error(tableData.msg)
            }
          }
        } catch (error) {}
      }
    }

    watch(
      () => props.allData,
      (newVal) => {
        if (newVal) {
          fileList.value = newVal
        }
      },
      {
        immediate: true
      }
    )

    watch(
      () => [props.selectData?.xmlx, props.fjId],
      () => {
        void loadTemplateMeta()
      },
      {
        immediate: true
      }
    )

    return {
      uploadRef,
      tableRef,
      fileList,
      handleTemplateDownload,
      insertEvent,
      handleRemove,
      loading,
      handleDelete,
      handleDownload,
      showStandardTemplateDownload,
      templateDownloadLoading,
      emptyText
    }
  }
})
</script>

<style lang="less" scoped>
.dynamic-upload,
.dynamic-upload-table {
  width: 100%;
  min-width: 800px;

  .upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 8px 0;
    border-bottom: 1px solid #ebeef5;

    .upload-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }

    .upload-action {
      .upload-action-group {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
        padding-right: 10px;
      }

      .el-button {
        padding: 8px 16px;
      }
    }
  }

  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}

.dynamic-upload-table {
  .file-table {
    margin-bottom: 10px;

    :deep(.vxe-table--header) {
      background-color: #f5f7fa;
    }

    :deep(.vxe-body--row) {
      &.row--striped {
        background-color: #fafafa;
      }
    }
  }

  .file-name {
    display: flex;
    align-items: center;

    i {
      margin-right: 5px;
      color: #909399;
    }
  }

  .file-actions {
    display: flex;
    justify-content: space-around;
  }

  .empty-files {
    padding: 30px 0;
    text-align: center;
    color: #909399;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
}
</style>
