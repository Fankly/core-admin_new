<template>
  <div v-show="pageInfo.isShowPage" class="container">
    <ConfigHeader
      :busiType="initParams.busiType"
      :showPage="pageInfo.isShowPage"
      @delete-data="deleteDataHandle"
      @addData="addOrEditDataHandle"
      @changeNd="changeNdHandle"
      @changeBusiType="changeBusiTypeHandle"
      @indicator-relation="indicatorRelationHandle"
    ></ConfigHeader>
    <div v-if="pageInfo.isShowPage" class="main-content">
      <div class="pane-body pane-body--tree">
        <TreeTable
          ref="treeTableRef"
          @main-table-data="mainTableDataHandle"
          @tree-table-change="treeTableChangeHandle"
          :auto-load-on-mount="false"
          :initParams="initParams"
        ></TreeTable>
      </div>
      <div class="pane-body pane-body--table">
        <div v-if="!initParams.busiType" class="inline-tip">选择展示维度后可查看配置节点和明细数据。</div>
        <div class="pane-table">
          <MainTable
            ref="mainTableRef"
            :main-table-data="mainTableData"
            :initParams="initParams"
            :show-execution-fields="true"
            :click-row-select="true"
          ></MainTable>
        </div>
      </div>
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
    :show-execution-fields="true"
  ></FormDialog>
  <IndicatorRelationDialog ref="indicatorRelationDialogRef" :busiType="initParams.busiType" />
</template>

<script lang="ts">
export default {
  name: '/statistics/budgetExecutionAnalysis/budgetStatisticsConfig'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import ConfigHeader from '@/views/statistics/budgetExecutionAnalysis/components/ConfigHeader.vue'
import IndicatorRelationDialog from '@/views/statistics/budgetExecutionAnalysis/components/IndicatorRelationDialog.vue'
import TreeTable from '@/views/statistics/components/TreeTable.vue'
import MainTable from '@/views/statistics/components/MainTable.vue'
import FormDialog from '@/views/statistics/components/FormDialog.vue'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { batchDeleteConfig } from '@/api/statistics/budgetStatisticsConfig'
import { VXETable } from 'vxe-table'
import { createLatestRequestTracker } from '@/views/statistics/budgetExecutionAnalysis/viewHelpers'

export type InitParams = {
  nd: string
  busiType: string
}

const userDialogRef = ref()
const formDialogRef = ref()
const indicatorRelationDialogRef = ref()
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
const refreshRequestTracker = createLatestRequestTracker()

const initParams = reactive<InitParams>({
  nd: '',
  busiType: ''
})

const setMainTableLoading = (loading: boolean) => {
  if (mainTableRef.value) {
    mainTableRef.value.mainLoading = loading
  }
}

const clearConfigViewState = () => {
  treeParams.value = null
  mainTableData.value = []
  if (treeTableRef.value?.clearTreeData) {
    treeTableRef.value.clearTreeData()
  }
  setMainTableLoading(false)
}

const deleteDataHandle = async () => {
  if (!initParams.busiType) return
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
      setMainTableLoading(true)
      try {
        let res = await batchDeleteConfig(configIds)
        if (res.success) {
          ElMessage.success('删除成功！')
          await updateTableHandle()
          return
        }
        ElMessage.error(res.msg)
      } catch {
        ElMessage.error('删除失败，请稍后重试')
      } finally {
        setMainTableLoading(false)
      }
    }
  }
}

// 新增
const addOrEditDataHandle = (flag: string) => {
  if (!initParams.busiType) return
  sessionStorage.setItem('GkBmYsZxFx', 'YsZxFx')
  dialogData.title = flag === 'ADD' ? '新增-预算执行分析配置' : '编辑-预算执行分析配置'
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
  } else {
    editData.value = ''
  }
  operationFlag.value = flag
  formDialogRef.value.showModal = true
}

const indicatorRelationHandle = () => {
  if (!initParams.busiType) return
  if (indicatorRelationDialogRef.value) {
    indicatorRelationDialogRef.value.showModal = true
  }
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  if (isQuery) {
    pageInfo.isShowPage = true
  }
}

