<!-- 智能审核启用范围 -->
<template>
  <div class="container" v-if="isShowPage">
    <el-row :gutter="0" class="main-layout" :class="{ 'main-layout--left-collapsed': isLeftCollapsed }">
      <!-- 左侧：项目类型树 -->
      <el-col id="ai-audit-range-tree" :span="6" class="left-column">
        <el-card shadow="never" class="tree-list-card">
          <div class="panel-header">
            <div class="section-title">
              <i class="el-icon-folder-opened section-title__icon" aria-hidden="true"></i>
              项目类型
            </div>
          </div>
          <div class="search_panel" role="search" aria-label="搜索项目类型">
            <el-input placeholder="请输入项目类型名称" v-model="searchForm" clearable @clear="handleSearchClear" @keyup.enter="handleSearchEnter">
              <template #append>
                <button type="button" class="tree-search-button" aria-label="搜索项目类型" @click="handleSearchEnter">
                  <i class="el-icon-search" aria-hidden="true"></i>
                </button>
              </template>
            </el-input>
          </div>
          <div class="tree-list" v-loading="treeLoading">
            <div v-if="treeLoadError" class="tree-error" role="alert">
              <i class="el-icon-warning-outline tree-error__icon" aria-hidden="true"></i>
              <p>{{ treeLoadError }}</p>
              <el-button size="small" type="primary" @click="retryTreeLoad">重新加载</el-button>
            </div>
            <div v-else-if="xmlxList.length === 0" class="tree-error" role="status">
              <i class="el-icon-document tree-error__icon" aria-hidden="true"></i>
              <p>{{ searchForm.trim() ? '未找到匹配的项目类型' : '暂无项目类型' }}</p>
            </div>
            <el-tree
              v-else
              :highlight-current="true"
              :data="xmlxList"
              :props="defaultProps"
              :expand-on-click-node="false"
              :render-after-expand="true"
              node-key="id"
              :current-node-key="chooseNode || undefined"
              @node-click="handleNodeClick"
            />
          </div>
        </el-card>
      </el-col>

      <el-tooltip :content="isLeftCollapsed ? '展开项目类型' : '收起项目类型'" placement="right" effect="light">
        <button
          type="button"
          class="left-collapse-toggle"
          :aria-label="isLeftCollapsed ? '展开项目类型' : '收起项目类型'"
          :aria-expanded="!isLeftCollapsed"
          aria-controls="ai-audit-range-tree"
          @click="toggleLeftPanel"
        >
          <i class="el-icon-arrow-left left-collapse-toggle__icon" :class="{ 'is-collapsed': isLeftCollapsed }" aria-hidden="true"></i>
        </button>
      </el-tooltip>

      <!-- 右侧：范围列表 -->
      <el-col :span="18" class="right-column">
        <el-card shadow="never" class="detail-card">
          <div class="detail-header">
            <div class="detail-header__top">
              <div class="detail-header__meta">
                <div class="section-title">
                  <i class="el-icon-s-operation section-title__icon" aria-hidden="true"></i>
                  适用范围配置
                </div>
                <el-tag v-if="chooseNodeName" size="small" class="current-node-tag" effect="plain">
                  {{ chooseNodeName }}
                </el-tag>
                <span v-else class="current-node-placeholder">请选择左侧项目类型</span>
              </div>
            </div>
            <el-tabs v-model="activeTab" class="range-tabs">
              <el-tab-pane v-for="item in tabList" :key="item.code" :label="item.name" :name="item.code" />
            </el-tabs>
          </div>
          <div class="table-panel">
            <!-- 各页签表格按需挂载 + v-show：切换页签不销毁重建 -->
            <div v-show="activeTab === TAB_INUSE" class="table-pane">
              <RangeVxeTable
                v-if="mountedTabs[TAB_INUSE]"
                class="range-pro-table"
                @search="handleTableQuery"
                @reset="handleTableQuery"
                :pagination="true"
                :border="true"
                :tool-button="['setting', 'help']"
                :data-callback="callBackHandle"
                :request-api="getInusePageList"
                :request-auto="false"
                :columns="inuseColumns"
                row-click-mode="exclusive"
                ref="inuseTableRef"
                stripe
                row-key="rangeId"
                :loading="loading || actionLoading"
              >
                <template #tableHeader="scope">
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length !== 1 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'EDIT')"
                    type="primary"
                    >编 辑</el-button
                  >
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'BATCH_EDIT')"
                    type="primary"
                    >批量编辑</el-button
                  >
                  <el-button
                    v-permission="'DELETE'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    :loading="actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'DELETE')"
                    type="danger"
                    >删 除</el-button
                  >
                </template>
                <template #operation="{ row }">
                  <el-button class="row-edit-btn" v-permission="'EDIT'" size="small" :disabled="actionLoading" @click.stop="handleBtn([row], 'EDIT')">
                    编 辑
                  </el-button>
                </template>
              </RangeVxeTable>
            </div>

            <div v-show="activeTab === TAB_RULE" class="table-pane">
              <RangeVxeTable
                v-if="mountedTabs[TAB_RULE]"
                class="range-pro-table"
                @search="handleTableQuery"
                @reset="handleTableQuery"
                :pagination="true"
                :border="true"
                :tool-button="['setting', 'help']"
                :data-callback="callBackHandle"
                :request-api="getRulePageList"
                :request-auto="false"
                :columns="ruleColumns"
                row-click-mode="exclusive"
                ref="ruleTableRef"
                stripe
                row-key="proType"
                :loading="loading || actionLoading"
              >
                <template #tableHeader="scope">
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length !== 1 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'EDIT')"
                    type="primary"
                    >编 辑</el-button
                  >
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'BATCH_EDIT')"
                    type="primary"
                    >批量编辑</el-button
                  >
                  <el-button
                    v-permission="'DELETE'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    :loading="actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'DELETE')"
                    type="danger"
                    >删 除</el-button
                  >
                </template>
                <template #operation="{ row }">
                  <el-button class="row-edit-btn" v-permission="'EDIT'" size="small" :disabled="actionLoading" @click.stop="handleBtn([row], 'EDIT')">
                    编 辑
                  </el-button>
                </template>
              </RangeVxeTable>
            </div>

            <div v-show="activeTab === TAB_KNOWLEDGE" class="table-pane">
              <RangeVxeTable
                v-if="mountedTabs[TAB_KNOWLEDGE]"
                class="range-pro-table"
                @search="handleTableQuery"
                @reset="handleTableQuery"
                :pagination="true"
                :border="true"
                :tool-button="['setting', 'help']"
                :data-callback="callBackHandle"
                :request-api="getKnowledgePageList"
                :request-auto="false"
                :columns="knowledgeColumns"
                row-click-mode="exclusive"
                ref="knowledgeTableRef"
                stripe
                row-key="proType"
                :loading="loading || actionLoading"
              >
                <template #tableHeader="scope">
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length !== 1 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'EDIT')"
                    type="primary"
                    >编 辑</el-button
                  >
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'BATCH_EDIT')"
                    type="primary"
                    >批量编辑</el-button
                  >
                  <el-button
                    v-permission="'DELETE'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    :loading="actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'DELETE')"
                    type="danger"
                    >删 除</el-button
                  >
                </template>
                <template #operation="{ row }">
                  <el-button class="row-edit-btn" v-permission="'EDIT'" size="small" :disabled="actionLoading" @click.stop="handleBtn([row], 'EDIT')">
                    编 辑
                  </el-button>
                </template>
              </RangeVxeTable>
            </div>

            <div v-show="activeTab === TAB_SCHEMA" class="table-pane">
              <RangeVxeTable
                v-if="mountedTabs[TAB_SCHEMA]"
                class="range-pro-table"
                @search="handleTableQuery"
                @reset="handleTableQuery"
                :pagination="true"
                :border="true"
                :tool-button="['setting', 'help']"
                :data-callback="callBackHandle"
                :request-api="getSchemaPageList"
                :request-auto="false"
                :columns="schemaColumns"
                row-click-mode="exclusive"
                ref="schemaTableRef"
                stripe
                row-key="proType"
                :loading="loading || actionLoading"
              >
                <template #tableHeader="scope">
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length !== 1 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'EDIT')"
                    type="primary"
                    >编 辑</el-button
                  >
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'BATCH_EDIT')"
                    type="primary"
                    >批量编辑</el-button
                  >
                  <el-button
                    v-permission="'DELETE'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    :loading="actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'DELETE')"
                    type="danger"
                    >删 除</el-button
                  >
                </template>
                <template #operation="{ row }">
                  <el-button class="row-edit-btn" v-permission="'EDIT'" size="small" :disabled="actionLoading" @click.stop="handleBtn([row], 'EDIT')">
                    编 辑
                  </el-button>
                </template>
              </RangeVxeTable>
            </div>

            <div v-show="activeTab === TAB_SIMILARITY" class="table-pane">
              <RangeVxeTable
                v-if="mountedTabs[TAB_SIMILARITY]"
                class="range-pro-table"
                @search="handleTableQuery"
                @reset="handleTableQuery"
                :pagination="true"
                :border="true"
                :tool-button="['setting', 'help']"
                :data-callback="callBackHandle"
                :request-api="getSimilarityPageList"
                :request-auto="false"
                :columns="similarityColumns"
                row-click-mode="exclusive"
                ref="similarityTableRef"
                stripe
                row-key="proType"
                :loading="loading || actionLoading"
              >
                <template #tableHeader="scope">
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length !== 1 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'EDIT')"
                    type="primary"
                    >编 辑</el-button
                  >
                  <el-button
                    v-permission="'EDIT'"
                    :disabled="scope.selectedList.length === 0 || actionLoading"
                    size="mini"
                    @click="handleBtn(scope.selectedList, 'BATCH_EDIT')"
                    type="primary"
                    >批量编辑</el-button
                  >
                </template>
                <template #operation="{ row }">
                  <el-button class="row-edit-btn" v-permission="'EDIT'" size="small" :disabled="actionLoading" @click.stop="handleBtn([row], 'EDIT')">
                    编 辑
                  </el-button>
                </template>
              </RangeVxeTable>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <rangeModal v-if="modalsReady" ref="rangeModalRef" @search-handle="searchHandle" />
  <knowledgeModal v-if="modalsReady" ref="knowledgeModalRef" @search-handle="searchHandle" />
  <ruleModal v-if="modalsReady" ref="ruleModalRef" @search-handle="searchHandle" />
  <schemaModal v-if="modalsReady" ref="schemaModalRef" @search-handle="searchHandle" />
  <similarityModal v-if="modalsReady" ref="similarityModalRef" @search-handle="searchHandle" />
