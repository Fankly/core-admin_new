import { format } from 'echarts'
import type { EChartsOption } from 'echarts'
import type { AmountUnit, OverviewRow, OverviewStage, RankingRow, StageId, StatMode } from './types'
import { DEFAULT_AMOUNT_UNIT, formatOverviewRatio, formatOverviewValue, getOverviewUnit } from './data/format'
import { sumStatisticValues } from './data/totals'
import './styles/chart-tooltip.less'

export interface OverviewTooltipRow {
  /** ECharts 自带的彩色标记 HTML，用于和图表系列对应。 */
  marker?: string
  name: string
  value?: unknown
  ratio?: unknown
}

export interface OverviewTooltipOptions {
  title: string
  statMode: StatMode
  amountUnit: AmountUnit
  total?: unknown
  rows: OverviewTooltipRow[]
  /** 首列表头：总览柱状图为「阶段」，排行为单位/专业，饼图为类型。 */
  nameLabel: string
  showValue?: boolean
  showRatio?: boolean
  hint?: string
}

/**
 * 全页图表提示统一使用总览柱状图的结构：标题、浅青底合计区、明细表格与可选操作提示。
 * 排名与饼图复用同一段 HTML，避免不同图表出现两套视觉与字段顺序。
 */
export const renderOverviewTooltip = ({
  title,
  statMode,
  amountUnit,
  total,
  rows,
  nameLabel,
  showValue = true,
  showRatio = true,
  hint
}: OverviewTooltipOptions): string => {
  const unit = getOverviewUnit(statMode, amountUnit)
  const valueLabel = statMode === 'amount' ? '金额' : '数量'
  const body = rows
    .map((row) => {
      const name = `<th scope="row"><span class="overview-axis-tooltip__stage">${row.marker || ''}${format.encodeHTML(row.name)}</span></th>`
      const value = showValue ? `<td>${format.encodeHTML(formatOverviewValue(row.value, statMode, amountUnit))}</td>` : ''
      const ratio = showRatio ? `<td>${format.encodeHTML(formatOverviewRatio(row.ratio))}</td>` : ''
      return `<tr>${name}${value}${ratio}</tr>`
    })
    .join('')
  return `<div class="overview-axis-tooltip">
    <div class="overview-axis-tooltip__title">${format.encodeHTML(title)}</div>
    <div class="overview-axis-tooltip__total">
      <span>合计</span>
      <span class="overview-axis-tooltip__amount"><strong>${format.encodeHTML(
        formatOverviewValue(total, statMode, amountUnit)
      )}</strong><span>${unit}</span></span>
    </div>
    <table>
      <thead><tr><th scope="col">${format.encodeHTML(nameLabel)}</th>${showValue ? `<th scope="col">${valueLabel}（${unit}）</th>` : ''}${
    showRatio ? '<th scope="col">占比</th>' : ''
  }</tr></thead>
      <tbody>${body}</tbody>
    </table>
    ${hint ? `<div class="overview-axis-tooltip__drill">${format.encodeHTML(hint)}</div>` : ''}
  </div>`
}

/** 本页悬停提示统一白色样式：浅青描边、深色文字，提示挂载 body 后仍能看出浮层边界。 */
export const overviewTooltipStyle = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#dfe7eb',
  padding: [8, 12],
  textStyle: { color: '#334155' },
  enterable: true,
  extraCssText:
    'box-shadow: 0 4px 12px rgba(15, 23, 42, .14); border-radius: 6px; box-sizing: border-box; max-width: calc(100% - 16px); max-height: calc(100% - 16px); white-space: normal; overflow-wrap: anywhere; overflow: auto;'
}

