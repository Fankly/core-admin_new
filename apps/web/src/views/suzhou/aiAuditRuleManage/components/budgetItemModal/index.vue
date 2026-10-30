<!-- 弹窗tree -->
<template>
  <div>
    <vxe-modal
      v-model="treeModal"
      class-name="ai-audit-rule-modal ai-audit-rule-range-modal"
      :destroy-on-close="true"
      :title="title"
      :width="1280"
      :height="640"
      resize
      :close-on-press-escape="false"
      :loading="loading"
      @close="closeModalHandle"
    >
      <div class="range-modal-body">
        <div v-if="apiType === 'BUDGETITEM'" class="range-content-wrap">
          <div class="range-tree-wrap range-tree-wrap--inline">
            <div class="range-modal-toolbar">
              <div v-if="apiType === 'BUDGETITEM'" class="range-modal-toolbar__left">
                <div class="range-modal-toolbar__copy">
                  <strong>{{ title }}</strong>
                  <span>勾选父级节点可快速全选其下级范围</span>
                </div>
                <el-form :inline="true">
                  <el-form-item label="父子联动">
                    <el-switch v-model="checkStrictly" />
                  </el-form-item>
                </el-form>
              </div>
              <template v-else>
                <div class="range-modal-toolbar__copy">
                  <strong>{{ title }}</strong>
                  <span>勾选父级节点可快速全选其下级范围</span>
                </div>
                <el-form :inline="true">
                  <el-form-item label="父子联动">
                    <el-switch v-model="checkStrictly" />
                  </el-form-item>
                </el-form>
              </template>
            </div>
            <div class="range-tree-scroll">
              <el-tree
                ref="treeRef"
                :check-strictly="!checkStrictly"
                :default-checked-keys="checkedKeys"
                :default-expanded-keys="defaultExpandedKeys"
                node-key="id"
                show-checkbox
                highlight-current
                :props="treeProps"
                :data="treeDataList"
                @check="handleNodeCheck"
              />
            </div>
          </div>
          <div class="range-table-wrap">
            <div v-if="apiType === 'BUDGETITEM'" class="range-modal-toolbar__right" />

            <RangeVxeTable
              ref="budgetTableRef"
              class="budget-item-table"
              row-key="id"
              row-click-mode="exclusive"
              :border="true"
              :pagination="true"
              :request-auto="false"
              :request-api="getBudgetPageList"
              :data-callback="callBackHandle"
              :columns="budgetColumns"
              :search-columns="searchColumns"
              :search-col="5"
              :loading="tableLoading"
              @search="handleTableQuery"
              @reset="handleTableQuery"
              @selection-change="handleSelectionChange"
            />
          </div>
        </div>
        <div v-else class="range-tree-wrap">
          <el-tree
            ref="treeRef"
            :check-strictly="!checkStrictly"
            :default-checked-keys="checkedKeys"
            :default-expanded-keys="defaultExpandedKeys"
            node-key="id"
            show-checkbox
            highlight-current
            :props="treeProps"
            :data="treeDataList"
            @check="handleNodeCheck"
          />
        </div>

        <div class="range-modal-footer">
          <span class="range-modal-footer__hint">未选择范围时保存，将清空当前关联</span>
          <div class="range-modal-footer__actions">
            <el-button size="small" type="primary" :loading="loading" @click="handleSave">保 存</el-button>
            <el-button size="small" plain :disabled="loading" @click="closeModalHandle">关 闭</el-button>
          </div>
        </div>
      </div>
    </vxe-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { ElTree } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import type { ColumnProps } from '@/components/ProTable/interface'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import {
  listLinkedProType,
  linkProType,
  listLinkedYjdw,
  linkYjdw,
  listByProjectTypeId,
  saveRuleByProjectTypeId,
  yssxListByRuleIds
} from '@/api/suzhou/aiAuditRuleManage'
import { getAllProtypeTree } from '@/api/service/expertinformation'
import { commonCodeYjdw } from '@/api/common'

