<template>
  <div class="overview-visualization">
    <Transition name="overview-view">
      <div v-if="visible && viewMode === 'chart'" key="chart" ref="chartRef" class="overview-chart" :aria-label="chartAriaLabel"></div>
      <div v-else-if="visible && viewMode === 'table'" key="table" class="overview-table-wrap">
        <table class="overview-table" :class="{ 'is-amount': statMode === 'amount' }">
          <caption v-if="caption">{{ caption }}</caption>
          <thead
            ><tr
              ><th>{{ rowLabel }}</th
              ><th>合计</th
              ><template v-for="stage in stages" :key="stage.id"
                ><th>{{ stage.title }}</th
                ><th>{{ stage.title }}占比</th></template
              ></tr
            ></thead
          >
          <TransitionGroup name="overview-row" tag="tbody">
            <!-- 纵向合计固定为首行：各阶段按当前口径汇总，占比按阶段合计占全部合计现算。 -->
            <tr key="__total__" class="is-total-row"
              ><th scope="row">合计</th><td class="is-value">{{ formatValue(totals.total) }}</td
              ><template v-for="stage in stages" :key="stage.id"
                ><td class="is-value">{{ formatValue(totals.values[stage.id]) }}</td
                ><td>{{ formatOverviewRatio(totals.ratios[stage.id]) }}</td></template
              ></tr
            >
            <tr v-for="row in chartRows" :key="row.code"
              ><td>{{ row.name }}</td
              ><td class="is-value">{{ formatValue(row.total) }}</td
              ><template v-for="stage in stages" :key="stage.id"
                ><td class="is-value">{{ formatValue(row.values[stage.id]) }}</td
                ><td>{{ formatOverviewRatio(row.ratios[stage.id]) }}</td></template
              ></tr
            >
          </TransitionGroup>
        </table>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GroupStatistics, StatisticValue } from '@/api/overview'
import { createOverviewStages, DEFAULT_CHART_SORT, resolveChartSort } from '../data/overview'
import { sortOverviewRows } from '../data/sort'
import { calculateStatisticRatio, sumStatisticValues } from '../data/totals'
import { createOverviewChartOption } from '../charts'
import { useOverviewChart } from '../composables/useOverviewChart'
import { formatOverviewRatio, formatOverviewValue, getOverviewUnit } from '../data/format'
import { downloadOverviewTables } from '../export'
import type { AmountUnit, ChartSort, Dimension, OverviewRow, SortOrder, StageId, StatMode, ViewMode } from '../types'

const props = defineProps<{
  visible: boolean
  year: string
  data: GroupStatistics[]
  dimension: Dimension
  statMode: StatMode
  amountUnit: AmountUnit
  viewMode: ViewMode
  /** 已穿透时的一级单位/专业名称，用于标题、图片与导出文件名。 */
  scopeName?: string
  /** 当前是否允许点击柱形继续穿透：只在一级数据时开启。 */
  drillable?: boolean
  /** 表格首列表头：一级为「单位/专业」，穿透后为下级单位。 */
  rowLabel?: string
  /** 默认显示的占比曲线阶段编码（来自公共代码）；排序未指向具体阶段时按此显示。 */
  ratioStageIds?: StageId[]
  /** 当前阶段数值或占比排序，默认按项目需求库占比降序。 */
  sortBy?: ChartSort
  /** 排序方向：默认降序，可切换为升序；缺失值始终排在最后。 */
  sortOrder?: SortOrder
}>()
const emit = defineEmits<{ (event: 'drill', payload: { code: string; name: string }): void }>()
const dimensionLabel = computed(() => (props.dimension === 'specialty' ? '专业' : '单位'))
const unit = computed(() => getOverviewUnit(props.statMode, props.amountUnit))
const caption = computed(() => [props.scopeName, props.statMode === 'amount' ? '' : '数量单位：个'].filter(Boolean).join(' · '))
const rowLabel = computed(() => props.rowLabel || dimensionLabel.value)
const drillHint = computed(() => (props.dimension === 'specialty' ? '点击柱形查看下级数据' : '点击柱形查看二级单位'))
const stages = computed(() => createOverviewStages(props.data.flatMap((group) => group.datas)))
/**
 * 排序键（先按语义键换成接口实际编码）决定图表展示什么：数值排序只画该阶段柱形，
 * 占比排序保留全部柱形但只画该阶段占比曲线；阶段不在当前数据中时不做聚焦，
 * 柱形与占比曲线沿用全部阶段及公共代码配置。
 */