</template>

<script setup lang="ts" name="/suzhou/aiAuditInuseRange/index">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, onBeforeUnmount, onActivated, ref, reactive, nextTick, watch, defineAsyncComponent, shallowRef, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import { useStore } from 'vuex'
import { debounce } from 'lodash'
import { getSearchAllProType, getAllProtypeTree } from '@/api/service/expertinformation'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import {
  aiAuditGetPage,
  aiAuditRemove,
  aiAuditKnowledgeGet,
  aiAuditKnowledgeRemove,
  aiAuditRuleGet,
  aiAuditRuleRemove,
  schemaGetPage,
  schemaRemove,
  aiAuditSimilarityGet
} from '@/api/suzhou/aiAuditInuseRange'
import { getPublicData } from '@/api/common'

// 弹窗按需异步加载，降低首屏解析成本
const rangeModal = defineAsyncComponent(() => import('@/views/suzhou/aiAuditInuseRange/components/rangeModal/index.vue'))
const knowledgeModal = defineAsyncComponent(() => import('@/views/suzhou/aiAuditInuseRange/components/knowledgeModal/index.vue'))
const ruleModal = defineAsyncComponent(() => import('@/views/suzhou/aiAuditInuseRange/components/ruleModal/index.vue'))
const schemaModal = defineAsyncComponent(() => import('@/views/suzhou/aiAuditInuseRange/components/schemaModal/index.vue'))
const similarityModal = defineAsyncComponent(() => import('@/views/suzhou/aiAuditInuseRange/components/similarityModal/index.vue'))

