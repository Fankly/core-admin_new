<template>
  <!-- 表格式上传组件 -->
  <div class="dynamic-upload-table" v-loading="loading">
    <div class="upload-header">
      <div class="upload-title">{{ title }}</div>
      <div class="upload-action" v-if="showDelete">
        <el-button :disabled="loading || disabled" type="primary" @click="insertEvent()"> 上传文件 </el-button>
      </div>
    </div>

    <vxe-table
      :row-config="{
        height: 32
      }"
      :show-overflow="true"
      :data="fileList"
      align="center"
      header-align="center"
      :height="fitContent ? undefined : tableHeight"
      :max-height="fitContent ? tableHeight : undefined"
      stripe
      border
      resizable
      class="file-table"
      v-show="fileList.length > 0"
    >
      <vxe-column field="index" title="序号" width="80" align="center">
        <template #default="{ $rowIndex }">
          {{ $rowIndex + 1 }}
        </template>
      </vxe-column>

      <vxe-column field="fjId" title="附件类型" width="160" :formatter="formatterData"> </vxe-column>

      <vxe-column field="name" title="附件名称" min-width="200">
        <template #default="{ row }">
          <div class="file-name">
            <i class="el-icon-document" />
            <span>{{ row.name }}</span>
          </div>
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

  <vxe-modal
    :loading="loading"
    @close="closeHandle"
    resize
    show-zoom
    position="center"
    title="附件管理"
    width="960px"
    v-model="isShowModal"
    height="920px"
  >
    <div class="modal-container">
      <div v-if="uploadGroups.length === 0" class="empty-files">
        <p>暂无可配置的附件类型</p>
      </div>

      <div v-else class="upload-group-list">
        <div v-for="group in uploadGroups" :key="group.fjId || group.prop" class="upload-group-card">
          <div class="upload-group-toolbar">
            <div class="upload-group-type">
              <span class="upload-group-value">{{ group.label || '-' }}</span>
            </div>

            <div class="upload-group-action" v-if="shouldShowGroupActions(group)">
              <el-button
                v-if="hasGroupTemplate(group.fjId)"
                size="mini"
                style="min-height: 34px"
                plain
                type="primary"
                :loading="isGroupTemplateDownloading(group.fjId)"
                @click="handleGroupTemplateDownload(group.fjId)"
              >
                标准模版下载
              </el-button>
              <el-button
                v-if="showDelete && !group.disabled"
                size="mini"
                style="min-height: 34px; width: 100px"
                plain
                type="primary"
                :disabled="loading || disabled"
                @click="uploadHandle(group)"
              >
                上传文件
              </el-button>
            </div>
          </div>

          <vxe-table
            :row-config="{
              height: 32
            }"
            :ref="(el:any) => setTableRef(group.fjId, el)"
            :show-overflow="true"
            :data="getGroupFileList(group.fjId)"
            align="center"
            header-align="center"
            max-height="220"
            stripe
            border
            resizable
            class="file-table group-file-table"
            empty-text="暂无文件"
          >
            <vxe-column field="index" title="序号" width="80" align="center">
              <template #default="{ $rowIndex }">
                {{ $rowIndex + 1 }}
              </template>
            </vxe-column>

            <vxe-column field="name" title="附件名称" min-width="260">
              <template #default="{ row }">
                <div class="file-name">
                  <i class="el-icon-document" />
                  <span>{{ row.name }}</span>
                </div>
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
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { downloadAttach } from '@/api/service/requirement'
import VXETable from 'vxe-table'
import { downloadStandardTemplate, loadStandardTemplateMeta, StandardTemplateMeta } from '@/components/DynamicUpload/templateDownload'

interface FileItem {
  name: string
  url?: string
  status: string
  uid?: string
  uuid?: string
  raw?: File
  response?: any
  prop?: string
  fjId?: string
  file?: File
}

interface UploadRequestParams {
  records: FileItem[]
  fjId: string
  selectData: any
}

