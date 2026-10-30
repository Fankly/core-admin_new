<template>
  <div v-if="isShowPage" :class="['aep-page', { 'is-fullscreen': isFullscreen }]">
    <MetricCards :statistics="statistics" @drilldown="handleCardDrilldown" @legend="handleLegendDrilldown" />

    <ListPanel
      ref="listPanelRef"
      :active-tab="activeTab"
      v-model:file-filter="fileFilter"
      v-model:knowledge-filter="knowledgeFilter"
      :file-rows="fileRows"
      :knowledge-rows="pointRows"
      :total="totalRows"
      :page="page"
      :page-size="pageSize"
      :loading="loading"
      :is-fullscreen="isFullscreen"
      @update:active-tab="handleTabChange"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      @refresh="handleRefresh"
      @extract="handleOpenExtract"
      @confirm="handleConfirmClick"
      @maintain-experience="handleOpenExperienceMaintain"
      @apply="handleApplyClick"
      @export="handleExport"
      @toggle-fullscreen="toggleFullscreen"
      @open-knowledge-list="openKnowledgeList"
      @delete-knowledge="handleDeleteKnowledge"
      @delete-file="handleDeleteFile"
      @preview-file="handlePreviewFile"
      @download-file="handleDownloadFile"
      @reset-file-filters="resetFileFilter"
      @reset-knowledge-filters="resetKnowledgeFilter"
    />
  </div>

  <!-- 弹窗 -->
  <ExtractModal :visible="extractVisible" @close="extractVisible = false" @start="handleStartExtract" />
  <ConfirmModal
    :visible="confirmVisible"
    :point-id="confirmPointId"
    :readonly="confirmReadonly"
    :preview-file="confirmPreviewFile"
    @close="handleConfirmClose"
    @confirm="handleSubmitConfirm"
  />
  <!-- 经验知识维护：纯新增功能，不需要勾选、不拉详情（来源默认「经验知识」，是否为有效/是否固化默认「否」） -->
  <ConfirmModal :visible="experienceVisible" mode="experience" @close="experienceVisible = false" @save="handleSubmitExperience" />
  <KnowledgeListModal :visible="knowledgeListVisible" :query="knowledgeListQuery" @close="knowledgeListVisible = false" @detail="handlePointDetail" />
  <previewModal ref="previewModalRef" />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script lang="ts">
export default {
  name: '/ai/automaticExtractionPoints/index'
}
</script>

<script setup lang="ts">
import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'

import { computed, nextTick, onMounted, provide, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import {
  KnowledgeFileVO,
  KnowledgePointVO,
  StatisticsData,
  confirmPoint,
  deleteKnowledgeFile,
  deletePoint,
  exportFile,
  exportPoint,
  getKnowledgeFilePage,
  getKnowledgePointPage,
  getKnowledgeStatistics,
  saveExperiencePoint,
  startExtract as startExtractApi
} from '@/api/ai/automaticExtractionPoints'
import { downloadAttach } from '@/api/sys/fileShare'
import { apiExportHandle, apiExporFile } from '@/utils/export'
import ListPanel from './components/ListPanel.vue'
import MetricCards from './components/MetricCards.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import ExtractModal from './components/ExtractModal.vue'
import KnowledgeListModal from './components/KnowledgeListModal.vue'
import previewModal from '@/views/sys/fileShare/components/previewModal/index.vue'
import './styles.css'
import { CardDrillType, ConfirmPreviewFile, FileFilters, KnowledgeFilters, KnowledgeListQuery, LegendDrillPayload, ListTab } from './types'
import { usePointSourceDict } from './hooks/usePointSourceDict'

/** 当前页签 */
const activeTab = ref<ListTab>('file')
/** 是否全屏展示（隐藏指标卡，列表铺满） */
const isFullscreen = ref(false)
/** 列表分页（两个页签共用一套分页控件） */
const page = ref(1)
const pageSize = ref(20)
/** 列表加载状态 */
const loading = ref(false)

/** 文件列表筛选 */
const fileFilter = ref<FileFilters>({ attachName: '', fwYear: '', fwbm: '' })
/** 知识管理筛选 */
const knowledgeFilter = ref<KnowledgeFilters>({
  sourceFile: '',
  fwYear: '',
  fwbm: '',
  pointName: '',
  pointSource: '',
  isConfirm: '',
  isSolidify: '',
  isImplement: ''
})

const listPanelRef = ref<InstanceType<typeof ListPanel>>()
const previewModalRef = ref()
/** 页面权限：多角色选择弹窗 */
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const isShowPage = ref(false)
const currentUserRole = ref<UserRole>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})
provide(CurrentUserRoleInjectionKey, currentUserRole)
/** 审核要点来源字典：提交时把展示名转回码值（字典由公共代码接口驱动，本地有兜底） */
const { loadPointSourceDict, pointSourceCodeOf } = usePointSourceDict()
const extractVisible = ref(false)
const confirmVisible = ref(false)
/** 待确认的审核要点ID */
const confirmPointId = ref<string | number>('')
/** 确认弹窗是否只读（知识列表「详情」入口为只读） */
const confirmReadonly = ref(false)
/** 确认弹窗左侧来源文件预览（没有来源文件 / 经验知识为 null） */
const confirmPreviewFile = ref<ConfirmPreviewFile | null>(null)

