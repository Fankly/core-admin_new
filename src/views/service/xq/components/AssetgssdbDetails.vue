<template>
  <div class="container" ref="containerRef" v-loading="loading">
    <el-collapse v-model="activeNames">
      <el-collapse-item name="estimate" title="物料资成本属性对比">
        <template #title>
          <div>
            <i class="el-icon-s-grid elIconFile"></i>
            <span>物料资成本属性对比</span>
            <el-tag
              :type="statusWl?.code == '3' ? 'success' : statusWl?.code == '2' ? 'warning' : 'info'"
              effect="plain"
              size="small"
              class="spna_tab"
            >
              <span :class="statusWl?.code == '2' ? 'loading-text' : ''">{{ statusWl?.name }}</span>
            </el-tag>
          </div>
        </template>
        <div class="amount">
          <el-tooltip content="刷新" placement="top" effect="light">
            <span class="toolbar-action-icon" style="cursor: pointer; font-size: 18px" @click="refresh">
              <i class="el-icon-refresh"></i>
            </span>
          </el-tooltip>
        </div>
        <div class="table" :style="{ height: itemHeight + 'px' }">
          <vxe-table
            :data="project"
            stripe
            :column-config="{
              resizable: true
            }"
            :row-config="{ height: 32 }"
            show-header-overflow
            show-overflow
            border
            align="center"
            header-align="center"
            height="100%"
            :cell-style="rowStyle"
          >
            <vxe-column width="50" type="seq" title="序号" />
            <vxe-column min-width="150" field="wlbm" title="估算书中物资编码" />
            <vxe-column min-width="300" field="wlmc" title="估算书中物料名称" />
            <vxe-column min-width="300" field="sjly" title="数据来源" />
            <vxe-column min-width="150" field="sourceDirCode" title="Ⅲ级目录编码" />
            <vxe-column min-width="200" field="sourceDirDesc" title="同源目录对应名称" />
          </vxe-table>
        </div>
      </el-collapse-item>
    </el-collapse>
    <div class="upload-header">
      <div class="upload-title"><i class="el-icon-s-grid elIconFile"></i>物料资成本属性对比问题说明</div>
      <el-button v-if="opType == 'EDIT'" size="mini" plain type="primary" @click="uploadHandle"> 上 传 </el-button>
    </div>
    <vxe-table
      :row-config="{
        height: 32
      }"
      :show-overflow="true"
      ref="tableRef"
      :data="fileList"
      :height="fileList.length * 40"
      stripe
      border
      class="file-table"
      v-show="fileList.length > 0"
    >
      <vxe-column width="50" type="seq" title="序号" />
      <vxe-column field="name" title="附件名称" min-width="200">
        <template #default="{ row }">
          <div class="file-name">
            <i class="el-icon-document" />
            <span>{{ row.name }}</span>
          </div>
        </template>
      </vxe-column>
      <vxe-column title="操作" width="180" align="center">
        <template #default="{ row }">
          <div class="file-actions">
            <el-button type="text" @click="handleDownload(row)"> <i class="el-icon-download"></i> 下载 </el-button>
            <el-button v-if="opType == 'EDIT'" type="text" @click="handleDelete(row)"> <i class="el-icon-delete"></i> 删除 </el-button>
          </div>
        </template>
      </vxe-column>
    </vxe-table>
    <div v-show="fileList.length === 0" class="empty-files" style="padding: 20px 0; cursor: pointer" @click="uploadHandle">
      <i class="el-icon-upload" style="font-size: 40px"></i>
      <p>暂无文件，请点击添加文件</p>
    </div>
    <div class="file-group" v-for="(item, index) in otherList" :key="index">
      <div class="project-file-type">
        <i class="el-icon-document elIconFile"></i>
        <span>{{ item.name }}</span>
        <el-tag
          v-if="item.name == '估算书'"
          :type="statusGss?.code == '3' ? 'success' : statusGss?.code == '4' ? 'error' : statusGss?.code == '2' ? 'warning' : 'info'"
          effect="plain"
          size="small"
          class="spna_tab"
        >
          <span :class="statusGss?.code == '2' ? 'loading-text' : ''">{{ statusGss?.name }}</span>
        </el-tag>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px" v-if="item.list.length > 0">
        <div class="file-list" v-for="(item2, index2) in item.list" :key="index2">
          <div class="file-name" @click="handleDownload(item2)">
            <i class="el-icon-paperclip"></i>
            {{ item2.name }}
          </div>
        </div>
      </div>
      <div v-else class="empty-files">
        <p>{{ `暂无${item.name}` }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AssetgssdbDetails">
import { onMounted, ref, nextTick, watch, onUnmounted } from 'vue'
import { getMatAttrComp, getFjListByXmIdAndFjId, downloadAttach, getTymlywj, getWlzcbById } from '@/api/service/requirement'
import { ElMessage } from 'element-plus'
import { getPublicCodeMap } from '@/utils/tableFormatter'
import VXETable from 'vxe-table'
import baseService from '@/service/baseService'

interface Props {
  selectData: any
  globalParams: any
  opType: string
}

type Names = 'accessories' | 'unpriced' | 'estimate'
const loading = ref(false)
const project = ref([])
const fileList = ref<any[]>([])
const tableRef = ref()
const containerRef = ref<any>()
const containerHeight = ref(800)
const fourceUpdateKey = ref(0)
const itemHeight = ref(240)
const typesList = ref<any[]>([])
const statusWl = ref<any>()
const statusGss = ref<any>()
const otherList = ref<any[]>([
  {
    name: '估算书',
    list: []
  },
  {
    name: '同源目录源文件',
    list: []
  }
])

const activeNames = ref<Names[]>(['accessories', 'unpriced', 'estimate'])

// 默认值
const props = withDefaults(defineProps<Props>(), {
  selectData: null,
  globalParams: null,
  opType: 'EDIT'
})

const uploadHandle = async () => {
  try {
    const $table = tableRef.value
    const { files } = await $table.readFile({ multiple: false })
    console.log(files, 'files')
    const formData = new FormData()
    let fileName = ''
    const ns = files[0].name.split('.')
    const type = ns[ns.length - 1].toLowerCase()
    fileName = files[0].name
    if (typesList.value.length > 0) {
      if (!typesList.value.includes(type)) return ElMessage.warning('文件只支持' + typesList.value.join(',') + '格式！')
    }
    formData.append('files', files[0])
    formData.append('fileNames', fileName)
    const apiUrl = props.globalParams.ID
      ? `/xmAttributeConfig/uploadAttach?xmId=${props.globalParams.ID}&fjId=${40}`
      : `/xmAttributeConfig/uploadAttach?fjId=${40}`
    loading.value = true
    const res = await baseService.post(apiUrl, formData)
    if (!res.success) return ElMessage.error(res.msg)
    // 刷新页面,调用查询接口
    ElMessage.success('附件上传成功')
    await getWlFileList()
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
  return
}

const hasAttachmentId = (row: any) => {
  return row.id !== undefined && row.id !== null && row.id !== ''
}
// 下载文件
const handleDownload = async (row: any) => {
  if (!row.uuid) return ElMessage.warning('附件缺少下载标识')
  try {
    const blob: any = await downloadAttach(row.uuid)
    const dom = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    const filename = row.name
    dom.href = url
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}
// 删除文件
const handleDelete = async (row: any) => {
  if (!hasAttachmentId(row)) {
    ElMessage.warning('附件缺少删除标识')
    return
  }
  const apiUrl = props.globalParams.ID
    ? `/xmAttributeConfig/deleteAttach?xmId=${props.globalParams.ID}&uuid=${row.uuid}`
    : `/xmAttributeConfig/deleteAttach?uuid=${row.uuid}`

  const type = await VXETable.modal.confirm('确认是否删除？', '温馨提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return
  try {
    loading.value = true
    const res = await baseService.post(apiUrl)
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('删除成功')
    await getWlFileList()
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

// 调用接口
const getTableData = async () => {
  try {
    if (props.globalParams) {
      await getPublicCodeMap([
        'PMS_SF_COM',
        'PROCLASSIFICATION_COM',
        'EQUIPTYPE_COM',
        'VOLTAGELEVEL_COM',
        'PRJLIBRARY_COM',
        'ASTEQUIPTYPE_COM',
        'EQUIPSTATUS_COM'
      ])
      await getRefreshData()
      await getWlFileList()
      await otherFIle()
    }
  } catch (error) {
    const sjly = error as Error
    ElMessage.error(sjly.message)
  }
}

const refresh = async () => {
  await getRefreshData()
  await otherFIle()
}

const getRefreshData = async () => {
  loading.value = true
  const record = await getMatAttrComp(props.globalParams.ID)
  loading.value = false
  if (record.success) {
    const data = record.data
    const status = data.status
    project.value = data.data || []
    statusWl.value = status.matJudgStatus
    statusGss.value = status.preStatus
  }
}

const getWlFileList = async () => {
  try {
    const res = await getFjListByXmIdAndFjId(props.globalParams.ID, '40')
    if (!res.success) throw new Error(res.msg)
    fileList.value = res.data
  } catch (error) {
    const sjly = error as Error
    ElMessage.error(sjly.message)
  }
}

const otherFIle = async () => {
  const gss = await getFjListByXmIdAndFjId(props.globalParams.ID, '38')
  if (!gss.success) throw new Error(gss.msg)
  otherList.value[0].list = gss.data
  const fileTyml = await getTymlywj()
  if (!fileTyml.success) throw new Error(fileTyml.msg)
  otherList.value[1].list = fileTyml.data
  const fileType = await getWlzcbById(props.globalParams.PRO_TYPE)
  if (!fileType.success) throw new Error(fileType.msg)
  typesList.value = fileType.data
}

const rowStyle = ({ row }: any) => {
  if (row?.isAssetLevelEquipment == '1') {
    return {
      color: 'red',
      fontWeight: 'bold'
    }
  }
}

// 计算高度
const calculateItemHeight = () => {
  const totalExpandedItems = activeNames.value.length
  if (totalExpandedItems === 0) {
    itemHeight.value = 0
    return
  }

  if (containerRef.value) {
    const actualHeight = containerRef.value.clientHeight - 50
    containerHeight.value = actualHeight
  }

  const headerHeight = 2 * 50
  const availableHeight = containerHeight.value - headerHeight
  itemHeight.value = availableHeight / totalExpandedItems
}

// 监听activeNames变化,重新计算高度
watch(
  activeNames,
  () => {
    nextTick(() => {
      calculateItemHeight()
      fourceUpdateKey.value++
    })
  },
  {
    deep: true
  }
)

const initData = () => {
  getTableData()
}

onMounted(() => {
  initData()
  calculateItemHeight()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  nextTick(() => {
    calculateItemHeight()
  })
}
// 自定义组件标识
const ISCUSTOMCOPONENT = true
// 获取表格中数据-自定义组件必须实现方法
const getFormData = () => {
  return {
    assetYfZwjxInfos: []
  }
}

defineExpose({
  getFormData,
  ISCUSTOMCOPONENT,
  uploadHandle,
  refresh
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  :deep(.el-collapse-item) {
    position: relative;
  }
  :deep(.el-collapse-item__header) {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-primary, #409eff);
  }

  :deep(.amount) {
    color: var(--color-primary, #409eff);
    font-weight: 600;
    position: absolute;
    right: 50px;
    top: 12px;
  }

  :deep(.vxe-header--column .vxe-cell--title) {
    white-space: pre-line;
    font-weight: bold;
  }
}
.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 10px 16px 0;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
  .upload-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-primary, #409eff);
  }
}
.empty-files {
  padding: 30px 0;
  text-align: center;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.file-group {
  margin: 10px 0;
}
.project-file-type {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
  color: var(--color-primary, #409eff);
}
.file-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 8px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
  &:hover {
    background-color: #ecf5ff;
    border-color: #b3d8ff;
    color: var(--color-primary, #00857c);
    .file-action {
      opacity: 1;
    }
  }
  .file-name {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    margin-right: 10px;
    i {
      font-size: 14px;
      color: #909399;
    }
  }
  .file-action {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-primary, #00857c);
    opacity: 0.8;
    i {
      font-size: 14px;
    }
  }
}
.elIconFile {
  color: var(--color-primary, #00857c);
  font-size: 16px;
  margin-right: 8px;
}
.spna_tab {
  margin-left: 10px;
}

.loading-text::after {
  content: '';
  animation: ellipsis-loop 1.5s steps(4, end) infinite;
}

@keyframes ellipsis-loop {
  0% {
    content: '';
  }
  25% {
    content: '.';
  }
  50% {
    content: '..';
  }
  75% {
    content: '...';
  }
}
</style>
