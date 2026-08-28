<!-- 市归口部门与项目类型对应关系配置 -->
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
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <maintModal ref="rangeModalRef" @search-handle="searchHandle" />
</template>

<script setup lang="ts" name="/lyg/projectProcessWarning/proTypeGkbm/index">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ProTable from '@/components/ProTablePage/index.vue'
import maintModal from '@/views/lyg/projectProcessWarning/proTypeGkbm/components/maintModal/index.vue'
import { configPage, configRemove } from '@/api/lyg/index'

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

// ========== 表格列配置 ==========
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'yjdwName', label: '单位' },
  { prop: 'bmName', label: '市归口部门' },
  { prop: 'protypeNameList', label: '项目类型' }
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
  return configPage(params)
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

  const bmIdList = selectedList.map((item) => item.bmId)
  const res = await configRemove(bmIdList)
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