const refreshTreeAndTable = async () => {
  const requestToken = refreshRequestTracker.issue()
  const $table = treeTableRef.value
  if (!initParams.nd || !initParams.busiType) {
    clearConfigViewState()
    return
  }
  if (!$table) return
  treeParams.value = null
  await $table.getTreeTable()
  if (!refreshRequestTracker.isLatest(requestToken)) return
  await $table.getTableData(initParams.nd)
}

const changeNdHandle = async (val: string) => {
  initParams.nd = val || ''
  await refreshTreeAndTable()
}

const changeBusiTypeHandle = async (val: string) => {
  initParams.busiType = val || ''
  await refreshTreeAndTable()
}

const treeTableChangeHandle = (val: any) => {
  treeParams.value = val
}

const mainTableDataHandle = (val: any[]) => {
  setMainTableLoading(true)
  mainTableData.value = val
  setMainTableLoading(false)
}

const updateTableHandle = async () => {
  const requestToken = refreshRequestTracker.issue()
  if (!initParams.nd || !initParams.busiType) {
    clearConfigViewState()
    return
  }
  // 更新树形表格和右边表格
  const $table = treeTableRef.value
  if ($table) {
    const $treeTable = $table.treeRef
    let curData = $treeTable?.getCurrentRecord?.()
    await $table.getTreeTable()
    if (!refreshRequestTracker.isLatest(requestToken)) return
    let dataList = $table.treeData
    let selectId = curData?.id || initParams.nd
    await expandAndSelectNode(dataList, selectId, $treeTable)
    if (!refreshRequestTracker.isLatest(requestToken)) return
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
  if (!treeTableRef || !targetId) return
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
  clearConfigViewState()
}

onMounted(initData)
</script>

<style scoped lang="less">
.container {
  --panel-bg: #fff;
  --panel-border: #e4e7ed;
  --panel-accent: var(--color-primary);
  --panel-accent-soft: rgb(0 112 107 / 8%);

  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 660px;
  min-height: 0;

  .main-content {
    flex: 1;
    box-sizing: border-box;
    height: 100%;
    display: grid;
    grid-template-columns: minmax(300px, 320px) minmax(0, 1fr);
    gap: 10px;
    min-height: 0;
    min-width: 0;
  }
}

.pane-body {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(31 35 41 / 4%);
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pane-body--table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pane-table {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.inline-tip {
  flex-shrink: 0;
  padding: 10px;
  border: 1px solid rgb(0 112 107 / 18%);
  border-radius: 6px;
  background: rgb(0 112 107 / 5%);
  color: #4e5d59;
  font-size: 13px;
  line-height: 20px;
}

.container :deep(.header) {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
}

.container :deep(.left) {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 320px;
  line-height: normal;
}

.container :deep(.left .el-button) {
  margin-left: 0;
}

.container :deep(.right) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 280px;
  margin-left: auto;
}

.container :deep(.filters) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.container :deep(.filter-item) {
  display: flex;
  align-items: center;
  gap: 10px;
}

.container :deep(.filter-item > span) {
  color: #606266;
  font-weight: 500;
}

.container :deep(.help) {
  display: flex;
  align-items: center;
}

.container :deep(.toolbar-guide-icon) {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: var(--panel-accent);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.container :deep(.toolbar-guide-icon:hover) {
  border-color: rgb(0 112 107 / 24%);
  background: var(--panel-accent-soft);
}

.pane-body :deep(.tree-box),
.pane-body :deep(.table-box) {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.pane-body--tree :deep(.tree-box) {
  padding-right: 0;
}

@media (max-width: 1280px) {
  .container {
    .main-content {
      grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
    }
  }
}

@media (max-width: 1080px) {
  .container {
    .main-content {
      grid-template-columns: 1fr;
    }
  }

  .pane-body--tree {
    min-height: 320px;
  }

  .container :deep(.left),
  .container :deep(.right) {
    min-width: 0;
  }

  .container :deep(.right) {
    justify-content: flex-start;
    margin-left: 0;
  }
}
</style>
