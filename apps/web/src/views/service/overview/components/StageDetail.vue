<template>
  <div class="stage-detail">
    <div class="detail-navigation">
      <h2>{{ title }}</h2>
      <div class="detail-tabs" role="tablist" :aria-label="`${title}统计指标`">
        <button
          v-for="(tab, index) in tabs"
          :id="`stage-${stageId}-tab-${index}`"
          :key="tab"
          type="button"
          role="tab"
          :class="{ active: activeTab === tab }"
          :aria-selected="activeTab === tab"
          :aria-controls="`stage-${stageId}-panel`"
          :tabindex="activeTab === tab ? 0 : -1"
          @click="activeTab = tab"
          @keydown="navigateTab($event, index)"
          >{{ tab }}</button
        >
      </div>
    </div>

    <div :id="`stage-${stageId}-panel`" class="detail-body" role="tabpanel" :aria-labelledby="`stage-${stageId}-tab-${tabs.indexOf(activeTab)}`">
      <!-- 切换到「表」时整块显示阶段宽表，饼图与两块排名只在「全览图」下渲染。 -->
      <StageWideTable
        v-if="viewMode === 'table'"
        ref="wideTableRef"
        :stage-id="stageId"
        :title="title"
        :year="year"
        :month="month"
        :yjdws="yjdws"
        :zybms="zybms"
        :stat-mode="statMode"
        :amount-unit="amountUnit"
        :org-type="orgType"
        :dimension="dimension"
        :role-context="roleContext"
        @download-availability="wideTableDownloadAvailable = $event"
      />
      <div v-else-if="activeTab === '概览'" class="detail-grid">
        <BudgetBreakdown
          v-model:selected-category="selectedCategory"
          v-model:selected-yslx="selectedYslx"
          :gl-data="glData"
          :xmlx-list="xmlxList"
          :stat-mode="statMode"
          :amount-unit="amountUnit"
          :loading="glLoading"
          :error="glError"
          :category-loading="xmlxLoading"
          :category-error="xmlxError"
          @retry="reloadGl"
          @retry-category="reloadXmlxList"
        />

        <section class="detail-card city-card" :aria-label="rankingTitle" :style="filterColorStyle">
          <div class="detail-heading"
            ><h3>{{ rankingTitle }}</h3
            ><span v-if="activeBudgetTypeName" class="category-badge">{{ activeBudgetTypeName }}</span
            ><span class="category-badge">{{ activeCategoryName }}</span></div
          >
          <div v-if="dwRankingLoading" class="detail-state" role="status">
            <LoaderCircle :size="18" class="overview-spinner" aria-hidden="true" /><span>排名数据加载中…</span>
          </div>
          <div v-else-if="dwRankingError" class="detail-state is-error" role="alert">
            <TriangleAlert :size="18" aria-hidden="true" /><span>{{ dwRankingError }}</span
            ><button type="button" @click="reloadDwRanking">重新加载</button>
          </div>
          <div v-else-if="rankingRows.length" class="ranking-content">
            <!-- 单位排名只在「全览图」下渲染，表格形态由阶段宽表承载。 -->
            <div ref="rankingWrapRef" class="ranking-chart-wrap" :class="{ 'is-scrollable': rankingScrollable }">
              <div
                ref="rankingRef"
                class="city-chart"
                :style="{ minHeight: `${rankingChartMinHeight}px` }"
                role="img"
                :aria-label="`${rankingEntityLabel}排名，点击柱形筛选项目类型排名`"
              />
            </div>
          </div>
          <p v-else class="detail-empty">暂无{{ activeCategoryName }}排名数据</p>
        </section>

        <section class="detail-card project-card" aria-label="项目类型排名" :style="filterColorStyle">
          <div class="detail-heading"
            ><h3>项目类型排名</h3><span v-if="activeBudgetTypeName" class="category-badge">{{ activeBudgetTypeName }}</span
            ><span class="category-badge">{{ activeCategoryName }}</span
            ><span v-if="selectedRankingRow" class="category-badge is-filter">{{ selectedRankingRow.name }}</span
            ><button v-if="selectedRankingRow" type="button" class="detail-filter-clear" @click="clearRankingFilter">取消筛选</button></div
          >
          <div v-if="xmlxRankingLoading" class="detail-state" role="status">
            <LoaderCircle :size="18" class="overview-spinner" aria-hidden="true" /><span>排名数据加载中…</span>
          </div>
          <div v-else-if="xmlxRankingError" class="detail-state is-error" role="alert">
            <TriangleAlert :size="18" aria-hidden="true" /><span>{{ xmlxRankingError }}</span
            ><button type="button" @click="reloadXmlxRanking">重新加载</button>
          </div>
          <div v-else-if="xmlxRankingRows.length" class="ranking-table-wrap">
            <table class="detail-table project-table" aria-label="项目类型排名数据">
              <thead
                ><tr
                  ><th>排名</th><th>项目类型</th><th>{{ valueHeader }}</th
                  ><th>占比</th></tr
                ></thead
              >
              <tbody
                ><tr v-for="(project, index) in xmlxRankingRows" :key="project.id"
                  ><td>{{ index + 1 }}</td
                  ><td>{{ project.name }}</td
                  ><td class="amount-cell">{{ formatValue(project.value) }}</td
                  ><td>{{ formatOverviewRatio(project.ratio) }}</td></tr
                ></tbody
              >
            </table>
          </div>
          <p v-else class="detail-empty">暂无{{ activeCategoryName }}项目类型数据</p>
        </section>
      </div>
      <div v-else class="metric-empty"
        ><h3>{{ activeTab }}</h3
        ><p>暂无{{ activeTab }}数据</p></div
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { LoaderCircle, TriangleAlert } from '@lucide/vue'
import type { OverviewRankData, StatisticValue } from '@/api/overview'
import BudgetBreakdown from './BudgetBreakdown.vue'
import StageWideTable from './StageWideTable.vue'
import { createRankingChartOption, resolveRankingChartMinHeight } from '../charts'
import { useOverviewChart } from '../composables/useOverviewChart'
import { useStageDetail } from '../composables/useStageDetail'
import { getBudgetTypeName } from '../data/overview'
import { BUDGET_TYPE_COLORS, PROJECT_TYPE_COLORS } from '../data/colors'
import { formatOverviewRatio, formatOverviewValue, getOverviewUnit } from '../data/format'
import { calculateStatisticRatio, sumStatisticValues } from '../data/totals'
import { downloadOverviewTables } from '../export'
import type { OverviewExportSheet } from '../export'
import type { AmountUnit, BudgetFilter, Dimension, OrgType, RankingRow, RoleContext, StageId, StatMode, ViewMode } from '../types'