export default defineComponent({
  name: 'DynamicUploadGGroup',
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
    fitContent: {
      type: Boolean,
      default: false
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
    showActions: {
      type: Boolean,
      default: true
    },
    localRemoveOnly: {
      type: Boolean,
      default: false
    },
    localRemoveSuccessMessage: {
      type: String,
      default: '已移除，保存后生效'
    },
    allData: {
      type: Object as any,
      default: () => {}
    },
    fjId: {
      type: String,
      default: '1'
    },
    selectData: {
      type: Object as any,
      default: null
    },
    columns: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    uploadRequest: {
      type: Function as PropType<(params: UploadRequestParams) => Promise<any>>,
      default: null
    }
  },
  emits: ['update:modelValue', 'change', 'success', 'error', 'exceed', 'remove'],
  setup(props, { emit }) {
    const isShowModal = ref(false)
    const fileList = ref<FileItem[]>([])
    const loading = ref(false)
    const tableRefs = ref<Record<string, any>>({})
    const groupTemplateMetaMap = ref<Record<string, StandardTemplateMeta>>({})
    const groupTemplateDownloadLoadingMap = ref<Record<string, boolean>>({})
    const emptyText = computed(() => (props.showDelete && !props.disabled ? '暂无文件，请点击上传按钮添加文件' : '暂无附件'))

    const uploadGroups = computed(() => {
      if (Array.isArray(props.columns)) {
        return props.columns
      }
      return []
    })

    const groupedFileList = computed<Record<string, FileItem[]>>(() => {
      const groups = uploadGroups.value.reduce((result: Record<string, FileItem[]>, item: any) => {
        if (item?.fjId) {
          result[item.fjId] = []
        }
        return result
      }, {})

      fileList.value.forEach((item) => {
        const currentFjId = item?.fjId || ''
        if (!groups[currentFjId]) {
          groups[currentFjId] = []
        }
        groups[currentFjId].push(item)
      })

      return groups
    })

    const getSelectDataId = () => {
      if (props.selectData && (props.selectData['id'] || props.selectData['xmid'] || props.selectData['xmId'])) {
        return props.selectData['id']
          ? props.selectData['id']
          : props.selectData['xmid']
          ? props.selectData['xmid']
          : props.selectData['xmId']
          ? props.selectData['xmId']
          : null
      }
      return null
    }

    const setTableRef = (fjId: string, tableInstance: any) => {
      if (!fjId) return
      if (tableInstance) {
        tableRefs.value[fjId] = tableInstance
      } else {
        delete tableRefs.value[fjId]
      }
    }

    const getGroupFileList = (fjId: string) => {
      return groupedFileList.value[fjId] || []
    }

    const findFjTypeData = (fjId: string) => {
      return uploadGroups.value.find((item: any) => item.fjId === fjId)
    }

    const setGroupTemplateMeta = (fjId: string, templateMeta: StandardTemplateMeta | null) => {
      if (!fjId) return
      if (templateMeta) {
        groupTemplateMetaMap.value[fjId] = templateMeta
      } else {
        delete groupTemplateMetaMap.value[fjId]
      }
    }

    const setGroupTemplateDownloadLoading = (fjId: string, isLoading: boolean) => {
      if (!fjId) return
      if (isLoading) {
        groupTemplateDownloadLoadingMap.value[fjId] = true
      } else {
        delete groupTemplateDownloadLoadingMap.value[fjId]
      }
    }

    const hasGroupTemplate = (fjId: string) => {
      return Boolean(fjId && groupTemplateMetaMap.value[fjId])
    }

    const isGroupTemplateDownloading = (fjId: string) => {
      return Boolean(fjId && groupTemplateDownloadLoadingMap.value[fjId])
    }

    const shouldShowGroupActions = (group: any) => {
      return hasGroupTemplate(group?.fjId) || (props.showDelete && !group?.disabled)
    }

    const getUploadGroupFjIds = () => {
      return Array.from(new Set(uploadGroups.value.map((item: any) => item?.fjId).filter(Boolean)))
    }

    const refreshGroupTemplateMeta = async () => {
      const fjIds = getUploadGroupFjIds()

      Object.keys(groupTemplateMetaMap.value).forEach((key) => {
        if (!fjIds.includes(key)) {
          delete groupTemplateMetaMap.value[key]
        }
      })
      Object.keys(groupTemplateDownloadLoadingMap.value).forEach((key) => {
        if (!fjIds.includes(key)) {
          delete groupTemplateDownloadLoadingMap.value[key]
        }
      })

      await Promise.all(
        fjIds.map(async (fjId) => {
          try {
            const templateMeta = await loadStandardTemplateMeta(props.selectData, fjId)
            setGroupTemplateMeta(fjId, templateMeta)
          } catch (error) {
            setGroupTemplateMeta(fjId, null)
            console.error(error)
          }
        })
      )
    }

    const handleGroupTemplateDownload = async (fjId: string) => {
      const templateMeta = groupTemplateMetaMap.value[fjId]
      if (!templateMeta) return

      setGroupTemplateDownloadLoading(fjId, true)
      try {
        await downloadStandardTemplate(templateMeta)
      } catch (error: any) {
        ElMessage.error(error?.message || '标准模版下载失败')
      } finally {
        setGroupTemplateDownloadLoading(fjId, false)
      }
    }

    const removeLocalFile = (file: FileItem) => {
      const index = fileList.value.findIndex(
        (item) => (file.uuid && item.uuid === file.uuid) || (file.uid && item.uid === file.uid) || item.name === file.name
      )
      if (index !== -1) {
        fileList.value.splice(index, 1)
      }
    }

    // 移除文件回调
    const handleRemove = async (file: FileItem) => {
      const type = await VXETable.modal.confirm('是否确认删除?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type === 'confirm') {
        loading.value = true

        try {
          if (props.localRemoveOnly) {
            removeLocalFile(file)
            ElMessage.success(props.localRemoveSuccessMessage)
            return
          }

          const id = getSelectDataId()
          const apiUrl = id ? `/xmAttributeConfig/deleteAttach?xmId=${id}&uuid=${file.uuid}` : `/xmAttributeConfig/deleteAttach?uuid=${file.uuid}`
          const res = await baseService.post(apiUrl)
          if (res.success) {
            ElMessage.success('删除成功!')
            removeLocalFile(file)
          } else {
            throw new Error(res.msg)
          }
        } catch (error) {
          const e = error as Error
          ElMessage.error(e.message)
        } finally {
          loading.value = false
          emit('remove', file, fileList.value)
          emit('change', fileList.value)
          emit('update:modelValue', fileList.value)
        }
      }
    }

    const formatterData = ({ cellValue }: any) => {
      if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
      const fjTypeItem = findFjTypeData(cellValue)
      return fjTypeItem ? fjTypeItem['label'] : '-'
    }

    // 删除文件
    const handleDelete = (file: FileItem) => {
      handleRemove(file)
    }

    // 下载文件
    const handleDownload = async (file: FileItem) => {
      if (!file.uuid) return

      try {
        let isLhhs = ''
        if (props.attachType) {
          isLhhs = '1'
        }
        loading.value = true
        const blob: any = await downloadAttach(file.uuid, isLhhs)
        const dom = document.createElement('a')
        const url = window.URL.createObjectURL(blob)
        const filename = file.name
        dom.href = url
        dom.download = `${decodeURI(decodeURI(filename))}`
        document.body.appendChild(dom)
        dom.click()
        document.body.removeChild(dom)
        window.URL.revokeObjectURL(url)
      } catch (error: any) {
        console.error(error.toString())
      } finally {
        loading.value = false
      }
    }

    const uploadHandle = async (fjTypeItem: any, isMultiple = true) => {
      if (!fjTypeItem?.fjId) {
        ElMessage.error('找不到对应的附件类型!')
        return
      }
      if (props.disabled || fjTypeItem.disabled) {
        return
      }

      const $table = tableRefs.value[fjTypeItem.fjId]
      if (!$table) return

      const types = fjTypeItem.fjTypes
      const { files } = await $table.readFile({ multiple: isMultiple })

      try {
        const records = Array.from(files).map((file: any) => {
          if (types && Array.isArray(types) && types.length > 0) {
            const ns = file.name.split('.')
            const type = ns[ns.length - 1].toLowerCase()
            if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
          }
          return {
            prop: fjTypeItem.prop,
            name: file.name,
            fjId: fjTypeItem.fjId,
            file
          }
        })
        await getInsertEvent(records, fjTypeItem.fjId)
      } catch (error: any) {
        ElMessage.error(error.message)
      }
    }

    const getInsertEvent = async (records: any[], fjId: string) => {
      if (!records || records.length === 0) return

      loading.value = true
      try {
        let tableData: any
        if (props.uploadRequest) {
          tableData = await props.uploadRequest({
            records,
            fjId,
            selectData: props.selectData
          })
        } else {
          const data = new FormData()
          records.forEach((record) => {
            data.append('files', record.file)
            data.append('fileNames', record.name)
          })

          const id = getSelectDataId()
          const apiUrl = id ? `/xmAttributeConfig/uploadAttach?xmId=${id}&fjId=${fjId}` : `/xmAttributeConfig/uploadAttach?fjId=${fjId}`
          tableData = await baseService.post(apiUrl, data)
        }
        if (tableData.success) {
          ElMessage.success('上传成功')
          const result = records.map((record: any, index: number) => ({
            ...record,
            uuid: tableData.data[index]
          }))
          fileList.value.push(...result)
          emit('change', fileList.value)
          emit('update:modelValue', fileList.value)
        } else {
          ElMessage.error(tableData.msg)
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '上传失败')
      } finally {
        loading.value = false
      }
    }

    const closeHandle = () => {
      isShowModal.value = false
    }

    watch(
      () => [props.allData, props.columns],
      ([newVal]) => {
        if (newVal) {
          const columnsFjId: string[] = uploadGroups.value.map((item: any) => item?.fjId).filter(Boolean)
          const result = Object.values(newVal)
            .filter(Array.isArray)
            .flat()
            .filter((item: any) => columnsFjId.includes(item?.fjId))
          fileList.value = result as FileItem[]
        } else {
          fileList.value = []
        }
      },
      {
        immediate: true,
        deep: true
      }
    )

    watch(
      () => [props.selectData?.xmlx, getUploadGroupFjIds().join('|')],
      () => {
        void refreshGroupTemplateMeta()
      },
      {
        immediate: true
      }
    )

    const insertEvent = () => {
      if (props.disabled) return
      isShowModal.value = true
    }

    return {
      closeHandle,
      emptyText,
      fileList,
      formatterData,
      getGroupFileList,
      handleDelete,
      handleDownload,
      handleGroupTemplateDownload,
      hasGroupTemplate,
      isGroupTemplateDownloading,
      insertEvent,
      isShowModal,
      loading,
      setTableRef,
      shouldShowGroupActions,
      uploadGroups,
      uploadHandle
    }
  }
})
</script>

<style lang="less" scoped>
.modal-container {
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.upload-group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-group-card {
  padding: 10px;
  border-radius: 4px;
  background-color: #fff;
}

.upload-group-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.upload-group-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.upload-group-type {
  flex: 1;
  min-width: 0;
  min-height: 34px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
}

.upload-group-label {
  flex-shrink: 0;
  margin-right: 12px;
  color: #606266;
}

.upload-group-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-primary);
  font-weight: 600;
}

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
      padding-right: 10px;
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

  .group-file-table {
    margin-bottom: 0;
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
