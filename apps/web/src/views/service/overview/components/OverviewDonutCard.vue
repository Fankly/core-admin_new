<template>
  <section class="detail-card donut-card" :aria-label="title">
    <div class="detail-heading"
      ><h3>{{ title }}</h3
      ><button v-if="selectedRow" type="button" class="detail-filter-clear" @click="$emit('toggle', selectedRow.id)">取消筛选</button></div
    >
    <div v-if="loading" class="detail-state" role="status">
      <LoaderCircle :size="18" class="overview-spinner" aria-hidden="true" /><span>{{ loadingText }}</span>
    </div>
    <div v-else-if="error" class="detail-state is-error" role="alert">
      <TriangleAlert :size="18" aria-hidden="true" /><span>{{ error }}</span
      ><button type="button" @click="$emit('retry')">重新加载</button>
    </div>
    <template v-else-if="rows.length">
      <div class="donut-stage">
        <div ref="chartRef" class="donut-chart" role="img" :aria-label="chartLabel"></div>
        <!-- 圆心默认显示合计；悬停扇区或图例时切换为该项读数，有筛选时常驻显示选中项。 -->
        <div :key="centerKey" class="donut-center" :style="centerStyle" aria-hidden="true">
          <span class="donut-center-caption"
            ><i v-if="focusedRow" :style="{ background: focusedRow.color }"></i>{{ focusedRow ? focusedRow.name : totalCaption }}</span
          >
          <strong>{{ centerValue }}</strong>
          <span class="donut-center-meta"
            >{{ unit }}<b v-if="focusedRow">{{ focusedRow.ratio }}</b></span
          >
        </div>
      </div>
      <!-- 图例回到圆环下方（沿用重构前排布）：预算类型每行「色块 + 名称 + 金额 + 占比」，项目类型两列「色块 + 名称 + 占比」。 -->
      <div class="donut-legend" :style="legendStyle">
        <div ref="legendListRef" class="donut-legend-list" :class="`is-${legendLayout}`" role="group" :aria-label="legendLabel">
          <button
            v-for="(row, index) in rows"
            :key="row.id"
            type="button"
            :class="{ active: selectedId === row.id, dimmed: !!selectedId && selectedId !== row.id }"
            :aria-pressed="selectedId === row.id"
            :aria-label="
              selectedId === row.id ? `取消${row.name}筛选` : `按${row.name}筛选两块排名，${formatValue(row.value)} ${unit}，占比 ${row.ratio}`
            "
            :title="legendLayout === 'grid' ? `${row.name} ${formatValue(row.value)} ${unit} · 占比 ${row.ratio}` : undefined"
            @click="$emit('toggle', row.id)"
            @mouseenter="enterRow(index)"
            @mouseleave="leaveRow"
            @focus="enterRow(index)"
            @blur="leaveRow"
            ><i :style="{ background: row.color }" aria-hidden="true"></i><span class="legend-name">{{ row.name }}</span
            ><OverviewTooltip v-if="legendValue" :content="`${formatValue(row.value)} ${unit}`"
              ><span class="legend-value"
                ><strong>{{ formatValue(row.value) }}</strong
                ><span>{{ unit }}</span></span
              ></OverviewTooltip
            ><span class="legend-ratio">{{ row.ratio }}</span></button
          >
        </div>
      </div>
    </template>
    <p v-else class="detail-empty">{{ emptyText }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { LoaderCircle, TriangleAlert } from '@lucide/vue'
import { overviewTooltipStyle, renderOverviewTooltip } from '../charts'
import { useOverviewChart } from '../composables/useOverviewChart'
import { estimateTextEm, formatOverviewValue, getOverviewUnit } from '../data/format'
import { sumStatisticValues } from '../data/totals'
import OverviewTooltip from './OverviewTooltip.vue'
import type { AmountUnit, DonutRow, StatMode } from '../types'

// 图例最多显示四行（约 108px），更多项目类型在图例区内滚动，不挤压圆环。
const LEGEND_MAX_HEIGHT = 108
// 圆环内外径（占画布短边一半的百分比）；圆心读数的 cqmin 尺寸与提示框避让都按这组值换算。
const RING_INNER = 52
const RING_OUTER = 86

const props = withDefaults(
  defineProps<{
    title: string
    /** 悬停提示表格首列表头，如「预算类型」「项目类型」。 */
    nameLabel: string
    rows: DonutRow[]
    /** 当前筛选的行 id，空字符串表示未筛选。 */
    selectedId: string
    /** 圆心默认展示的合计值。 */
    total?: string | number | null
    /** 圆心默认的说明文字，如「合计」「6 类合计」。 */
    totalCaption: string
    statMode: StatMode
    amountUnit: AmountUnit
    loading: boolean
    loadingText: string
    error: string
    emptyText: string
    chartLabel: string
    legendLabel: string
    /** 图例排布：rows 每行一条（色块 / 名称 / 金额 / 占比），grid 两列紧凑（色块 / 名称 / 占比）。 */
    legendLayout?: 'rows' | 'grid'
    /** 图例是否带金额/数量列；预算类型显示，项目类型只显示占比。 */
    legendValue?: boolean
    /** 两张圆环卡片中较高的图例高度，由父组件同步，保证两个圆环处在同一水平线上。 */
    legendHeight: number
  }>(),
  { legendLayout: 'grid', legendValue: false }
)
const emit = defineEmits<{
  (event: 'toggle', id: string): void
  (event: 'retry'): void
  (event: 'legend-height', height: number): void
}>()

const unit = computed(() => getOverviewUnit(props.statMode, props.amountUnit))
const formatValue = (value?: string | number | null) => formatOverviewValue(value, props.statMode, props.amountUnit)
const selectedRow = computed(() => props.rows.find((row) => row.id === props.selectedId))

// 圆心读数：悬停扇区/图例时显示该项，否则显示选中项，都没有时显示合计。
const hoverIndex = ref(-1)
const focusedRow = computed(() => props.rows[hoverIndex.value] || selectedRow.value)
const centerKey = computed(() => focusedRow.value?.id ?? 'total')
const centerValue = computed(() => formatValue(focusedRow.value ? focusedRow.value.value : props.total))
// 圆心数值按字宽换算字号，长金额等比缩小、始终完整显示，不省略。
const centerStyle = computed<CSSProperties & { '--center-em': number }>(() => ({ '--center-em': estimateTextEm(centerValue.value) }))
// 数据刷新后旧下标可能指向别的项，收起悬停读数。
watch(
  () => props.rows,
  () => {
    hoverIndex.value = -1
  }
)
// 悬停提示沿用总览柱状图的结构：标题、合计、明细表格与筛选提示；合计取当前圆环数据之和。
const tooltipTotal = computed(() => sumStatisticValues(props.rows.map((row) => row.value)))
const tooltipFormatter = (params: unknown) => {
  const item = Array.isArray(params) ? params[0] : (params as { dataIndex: number; marker?: string })
  const row = props.rows[Number(item.dataIndex)]
  if (!row) return ''
  return renderOverviewTooltip({
    title: props.title,
    statMode: props.statMode,
    amountUnit: props.amountUnit,
    total: tooltipTotal.value,
    rows: [{ marker: item.marker, name: row.name, value: row.value, ratio: row.ratio }],
    nameLabel: props.nameLabel,
    hint: props.selectedId === row.id ? '点击取消筛选' : '点击筛选两块排名'
  })
}
// 扇区用未舍入原始值计算比例；全零时展示空环，不画等分扇区。有筛选时未选中的扇区淡出。
const chartData = computed(() => {
  const data = props.rows.map((row) => ({
    id: row.id,
    name: row.name,
    value: Math.max(0, Number(row.value)) || 0,
    itemStyle: { color: row.color, opacity: props.selectedId && props.selectedId !== row.id ? 0.28 : 1 },
    emphasis: { itemStyle: { color: row.color } }
  }))
  return data.some((item) => item.value > 0) ? data : []
})
const { chartRef, highlightData, downplayData } = useOverviewChart({
  // 全零也是有效数据，需要 setOption([]) 绘制空环并清掉上一口径的扇区。
  enabled: () => !props.loading && !props.error && props.rows.length > 0,
  filename: () => `${props.title}.png`,
  // 提示框放在圆环外侧，圆心读数始终可见。
  ringRadius: RING_OUTER / 100,
  selectedDataIndex: () => (chartData.value.length ? props.rows.findIndex((row) => row.id === props.selectedId) : -1),
  // 点击扇区与点击图例同为一次筛选切换，两者共用 rows 的下标。
  onClick: (params) => {
    const row = props.rows[Number((params as { dataIndex?: number }).dataIndex)]
    if (row) emit('toggle', row.id)
  },
  onMouseOver: (params) => {
    const { dataIndex } = params as { dataIndex?: number }
    if (typeof dataIndex === 'number') hoverIndex.value = dataIndex
  },
  // 指针从扇区移到圆心空白处或画布外，都恢复默认读数。
  onMouseOut: () => {
    hoverIndex.value = -1
  },
  onGlobalOut: () => {
    hoverIndex.value = -1
  },
  option: () => ({
    textStyle: { fontFamily: '"Overview Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      ...overviewTooltipStyle,
      formatter: tooltipFormatter
    },
    series: [
      {
        type: 'pie',
        // 环形图参考 ECharts「Doughnut Chart」：内外径约 0.6、扇区之间留白缝，标签不常驻、读数放在圆心。
        radius: [`${RING_INNER}%`, `${RING_OUTER}%`],
        center: ['50%', '50%'],
        startAngle: 90,
        avoidLabelOverlap: false,
        stillShowZeroSum: false,
        // 扇区可点击做筛选，指针提示可点击。
        cursor: 'pointer',
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        // 悬停与点击选中共用外弹和轻投影；选中态在移出后仍由独立高亮键保留。
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: { shadowBlur: 12, shadowOffsetY: 3, shadowColor: 'rgba(15, 23, 42, 0.18)' }
        },
        showEmptyCircle: true,
        emptyCircleStyle: { color: '#edf1f3' },
        data: chartData.value
      }
    ]
  })
})
// 图例悬停或键盘聚焦时联动高亮对应扇区，圆心同步切换读数。
const enterRow = (index: number) => {
  hoverIndex.value = index
  highlightData(index)
}
const leaveRow = () => {
  hoverIndex.value = -1
  downplayData()
}