// ──────────────────────────── 类型定义 ────────────────────────────

interface TreeNode {
  id: string | number
  name: string
  children?: TreeNode[]
  code?: string
}

interface ModalParam {
  ruleId: string
  type: 'RELATE' | 'RELATEYJDW' | 'BUDGETITEM'
}

interface LinkPayload {
  ruleId: string
  proTypeList?: (string | number)[]
  yjdwList?: (string | number)[]
}

// ──────────────────────────── 响应式状态 ────────────────────────────

const treeModal = ref(false)
const loading = ref(false)
const checkStrictly = ref(true)
const title = ref('适用项目类型')
const treeRef = ref<InstanceType<typeof ElTree>>()
const treeDataList = ref<TreeNode[]>([])
const checkedKeys = ref<(string | number)[]>([])
const ruleId = ref('')
const apiType = ref<ModalParam['type']>('BUDGETITEM')
const budgetTableRef = ref<any>(null)
const tableLoading = ref(false)
const currentProjectId = ref<string | number>('')
const proTypes = ref<(string | number)[]>([])
const checkedYssxIds = ref<(string | number)[]>([])
// 程序化勾选标志：跳过 clearSelection / setCheckboxRow 触发的 selection-change
const isProgrammaticChange = ref(false)

const budgetColumns = ref<NonNullable<VxeGridProps['columns']>>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'zyssxbm', title: '事项编码', minWidth: 150 },
  { field: 'zyssxmc', title: '事项名称', minWidth: 200 }
])

const searchColumns = reactive<ColumnProps[]>([
  { prop: 'zyssxbm', label: '事项编码', search: { el: 'input', order: 1, span: 2, props: { clearable: true, placeholder: '请输入事项编码' } } },
  { prop: 'zyssxmc', label: '事项名称', search: { el: 'input', order: 2, span: 2, props: { clearable: true, placeholder: '请输入事项名称' } } }
])

const treeProps = {
  label: 'name',
  children: 'children'
}

const allNodeId = computed(() => `__all__-${apiType.value}`)

/** 默认展开第一层首个节点 */
const defaultExpandedKeys = computed<(string | number)[]>(() => (treeDataList.value.length ? [treeDataList.value[0].id] : []))

// ──────────────────────────── 类型配置映射 ────────────────────────────

/** 根据 apiType 聚合所有差异化配置，避免散落的 if/else */
const typeConfig = {
  RELATE: {
    title: '适用项目类型',
    treeApi: getAllProtypeTree,
    linkedApi: listLinkedProType,
    linkApi: linkProType,
    buildPayload: (ids: (string | number)[], rid: string): LinkPayload => ({
      ruleId: rid,
      proTypeList: ids
    })
  },
  RELATEYJDW: {
    title: '适用一级单位',
    treeApi: commonCodeYjdw,
    linkedApi: listLinkedYjdw,
    linkApi: linkYjdw,
    buildPayload: (ids: (string | number)[], rid: string): LinkPayload => ({
      ruleId: rid,
      yjdwList: ids
    })
  },
  BUDGETITEM: {
    title: '适用预算事项',
    treeApi: getAllProtypeTree,
    linkedApi: listLinkedProType,
    linkApi: linkProType,
    buildPayload: (ids: (string | number)[], rid: string): LinkPayload => ({
      ruleId: rid,
      proTypeList: ids
    })
  }
} as const

// ──────────────────────────── 方法 ────────────────────────────

/** 表格数据回调：仅置标志位，回显勾选推迟到 clearSelection 之后（由 handleSelectionChange 触发） */
const callBackHandle = (data: any) => {
  // clearSelection 在 dataCallback 之后执行并 emit('selection-change', [])，
  // 提前置标志位：阻止其间 handleSelectionChange 误删 checkedYssxIds，
  // 并在收到该空数组时触发 checkLinkedRows 回显（确保在 clearSelection 之后）。
  isProgrammaticChange.value = true
  return data
}

