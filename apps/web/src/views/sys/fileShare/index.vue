<!-- 文件目录与文件分享 -->
<template>
  <div class="container" v-show="isShowPage">
    <el-row ref="mainLayoutRef" :gutter="0" class="main-layout" :class="{ 'main-layout--left-collapsed': isLeftCollapsed }">
      <!-- 左侧：文件目录树 -->
      <el-col id="ai-audit-range-tree" :span="6" class="left-column" :style="leftColStyle">
        <el-card shadow="never" class="tree-list-card">
          <div class="panel-header">
            <div class="section-title">
              <i class="el-icon-folder-opened section-title__icon" aria-hidden="true"></i>
              文件目录
            </div>
            <div class="panel-header__actions">
              <el-select v-model="dirStatus" size="small" class="dir-status-filter" title="按生效/失效筛选目录" @change="handleStatusChange">
                <el-option v-for="opt in statusOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
              </el-select>
              <i
                class="el-icon-plus section-title__icon section-title__icon--action"
                v-permission="'ADDML'"
                aria-hidden="true"
                title="新增目录"
                @click="handlePlusClick"
              />
              <i
                class="el-icon-sort section-title__icon section-title__icon--action"
                aria-hidden="true"
                title="一键展开/收起"
                @click="handleExpandAll"
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
              :current-node-key="chooseNode || undefined"
              lazy
              :load="loadNode"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <span class="tree-node">
                  <i :class="data.leaf === '1' ? 'el-icon-document' : 'el-icon-folder'" class="tree-node__icon" aria-hidden="true"></i>
                  <span class="tree-node__label" :title="node.label">{{ `${node.label}(${data.attachNum || 0})` }}</span>
                  <span class="tree-node__actions" @click.stop>
                    <i class="el-icon-plus tree-node__action" title="新增目录" v-permission="'ADD'" @click="handleTreeNodePLUS(node, data)"></i>
                    <i class="el-icon-edit tree-node__action" title="编辑目录" v-permission="'EDIT'" @click="handleTreeNodeEdit(node, data)"></i>
                    <i
                      class="el-icon-delete tree-node__action tree-node__action--danger"
                      v-permission="'DELETE'"
                      title="删除目录"
                      @click="handleTreeNodeDelete(node, data)"
                    ></i>
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-card>
      </el-col>
      <!-- 左右拖拽分隔条 -->
      <div
        class="split-resizer"
        @pointerdown.prevent="onResizerDown"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整左右栏宽度"
        title="拖拽调整宽度，双击手柄恢复默认"
      >
        <span class="split-resizer__handle" @dblclick.stop="resetSplit"></span>
      </div>
      <!-- 右侧：文件列表 -->
      <el-col :span="18" class="right-column">
        <el-card shadow="never" class="detail-card">
          <div class="detail-header">
            <div class="detail-header__top">
              <div class="detail-header__meta">
                <div class="section-title">
                  <i class="el-icon-document section-title__icon" aria-hidden="true"></i>
                  文件列表
                </div>
                <el-tag v-if="chooseNodeName" size="small" class="current-node-tag" effect="plain">
                  {{ chooseNodeName }}
                </el-tag>
                <span v-else class="current-node-placeholder">请选择左侧文件目录</span>
              </div>
            </div>
          </div>
          <div class="table-panel">
            <!-- 搜索区 -->
            <div class="file-search-form" v-show="isShowSearch">
              <el-form :model="searchParam" size="small" label-width="80px" class="search-form-inner">
                <el-row :gutter="16">
                  <el-col :span="6">
                    <el-form-item label="文件标题">
                      <el-input v-model="searchParam.attachName" clearable placeholder="文件标题" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="发文年份">
                      <el-date-picker
                        v-model="searchParam.fwYear"
                        type="year"
                        value-format="YYYY"
                        format="YYYY"
                        clearable
                        placeholder="发文年份"
                        class="full-width"
                        @change="handleYearChange"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="发文日期起">
                      <el-date-picker
                        v-model="searchParam.fwsjStart"
                        type="date"
                        value-format="YYYY-MM-DD"
                        format="YYYY-MM-DD"
                        clearable
                        :disabled-date="fwsjDisabledDate"
                        placeholder="发文日期起"
                        class="full-width"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="发文日期止">
                      <el-date-picker
                        v-model="searchParam.fwsjEnd"
                        type="date"
                        value-format="YYYY-MM-DD"
                        format="YYYY-MM-DD"
                        clearable
                        :disabled-date="fwsjDisabledDate"
                        placeholder="发文日期止"
                        class="full-width"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="6">
                    <el-form-item label="专业">
                      <el-select v-model="searchParam.major" clearable filterable placeholder="专业" class="full-width">
                        <el-option v-for="opt in majorOptions" :key="opt.code" :label="opt.name" :value="opt.code" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="文件字号">
                      <el-input v-model="searchParam.wjzh" clearable placeholder="文件字号" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6"></el-col>
                  <el-col :span="6" class="search-actions">
                    <el-form-item>
                      <el-button type="primary" size="small" @click="handleSearch">查 询</el-button>
                      <el-button plain size="small" @click="handleReset">重 置</el-button>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
            <!-- vxe-grid：toolbarConfig { custom: true } -->
            <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents" class="range-pro-table">
              <template #checkbox="{ row }">
                <template v-if="row._isGroupHeader">
                  <div class="group-header-content">
                    <i class="el-icon-arrow-right group-toggle-icon" :class="{ 'is-collapsed': row._collapsed }"></i>
                    <span class="group-label">{{ row._groupLabel }}</span>
                  </div>
                </template>
                <el-checkbox v-else :model-value="selectedIdSet.has(row.id)" @change="(val: any) => toggleRowSelection(row, !!val)" />
              </template>
              <template #header_checkbox>
                <el-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate" @change="(val: any) => toggleSelectAll(!!val)" />
              </template>
              <template #toolbar_actions>
                <vxe-button
                  v-permission="'UPLOAD'"
                  size="small"
                  status="primary"
                  icon="el-icon-upload"
                  @click="uploadHandle"
                  class="upload-btn pulse"
                  style="width: 120px; margin-right: 10px"
                >
                  文件上传
                </vxe-button>
                <el-button
                  v-permission="'PLFB'"
                  :disabled="!isSelected"
                  plain
                  size="small"
                  type="primary"
                  @click="handleBatchStatus(selectedList, '0')"
                >
                  批量生效
                </el-button>
                <el-button
                  v-permission="'PLSX'"
                  :disabled="!isSelected"
                  plain
                  size="small"
                  type="primary"
                  @click="handleBatchStatus(selectedList, '1')"
                >
                  批量失效
                </el-button>
              </template>
              <template #status="{ row }">
                <el-tag size="small" :type="row.status === '0' ? 'success' : 'info'" effect="plain">
                  {{ row.statusName }}
                </el-tag>
              </template>
              <template #operation="{ row }">
                <el-tooltip content="预览文件" placement="top">
                  <i class="el-icon-view row-action-icon" @click="handlePreview(row)"></i>
                </el-tooltip>
                <el-tooltip content="编辑文件" placement="top">
                  <i class="el-icon-edit row-action-icon" @click="handleEditRemark(row)" v-permission="'EDITBZ'"></i>
                </el-tooltip>
                <el-tooltip content="删除文件" placement="top">
                  <i class="el-icon-delete row-action-icon row-action-icon--danger" @click="handleDeleteFile(row)" v-permission="'DELETEFILE'"></i>
                </el-tooltip>
              </template>
            </vxe-grid>
            <el-pagination
              v-if="pagination"
              background
              :current-page="pageable.current"
              :page-size="pageable.size"
              :page-sizes="pageSizes"
              :total="pageable.total"
              :pager-count="5"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <remarkModal v-if="modalsReady" ref="remarkModalRef" @success="handleRemarkSave" />
  <directoryModal v-if="modalsReady" ref="directoryModalRef" @success="handleDirectorySave" />
  <previewModal v-if="modalsReady" ref="previewModalRef" />
