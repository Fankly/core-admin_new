<template>
  <div v-show="pageVisible" class="container">
    <div class="header">
      <div v-if="pageVisible">
        <el-button v-permission="'ADD'" :disabled="actionDisabled" plain size="mini" type="primary" @click="openForm('ADD')">新 增</el-button>
        <el-button v-permission="'EDIT'" :disabled="actionDisabled" plain size="mini" type="primary" @click="openForm('EDIT')">修 改</el-button>
        <el-button v-permission="'DELETE'" :disabled="actionDisabled" plain size="mini" type="primary" @click="deleteRows">删 除</el-button>
      </div>
      <div class="filters">
        <label>年度：</label>
        <el-select v-model="context.nd" :disabled="locked" style="width: 110px" placeholder="请选择年度">
          <el-option v-for="year in years" :key="year.yearCode" :label="year.yearName" :value="String(year.yearCode)" />
        </el-select>
        <label>展示维度：</label>
        <el-select v-model="context.busiType" :disabled="locked" clearable style="width: 180px" placeholder="请选择展示维度">
          <el-option v-for="item in dimensions" :key="item.code" :label="item.name" :value="String(item.code)" />
        </el-select>
      </div>
    </div>
    <div v-if="loadError" class="inline-tip error" role="alert">{{ loadError }}；可重新选择年度或展示维度重试。</div>
    <div v-if="pageVisible" class="main-content" v-loading="loading">
      <div class="pane-body tree-pane" :class="{ locked }">
        <vxe-table
          ref="treeRef"
          :data="treeRows"
          :tree-config="{}"
          :row-config="{ keyField: 'id', isCurrent: true, height: 32 }"
          :show-header="false"
          border="outer"
          height="100%"
          show-overflow
          @current-change="selectNode"
        >
          <vxe-column field="name" title="配置名称" tree-node />
        </vxe-table>
      </div>
      <div class="pane-body">
        <div v-if="!context.busiType" class="inline-tip">选择展示维度后可查看配置节点和明细数据。</div>
        <div v-else class="inline-tip">当前父节点：{{ selectedNode?.name || '年度根节点' }}</div>
        <div class="pane-table" :class="{ locked }">
          <MainTable ref="mainTableRef" :main-table-data="tableRows" :initParams="context" :show-execution-fields="true" :click-row-select="true" />
        </div>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="loadRole" />
  <FormDialog ref="formDialogRef" @busy-change="dialogOpen = $event" @saved="refresh(true)" />
</template>

<script lang="ts">
export default { name: '/statistics/budgetExecutionAnalysis/budgetStatisticsConfigTest/budgetStatisticsConfig' }
</script>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { useStore } from 'vuex'
import userDialog from '@/components/select/userDialog.vue'
import { getPublicCodeList, getYearData } from '@/api/common'
import { batchDeleteConfig } from '@/api/statistics/budgetStatisticsConfig'
import MainTable from './components/MainTable.vue'
import FormDialog from './components/FormDialog.vue'
import { loadSnapshot, resultData } from './api'
import { contextError, deleteError, flatten, key, sameId } from './rules'
import type { Row, Snapshot } from './rules'

const store = useStore()
const userDialogRef = ref()
const mainTableRef = ref()
const treeRef = ref()
const formDialogRef = ref()
const pageVisible = ref(false)
const loading = ref(false)
const deleting = ref(false)
const dialogOpen = ref(false)
const ready = ref(false)
const loadError = ref('')
const years = ref<Row[]>([])
const dimensions = ref<Row[]>([])
const context = reactive({ nd: '', busiType: '' })
const snapshot = ref<Snapshot>({ tree: [], rows: [], targets: {} })
const selectedNode = ref<Row | null>(null)
const locked = computed(() => deleting.value || dialogOpen.value)
const actionDisabled = computed(() => loading.value || locked.value || !ready.value || !!contextError(context))
const treeRows = computed(() => (ready.value ? [{ id: context.nd, name: `${context.nd}年度`, isleaf: '0', children: snapshot.value.tree }] : []))
const tableRows = computed(() => snapshot.value.rows.filter((row) => sameId(row.parentId, selectedNode.value?.id || context.nd)))
let requestId = 0