/**
 * 是否经验知识来源：
 * 优先用稳定码值 pointSourceCode（1 制度文件 / 2 经验知识），名称改了也不受影响；
 * 旧接口没有 pointSourceCode 时，回退到 pointSource 的名称/码值兜底。
 * 经验知识没有原文出处文件，左侧不展示预览（只有制度文件才展示）。
 */
const isExperiencePointSource = (row: KnowledgePointVO): boolean => {
  const code = String(row.pointSourceCode || '').trim()
  if (code) return code === '2'
  const fallback = String(row.pointSource || '').trim()
  return fallback === '2' || fallback === '经验知识'
}

/** 知识要点行 → 预览入参：制度文件且有来源文件才展示；uuid 接口已返回则直接用，否则弹窗内回查 */
const toPreviewFile = (row: KnowledgePointVO): ConfirmPreviewFile | null =>
  row.sourceFile && !isExperiencePointSource(row)
    ? {
        uuid: row.uuid,
        attachName: row.sourceFile,
        fwYear: row.fwYear,
        fwbm: row.fwbm
      }
    : null

/** 经验知识维护弹窗（纯新增：不需要勾选、不回填，打开即空表单） */
const experienceVisible = ref(false)
const knowledgeListVisible = ref(false)
/** 知识列表弹窗带入条件（attachId + 点击列对应的状态条件） */
const knowledgeListQuery = ref<KnowledgeListQuery | null>(null)

/** 统计（卡片） */
const statistics = ref<StatisticsData | null>(null)
/** 文件列表数据 */
const fileRows = ref<KnowledgeFileVO[]>([])
const fileTotal = ref(0)
/** 知识管理数据 */
const pointRows = ref<KnowledgePointVO[]>([])
const pointTotal = ref(0)

/** 当前页签的总条数 */
const totalRows = computed(() => (activeTab.value === 'file' ? fileTotal.value : pointTotal.value))

/** 去空值，避免把空串当筛选条件传给后端 */
const compactParams = <T extends Record<string, unknown>>(params: T): T => {
  const res = {} as T
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value !== '' && value !== undefined && value !== null) res[key as keyof T] = value as T[keyof T]
  })
  return res
}

/** 统计 */
const loadStatistics = async (): Promise<void> => {
  try {
    const res = await getKnowledgeStatistics()
    statistics.value = res?.data ?? null
  } catch (error) {
    statistics.value = null
  }
}

/** 文件列表分页 */
const loadFilePage = async (): Promise<void> => {
  loading.value = true
  try {
    const res = await getKnowledgeFilePage(
      compactParams({
        page: page.value,
        limit: pageSize.value,
        ...fileFilter.value
      })
    )
    fileRows.value = res?.data?.records || []
    fileTotal.value = Number(res?.data?.total || 0)
  } catch (error) {
    fileRows.value = []
    fileTotal.value = 0
  } finally {
    loading.value = false
  }
}

/** 知识管理分页 */
const loadPointPage = async (): Promise<void> => {
  loading.value = true
  try {
    const res = await getKnowledgePointPage(
      compactParams({
        page: page.value,
        limit: pageSize.value,
        ...knowledgeFilter.value
      })
    )
    pointRows.value = res?.data?.records || []
    pointTotal.value = Number(res?.data?.total || 0)
  } catch (error) {
    pointRows.value = []
    pointTotal.value = 0
  } finally {
    loading.value = false
  }
}

/** 刷新当前页签列表 */
const reloadActive = (): Promise<void> => (activeTab.value === 'file' ? loadFilePage() : loadPointPage())