const store = useStore()

// ========== 类型定义 ==========
interface TreeNode {
  id: string
  name: string
  children?: TreeNode[]
}

interface CodeItem {
  code: string
  name: string
}

interface SelectedRow {
  rangeId?: string
  proType?: string
  [key: string]: any
}

type OperationType = 'EDIT' | 'BATCH_EDIT' | 'DELETE'

/** 页签 code：1 启用范围 2 外包负面清单 3 适用审核规则 4 提取Schema 5 相似性要素 */
const TAB_INUSE = '1'
const TAB_KNOWLEDGE = '2'
const TAB_RULE = '3'
const TAB_SCHEMA = '4'
const TAB_SIMILARITY = '5'
const RANGE_TAB_CODE = 'AI_AUDIT_RANGE_TAB_COM'
/** 页签展示顺序（code 不变，仅排序） */
const TAB_DISPLAY_ORDER = [TAB_INUSE, TAB_RULE, TAB_KNOWLEDGE, TAB_SCHEMA, TAB_SIMILARITY]

const DEFAULT_TABS: CodeItem[] = [
  { code: TAB_INUSE, name: '启用范围' },
  { code: TAB_RULE, name: '适用审核规则' },
  { code: TAB_KNOWLEDGE, name: '外包负面清单' },
  { code: TAB_SCHEMA, name: '提取Schema' },
  { code: TAB_SIMILARITY, name: '相似性要素' }
]