function permitted(action: string) {
  const allowed = Array.isArray(store.state.permissions) && store.state.permissions.includes(action)
  if (!allowed) ElMessage.warning('没有此操作权限')
  return allowed
}
async function selectNode({ row }: { row: Row }) {
  if (locked.value || loading.value) return
  selectedNode.value = row
  await mainTableRef.value?.mainTableRef?.clearCheckboxRow()
}
async function refresh(preserve = false) {
  const token = ++requestId
  const previous = preserve ? key(selectedNode.value?.id) : ''
  ready.value = false
  selectedNode.value = null
  snapshot.value = { tree: [], rows: [], targets: {} }
  loadError.value = ''
  await mainTableRef.value?.mainTableRef?.clearCheckboxRow()
  if (!pageVisible.value || contextError(context)) {
    loading.value = false
    return
  }
  loading.value = true
  const scope = { ...context }
  try {
    const result = await loadSnapshot(scope)
    if (token !== requestId) return
    snapshot.value = result
    ready.value = true
    selectedNode.value = flatten(treeRows.value).find((node) => sameId(node.id, previous)) || treeRows.value[0]
    await nextTick()
    if (token !== requestId) return
    await treeRef.value?.setAllTreeExpand(true)
    await treeRef.value?.setCurrentRow(selectedNode.value)
  } catch (error) {
    if (token !== requestId) return
    loadError.value = error instanceof Error ? error.message : '配置加载失败'
    ElMessage.error(loadError.value)
  } finally {
    if (token === requestId) loading.value = false
  }
}
function openForm(mode: 'ADD' | 'EDIT') {
  if (actionDisabled.value || !permitted(mode)) return
  const records = mainTableRef.value?.mainTableRef?.getCheckboxRecords() || []
  if (mode === 'EDIT' && records.length !== 1) {
    ElMessage.warning('请选择一条数据进行修改')
    return
  }
  if (mode === 'ADD' && key(selectedNode.value?.isleaf) === '1') {
    ElMessage.warning('末级节点下不能新增配置，请选择非末级父节点')
    return
  }
  formDialogRef.value?.open({ mode, context: { ...context }, parent: { ...selectedNode.value }, record: mode === 'EDIT' ? { ...records[0] } : null })
}
async function deleteRows() {
  if (actionDisabled.value || !permitted('DELETE')) return
  const records: Row[] = mainTableRef.value?.mainTableRef?.getCheckboxRecords() || []
  const ids = records.map((row) => row.configId)
  const error = deleteError(ids, snapshot.value)
  if (error) {
    ElMessage.warning(error)
    return
  }
  deleting.value = true
  const scope = { ...context }
  try {
    const answer = await VXETable.modal.confirm(`确定删除选中的 ${ids.length} 条配置？删除后无法恢复。`, '提示', { status: 'warning' })
    if (answer !== 'confirm') return
    if (!permitted('DELETE')) return
    const latest = await loadSnapshot(scope, true)
    const validation = deleteError(ids, latest)
    if (validation) {
      ElMessage.warning(validation)
      await refresh(true)
      return
    }
    // 确认期间名称等数据变化时，要求重新选择，避免删除与确认内容不同的记录。
    if (
      records.some((row) => {
        const fresh = latest.rows.find((item) => sameId(item.configId, row.configId))
        return !fresh || ['configName', 'parentId', 'recState'].some((field) => !sameId(row[field], fresh[field]))
      })
    ) {
      ElMessage.warning('所选配置已变化，请重新选择后删除')
      await refresh(true)
      return
    }
    const result = await batchDeleteConfig(ids.map((id) => encodeURIComponent(key(id))).join(','))
    if (!result.success) throw new Error(result.msg || '删除失败')
    ElMessage.success('删除成功')
    await refresh(true)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败，请稍后重试')
  } finally {
    deleting.value = false
  }
}
async function loadRole() {
  pageVisible.value = Boolean(userDialogRef.value?.isQuery)
  if (pageVisible.value) await refresh()
}
watch(
  () => [context.nd, context.busiType],
  () => refresh()
)
onBeforeUnmount(() => {
  requestId++
})
onMounted(async () => {
  userDialogRef.value?.getUser()
  try {
    const [yearResult, codeResult] = await Promise.all([getYearData(), getPublicCodeList({ codes: ['BUDUGET_EXECUTION_ANALYSIS'] })])
    const yearData = resultData(yearResult, '年度加载失败')
    const codeData = resultData(codeResult, '展示维度加载失败')
    if (!Array.isArray(yearData) || !Array.isArray(codeData.BUDUGET_EXECUTION_ANALYSIS)) throw new Error('筛选字典格式异常')
    years.value = yearData
    dimensions.value = codeData.BUDUGET_EXECUTION_ANALYSIS
    const current = String(new Date().getFullYear())
    context.nd = years.value.some((year) => sameId(year.yearCode, current)) ? current : key(years.value[0]?.yearCode)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '筛选条件加载失败，请刷新页面')
  }
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 660px;
  min-height: 0;
}
.header,
.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header {
  justify-content: space-between;
  flex-wrap: wrap;
}
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}
.pane-body {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.pane-table {
  flex: 1;
  min-height: 0;
}
.inline-tip {
  color: #606266;
  font-size: 13px;
  padding-bottom: 10px;
}
.error {
  color: #c45656;
}
.locked {
  pointer-events: none;
}
</style>