/**
 * 两个列表按同一分页一起取数。
 * 分页控件是两个页签共用的，页码/每页条数变化时必须两个列表都刷新，
 * 否则会出现「控件显示 20 条/页、另一个页签的表格还是 10 行」的错位。
 */
const reloadAll = (): void => {
  loadFilePage()
  loadPointPage()
}

/** 页码 / 每页条数变化 */
const handlePageChange = (current: number): void => {
  page.value = current
  reloadAll()
}

const handlePageSizeChange = (size: number): void => {
  pageSize.value = size
  page.value = 1
  reloadAll()
}

/** 查询：回到第一页重新取数（两个列表都刷新，保持共用分页一致） */
const handleRefresh = (): void => {
  page.value = 1
  reloadAll()
}

const resetFileFilter = (): void => {
  fileFilter.value = { attachName: '', fwYear: '', fwbm: '' }
  page.value = 1
}

const resetKnowledgeFilter = (): void => {
  knowledgeFilter.value = {
    sourceFile: '',
    fwYear: '',
    fwbm: '',
    pointName: '',
    pointSource: '',
    isConfirm: '',
    isSolidify: '',
    isImplement: ''
  }
  page.value = 1
}

/** 切换页签：分页归位并按需取数 */
const switchTab = (tab: ListTab): void => {
  activeTab.value = tab
  page.value = 1
}

/** 工具栏页签切换：请求该页签对应的列表接口刷新主表 */
const handleTabChange = (tab: ListTab): void => {
  if (tab === activeTab.value) return
  activeTab.value = tab
  page.value = 1
  reloadActive()
}

/** 指标卡整卡下钻：切换页签 + 重置筛选 + 取数（不再弹提示文案） */
const handleCardDrilldown = (type: CardDrillType): void => {
  if (type === 'parse') {
    switchTab('file')
    resetFileFilter()
    loadFilePage()
  } else if (type === 'extract') {
    switchTab('knowledge')
    resetKnowledgeFilter()
    loadPointPage()
  } else if (type === 'translate') {
    switchTab('knowledge')
    resetKnowledgeFilter()
    knowledgeFilter.value = { ...knowledgeFilter.value, isConfirm: '1' }
    loadPointPage()
  } else {
    switchTab('knowledge')
    resetKnowledgeFilter()
    knowledgeFilter.value = { ...knowledgeFilter.value, isSolidify: '1' }
    loadPointPage()
  }
  scrollToList()
}

/** 指标卡图例下钻（值取接口编码：状态 1/0、来源 1/2；转化/实现图例另带卡片口径的前置条件 extra） */
const handleLegendDrilldown = (payload: LegendDrillPayload): void => {
  if (payload.tab === 'file') {
    switchTab('file')
    resetFileFilter()
    fileFilter.value = { ...fileFilter.value, fwbm: payload.value }
    loadFilePage()
  } else {
    switchTab('knowledge')
    resetKnowledgeFilter()
    knowledgeFilter.value = { ...knowledgeFilter.value, ...payload.extra, [payload.field]: payload.value }
    loadPointPage()
  }
  scrollToList()
}

