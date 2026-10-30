<template>
  <div class="container">
    <div class="page-header">
      <span class="page-title">评审分析</span>
      <span class="page-subtitle">拖拽左侧字段到右侧区域，配置评审分析口径</span>
    </div>

    <div class="main-content">
      <!-- 左侧：字段池（维度字段 / 金额指标由 /lhhsPivot/getFields 下发） -->
      <aside class="sidebar" v-loading="fieldLoading">
        <div class="field-group" v-for="group in fieldGroups" :key="group.title">
          <div class="group-title">{{ group.title }}</div>
          <div class="field-list">
            <div
              class="field-item"
              v-for="element in group.fields"
              :key="element.id"
              draggable="true"
              @dragstart="onDragStart(element, $event)"
              @dragend="onDragEnd"
            >
              {{ element.label }}
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧：放置区 + 提交 -->
      <div class="right-panel">
        <main class="drop-zones">
          <div
            class="drop-zone"
            :class="{ 'is-active': activeZone === zone.key, 'is-disabled': isZoneDisabled(zone.key) }"
            v-for="zone in zones"
            :key="zone.key"
            @dragover="handleDragOver(zone.key, $event)"
            @dragleave="handleDragLeave(zone.key, $event)"
            @drop="handleDrop(zone.key, $event)"
          >
            <div class="zone-header">
              <span class="zone-title">{{ zone.title }}</span>
              <span class="zone-subtitle">{{ zone.subtitle }}</span>
            </div>
            <div class="zone-content">
              <template v-if="config[zone.key].length">
                <div
                  class="dropped-item"
                  v-for="(item, index) in config[zone.key]"
                  :key="item.id + '-' + index"
                  title="点击移除"
                  @click="removeItem(zone.key, index)"
                >
                  {{ item.label }}
                  <span class="remove-icon">×</span>
                </div>
              </template>
              <div class="zone-placeholder" v-else>拖拽字段到此处</div>
            </div>
          </div>
        </main>

        <div class="zone-footer">
          <el-button type="primary" @click="handleConfirm">确 定</el-button>
        </div>
      </div>
    </div>

    <!-- 结果弹窗：渲染 /lhhsPivot/getPivotData 返回的表头树 + 数据行（多级表头由后端决定） -->
    <el-dialog v-model="resultVisible" custom-class="review-pivot-dialog" title="评审分析结果" width="86%" top="6vh" append-to-body>
      <div class="pivot-summary">
        <span class="pivot-summary__item"><em>行维度</em>{{ config.rowDimensions.map((item) => item.label).join('、') || '—' }}</span>
        <span class="pivot-summary__item"><em>列维度</em>{{ config.columnDimensions.map((item) => item.label).join('、') || '—' }}</span>
        <span class="pivot-summary__item"><em>数值</em>{{ config.valueMetrics.map((item) => item.label).join('、') }}</span>
        <span class="pivot-summary__note">金额单位：万元 · 点击金额可穿透明细</span>
      </div>
      <div class="table-toolbar">
        <el-button size="small" type="primary" plain :loading="pivotExporting" @click="handleExportPivot">导 出</el-button>
      </div>
      <div class="pivot-scroll" v-loading="pivotLoading">
        <table class="pivot-table">
          <thead>
            <tr v-for="(headerRow, rowIndex) in pivotTable.headerRows" :key="rowIndex">
              <th
                v-for="(cell, cellIndex) in headerRow"
                :key="cellIndex"
                :colspan="cell.colspan > 1 ? cell.colspan : undefined"
                :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
                class="pivot-th"
                :class="[cell.isGroup ? 'pivot-th--group' : '', cell.isAmount ? 'pivot-th--metric' : '']"
              >
                {{ cell.title }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!bodyRows.length">
              <td :colspan="pivotTable.leaves.length || 1" class="pivot-empty">暂无数据</td>
            </tr>
            <tr v-for="(row, rowIndex) in bodyRows" :key="rowIndex" :class="{ 'pivot-row--total': row.isTotal }">
              <template v-for="(cell, cellIndex) in row.cells" :key="cellIndex">
                <td
                  v-show="cell.span > 0"
                  :rowspan="cell.span > 1 ? cell.span : undefined"
                  class="pivot-td"
                  :class="cell.isDim ? 'pivot-td--dim' : 'pivot-td--num pivot-link'"
                  @click="openDrill(row, cellIndex)"
                >
                  {{ cell.text }}
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </el-dialog>

    <!-- 穿透明细弹窗：数据来自 /lhhsPivot/getCtData（分页），列对齐《穿透.xlsx》 -->
    <el-dialog v-model="drillVisible" custom-class="review-drill-dialog" title="穿透明细" width="94%" top="4vh" append-to-body>
      <div class="drill-meta">
        <span class="drill-meta__path">{{ drillPath }}</span>
        <span class="drill-meta__sum">共 {{ drillTotalCount }} 条 · 单元格金额 {{ drillCellText }} 万元 · 当前页 {{ drillRows.length }} 条</span>
      </div>
      <div class="table-toolbar">
        <el-button size="small" type="primary" plain :loading="drillExporting" @click="handleExportDrill">导 出</el-button>
      </div>
      <div class="drill-scroll" v-loading="drillLoading">
        <table class="drill-table">
          <thead>
            <tr>
              <th v-for="col in drillColumns" :key="col.field" :style="detailColStyle(col)" :class="{ 'is-active': col.field === drillMetricField }">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!drillRows.length">
              <td :colspan="drillColumns.length || 1" class="drill-empty">该条件下暂无明细</td>
            </tr>
            <tr v-for="(row, rowIndex) in drillRows" :key="rowIndex">
              <td
                v-for="col in drillColumns"
                :key="col.field"
                :style="detailColStyle(col)"
                :class="{ 'is-wrap': col.wrap, 'is-amount': col.amount, 'is-active': col.field === drillMetricField }"
              >
                {{ formatDrillCell(row, col) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="drill-pagination">
        <el-pagination
          background
          :current-page="drillPage"
          :page-size="drillLimit"
          :page-sizes="[50, 100, 200]"
          :total="drillTotalCount"
          layout="total, sizes, prev, pager, next"
          @size-change="handleDrillSizeChange"
          @current-change="handleDrillPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "/service/jointReview/offlineReview/reviewAnalysis" })
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { decrypt } from '@/utils/crypto'
import {
  buildBodyRows,
  buildPivotTable,
  downloadDrillExport,
  downloadPivotExport,
  formatDrillCell,
  loadDrillColumns,
  loadDrillPage,
  loadPivotData,
  loadPivotFields,
  normalizeMeetingIds,
  pickColDimCodes,
  pickRowDimCodes
} from './hooks/lhhsPivot'
import type { DimCodeMap, DrillColumn, PivotBodyRow, PivotFieldItem, PivotQuery, PivotTable } from './hooks/lhhsPivot'
import { IObject } from '@/types/interface'

// --- 类型定义 ---
type ZoneKey = 'rowDimensions' | 'columnDimensions' | 'valueMetrics' | 'filters'

type DropZoneConfig = Record<ZoneKey, PivotFieldItem[]>

// --- 会议上下文 ---
// 由 offlineReview/index.vue 加密传入，与 projectManifest 同一套约定（见同目录 hooks/psy.ts）
// 主表勾选一个时传 meetingId（单个），勾选多个时传 meetingIds（数组），这里统一归一成数组
const route = useRoute()
const userInfo = ref<IObject>({})
try {
  userInfo.value = JSON.parse(decrypt(route.query.meetingParams as string))
} catch {
  // 直接以 hash 深链打开时没有该参数，保持空上下文即可
}
const meetingIds = normalizeMeetingIds(userInfo.value.meetingIds || userInfo.value.meetingId)

// --- 左侧字段池（/lhhsPivot/getFields 下发：维度字段 + 金额指标） ---
const fieldLoading = ref(false)
const fieldGroups = ref<{ title: string; fields: PivotFieldItem[] }[]>([
  { title: '维度字段', fields: [] },
  { title: '金额指标 (万元)', fields: [] }
])
const allFields = ref<PivotFieldItem[]>([])
const fieldLabel = (id: string) => allFields.value.find((item) => item.id === id)?.label || id

// --- 穿透明细列（/lhhsPivot/getCtColumns 下发，与导出同一份定义） ---
const drillColumns = ref<DrillColumn[]>([])

const loadFields = async () => {
  fieldLoading.value = true
  try {
    const { dimensions, metrics } = await loadPivotFields()
    allFields.value = [...dimensions, ...metrics]
    fieldGroups.value = [
      { title: '维度字段', fields: dimensions },
      { title: '金额指标 (万元)', fields: metrics }
    ]
  } catch (error) {
    ElMessage.error((error as Error).message || String(error))
  } finally {
    fieldLoading.value = false
  }
  // 列定义与字段目录互不依赖，单独加载：一个失败不影响另一个
  try {
    drillColumns.value = await loadDrillColumns()
  } catch (error) {
    ElMessage.error((error as Error).message || String(error))
  }
}

onMounted(loadFields)

// --- 右侧放置区 ---
// accepts 声明该区域可接受的字段类型：维度字段只能入行/列维度，金额指标只能入数值
const zones: { key: ZoneKey; title: string; subtitle: string; accepts: PivotFieldItem['type'][] }[] = [
  { key: 'rowDimensions', title: '行维度', subtitle: '数据按行分组 · 仅维度字段', accepts: ['dimension'] },
  { key: 'columnDimensions', title: '列维度', subtitle: '数据按列分组 · 仅维度字段', accepts: ['dimension'] },
  { key: 'valueMetrics', title: '数值', subtitle: '单位：万元 · 仅金额指标', accepts: ['metric'] }
  // 筛选条件区暂时不做，待过滤逻辑接入后再放开（config.filters 一并保留）
  // { key: 'filters', title: '筛选条件', subtitle: '按此条件过滤数据 · 仅维度字段', accepts: ['dimension'] }
]

const config = reactive<DropZoneConfig>({
  rowDimensions: [],
  columnDimensions: [],
  valueMetrics: [],
  filters: [] // 筛选条件区暂不开放（见上方 zones 注释），先保留占位
})

// --- 拖拽逻辑 ---
// 使用原生 HTML5 拖拽 API（零依赖）：左侧 dragstart 时写入 dataTransfer，右侧 drop 时还原字段
// 类型约束由 zones.accepts 声明：维度字段只能入行维度/列维度，金额指标只能入数值
const activeZone = ref<ZoneKey | ''>('')
const draggingItem = ref<PivotFieldItem | null>(null)

const zoneAccepts = (zone: ZoneKey, item: PivotFieldItem) => !!zones.find((z) => z.key === zone)?.accepts.includes(item.type)
const isZoneDisabled = (zone: ZoneKey) => !!draggingItem.value && !zoneAccepts(zone, draggingItem.value)
const rejectTip = (type: PivotFieldItem['type']) =>
  type === 'metric' ? '金额指标（万元）只能拖入「数值」区' : '维度字段只能拖入「行维度」「列维度」区'

/** 维度字段在行/列维度里只能出现一次：接口对同一维度同时做行、列维度直接报错 */
const dimensionZone = (zone: ZoneKey) => (zone === 'rowDimensions' ? 'columnDimensions' : 'rowDimensions')

const onDragStart = (item: PivotFieldItem, e: DragEvent) => {
  draggingItem.value = item
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('application/json', JSON.stringify(item))
}

const onDragEnd = () => {
  draggingItem.value = null
  activeZone.value = ''
}

const handleDragOver = (zone: ZoneKey, e: DragEvent) => {
  const item = draggingItem.value
  // 类型不匹配的区域：不阻止默认行为，浏览器显示禁止光标且不触发 drop
  if (!item || !zoneAccepts(zone, item)) {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
    if (activeZone.value === zone) activeZone.value = ''
    return
  }
  e.preventDefault() // 不阻止默认行为则不会触发 drop
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  activeZone.value = zone
}

const handleDragLeave = (zone: ZoneKey, e: DragEvent) => {
  // 拖到子元素上同样会触发 dragleave，需判断是否真的离开了本区域
  const current = e.currentTarget as Node | null
  if (current && e.relatedTarget instanceof Node && current.contains(e.relatedTarget)) return
  if (activeZone.value === zone) activeZone.value = ''
}

const handleDrop = (zone: ZoneKey, e: DragEvent) => {
  e.preventDefault()
  activeZone.value = ''
  const raw = e.dataTransfer?.getData('application/json') || e.dataTransfer?.getData('text/plain')
  if (!raw) return

  let item: PivotFieldItem
  try {
    item = JSON.parse(raw)
  } catch {
    return // 忽略非法拖拽数据（如从页面外部拖入的文本）
  }
  if (!item?.id) return
  if (!zoneAccepts(zone, item)) return ElMessage.warning(rejectTip(item.type)) // 类型不匹配：兜底拦截
  // 维度不能同时作为行维度和列维度（接口会报错，这里先拦住）
  if (item.type === 'dimension' && config[dimensionZone(zone)].some((x) => x.id === item.id)) {
    return ElMessage.warning('同一维度不能同时作为行维度和列维度')
  }
  if (config[zone].some((x) => x.id === item.id)) return // 同一区域内不允许重复添加

  config[zone].push({ ...item })
}

const removeItem = (zone: ZoneKey, index: number) => {
  config[zone].splice(index, 1)
}

// --- 提交：后端透视分析 ---
const resultVisible = ref(false)
const pivotLoading = ref(false)
const pivotExporting = ref(false)
const pivotTable = ref<PivotTable>({ headerRows: [], leaves: [] })
const bodyRows = ref<PivotBodyRow[]>([])
/** 列叶子字段 → 该列的列维度取值编码（穿透用，后端在 getPivotData 里给） */
const colDimCodes = ref<Record<string, DimCodeMap>>({})

const rowDims = computed(() => config.rowDimensions.map((item) => item.id))
const colDims = computed(() => config.columnDimensions.map((item) => item.id))
const buildQuery = (): PivotQuery => ({
  meetingIds,
  rowDims: rowDims.value,
  colDims: colDims.value,
  metrics: config.valueMetrics.map((item) => item.id)
})

const handleConfirm = async () => {
  if (!meetingIds.length) return ElMessage.warning('请先在主表勾选会议数据')
  if (!config.valueMetrics.length) return ElMessage.warning('请先拖入金额指标到「数值」区')
  const params = buildQuery()
  console.log('透视分析入参:', JSON.parse(JSON.stringify(params)))
  resultVisible.value = true
  pivotLoading.value = true
  try {
    const { head, rows, colDimCodes: codes } = await loadPivotData(params)
    const table = buildPivotTable(head)
    pivotTable.value = table
    colDimCodes.value = codes
    // 接口不返回明细条数，表体按叶子列取值；合计行/合计列由后端给，前端不重算
    bodyRows.value = buildBodyRows(table, rows, params.rowDims)
  } catch (error) {
    resultVisible.value = false
    ElMessage.error((error as Error).message || String(error))
  } finally {
    pivotLoading.value = false
  }
}

/** 导出交叉表：入参与透视分析完全一致，走后端生成 xlsx */
const handleExportPivot = async () => {
  pivotExporting.value = true
  try {
    await downloadPivotExport(buildQuery())
  } catch (error) {
    ElMessage.error((error as Error).message || String(error))
  } finally {
    pivotExporting.value = false
  }
}

// --- 穿透（点击确定弹窗内任意金额格） ---
// 后端无状态：穿透与导出都要带上与主查询同一组 meetingIds
const drillVisible = ref(false)
const drillLoading = ref(false)
const drillExporting = ref(false)
const drillRows = ref<Record<string, any>[]>([])
const drillTotalCount = ref(0)
const drillPage = ref(1)
const drillLimit = ref(50)
const drillPath = ref('')
/** 被点击单元格的金额文本：由后端算好，直接展示，不在前端重算合计 */
const drillCellText = ref('')
const drillMetricField = ref('')
const drillDimValues = ref<{ rowDimValues: Record<string, string>; colDimValues: Record<string, string> }>({
  rowDimValues: {},
  colDimValues: {}
})

/** 点击金额单元格穿透：行维度取该行 _dimCodes、列维度取 colDimCodes[列叶子字段]（都是取值编码）
 *  合计行/合计列后端给的是空 map，直接原样传即「该侧不参与过滤」 */
const openDrill = async (row: PivotBodyRow, leafIndex: number) => {
  const leaf = pivotTable.value.leaves[leafIndex]
  if (!leaf?.needFormat) return // 仅金额列可穿透
  const rowDimValues = pickRowDimCodes(row.raw)
  const colDimValues = pickColDimCodes(colDimCodes.value, leaf.field)
  drillDimValues.value = { rowDimValues, colDimValues }
  drillMetricField.value = leaf.title
  // 文案只展示名称、不展示编码；且只列出真正参与过滤的维度（合计行/合计列不出现在文案里）
  const pathParts = rowDims.value.filter((id) => rowDimValues[id] !== undefined).map((id) => `${fieldLabel(id)}：${row.raw[id] ?? '—'}`)
  colDims.value.forEach((id, index) => {
    if (colDimValues[id] !== undefined) pathParts.push(`${fieldLabel(id)}：${leaf.dimValues[index] || '—'}`)
  })
  pathParts.push(leaf.title)
  drillPath.value = pathParts.join(' · ')
  drillCellText.value = row.cells[leafIndex]?.text ?? ''
  drillPage.value = 1
  drillVisible.value = true
  await fetchDrill()
}

const fetchDrill = async () => {
  drillLoading.value = true
  try {
    const res = await loadDrillPage({
      meetingIds,
      ...drillDimValues.value,
      page: drillPage.value,
      limit: drillLimit.value
    })
    drillRows.value = res.records
    drillTotalCount.value = res.total
    drillPage.value = res.current
    drillLimit.value = res.size
  } catch (error) {
    drillRows.value = []
    drillTotalCount.value = 0
    ElMessage.error((error as Error).message || String(error))
  } finally {
    drillLoading.value = false
  }
}

const handleDrillPageChange = (page: number) => {
  drillPage.value = page
  fetchDrill()
}

const handleDrillSizeChange = (size: number) => {
  drillLimit.value = size
  drillPage.value = 1
  fetchDrill()
}

/** 导出穿透明细：后端固定 13 列，导出命中全量（不分页） */
const handleExportDrill = async () => {
  drillExporting.value = true
  try {
    await downloadDrillExport({ meetingIds, ...drillDimValues.value })
  } catch (error) {
    ElMessage.error((error as Error).message || String(error))
  } finally {
    drillExporting.value = false
  }
}

/** 穿透列宽：对齐《穿透.xlsx》列宽 */
const detailColStyle = (col: DrillColumn) => ({ width: `${col.width}px`, minWidth: `${col.width}px` })
</script>

<style scoped lang="less">
// 主题变量取自同模块 css/reviewStyle.less，主色统一走运行时注入的 --color-primary
@primary-color: var(--color-primary, #00857c);
@primary-bg-light: rgba(0, 133, 124, 0.04);
@primary-bg-hover: rgba(0, 133, 124, 0.08);
@primary-border-light: rgba(0, 133, 124, 0.15);

@text-main: #1e293b;
@text-secondary: #475569;
@text-muted: #94a3b8;
@border-main: #e2e8f0;
@page-bg: #f5fbfb;
@surface-bg: rgba(255, 255, 255, 0.92);

.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 16px 18px;
  background: @page-bg;
}

.page-header {
  flex: 0 0 auto;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;

  .page-title {
    font-size: 16px;
    font-weight: 600;
    color: @text-main;
  }

  .page-subtitle {
    font-size: 12px;
    color: @text-muted;
  }
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 14px;
}

// 左侧字段池
.sidebar {
  flex: 0 0 auto;
  width: 240px;
  box-sizing: border-box;
  padding: 12px;
  overflow-y: auto;
  background: @surface-bg;
  border: 1px solid @border-main;
  border-radius: 12px;
}

.field-group {
  & + .field-group {
    margin-top: 18px;
  }

  .group-title {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: @text-muted;
  }
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-item {
  padding: 6px 10px;
  font-size: 13px;
  color: @text-secondary;
  background: #fff;
  border: 1px solid @border-main;
  border-radius: 6px;
  cursor: grab;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;

  &:hover {
    color: @primary-color;
    background: @primary-bg-light;
    border-color: @primary-border-light;
  }

  &:active {
    cursor: grabbing;
  }
}

// 右侧放置区
.right-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.drop-zones {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px; // 为滚动条留空间
}

.drop-zone {
  display: flex;
  flex-direction: column;
  min-height: 84px;
  padding: 14px 16px;
  background: @surface-bg;
  border: 1px dashed @border-main;
  border-radius: 12px;
  transition: border-color 0.18s ease, background-color 0.18s ease;

  &.is-active {
    background: @primary-bg-light;
    border-color: @primary-color;
  }

  // 拖拽中：不接受当前字段类型的区域置灰，配合禁止光标提示
  &.is-disabled {
    opacity: 0.5;
  }
}

.zone-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;

  .zone-title {
    font-size: 13px;
    font-weight: 600;
    color: @text-main;
  }

  .zone-subtitle {
    font-size: 12px;
    color: @text-muted;
  }
}

.zone-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.zone-placeholder {
  font-size: 12px;
  color: @text-muted;
}

.dropped-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: @primary-color;
  background: @primary-bg-hover;
  border: 1px solid @primary-border-light;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.18s ease;

  &:hover {
    background: rgba(0, 133, 124, 0.14);

    .remove-icon {
      opacity: 1;
    }
  }

  .remove-icon {
    font-size: 13px;
    line-height: 1;
    opacity: 0.6;
  }
}

.zone-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

// 表格右上角工具条：导出按钮（结果弹窗、穿透明细弹窗共用）
.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

// 透视结果为空（会议范围内没有取到明细）
.pivot-empty {
  padding: 24px;
  color: @text-muted;
  text-align: center;
}

// 穿透明细分页条：后端分页，默认每页 50 条
.drill-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;

  :deep(.el-pagination.is-background .el-pager li.active),
  :deep(.el-pagination.is-background .el-pager li.is-active) {
    background-color: @primary-color;
  }
}

// 结果弹窗：摘要 + 交叉表
.pivot-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 18px;
  margin-bottom: 10px;
  font-size: 12px;
  color: @text-secondary;

  &__item {
    em {
      margin-right: 6px;
      font-style: normal;
      color: @text-muted;
    }
  }

  &__note {
    color: @text-muted;
  }
}