</template>

<script setup lang="ts">
defineOptions({ name: "/sys/fileShare/index" })
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, onBeforeUnmount, onActivated, ref, computed, nextTick, defineAsyncComponent, markRaw, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridInstance, VxeGridProps, VxeGridListeners } from 'vxe-table'
import { useStore } from '@/store/business'
import { apiExporFile } from '@/utils/export'
import {
  getChildDirectory,
  addDirectory,
  deleteDirectory,
  getAttachByDirectory,
  editAttach,
  deleteAttachFromDirectory,
  uploadAttachToDirectory,
  downloadAttach,
  batchUpdateAttachStatus
} from '@/api/sys/fileShare'
import { getPublicData } from '@/api/common'

// 弹窗按需异步加载，降低首屏解析成本
const remarkModal = defineAsyncComponent(() => import('@/views/sys/fileShare/components/remarkModal/index.vue'))
const directoryModal = defineAsyncComponent(() => import('@/views/sys/fileShare/components/directoryModal/index.vue'))
const previewModal = defineAsyncComponent(() => import('@/views/sys/fileShare/components/previewModal/index.vue'))

const store = useStore()

// ========== 类型定义 ==========
interface TreeNode {
  id: string
  name: string
  directoryName?: string
  leaf?: string
  children?: TreeNode[]
  isLeaf?: boolean
}

interface AttachRow {
  id: string
  attachName?: string
  remark?: string
  uuid?: string
  [key: string]: any
}

