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
        <div v-if="apiType === 'BUDGETITEM' || apiType === 'BUDGETALL'" class="range-content-wrap">
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
          <div class="range-table-wrap range-table-wrap--transfer">
            <el-transfer
              v-model="checkedYssxIds"
              class="budget-item-transfer"
              filterable
              filter-placeholder="请输入事项编码或名称"
              target-order="push"
              :data="transferData"
              :titles="['事项列表', '已选事项']"
              :props="transferProps"
              :filter-method="filterYssx"
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
          <span class="range-modal-footer__hint">未选择项目类型范围时保存，将清空项目类型关联</span>
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
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { ElTree } from 'element-plus'
import {
  listLinkedProType,
  linkProType,
  listLinkedYjdw,
  linkYjdw,
  listByProjectTypeId,
  saveRuleByProjectTypeId,
  yssxListByRuleIds
} from '@/api/suzhou/aiAuditRuleManage'
import { linkProTypeByRuleIds } from '@/api/suzhou/aiAuditRulePoint'
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
  ruleId?: string
  ruleIdList?: (string | number)[]
  type: 'RELATE' | 'RELATEYJDW' | 'BUDGETITEM' | 'BUDGETALL'
}

interface LinkPayload {
  ruleId?: string
  ruleIdList?: (string | number)[]
  proTypeList?: (string | number)[]
  yjdwList?: (string | number)[]
}

/** 穿梭框里的一行预算事项 */
interface BudgetRow {
  zyssxbm: string
  zyssxmc: string
  isLinked?: string
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
const ruleIdList = ref<(string | number)[]>([])
const apiType = ref<ModalParam['type']>('BUDGETITEM')
const tableLoading = ref(false)
const currentProjectId = ref<string | number>('')
const proTypes = ref<(string | number)[]>([])
/** 穿梭框右栏（已选事项编码，含打开时回显的已保存项）；保存时原样提交 */
const checkedYssxIds = ref<(string | number)[]>([])
/**
 * 穿梭框数据源：候选 = 当前项目类型范围的查询结果 ∪ 右栏已选项。
 * 候选随分类整体替换（点分类要能看出列表变化），只有右栏的已选项是只进不出的。
 *
 * 配合模板里的 target-order="push"：右栏按 v-model（选中顺序）渲染，
 * 否则默认的 "original" 会按数据源顺序渲染 —— 切分类时数据源顺序一变，
 * 已选事项的显示顺序就跟着乱跳。
 */
const transferData = ref<BudgetRow[]>([])
/** 最近一次查询回来的候选（每次查询整体替换） */
const latestQueryRows = ref<BudgetRow[]>([])
/** 见过的行（查询结果 + 已保存行）：已选项不在当前候选范围里时，靠它把左/右栏这一行显示出来 */
const rowCache = new Map<string, BudgetRow>()
const transferProps = { key: 'zyssxbm', label: 'zyssxmc' }

/** 穿梭框过滤：事项编码与名称一起匹配 */
const filterYssx = (query: string, item: { zyssxbm: string; zyssxmc: string }) =>
  `${item.zyssxbm}${item.zyssxmc}`.toLowerCase().includes(String(query).toLowerCase())

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
  },
  BUDGETALL: {
    title: '适用预算事项',
    treeApi: getAllProtypeTree,
    linkedApi: listLinkedProType,
    linkApi: linkProTypeByRuleIds,
    buildPayload: (ids: (string | number)[], ridList: (string | number)[]): LinkPayload => ({
      proTypeList: ids,
      ruleIdList: ridList
    })
  }
} as const

// ──────────────────────────── 方法 ────────────────────────────

/** 缓存行对象（同一编码后到的覆盖先到的），供已选项回显 */
const cacheRows = (rows: any[]) => {
  rows.forEach((row) => {
    if (!row?.zyssxbm) return
    const code = String(row.zyssxbm)
    rowCache.set(code, { ...rowCache.get(code), ...row, zyssxbm: code })
  })
}

/** 重组数据源：当前候选 + 右栏已选项（已选项即使不在候选范围里也要留着，否则穿梭框渲染不出这一行） */
const rebuildTransferData = () => {
  const map = new Map<string, BudgetRow>()
  latestQueryRows.value.forEach((row) => map.set(row.zyssxbm, row))
  checkedYssxIds.value.forEach((key) => {
    const code = String(key)
    if (!map.has(code)) map.set(code, rowCache.get(code) || { zyssxbm: code, zyssxmc: code })
  })
  transferData.value = Array.from(map.values())
}

/**
 * 拉取候选预算事项（`ai-yssx/listByProjectTypeId`）：点项目类型树 → proTypes 变 → 整体换候选。
 * 表格换成穿梭框后没有分页器，一次取够（limit 放大）；
 * 项目类型没选时不请求，候选清空（右栏的已选项不受影响）。
 */
const loadBudgetItems = async () => {
  // BUDGETALL 用 ruleIdList，其余用 ruleId
  const isBatch = apiType.value === 'BUDGETALL'
  const ruleIds = isBatch ? ruleIdList.value : ruleId.value ? [ruleId.value] : []
  if (ruleIds.length === 0 || proTypes.value.length === 0) {
    latestQueryRows.value = []
    rebuildTransferData()
    return
  }
  tableLoading.value = true
  try {
    const res = await listByProjectTypeId({
      page: 1,
      limit: 999,
      ruleIds: isBatch ? [] : ruleIds,
      proTypes: proTypes.value
    })
    const records = res?.data?.records || res?.data || []
    latestQueryRows.value = (Array.isArray(records) ? records : []).map((row: any) => ({ ...row, zyssxbm: String(row?.zyssxbm ?? '') }))
    cacheRows(latestQueryRows.value)
  } finally {
    tableLoading.value = false
    rebuildTransferData()
  }
}

