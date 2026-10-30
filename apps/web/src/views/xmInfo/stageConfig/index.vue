<!-- 全流程节点配置 -->
<template>
  <div class="container" v-if="isShowPage">
    <el-row :gutter="0" class="main-layout" :class="{ 'main-layout--left-collapsed': isLeftCollapsed }">
      <!-- 左侧：方案目录 -->
      <el-col id="ai-audit-range-tree" :span="6" class="left-column">
        <el-card shadow="never" class="tree-list-card">
          <div class="panel-header">
            <div class="section-title">
              <i class="el-icon-folder-opened section-title__icon" aria-hidden="true"></i>
              方案目录
            </div>
            <div class="panel-header__actions">
              <i
                class="el-icon-plus section-title__icon section-title__icon--action"
                v-permission="'ADDML'"
                aria-hidden="true"
                title="新增方案"
                @click="handlePlusClick"
              />
              <i
                class="el-icon-set-up section-title__icon section-title__icon--action"
                v-permission="'EDIT'"
                aria-hidden="true"
                title="步骤管理"
                @click="handleStepManage"
              />
              <i class="el-icon-refresh section-title__icon section-title__icon--action" aria-hidden="true" title="刷新" @click="handleRefreshTree" />
            </div>
          </div>
          <div class="tree-list">
            <div v-if="treeLoadError" class="tree-error" role="alert">
              <i class="el-icon-warning-outline tree-error__icon" aria-hidden="true"></i>
              <p>{{ treeLoadError }}</p>
              <el-button size="small" type="primary" @click="retryTreeLoad">重新加载</el-button>
            </div>
            <el-tree
              v-else
              ref="treeRef"
              :highlight-current="true"
              :props="defaultProps"
              :expand-on-click-node="false"
              node-key="id"
              :data="treeData"
              :current-node-key="chooseNode || undefined"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <span class="tree-node">
                  <i class="el-icon-folder tree-node__icon" aria-hidden="true"></i>
                  <span class="tree-node__label" :title="node.label">{{ `${node.label}` }}</span>
                  <span class="tree-node__actions" @click.stop>
                    <i
                      class="el-icon-connection tree-node__action"
                      title="关联步骤"
                      v-permission="'GLBZ'"
                      @click="handleTreeNodeLink(node, data)"
                    ></i>
                    <i class="el-icon-edit tree-node__action" title="编辑方案" v-permission="'EDIT'" @click="handleTreeNodeEdit(node, data)"></i>
                    <i
                      class="el-icon-delete tree-node__action tree-node__action--danger"
                      v-permission="'DELETE'"
                      title="删除方案"
                      @click="handleTreeNodeDelete(node, data)"
                    ></i>
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-card>
      </el-col>
      <!-- 右侧：步骤列表（只展示选中方案的已关联步骤） -->
      <el-col :span="18" class="right-column">
        <el-card shadow="never" class="detail-card">
          <div class="detail-header">
            <div class="detail-header__top">
              <div class="detail-header__button">
                <div class="detail-header__meta">
                  <div class="section-title">
                    <i class="el-icon-document section-title__icon" aria-hidden="true"></i>
                    步骤列表
                  </div>
                  <span v-if="currentNodeLabel" class="current-node-tag" :title="currentNodeLabel">{{ currentNodeLabel }}</span>
                  <span v-else class="current-node-placeholder">请选择左侧方案</span>
                </div>
                <el-input
                  style="width: 260px"
                  clearable
                  placeholder="输入步骤名称进行过滤"
                  v-model.trim="attachName"
                  @clear="handleSearch"
                  @keyup.enter="handleSearch"
                >
                  <template #append>
                    <i class="el-icon-search" @click="handleSearch" style="color: var(--color-primary); cursor: pointer"></i>
                  </template>
                </el-input>
              </div>
            </div>
          </div>
          <div class="table-panel">
            <RangeVxeTableStyle
              class="range-pro-table"
              :pagination="true"
              :border="true"
              :tool-button="['setting', 'help']"
              :data-callback="callBackHandle"
              :request-api="getInusePageList"
              :request-auto="false"
              :columns="inuseColumns"
              row-click-mode="none"
              ref="inuseTableRef"
              stripe
              row-key="id"
              :loading="loading"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <directoryModal v-if="modalsReady" ref="directoryModalRef" @success="handleDirectorySave" />
  <linkModal v-if="modalsReady" ref="linkModalRef" @success="handleLinkSave" />
  <stepManageModal v-if="modalsReady" ref="stepManageModalRef" @success="handleStepManageChange" />
