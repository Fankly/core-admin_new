<template>
  <vxe-modal
    @show="showHandle"
    :destroy-on-close="true"
    @close="closeHandle"
    :loading="loading"
    :title="title"
    v-model="showModal"
    width="50%"
    height="500"
    show-zoom
    resize
  >
    <div class="opeartion" v-if="toolButton">
      <el-button type="primary" v-if="showToolButton('sigle')" plain size="mini" @click="insertEvent(false)">选择文件</el-button>
      <el-button type="primary" v-if="showToolButton('multiple')" plain size="mini" @click="insertEvent(true)">上传文件</el-button>
      <el-button type="primary" v-if="showToolButton('delete')" plain size="mini" @click="removeSelectEvent">删除文件</el-button>
      <el-button type="primary" v-if="showToolButton('save')" plain size="mini" @click="getInsertEvent">保 存</el-button>
      <el-button type="primary" v-if="showToolButton('download')" plain size="mini" @click="downloadHandle">下 载</el-button>
      <slot name="operation"></slot>
    </div>
    <div class="table">
      <vxe-table
        align="center"
        :border="true"
        :column-config="{ resizable: true }"
        show-overflow
        ref="tableRef"
        height="100%"
        :data="fileUpload.data"
      >
        <vxe-column type="checkbox" width="60" v-if="toolButton"></vxe-column>
        <vxe-column type="seq" title="序号" width="60"></vxe-column>
        <vxe-column title="文件名称" field="fjmc" min-width="180">
          <template #default="{ row }">
            <vxe-button mode="text" status="primary" @click="downloadHandle(row.uuid)">{{ row.fjmc }} </vxe-button>
          </template>
        </vxe-column>
        <vxe-column title="文件大小" field="filesize"></vxe-column>
        <vxe-column :formatter="formatterHandle" title="上传日期" field="instime"></vxe-column>
      </vxe-table>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="FileUpload">
import { deleteAttachByUUID, downloadAttach, getAttachList, uploadAttachBatch } from '@/api/fy/common'
import { ElMessage } from 'element-plus'
import { reactive, ref, withDefaults, defineProps, defineEmits, defineExpose, toRef } from 'vue'
import { VXETable } from 'vxe-table'
import XEUtils from 'xe-utils'

export interface Props {
  isShowModal: boolean
  kmlx: string
  nd: string
  busiId: string
  specialorgid: string
  toolButton?: ('save' | 'sigle' | 'multiple' | 'delete' | 'download')[] | boolean // 是否显示
  title: string
}

interface RowVO {
  fjmc: string
  filesize: string
  instime: string
  file: any
}

const props = withDefaults(defineProps<Props>(), {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  toolButton: true,
  busiId: '',
  title: '文件上传'
})

const showModal = toRef(props, 'isShowModal')

const emit = defineEmits(['close', 'show'])

const tableRef = ref()

const loading = ref(false)
const fileUpload = reactive({
  data: []
})

const formatterHandle = ({ cellValue, column }: any) => {
  if (column.field === 'instime') {
    return XEUtils.toDateString(new Date(cellValue))
  }
  return cellValue ? cellValue : ''
}

const insertEvent = async (isMultiple: boolean) => {
  const $table = tableRef.value
  if ($table) {
    const types = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'zip']
    const { files } = await $table.readFile({ multiple: isMultiple })
    try {
      const records: RowVO[] = Array.from(files).map((file: any) => {
        const ns = file.name.split('.')
        const name = ns.slice(0, ns.length - 1).join('')
        const type = ns[ns.length - 1].toLowerCase()
        if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
        let fileSize = (file.size / 1024 / 1024).toFixed(3) + 'MB'
        if (file.size / 1024 / 1024 > 50) throw new Error('上传文件大小不能超过 50MB!')
        return {
          fjmc: file.name,
          filesize: fileSize,
          instime: XEUtils.toDateString(new Date()),
          file: file
        }
      })
      if (!props.busiId) return
      // doc/xls/pdf/zip/xlsx/docx
      $table.insert(records)
      getInsertEvent()
    } catch (error: any) {
      ElMessage.error(error.message)
    }
  }
}

const removeSelectEvent = async () => {
  const $table = tableRef.value
  if ($table) {
    const selectRecords = $table.getCheckboxRecords()
    if (selectRecords.length === 0) {
      ElMessage.warning('请选择数据,再进行操作！')
      return
    }
    const type = await VXETable.modal.confirm('您确定要删除吗？')
    if (type === 'confirm') {
      let uuids = selectRecords.filter((item: any) => item.uuid).map((item: any) => item.uuid)
      $table.removeCheckboxRow()
      let res = await deleteAttachByUUID(uuids)
      if (res.success) {
        ElMessage.success('删除成功')
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const showToolButton = (key: 'save' | 'sigle' | 'multiple' | 'delete' | 'download') => {
  return Array.isArray(props.toolButton) ? props.toolButton.includes(key) : props.toolButton
}

const closeHandle = () => {
  emit('close', !props.isShowModal)
}

const showHandle = () => {
  getFileList()
  emit('show')
}

const getFileList = async () => {
  fileUpload.data.length = 0
  if (!props.busiId) return
  let res = await getAttachList(props.busiId)
  fileUpload.data = res.data
}

const getInsertEvent = async () => {
  const $table = tableRef.value
  if ($table) {
    const insertRecords = $table.getInsertRecords()
    const data = new FormData()
    for (const record of insertRecords) {
      data.append('files', record.file)
      data.append('fileNames', record.fjmc)
    }
    let api = uploadAttachBatch
    if (!api) return
    try {
      if ($table) {
        let tableData = await api(props.busiId, data)
        if (tableData.success) {
          ElMessage.success('上传成功')
          getFileList()
        } else {
          ElMessage.error(tableData.msg)
        }
      }
      loading.value = false
    } catch (error) {
      loading.value = false
    }
  }
}
const downloadHandle = async (uuid?: string) => {
  loading.value = true
  let res = await downloadAttach(uuid as string)
  let dom = document.createElement('a')
  let url = window.URL.createObjectURL(res)
  dom.href = url
  // 获取文件名
  let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
  dom.download = `${decodeURI(decodeURI(filename))}`
  document.body.appendChild(dom)
  dom.click()
  document.body.removeChild(dom)
  window.URL.revokeObjectURL(url)
  loading.value = false
}

defineExpose({
  ...fileUpload.data
})
</script>

<style scoped lang="less">
.opeartion {
  height: 38px;
}

.table {
  height: calc(100% - 38px);
}
</style>