const props = withDefaults(
  defineProps<{
    stageId: StageId
    title: string
    year: string
    month: string
    /** 项目单位筛选（chooseYjdws）：所选一级单位编码，空数组表示全部。 */
    yjdws: string[]
    /** 省专业归口筛选（chooseZybms）：所选省归口部门编码，空数组表示全部。 */
    zybms: string[]
    statMode: StatMode
    amountUnit: AmountUnit
    viewMode: ViewMode
    orgType: OrgType
    dimension: Dimension
    roleContext: RoleContext
  }>(),
  { yjdws: () => [], zybms: () => [] }
)
const emit = defineEmits<{ (event: 'download-availability', available: boolean): void }>()
const activeTab = ref('概览')
const selectedCategory = ref('')
// 预算类型筛选取自预算类型饼图的扇区/图例点击，空字符串表示两块排名不做预算类型筛选。
const selectedYslx = ref<BudgetFilter>('')
// 点击单位/专业排名柱形后选中的行 id，作为 searchZybm 只筛选项目类型排名。
const selectedRankingId = ref('')
// 阶段详情只保留「概览」页签。
const tabs = computed(() => ['概览'])

const {
  glData,
  glLoading,
  glError,
  xmlxList,
  xmlxLoading,
  xmlxError,
  dwRanking,
  dwRankingLoading,
  dwRankingError,
  xmlxRanking,
  xmlxRankingLoading,
  xmlxRankingError,
  reloadGl,
  reloadXmlxList,
  reloadDwRanking,
  reloadXmlxRanking
} = useStageDetail(() => ({
  stageId: props.stageId,
  year: props.year,
  month: props.month,
  yjdws: props.yjdws,
  zybms: props.zybms,
  dimension: props.dimension,
  orgType: props.orgType,
  roleContext: props.roleContext,
  statMode: props.statMode,
  viewMode: props.viewMode,
  xmlxId: selectedCategory.value,
  yslx: selectedYslx.value,
  searchZybm: selectedRankingId.value
}))