</template>

<script setup lang="ts">
defineOptions({ name: "/xmInfo/stageConfig/index" })
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, onBeforeUnmount, onActivated, ref, nextTick, defineAsyncComponent, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { useStore } from '@/store/business'
import RangeVxeTableStyle from '@/components/RangeVxeTableStyle/index.vue'
import { configGetPage, configSaveOrUpdate, configDelete, getAlreadyLinkProcess } from '@/api/xmInfo/stageConfig'

// 弹窗按需异步加载，降低首屏解析成本
const directoryModal = defineAsyncComponent(() => import('@/views/xmInfo/stageConfig/components/directoryModal/index.vue'))
const linkModal = defineAsyncComponent(() => import('@/views/xmInfo/stageConfig/components/linkModal/index.vue'))
const stepManageModal = defineAsyncComponent(() => import('@/views/xmInfo/stageConfig/components/stepManageModal/index.vue'))

const store = useStore()

// ========== 类型定义 ==========
interface TreeNode {
  id: string
  name: string
  code?: string
  children?: TreeNode[]
  isLeaf?: boolean
}

// ========== 响应式状态 ==========
const countInfo = ref<any>()
const attachName = ref<string>('')
const chooseNode = ref<string>('')
/** 当前选中方案名称，用于右侧标题展示 */
const currentNodeLabel = ref<string>('')
const isLeftCollapsed = ref(false)
const userDialogRef = ref()
const isShowPage = ref(false)
/** 首屏展示后再挂载弹窗，避免阻塞可交互 */
const modalsReady = ref(false)
const inuseTableRef = ref<any>(null)
const directoryModalRef = ref()
const linkModalRef = ref()
const stepManageModalRef = ref()
const treeRef = ref<any>(null)
const loading = ref(false)
const actionLoading = ref(false)
const treeLoadError = ref('')
/** 根节点数据（一次性加载，单层树） */
const treeData = ref<TreeNode[]>([])
/** 列表请求序号，丢弃过期响应，避免快速切节点闪旧数据 */
let tableReqSeq = 0
/** 当前表格延迟布局任务，页面从 keep-alive 恢复时需等容器重新可见 */
let tableLayoutFrame = 0

const defaultProps = markRaw({
  label: 'name'
})

// ========== 表格列配置（vxe-grid） ==========
const operationTypeMap = markRaw<Record<string, string>>({ '1': '普通操作', '2': '工作流审批', '3': '评审意见' })
const pslxMap = markRaw<Record<string, string>>({ '1': '外围系统评审', '2': '联合会审评审', '3': '省专业预审退回', '4': '省财务、发展线下会审' })
const yjclbmTypeMap = markRaw<Record<string, string>>({ '1': '直接获取', '2': '通过脚本获取' })