export interface OverviewChartOptions {
  /** hint 非空表示当前图可点击穿透；drillable 同时把柱形鼠标指针设为手型。 */
  hint?: string
  drillable?: boolean
  /** 默认显示的占比曲线阶段编码（调用方已换成接口实际编码）：未配置时由调用方传需求储备库，全部柱状图始终默认显示。 */
  ratioStageIds?: StageId[]
  /** 用户手动切换的图例状态，排序和切换统计口径时沿用。 */
  legendSelected?: Record<string, boolean>
  /** 金额展示单位：万元/亿元，只在金额口径下影响提示、坐标轴与单位文案。 */
  amountUnit?: AmountUnit
  /**
   * 当前排序阶段编码（数值或占比排序都传），只决定「默认显示哪些系列」：
   * - barStageId 非空时默认只显示该阶段柱形；为空时显示全部阶段柱形。
   * - ratioStageId 非空时默认只显示该阶段占比曲线；为空时按 ratioStageIds 配置显示。
   * 未默认显示的系列仍保留在图表与图例中（由 legend.selected 隐藏），用户可自行打开。
   */
  barStageId?: StageId
  ratioStageId?: StageId
}

export const createOverviewChartOption = (
  rows: OverviewRow[],
  statMode: StatMode,
  stages: OverviewStage[],
  options: OverviewChartOptions = {}
): EChartsOption => {
  const amountUnit = options.amountUnit ?? DEFAULT_AMOUNT_UNIT
  // 排序只改图例的默认勾选，不删除系列：未选中的柱形/曲线收进图例，用户随时可以重新打开。
  const barFocus = options.barStageId ? stages.find((stage) => stage.id === options.barStageId) : undefined
  const ratioFocus = options.ratioStageId ? stages.find((stage) => stage.id === options.ratioStageId) : undefined
  const defaultRatioStageIds = new Set(options.ratioStageIds || [])
  const legendSelected: Record<string, boolean> = {}
  stages.forEach((stage) => {
    legendSelected[stage.title] = options.legendSelected?.[stage.title] ?? (!barFocus || stage.id === barFocus.id)
    legendSelected[`${stage.title}占比`] =
      options.legendSelected?.[`${stage.title}占比`] ??
      // 排序指向的占比曲线默认显示，不受占比曲线公共代码配置影响。
      (ratioFocus ? stage.id === ratioFocus.id : !defaultRatioStageIds.size || defaultRatioStageIds.has(stage.id))
  })
  const barSeries = stages.map((stage) => ({
    id: `value-${stage.id}`,
    name: stage.title,
    type: 'bar' as const,
    stack: 'total',
    barMaxWidth: 47,
    barCategoryGap: '40%',
    ...(options.drillable ? { cursor: 'pointer' as const } : {}),
    itemStyle: { color: stage.color, borderColor: 'rgba(255,255,255,.28)', borderWidth: 1.5 },
    data: rows.map((row) => row.values[stage.id] ?? '-')
  }))
  const lineSeries = stages.map((stage) => ({
    id: `ratio-${stage.id}`,
    name: `${stage.title}占比`,
    type: 'line' as const,
    yAxisIndex: 1,
    smooth: false,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      type: [4, 4],
      width: 2,
      color: stage.color,
      shadowBlur: 0
    },
    itemStyle: { color: '#fff', borderColor: stage.color, borderWidth: 1.3 },
    data: rows.map((row) => row.ratios[stage.id] ?? '-')
  }))
  return {
    textStyle: { fontFamily: '"Overview Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
    // 左上角留给页面的排序控件（悬浮 32px），图例下移一行、绘图区再让出坐标轴名的高度。
    grid: { top: 100, left: 58, right: 52, bottom: 38, containLabel: true },
    legend: {
      type: 'scroll',
      top: 46,
      left: 'center',
      width: '88%',
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 14,
      textStyle: { color: '#526a75', fontSize: 12 },
      selected: legendSelected,
      // 图例始终列出全部系列，被排序默认隐藏的项也能在这里重新打开。
      data: stages.flatMap((stage) => [{ name: stage.title, icon: 'roundRect' }, { name: `${stage.title}占比` }])
    },
    tooltip: {
      trigger: 'axis',
      // 浮层脱离卡片的 overflow 裁剪，允许提示框完整显示在图表上方。
      appendToBody: true,
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const items = Array.isArray(params) ? params : [params]
        if (!items.length) return ''
        const row = rows[items[0].dataIndex]
        // 提示跟随排序：选中某个金额/数量排序时只看该阶段一行；选中「xxxx占比」（含合计）时
        // 列出全部阶段，把四条占比一次读完，不用先在图例里逐条打开曲线。
        // 标记点按阶段颜色现画，隐藏系列拿不到 ECharts 的 marker，也要保持色块与图例一致。
        const tooltipStages = barFocus ? [barFocus] : stages
        const tooltipRows = tooltipStages.map((stage) => ({
          marker: `<span class="overview-axis-tooltip__dot" style="background:${stage.color}"></span>`,
          name: stage.title,
          // 提示取源行金额，保留长金额的小数精度，不用 ECharts 事件里可能已取整的值。
          value: row?.values[stage.id],
          ratio: row?.ratios[stage.id]
        }))
        return renderOverviewTooltip({
          title: items[0].name || '',
          statMode,
          amountUnit,
          total: row?.total,
          rows: tooltipRows,
          nameLabel: '阶段',
          hint: options.hint
        })
      },
      ...overviewTooltipStyle
    },
    xAxis: {
      type: 'category',
      data: rows.map((row) => row.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#dfe7eb' } },
      // interval 0 关闭隔项省略；横轴标签统一 45 度斜排，相邻标签平行、不互相遮挡。
      axisLabel: { color: '#617580', fontSize: 12, margin: 12, interval: 0, rotate: 45 }
    },
    yAxis: [
      {
        type: 'value',
        min: 0,
        minInterval: statMode === 'count' ? 1 : undefined,
        name: statMode === 'amount' ? `金额（${amountUnit}）` : '数量（个）',
        nameGap: 22,
        nameTextStyle: { color: '#617580', fontSize: 12 },
        splitLine: { lineStyle: { color: '#e8eef1', type: 'dashed' } },
        axisLabel: { color: '#617580', fontSize: 12, formatter: (value: number) => formatOverviewValue(value, statMode, amountUnit) }
      },
      {
        type: 'value',
        name: '占比（%）',
        min: 0,
        max: 100,
        interval: 20,
        nameGap: 22,
        splitLine: { show: false },
        axisLabel: { color: '#617580', fontSize: 12 },
        nameTextStyle: { color: '#617580', fontSize: 12 }
      }
    ],
    // 柱体从下往上堆叠，反转柱形系列使需求储备库位于最上层。
    series: [...barSeries.reverse(), ...lineSeries]
  }
}