// ========== 响应式状态 ==========
const countInfo = ref<any>()
const chooseNode = ref<string>('')
const chooseNodeName = ref<string>('')
const isLeftCollapsed = ref(false)
const userDialogRef = ref()
const isShowPage = ref(false)
/** 首屏展示后再挂载弹窗，避免阻塞可交互 */
const modalsReady = ref(false)
const gridRef = ref<VxeGridInstance>()
const remarkModalRef = ref()
const directoryModalRef = ref()
const previewModalRef = ref()
const uploadRef = ref<any>(null)
const treeRef = ref<any>(null)
const loading = ref(false)
const actionLoading = ref(false)
const treeLoadError = ref('')
/** 一键展开/刷新进行中标记，防止重复触发 */
const treeExpanding = ref(false)
/** 列表请求序号，丢弃过期响应，避免快速切节点闪旧数据 */
let tableReqSeq = 0
/** 当前表格延迟布局任务，页面从 keep-alive 恢复时需等容器重新可见 */
let tableLayoutFrame = 0

// ========== 搜索 / 分页 / 勾选状态 ==========
const isShowSearch = ref(true)
const searchParam = reactive<Record<string, any>>({})
const pagination = ref(true)
const pageSizes = [20, 50, 100, 200]
const pageable = reactive({ current: 1, size: 100, total: 0 })
const selectedList = ref<any[]>([])
const isSelected = computed(() => selectedList.value.length > 0)
const majorOptions = ref<any[]>([])
const fwdwOptions = ref<any[]>([])

// ========== 分组展开/收起 ==========
/** 已收起的分组 key 集合（key = fwdwName） */
const collapsedGroups = ref<Set<string>>(new Set())

/** 切换分组展开/收起 */
const toggleGroup = (groupKey: string) => {
  const next = new Set(collapsedGroups.value)
  if (next.has(groupKey)) {
    next.delete(groupKey)
  } else {
    next.add(groupKey)
  }
  collapsedGroups.value = next
  rebuildTableData()
}

// ========== 自建选中状态管理 ==========
/** 选中行的 id 集合（跨分组、仅当前页数据行） */
const selectedIdSet = ref<Set<string>>(new Set())

/** 当前页所有数据行（不含分组行） */
const currentPageRows = computed(() => (gridOptions.data as any[]).filter((r) => !r._isGroupHeader))

/** 是否全选 */
const isAllSelected = computed(() => {
  const rows = currentPageRows.value
  if (!rows.length) return false
  return rows.every((r) => selectedIdSet.value.has(r.id))
})

/** 是否半选 */
const isIndeterminate = computed(() => {
  const rows = currentPageRows.value
  if (!rows.length) return false
  const selected = rows.filter((r) => selectedIdSet.value.has(r.id))
  return selected.length > 0 && selected.length < rows.length
})

/** 单行勾选切换 */
const toggleRowSelection = (row: any, checked: boolean) => {
  const next = new Set(selectedIdSet.value)
  if (checked) {
    next.add(row.id)
  } else {
    next.delete(row.id)
  }
  selectedIdSet.value = next
  syncSelectedList()
}

/** 全选/取消全选（当前页数据行） */
const toggleSelectAll = (checked: boolean) => {
  const next = new Set(selectedIdSet.value)
  if (checked) {
    currentPageRows.value.forEach((r) => next.add(r.id))
  } else {
    currentPageRows.value.forEach((r) => next.delete(r.id))
  }
  selectedIdSet.value = next
  syncSelectedList()
}

/** 同步 selectedList ref（供批量操作按钮使用） */
const syncSelectedList = () => {
  const idSet = selectedIdSet.value
  selectedList.value = currentPageRows.value.filter((r) => idSet.has(r.id))
}

// ========== 文件列表查询条件 ==========
/** 发文年份默认值（当年） */
const currentYear = String(new Date().getFullYear())

/** 读取 searchParam 中的发文年份，用于约束发文日期可选范围 */
const getFwsjYear = () => searchParam.fwYear ?? currentYear

/** 发文日期可选范围：受发文年份约束 */
const fwsjDisabledDate = (date: Date) => {
  const year = getFwsjYear()
  if (!year) return false
  const y = Number(year)
  const start = new Date(`${y}-01-01`)
  const end = new Date(`${y}-12-31 23:59:59`)
  return date < start || date > end
}

/** 切换发文年份时，清空超出该年份的发文日期 */
const handleYearChange = () => {
  const y = Number(searchParam.fwYear)
  if (!y) return
  if (searchParam.fwsjStart && Number(String(searchParam.fwsjStart).slice(0, 4)) !== y) searchParam.fwsjStart = ''
  if (searchParam.fwsjEnd && Number(String(searchParam.fwsjEnd).slice(0, 4)) !== y) searchParam.fwsjEnd = ''
}

