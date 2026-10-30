<!-- 预计完成数填报任务分发 -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      @search="resetTable"
      @reset="resetTable"
      @row-click="handleClickRow"
      :cell-style="tableCellStyle"
      @cell-click="handleCellClick"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader="scope">
        <el-button v-permission="'ADD'" size="small" @click="handleBtn('ADD', scope.selectedList)" plain type="primary">新 增</el-button>
        <el-button
          v-permission="'EDIT'"
          :disabled="scope.selectedList.length != 1 || isPublished(scope.selectedList[0])"
          size="small"
          @click="handleBtn('EDIT', scope.selectedList)"
          plain
          type="primary"
          >编 辑</el-button
        >
        <el-button
          v-permission="'DELETE'"
          :disabled="scope.selectedList.length == 0 || scope.selectedList.some(isPublished)"
          size="small"
          @click="handleDelete(scope.selectedList)"
          type="danger"
          plain
          >删 除</el-button
        >
        <el-button
          v-permission="'PUBLISH'"
          :disabled="scope.selectedList.length != 1 || isPublished(scope.selectedList[0])"
          size="small"
          @click="handlePublish(scope.selectedList)"
          plain
          type="primary"
          >任务发布</el-button
        >
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <maintModal ref="maintModalRef" @search-handle="searchHandle" @open-xm-detail="handleOpenXmDetail" />
  <xmDetailModal ref="xmDetailModalRef" />
</template>

<script setup lang="ts">
defineOptions({ name: "/lyg/finishXm/yjwcstbrwff/index" })
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, reactive, h, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ProTable from '@/components/ProTablesource/index.vue'
import maintModal from '@/views/lyg/finishXm/yjwcstbrwff/components/maintModal/index.vue'
import xmDetailModal from '@/views/lyg/finishXm/components/xmDetailModal/index.vue'
import { finishXmPage, finishXmPublish, finishXmDelete } from '@/api/lyg/finishXm'

type OperationType = 'ADD' | 'EDIT'

// ========== 响应式状态 ==========
const maintModalRef = ref()
const xmDetailModalRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)
const userInfo = ref<any>()
const exportParams = ref<any>({})
const router = useRouter()

// ========== 表格列配置 ==========
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { prop: 'xh', label: '序号', width: 50, align: 'center' },
  {
    prop: 'nd',
    label: '年度',
    width: 100,
    search: {
      el: 'date-picker',
      order: 1,
      defaultValue: new Date().getFullYear().toString(),
      props: { type: 'year', valueFormat: 'YYYY', clearable: true }
    }
  },
  {
    prop: 'rwName',
    label: '任务名称',
    minWidth: 200,
    showOverflowTooltip: true,
    search: { el: 'input', order: 2 }
  },
  { prop: 'fbrq', label: '发布日期', width: 150 },
  { prop: 'xmSl', label: '项目数量', width: 110 },
  { prop: 'ytbXmSl', label: '应填报项目数', width: 130 },
  { prop: 'ytbDoneXmSl', label: '已填报项目数', width: 130 },
  { prop: 'lcSl', label: '流程数量', width: 110 },
  { prop: 'ywcLcSl', label: '已完成流程数', width: 130 }
])

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element?.toggleRowSelection(row)
  })
}

const tableCellStyle = ({ row, column }: any) => {
  if (column.label == '应填报项目数' || column.label == '任务名称') {
    return 'color:#00706b;cursor: pointer;'
  }
}
const handleCellClick = (row: any, column: any) => {
  if (column.label == '应填报项目数') {
    handleOpenXmDetail(row)
  } else if (column.label == '任务名称') {
    handleOpenTjReport(row)
  }
}
const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = async (params: any) => {
  loading.value = true
  exportParams.value = { ...params }
  try {
    return await finishXmPage({ ...params })
  } catch (e) {
    console.error(e)
    return { data: { records: [], total: 0 } }
  } finally {
    loading.value = false
  }
}

// ========== 应填报项目明细 ==========
const handleOpenXmDetail = (row: any) => {
  xmDetailModalRef.value?.acceptParams({
    name: '应填报预计完成数项目明细',
    nd: row.nd,
    rwName: row.rwName
  })
}

// ========== 跳转填报统计表 ==========
/** 携带当前年度与任务信息跳转项目预计完成数填报统计表 */
const handleOpenTjReport = (row: any) => {
  router.push({
    name: '/lyg/finishXm/xmyjwcstbtjb/index',
    params: {
      nd: row.nd,
      rwId: row.id,
      rwName: row.rwName,
      roleId: userInfo.value.role_id,
      roleCode: userInfo.value.code,
      dwId: userInfo.value.org_id,
      specialorgid: userInfo.value.specialorgid,
      spRoleId: userInfo.value.id,
      userInfo: JSON.stringify({ ...userInfo.value })
    }
  })
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
    } else {
      ElMessage.warning('无权限访问')
    }
  } catch (e) {
    console.error(e)
  }
}

// ========== 操作按钮 ==========
/** 发布日期非空即视为已发布，禁止编辑、删除、任务发布 */
const isPublished = (row: any) => !!row?.fbrq

const handleBtn = (type: OperationType, selectedList: any) => {
  if (type === 'EDIT' && selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  const selectedData = selectedList[0]
  if (type === 'EDIT' && isPublished(selectedData)) return ElMessage.warning('已发布的任务不能编辑！')
  const params = {
    searchParams: type === 'ADD' ? { nd: exportParams.value.nd } : { ...selectedData },
    type: type === 'ADD' ? '新增' : '编辑',
    specialorgid: userInfo.value?.specialorgid,
    org_id: userInfo.value?.org_id
  }
  maintModalRef.value.acceptParams(params)
}

// ========== 删除 ==========
const handleDelete = async (selectedList: any) => {
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  if (selectedList.some(isPublished)) return ElMessage.warning('已发布的任务不能删除！')
  const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', {
    status: 'warning'
  })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  loading.value = true
  try {
    const ids = selectedList.map(({ id }: any) => id)
    const res = await finishXmDelete(ids)
    if (!res.success) return ElMessage.error(res.msg)
    ElMessage.success('删除成功！')
    resetTable()
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

// ========== 任务发布 ==========
const handlePublish = async (selectedList: any) => {
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  if (isPublished(selectedList[0])) return ElMessage.warning('已发布的任务不能重复发布！')
  const confirmResult = await VXETable.modal.confirm('发布后任务将下发给项目负责人，请确定！', '提示', {
    status: 'warning'
  })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  loading.value = true
  try {
    const rwId = selectedList[0].id || ''
    const res = await finishXmPublish({ rwId: rwId })
    if (!res.success) return ElMessage.error(res.msg)
    ElMessage.success('发布成功！')
    resetTable()
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
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