.pivot-scroll {
  max-height: 62vh;
  overflow: auto;
  background: #fff;
  border: 1px solid @border-main;
  border-radius: 8px;
}

.pivot-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  color: @text-secondary;

  thead {
    position: sticky;
    top: 0;
    z-index: 2;
  }

  th,
  td {
    padding: 7px 10px;
    text-align: left;
    border-right: 1px solid @border-main;
    border-bottom: 1px solid @border-main;
    white-space: nowrap;

    &:last-child {
      border-right: none;
    }
  }

  th {
    font-weight: 600;
    color: @primary-color;
    background: @primary-bg-hover;
    border-bottom: 1px solid @primary-border-light;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  // 行维度取值：同值纵向合并后靠上对齐，读起来更像报表
  .pivot-td--dim {
    color: @text-main;
    vertical-align: top;
  }

  .pivot-td--num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .pivot-th--group {
    text-align: center;
  }

  .pivot-th--metric {
    text-align: right;
  }

  // 可穿透的金额单元格
  .pivot-link {
    color: @primary-color;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .pivot-row--total td {
    font-weight: 600;
    color: @text-main;
    background: @primary-bg-light;
  }
}

// 穿透明细：列宽对齐《穿透.xlsx》，长文本列换行、金额列右对齐
.drill-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 16px;
  margin-bottom: 10px;
  font-size: 12px;
  color: @text-secondary;

  &__path {
    font-weight: 500;
    color: @text-main;
  }

  &__sum {
    color: @text-muted;
  }
}