/** 按约定展示顺序排序页签，未知 code 排在末尾并保持相对顺序 */
const sortTabsByDisplayOrder = (tabs: CodeItem[]): CodeItem[] => {
  return [...tabs].sort((a, b) => {
    const ia = TAB_DISPLAY_ORDER.indexOf(a.code)
    const ib = TAB_DISPLAY_ORDER.indexOf(b.code)
    const ra = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
    const rb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
    return ra - rb
  })
}

// ========== 响应式状态 ==========
const searchForm = ref('')
const chooseNode = ref<string>('')
const chooseNodeName = ref<string>('')
const isLeftCollapsed = ref(false)
const rangeModalRef = ref()
const knowledgeModalRef = ref()
const ruleModalRef = ref()
const schemaModalRef = ref()
const similarityModalRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
/** 首屏展示后再挂载弹窗，避免阻塞可交互 */
const modalsReady = ref(false)
const inuseTableRef = ref<any>(null)
const knowledgeTableRef = ref<any>(null)
const ruleTableRef = ref<any>(null)
const schemaTableRef = ref<any>(null)
const similarityTableRef = ref<any>(null)
const loading = ref(false)
const actionLoading = ref(false)
const treeLoading = ref(false)
const treeLoadError = ref('')
/** 树数据用 shallowRef，减少深层响应式开销 */
const xmlxList = shallowRef<TreeNode[]>([])
/** 全量树缓存，清空搜索时直接回填，避免重复请求 */
const fullTreeCache = shallowRef<TreeNode[] | null>(null)
const tabList = ref<CodeItem[]>([...DEFAULT_TABS])
const activeTab = ref(TAB_INUSE)
/** 页签对应表格按需挂载，首次进入后再常驻（v-show） */
const mountedTabs = reactive<Record<string, boolean>>({
  [TAB_INUSE]: true,
  [TAB_KNOWLEDGE]: false,
  [TAB_RULE]: false,
  [TAB_SCHEMA]: false,
  [TAB_SIMILARITY]: false
})
/** 树搜索请求序号，丢弃过期响应 */
let treeReqSeq = 0
/** 列表请求序号，丢弃过期响应，避免快速切节点/页签闪旧数据 */
const tableReqSeqByTab: Record<string, number> = {
  [TAB_INUSE]: 0,
  [TAB_KNOWLEDGE]: 0,
  [TAB_RULE]: 0,
  [TAB_SCHEMA]: 0,
  [TAB_SIMILARITY]: 0
}
/** 当前表格延迟布局任务，页面从 keep-alive 恢复时需等容器重新可见 */
let tableLayoutFrame = 0
/** 最近一次搜索关键字，用于去重 */
let lastTreeKeyword = ''
/** 各页签已按当前节点加载过的标记，避免重复点同一节点无效刷新时可扩展缓存策略 */
let lastLoadedNodeByTab: Record<string, string> = {
  [TAB_INUSE]: '',
  [TAB_KNOWLEDGE]: '',
  [TAB_RULE]: '',
  [TAB_SCHEMA]: '',
  [TAB_SIMILARITY]: ''
}