const inuseColumns = markRaw<any[]>([
  { type: 'seq', width: 50, title: '序号' },
  { field: 'groupCode', title: '环节编码', width: 120 },
  { field: 'groupName', title: '环节名称', width: 150 },
  { field: 'code', title: '步骤编号', width: 100 },
  { field: 'name', title: '步骤名称', minWidth: 300 },
  { field: 'operationRole', title: '操作角色', width: 150 },
  { field: 'operationRoleCode', title: '角色编码', width: 150 },
  {
    field: 'yjclbmType',
    title: '预计处理部门获取方式',
    width: 160,
    formatter: ({ cellValue }: any) => yjclbmTypeMap[String(cellValue)] || cellValue || '-'
  },
  { field: 'yjclbm', title: '预计处理部门', minWidth: 200 },
  {
    field: 'operationType',
    title: '操作类型',
    width: 150,
    formatter: ({ cellValue }: any) => {
      if (cellValue == null || cellValue === '') return '-'
      return String(cellValue)
        .split(',')
        .map((v: string) => operationTypeMap[v.trim()] || v.trim())
        .filter(Boolean)
        .join('、')
    }
  },
  {
    field: 'pslx',
    title: '评审类型',
    width: 150,
    formatter: ({ cellValue }: any) => pslxMap[String(cellValue)] || cellValue || '-'
  },
  { field: 'mainCode', title: '关键操作节点', width: 150 },
  { field: 'wfCode', title: '流程编码', width: 150 },
  { field: 'wfNodeCode', title: '流程节点编码', width: 150 },
  { field: 'opeartionDes', title: '普通业务操作说明', minWidth: 300, headerAlign: 'center', align: 'left' },
  { field: 'remark', title: '说明', minWidth: 300, headerAlign: 'center', align: 'left' },
  { field: 'sortCode', title: '排序', minWidth: 150 },
  { field: 'flowStatus', title: '状态', minWidth: 150 }
])

const layoutActiveTable = async () => {
  await nextTick()
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
  tableLayoutFrame = requestAnimationFrame(() => {
    tableLayoutFrame = 0
    inuseTableRef.value?.doLayout?.()
  })
}

// ========== 表格相关 ==========
const refreshTable = () => {
  if (!chooseNode.value) return
  inuseTableRef.value?.getTableList()
}

/** 步骤名称搜索：重置到第一页并重新拉取 */
const handleSearch = () => {
  inuseTableRef.value?.clearSelection()
  inuseTableRef.value?.getTableList()
}

/** 数据回调：仅透传 */
const callBackHandle = (data: any) => data

/**
 * 列表请求：拉取当前选中方案已关联的步骤。
 * getAlreadyLinkProcess 返回全量列表（无服务端分页），此处按步骤名称本地过滤 + 本地分页。
 * - 序号直接拒绝过期响应，阻止旧节点数据写入当前表格
 */
const getInusePageList = (params: any) => {
  const seq = ++tableReqSeq
  const nodeAtRequest = chooseNode.value
  loading.value = true
  const current = Number(params?.page) || 1
  const size = Number(params?.limit) || Number(params?.size) || 100
  return getAlreadyLinkProcess({ dataId: nodeAtRequest })
    .then((res: any) => {
      if (seq !== tableReqSeq || nodeAtRequest !== chooseNode.value) {
        throw new Error('STALE_TABLE_REQUEST')
      }
      loading.value = false
      const raw = res?.data
      let records: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.records) ? raw.records : []
      // 步骤名称本地过滤
      const kw = attachName.value.trim().toLowerCase()
      if (kw) {
        records = records.filter((r) => (r?.name || '').toLowerCase().includes(kw) || (r?.code || '').toLowerCase().includes(kw))
      }
      const start = (current - 1) * size
      const pageRecords = records.slice(start, start + size)
      return { ...res, data: { records: pageRecords, total: records.length, current, size } }
    })
    .catch((err: any) => {
      if (seq === tableReqSeq && nodeAtRequest === chooseNode.value) loading.value = false
      if ((err as Error)?.message !== 'STALE_TABLE_REQUEST' && seq === tableReqSeq) {
        ElMessage.error((err as Error)?.message || '列表加载失败，请稍后重试')
      }
      throw err
    })
}

// ========== 树相关（一次性加载单层根节点） ==========
/**
 * 一次性拉取根节点目录列表。
 * 树实际只有一层，无需懒加载 / 递归展开。
 */