.drill-scroll {
  max-height: 68vh;
  overflow: auto;
  background: #fff;
  border: 1px solid @border-main;
  border-radius: 8px;
}

.drill-table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  color: @text-secondary;

  thead {
    position: sticky;
    top: 0;
    z-index: 2;
  }

  th,
  td {
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
    border-right: 1px solid @border-main;
    border-bottom: 1px solid @border-main;

    &:last-child {
      border-right: none;
    }
  }

  th {
    font-weight: 600;
    color: @primary-color;
    background: @primary-bg-hover;
    border-bottom: 1px solid @primary-border-light;
    white-space: nowrap;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  td {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
  }

  td.is-wrap {
    white-space: normal;
  }

  td.is-amount {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  // 被点击的金额指标列高亮，便于在明细里定位
  th.is-active,
  td.is-active {
    background: @primary-bg-light;
  }

  .drill-empty {
    padding: 20px;
    color: @text-muted;
    text-align: center;
  }
}
</style>

<style lang="less">
/* el-dialog 挂到 body，外框样式走非 scoped + 自定义类名（对齐本模块弹窗风格） */
.review-pivot-dialog,
.review-drill-dialog {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    margin: 0;
    padding: 14px 18px;
    background: #fcffff;
    border-bottom: 1px solid #e2e8f0;
  }

  .el-dialog__title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }

  .el-dialog__body {
    padding: 14px 18px 18px;
    background: #f5fbfb;
  }
}
</style>