/** 列表滚动到可视区域（与设计稿一致） */
const scrollToList = (): void => {
  const el = document.querySelector('.aep-panel')
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const toggleFullscreen = (): void => {
  isFullscreen.value = !isFullscreen.value
  page.value = 1
  reloadAll()
}

const handleOpenExtract = (): void => {
  extractVisible.value = true
}

/**
 * 审核要点表单必填校验（接口对「审核要点名称」「审核要点判断规则」都要求非空，
 * 本地先拦一道，提示比后端更直接，也避免把空表单提交上去）
 */
const validatePointForm = (form: Record<string, string>): boolean => {
  if (!form.pointName) {
    ElMessage.warning('请填写审核要点名称')
    return false
  }
  if (!form.judgementRuleDesc) {
    ElMessage.warning('请填写审核要点判断规则')
    return false
  }
  return true
}

/** 开始提取：入队成功后关闭选择弹窗，用提示语告知大模型处理时长（不再弹消息提醒弹窗） */
const handleStartExtract = async (attachIds: Array<string | number>): Promise<void> => {
  if (!attachIds.length) {
    ElMessage.warning('请先选择一个文件')
    return
  }
  try {
    const res = await startExtractApi({ attachIds })
    // http 层只透传响应，业务失败（success=false）要在这里拦下，否则会把失败当成功
    if (!res?.success) {
      ElMessage.error(res?.msg || '提交提取失败')
      return
    }
    extractVisible.value = false
    ElMessage.success({
      message: '系统将基于大模型自动提取审核要点，预计需要3-5分钟，您可以稍作等待',
      duration: 5000
    })
    loadStatistics()
    page.value = 1
    loadFilePage()
  } catch (error) {
    // http 层已提示错误
  }
}

/** 审核要点确认：未勾选时提示，勾选多条时提示只取第一条 */
const handleConfirmClick = (): void => {
  const checked = listPanelRef.value?.getCheckedKnowledge() || []
  if (!checked.length) {
    ElMessage.warning('请先勾选一条审核要点，再进行确认')
    return
  }
  if (checked.length > 1) {
    ElMessage.warning('一次只能确认一条审核要点')
    return
  }
  confirmPointId.value = checked[0].pointId
  confirmPreviewFile.value = toPreviewFile(checked[0])
  confirmReadonly.value = false
  confirmVisible.value = true
}

/**
 * 知识列表「详情」：收起知识列表，用审核要点确认弹窗只读展示该要点；
 * 关闭详情弹窗后再回到知识列表（列表实例不销毁，重新打开会按带入条件刷新）。
 */
const handlePointDetail = (row: KnowledgePointVO): void => {
  confirmPointId.value = row.pointId
  confirmPreviewFile.value = toPreviewFile(row)
  confirmReadonly.value = true
  knowledgeListVisible.value = false
  confirmVisible.value = true
}

/** 关闭确认弹窗：只读详情入口关闭后回到知识列表，普通确认入口直接关闭 */
const handleConfirmClose = (): void => {
  confirmVisible.value = false
  confirmPreviewFile.value = null
  if (confirmReadonly.value) {
    confirmReadonly.value = false
    knowledgeListVisible.value = true
  }
}

/** 提交确认：先校验必填，再提交；业务失败时保留弹窗并给出后端原因 */
const handleSubmitConfirm = async (form: Record<string, string>): Promise<void> => {
  if (!validatePointForm(form)) return
  try {
    const res = await confirmPoint({
      pointId: confirmPointId.value,
      pointName: form.pointName,
      judgementRuleDesc: form.judgementRuleDesc,
      pointDescription: form.pointDescription,
      originalEvidence: form.originalEvidence,
      dataSource: form.dataSource,
      // 来源提交码值（1 制度文件 / 2 经验知识，与查询/落库同一套；弹窗里只读展示的是名称）
      pointSource: pointSourceCodeOf(form.pointSource),
      isConfirm: form.isConfirm,
      isSolidify: form.isSolidify,
      effectiveStatus: form.effectiveStatus
    })
    if (!res?.success) {
      ElMessage.error(res?.msg || '确认失败')
      return
    }
    confirmVisible.value = false
    ElMessage.success('已确认审核要点')
    loadStatistics()
    loadPointPage()
  } catch (error) {
    // http 层已提示错误
  }
}

/** 经验知识维护：纯新增功能，不需要勾选行，直接打开空表单（来源默认「经验知识」，有效/固化默认「否」） */
const handleOpenExperienceMaintain = (): void => {
  experienceVisible.value = true
}

/** 保存经验知识（纯新增一条审核要点，接口 saveExperiencePoint，来源后端固定为「经验知识」） */
const handleSubmitExperience = async (form: Record<string, string>): Promise<void> => {
  if (!validatePointForm(form)) return
  try {
    const res = await saveExperiencePoint({
      pointName: form.pointName,
      judgementRuleDesc: form.judgementRuleDesc,
      pointDescription: form.pointDescription,
      originalEvidence: form.originalEvidence,
      dataSource: form.dataSource,
      // 来源提交码值（默认 2 经验知识；接口对新增经验知识固定为「经验知识」）
      pointSource: pointSourceCodeOf(form.pointSource),
      isConfirm: form.isConfirm,
      isSolidify: form.isSolidify
    })
    if (!res?.success) {
      ElMessage.error(res?.msg || '保存失败')
      return
    }
    experienceVisible.value = false
    ElMessage.success('已保存经验知识')
    loadStatistics()
    switchTab('knowledge')
    loadPointPage()
  } catch (error) {
    // http 层已提示错误
  }
}

/** 审核要点应用（接口未提供，暂为占位提示） */
const handleApplyClick = (): void => {
  const checked = listPanelRef.value?.getCheckedKnowledge() || []
  if (!checked.length) {
    ElMessage.warning('请先勾选审核要点，再进行应用')
    return
  }
  ElMessage.success('已提交所选审核要点的AI应用请求')
}

/** 导出：按当前页签导出对应列表（文件列表 / 知识管理） */
const handleExport = (): void => {
  const isFile = activeTab.value === 'file'
  const params = compactParams(isFile ? { ...fileFilter.value } : { ...knowledgeFilter.value })
  apiExportHandle(params, isFile ? '审核要点-文件列表' : '审核要点-知识管理', isFile ? exportFile : exportPoint).catch(() => {
    ElMessage.error('导出失败，请稍后重试')
  })
}

/** 知识管理行内删除：已确认 或 已固化为AI审核要点 的记录不允许删除 */
const handleDeleteKnowledge = (row: KnowledgePointVO): void => {
  if (row.isConfirm === '1') {
    ElMessage.warning('该审核要点已确认，不能删除')
    return
  }
  if (row.isSolidify === '1') {
    ElMessage.warning('该审核要点已固化为AI审核要点，不能删除')
    return
  }
  ElMessageBox.confirm(`确定删除审核要点「${row.pointName}」？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await deletePoint(row.pointId)
        if (!res?.success) {
          ElMessage.error(res?.msg || '删除失败')
          return
        }
        ElMessage.success('已删除')
        loadStatistics()
        // 删掉当前页最后一条时回退一页
        if (pointRows.value.length === 1 && page.value > 1) page.value -= 1
        loadPointPage()
      } catch (error) {
        // http 层已提示错误
      }
    })
    .catch(() => {
      // 取消删除
    })
}

/**
 * 文件列表行内删除：已提取（提取状态 = 3）的文件不允许删除，其余状态均可删。
 * 删除走 `/attachPointKnowledge/fileDelete`（入参 attachId）。
 */
const handleDeleteFile = (row: KnowledgeFileVO): void => {
  if (row.extractStatus === '3') {
    ElMessage.warning('该文件已提取，不能删除')
    return
  }
  ElMessageBox.confirm(`确定删除文件「${row.attachName}」？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await deleteKnowledgeFile(row.attachId)
        if (!res.success) {
          ElMessage.error(res.msg || '删除失败')
          return
        }
        ElMessage.success('已删除')
        loadStatistics()
        // 删掉当前页最后一条时回退一页
        if (fileRows.value.length === 1 && page.value > 1) page.value -= 1
        loadFilePage()
      } catch (error) {
        // http 层已提示错误
      }
    })
    .catch(() => {
      // 取消删除
    })
}