const resolvedSort = computed(() => resolveChartSort(props.sortBy ?? DEFAULT_CHART_SORT, stages.value))
const sortStage = computed(() => {
  const sort = resolvedSort.value
  return stages.value.find((stage) => stage.id === sort.slice(sort.indexOf('-') + 1))
})
const barStageId = computed(() => (resolvedSort.value.startsWith('value-') ? sortStage.value?.id : undefined))
const ratioStageId = computed(() => sortStage.value?.id)
const chartStageLabel = computed(() => sortStage.value?.title ?? '')
const chartAriaLabel = computed(
  () =>
    `${props.scopeName ? `${props.scopeName} ` : ''}各${dimensionLabel.value}项目${chartStageLabel.value}${
      props.statMode === 'amount' ? '金额' : '数量'
    }与占比组合图`
)
const parseStatistic = (value?: StatisticValue | null): StatisticValue | null => {
  if (value === undefined || value === null || String(value).trim() === '') return null
  // 保留原始字符串，避免尾零或长金额精度在展示、提示和导出前丢失。
  return value
}
const parseRatio = (value?: StatisticValue | null): number | null => {
  if (value === undefined || value === null) return null
  const text = String(value).trim().replace(/%$/, '').trim()
  if (!text) return null
  const number = Number(text)
  if (!Number.isFinite(number)) return null
  return number
}
const formatValue = (value: StatisticValue | null) => formatOverviewValue(value, props.statMode, props.amountUnit)
const buildRows = (): OverviewRow[] => {
  const valueField = props.statMode === 'amount' ? 'amount' : 'num'
  const ratioField = props.statMode === 'amount' ? 'amountZb' : 'numZb'
  return props.data.map((group): OverviewRow => {
    const row: OverviewRow = {
      code: group.code,
      name: group.name,
      values: {},
      total: parseStatistic(group[valueField]),
      ratios: {}
    }
    // 表头和图例使用接口名称，数值通过稳定的阶段编码关联。
    stages.value.forEach((stage) => {
      const statistics = group.datas.find((item) => item.jdbm === stage.id)
      row.values[stage.id] = parseStatistic(statistics?.[valueField])
      row.ratios[stage.id] = parseRatio(statistics?.[ratioField])
    })
    return row
  })
}
// 排序键里的阶段名称（如 ratio-需求储备库）先换成接口实际编码，排序用的仍是真实阶段键。
const chartRows = computed(() =>
  sortOverviewRows(buildRows(), resolveChartSort(props.sortBy ?? DEFAULT_CHART_SORT, stages.value), props.sortOrder ?? 'desc')
)

/**
 * 表格纵向合计：首行按阶段汇总所有行的当前口径数值；「全部阶段合计」取各阶段列合计之和。
 * 普通行沿用接口 `amountZb` / `numZb`；合计行占比按「阶段列合计 / 全部阶段合计」现算，
 * 不能把该列各行占比相加：各行占比以自身合计为分母，相加会超过 100% 且没有业务含义。
 */