// 分类默认不选中；刷新后原选项失效时清空选择，两块排名恢复全量口径。
watch([xmlxList, xmlxLoading, xmlxError], ([list, loading, error]) => {
  if (loading || error) return
  if (!list.some((item) => item.xmlxId === selectedCategory.value)) selectedCategory.value = ''
})
// 预算类型与项目类型筛选互斥：选中一个即清空另一个，排名只按最后一次选择筛选，不叠加两种条件。
watch(selectedYslx, (value) => {
  if (value) selectedCategory.value = ''
})
watch(selectedCategory, (value) => {
  if (value) selectedYslx.value = ''
})
const activeCategoryName = computed(() => xmlxList.value.find((item) => item.xmlxId === selectedCategory.value)?.xmlxName || '全部项目类型')
// 预算类型与项目类型筛选互斥：两块排名的标题旁只标注当前生效的那一个筛选。
const activeBudgetTypeName = computed(() => getBudgetTypeName(selectedYslx.value))
const activeFilterColor = computed(() => {
  if (selectedYslx.value) return BUDGET_TYPE_COLORS[selectedYslx.value]
  const index = xmlxList.value.findIndex((item) => item.xmlxId === selectedCategory.value)
  return index >= 0 ? PROJECT_TYPE_COLORS[index % PROJECT_TYPE_COLORS.length] : undefined
})
const filterColorStyle = computed<CSSProperties | undefined>(() => {
  const color = activeFilterColor.value
  return color ? ({ '--filter-color': color, '--filter-background': `${color}14`, '--filter-border': `${color}55` } as CSSProperties) : undefined
})

const isAmount = computed(() => props.statMode === 'amount')
const unit = computed(() => getOverviewUnit(props.statMode, props.amountUnit))
const isSpecialty = computed(() => props.dimension === 'specialty')
// 排名标题随维度切换：按专业展示「省专业排名」，按单位沿用「江苏各市排名 / 直属单位排名」。
const rankingTitle = computed(() => (isSpecialty.value ? '省专业排名' : '项目单位排名'))
const rankingEntityLabel = computed(() => (isSpecialty.value ? '省专业' : props.orgType === 'city' ? '江苏各市' : '直属单位'))
const valueHeader = computed(() => (isAmount.value ? `金额（${unit.value}）` : `数量（${unit.value}）`))
const formatValue = (value?: StatisticValue | null) => formatOverviewValue(value, props.statMode, props.amountUnit)
const toRows = (list: OverviewRankData[]): RankingRow[] => {
  const total = sumStatisticValues(list.map((item) => (isAmount.value ? item.amount : item.num)))
  return list.map((item) => {
    const value = (isAmount.value ? item.amount : item.num) ?? null
    return { id: item.id, name: item.name, value, ratio: calculateStatisticRatio(value, total) }
  })
}

const rankingRows = computed(() => toRows(dwRanking.value))
// 排名图撑满卡片：短名单（13 家地市、省专业）按卡片高度平均分行，始终不出现滚动条；
// 更长的名单（全省、直属单位）按每行 32px 绘制，在卡片内部滚动。
const rankingWrapRef = ref<HTMLDivElement | null>(null)
const rankingWrapHeight = ref(0)
const measureRankingWrap = () => {
  rankingWrapHeight.value = rankingWrapRef.value?.clientHeight ?? 0
}
// 容器挂载时同步量一次，首帧就按卡片实际高度绘制；之后跟随侧栏收起、网格重排等尺寸变化。
watch(rankingWrapRef, measureRankingWrap, { flush: 'post' })
useResizeObserver(rankingWrapRef, measureRankingWrap)
// 13 家地市不设最小高度，图表随卡片撑满；长名单放不下时才返回滚动所需高度。
const rankingChartMinHeight = computed(() => resolveRankingChartMinHeight(rankingRows.value.length, rankingWrapHeight.value))
// 短名单不滚动：只有长名单放不下时才允许容器滚动，避免 ECharts 画布因亚像素取整比容器多出不足 1px 时闪出滚动条。
const rankingScrollable = computed(() => rankingChartMinHeight.value > 0)
const xmlxRankingRows = computed(() => toRows(xmlxRanking.value))
const summarizeRanking = (rows: RankingRow[]): RankingRow => {
  const value = sumStatisticValues(rows.map((row) => row.value))
  return { id: '', name: '合计', value, ratio: calculateStatisticRatio(value, value), isTotal: true }
}
const rankingTableRows = computed(() => (rankingRows.value.length ? [summarizeRanking(rankingRows.value), ...rankingRows.value] : []))
// 当前选中的排名柱形：标题旁展示筛选标识，点击同一柱形或「取消筛选」恢复全量项目类型排名。
const selectedRankingRow = computed(() => rankingRows.value.find((row) => row.id === selectedRankingId.value))
const clearRankingFilter = () => {
  selectedRankingId.value = ''
}