/** 排名最短行高：12px 类目名逐行显示、不互相遮挡。 */
const RANKING_COMPACT_ROW_HEIGHT = 14
/** 长名单（全省、直属单位）滚动时的行高，比紧凑模式宽松。 */
const RANKING_SCROLL_ROW_HEIGHT = 32
/** 不超过该行数（13 家地市、省专业）的排名始终铺满卡片，不出现滚动条。 */
const RANKING_COMPACT_ROW_LIMIT = 15
/** 图表上下的最小留白，与 createRankingChartOption 的 grid top/bottom 之和保持一致。 */
const RANKING_CHART_GUTTER = 16

/**
 * 排名图需要设置的最小高度：`0` 表示不设下限，图表跟着卡片高度撑满；
 * 行数较多、按紧凑行高放不下时返回滚动所需的高度，让排名在卡片内部滚动。
 * 13 家地市这类短名单无论卡片多矮都不返回高度，避免出现滚动条。
 */
export const resolveRankingChartMinHeight = (rows: number, availableHeight: number): number => {
  if (rows <= 0 || rows <= RANKING_COMPACT_ROW_LIMIT) return 0
  if (rows * RANKING_COMPACT_ROW_HEIGHT + RANKING_CHART_GUTTER <= availableHeight) return 0
  return rows * RANKING_SCROLL_ROW_HEIGHT + RANKING_CHART_GUTTER
}