// 上报图例自然高度（不含父组件同步的最小高度），父组件取两张卡片的较大值回传；
// 量列表的 border-box（含图例内边距），与图例区的 max-height 同一基准。
const legendListRef = ref<HTMLElement | null>(null)
useResizeObserver(legendListRef, () => {
  const element = legendListRef.value
  if (element) emit('legend-height', Math.min(LEGEND_MAX_HEIGHT, Math.ceil(element.offsetHeight)))
})
// 加载、失败或无数据时图例卸载，不再参与对齐。
watch(legendListRef, (element) => {
  if (!element) emit('legend-height', 0)
})
const legendStyle = computed<CSSProperties>(() => ({ minHeight: `${props.legendHeight}px`, maxHeight: `${LEGEND_MAX_HEIGHT}px` }))
</script>

<style scoped lang="less">
@import '../styles/detail-card.less';

button:focus-visible {
  outline: 2px solid #007d77;
  outline-offset: 3px;
}
.donut-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.donut-card .detail-filter-clear {
  margin-left: auto;
}
// 图例回到圆环下方：预算类型每行一条、项目类型两列紧凑；高度由父组件同步为两张卡片中的较大值，超过四行在区内滚动。
.donut-legend {
  flex: 0 0 auto;
  padding: 0 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: #b8ddd9 transparent;
  scrollbar-width: thin;
}
.donut-legend-list {
  display: flex;
  align-items: flex-start;
  width: 100%;
  // 内边距放在列表上，图例区高度与列表高度同一基准，两个圆环才能对齐。
  padding: 2px 0 10px;
}
.donut-legend-list.is-rows {
  // 宽卡片里整行铺满会把金额推到很远的右侧，限宽居中后数值与占比仍聚在一起。
  flex-direction: column;
  max-width: 360px;
  margin: 0 auto;
  gap: 2px;
}
.donut-legend-list.is-grid {
  flex-flow: row wrap;
  gap: 2px 6px;
}
// 选中态只换颜色与描边、不加粗，避免字宽变化让图例换行跳动。
.donut-legend-list > button {
  min-width: 0;
  padding: 2px 6px;
  border: 0;
  border-radius: 6px;
  color: #475569;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  text-align: left;
  cursor: pointer;
}
// 预算类型：色块 / 名称 / 金额（占满剩余宽度、超长省略）/ 占比。
.donut-legend-list.is-rows > button {
  display: grid;
  grid-template-columns: 8px max-content minmax(0, 1fr) max-content;
  align-items: center;
  gap: 2px 6px;
  width: 100%;
}
// 项目类型：两列紧凑排列，色块 / 名称 / 占比，名称超长单行省略。
.donut-legend-list.is-grid > button {
  display: grid;
  flex: 1 1 calc(50% - 3px);
  grid-template-columns: 8px minmax(0, 1fr) max-content;
  align-items: center;
  gap: 4px;
}
// 图例区会裁切溢出，焦点框画在按钮内侧。
.donut-legend-list > button:focus-visible {
  outline-offset: -2px;
}
.donut-legend-list > button:hover {
  color: var(--overview-text, #233743);
  background: #f1f9fa;
}
.donut-legend-list > button.active {
  color: #007d77;
  background: #e5f3f5;
  box-shadow: inset 0 0 0 1px #bce2e6;
}
.donut-legend-list > button.dimmed > i {
  opacity: 0.35;
}
// 色块与圆心读数、左上总览图例一致，使用 8px 圆角方块。
.donut-legend-list i {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.legend-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
// 预算类型名称固定两个字，不省略；金额列放不下时由金额自己收缩。
.is-rows .legend-name {
  overflow: visible;
  text-overflow: clip;
}
.legend-value {
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: 4px;
}
.legend-value strong {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: inherit;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.legend-value > span {
  flex: 0 0 auto;
  white-space: nowrap;
}
.legend-ratio {
  white-space: nowrap;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
// 圆环画布撑满剩余空间；圆心读数按画布短边（cqmin）换算尺寸，与 ECharts 百分比半径同一基准。
.donut-stage {
  container-type: size;
  position: relative;
  flex: 1 1 0;
  min-height: 120px;
  margin: 4px 12px 0;
}
.donut-chart {
  position: absolute;
  inset: 0;
}
// 内径为短边的 52%，数值行可用约 46%，说明文字与单位行收窄到 40%，避开内圈弧线。
.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48cqmin;
  color: #0f2530;
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: donut-center-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
// Less 会在编译期计算 min / max，含 var() 或容器单位时原样输出给浏览器。
.donut-center-caption {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  max-width: 40cqmin;
  color: var(--overview-muted, #617580);
  font-size: ~'max(11px, min(13px, 5.6cqmin))';
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.donut-center-caption i {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
// 数值按字宽缩放，长金额整体缩小，始终完整显示。
.donut-center strong {
  margin: 2px 0;
  font-family: 'Arial', 'Helvetica Neue', 'Overview Noto Sans SC', sans-serif;
  font-size: ~'max(12px, min(28px, 12cqmin, 46cqmin / (var(--center-em) * 1.04)))';
  font-weight: 700;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.donut-center-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--overview-muted, #617580);
  font-size: ~'max(11px, min(12px, 5.4cqmin))';
  line-height: 18px;
  white-space: nowrap;
}
.donut-center-meta b {
  padding: 0 6px;
  border-radius: 9px;
  color: #007d77;
  background: #e5f3f5;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
@keyframes donut-center-in {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-50% + 3px));
  }
}
@media (prefers-reduced-motion: reduce) {
  .donut-center {
    animation: none;
  }
}
</style>