/** 搜索表单字段默认值初始化 */
const initSearchParam = () => {
  searchParam.attachName = ''
  searchParam.fwYear = ''
  searchParam.fwsjStart = ''
  searchParam.fwsjEnd = ''
  searchParam.major = ''
  searchParam.wjzh = ''
}

/** 加载下拉枚举：专业 + 文件来源 */
const loadEnums = async () => {
  try {
    const [majorRes, fwdwRes] = await Promise.all([getPublicData('DIRECTORY_ATTACH_MAJOR_COM'), getPublicData('DIRECTORY_ATTACH_FWDW_COM')])
    majorOptions.value = majorRes?.data || []
    fwdwOptions.value = fwdwRes?.data || []
  } catch {
    majorOptions.value = []
    fwdwOptions.value = []
  }
}

// ========== 左右栏拖拉分隔 ==========
/** 左侧宽度（px），null 表示使用默认 25% 比例 */
const leftWidth = ref<number | null>(null)
/** 主布局容器引用 */
const mainLayoutRef = ref<any>(null)
/** 左侧最小/右侧最小宽度约束 */
const LEFT_MIN = 180
const RIGHT_MIN = 360

/** 左列内联样式：拖拽态用 px 覆盖 el-col 默认百分比 flex */
const leftColStyle = computed(() =>
  leftWidth.value != null ? { flex: `0 0 ${leftWidth.value}px`, maxWidth: `${leftWidth.value}px`, width: `${leftWidth.value}px` } : {}
)

/** 拖拽中节流触发表格重排，避免列宽错位 */
const scheduleTableLayout = () => {
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
  tableLayoutFrame = requestAnimationFrame(() => {
    tableLayoutFrame = 0
    gridRef.value?.recalculate?.(true)
  })
}

/** 双击手柄恢复默认比例 */
const resetSplit = () => {
  leftWidth.value = null
  nextTick(() => gridRef.value?.recalculate?.(true))
}

