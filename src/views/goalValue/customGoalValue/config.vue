<template>
  <div v-show="pageInfo.isShowPage" class="container">
    <ConfigHeader
      :showPage="pageInfo.isShowPage"
      @delete-data="deleteDataHandle"
      @addData="addOrEditDataHandle"
      @changeNd="changeNdHandle"
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
        <div class="pane-table">
          <MainTable ref="mainTableRef" :main-table-data="mainTableData"></MainTable>
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
  ></FormDialog>
</template>

<script lang="ts">
export default {
  name: '/goalValue/customGoalValue/config'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import ConfigHeader from '@/views/goalValue/customGoalValue/components/ConfigHeader.vue'
import TreeTable from '@/views/goalValue/customGoalValue/components/TreeTable.vue'
import MainTable from '@/views/goalValue/customGoalValue/components/MainTable.vue'
import FormDialog from '@/views/goalValue/customGoalValue/components/FormDialog.vue'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { batchDeleteConfig } from '@/api/goalValue/customGoalValue'
import { VXETable } from 'vxe-table'

export type InitParams = {
  nd: string
}

const createLatestRequestTracker = () => {
  let current = 0
  return {
    issue: () => ++current,
    isLatest: (token: number) => token === current
  }
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
const refreshRequestTracker = createLatestRequestTracker()
const ROOT_PARENT_ID = '0'

const initParams = reactive<InitParams>({
  nd: ''
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
  const $table = mainTableRef.value.mainTableRef
  if ($table) {
    const records = $table.getCheckboxRecords()
    if (records.length === 0) {
      ElMessage.warning('请选择一条数据进行删除！')
      return
    }
    let index = records.findIndex((item: any) => String(item.sfqy) === '1')

    if (index !== -1) {
      ElMessage.warning('存在启用状态的数据,无法删除！')
      return
    }
    const configIds = records.map((item: any) => item.id)
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
  dialogData.title = flag === 'ADD' ? '新增' : '编辑'
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

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  if (isQuery) {
    pageInfo.isShowPage = true
    // 页面显示后树形表格才挂载，主动加载一次数据
    await nextTick()
    await refreshTreeAndTable()
  }
}

const refreshTreeAndTable = async () => {
  const requestToken = refreshRequestTracker.issue()
  const $table = treeTableRef.value
  if (!initParams.nd) {
    clearConfigViewState()
    return
  }
  if (!$table) return
  treeParams.value = null
  await $table.getTreeTable()
  if (!refreshRequestTracker.isLatest(requestToken)) return
  await $table.getTableData(ROOT_PARENT_ID)
}

const changeNdHandle = async (val: string) => {
  initParams.nd = val || ''
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
  if (!initParams.nd) {
    clearConfigViewState()
    return
  }
  // 更新树形表格和右边表格，并保持当前树节点选中
  const $table = treeTableRef.value
  if ($table) {
    const $treeTable = $table.treeRef
    // 优先用业务态 treeParams，其次用表格当前行，避免刷新后回落到根节点
    const curData = treeParams.value || $treeTable?.getCurrentRecord?.()
    const selectId = curData?.id != null && curData?.id !== '' ? String(curData.id) : ROOT_PARENT_ID
    // 刷新前收集祖先路径，懒加载深层节点才能正确恢复
    const pathIds =
      typeof $table.collectAncestorPathIds === 'function' ? $table.collectAncestorPathIds(curData) : []

    const selected = await $table.getTreeTable({ selectId, pathIds })
    if (!refreshRequestTracker.isLatest(requestToken)) return

    const finalId = selected?.id != null ? String(selected.id) : selectId
    if (selected) {
      treeParams.value = selected
    }
    // 更新右边数据
    await $table.getTableData(finalId)
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

.pane-body :deep(.tree-box),
.pane-body :deep(.table-box) {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
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
}
</style>
