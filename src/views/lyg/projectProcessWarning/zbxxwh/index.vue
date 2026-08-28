<!-- 招标信息维护 -->
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
        <el-button v-permission="'ADD'" size="mini" @click="handleBtn(scope.selectedList, 'ADD')" plain type="primary">新 增</el-button>
        <el-button
          v-permission="'EDIT'"
          :disabled="scope.selectedList.length !== 1"
          size="mini"
          @click="handleBtn(scope.selectedList, 'EDIT')"
          plain
          type="primary"
          >编 辑</el-button
        >
        <el-button
          v-permission="'DELETE'"
          :disabled="scope.selectedList.length === 0"
          size="mini"
          @click="handleBtn(scope.selectedList, 'DELETE')"
          plain
          type="primary"
          >删 除</el-button
        >
        <el-button @click="handleImport" v-permission="'IMPORT'" size="mini" type="primary">导 入</el-button>
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <maintModal ref="rangeModalRef" @search-handle="searchHandle" />
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
</template>

<script setup lang="ts" name="/lyg/projectProcessWarning/zbxxwh/index">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, reactive, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ProTable from '@/components/ProTablePage/index.vue'
import maintModal from '@/views/lyg/projectProcessWarning/zbxxwh/components/maintModal/index.vue'
import { getPublicData } from '@/api/common'
import { zbpcxxPage, zbpcxxRemove, zbpcxxImportExcel, zbpcxxGetImportTemplate } from '@/api/lyg/index'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件

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
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'nd',
    label: '年度',
    width: '120',
    search: { el: 'date-picker', order: 3, props: { type: 'year', valueFormat: 'YYYY', multiple: true, collapseTags: true } }
  },
  { prop: 'pcCode', label: '批次编码', width: '150', search: { el: 'input', order: 1 } },
  { prop: 'pcName', label: '批次名称', width: '300', search: { el: 'input', order: 2 } },
  {
    prop: 'pcType',
    label: '批次类型',
    width: '120',
    render: ({ row }: any) => {
      return row.pcTypeName
    }
  },
  {
    prop: 'jhsbjzsj',
    label: '计划申报截止时间',
    width: '150',
    search: { el: 'date-picker', order: 4, props: { type: 'date', valueFormat: 'YYYY-MM-DD', multiple: true, collapseTags: true } }
  },
  { prop: 'fbggsj', label: '发布公告时间', width: '150' },
  { prop: 'kbsj', label: '开标时间', width: '150' },
  { prop: 'dbsj', label: '定标时间', width: '150' }
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
  return zbpcxxPage(params)
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
// 导入
const handleImport = (type: any) => {
  let newParmas = {}
  importRef.value.fromData = { ...newParmas }
  let tempApi: any = zbpcxxGetImportTemplate
  let importApi: any = zbpcxxImportExcel
  if (!tempApi && !importApi) return
  let params = {
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: '招标信息维护',
    specialorgid: userInfo.value.deptId,
    getTableList: proTableRef.value?.getTableList
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

// ========== 操作按钮 ==========
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

  const idList = selectedList.map((item) => item.id)
  const res = await zbpcxxRemove(idList)
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
