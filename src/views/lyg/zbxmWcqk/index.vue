<!-- 连云港资本性项目完成情况表 -->
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
      guide-module-key="id"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader="scope">
        <div class="header">
          <el-button v-permission="'ADD'" size="mini" @click="handleBtn(scope.selectedList, 'ADD')" plain type="primary">新 增</el-button>
          <el-button v-permission="'EDIT'" :disabled="scope.selectedList.length !== 1" size="mini" @click="handleBtn(scope.selectedList, 'EDIT')" plain type="primary">编 辑</el-button>
          <el-button v-permission="'DELETE'" :disabled="scope.selectedList.length === 0" size="mini" @click="handleBtn(scope.selectedList, 'DELETE')" plain type="primary">删 除</el-button>
          <el-button v-permission="'EXPORT'" size="mini" @click="handleExport" plain type="primary">导 出</el-button>
          <el-button v-permission="'IMPORT'" size="mini" @click="handleImport" plain type="primary">导 入</el-button>
        </div>
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <maintModal ref="rangeModalRef" @search-handle="searchHandle" />
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
</template>

<script setup lang="ts" name="/lyg/zbxmWcqk/index">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ProTable from '@/components/ProTablePage/index.vue'
import ImportExcel from '@/components/ImportExcel/indexZx.vue'
import maintModal from '@/views/lyg/zbxmWcqk/components/maintModal/index.vue'
import { zbxmWcqkPage, zbxmWcqkRemove, zbxmWcqkExportExcel, zbxmWcqkGetImportTemplate, zbxmWcqkImportExcel } from '@/api/lyg/zbxmWcqk'
import { getPublicData } from '@/api/common'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'

// ========== 类型定义 ==========
interface SelectedRow {
  id: string
  [key: string]: any
}

type OperationType = 'ADD' | 'EDIT' | 'DELETE'

// ========== 响应式状态 ==========
const rangeModalRef = ref()
const importRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)
const userInfo = ref<any>()
const exportParams = ref<any>({})

// ========== 表格列配置 ==========
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'zyear',
    label: '年度',
    width: 100,
    search: { el: 'date-picker', order: 1, props: { type: 'year', valueFormat: 'YYYY', clearable: true } }
  },
  {
    prop: 'zmonth',
    label: '月度',
    width: 80,
    search: { el: 'select', order: 2, props: { clearable: true } },
    enum: [
      { value: '1', name: '1' },
      { value: '2', name: '2' },
      { value: '3', name: '3' },
      { value: '4', name: '4' },
      { value: '5', name: '5' },
      { value: '6', name: '6' },
      { value: '7', name: '7' },
      { value: '8', name: '8' },
      { value: '9', name: '9' },
      { value: '10', name: '10' },
      { value: '11', name: '11' },
      { value: '12', name: '12' }
    ],
    fieldNames: { label: 'name', value: 'value' }
  },
  {
    prop: 'zcblx',
    label: '资本/成本类型',
    width: 150,
    search: { el: 'select', order: 2.5, props: { clearable: true } },
    enum: () => getPublicData('LYG_ZBXM_ZCBLX_COM'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'yjdwName',
    label: '一级单位',
    width: 150,
    render: ({ row }: any) => row.yjdwName || row.yjdw || '-'
  },
  {
    prop: 'ejdwName',
    label: '二级单位',
    width: 150,
    render: ({ row }: any) => row.ejdwName || row.ejdw || '-'
  },
  {
    prop: 'gkbmName',
    label: '归口部门',
    width: 150,
    render: ({ row }: any) => row.gkbmName || '-'
  },
  {
    prop: 'targetValue',
    label: '目标值（万元）',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => {
      if (typeof row.targetValue === 'undefined' || row.targetValue === null || row.targetValue === '') return '-'
      return formatNumValue(row.targetValue.toString(), 2)
    }
  },
  {
    prop: 'finishValue',
    label: '完成值（万元）',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => {
      if (typeof row.finishValue === 'undefined' || row.finishValue === null || row.finishValue === '') return '-'
      return formatNumValue(row.finishValue.toString(), 2)
    }
  }
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

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = async (params: any) => {
  loading.value = true
  exportParams.value = { ...params }
  try {
    return await zbxmWcqkPage({ ...params })
  } catch (e) {
    console.error(e)
    return { data: { list: [], total: 0 } }
  } finally {
    loading.value = false
  }
}

// ========== 导出 ==========
const handleExport = () => {
  const fileName = '资本性项目完成情况表'
  apiExportHandle({ ...exportParams.value }, fileName, zbxmWcqkExportExcel)
}

// ========== 导入 ==========
const handleImport = () => {
  const newParmas = { ...exportParams.value }
  importRef.value.fromData = { ...newParmas }
  const tempApi: any = zbxmWcqkGetImportTemplate
  const importApi: any = zbxmWcqkImportExcel
  if (!tempApi && !importApi) return
  const params = {
    tempApi: (importParams: any) => {
      const newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      const newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: '资本性项目完成情况表',
    specialorgid: userInfo.value?.specialorgid,
    getTableList: proTableRef.value?.getTableList
  }
  if (importRef.value) importRef.value.acceptParams(params)
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

  const ids = selectedList.map((item) => item.id)
  const res = await zbxmWcqkRemove(ids)
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