const totals = computed(() => {
  const values: Record<StageId, StatisticValue | null> = {}
  stages.value.forEach((stage) => {
    values[stage.id] = sumStatisticValues(chartRows.value.map((row) => row.values[stage.id]))
  })
  const total = sumStatisticValues(stages.value.map((stage) => values[stage.id]))
  const ratios: Record<StageId, number | null> = {}
  stages.value.forEach((stage) => {
    ratios[stage.id] = calculateStatisticRatio(values[stage.id], total)
  })
  return { total, values, ratios }
})
const legendSelected = ref<Record<string, boolean>>({})
// 排序切到另一个阶段时清掉该阶段此前被手动隐藏的图例状态：排序本身就是「展示这个阶段」的指令，
// 避免切过去只看到空图或没有曲线；其余阶段的手动状态继续保留。
watch(ratioStageId, (current, previous) => {
  if (!current || current === previous) return
  const stage = stages.value.find((item) => item.id === current)
  if (!stage) return
  const next = { ...legendSelected.value }
  delete next[stage.title]
  delete next[`${stage.title}占比`]
  legendSelected.value = next
})
const handleLegendSelectChanged = (params: unknown) => {
  const event = params as { name: string; selected: Record<string, boolean> }
  // 只覆盖用户操作过的系列，其余系列继续遵循公共代码的默认配置。
  legendSelected.value = { ...legendSelected.value, [event.name]: event.selected[event.name] }
}
const handleChartClick = (params: unknown) => {
  if (!props.drillable) return
  const event = params as { dataIndex?: number; seriesId?: string }
  // 只有柱形可穿透，折线（占比）点击不触发。
  if (typeof event.dataIndex !== 'number' || !String(event.seriesId || '').startsWith('value-')) return
  const row = chartRows.value[event.dataIndex]
  if (!row) return
  // 穿透只按所点单位/专业查询，不再携带所点柱形所属阶段（柱形按阶段堆叠，seriesId 仅用于区分柱形与折线）。
  emit('drill', { code: row.code, name: row.name })
}
const { chartRef, renderChart, downloadChart } = useOverviewChart({
  enabled: () => props.visible && props.viewMode === 'chart',
  option: () =>
    createOverviewChartOption(chartRows.value, props.statMode, stages.value, {
      hint: props.drillable ? drillHint.value : '',
      drillable: props.drillable,
      ratioStageIds: props.ratioStageIds,
      legendSelected: legendSelected.value,
      amountUnit: props.amountUnit,
      barStageId: barStageId.value,
      ratioStageId: ratioStageId.value
    }),
  filename: () => `总览-${props.year}${props.scopeName ? `-${props.scopeName}` : ''}.png`,
  onClick: handleChartClick,
  onLegendSelectChanged: handleLegendSelectChanged
})
const downloadTable = () => {
  const amount = props.statMode === 'amount'
  const displayUnit = unit.value
  const valueColumn = { amount, numFmt: amount ? '#,##0.00' : '0' }
  const exportValue = (value: StatisticValue | null) => (amount ? formatOverviewValue(value, 'amount', props.amountUnit) : value)
  return downloadOverviewTables(
    `总览-${props.year}${props.scopeName ? `-${props.scopeName}` : ''}-按${dimensionLabel.value}-${amount ? '金额' : '数量'}`,
    [
      {
        name: `${dimensionLabel.value}统计`,
        columns: [
          { title: rowLabel.value },
          { title: `合计（${displayUnit}）`, ...valueColumn },
          ...stages.value.flatMap((stage) => [
            { title: `${stage.title}（${displayUnit}）`, ...valueColumn },
            { title: `${stage.title}占比`, numFmt: '0.00%' }
          ])
        ],
        // 金额沿用页面展示单位与小数位；超出 Excel 精度的值由导出层保留文本。
        rows: [
          // 首行纵向合计，与页面表格保持一致；占比是百分数，Excel 百分比格式使用对应的小数值。
          [
            '合计',
            exportValue(totals.value.total),
            ...stages.value.flatMap((stage) => {
              const ratio = totals.value.ratios[stage.id]
              // 占比是百分数，Excel 百分比格式使用对应的小数值；截掉浮点误差。
              return [exportValue(totals.value.values[stage.id]), ratio == null ? null : Number((ratio / 100).toFixed(10))]
            })
          ],
          ...chartRows.value.map((row) => [
            row.name,
            exportValue(row.total),
            ...stages.value.flatMap((stage) => {
              // 普通行沿用接口占比，不按合计重新归一。
              const ratio = row.ratios[stage.id]
              return [exportValue(row.values[stage.id]), ratio == null ? null : ratio / 100]
            })
          ])
        ]
      }
    ]
  )
}
defineExpose({ renderChart, downloadChart, downloadTable })
</script>