// 切换阶段、年度、项目单位 / 省专业归口、维度或组织类型后清空排名筛选，避免旧单位/专业编码继续过滤新条件。
watch(
  [() => props.stageId, () => props.year, () => props.month, () => props.yjdws, () => props.zybms, () => props.dimension, () => props.orgType],
  () => {
    selectedRankingId.value = ''
  }
)
// 仅在刷新成功后校验选中项；加载期间暂时清空数组或请求失败都不代表单位已被移除。
watch([rankingRows, dwRankingLoading, dwRankingError], ([rows, loading, error]) => {
  if (loading || error) return
  if (selectedRankingId.value && !rows.some((row) => row.id === selectedRankingId.value)) selectedRankingId.value = ''
})

const canRenderChart = computed(() => props.viewMode === 'chart' && activeTab.value === '概览' && rankingRows.value.length > 0)
const {
  chartRef: rankingRef,
  chartAvailable,
  downloadChart
} = useOverviewChart({
  enabled: () => canRenderChart.value,
  onClick: (params) => {
    // 点击排名柱形把所点行 id 作为 searchZybm 筛选项目类型排名，再次点击同一柱形取消。
    const { dataIndex } = params as { dataIndex?: number }
    const row = rankingRows.value[Number(dataIndex)]
    if (!row?.id) return
    selectedRankingId.value = selectedRankingId.value === row.id ? '' : row.id
  },
  option: () =>
    createRankingChartOption(rankingRows.value, activeCategoryName.value, props.statMode, props.amountUnit, {
      selectedId: selectedRankingId.value,
      color: activeFilterColor.value,
      clickable: true,
      title: rankingTitle.value,
      nameLabel: isSpecialty.value ? '专业' : '单位'
    }),
  filename: () => `${props.title}-${activeCategoryName.value}-${rankingTitle.value}.png`
})

const navigateTab = (event: KeyboardEvent, index: number) => {
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.value.length
  else if (event.key === 'ArrowLeft') next = (index + tabs.value.length - 1) % tabs.value.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = tabs.value.length - 1
  else return
  event.preventDefault()
  activeTab.value = tabs.value[next]
  document.getElementById(`stage-${props.stageId}-tab-${next}`)?.focus()
}

const wideTableRef = ref<InstanceType<typeof StageWideTable> | null>(null)
// 「表」模式下可下载性取决于阶段宽表，由子组件回报。
const wideTableDownloadAvailable = ref(false)
const downloadAvailable = computed(() => (props.viewMode === 'table' ? wideTableDownloadAvailable.value : chartAvailable.value))
watch(downloadAvailable, (available) => emit('download-availability', available), { immediate: true })

const downloadDetailTables = () => {
  const sheets: OverviewExportSheet[] = []
  if (glData.value) {
    const city = isAmount.value ? glData.value.sytcJe : glData.value.sytcSl
    const province = isAmount.value ? glData.value.sjtcJe : glData.value.sjtcSl
    const total = sumStatisticValues([city, province])
    const denominator = (isAmount.value ? glData.value.sumJe : glData.value.sumSl) ?? total
    sheets.push({
      name: '预算类型占比',
      columns: [
        { title: '预算类型' },
        { title: valueHeader.value, amount: isAmount.value, numFmt: isAmount.value ? '#,##0.00' : '0' },
        { title: '占比' }
      ],
      rows: [
        ['合计', formatValue(total), formatOverviewRatio(calculateStatisticRatio(total, denominator))],
        ['市域统筹', formatValue(city), formatOverviewRatio(isAmount.value ? glData.value.sytcJeZb : glData.value.sytcSlZb)],
        ['省级统筹', formatValue(province), formatOverviewRatio(isAmount.value ? glData.value.sjtcJeZb : glData.value.sjtcSlZb)]
      ]
    })
  }
  if (rankingRows.value.length) {
    sheets.push({
      name: rankingTitle.value,
      columns: [
        { title: isSpecialty.value ? '专业' : '单位' },
        { title: valueHeader.value, amount: isAmount.value, numFmt: isAmount.value ? '#,##0.00' : '0' },
        { title: '占比', numFmt: '0.00%' }
      ],
      rows: rankingTableRows.value.map((row) => [row.name, formatValue(row.value), row.ratio == null ? null : row.ratio / 100])
    })
  }
  if (xmlxRankingRows.value.length) {
    sheets.push({
      name: '项目类型排名',
      columns: [
        { title: '排名' },
        { title: '项目类型' },
        { title: valueHeader.value, amount: isAmount.value, numFmt: isAmount.value ? '#,##0.00' : '0' },
        { title: '占比', numFmt: '0.00%' }
      ],
      // 项目类型排名不计算合计：页面与导出都只列实际排名行。
      rows: xmlxRankingRows.value.map((row, index) => [index + 1, row.name, formatValue(row.value), row.ratio == null ? null : row.ratio / 100])
    })
  }
  if (!sheets.length) return
  // 文件名带上当前筛选：两块排名在工作表内已按项目类型、预算类型与排名筛选生成，导出后可自解释。
  const filterName = [activeCategoryName.value, activeBudgetTypeName.value, selectedRankingRow.value?.name].filter(Boolean).join('-')
  return downloadOverviewTables(`${props.title}-${props.year}-${filterName}`, sheets)
}