const loadTreeData = async () => {
  try {
    const res = await configGetPage({ page: 1, limit: 1000 })
    if (!res.success) {
      treeLoadError.value = res.msg || '文件目录加载失败'
      treeData.value = []
      return
    }
    treeLoadError.value = ''
    treeData.value = Array.isArray(res.data.records) ? res.data.records : []
  } catch (e) {
    treeLoadError.value = (e as Error)?.message || '文件目录加载失败，请稍后重试'
    treeData.value = []
  }
}

/** 重新加载整棵树（删除/新增/刷新后调用） */
const reloadTree = () => {
  loadTreeData()
}

const retryTreeLoad = () => {
  treeLoadError.value = ''
  reloadTree()
}

/** 刷新：重新拉取根节点 */
const handleRefreshTree = () => {
  reloadTree()
}

const handleNodeClick = (data: TreeNode) => {
  // 重复点击同一节点不刷新
  if (chooseNode.value === data.id) return
  chooseNode.value = data.id
  currentNodeLabel.value = data.name || ''
  refreshTable()
}

/** 顶部「+」：新增目录 */
const handlePlusClick = () => {
  directoryModalRef.value?.acceptParams({})
}
/** 顶部「步骤管理」：打开步骤管理弹窗（步骤增删改查集中于此） */
const handleStepManage = () => {
  stepManageModalRef.value?.acceptParams()
}
/** 步骤管理弹窗保存/删除成功后：若当前已选中方案，刷新右侧关联步骤列表 */
const handleStepManageChange = () => {
  if (chooseNode.value) refreshTable()
}
/** 树节点关联步骤：打开关联弹窗 */
const handleTreeNodeLink = (_node: any, data: TreeNode) => {
  linkModalRef.value?.acceptParams({ id: data.id, name: data.name })
}
/** 树节点编辑：编辑方案 */
const handleTreeNodeEdit = (_node: any, data: TreeNode) => {
  directoryModalRef.value?.acceptParams({
    id: data.id,
    code: data.code,
    name: data.name
  })
}

/** 树节点删除 */
const handleTreeNodeDelete = async (_node: any, data: TreeNode) => {
  try {
    const type = await VXETable.modal.confirm('确定删除该目录吗？', '提示', { status: 'warning' })
    if (type !== 'confirm') {
      ElMessage.info('已取消')
      return
    }
  } catch {
    return
  }
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await configDelete({ ids: [data.id] })
    if (res.success) {
      ElMessage.success('删除成功')
      // 删除的是当前选中节点：清空表格
      if (chooseNode.value === data.id) {
        chooseNode.value = ''
        currentNodeLabel.value = ''
        inuseTableRef.value?.clearSelection?.()
      }
      reloadTree()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '删除失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

/** 目录新增/编辑保存回调 */
const handleDirectorySave = async (params: { id?: string; code: string; name: string }) => {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await configSaveOrUpdate(params)
    if (res.success) {
      ElMessage.success('保存成功')
      reloadTree()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '保存失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

/** 关联步骤保存回调：关联变更无需刷新树 */
const handleLinkSave = () => {}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  const isQuery = userDialogRef.value?.isQuery
  if (!isQuery) return
  isShowPage.value = true
  // 页面可交互后再挂弹窗，降低首屏压力
  requestAnimationFrame(() => {
    modalsReady.value = true
  })
  // 加载左侧树根节点
  await nextTick()
  loadTreeData()
}

// ========== 生命周期 ==========
onMounted(async () => {
  countInfo.value = { ...store.getters.getUserMsg }
  await userDialogRef.value?.getUser()
})

// 路由页签由 keep-alive 缓存，返回时需要主动恢复隐藏期间失效的表格尺寸
onActivated(() => {
  layoutActiveTable()
})

onBeforeUnmount(() => {
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
})
</script>

<style scoped lang="less">
.detail-header__button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
@import 'css/index.less';
</style>