/** 表格列表请求：按已关联项目类型查询适用预算事项 */
const getBudgetPageList = async (params: any) => {
  if (!ruleId.value || proTypes.value.length === 0) {
    return { success: true, data: { records: [], total: 0 } }
  }
  tableLoading.value = true
  try {
    return await listByProjectTypeId({
      ...params,
      ruleIds: [ruleId.value],
      proTypes: proTypes.value
    })
  } finally {
    tableLoading.value = false
  }
}

/** 表格数据加载后，勾选 isLinked === 'Y' 的行（以及 checkedYssxIds 中已存在的行） */
const checkLinkedRows = () => {
  const records = budgetTableRef.value?.gridRef?.getTableData?.()?.visibleData || []
  if (!records.length) {
    isProgrammaticChange.value = false
    return
  }
  // 标志位阻止 setCheckboxRow / clearSelection 触发的 selection-change 干扰 checkedYssxIds
  isProgrammaticChange.value = true
  records.forEach((row: any) => {
    if (row.isLinked === 'Y' || checkedYssxIds.value.includes(row.zyssxbm)) {
      budgetTableRef.value?.setCheckboxRow(row, true)
    }
  })
  // 同步当前页 isLinked === 'Y' 的 code 到 checkedYssxIds（确保初始已选不丢失）
  const linkedCodes = records.filter((r: any) => r.isLinked === 'Y').map((r: any) => r.zyssxbm)
  checkedYssxIds.value = [...new Set([...checkedYssxIds.value, ...linkedCodes])]
  nextTick(() => {
    isProgrammaticChange.value = false
  })
}

/** 表格勾选变化时，按当前页增删 checkedYssxIds（存 zyssxbm） */
const handleSelectionChange = (rows: any[]) => {
  // 程序化勾选期间不同步，避免误删 checkedYssxIds
  if (isProgrammaticChange.value) {
    // callBackHandle 置标志位后，clearSelection 会 emit('selection-change', [])，
    // 此时数据已加载且勾选已清空，正是回显时机（确保在 clearSelection 之后）。
    if (!rows || rows.length === 0) {
      nextTick(() => {
        checkLinkedRows()
      })
    }
    return
  }
  // rows 为空有两种来源：
  // 1. handleSearch/reset 前置的 clearSelection——此时 visibleData 仍是旧页数据，
  //    差集会移除旧页的 code，但随后 handleTableQuery → checkLinkedRows 会按
  //    isLinked/checkedYssxIds 重新回显，不影响最终结果；
  // 2. 用户手动取消到当前页 0 勾选——差集正是期望行为，需移除当前页已取消的 code。
  //    此前此处 early return 导致场景 2 的已取消 code 未被移除，保存时被错误提交。
  const allRecords = budgetTableRef.value?.gridRef?.getTableData?.()?.visibleData || []
  const pageCodes = allRecords.map((row: any) => row.zyssxbm)
  const checkedCodes = new Set(rows.map((row: any) => row.zyssxbm))
  // 当前页中不再勾选的从 checkedYssxIds 移除，保留其他页的；再追加当前页仍勾选的
  const kept = checkedYssxIds.value.filter((code) => !pageCodes.includes(code))
  checkedYssxIds.value = [...new Set([...kept, ...checkedCodes])]
}

/** 查询/重置后回显勾选（事件在 getTableList 完成后触发） */
const handleTableQuery = () => {
  // getTableList 内部 clearSelection 已在数据加载前执行并 emit('selection-change', [])，
  // 此时旧页勾选可能被误删。callBackHandle 已通过 nextTick 调度 checkLinkedRows，
  // 这里再补一次，确保新页数据中命中 checkedYssxIds / isLinked 的行被勾选回显。
  nextTick(() => {
    nextTick(() => {
      checkLinkedRows()
    })
  })
}

