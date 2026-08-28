<!-- 弹窗tree -->
<template>
  <div>
    <vxe-modal
      v-model="treeModal"
      class-name="ai-audit-rule-modal ai-audit-rule-range-modal"
      :destroy-on-close="true"
      :title="title"
      :width="500"
      :height="640"
      resize
      :close-on-press-escape="false"
      :loading="loading"
      @close="closeModalHandle"
    >
      <div class="range-modal-body">
        <div v-if="apiType == 'RELATE'" class="range-modal-toolbar">
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
        <div v-else class="range-modal-toolbar">
          <div class="range-modal-toolbar__copy">
            <strong>{{ title }}</strong>
            <span>勾选“全部一级单位”可一次应用到全部单位</span>
          </div>
        </div>

        <div class="range-tree-wrap">
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
            <el-button size="mini" type="primary" :loading="loading" @click="handleSave">保 存</el-button>
            <el-button size="mini" plain :disabled="loading" @click="closeModalHandle">关 闭</el-button>
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
import { listLinkedProType, linkProType, listLinkedYjdw, linkYjdw } from '@/api/suzhou/aiAuditRuleManage'
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
  type: 'RELATE' | 'RELATEYJDW'
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
const apiType = ref<ModalParam['type']>('RELATE')

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
  }
} as const

// ──────────────────────────── 方法 ────────────────────────────

/** 关闭弹窗，重置状态 */
const closeModalHandle = (): void => {
  treeDataList.value = []
  checkedKeys.value = []
  checkStrictly.value = true
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

/** 节点选中回调 */
const handleNodeCheck = (currentNode: TreeNode, checkedStatus: { checkedKeys: (string | number)[] }): void => {
  if (!checkStrictly.value && checkedStatus.checkedKeys.includes(currentNode.id)) {
    selectParentRecursive(currentNode)
  }
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
    const res = await config.linkApi(config.buildPayload(leafIds, ruleId.value))
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
    name: apiType.value === 'RELATE' ? '全部项目类型' : '全部一级单位',
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
    const [treeRes, checkedRes] = await Promise.all([config.treeApi(), config.linkedApi({ ruleId: ruleId.value })])

    const rawData = treeRes.data
    const nodes = apiType.value === 'RELATEYJDW' ? normalizeYjdwData(rawData) : rawData
    treeDataList.value = withSelectAllNode(nodes)
    checkedKeys.value = checkedRes.data
    await nextTick()
    treeRef.value?.setCheckedKeys(checkedKeys.value)
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
</style>