const defaultProps = markRaw({
  children: 'children',
  label: 'name'
})

// ========== 表格列配置（vxe-grid） ==========
const operationColumn = markRaw({
  field: 'operation',
  title: '操作',
  width: 88,
  fixed: 'right',
  align: 'center',
  slots: { default: 'operation' }
})

const inuseColumns = markRaw<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'proTypeName', title: '项目类型', width: 300 },
  { field: 'inuseTypeName', title: '启用类型', width: 180 },
  { field: 'yjdwNameList', title: '一级单位', minWidth: 180 },
  operationColumn
])

const knowledgeColumns = markRaw<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'proTypeName', title: '项目类型', width: 300 },
  { field: 'kbBizSubCatNameList', title: '知识库业务小类', minWidth: 220 },
  operationColumn
])

const ruleColumns = markRaw<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'proTypeName', title: '项目类型', width: 300 },
  { field: 'ruleNameList', title: '规则名称', minWidth: 280 },
  operationColumn
])

const schemaColumns = markRaw<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'proTypeName', title: '项目类型', width: 300 },
  { field: 'schemaNameList', title: '模版名称', minWidth: 280 },
  operationColumn
])

const similarityColumns = markRaw<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'proTypeName', title: '项目类型', width: 300 },
  { field: 'similarityJson', title: '相似性匹配', minWidth: 320, showOverflow: true },
  operationColumn
])

const getActiveTableRef = () => {
  if (activeTab.value === TAB_KNOWLEDGE) return knowledgeTableRef
  if (activeTab.value === TAB_RULE) return ruleTableRef
  if (activeTab.value === TAB_SCHEMA) return schemaTableRef
  if (activeTab.value === TAB_SIMILARITY) return similarityTableRef
  return inuseTableRef
}

const layoutActiveTable = async () => {
  await nextTick()
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
  tableLayoutFrame = requestAnimationFrame(() => {
    tableLayoutFrame = 0
    getActiveTableRef().value?.doLayout?.()
  })
}

const toggleLeftPanel = () => {
  isLeftCollapsed.value = !isLeftCollapsed.value
  nextTick(() => layoutActiveTable())
}

// ========== 表格相关 ==========
const reloadActiveTable = () => {
  const table = getActiveTableRef().value
  table?.clearSelection()
  table?.getTableList()
}

/** 查询/重置后只清理选择，避免重复请求 */
const handleTableQuery = () => {
  getActiveTableRef().value?.clearSelection()
}

const refreshTable = async (force = false) => {
  if (!chooseNode.value) return
  const tab = activeTab.value
  // 同节点 + 已加载过且非强制：跳过
  if (!force && lastLoadedNodeByTab[tab] === chooseNode.value) {
    return
  }
  if (!mountedTabs[tab]) {
    mountedTabs[tab] = true
  }
  await nextTick()
  loading.value = true
  getActiveTableRef().value?.getTableList()
}

/** 数据回调：仅透传，loading / 缓存标记在 wrap 内按请求序号处理，避免竞态 */
const callBackHandle = (data: any) => data

/**
 * 包装列表请求：
 * - 序号直接拒绝过期响应，阻止旧节点数据写入当前表格
 * - 按 tab 记录已加载节点，切换回同节点不重复请求
 */
const wrapTableRequest = (tab: string, apiCall: (params: any) => Promise<any>) => {
  return (params: any) => {
    const seq = ++tableReqSeqByTab[tab]
    const nodeAtRequest = chooseNode.value
    loading.value = true
    return apiCall(params)
      .then((res) => {
        if (seq !== tableReqSeqByTab[tab] || nodeAtRequest !== chooseNode.value) {
          throw new Error('STALE_TABLE_REQUEST')
        }
        lastLoadedNodeByTab[tab] = nodeAtRequest
        if (tab === activeTab.value) loading.value = false
        return res
      })
      .catch((err) => {
        if (seq === tableReqSeqByTab[tab] && tab === activeTab.value && nodeAtRequest === chooseNode.value) loading.value = false
        if ((err as Error)?.message !== 'STALE_TABLE_REQUEST' && seq === tableReqSeqByTab[tab] && tab === activeTab.value) {
          ElMessage.error((err as Error)?.message || '列表加载失败，请稍后重试')
        }
        throw err
      })
  }
}