<style scoped lang="less">
.overview-visualization,
.overview-chart,
.overview-table-wrap {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
}
.overview-visualization {
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
}
.overview-visualization > * {
  grid-area: 1 / 1;
}
.overview-table-wrap {
  overflow: auto;
  margin-top: 15px;
  padding: 0 18px 15px;
}
.overview-table {
  width: 100%;
  // 独立边框随吸顶单元格绘制，避免合并边框在滚动时露出表体。
  border-collapse: separate;
  border-spacing: 0;
  color: var(--overview-text);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.overview-table th {
  background: #eef4f5;
  color: #42646d;
  font-weight: 600;
  white-space: nowrap;
}
// 表头吸顶；首列与「合计」列同时吸左，横向滚动时仍能看到维度与合计。
.overview-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
}
.overview-table th:first-child,
.overview-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  width: 120px;
  min-width: 120px;
  max-width: 120px;
  // 长单位/专业名称在固定列宽内换行，保证第二列冻结偏移始终是 120px。
  white-space: normal;
  overflow-wrap: anywhere;
  background: #fff;
}
.overview-table th:nth-child(2),
.overview-table td:nth-child(2) {
  position: sticky;
  left: 120px;
  z-index: 1;
  background: #fff;
}
.overview-table thead th:first-child,
.overview-table thead th:nth-child(2) {
  z-index: 4;
  background: #eef4f5;
}
// 合计行吸顶在表头下方；首列与合计列同时吸左，滚动时优先于普通行。
.overview-table tbody tr.is-total-row > * {
  position: sticky;
  top: 42px;
  z-index: 3;
  background: #eef8f7;
}
.overview-table tbody tr.is-total-row > :first-child,
.overview-table tbody tr.is-total-row > :nth-child(2) {
  z-index: 5;
}
.overview-table tbody tr.is-total-row > :nth-child(2) {
  left: 120px;
}
.overview-table caption {
  padding-bottom: 10px;
  color: #64748b;
  text-align: center;
}
.overview-table th,
.overview-table td {
  padding: 10px 12px;
  border-right: 1px solid #e5ecef;
  border-bottom: 1px solid #e5ecef;
  // 固定行高，合计行吸顶偏移（42px）不会随字体度量变化。
  line-height: 20px;
  text-align: center;
}
.overview-table th {
  border-top: 1px solid #e3ecee;
}
.overview-table tr > :first-child {
  border-left: 1px solid #e3ecee;
}
.overview-table.is-amount tbody td.is-value {
  text-align: right;
}
.overview-table tbody td:not(:first-child) {
  // 数字不拆行，宽度不足时由外层表格容器提供横向滚动。
  white-space: nowrap;
}
.overview-table tbody tr:nth-child(even) {
  background: #f7f9fa;
}
// 斑马纹行需要给冻结单元格补同色背景，避免透出滚动内容。
.overview-table tbody tr:nth-child(even) > :first-child,
.overview-table tbody tr:nth-child(even) > :nth-child(2) {
  background: #f7f9fa;
}
// 纵向合计固定在表体首行，用浅青底和加粗与普通单位行区分。
.overview-table tbody tr.is-total-row > * {
  background: #eef8f7;
  color: #00766e;
  font-weight: 600;
}
.overview-table tbody tr.is-total-row > :first-child {
  border-left: 1px solid #e3ecee;
}
// 冻结列和普通列使用同一悬停底色，横向阅读时始终能跟住当前行。
.overview-table tbody tr:not(.is-total-row):hover > * {
  background: #edf7f4;
}
</style>