// 「表」模式下载阶段宽表，「全览图」模式下载阶段详情的三张工作表。
const downloadTable = () => (props.viewMode === 'table' ? wideTableRef.value?.downloadTable() : downloadDetailTables())
defineExpose({ downloadChart, downloadTable })
</script>

<style scoped lang="less">
@import '../styles/detail-card.less';

.stage-detail {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 0 var(--overview-gap) var(--overview-gap);
  font-variant-numeric: tabular-nums;
}
.detail-navigation {
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 4px 24px;
  min-height: 38px;
  padding: 0 8px;
  border-bottom: 1px solid var(--overview-border);
}
.detail-navigation h2 {
  margin: 0;
  color: #00857e;
  font-size: 18px;
  line-height: 32px;
  font-weight: 700;
}
.detail-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.detail-tabs button {
  position: relative;
  padding: 0 0 8px;
  border: 0;
  background: transparent;
  color: #888;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.detail-tabs button.active {
  color: #111;
}
.detail-tabs button.active::after {
  content: '';
  position: absolute;
  inset: auto 0 -2px;
  height: 3px;
  background: var(--overview-teal);
}
.detail-tabs button:hover {
  color: #00857e;
}
button:focus-visible {
  outline: 2px solid #007d77;
  outline-offset: 3px;
}
.detail-body {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding-top: var(--overview-gap);
  overflow: auto;
}
// 一行四卡：预算类型占比、项目类型占比两张圆环在左（筛选入口），单位/专业排名、项目类型排名在右（筛选结果）。
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 1.25fr) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: var(--overview-gap);
  height: 100%;
  min-height: 0;
}
.city-card,
.project-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.category-badge {
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 2px 16px;
  border: 1px solid var(--filter-border, #bce2e6);
  border-radius: 12px;
  background: var(--filter-background, #e5f3f5);
  color: var(--filter-color, #159da6);
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
}
.category-badge.is-filter {
  border-color: var(--filter-border, #7fc9c4);
  background: var(--filter-background, #d9f0ef);
  color: var(--filter-color, #007d77);
  font-weight: 600;
}
.ranking-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.ranking-chart-wrap,
.ranking-table-wrap {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overscroll-behavior: contain;
  scrollbar-color: #b8ddd9 transparent;
  scrollbar-width: thin;
}
// 13 家地市等短名单撑满卡片，不出现滚动条；长名单放不下时才在卡片内部滚动。
.ranking-chart-wrap {
  overflow: hidden;
}
.ranking-chart-wrap.is-scrollable {
  overflow: auto;
}
.ranking-table-wrap {
  overflow: auto;
}
.city-chart {
  width: 100%;
  height: 100%;
}
// 窄卡片收紧单元格留白，让四个表头（排名 / 项目类型 / 金额 / 占比）单行放下。
.project-table th,
.project-table td {
  padding-right: 6px;
  padding-left: 6px;
}
.project-table thead th:first-child {
  width: 12%;
}
.project-table thead th:nth-child(3) {
  width: 32%;
}
.project-table thead th:last-child {
  width: 20%;
}
.ranking-table-wrap {
  margin: 8px 12px 12px;
}
.ranking-table-wrap table {
  width: 100%;
}
.ranking-table-wrap td.amount-cell,
.ranking-table-wrap td:last-child {
  white-space: nowrap;
}
.ranking-table-wrap thead th {
  position: sticky;
  top: 0;
  z-index: 1;
}
.metric-empty {
  display: flex;
  height: 100%;
  min-height: 160px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
}
.metric-empty h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #00857e;
}
.metric-empty p {
  margin: 0;
}
// 窄工作区改为 2 × 2：上排两张圆环，下排两块排名，详情区内部滚动。
@container overview (max-width: 1200px) {
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, 300px);
    height: auto;
  }
}
</style>