export const createRankingChartOption = (
  rows: RankingRow[],
  category: string,
  statMode: StatMode = 'amount',
  amountUnit: AmountUnit = DEFAULT_AMOUNT_UNIT,
  options: {
    /** 当前选中的单位/专业编码：突出选中柱形，其余淡出。 */
    selectedId?: string
    /** 当前圆环筛选项的颜色，未筛选时使用默认青绿色。 */
    color?: string
    /** 是否允许点击柱形筛选项目类型排名（鼠标指针与提示文案同步）。 */
    clickable?: boolean
    /** 提示标题：排名口径（如「江苏各市排名」），与总览柱状图的标题位置一致。 */
    title?: string
    /** 提示表格首列表头：按单位或按专业，缺省沿用系列名。 */
    nameLabel?: string
  } = {}
): EChartsOption => {
  const selectedId = options.selectedId || ''
  const color = options.color || '#209498'
  return {
    textStyle: { fontFamily: '"Overview Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
    // containLabel 让 ECharts 按实际标签宽度留白：固定 left 只够 2 字市名，「连云港」会被切掉左侧。
    // 底部不再绘制金额/数量刻度，只留少量留白，纵向空间全部让给条目（见 resolveRankingChartMinHeight）。
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      axisPointer: { type: 'shadow' },
      ...overviewTooltipStyle,
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params
        if (!item) return ''
        const row = rows[item.dataIndex]
        return renderOverviewTooltip({
          title: options.title || category,
          statMode,
          amountUnit,
          // 排名图没有阶段拆分，「合计」取当前排名全部行的合计，与饼图/总览合计区一致。
          total: sumStatisticValues(rows.map((entry) => entry.value)),
          rows: row ? [{ marker: item.marker, name: row.name, value: row.value, ratio: row.ratio }] : [],
          nameLabel: options.nameLabel || category,
          hint: options.clickable ? '点击柱形筛选项目类型排名' : ''
        })
      }
    },
    xAxis: {
      type: 'value',
      // 轴范围随数据自适应，不再固定 700；数量口径取整数刻度。
      min: 0,
      minInterval: statMode === 'count' ? 1 : undefined,
      // 删除下方的「金额（万元）/ 数量（个）」刻度：柱尾标签与悬停提示已给出读数，
      // 轴文字占用的高度让给条目，13 家地市可以完整显示在卡片里。
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      // 只保留少量浅色刻度线作为长度参照，不再出现轴名与数字。
      splitNumber: 3,
      splitLine: { lineStyle: { color: '#edf0f1', type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((row) => row.name),
      axisLine: { show: false },
      axisTick: { show: false },
      // 行距收紧后 ECharts 会自动隔行隐藏类目名，固定 interval 0 保证每个单位/专业都有名称。
      axisLabel: { color: '#999', fontSize: 12, margin: 14, interval: 0 }
    },
    series: [
      {
        name: category,
        type: 'bar',
        barMaxWidth: 15,
        barCategoryGap: '35%',
        ...(options.clickable ? { cursor: 'pointer' as const } : {}),
        itemStyle: { color },
        ...(options.color ? { emphasis: { itemStyle: { color } } } : {}),
        label: {
          show: true,
          position: 'right',
          color: '#64748b',
          fontSize: 12,
          distance: 6,
          formatter: (params: { dataIndex: number }) => formatOverviewValue(rows[params.dataIndex]?.value, statMode, amountUnit)
        },
        data: rows.map((row) => ({
          value: row.value ?? '-',
          // 点击某一行筛选项目类型排名：保留圆环筛选色，其余柱形淡出。
          ...(row.isTotal
            ? { cursor: 'default', itemStyle: { color: options.color || '#00766e' } }
            : selectedId
            ? { itemStyle: { color: row.id === selectedId ? options.color || '#007d77' : color, opacity: row.id === selectedId ? 1 : 0.35 } }
            : {})
        }))
      }
    ]
  }
}