/** 指针按下开始拖拽 */
const onResizerDown = (e: PointerEvent) => {
  if (isLeftCollapsed.value) return
  const startX = e.clientX
  // 取左侧列当前实际像素宽度
  const leftEl = mainLayoutRef.value?.$el?.querySelector('.left-column') as HTMLElement
  const startW = leftEl?.getBoundingClientRect().width ?? 240
  const target = e.target as HTMLElement
  target.setPointerCapture?.(e.pointerId)

  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX
    const containerW = mainLayoutRef.value?.$el?.clientWidth ?? 1200
    const maxW = containerW - RIGHT_MIN
    const w = Math.max(LEFT_MIN, Math.min(maxW, startW + dx))
    leftWidth.value = w
    scheduleTableLayout()
  }
  const onUp = (ev: PointerEvent) => {
    target.releasePointerCapture?.(e.pointerId)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    nextTick(() => gridRef.value?.recalculate?.(true))
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

/** 窗口尺寸变化时钳制左侧宽度，避免超出容器 */
const onWindowResize = () => {
  if (leftWidth.value == null) return
  const containerW = mainLayoutRef.value?.$el?.clientWidth ?? 1200
  const maxW = containerW - RIGHT_MIN
  leftWidth.value = Math.max(LEFT_MIN, Math.min(maxW, leftWidth.value))
  scheduleTableLayout()
}

const defaultProps = markRaw({
  label: 'directoryName',
  isLeaf: (data: TreeNode) => data.leaf === '1'
})

// ========== 目录状态筛选 ==========
const dirStatus = ref<string>('0')
const statusOptions = ref<any[]>([])
/** 切换状态后重置整棵树，按新 status 重新懒加载 */
const handleStatusChange = async () => {
  // 切状态后当前选中节点可能被过滤掉，清空表格避免脏数据
  chooseNode.value = ''
  chooseNodeName.value = ''
  await reloadTreeAndExpandAll()
  reloadActiveTable()
}

// ========== 表格列配置（vxe-grid） ==========
const operationColumn = markRaw({
  field: 'operation',
  title: '操作',
  width: 130,
  fixed: 'right',
  align: 'center',
  slots: { default: 'operation' }
})
const inuseColumns = markRaw<any[]>([
  { field: 'checkbox', title: '', width: 50, fixed: 'left', align: 'center', slots: { default: 'checkbox', header: 'header_checkbox' } },
  { type: 'seq', width: 50, title: '序号', fixed: 'left' },
  { field: 'directoryName', title: '所属目录', width: 120, fixed: 'left', visible: false },
  { field: 'attachName', title: '文件标题', width: 360, headerAlign: 'center', align: 'left', fixed: 'left' },
  { field: 'majorName', title: '专业', width: 120 },
  { field: 'wjzh', title: '发文字号', width: 150 },
  { field: 'fwsj', title: '发文时间', width: 150 },
  // { field: 'fwdwName', title: '文件来源', width: 150 },
  { field: 'fwbm', title: '拟稿部门', width: 150, visible: false },
  { field: 'wjsylx', title: '文件使用类型', width: 150 },
  { field: 'status', title: '状态', width: 90, align: 'center', slots: { default: 'status' } },
  { field: 'size', title: '文件大小', width: 100, visible: false },
  { field: 'uploadUser', title: '上传人', width: 100, visible: false },
  { field: 'updtime', title: '最后修改日期', width: 150, visible: false },
  { field: 'remark', title: '备注', width: 180, visible: false },
  operationColumn
])

// ========== 分组标题行：按 fwdwName（文件来源）分组 ==========
/** 最近一次请求的原始 records，供折叠/展开时重建表格数据 */
let lastRecords: any[] = []

/**
 * 将当前页 records 按 fwdwName 分组，每组前插入一个分组标题行。
 * 折叠的分组只显示标题行，不展开数据行。
 */
const buildGroupedData = (records: any[]): any[] => {
  if (!Array.isArray(records) || !records.length) return []
  const result: any[] = []
  const groupMap = new Map<string, any[]>()
  for (const row of records) {
    const key = row.fwdwName || '未分类'
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(row)
  }
  for (const [groupName, rows] of groupMap) {
    const collapsed = collapsedGroups.value.has(groupName)
    result.push({
      _isGroupHeader: true,
      _groupKey: groupName,
      _groupLabel: `${groupName}(共${rows.length}个文件)`,
      _collapsed: collapsed
    })
    if (!collapsed) {
      result.push(...rows)
    }
  }
  return result
}

/** 折叠/展开后重建表格数据（不重新请求） */
const rebuildTableData = () => {
  gridOptions.data = buildGroupedData(lastRecords)
  syncSelectedList()
}

/** 表格列总数（用于分组行 colspan） */
const columnCount = computed(() => inuseColumns.length)

/**
 * spanMethod：分组标题行横跨所有列；其余行正常渲染。
 */
const groupSpanMethod = ({ row, columnIndex }: any) => {
  if (row._isGroupHeader) {
    if (columnIndex === 0) {
      return { rowspan: 1, colspan: columnCount.value }
    }
    return { rowspan: 0, colspan: 0 }
  }
  return { rowspan: 1, colspan: 1 }
}

/** 行样式：分组标题行加 class */
const rowClassName = ({ row }: any) => (row._isGroupHeader ? 'group-header-row' : '')

/** 单元格样式：分组行青绿雾面 + 主色加粗；文件标题列可点击 */
const cellStyle = ({ row, column }: any) => {
  if (row._isGroupHeader) {
    return {
      backgroundColor: '#dff3f0',
      color: '#00706b',
      fontWeight: '600',
      fontSize: '13px',
      padding: '0 12px'
    }
  }
  if (column.field === 'attachName') {
    return { color: 'var(--color-primary, #00857c)', cursor: 'pointer' }
  }
}

// ========== gridOptions / gridEvents ==========
const gridOptions = reactive<VxeGridProps>({
  border: true,
  stripe: true,
  loading: false,
  loadingConfig: { icon: 'el-icon-loading', text: '正在加载中...' },
  height: '100%',
  autoResize: true,
  showOverflow: true,
  // showHeaderOverflow: true,
  headerAlign: 'center',
  align: 'center',
  rowConfig: { height: 32 },
  toolbarConfig: { custom: true, slots: { buttons: 'toolbar_actions' } },
  spanMethod: groupSpanMethod,
  rowClassName,
  cellStyle,
  columnConfig: { resizable: true },
  columns: inuseColumns,
  data: [],
  size: 'mini'
})

const gridEvents: VxeGridListeners = {
  cellClick: ({ row, column }: any) => {
    if (!row) return
    // 分组行点击切换展开/收起
    if (row._isGroupHeader) {
      toggleGroup(row._groupKey)
      return
    }
    if (column.field === 'attachName') {
      downloadReport({ row, column })
    }
  }
}

const layoutActiveTable = async () => {
  await nextTick()
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
  tableLayoutFrame = requestAnimationFrame(() => {
    tableLayoutFrame = 0
    gridRef.value?.recalculate?.(true)
  })
}

// ========== 表格相关 ==========
const clearSelection = () => {
  selectedIdSet.value = new Set()
  selectedList.value = []
}

const reloadActiveTable = () => {
  clearSelection()
  getTableList()
}

/** 查询：重置页码后请求 */
const handleSearch = async () => {
  pageable.current = 1
  clearSelection()
  await getTableList()
}

/** 重置：清空搜索条件后请求 */
const handleReset = async () => {
  initSearchParam()
  pageable.current = 1
  clearSelection()
  await getTableList()
}

const handleSizeChange = async (size: number) => {
  if (size <= 0) return
  pageable.size = size
  pageable.current = 1
  await getTableList()
}

const handleCurrentChange = async (current: number) => {
  if (current <= 0) return
  pageable.current = current
  await getTableList()
}

const refreshTable = async () => {
  if (!chooseNode.value) return
  loading.value = true
  await getTableList()
}

/**
 * 列表请求：
 * - 查询条件由 searchParam 透传至 params
 * - 按 fwdwName 分组后插入分组标题行
 * - 序号直接拒绝过期响应，阻止旧节点数据写入当前表格
 */
const getTableList = async () => {
  const seq = ++tableReqSeq
  const nodeAtRequest = chooseNode.value
  loading.value = true
  gridOptions.loading = true
  try {
    const params: Record<string, any> = {
      ...searchParam,
      directoryId: chooseNode.value ?? '',
      status: dirStatus.value
    }
    if (pagination.value) {
      params.page = pageable.current
      params.limit = pageable.size
    }
    const res = await getAttachByDirectory(params)
    if (seq !== tableReqSeq || nodeAtRequest !== chooseNode.value) return
    const rawData = res?.data
    if (pagination.value) {
      const records = rawData?.records || []
      lastRecords = records
      gridOptions.data = buildGroupedData(records)
      pageable.total = Number(rawData?.total || 0)
      const current = Number(rawData?.current)
      const size = Number(rawData?.size)
      if (!Number.isNaN(current) && current > 0) pageable.current = current
      if (!Number.isNaN(size) && size > 0) pageable.size = size
    } else {
      const records = Array.isArray(rawData) ? rawData : rawData?.records || []
      lastRecords = records
      gridOptions.data = buildGroupedData(records)
    }
    await nextTick()
    clearSelection()
  } catch (err) {
    if (seq !== tableReqSeq || nodeAtRequest !== chooseNode.value) return
    lastRecords = []
    gridOptions.data = []
    pageable.total = 0
    clearSelection()
    if ((err as Error)?.message !== 'STALE_TABLE_REQUEST') {
      ElMessage.error((err as Error)?.message || '列表加载失败，请稍后重试')
    }
  } finally {
    if (seq !== tableReqSeq || nodeAtRequest !== chooseNode.value) return
    loading.value = false
    gridOptions.loading = false
  }
}

// ========== 文件操作 ==========
// 下载文件
const downloadReport = ({ row, column }: { row: any; column: any }) => {
  if (column.field == 'attachName') {
    try {
      const uuid: any = row.uuid
      const fileName: any = `${row.attachName}`
      const params: any = {
        uuid: uuid,
        fileName: fileName
      }
      if (!uuid) return ElMessage.warning('报告未维护，请勿重复点击！')
      apiExporFile(params, fileName, downloadAttach)
    } catch (e: any) {
      console.error(e.toString())
    }
  }
}
/** 上传文件：选中文件后直传至当前目录 */
const uploadHandle = async () => {
  if (!chooseNode.value) {
    ElMessage.warning('请先选择左侧文件目录')
    uploadRef.value?.clearFiles?.()
    return
  }
  try {
    const $table = gridRef.value
    // const types = ['gif', 'jpg', 'jpeg', 'png', 'wps', 'et', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf', 'zip', 'tar', 'ofd']
    const { files } = await $table.readFile({ multiple: true })
    const records = Array.from(files).map((file: any) => {
      // if (types) {
      //   const ns = file.name.split('.')
      //   const type = ns[ns.length - 1].toLowerCase()
      //   if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
      // }
      return {
        name: file.name,
        file: file
      }
    })
    const formData = new FormData()
    for (const record of records) {
      formData.append('files', record.file)
      formData.append('attachNames', record.name)
    }
    const attachNames = records.map(({ name }: any) => name)
    loading.value = true
    const res = await uploadAttachToDirectory({ excelFormData: formData, id: chooseNode.value, attachNames })
    if (!res.success) throw new Error(res.msg)
    // 刷新左侧目录（保持选中节点）与右侧文件列表
    ElMessage.success('附件上传成功')
    await refreshTreeKeepSelection()
    reloadActiveTable()
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
  return
}

/** 编辑备注：打开弹窗回显 */
const handleEditRemark = (row: AttachRow) => {
  remarkModalRef.value?.acceptParams({
    id: row.id,
    attachName: row.attachName,
    remark: row.remark,
    wjzh: row.wjzh,
    fwsj: row.fwsj,
    fwdw: row.fwdw,
    fwbm: row.fwbm,
    wjsylx: row.wjsylx,
    major: row.major,
    directoryId: row.directoryId
  })
}

/** 预览文件：下载带鉴权的文件流后交给 OfficePreview 渲染 */
const handlePreview = (row: AttachRow) => {
  if (!row.uuid) return ElMessage.warning('报告未维护，无法预览！')
  previewModalRef.value?.acceptParams({ uuid: row.uuid, attachName: row.attachName })
}

/** 备注保存回调 */
const handleRemarkSave = async ({
  id,
  remark,
  wjzh,
  fwsj,
  fwdw,
  fwbm,
  wjsylx,
  major,
  directoryId
}: {
  id: string
  remark: string
  wjzh: string
  fwsj: string
  fwdw: string
  fwbm: string
  wjsylx: string
  major: string
  directoryId: string
}) => {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await editAttach({ id, remark, wjzh, fwsj, fwdw, fwbm, wjsylx, major, directoryId })
    if (res.success) {
      ElMessage.success('保存成功')
      reloadActiveTable()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '保存失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

/** 删除文件：ids 数组 */
const handleDeleteFile = async (row: AttachRow) => {
  try {
    const type = await VXETable.modal.confirm('确定删除该文件吗？', '提示', { status: 'warning' })
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
    const res = await deleteAttachFromDirectory({ ids: [row.id] })
    if (res.success) {
      ElMessage.success('删除成功')
      // 刷新左侧目录（保持选中节点）与右侧文件列表
      await refreshTreeKeepSelection()
      reloadActiveTable()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '删除失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

/** 批量修改文件生效/失效 */
const handleBatchStatus = async (rows: any[], status: string) => {
  if (!rows.length) {
    ElMessage.warning('请先勾选要操作的文件')
    return
  }
  const label = status === '0' ? '生效' : '失效'
  try {
    const type = await VXETable.modal.confirm(`确定将选中的 ${rows.length} 个文件置为${label}吗？`, '提示', { status: 'warning' })
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
    const attachIdList = rows.map((row: any) => row.id)
    const res = await batchUpdateAttachStatus({ attachIdList, status })
    if (res.success) {
      ElMessage.success(`批量${label}成功`)
      reloadActiveTable()
    } else {
      ElMessage.error(res.msg || `批量${label}失败`)
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || `批量${label}失败，请稍后重试`)
  } finally {
    actionLoading.value = false
  }
}

// ========== 树相关（懒加载） ==========
/**
 * el-tree 懒加载：根节点 level=0 传 '0'，其余传节点 id。
 * leaf=1 视为末级，不展示展开箭头（由 defaultProps.isLeaf 控制）。
 */
const loadNode = async (node: any, resolve: (data: TreeNode[]) => void) => {
  const parentId = node.level === 0 ? '0' : node.data?.id
  try {
    const res = await getChildDirectory(parentId, dirStatus.value)
    if (!res.success) {
      ElMessage.error(res.msg || '文件目录加载失败')
      resolve([])
      return
    }
    const list: TreeNode[] = Array.isArray(res.data) ? res.data : []
    resolve(list)
  } catch (e) {
    ElMessage.error((e as Error)?.message || '文件目录加载失败，请稍后重试')
    resolve([])
  }
}

/** 重新加载整棵树（状态切换/删除后调用，仅重载根节点） */
const reloadTree = () => {
  const tree = treeRef.value
  if (!tree) return
  // 重置懒加载缓存，重新拉取根节点
  tree.store.root.loaded = false
  tree.store.root.expand()
}

/**
 * 重载目录树并展开所有节点（新增/编辑/刷新后调用）。
 * 只重置根节点懒加载状态，由 expandNodeRecursive 统一加载+展开，
 * 避免与 root.expand() 的异步 load 产生重复加载竞争导致展开中断。
 */
const reloadTreeAndExpandAll = async () => {
  const tree = treeRef.value
  if (!tree || treeExpanding.value) return
  treeExpanding.value = true
  try {
    const root = tree.store.root
    root.loaded = false
    root.loading = false
    root.expanded = false
    root.childNodes = []
    await expandNodeRecursive(root)
  } catch (e) {
    ElMessage.error((e as Error)?.message || '目录加载失败，请稍后重试')
  } finally {
    treeExpanding.value = false
  }
}

/**
 * 重载目录树并保持当前选中节点高亮（文件上传/删除后调用）。
 * attachNum 计数随重载刷新，选中状态不丢失。
 */
const refreshTreeKeepSelection = async () => {
  const nodeId = chooseNode.value
  await reloadTreeAndExpandAll()
  if (nodeId) {
    await nextTick()
    treeRef.value?.setCurrentKey?.(nodeId)
  }
}

/**
 * 清除选中节点并刷新右侧文件列表（目录新增/编辑/删除/刷新后调用）。
 * 选中节点失效后，右侧列表按空目录查询。
 */
const resetSelectionAndRefreshTable = async () => {
  chooseNode.value = ''
  chooseNodeName.value = ''
  treeRef.value?.setCurrentKey?.(null)
  clearSelection()
  await reloadTreeAndExpandAll()
  reloadActiveTable()
}

const retryTreeLoad = async () => {
  treeLoadError.value = ''
  await reloadTree()
  await nextTick()
  await handleExpandAll()
}

/**
 * 递归拉取并展开所有非末级节点（懒加载树的一键展开）。
 * - 先 loadData 加载子节点，再 expand，避免重复请求。
 * - isLeaf 由 defaultProps.isLeaf 函数在 load 后计算。
 */
const expandNodeRecursive = async (node: any) => {
  if (!node) return
  if (node.isLeaf) return
  if (!node.loaded) {
    await new Promise<void>((resolve) => {
      node.loadData(() => resolve())
    })
  }
  if (!node.expanded) node.expand()
  const children = node.childNodes || []
  for (const child of children) {
    await expandNodeRecursive(child)
  }
}

/** 递归收起所有节点 */
const collapseNodeRecursive = (node: any) => {
  if (!node) return
  if (node.expanded) node.collapse()
  const children = node.childNodes || []
  for (const child of children) {
    collapseNodeRecursive(child)
  }
}

/** 判断所有非末级节点是否均已展开 */
const isAllExpanded = (node: any): boolean => {
  if (!node || node.isLeaf) return true
  if (!node.loaded || !node.expanded) return false
  const children = node.childNodes || []
  return children.every((child: any) => isAllExpanded(child))
}

const handleExpandAll = async () => {
  const tree = treeRef.value
  if (!tree || treeExpanding.value) return
  treeExpanding.value = true
  try {
    const root = tree.store.root
    if (isAllExpanded(root)) {
      collapseNodeRecursive(root)
    } else {
      await expandNodeRecursive(root)
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '操作失败，请稍后重试')
  } finally {
    treeExpanding.value = false
  }
}

/** 刷新：清除选中节点，重载目录树并刷新右侧文件列表 */
const handleRefreshTree = async () => {
  await resetSelectionAndRefreshTable()
}

const handleNodeClick = (data: TreeNode) => {
  // 重复点击同一节点不刷新
  if (chooseNode.value === data.id) return
  chooseNode.value = data.id
  chooseNodeName.value = data.directoryName || data.name
  refreshTable()
}

/** 顶部「+」：新增目录 */
const handlePlusClick = () => {
  directoryModalRef.value?.acceptParams({ parentId: '0' })
}
/** 树节点新增：新增目录名 */
const handleTreeNodePLUS = (_node: any, data: TreeNode) => {
  directoryModalRef.value?.acceptParams({ parentId: data.id })
}
/** 树节点编辑：编辑目录名 */
const handleTreeNodeEdit = (_node: any, data: any) => {
  directoryModalRef.value?.acceptParams({
    id: data.id,
    directoryName: data.directoryName || data.name,
    sortCode: data.sortCode,
    leaf: data.leaf,
    parentId: data.parentId
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
    const res = await deleteDirectory({ ids: [data.id] })
    if (res.success) {
      ElMessage.success('删除成功')
      // 清除选中节点，重载目录树并刷新右侧文件列表
      await resetSelectionAndRefreshTable()
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
const handleDirectorySave = async (params: { id?: string; parentId?: string; directoryName: string; leaf?: number }) => {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await addDirectory(params)
    if (res.success) {
      ElMessage.success('保存成功')
      // 清除选中节点，重载目录树并刷新右侧文件列表
      await resetSelectionAndRefreshTable()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '保存失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  const isQuery = userDialogRef.value?.isQuery
  if (!isQuery) return
  isShowPage.value = true
  // 页面可交互后再挂弹窗，降低首屏压力
  requestAnimationFrame(() => {
    modalsReady.value = true
  })
  // 默认展开所有节点（等树挂载）
  await nextTick()
  await getOptions()
  handleExpandAll()
  await getTableList()
}

const getOptions = async () => {
  const [statusRes]: any[] = await Promise.all([getPublicData('DIRECTORY_ATTACH_STATUS_COM'), loadEnums()])
  statusOptions.value = statusRes?.data || []
}

// ========== 生命周期 ==========
onMounted(async () => {
  countInfo.value = { ...store.getters.getUserMsg }
  window.addEventListener('resize', onWindowResize)
  initSearchParam()
  await userDialogRef.value?.getUser()
})

// 路由页签由 keep-alive 缓存，返回时需要主动恢复隐藏期间失效的表格尺寸
onActivated(() => {
  layoutActiveTable()
})

onBeforeUnmount(() => {
  if (tableLayoutFrame) cancelAnimationFrame(tableLayoutFrame)
  window.removeEventListener('resize', onWindowResize)
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
