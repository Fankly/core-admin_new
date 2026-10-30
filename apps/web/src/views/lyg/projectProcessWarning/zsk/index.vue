<!-- 知识库维护 -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      @search="resetTable"
      @reset="resetTable"
      @row-click="handleClickRow"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="rangeId"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader="scope">
        <el-button v-permission="'ADD'" size="small" @click="handleBtn(scope.selectedList, 'ADD')" plain type="primary">新 增</el-button>
        <el-button
          v-permission="'EDIT'"
          :disabled="scope.selectedList.length !== 1"
          size="small"
          @click="handleBtn(scope.selectedList, 'EDIT')"
          plain
          type="primary"
          >编 辑</el-button
        >
        <el-button
          v-permission="'DELETE'"
          :disabled="scope.selectedList.length === 0"
          size="small"
          @click="handleBtn(scope.selectedList, 'DELETE')"
          plain
          type="primary"
          >删 除</el-button
        >
        <el-button
          :disabled="scope.selectedList.length == 0"
          @click="handleEarly(scope.selectedList, '1', '置顶')"
          plain
          v-permission="'CANCEL'"
          size="small"
          type="primary"
          >置 顶</el-button
        >
        <el-button
          :disabled="scope.selectedList.length == 0"
          @click="handleEarly(scope.selectedList, '2', '取消置顶')"
          plain
          v-permission="'CONFIRM'"
          size="small"
          type="primary"
        >
          取消置顶
        </el-button>
        <el-button
          :disabled="scope.selectedList.length == 0"
          @click="handleDownloads(scope.selectedList)"
          plain
          v-permission="'PLXZ'"
          size="small"
          type="primary"
        >
          批量下载
        </el-button>
      </template>
      <template #fileName="{ row }">
        <div style="color: #00706b; cursor: pointer" type="primary" :underline="false" @click="handleDownload(row)">{{ row.fileName }}</div>
      </template>
      <template #isTop="{ row }">
        {{ row.isTop === 1 ? '置顶' : '未置顶' }}
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <maintModal ref="rangeModalRef" @search-handle="searchHandle" />
</template>

<script setup lang="ts">
defineOptions({ name: "/lyg/projectProcessWarning/zsk/index" })
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, reactive, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ProTable from '@/components/ProTablePage/index.vue'
import maintModal from '@/views/lyg/projectProcessWarning/zsk/components/maintModal/index.vue'
import { knowledgeBasePage, knowledgeBaseRemove, knowledgeBaseDownload, knowledgeBaseTop, knowledgeBaseCancelTop } from '@/api/lyg/knowledgeBase'
import { apiExporFile } from '@/utils/export'
import { downloadAttach } from '@/api/sys/fileShare'
// ========== 类型定义 ==========

interface SelectedRow {
  rangeId: string
  proType: string
  [key: string]: any
}

type OperationType = 'ADD' | 'EDIT' | 'DELETE'

// ========== 响应式状态 ==========
const rangeModalRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)
const userInfo = ref<any>()
const importRef = ref()

// ========== 表格列配置 ==========
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { prop: 'rowNo', label: '序号', width: 80 },
  { prop: 'fileName', label: '文件名称', search: { el: 'input', order: 1 } },
  { prop: 'mainContent', label: '主要内容', search: { el: 'input', order: 2 } },
  { prop: 'isTop', label: '是否置顶', width: 100 }
])

// ========== 表格相关 ==========

const resetTable = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (params: any) => {
  loading.value = true
  return knowledgeBasePage(params)
}
// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

// ========== 文件下载 ==========
const handleDownload = async (row: any) => {
  if (!row.fileUuid) return ElMessage.warning('文件不存在，无法下载！')
  try {
    const uuid: any = row.fileUuid
    const kbId: any = row.kbId
    const fileName: any = `${row.fileName}`
    const params: any = {
      uuid: uuid,
      fileName: fileName
    }
    if (!uuid) return ElMessage.warning('文件未维护，请勿重复点击！')
    apiExporFile([kbId], fileName, knowledgeBaseDownload)
  } catch (e: any) {
    console.error(e.toString())
  }
}

const handleDownloads = async (selectedList: any) => {
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  try {
    const kbId: any = selectedList.map((item: any) => item.kbId)
    apiExporFile(kbId, `批量下载`, knowledgeBaseDownload)
  } catch (e: any) {
    console.error(e.toString())
  }
}

// ========== 操作按钮 ==========
//置顶/取消置顶
const handleEarly = async (selectedList: any, isTry: string, text: string) => {
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  const type = await VXETable.modal.confirm(`是否${text}，请确定！`, '提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return ElMessage.info('已取消')
  const kbId = selectedList.map(({ kbId }: any) => kbId)
  const api = isTry === '1' ? knowledgeBaseTop : knowledgeBaseCancelTop
  const res = await api(kbId)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success(`${text}成功！`)
  resetTable()
}

const handleBtn = async (selectedList: SelectedRow[], type: OperationType) => {
  if (type === 'EDIT' && selectedList.length !== 1) return ElMessage.warning('请选择一条数据！')
  if (type === 'DELETE' && selectedList.length === 0) return ElMessage.warning('请选择数据！')

  if (type === 'ADD' || type === 'EDIT') {
    const params = {
      searchParams: type === 'EDIT' ? { ...selectedList[0] } : {},
      type: type === 'ADD' ? '新增' : '编辑',
      specialorgid: userInfo.value.specialorgid,
      org_id: userInfo.value.org_id
    }
    rangeModalRef.value.acceptParams(params)
    return
  }
  // 删除操作
  const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', {
    status: 'warning'
  })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  const idList = selectedList.map((item) => item.kbId)
  const res = await knowledgeBaseRemove(idList)
  if (!res.success) return ElMessage.error(res.msg)
  resetTable()
}

const searchHandle = (val: any) => {
  if (!val) return
  resetTable()
}

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