/** 关闭弹窗，重置状态 */
const closeModalHandle = (): void => {
  treeDataList.value = []
  checkedKeys.value = []
  checkStrictly.value = true
  currentProjectId.value = ''
  proTypes.value = []
  checkedYssxIds.value = []
  transferData.value = []
  latestQueryRows.value = []
  rowCache.clear()
  ruleIdList.value = []
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
  if (apiType.value !== 'BUDGETITEM' && apiType.value !== 'BUDGETALL') return

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

  // 项目类型变化 → 重新取候选事项（只与右栏已有的合并，不动右栏的已选项）
  await loadBudgetItems()
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
    if (apiType.value === 'BUDGETALL') {
      const [res] = await Promise.all([
        config.linkApi(config.buildPayload(leafIds, ruleIdList.value)),
        saveRuleByProjectTypeId({ ruleIdList: ruleIdList.value, yssxList: checkedYssxIds.value })
      ])
      if (res.success) {
        ElMessage.success('已保存!')
        closeModalHandle()
      } else ElMessage.error(res.msg || '保存失败')
      return
    }
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
    name:
      apiType.value === 'RELATE' ? '全部项目类型' : apiType.value === 'BUDGETITEM' || apiType.value === 'BUDGETALL' ? '全部预算事项' : '全部一级单位',
    children: nodes
  }
]

/** 打开弹窗，加载数据 */
const acceptParams = async (param: ModalParam): Promise<void> => {
  loading.value = true
  ruleId.value = param.ruleId || ''
  ruleIdList.value = param.ruleIdList || []
  apiType.value = param.type

  const config = typeConfig[apiType.value]
  title.value = config.title
  treeModal.value = true

  // 批量预算事项：加载树，不回显已关联数据，右栏初始为空
  if (apiType.value === 'BUDGETALL') {
    proTypes.value = []
    checkedYssxIds.value = []
    transferData.value = []
    try {
      const treeRes = await config.treeApi()
      const rawData = treeRes.data
      treeDataList.value = withSelectAllNode(rawData)
      checkedKeys.value = []
      await nextTick()
      treeRef.value?.setCheckedKeys([])
    } catch (error) {
      ElMessage.error((error as Error).message)
      treeModal.value = false
    } finally {
      loading.value = false
    }
    return
  }

  try {
    const [treeRes, checkedRes, budgetRes] = await Promise.all([
      config.treeApi(),
      config.linkedApi({ ruleId: ruleId.value }),
      apiType.value === 'BUDGETITEM' ? yssxListByRuleIds({ ruleIds: [ruleId.value] }) : null
    ])

    // 已保存的事项：行对象进缓存与数据源，编码进右栏（右栏只认编码，行对象会把 String() 变成 '[object Object]'）
    if (budgetRes) {
      const savedRows = Array.isArray(budgetRes.data) ? budgetRes.data : []
      cacheRows(savedRows)
      checkedYssxIds.value = savedRows.map((row: any) => String(row?.zyssxbm ?? row)).filter(Boolean)
      rebuildTransferData()
    }

    const rawData = treeRes.data
    const nodes = apiType.value === 'RELATEYJDW' ? normalizeYjdwData(rawData) : rawData
    treeDataList.value = withSelectAllNode(nodes)
    checkedKeys.value = checkedRes.data
    await nextTick()
    treeRef.value?.setCheckedKeys(checkedKeys.value)

    if (apiType.value === 'BUDGETITEM') {
      proTypes.value = Array.isArray(checkedRes.data) ? checkedRes.data : []
      // 已保存项已在右栏；这里把当前项目类型下的候选事项补进左栏
      await loadBudgetItems()
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

/* 关联预算事项：右卡片里放穿梭框（左=候选事项，右=已选/已保存） */
.range-table-wrap--transfer {
  display: flex !important;
  align-items: stretch;
  padding: 8px 10px !important;
  overflow: hidden !important;

  .budget-item-transfer {
    display: flex;
    flex: 1 1 0;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;

    .el-transfer-panel {
      display: flex;
      flex: 1 1 0;
      flex-direction: column;
      height: auto;
      min-width: 0;
      border-color: #e2e8f0;
      border-radius: 8px;

      .el-transfer-panel__header {
        flex-shrink: 0;
      }

      .el-transfer-panel__body {
        display: flex;
        flex: 1 1 0;
        flex-direction: column;
        height: auto;
        min-height: 0;

        .el-transfer-panel__filter {
          flex-shrink: 0;
        }

        .el-transfer-panel__list {
          flex: 1 1 0;
          height: auto;
          min-height: 0;
          overflow-y: auto;
        }
      }

      .el-transfer-panel__item {
        padding-right: 12px;

        .el-checkbox {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .el-checkbox__label {
          flex: 1 1 0;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .el-transfer__buttons {
      display: flex;
      flex-shrink: 0;
      flex-direction: column;
      justify-content: center;
      padding: 0 12px;

      .el-button + .el-button {
        margin-top: 8px;
        margin-left: 0;
      }
    }
  }
}
</style>