/** 关闭弹窗，重置状态 */
const closeModalHandle = (): void => {
  treeDataList.value = []
  checkedKeys.value = []
  checkStrictly.value = true
  currentProjectId.value = ''
  proTypes.value = []
  checkedYssxIds.value = []
  treeModal.value = false
}

/** 父子不联动模式下，选中子节点时递归选中父节点 */
const selectParentRecursive = (node: TreeNode): void => {
  const $tree = treeRef.value
  if (!$tree) return

  const parentNode = $tree.getNode(node)?.parent
  if (parentNode?.data?.id != null) {
    $tree.setChecked(parentNode.data.id, true)
    selectParentRecursive(parentNode.data)
  }
}

/** 递归收集节点及其所有子孙节点的 id */
const collectNodeIds = (node: TreeNode): (string | number)[] => {
  const ids: (string | number)[] = [node.id]
  if (node.children?.length) {
    node.children.forEach((child) => {
      ids.push(...collectNodeIds(child))
    })
  }
  return ids
}

/** 节点选中回调 */
const handleNodeCheck = async (currentNode: TreeNode, checkedStatus: { checkedKeys: (string | number)[] }): Promise<void> => {
  if (!checkStrictly.value && checkedStatus.checkedKeys.includes(currentNode.id)) {
    selectParentRecursive(currentNode)
  }
  if (apiType.value !== 'BUDGETITEM') return

  // 勾选/取消勾选时，收集当前节点及其所有子孙节点 id，整体增删 proTypes
  // "全部"虚拟节点本身不参与 proTypes，但其子节点需要收集
  const nodeIds = collectNodeIds(currentNode).filter((id) => id !== allNodeId.value)
  const isChecked = checkedStatus.checkedKeys.includes(currentNode.id)
  if (isChecked) {
    const existing = new Set(proTypes.value)
    nodeIds.forEach((id) => existing.add(id))
    proTypes.value = [...existing]
  } else {
    const removeSet = new Set(nodeIds)
    proTypes.value = proTypes.value.filter((id) => !removeSet.has(id))
  }

  // 标志位阻止 getTableList 内部 clearSelection 触发的 selection-change 误删 checkedYssxIds
  isProgrammaticChange.value = true
  try {
    await budgetTableRef.value?.getTableList()
  } finally {
    isProgrammaticChange.value = false
  }
  setTimeout(checkLinkedRows, 300)
}