const getInusePageList = wrapTableRequest(TAB_INUSE, (params: any) => aiAuditGetPage({ ...params, proType: chooseNode.value }))
const getKnowledgePageList = wrapTableRequest(TAB_KNOWLEDGE, (params: any) => aiAuditKnowledgeGet({ ...params, proType: chooseNode.value }))
const getRulePageList = wrapTableRequest(TAB_RULE, (params: any) => aiAuditRuleGet({ ...params, proType: chooseNode.value }))
const getSchemaPageList = wrapTableRequest(TAB_SCHEMA, (params: any) => schemaGetPage({ ...params, proType: chooseNode.value }))
const getSimilarityPageList = wrapTableRequest(TAB_SIMILARITY, (params: any) => aiAuditSimilarityGet({ ...params, proType: chooseNode.value }))

// ========== 树相关 ==========
/** 去掉空 children，避免末级节点仍被当成可展开而显示箭头 */
const normalizeTreeNodes = (nodes: TreeNode[] = []): TreeNode[] => {
  const result: TreeNode[] = new Array(nodes.length)
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const children = Array.isArray(node.children) ? node.children : []
    if (children.length === 0) {
      result[i] = { id: node.id, name: node.name }
    } else {
      result[i] = { id: node.id, name: node.name, children: normalizeTreeNodes(children) }
    }
  }
  return result
}

const fetchTreeData = async (keyword: string) => {
  const trimmed = keyword.trim()
  // 与上次相同关键字则跳过
  if (trimmed === lastTreeKeyword && xmlxList.value.length > 0) return
  lastTreeKeyword = trimmed

  const seq = ++treeReqSeq
  treeLoading.value = true
  treeLoadError.value = ''
  try {
    if (trimmed) {
      const res = await getSearchAllProType(trimmed)
      if (seq !== treeReqSeq) return
      if (!res.success || !Array.isArray(res.data)) throw new Error(res.msg || '搜索项目类型失败')
      xmlxList.value = normalizeTreeNodes(res.data)
    } else if (fullTreeCache.value) {
      // 命中全量缓存，零请求
      xmlxList.value = fullTreeCache.value
    } else {
      await loadTreeData(seq)
    }
  } catch (e) {
    if (seq === treeReqSeq) {
      treeLoadError.value = trimmed ? '搜索项目类型失败，请重试' : '项目类型加载失败，请重试'
    }
  } finally {
    if (seq === treeReqSeq) treeLoading.value = false
  }
}

const loadTreeData = async (seq?: number) => {
  const res = await getAllProtypeTree()
  if (seq != null && seq !== treeReqSeq) return
  if (res.success && Array.isArray(res.data)) {
    const tree = normalizeTreeNodes(res.data)
    fullTreeCache.value = tree
    xmlxList.value = tree
    lastTreeKeyword = ''
    treeLoadError.value = ''
    return
  }
  throw new Error(res.msg || '项目类型加载失败')
}

const retryTreeLoad = async () => {
  if (searchForm.value.trim()) {
    lastTreeKeyword = '__force__'
    await fetchTreeData(searchForm.value)
    return
  }
  const seq = ++treeReqSeq
  treeLoading.value = true
  treeLoadError.value = ''
  try {
    fullTreeCache.value = null
    await loadTreeData(seq)
  } catch {
    if (seq === treeReqSeq) treeLoadError.value = '项目类型加载失败，请重试'
  } finally {
    if (seq === treeReqSeq) treeLoading.value = false
  }
}

const handleNodeClick = (data: TreeNode) => {
  // 重复点击同一节点不刷新
  if (chooseNode.value === data.id) return
  chooseNode.value = data.id
  chooseNodeName.value = data.name
  // 换节点：清空各 tab 缓存标记，强制当前 tab 拉数
  lastLoadedNodeByTab = {
    [TAB_INUSE]: '',
    [TAB_KNOWLEDGE]: '',
    [TAB_RULE]: '',
    [TAB_SCHEMA]: '',
    [TAB_SIMILARITY]: ''
  }
  refreshTable(true)
}

