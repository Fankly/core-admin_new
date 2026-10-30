<template>
  <div v-show="isShowPage" class="overview-config">
    <div class="config-header">
      <div class="config-actions">
        <el-button plain size="small" type="primary" :disabled="!ready" @click="handleAdd">新 增</el-button>
        <el-button plain size="small" type="primary" :disabled="!ready" @click="handleEdit">修 改</el-button>
        <el-button plain size="small" type="primary" :disabled="!ready" :loading="deleting" @click="handleDelete">删 除</el-button>
      </div>
    </div>
    <div v-if="isShowPage" class="main-content">
      <div class="pane-body pane-body--tree">
        <ConfigStageTree :tree="tree" :selected-id="selectedId" :loading="loading" @select="selectedId = $event" />
      </div>
      <div class="pane-body pane-body--table">
        <div v-if="loadError" class="inline-tip is-error" role="alert">
          <TriangleAlert :size="16" aria-hidden="true" />
          <span>{{ loadError }}</span>
          <el-button plain size="small" type="primary" @click="loadConfig">重新加载</el-button>
        </div>
        <div class="pane-table">
          <vxe-table
            ref="tableRef"
            height="100%"
            border
            resizable
            show-overflow
            align="center"
            :loading="loading"
            :data="tableRows"
            :row-config="{ height: 32, isHover: true }"
            :checkbox-config="{ highlight: true }"
            @cell-click="handleCellClick"
          >
            <vxe-column type="checkbox" width="60" />
            <vxe-column type="seq" title="序号" width="60" />
            <vxe-column field="jdbm" title="阶段编码" min-width="100" />
            <vxe-column field="jdmc" title="阶段名称" min-width="140" header-align="center" align="left" />
            <vxe-column field="jdpx" title="阶段排序" width="90" />
            <vxe-column field="zjdbm" title="子阶段编码" min-width="110" />
            <vxe-column field="zjdmc" title="子阶段名称" min-width="140" header-align="center" align="left" />
            <vxe-column field="zjdpx" title="子阶段排序" width="100" />
            <vxe-column field="yslx" title="预算类型" min-width="110" />
            <vxe-column field="flowStatus" title="流程状态" min-width="110" />
            <vxe-column field="sjlhhs" title="省级联合核算" min-width="120" />
            <vxe-column field="dec" title="说明" min-width="180" header-align="center" align="left" />
            <vxe-column field="des" title="描述" min-width="180" header-align="center" align="left" />
          </vxe-table>
        </div>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="handleRoleLoaded" />
  <ConfigFormDialog ref="formDialogRef" @saved="loadConfig" />
</template>

<script setup lang="ts">
defineOptions({ name: "/service/overview/config" })
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { TriangleAlert } from '@lucide/vue'
import { VXETable } from 'vxe-table'
import type { VxeTableDefines, VxeTableInstance } from 'vxe-table'
import userDialog from '@/components/select/userDialog.vue'
import { deleteConfig, getConfig } from '@/api/overview'
import type { XmzlConfig } from '@/api/overview'
import ConfigStageTree from './components/ConfigStageTree.vue'
import ConfigFormDialog from './components/ConfigFormDialog.vue'
import { ROOT_NODE_ID, buildConfigTree, compareConfig, findConfigNode, hasValue, matchConfigNode, presetFromNode } from './data/config'

const userDialogRef = ref<InstanceType<typeof userDialog> | null>(null)
const formDialogRef = ref<{ open: (mode: 'ADD' | 'EDIT', row?: XmzlConfig) => Promise<void> }>()
const tableRef = ref<VxeTableInstance<XmzlConfig>>()
const isShowPage = ref(false)
const configs = ref<XmzlConfig[]>([])
const selectedId = ref(ROOT_NODE_ID)
const loading = ref(false)
const deleting = ref(false)
const loadError = ref('')
// 首次加载成功前不开放新增、修改、删除，避免在空列表上误操作。
const ready = ref(false)
let requestId = 0

const tree = computed(() => buildConfigTree(configs.value))
const selectedNode = computed(() => findConfigNode(tree.value, selectedId.value) ?? tree.value)
const tableRows = computed(() => configs.value.filter((row) => matchConfigNode(row, selectedNode.value)))

