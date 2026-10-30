<template>
  <div class="overview-summary" :aria-busy="loading">
    <Transition name="overview-state">
      <section
        :key="loading ? 'loading' : error ? 'error' : 'data'"
        class="overview-summary-grid"
        :class="{ 'is-loading-state': loading }"
        :style="gridStyle"
        :aria-busy="loading"
      >
        <OverviewLoading v-if="loading" class="summary-loading" variant="summary" label="总览统计数据加载中…" />
        <div v-else-if="error" class="summary-error" role="alert">
          <span>{{ error }}</span>
          <button type="button" @click="$emit('retry')">重新加载</button>
        </div>
        <template v-else>
          <article
            class="summary-card"
            :class="{ 'is-interactive': stageDetailsEnabled }"
            :style="summaryCardStyle"
            @click="stageDetailsEnabled && $emit('select-overview')"
          >
            <div class="summary-backdrop" aria-hidden="true"></div>
            <div class="summary-content">
              <header class="summary-head">
                <h1>
                  <span class="summary-icon"><Database aria-hidden="true" /></span>
                  总览
                </h1>
                <div :key="statMode" class="total-box" :style="{ '--total-em': estimateTextEm(totalValue), '--total-unit-em': estimateTextEm(unit) }">
                  <span class="total-label">{{ isAmount ? '金额合计' : '数量合计' }}</span>
                  <button
                    v-if="totalValue !== '--'"
                    type="button"
                    class="summary-total-trigger"
                    aria-haspopup="dialog"
                    :aria-label="`查看${isAmount ? '金额' : '数量'}合计项目明细`"
                    :title="`查看${isAmount ? '金额' : '数量'}合计项目明细`"
                    @click.stop="$emit('drill', { title: isAmount ? '金额合计' : '数量合计' })"
                    ><OverviewValue :value="totalValue" :unit="unit" align="end"
                  /></button>
                  <OverviewValue v-else :value="totalValue" :unit="unit" align="end" />
                </div>
              </header>
              <div class="summary-body">
                <!-- 图例只保留色块与名称；占比写到饼图外侧标签的阶段名后面，图例不再重复一遍。 -->
                <div class="summary-legend">
                  <button
                    v-for="(stage, index) in stages"
                    :key="stage.id"
                    class="legend-row"
                    :class="{
                      'is-active': activeStageIndex === index,
                      'is-selected': stageDetailsEnabled && selectedStage === stage.id
                    }"
                    type="button"
                    aria-haspopup="dialog"
                    :aria-label="`查看${stage.title}项目明细，${isAmount ? '金额' : '数量'}${stage.value}${unit}，占比${stage.ratio}`"
                    :title="`${stage.title}：${stage.value} ${unit}（占比 ${stage.ratio}）${
                      stageDetailsEnabled && selectedStage === stage.id ? '，已选中' : ''
                    }，点击查看项目明细`"
                    @click.stop="$emit('drill', { jdbm: stage.id, title: stage.title })"
                    @mouseenter="activateStage(index)"
                    @mouseleave="deactivateStage"
                    @focus="activateStage(index)"
                    @blur="deactivateStage"
                  >
                    <i :style="{ backgroundColor: stage.color }" aria-hidden="true"></i>
                    <span class="legend-name">{{ stage.title }}</span>
                  </button>
                </div>
                <div
                  ref="chartRef"
                  class="summary-pie"
                  role="img"
                  :aria-label="`各阶段${isAmount ? '金额' : '数量'}占比${stageDetailsEnabled ? '，点击扇区查看对应阶段详情' : ''}`"
                ></div>
              </div>
            </div>
          </article>

          <article
            v-for="(stage, index) in stages"
            :key="stage.id"
            class="stage-card"
            :style="getStageStyle(index)"
            :class="{ 'is-interactive': stageDetailsEnabled, selected: stageDetailsEnabled && selectedStage === stage.id }"
            @click="stageDetailsEnabled && $emit('select-stage', stage.id)"
            @keydown.enter.stop.prevent
            @keydown.space.stop.prevent
            @keyup.enter.stop.prevent
            @keyup.space.stop.prevent
          >
            <img class="stage-icon" :src="stage.icon" alt="" />
            <h2 :style="{ '--title-em': estimateTextEm(stage.title) }">{{ stage.title }}</h2>
            <div :key="statMode" class="stage-total">
              <button
                v-if="stage.value !== '--'"
                type="button"
                class="stage-total-trigger"
                aria-haspopup="dialog"
                :aria-label="`查看${stage.title}${isAmount ? '金额' : '数量'}项目明细`"
                :title="`查看${stage.title}${isAmount ? '金额' : '数量'}项目明细`"
                @click.stop="$emit('drill', { jdbm: stage.id, title: stage.title })"
                ><OverviewValue :value="stage.value" :unit="unit" align="center" /></button
              ><OverviewValue v-else :value="stage.value" :unit="unit" align="center" /><b class="stage-ratio"
                >占比 <em>{{ stage.ratio }}</em></b
              >
            </div>
            <dl>
              <div v-for="item in stage.statuses" :key="item.label">
                <dt>{{ item.label }}</dt>
                <dd>
                  <button
                    v-if="item.value !== '--'"
                    type="button"
                    class="stage-status-trigger"
                    aria-haspopup="dialog"
                    :aria-label="`查看${stage.title}${item.label}项目明细`"
                    :title="`查看${stage.title}${item.label}项目明细`"
                    @click.stop="$emit('drill', { jdbm: item.jdbm, title: `${stage.title} · ${item.label}` })"
                    ><OverviewValue :value="item.value" :unit="unit" align="end" /></button
                  ><OverviewValue v-else :value="item.value" :unit="unit" align="end" />
                </dd>
              </div>
            </dl>
          </article>
        </template>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { Database } from '@lucide/vue'
import { useResizeObserver } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import OverviewLoading from './OverviewLoading.vue'
import OverviewValue from './OverviewValue.vue'
import { overviewTooltipStyle, renderOverviewTooltip } from '../charts'
import { useOverviewChart } from '../composables/useOverviewChart'
import { estimateTextEm, formatOverviewRatio, formatOverviewValue, getOverviewUnit } from '../data/format'
import type { OverviewSummaryData, StatisticValue } from '@/api/overview'
import type { AmountUnit, OverviewDrillTarget, OverviewStage, StageId, StatMode } from '../types'

const props = defineProps<{
  summary: OverviewSummaryData | null
  stages: OverviewStage[]
  statMode: StatMode
  amountUnit: AmountUnit
  loading: boolean
  error: string
  stageDetailsEnabled: boolean
  selectedStage: StageId | ''
}>()
const emit = defineEmits<{
  (event: 'select-stage', id: StageId): void
  (event: 'select-overview'): void
  (event: 'drill', target: OverviewDrillTarget): void
  (event: 'retry'): void
}>()

const isAmount = computed(() => props.statMode === 'amount')
const getStageStyle = (index: number): CSSProperties & { '--stage-index': number } => ({ '--stage-index': Math.min(index, 4) })
const unit = computed(() => getOverviewUnit(props.statMode, props.amountUnit))
const valueField = computed(() => (isAmount.value ? 'amount' : 'num'))
const ratioField = computed(() => (isAmount.value ? 'amountZb' : 'numZb'))
const totalValue = computed(() => formatValue(isAmount.value ? props.summary?.sumAmount : props.summary?.sumNum))
const formatValue = (value?: StatisticValue | null) => formatOverviewValue(value, props.statMode, props.amountUnit)
const stages = computed(() =>
  props.stages.map((definition) => {
    // 使用后端阶段编码关联数据，名称变化不会造成统计值丢失。
    const stage = props.summary?.childJd?.find((item) => item.jdbm === definition.id)
    return {
      ...definition,
      value: formatValue(stage?.[valueField.value]),
      ratio: formatOverviewRatio(stage?.[ratioField.value]),
      statuses: (stage?.childJd ?? []).map((item) => ({ jdbm: item.jdbm, label: item.jdmc, value: formatValue(item[valueField.value]) }))
    }
  })
)
// 汇总区基准字号按区域宽高与卡片内容行数换算（见样式 .overview-summary-grid）；加载中按四个阶段、三条状态占位。
const gridStyle = computed<CSSProperties & Record<'--stage-count' | '--status-rows', number>>(() => ({
  '--stage-count': stages.value.length || 4,
  '--status-rows': Math.max(3, ...stages.value.map((stage) => stage.statuses.length))
}))
// 图例名称列取最长文本的宽度，四行逐列对齐；整组图例只占这一列所需的宽度，其余横向空间全部留给饼图。
type LegendVar = '--legend-name-em'
const summaryCardStyle = computed<CSSProperties & Record<LegendVar, number>>(() => ({
  '--legend-name-em': Math.max(4, ...stages.value.map((stage) => estimateTextEm(stage.title)))
}))

type SummaryPieItem = {
  id: string
  name: string
  value: number
  /** 接口占比（已带百分号），直接写在饼图外侧标签里，与扇区一起移动，不必再去左侧图例找。 */
  ratio: string
  stageIndex: number
  itemStyle: { color: string }
}
const pie = computed(() => {
  // 扇区直接使用原始统计值，不插入占位扇区，面积比例与实际数据一致。
  const values = stages.value.map((stage) => {
    const statistics = props.summary?.childJd?.find((item) => item.jdbm === stage.id)
    return Math.max(0, Number(statistics?.[valueField.value]) || 0)
  })
  const data: SummaryPieItem[] = []
  // 阶段下标 → 扇区下标；全零阶段没有扇区，记为 -1。
  const dataIndexByStage = values.map(() => -1)
  values.forEach((value, index) => {
    if (value <= 0) return
    dataIndexByStage[index] = data.length
    // ECharts 使用阶段编码关联扇区，避免名称相同或改名时串联。
    data.push({
      id: stages.value[index].id,
      name: stages.value[index].title,
      value,
      ratio: stages.value[index].ratio,
      stageIndex: index,
      itemStyle: { color: stages.value[index].color }
    })
  })
  return { data, dataIndexByStage }
})
// 阶段卡片与饼图共用同一份选中状态：点右侧卡片或点扇区都会选中同一个阶段。
const selectedStageIndex = computed(() =>
  props.stageDetailsEnabled && props.selectedStage ? stages.value.findIndex((stage) => stage.id === props.selectedStage) : -1
)
// 阶段下标 → 扇区下标；占比为 0 的阶段没有扇区，-1 表示当前没有可突出的扇区。
const selectedPieIndex = computed(() => (selectedStageIndex.value < 0 ? -1 : pie.value.dataIndexByStage[selectedStageIndex.value]))
// 与下方预算类型 / 项目类型圆环的筛选反馈一致：选中扇区持续外弹，其余扇区、标签与引导线一起淡出。
// 圆环在白色卡片上淡到 0.28，这里底色是深青的电网背景，太低会把未选中阶段糊成一片，取 0.4 既退后又能看清。
const PIE_DIM_OPACITY = 0.4
// 未选中阶段的外侧标签一起淡出；标签按「名称 + 占比」两段富文本渲染，要逐段给颜色才会跟着淡。
const PIE_DIM_LABEL_COLOR = 'rgba(230, 244, 242, 0.6)'
const pieSeriesData = computed(() => {
  const selected = selectedStageIndex.value
  if (selected < 0 || selectedPieIndex.value < 0) return pie.value.data
  return pie.value.data.map((item) =>
    item.stageIndex === selected
      ? item
      : {
          ...item,
          itemStyle: { ...item.itemStyle, opacity: PIE_DIM_OPACITY },
          label: {
            rich: {
              name: { color: PIE_DIM_LABEL_COLOR },
              ratio: { color: PIE_DIM_LABEL_COLOR }
            }
          },
          labelLine: { lineStyle: { opacity: 0.4 } },
          // 悬停淡出的扇区时恢复完整亮度，避免临时高亮与提示读数看不清。
          emphasis: {
            itemStyle: { opacity: 1, shadowBlur: 12, shadowOffsetY: 3, shadowColor: 'rgba(15, 23, 42, 0.18)' },
            label: { rich: { name: { color: '#fff' }, ratio: { color: '#fff' } } }
          }
        }
  )
})
// 点击扇区与点击阶段卡片同一次切换：选中对应卡片并展开下方阶段详情，再点一次返回总览。
const selectPieStage = (dataIndex: number) => {
  if (!props.stageDetailsEnabled) return
  const stage = stages.value[pie.value.data[dataIndex]?.stageIndex ?? -1]
  if (stage) emit('select-stage', stage.id)
}
// 外侧标签占用的横向空间：两段引导线 + 引导线与文字间距 + 画布留边（与下方 label / labelLine 配置一致）。
const PIE_LABEL_LINE = 8
const PIE_LABEL_LINE2 = 8
const PIE_LABEL_DISTANCE = 4
const PIE_BLEED_MARGIN = 2
// 名称与占比之间的两个空格（约 0.56em）：比紧挨着透气，又不用额外画分隔符。
const PIE_LABEL_GAP_EM = 0.56
// 标签最小字号：再小在深色卡片上就发糊了，宁可改用两行。
const PIE_LABEL_MIN_FONT = 10
// 占比比阶段名小两号：同一行里名称仍是主信息，占比是紧跟其后的读数。
const getRatioFontSize = (fontSize: number) => Math.max(PIE_LABEL_MIN_FONT, fontSize - 2)
// 饼图半径按画布像素换算：左右要放下「阶段名 + 占比」（水平方向的扇区标签最占宽），上下要放下引导线与文字。
// 百分比半径只看短边，在宽而矮的画布里会把左右标签挤到换行或贴边，这里改为按实际宽高与标签长度取较小值。
const pieBox = reactive({ width: 0, height: 0 })
const pieLayout = computed(() => {
  const { width, height } = pieBox
  // 基准字号跟随画布宽度：窄画布退到 11px 给饼图多留几像素，宽画布放大到 13px 与图例字号相称。
  const baseFontSize = !width ? 12 : width < 280 ? 11 : width >= 360 ? 13 : 12
  if (!width || !height) {
    return {
      radius: '80%',
      fontSize: baseFontSize,
      ratioFontSize: getRatioFontSize(baseFontSize),
      lineHeight: baseFontSize + 3,
      ratioInline: true
    }
  }
  // 名称按标签字号、占比按小两号的字号估算，取四组标签里最长的一项作为共同宽度。
  const nameEm = Math.max(4, ...stages.value.map((stage) => estimateTextEm(stage.title)))
  const ratioEm = Math.max(3, ...stages.value.map((stage) => estimateTextEm(stage.ratio)))
  // 画布半宽扣掉引导线、间距与留边后，才是标签可以占用的宽度。
  const halfWidth = width / 2 - PIE_LABEL_LINE - PIE_LABEL_LINE2 - PIE_LABEL_DISTANCE - PIE_BLEED_MARGIN - 2
  const halfHeight = height / 2 - PIE_LABEL_LINE - PIE_BLEED_MARGIN - 4
  /** 标签占 labelWidth 宽、lines 行高时的饼图半径（受宽高同时约束）。 */
  const radiusFor = (labelWidth: number, lines: number, fontSize: number) =>
    Math.floor(Math.min(halfWidth - labelWidth, halfHeight - ((fontSize + 3) * lines) / 2))
  // 两行方案（名称 / 占比）是保底排布：宽度只按较长的一段算，窄画布上能保住饼图大小。
  const stackedRadius = radiusFor(nameEm * baseFontSize, 2, baseFontSize)
  // 优先单行「名称 占比」：从基准字号开始逐级缩小（每次小 1px），
  // 只要半径还能达到两行方案的 90% 就用单行——这样占比始终紧跟名称，饼图也不会明显变小。
  let inlineFontSize = 0
  let inlineRadius = 0
  for (let fontSize = baseFontSize; fontSize >= PIE_LABEL_MIN_FONT; fontSize--) {
    const ratioFontSize = getRatioFontSize(fontSize)
    const candidate = radiusFor(nameEm * fontSize + fontSize * PIE_LABEL_GAP_EM + ratioEm * ratioFontSize, 1, fontSize)
    if (candidate >= stackedRadius * 0.9) {
      inlineFontSize = fontSize
      inlineRadius = candidate
      break
    }
  }
  const ratioInline = inlineFontSize > 0
  const fontSize = ratioInline ? inlineFontSize : baseFontSize
  // 下限 28px：极窄画布宁可让标签按字换行，也不把饼图缩成一个点。
  return {
    radius: Math.max(28, ratioInline ? inlineRadius : stackedRadius),
    fontSize,
    ratioFontSize: getRatioFontSize(fontSize),
    lineHeight: fontSize + 3,
    ratioInline
  }
})
// 标签是「名称 + 占比」两段富文本：悬停、选中淡出时都要逐段换色，这里按同一套字号生成完整样式。
const pieLabelRich = (nameColor: string, ratioColor: string) => ({
  name: { color: nameColor, fontSize: pieLayout.value.fontSize, fontWeight: 500 },
  ratio: {
    color: ratioColor,
    fontSize: pieLayout.value.ratioFontSize,
    fontWeight: 700,
    fontFamily: 'Arial, "Helvetica Neue", "Overview Noto Sans SC", sans-serif'
  }
})
// 外侧标签：阶段名后紧跟占比；窄画布时占比落到下一行，仍与名称同一组标签、同一根引导线。
const formatPieLabel = (params: unknown) => {
  const data = (params as { data?: SummaryPieItem }).data
  const name = data?.name ?? ''
  if (!data?.ratio) return name
  return pieLayout.value.ratioInline ? `{name|${name}  }{ratio|${data.ratio}}` : `{name|${name}}\n{ratio|${data.ratio}}`
}
// 饼图与图例双向联动：悬停任一侧都突出对应扇区。
const activeStageIndex = ref(-1)
const { chartRef, highlightData, downplayData } = useOverviewChart({
  enabled: () => !props.loading && !props.error,
  filename: () => '总览占比.png',
  // 选中的扇区与下方圆环一样持续外弹：独立高亮键，鼠标移出扇区或图例后仍然保留。
  selectedDataIndex: () => selectedPieIndex.value,
  onClick: (params) => {
    const { dataIndex, event } = params as { dataIndex?: number; event?: { event?: Event } }
    if (typeof dataIndex !== 'number') return
    // 扇区点击自行切换阶段卡片，阻止冒泡到总览卡片，否则同一次点击会紧接着执行「返回总览」把它清掉；
    // 画布空白处仍然冒泡，沿用点卡片空白返回总览的行为。
    event?.event?.stopPropagation()
    selectPieStage(dataIndex)
  },
  onMouseOver: (params) => {
    const stageIndex = (params as { data?: SummaryPieItem }).data?.stageIndex
    if (typeof stageIndex === 'number') activeStageIndex.value = stageIndex
  },
  onGlobalOut: () => {
    activeStageIndex.value = -1
  },
  option: () => ({
    textStyle: { fontFamily: '"Overview Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' },
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      ...overviewTooltipStyle,
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params
        const data = item.data as SummaryPieItem
        const stage = stages.value[data.stageIndex]
        const statistics = props.summary?.childJd?.find((entry) => entry.jdbm === stage?.id)
        if (!stage) return ''
        return renderOverviewTooltip({
          title: '阶段占比',
          statMode: props.statMode,
          amountUnit: props.amountUnit,
          total: isAmount.value ? props.summary?.sumAmount : props.summary?.sumNum,
          nameLabel: '阶段',
          rows: [{ marker: item.marker, name: stage.title, value: statistics?.[valueField.value], ratio: statistics?.[ratioField.value] }],
          // 扇区可直接切换阶段卡片（与点卡片一致），提示里说明这次点击的去向。
          hint: !props.stageDetailsEnabled ? undefined : props.selectedStage === stage.id ? '再次点击返回总览' : '点击查看该阶段详情'
        })
      }
    },
    series: [
      {
        id: 'overview-summary-pie',
        type: 'pie',
        // 实心饼图 + 外侧引导线标注阶段名称（参考 ECharts 饼图示例）；半径见 pieLayout。
        radius: [0, pieLayout.value.radius],
        center: ['50%', '50%'],
        startAngle: 90,
        z: 2,
        stillShowZeroSum: false,
        // 扇区可点击切换阶段卡片，指针提示可点击；关闭阶段详情时恢复默认指针。
        cursor: props.stageDetailsEnabled ? 'pointer' : 'default',
        // 扇区之间沿用下方预算类型 / 项目类型圆环的白色分界线，不再用深色缝与黑色投影。
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          position: 'outside',
          formatter: formatPieLabel,
          color: '#e6f4f2',
          fontSize: pieLayout.value.fontSize,
          lineHeight: pieLayout.value.lineHeight,
          distanceToLabelLine: PIE_LABEL_DISTANCE,
          // 画布四周只留 2px（默认 10px）；半径已为最长标签留出宽度，极窄画布仍放不下时按字换行，不省略。
          bleedMargin: PIE_BLEED_MARGIN,
          overflow: 'break',
          // 阶段名与占比两段富文本：名称浅青、占比加粗白色，读数一眼能从名称里分出来。
          rich: pieLabelRich('#e6f4f2', '#ffffff')
        },
        // 引导线沿用扇区颜色。
        labelLine: { show: true, length: PIE_LABEL_LINE, length2: PIE_LABEL_LINE2, lineStyle: { width: 1 } },
        labelLayout: { hideOverlap: true },
        // 悬停与选中扇区向外弹出，投影与下方圆环一致（浅色、无黑边）；标签同步转白加粗。
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: { rich: pieLabelRich('#ffffff', '#ffffff') },
          itemStyle: { shadowBlur: 12, shadowOffsetY: 3, shadowColor: 'rgba(15, 23, 42, 0.18)' }
        },
        showEmptyCircle: true,
        emptyCircleStyle: { color: 'rgba(255, 255, 255, 0.16)' },
        data: pieSeriesData.value
      }
    ]
  })
})
// 画布挂载后立即读一次尺寸，首帧就用像素半径绘制；之后随卡片缩放更新。
watch(
  chartRef,
  (element) => {
    pieBox.width = element?.clientWidth ?? 0
    pieBox.height = element?.clientHeight ?? 0
  },
  { flush: 'post' }
)
useResizeObserver(chartRef, ([entry]) => {
  pieBox.width = Math.round(entry.contentRect.width)
  pieBox.height = Math.round(entry.contentRect.height)
})
const activateStage = (index: number) => {
  activeStageIndex.value = index
  const dataIndex = pie.value.dataIndexByStage[index]
  if (dataIndex >= 0) highlightData(dataIndex)
}
const deactivateStage = () => {
  activeStageIndex.value = -1
  downplayData()
}
// 数据刷新后旧的下标可能指向别的阶段，先收起联动状态，等用户重新悬停。
watch(
  () => props.summary,
  () => {
    activeStageIndex.value = -1
  }
)
</script>

<style scoped lang="less">
button,
select {
  font-family: inherit;
}
button:focus-visible {
  outline: 2px solid #007d77;
  outline-offset: 3px;
}
// 汇总区高度由页面网格分配（占工作区的 1/3），自身作为尺寸容器，内部文字按区域宽高缩放。
.overview-summary {
  container-type: size;
  position: relative;
  min-width: 0;
  min-height: 0;
}
// 基准字号 = min(按卡片宽度换算, 按高度换算)，限制在 12–22px；高度按阶段数与状态行数折算，保证一屏内完整放下。
// 卡片内的字号、图标与留白都用 em 表示，随基准字号整体缩放；数值放不下时再由 OverviewValue 等比缩小。
// Less 会在编译期计算 min / max 与括号内运算，含 var() 时报错，相关表达式用 ~'' 原样输出。
.overview-summary-grid {
  // 阶段卡片宽度：常规屏幕取汇总区宽度的 15.1%（与原来的 2.4 : 1 分栏一致），最多 330px。
  // 超过这个宽度后阶段卡片不再继续变宽，多出来的宽度交给左侧总览卡片（饼图与图例需要横向空间），
  // 这样 1652、1920 这类宽屏上四张卡片不会被拉成大片空白，整行仍然保持「一张主卡 + 四张均分卡」的节奏。
  --stage-card-width: clamp(0px, 15.1cqi, 330px);
  --summary-columns: minmax(0, 1fr) repeat(var(--stage-count), minmax(0, var(--stage-card-width)));
  @by-width: ~'var(--stage-card-width) / 13.6';
  @by-height: ~'100cqh / max(9.7 + var(--stage-count) * 1.73, 11.3 + var(--status-rows) * 1.58)';
  display: grid;
  height: 100%;
  grid-template-columns: var(--summary-columns);
  grid-template-rows: minmax(0, 1fr);
  gap: var(--overview-gap);
  font-size: ~'clamp(12px, min(@{by-width}, @{by-height}), 22px)';
}
// 退出内容脱离文档流，保留重叠过渡；避免再套一层隐式 Grid 反复计算卡片的 min-content。
.overview-summary-grid.overview-state-leave-active {
  position: absolute;
  inset: 0;
}
.summary-loading,
.summary-error {
  grid-column: 1 / -1;
}
.summary-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #475569;
  font-size: 14px;
}
.summary-error button {
  padding: 6px 12px;
  border: 1px solid var(--overview-border);
  border-radius: 6px;
  color: #007d77;
  background: #fff;
  cursor: pointer;
}
.summary-card,
.stage-card {
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--overview-border);
  border-radius: var(--overview-radius);
  background: #fff;
  box-shadow: var(--overview-shadow);
}
.summary-card {
  container-type: size;
  position: relative;
  overflow: hidden;
  color: #fff;
  border-color: #07696d;
  background: #05595e;
  box-shadow: 0 4px 14px rgba(4, 80, 86, 0.18);
}
.summary-card.is-interactive {
  cursor: pointer;
  transition: box-shadow var(--overview-motion-fast) ease;
}
.summary-card.is-interactive:hover {
  box-shadow: 0 6px 18px rgba(4, 95, 99, 0.2);
}
.summary-backdrop {
  position: absolute;
  inset: 0;
  background: url('@/assets/images/overview/power-grid-bg.png') right center / cover no-repeat;
}
/* 保留电网图片：左侧文字区整体压暗保证可读，右侧铁塔透出一些作为饼图背景。 */
.summary-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(3, 52, 58, 0.9), rgba(3, 60, 66, 0.7) 45%, rgba(3, 66, 72, 0.55));
}
// 上方一行标题与合计，下方左侧图例、右侧饼图；饼图画布撑满剩余宽高，外侧标签按画布边界换行而不省略。
// 宽屏上总览卡片会拿到更多宽度（阶段卡片到位后不再变宽），内容宽度限制在 800px 并居中：
// 标题、图例与饼图作为一组保持紧凑，不会出现「文字挤在左边、右边空一大片」的松散感。
.summary-content {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  row-gap: 0.4em;
  width: 100%;
  max-width: 800px;
  height: 100%;
  margin-inline: auto;
  padding: 0.75em 1.1em 0.5em;
}
.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
  min-width: 0;
  padding-bottom: 0.45em;
  border-bottom: 1px solid rgba(214, 245, 241, 0.16);
}
.summary-content h1 {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.45em;
  margin: 0;
  font-size: 1.08em;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
// 图标放进半透明方块，和标题文字分出层次。
.summary-icon {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 1.5em;
  height: 1.5em;
  border: 1px solid rgba(214, 245, 241, 0.22);
  border-radius: 0.4em;
  background: rgba(255, 255, 255, 0.1);
}
.summary-icon svg {
  width: 0.9em;
  height: 0.9em;
}
// 合计放在标题行右侧，标签与数值同一基线。
.total-box {
  display: flex;
  flex: 1 1 auto;
  align-items: baseline;
  justify-content: flex-end;
  gap: 0.6em;
  min-width: 0;
}
// 次要文字（标签、单位、占比）随基准字号缩放，但不低于 10.5–11px，小屏下仍可读。
.total-label {
  flex-shrink: 0;
  color: #cfeae7;
  font-size: ~'max(11px, 0.86em)';
  line-height: 1.4;
  font-weight: 500;
  white-space: nowrap;
}
.total-box .overview-value {
  --value-size: 1.9em;
  --unit-size: ~'max(11px, 0.86em)';
  --value-unit-color: #cfeae7;
  line-height: 1.15;
}
// OverviewValue 是宽度容器、没有固有宽度：按「数值字宽 × 期望字号 + 单位」给出期望宽度，标题行放不下时随 flex 收缩并等比缩小字号。
.total-box > .summary-total-trigger,
.total-box > .overview-value {
  flex: 0 1 auto;
  width: ~'calc(var(--total-em) * 1.9em * 1.05 + 0.3em + var(--total-unit-em) * max(11px, 0.86em))';
  min-width: 0;
}
// 下方左侧图例、右侧饼图：图例只占名称一列的宽度并垂直居中，其余宽高全部交给饼图画布。
.summary-body {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  align-items: center;
  column-gap: 0.6em;
  min-height: 0;
}
.summary-legend {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  min-width: 0;
}
// 图例四行共用列宽：色块 / 名称；名称列取最长文本，四行左侧色块与名称逐列对齐。
.legend-row {
  display: grid;
  // 名称列多留 2px，避免字宽取整后最后一个字被挤到下一行。
  grid-template-columns: ~'0.65em calc(var(--legend-name-em) * 1em + 2px)';
  align-items: center;
  column-gap: 0.5em;
  // 左右各外扩 0.45em 作为悬停底色，色块仍与上方标题图标左对齐。
  margin: 0 -0.45em;
  padding: 0.2em 0.45em;
  border: 0;
  border-radius: 0.4em;
  color: #fff;
  background: transparent;
  font-size: 0.93em;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--overview-motion-fast) ease;
}
// 悬停或由扇区联动时整行浮现，明确「这一行就是当前扇区」。
.legend-row:hover,
.legend-row.is-active {
  background: rgba(255, 255, 255, 0.12);
}
// 选中阶段（点卡片或点扇区）时图例行常驻高亮：浅色底 + 细描边，与下方圆环图例的选中态一致。
.legend-row.is-selected {
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1px rgba(214, 245, 241, 0.45);
}
.legend-row.is-selected .legend-name {
  font-weight: 700;
}
.legend-row:focus-visible {
  outline-color: #fff;
}
.legend-row i {
  width: 0.65em;
  height: 0.65em;
  border-radius: 0.15em;
  // 白色描边：深色阶段在深色卡片上也能描出轮廓。
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
}
// 正常数据下名称一行放得下；只有极长名称遇上最窄工作区时按字换行，仍完整显示。
.legend-name {
  font-weight: 500;
  white-space: normal;
  overflow-wrap: anywhere;
}
.legend-row.is-active .legend-name {
  font-weight: 700;
}
.legend-row:hover .legend-name,
.legend-row:focus-visible .legend-name {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}
// 饼图画布撑满图例右侧的全部宽高，ECharts 按短边取半径，外侧标签与引导线也落在这块画布里。
.summary-pie {
  // 画布铺满图例右侧的剩余宽度：圆环画在画布中心，多出来的宽度只增加两侧标签的余量，
  // 图例与圆环之间不会因为限宽而空出一段。宽屏下的整体收敛交给 .summary-content 的上限。
  align-self: stretch;
  min-width: 0;
  min-height: 0;
}
// 阶段卡片沿用原版的纵向居中排布：图标 → 名称 → 主数值与占比 → 状态明细；尺寸全部用 em，随汇总区基准字号缩放。
// 图标行吸收剩余高度，状态行在空间充足时垂直居中；卡片自身作为宽度容器，名称按卡片宽度缩放。
.stage-card {
  container-type: inline-size;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(2.5em, 1fr) 1.5em auto minmax(min-content, 0.8fr);
  justify-items: center;
  gap: 0.35em;
  padding: 0.75em 1em;
  text-align: center;
}
.stage-card.is-interactive {
  cursor: pointer;
  transition: border-color var(--overview-motion-fast) ease, background-color var(--overview-motion-fast) ease,
    box-shadow var(--overview-motion-fast) ease;
}
// 悬停只做轻微提亮，与选中态拉开差距：鼠标移上去不能看起来像已经选中。
.stage-card.is-interactive:hover {
  border-color: #a9d2cd;
  background: #fcfefe;
  box-shadow: 0 3px 10px rgba(28, 73, 78, 0.06);
}
// 顶部 3px 青绿渐变条。整层铺满卡片外轮廓并沿用同一圆角，只用 background-size 露出顶部 3px，
// 这样条子两端会被卡片自身的圆角弧线裁切、正好贴合；不要改回「3px 高的独立元素 + 12px 圆角」：
// 浏览器会把 12px 圆角按 3px 高度等比压成 3px，弧线远比卡片陡，两端会顶出卡片轮廓。
.stage-card::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: var(--overview-radius);
  background-image: linear-gradient(90deg, #13b3a4, #00857e 50%, #13b3a4);
  background-repeat: no-repeat;
  background-position: center top;
  background-size: 72% 3px;
  opacity: 0;
  transition: opacity var(--overview-motion-fast) ease, background-size var(--overview-motion-enter) var(--overview-motion-ease);
  pointer-events: none;
}
// 选中态：青绿细边框 + 同色光圈、自上而下淡出的薄荷底色与轻微抬升，与分段按钮、详情页签、筛选胶囊同一套青绿语言。
.stage-card.selected {
  z-index: 1;
  border-color: #2f9e94;
  background: linear-gradient(180deg, #eef9f6 0%, #f7fcfa 42%, #fff 84%);
  box-shadow: 0 0 0 1px rgba(0, 133, 126, 0.18), 0 3px 12px -4px rgba(0, 96, 90, 0.3), 0 1px 2px rgba(10, 60, 60, 0.04);
}
.stage-card.selected::before {
  opacity: 1;
  background-size: 100% 3px;
}
// 已选中的卡片再次悬停时保持薄荷底并略微加深，不再退回普通卡片的浅灰悬停样式。
.stage-card.selected.is-interactive:hover {
  border-color: #1f8b82;
  background: linear-gradient(180deg, #e7f7f3 0%, #f3fbf8 42%, #fff 84%);
  box-shadow: 0 0 0 1px rgba(0, 133, 126, 0.28), 0 6px 16px -4px rgba(0, 96, 90, 0.38), 0 1px 2px rgba(10, 60, 60, 0.05);
}
// 选中卡片内的标题、占比标签与分隔线同步转向青绿，避免只有边框变色、内容仍是普通卡片的灰调。
.stage-card.selected h2 {
  color: #0b5f5a;
}
.stage-card.selected .stage-ratio {
  border-color: #b7e0da;
  background: #e2f4f1;
  color: #2d6b67;
}
.stage-card.selected .stage-ratio em {
  color: #00736c;
}
.stage-card.selected dl {
  border-top-color: #daede8;
}
.stage-card.selected .stage-total .overview-value {
  color: #007b74;
}
// 图标高度跟随所在行：空间充足时放大到 4.6em，矮屏下不小于 2.5em。
.stage-icon {
  align-self: center;
  width: 100%;
  height: 100%;
  max-height: 4.6em;
  min-height: 0;
  object-fit: contain;
}
// 名称较长时按字数缩小字号，完整显示；100cqi 为卡片内容宽度。
.stage-card h2 {
  align-self: center;
  max-width: 100%;
  margin: 0;
  color: var(--overview-text);
  font-size: ~'min(1.15em, 100cqi / (var(--title-em) * 1.04))';
  line-height: 1.3;
  font-weight: 600;
  white-space: nowrap;
}
// 主数值居中，占比标签紧随其下。
.stage-total {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25em;
  width: 100%;
  min-width: 0;
}
.stage-ratio {
  padding: 0.1em 0.5em;
  border: 1px solid #d7ebe6;
  border-radius: 0.4em;
  background: #f0f7f5;
  color: var(--overview-muted);
  font-size: ~'max(11px, 0.8em)';
  line-height: 1.5;
  font-weight: 400;
  white-space: nowrap;
}
.stage-ratio em {
  color: #007d75;
  font-style: normal;
  font-weight: 700;
}
.stage-total .overview-value {
  --value-size: 2.1em;
  --unit-size: ~'max(11px, 0.86em)';
  --value-unit-color: var(--overview-muted);
  color: #007d75;
  line-height: 1.15;
}
// 数值本身是穿透入口：整体按钮贴合数值区域，只改悬停反馈，不改变卡片排版。
.stage-total-trigger,
.summary-total-trigger,
.stage-status-trigger {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: inherit;
  cursor: pointer;
}
.summary-total-trigger:hover :deep(strong),
.summary-total-trigger:focus-visible :deep(strong) {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.12em;
}
.stage-total-trigger:hover .overview-value :deep(strong),
.stage-total-trigger:focus-visible .overview-value :deep(strong) {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.12em;
  text-decoration-color: rgba(0, 133, 126, 0.45);
}
// 子阶段数值常驻点状下划线，鼠标移入或键盘聚焦时转为实线，明确它是可穿透的。
.stage-status-trigger .overview-value :deep(strong) {
  text-decoration: underline dotted rgba(0, 133, 126, 0.5);
  text-underline-offset: 0.25em;
  text-decoration-thickness: 1px;
}
.stage-status-trigger:hover .overview-value :deep(strong),
.stage-status-trigger:focus-visible .overview-value :deep(strong) {
  text-decoration-style: solid;
  text-decoration-color: #00857e;
}
// 状态列表按最多行数预留高度，状态较少的卡片也与其它卡片的主数值、分隔线对齐；宽卡片里限宽居中，名称与数值不会拉得过开。
.stage-card dl {
  display: flex;
  flex-direction: column;
  align-self: center;
  gap: 0.2em;
  width: 100%;
  max-width: 15em;
  min-width: 0;
  min-height: calc(var(--status-rows) * 1.7em + 0.3em + 1px);
  margin: 0;
  padding: 0.5em 0 0;
  border-top: 1px solid #edf1f3;
  font-size: 0.93em;
}
.stage-card dl div {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 0.6em;
  line-height: 1.5;
  white-space: nowrap;
}
.stage-card dt,
.stage-card dd {
  margin: 0;
}
.stage-card dt {
  color: var(--overview-muted);
}
.stage-card dd {
  min-width: 0;
  color: #304854;
  --value-unit-color: var(--overview-muted);
  font-weight: 600;
}
.stage-card dd .overview-value {
  --unit-size: ~'max(10.5px, 0.93em)';
  line-height: 1.5;
}
</style>