const handleSearchClear = () => {
  searchForm.value = ''
  lastTreeKeyword = '__force__'
  fetchTreeData('')
}

const handleSearchEnter = () => {
  // 回车立即搜，取消 debounce 等待
  debouncedFetchTree.cancel()
  lastTreeKeyword = '__force__'
  fetchTreeData(searchForm.value)
}

// 输入防抖：避免每个字符都打接口 / 重建树
const debouncedFetchTree = debounce((keyword: string) => {
  fetchTreeData(keyword)
}, 300)

// ========== 页签公共代码 ==========
const loadTabList = async () => {
  try {
    const res = await getPublicData(RANGE_TAB_CODE)
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const tabs = res.data.map((item: any) => ({
        code: String(item.code),
        name: item.name
      }))
      if (!tabs.some((item: CodeItem) => item.code === TAB_SCHEMA)) {
        tabs.push({ code: TAB_SCHEMA, name: '提取Schema' })
      }
      if (!tabs.some((item: CodeItem) => item.code === TAB_SIMILARITY)) {
        tabs.push({ code: TAB_SIMILARITY, name: '相似性要素' })
      }
      tabList.value = sortTabsByDisplayOrder(tabs)
      const exists = tabList.value.some((item) => item.code === activeTab.value)
      if (!exists) {
        activeTab.value = tabList.value[0].code
      }
      // 默认页签标记为已挂载
      mountedTabs[activeTab.value] = true
      return
    }
  } catch (e) {
    console.error(e)
  }
  tabList.value = [...DEFAULT_TABS]
  activeTab.value = TAB_INUSE
  mountedTabs[TAB_INUSE] = true
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  const isQuery = userDialogRef.value?.isQuery
  if (!isQuery) return
  isShowPage.value = true
  treeLoading.value = true
  const [treeResult] = await Promise.allSettled([loadTreeData(), loadTabList()])
  treeLoading.value = false
  if (treeResult.status === 'rejected') treeLoadError.value = '项目类型加载失败，请重试'
  // 页面可交互后再挂弹窗，降低首屏压力
  requestAnimationFrame(() => {
    modalsReady.value = true
  })
}

// ========== 操作按钮 ==========
const getProTypeList = (selectedList: SelectedRow[]) => {
  return selectedList.map((item) => item.proType).filter(Boolean) as string[]
}