/**
 * 文件预览：与「文件共享」页保持一致——按 uuid 下载带鉴权的文件流，
 * 再交给 OfficePreview 渲染（图片走 el-image-viewer）。
 */
const handlePreviewFile = (row: KnowledgeFileVO): void => {
  if (!row.uuid) {
    ElMessage.warning('该文件缺少预览标识，无法预览')
    return
  }
  previewModalRef.value?.acceptParams({ uuid: row.uuid, attachName: row.attachName })
}

/** 文件下载：与「文件共享」页一致，走 downloadAttach 文件流 */
const handleDownloadFile = (row: KnowledgeFileVO): void => {
  if (!row.uuid) {
    ElMessage.warning('该文件缺少下载标识，无法下载')
    return
  }
  const fileName = row.attachName || ''
  apiExporFile({ uuid: row.uuid, fileName }, fileName, downloadAttach)
}

/** 点击文件行的计数药丸：带上该行文件与对应列的条件打开知识列表 */
const openKnowledgeList = (query: KnowledgeListQuery): void => {
  knowledgeListQuery.value = query
  knowledgeListVisible.value = true
}

/** 角色/按钮权限就绪后初始化页面数据 */
const getRoleHandle = async (): Promise<void> => {
  isShowPage.value = Boolean(userRoleSelectorRef.value?.canRender)
  if (!isShowPage.value) return
  await nextTick()
  // 审核要点来源字典（AI_AUDIT_POINT_SOURCE_COM）：筛选下拉 / 展示 / 提交转换共用，取一次
  loadPointSourceDict()
  loadStatistics()
  loadFilePage()
  // 知识管理页签的数据也先取一次，避免切页签时空白
  loadPointPage()
}

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>
