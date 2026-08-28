<template>
  <div v-show="pageInfo.isShowPage" class="container">
    <Header
      :busiType="initParams.busiType"
      :showPage="pageInfo.isShowPage"
      @delete-data="deleteDataHandle"
      @addData="addOrEditDataHandle"
      @changeNd="changeNdHandle"
    ></Header>
    <div v-if="pageInfo.isShowPage" class="main-content">
      <TreeTable
        ref="treeTableRef"
        @main-table-data="mainTableDataHandle"
        @tree-table-change="treeTableChangeHandle"
        :initParams="initParams"
      ></TreeTable>
      <MainTable ref="mainTableRef" :main-table-data="mainTableData" :initParams="initParams"></MainTable>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <FormDialog
    @clear-data="clearDataHandle"
    :editData="editData"
    :operationFlag="operationFlag"
    @updateTable="updateTableHandle"
    :treeParams="treeParams"
    :dialogData="dialogData"
    ref="formDialogRef"
    :initParams="initParams"
  ></FormDialog>
</template>

<script lang="ts">
export default {
  name: '/statistics/budgetStatisticsConfig'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import Header from '@/views/statistics/components/Header.vue'
import TreeTable from '@/views/statistics/components/TreeTable.vue'
import MainTable from '@/views/statistics/components/MainTable.vue'
import FormDialog from '@/views/statistics/components/FormDialog.vue'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { batchDeleteConfig } from '@/api/statistics/budgetStatisticsConfig'
import { VXETable } from 'vxe-table'

export type InitParams = {
  nd: string
  busiType: string
}

const userDialogRef = ref()
const formDialogRef = ref()
const treeTableRef = ref()
const mainTableRef = ref()
const operationFlag = ref('')
const userInfo = ref<any>()

const treeParams = ref<any>(null)
const mainTableData = ref<any>([])

const editData = ref('')

const dialogData = reactive({
  title: ''
})

const pageInfo = reactive({
  isShowPage: false
})

const initParams = reactive<InitParams>({
  nd: '',
  busiType: 'YSZXYL'
})

const deleteDataHandle = async () => {
  const $table = mainTableRef.value.mainTableRef
  if ($table) {
    const records = $table.getCheckboxRecords()
    if (records.length === 0) {
      ElMessage.warning('请选择一条数据进行删除！')
      return
    }
    let index = records.findIndex((item: any) => item.recState === '1')

    if (index !== -1) {
      ElMessage.warning('存在启用状态的数据,无法删除！')
      return
    }
    const configIds = records.map((item: any) => item.configId).join(',')
    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      mainTableRef.value.mainLoading = true
      let res = await batchDeleteConfig(configIds)
      if (res.success) {
        ElMessage.success('删除成功！')
        await updateTableHandle()
        mainTableRef.value.mainLoading = false
        // 更新数据
      } else {
        ElMessage.error(res.msg)
        mainTableRef.value.mainLoading = false
      }
    }
  }
}

// 新增
const addOrEditDataHandle = (flag: string) => {
  sessionStorage.setItem('GkBmYsZxFx', 'YsZxFx')
  dialogData.title = flag === 'ADD' ? '新增-预算统计配置' : '编辑-预算统计配置'
  if (flag === 'EDIT') {
    const $table = mainTableRef.value.mainTableRef
    if ($table) {
      const records = $table.getCheckboxRecords()
      if (records.length !== 1) {
        ElMessage.warning('请选择一条数据进行修改！')
        return
      }
      editData.value = records[0]
    }
  }
  operationFlag.value = flag
  formDialogRef.value.showModal = true
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  if (isQuery) {
    pageInfo.isShowPage = true
  }
}

const changeNdHandle = async (val: string) => {
  initParams.nd = val
  treeParams.value = null
  const $table = treeTableRef.value
  if ($table) {
    $table.expandData()
    // 更新右边数据
    await $table.getTableData(val)
  }
}

const treeTableChangeHandle = (val: any) => {
  treeParams.value = val
}

const mainTableDataHandle = (val: any[]) => {
  mainTableRef.value.mainLoading = true
  mainTableData.value = val
  mainTableRef.value.mainLoading = false
}

const updateTableHandle = async () => {
  // 更新树形表格和右边表格
  const $table = treeTableRef.value
  if ($table) {
    const $treeTable = $table.treeRef
    let curData = $treeTable.getCurrentRecord()
    await treeTableRef.value.getTreeTable()
    let dataList = treeTableRef.value.treeData
    let selectId = curData.id
    await expandAndSelectNode(dataList, selectId, $treeTable)
    // 更新右边数据
    await $table.getTableData(selectId)
  }
}

const findPath = (data: any[], targetId: string, path: any[] = []) => {
  for (const item of data) {
    if (item.id === targetId) {
      return [...path, item]
    }
    if (item.children && item.children.length) {
      const found: any = findPath(item.children, targetId, [...path, item])
      if (found) return found
    }
  }
  return null
}

const expandAndSelectNode = async (dataList: any[], targetId: string, treeTableRef: any) => {
  const path = findPath(dataList, targetId)
  if (path) {
    path.forEach((node: any) => {
      treeTableRef.setTreeExpand(node, true)
    })
    await nextTick()
    const targetNode = path[path.length - 1]
    treeTableRef.setCurrentRow(targetNode)
  }
}

const clearDataHandle = () => {
  editData.value = ''
}

const initData = () => {
  userDialogRef.value.getUser()
}

onMounted(initData)
</script>

<style scoped lang="less">
.container {
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-width: 660px;

  .main-content {
    flex: 1;
    box-sizing: border-box;
    height: 100%;
    display: flex;
    min-height: 0;
    overflow: hidden;
    position: relative;
    min-width: 0;
  }
}
</style>