/** 兼容后端以数组、逗号分隔字符串返回关联 ID 的情况。 */
const normalizeIdList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (value == null || value === '') return []
  return String(value)
    .split(/[,，;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const openEditModal = async (selectedList: SelectedRow[], proTypeList: string[], isSingleEdit: boolean) => {
  // 确保异步弹窗已挂载
  if (!modalsReady.value) {
    modalsReady.value = true
    await nextTick()
  }
  const selectedRow = isSingleEdit ? selectedList[0] : undefined
  const modalType = isSingleEdit ? '编辑' : '批量编辑'
  if (activeTab.value === TAB_KNOWLEDGE) {
    // 单条编辑按关联 ID 回显；批量编辑保持空选择，避免把某一行配置覆盖到全部选中行。
    knowledgeModalRef.value?.acceptParams({
      type: modalType,
      searchParams: {
        proTypeList,
        selectedIds: normalizeIdList(selectedRow?.kbIdList),
        selectedNames: isSingleEdit ? String(selectedRow?.kbBizSubCatNameList || '').trim() : ''
      }
    })
    return
  }
  if (activeTab.value === TAB_RULE) {
    ruleModalRef.value?.acceptParams({
      type: modalType,
      searchParams: {
        proTypeList,
        selectedIds: normalizeIdList(selectedRow?.ruleIdList),
        selectedNames: isSingleEdit ? String(selectedRow?.ruleNameList || '').trim() : ''
      }
    })
    return
  }
  if (activeTab.value === TAB_SCHEMA) {
    const userMsg = userDialogRef.value?.userMsg || {}
    schemaModalRef.value?.acceptParams({
      type: modalType,
      searchParams: {
        proTypeList,
        selectedIds: normalizeIdList(selectedRow?.schemaIdList),
        selectedNames: isSingleEdit ? String(selectedRow?.schemaNameList || '').trim() : '',
        roleContext: {
          bmId: userMsg.specialorgid || userDialogRef.value?.specialorgid || '',
          dwId: userMsg.org_id || '',
          roleCode: userMsg.code || userDialogRef.value?.roleCode || '',
          roleId: userMsg.role_id || userMsg.id || '',
          userId: store.getters.getUserMsg?.id || ''
        }
      }
    })
    return
  }
  if (activeTab.value === TAB_SIMILARITY) {
    similarityModalRef.value?.acceptParams({
      type: modalType,
      searchParams: {
        proTypeList,
        similarityJson: isSingleEdit ? String(selectedRow?.similarityJson || '') : ''
      }
    })
    return
  }
  rangeModalRef.value?.acceptParams({
    searchParams: {
      proType: chooseNode.value,
      proTypeList,
      inuseType: isSingleEdit ? String(selectedRow?.inuseType ?? '') : '',
      yjdwList: isSingleEdit ? normalizeIdList(selectedRow?.yjdwList) : []
    },
    type: modalType
  })
}

const handleBtn = async (selectedList: SelectedRow[], type: OperationType) => {
  if (actionLoading.value) return
  if (!chooseNode.value) return ElMessage.warning('请选择项目类型！')
  if ((type === 'DELETE' || type === 'EDIT' || type === 'BATCH_EDIT') && selectedList.length === 0) return ElMessage.warning('请选择数据！')
  if (type === 'EDIT' && selectedList.length !== 1) return ElMessage.warning('请选择一条数据！')
  const proTypeList = getProTypeList(selectedList)
  if (proTypeList.length === 0) return ElMessage.warning('请选择数据！')

  if (type === 'EDIT' || type === 'BATCH_EDIT') {
    await openEditModal(selectedList, proTypeList, type === 'EDIT')
    return
  }

  let confirmResult: string
  try {
    confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', {
      status: 'warning'
    })
  } catch {
    return
  }
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  actionLoading.value = true
  try {
    let res: any
    if (activeTab.value === TAB_KNOWLEDGE) {
      res = await aiAuditKnowledgeRemove([...proTypeList])
    } else if (activeTab.value === TAB_RULE) {
      res = await aiAuditRuleRemove([...proTypeList])
    } else if (activeTab.value === TAB_SCHEMA) {
      res = await schemaRemove([...proTypeList])
    } else {
      res = await aiAuditRemove([...proTypeList])
    }
    if (!res.success) return ElMessage.error(res.msg || '删除失败，请稍后重试')
    ElMessage.success('删除成功！')
    lastLoadedNodeByTab[activeTab.value] = ''
    reloadActiveTable()
  } catch (error) {
    ElMessage.error((error as Error)?.message || '删除失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

const searchHandle = (val: any) => {
  if (!val) return
  lastLoadedNodeByTab[activeTab.value] = ''
  reloadActiveTable()
}

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})

// 路由页签由 keep-alive 缓存，返回时 activeTab 不变，需要主动恢复隐藏期间失效的表格尺寸
onActivated(() => {
  layoutActiveTable()
})

onBeforeUnmount(() => {
  debouncedFetchTree.cancel()
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
})

watch(searchForm, (newValue) => {
  debouncedFetchTree(newValue)
})

// 切换页签：首次挂载表格，已挂载则优先用本地缓存（同节点不重复请求）
watch(activeTab, async (tab) => {
  if (!mountedTabs[tab]) {
    mountedTabs[tab] = true
    await nextTick()
    // 首次挂载必须拉数
    if (chooseNode.value) {
      loading.value = true
      getActiveTableRef().value?.getTableList()
    }
    return
  }
  // v-show 显示后补一次 layout，避免隐藏态下列宽异常
  await layoutActiveTable()
  // 已挂载且节点未变：不请求；节点已变则补拉
  if (chooseNode.value && lastLoadedNodeByTab[tab] !== chooseNode.value) {
    loading.value = true
    getActiveTableRef().value?.getTableList()
  }
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