// 保存或删除后阶段可能消失，选中节点找不到时回到「全部阶段」。
watch(tree, (value) => {
  if (!findConfigNode(value, selectedId.value)) selectedId.value = ROOT_NODE_ID
})
// 切换节点或刷新数据后清空勾选，旧行的勾选状态不会残留。
watch(tableRows, async () => {
  await nextTick()
  await tableRef.value?.clearCheckboxRow()
})

const loadConfig = async () => {
  const currentRequestId = ++requestId
  loading.value = true
  loadError.value = ''
  try {
    const result = await getConfig()
    if (currentRequestId !== requestId) return
    if (!result.success) throw new Error(result.msg || '配置加载失败')
    configs.value = Array.isArray(result.data) ? result.data.slice().sort(compareConfig) : []
    ready.value = true
  } catch (error) {
    if (currentRequestId !== requestId) return
    loadError.value = (error as Error).message || '配置加载失败，请稍后重试'
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

// 点击行即单选该行；多选仍通过勾选框列完成。
const handleCellClick = async ({ row, column }: VxeTableDefines.CellClickEventParams<XmzlConfig>) => {
  const $table = tableRef.value
  if (!$table || column.type === 'checkbox') return
  await $table.clearCheckboxRow()
  await $table.setCheckboxRow(row, true)
}

const getChecked = () => tableRef.value?.getCheckboxRecords() ?? []

const handleAdd = () => {
  if (!ready.value) return
  formDialogRef.value?.open('ADD', presetFromNode(configs.value, selectedNode.value))
}

const handleEdit = () => {
  if (!ready.value) return
  const checked = getChecked()
  if (checked.length !== 1) {
    ElMessage.warning('请选择一条数据进行修改！')
    return
  }
  if (!hasValue(checked[0].id)) {
    ElMessage.error('所选配置缺少 id，无法修改，请刷新后重试')
    return
  }
  formDialogRef.value?.open('EDIT', checked[0])
}

const handleDelete = async () => {
  if (!ready.value || deleting.value) return
  const checked = getChecked()
  if (!checked.length) {
    ElMessage.warning('请至少选择一条数据进行删除！')
    return
  }
  if (checked.some((row) => !hasValue(row.id))) {
    ElMessage.error('所选配置缺少 id，无法删除，请刷新后重试')
    return
  }
  const type = await VXETable.modal.confirm(`确定删除所选的 ${checked.length} 条配置吗？删除后不可恢复。`, '提示', { status: 'warning' })
  if (type !== 'confirm') return
  deleting.value = true
  try {
    const result = await deleteConfig(checked.map((row) => row.id as NonNullable<XmzlConfig['id']>))
    if (!result.success) throw new Error(result.msg || '删除失败')
    ElMessage.success('删除成功！')
    await loadConfig()
  } catch (error) {
    ElMessage.error((error as Error).message || '删除失败，请稍后重试')
  } finally {
    deleting.value = false
  }
}

// 配置接口不区分角色，角色校验只用于菜单访问控制。
const handleRoleLoaded = () => {
  isShowPage.value = true
  void loadConfig()
}

onMounted(() => {
  userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
// 布局与 statistics/budgetExecutionAnalysis/budgetStatisticsConfig.vue 保持一致：顶部按钮 + 左树右表两块面板。
.overview-config {
  --panel-bg: #fff;
  --panel-border: #e4e7ed;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-width: 660px;
  min-height: 0;
  padding: 10px;
}
.config-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
}
.config-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  .el-button {
    margin-left: 0;
  }
}
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(300px, 320px) minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  min-height: 0;
}
.pane-body {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--panel-bg);
  box-shadow: 0 1px 2px rgb(31 35 41 / 4%);
}
.pane-body--table {
  gap: 10px;
}
.pane-table {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.inline-tip {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgb(0 112 107 / 18%);
  border-radius: 6px;
  background: rgb(0 112 107 / 5%);
  color: #4e5d59;
  font-size: 13px;
  line-height: 20px;
}
.inline-tip.is-error {
  border-color: rgb(245 108 108 / 30%);
  background: rgb(245 108 108 / 6%);
  color: #c45656;
}
.inline-tip .el-button {
  margin-left: auto;
}
@media (max-width: 1280px) {
  .main-content {
    grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  }
}
@media (max-width: 1080px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(240px, auto) minmax(320px, 1fr);
  }
}
</style>