/** 保存适用关联 */
const handleSave = async (): Promise<void> => {
  if (loading.value) return

  const nodeList = treeRef.value?.getCheckedNodes() || []
  const leafNodes = nodeList.filter((node) => node.id !== allNodeId.value && (!node.children || node.children.length === 0))

  const config = typeConfig[apiType.value]
  const leafIds = leafNodes.map(({ id }) => id)

  loading.value = true
  try {
    const [res] = await Promise.all([
      config.linkApi(config.buildPayload(leafIds, ruleId.value)),
      saveRuleByProjectTypeId({ ruleId: ruleId.value, yssxList: checkedYssxIds.value })
    ])
    if (res.success) {
      ElMessage.success('已保存!')
      closeModalHandle()
    } else ElMessage.error(res.msg || '保存失败')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

/** 一级单位数据后处理：将 code 映射为 id */
const normalizeYjdwData = (nodes: any[]): TreeNode[] =>
  nodes.map((node) => ({
    ...node,
    id: node.code,
    children: []
  }))

const withSelectAllNode = (nodes: TreeNode[]): TreeNode[] => [
  {
    id: allNodeId.value,
    name: apiType.value === 'RELATE' ? '全部项目类型' : apiType.value === 'BUDGETITEM' ? '全部预算事项' : '全部一级单位',
    children: nodes
  }
]

/** 打开弹窗，加载数据 */
const acceptParams = async (param: ModalParam): Promise<void> => {
  loading.value = true
  ruleId.value = param.ruleId
  apiType.value = param.type

  const config = typeConfig[apiType.value]
  title.value = config.title
  treeModal.value = true

  try {
    const [treeRes, checkedRes, budgetRes] = await Promise.all([
      config.treeApi(),
      config.linkedApi({ ruleId: ruleId.value }),
      apiType.value === 'BUDGETITEM' ? yssxListByRuleIds({ ruleIds: [ruleId.value] }) : null
    ])

    if (budgetRes) {
      checkedYssxIds.value = Array.isArray(budgetRes.data) ? [...budgetRes.data] : []
    }

    const rawData = treeRes.data
    const nodes = apiType.value === 'RELATEYJDW' ? normalizeYjdwData(rawData) : rawData
    treeDataList.value = withSelectAllNode(nodes)
    checkedKeys.value = checkedRes.data
    await nextTick()
    treeRef.value?.setCheckedKeys(checkedKeys.value)

    if (apiType.value === 'BUDGETITEM') {
      proTypes.value = Array.isArray(checkedRes.data) ? checkedRes.data : []
      isProgrammaticChange.value = true
      try {
        await budgetTableRef.value?.getTableList()
      } finally {
        isProgrammaticChange.value = false
      }
      setTimeout(checkLinkedRows, 300)
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
    treeModal.value = false
  } finally {
    loading.value = false
  }
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';

.range-content-wrap {
  display: flex !important;
  flex: 1 1 0 !important;
  gap: 10px;
  min-height: 0;
  margin-top: 10px;
  width: 100%;

  .range-tree-wrap--inline {
    flex: 1 1 0 !important;
    margin-top: 0 !important;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .range-modal-toolbar {
      flex-shrink: 0;
    }

    .range-tree-scroll {
      flex: 1 1 0;
      min-height: 0;
      overflow: auto;
    }
  }

  .range-table-wrap {
    flex: 2 1 0 !important;
    min-width: 0;
    min-height: 0;
    padding: 8px;
    overflow: auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }
}

.range-modal-toolbar__left {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1 1 0;
  min-width: 0;
}

.range-modal-toolbar__right {
  flex: 2 1 0;
  min-width: 0;
}

.budget-item-table {
  .vxe-grid,
  .vxe-table {
    --vxe-table-header-font-color: #00706b;
    --vxe-table-header-background-color: #dff3f0;
    --vxe-table-header-font-weight: 600;
    --vxe-table-border-color: #e2e8f0;
    --vxe-table-row-hover-background-color: #e6f4f3;
    --vxe-table-row-striped-background-color: #f7fcfb;
    --vxe-table-row-current-background-color: #d8efec;
    --vxe-table-row-checkbox-checked-background-color: #d8efec;
  }

  .vxe-table--header-wrapper,
  .vxe-table--header,
  .vxe-header--column {
    background-color: #dff3f0 !important;
  }

  .vxe-header--column {
    height: 44px;
    color: #00706b !important;
    font-size: 13px;
    font-weight: 600;

    .vxe-cell {
      color: inherit;
      font-size: 13px;
    }
  }

  .vxe-body--column {
    height: 32px;
    color: #475569;
    font-size: 13px;

    .vxe-cell {
      font-size: 13px;
    }
  }

  .vxe-body--row.row--stripe {
    background-color: #f7fcfb !important;
  }

  .vxe-body--row.row--checked,
  .vxe-body--row.row--current {
    background-color: #d8efec !important;
  }

  .vxe-body--row.row--hover,
  .vxe-body--row.row--hover.row--checked {
    background-color: #e6f4f3 !important;
  }

  .vxe-body--row.row--stripe .vxe-body--column,
  .vxe-body--row.row--checked .vxe-body--column,
  .vxe-body--row.row--hover .vxe-body--column,
  .vxe-body--row.row--current .vxe-body--column {
    background-color: transparent !important;
  }

  .vxe-checkbox--icon {
    color: #00706b !important;
  }
}
</style>
