<!-- 智能审核规则看板：移植自原型「审核规则0.3」模块一（4 张统计卡 + 4 个图表） -->
<template>
  <section class="rule-dashboard">
    <div class="dashboard-body">
      <!-- 卡片1：规则分布（点击 → 联动下方主表搜索条件） -->
      <div class="metric-card metric-card--blue">
        <div class="metric-head">
          <span class="metric-icon metric-icon--blue" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M4 20v-6M10 20V6M16 20v-9M22 20H2" />
            </svg>
          </span>
          <div class="metric-head__main">
            <span class="metric-label">规则分布</span>
            <span class="metric-stat">
              <b class="metric-value">{{ ruleDist.categoryRuleCnt }}</b>
              <span class="metric-sub">条规则 / {{ ruleDist.ruleCnt }} 个要点</span>
            </span>
          </div>
          <select class="metric-select" v-model="activeDimension" @change="handleDimensionChange">
            <option v-for="dimension in dimensionOptions" :key="dimension.key" :value="dimension.key">
              {{ dimension.label }}
            </option>
          </select>
        </div>
        <div class="metric-body metric-body--row">
          <div ref="ruleDistRef" class="chart chart--donut"></div>
          <ul class="legend">
            <li
              class="legend-item"
              :class="{ 'is-active': activeRuleName === item.name }"
              v-for="(item, index) in currentRuleDist"
              :key="item.name"
              @click="handleRuleLegendClick(item, index)"
            >
              <span class="legend-main">
                <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="legend-name">{{ item.name }}</span>
              </span>
              <span class="legend-value">
                <b>{{ item.value }}</b
                ><span class="legend-unit">条</span>
                <i>/</i>
                <em>{{ item.points }}</em
                ><span class="legend-unit">个要点</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 卡片2：应用分布（点击 → 事项明细弹窗） -->
      <div class="metric-card metric-card--violet">
        <div class="metric-head">
          <span class="metric-icon metric-icon--violet" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7h7v7H3zM14 10h7v7h-7z" opacity=".55" />
              <path d="M3 17h7v4H3zM14 20h7" />
            </svg>
          </span>
          <div class="metric-head__main">
            <span class="metric-label">应用分布</span>
            <span class="metric-stat">
              <b class="metric-value">{{ projectTotals.procnt }}</b>
              <span class="metric-sub">个项目类型 / {{ projectTotals.yssxCnt }} 个事项</span>
            </span>
          </div>
        </div>
        <!-- 条目多时靠外层滚动，柱子保持固定粗细与行距（否则 echarts 会把柱高和文字一起压扁） -->
        <div class="metric-body metric-body--scroll">
          <div ref="projectTypeRef" class="chart chart--bar" :style="{ height: `${projectBarHeight}px` }"></div>
        </div>
      </div>

      <!-- 卡片3：文件解析（点击 → 文件清单弹窗） -->
      <div class="metric-card metric-card--cyan">
        <div class="metric-head">
          <span class="metric-icon metric-icon--cyan" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 3v5h5" />
              <path d="M19 8v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5z" />
              <path d="M9 13h6M9 17h4" />
            </svg>
          </span>
          <div class="metric-head__main">
            <span class="metric-label">文件解析</span>
            <span class="metric-stat">
              <b class="metric-value">{{ docTotalText }}</b>
              <span class="metric-sub">个文件</span>
            </span>
          </div>
        </div>
        <div class="metric-body metric-body--row">
          <div ref="docTypeRef" class="chart chart--donut"></div>
          <ul class="legend">
            <li
              class="legend-item"
              v-for="(item, index) in docDist"
              :key="item.name"
              @click="handleDrill('file', { fjId: docFjIds[index], name: item.name })"
            >
              <span class="legend-main">
                <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="legend-name">{{ item.name }}</span>
              </span>
              <span class="legend-value"
                ><b>{{ item.value.toLocaleString('zh-CN') }}</b
                ><span class="legend-unit">个</span></span
              >
            </li>
          </ul>
        </div>
      </div>

      <!-- 卡片4：审核要点异动排名（点击柱条 → 该规则的未通过清单；「查看全部」→ 不带规则Id的未通过清单） -->
      <div class="metric-card metric-card--orange">
        <div class="metric-head">
          <span class="metric-icon metric-icon--orange" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9L2.5 17.3A2 2 0 004.2 20h15.6a2 2 0 001.7-2.7L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </span>
          <div class="metric-head__main">
            <span class="metric-label">审核规则异动排名</span>
            <span class="metric-stat">
              <b class="metric-value">{{ riskRanking.length }}</b>
              <span class="metric-sub">个审核要点</span>
            </span>
          </div>
          <span
            class="metric-viewall"
            role="button"
            tabindex="0"
            @click="openAllRisk"
            @keydown.enter="openAllRisk"
            @keydown.space.prevent="openAllRisk"
          >
            查看全部
          </span>
        </div>
        <div class="metric-body metric-body--scroll">
          <div ref="riskRankRef" class="chart chart--bar" :style="{ height: `${riskBarHeight}px` }"></div>
        </div>
      </div>
    </div>

    <!-- 穿透弹窗：数据在 data.ts，弹窗只负责渲染 -->
    <itemDetailModal ref="itemDetailModalRef" @open-yssx-point-list="openYssxPointList" />
    <yssxPointListModal ref="yssxPointListModalRef" />
    <fileListModal ref="fileListModalRef" />
    <unpassListModal ref="unpassListModalRef" />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { CHART_PALETTE, RULE_DIM_BY_API_NAME, RULE_DIST_DIMENSIONS, RULE_DIST_FILTER_FIELD, colorForDistribution } from './data'
import type { DistItem, RuleDistKey } from './data'
import { getAuditXmFileQuantity, getCategoryRuleDistribution, getProDistribution, getProTaskUnPassRule } from '@/api/suzhou/aiAuditRuleMonitoring'
import type { AuditXmFileItem, CategoryRuleDistributionData, ProDistributionItem, ProTaskUnPassRuleItem } from '@/api/suzhou/aiAuditRuleMonitoring'
import itemDetailModal from '../itemDetailModal/index.vue'
import yssxPointListModal from '../yssxPointListModal/index.vue'
import fileListModal from '../fileListModal/index.vue'
import unpassListModal from '../unpassListModal/index.vue'

/**
 * 联动下方主表：看板拿不到表格实例，所以只把条件 emit 出去，由页面写进 RangeVxeTable 的 searchParam。
 * value 传空串表示清除该条件。
 */
const emit = defineEmits<{
  (e: 'filter-change', payload: { field: string; value: string }): void
}>()

/**
 * 页面里的角色上下文。穿透弹窗里的「一级单位/二级单位」下拉要它才能取到单位列表，
 * 缺省为空对象时下拉为空，不影响其它查询。
 */
const props = withDefaults(
  defineProps<{
    roleParams?: { bmId?: string; dwId?: string }
  }>(),
  { roleParams: () => ({}) }
)

/**
 * 规则分布默认维度：**按级别**（需求 2026-10-13；原来默认按状态）。
 * 接口没给「按级别」这一组时会退回第一个可用维度（见 loadRuleDist 的兜底）。
 */
const activeDimension = ref<RuleDistKey>('level')
const activeRuleName = ref('')

/** 规则分布：接口的 pieChartData 原样留着，有哪些维度、每个维度几个扇区都由后端决定 */
const ruleDist = ref<CategoryRuleDistributionData>({ ruleCnt: '0', categoryRuleCnt: '0', pieChartData: [] })
/** 可见维度：接口给了哪个维度就显示哪个，顺序沿用本地定义 */
const dimensionOptions = computed(() =>
  RULE_DIST_DIMENSIONS.filter((d) => ruleDist.value.pieChartData.some((g) => RULE_DIM_BY_API_NAME[g.name] === d.key))
)

const projectDist = ref<DistItem[]>([])
const projectTotals = ref({ procnt: '0', yssxCnt: '0' })
const docDist = ref<DistItem[]>([])
const docTotal = ref('0')
const riskRanking = ref<DistItem[]>([])

/**
 * 穿透弹窗要的 id 与图表数据分开存、按下标对齐。
 * 不塞进 DistItem 是因为 DistItem 是四个图表共用的形状，加字段会让每个图都得带着无关的 id。
 */
const projectIds = ref<string[]>([])
const docFjIds = ref<string[]>([])
const riskRuleIds = ref<string[]>([])

const itemDetailModalRef = ref()
const yssxPointListModalRef = ref()
const fileListModalRef = ref()
const unpassListModalRef = ref()

/** 规则分布扇区：环形图的 value 取规则数，图例再额外显示要点数 */
interface RuleDistPoint extends DistItem {
  /** 接口给的统计编码值，用于联动主表筛选 */
  code: string
  /** 要点数量 */
  points: number
}

const currentRuleDist = computed<RuleDistPoint[]>(() => {
  const group = ruleDist.value.pieChartData.find((g) => RULE_DIM_BY_API_NAME[g.name] === activeDimension.value)
  return (group?.ruleDistribution || []).map((item, index) => ({
    name: item.name,
    value: Number(item.categoryRuleCnt) || 0,
    points: Number(item.ruleCnt) || 0,
    code: item.code,
    color: colorForDistribution(activeDimension.value, item.code, index)
  }))
})

/** 文件总数接口给的是字符串，表头要千分位 */
const docTotalText = computed(() => Number(docTotal.value || 0).toLocaleString('zh-CN'))

/**
 * 横向柱图的高度：每条固定 24px 行距，不足 128px（= 原型卡片的 h-32）时取 128。
 * 24 是让「原型那种 5 条以内」正好落进 128 的框里（5×24=120），不出现多余的滚动条；
 * 超过 5 条才由外层滚动。这样条目变多时是**容器长高 + 滚动**，而不是让 echarts 把柱子和文字一起压扁。
 */
const BAR_ROW_HEIGHT = 24
const BAR_MIN_HEIGHT = 128
const projectBarHeight = computed(() => Math.max(BAR_MIN_HEIGHT, projectDist.value.length * BAR_ROW_HEIGHT))
const riskBarHeight = computed(() => Math.max(BAR_MIN_HEIGHT, riskRanking.value.length * BAR_ROW_HEIGHT))

/**
 * 最近一次由本看板下发给主表的筛选条件。
 * 切换维度时要把它清掉——否则表格还按上一个维度（比如「按状态 · 启用」）筛着，
 * 图表却已经换了维度，两边对不上。原型也是这个做法（select 的 change 里调 clearRuleFilter）。
 */
const appliedChartFilter = ref<{ field: string; value: string } | null>(null)

// --- 图表实例 ---
const ruleDistRef = ref<HTMLDivElement>()
const projectTypeRef = ref<HTMLDivElement>()
const docTypeRef = ref<HTMLDivElement>()
const riskRankRef = ref<HTMLDivElement>()

let ruleDistChart: echarts.ECharts | null = null
let projectTypeChart: echarts.ECharts | null = null
let docTypeChart: echarts.ECharts | null = null
let riskRankChart: echarts.ECharts | null = null

// --- option 公共片段（集中一处，避免 4 个图表重复） ---
// tooltip 阴影用主色色调，与 css/modal.less 的弹窗阴影同源
const TOOLTIP_BASE = {
  backgroundColor: '#fff',
  borderColor: '#e2e8f0',
  textStyle: { color: '#1e293b', fontSize: 12 },
  extraCssText: 'box-shadow: 0 4px 16px rgba(0, 112, 107, 0.12); border-radius: 6px;',
  /**
   * 把 tooltip 挂到 body 上。
   * 不挂的话它渲染在图表容器内部，而两张横向柱图的容器是 `overflow-y: auto; max-height: 128px` 的滚动盒
   * （条目多时靠它滚），tooltip 一超出这个盒子就被裁掉 —— 表现就是「靠下的柱子悬浮时提示文字被遮住」。
   */
  appendToBody: true
}
const AXIS_LABEL = { fontSize: 10, color: '#64748b' }
/** 卡片2/3/4 的提示：点击开明细弹窗 */
const DRILL_HINT = '<br/><span style="color:#94a3b8;font-size:11px">点击查看明细</span>'
/** 卡片1 的提示：点击联动主表（不是弹窗） */
const FILTER_HINT = '<br/><span style="color:#94a3b8;font-size:11px">点击联动下方列表</span>'

/** 环形图：规则分布与文件解析共用。泛型是为了让规则分布那侧能拿到 points 字段而不必强转 */
function buildDonutOption<T extends DistItem>(data: T[], tip: (item: T) => string, unit = '条'): echarts.EChartsOption {
  return {
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'item',
      formatter: (params: any) => tip(data[params.dataIndex])
    },
    series: [
      {
        type: 'pie',
        // 半径、无标签、选中偏移都与原型一致（radius 60%/80%，label 关、hover 才显示）
        radius: ['60%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        labelLine: { show: false },
        selectedMode: 'single',
        selectedOffset: 6,
        emphasis: {
          scale: true,
          scaleSize: 6,
          // 新版原型给 hover 标签显式指定了文字色（不给就用 echarts 默认色）
          label: { show: true, fontSize: 12, fontWeight: 'bold', formatter: `{b}\n{c}${unit}`, color: '#334155' }
        },
        // 环段之间的白色细分隔照原型 v2（itemStyle: borderColor #fff / borderWidth 2 / borderRadius 4）
        data: data.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color, borderColor: '#fff', borderWidth: 2, borderRadius: 4 }
        }))
      }
    ]
  }
}

/**
 * 柱子厚度：两张横向柱图**共用固定的像素值**。
 * 不能用原型那种百分比（55%/60%）——容器高度是固定的 128px，百分比会让
 * 「每行 slot = 容器高 / 条数」随条数变化：4 条时柱厚约 14px、5 条时约 12px，
 * 两张图条数不同就粗细不一（用户提过）。固定 14px 后两张图、任意条数都一致。
 */
const BAR_WIDTH = 14

/** 横向柱：应用分布与审核要点异动排名共用 */
function buildBarOption(data: DistItem[], valueLabel: string, bold = false): echarts.EChartsOption {
  // 垂直留白用**固定像素 + 固定行距**，不用原型那套百分比：
  // - `top: '5%'` 的留白随图表高度变，条目多的那张（异动排名通常比应用分布条多）
  //   首条柱子会更低，两张柱图的柱子对不齐、离卡片标题也更远；
  // - 行距固定 BAR_ROW_HEIGHT 后，多出来的高度全部沉到底部（bottom 用算出来的余量），
  //   于是不管条目多少，首条柱子都落在图表顶部同一位置，与标题的间距也一致。
  const chartHeight = Math.max(BAR_MIN_HEIGHT, data.length * BAR_ROW_HEIGHT)
  const gridTop = 2
  const gridBottom = Math.max(0, chartHeight - gridTop - data.length * BAR_ROW_HEIGHT)
  return {
    // 左右仍是原型的百分比网格：留出右侧给柱端数字
    grid: { left: '3%', right: '8%', top: gridTop, bottom: gridBottom, containLabel: true },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => `${params[0].name}${valueLabel ? `<br/>${valueLabel}：${params[0].value}` : ''}${DRILL_HINT}`
    },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      // 类目自上而下按数组顺序排（echarts 默认把第一个类目画在最下面）。
      // 这里是「排名」且条目多时容器会滚动：必须让第一条落在顶部，否则首屏看到的是排最后的几条。
      // dataIndex 与 data 数组的顺序不受影响，点击穿透仍然按下标取 id。
      inverse: true,
      data: data.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        ...AXIS_LABEL,
        formatter: (value: string) => (value.length > 8 ? `${value.slice(0, 8)}...` : value)
      }
    },
    series: [
      {
        type: 'bar',
        barWidth: BAR_WIDTH,
        cursor: 'pointer',
        label: { show: true, position: 'right', fontSize: 10, color: '#64748b', fontWeight: bold ? 'bold' : 'normal' },
        data: data.map((item) => ({ value: item.value, itemStyle: { color: item.color, borderRadius: [0, 4, 4, 0] } }))
      }
    ]
  }
}

/**
 * 条目数变化后容器高度会变（见 projectBarHeight / riskBarHeight），
 * echarts 不会自己跟着变，要显式 resize 一次。
 */
async function resizeChartAfterData(chart: echarts.ECharts | null) {
  if (!chart) return
  await nextTick()
  chart.resize()
}

/** 切换维度后重画环形图。notMerge 同时清掉上一个维度的扇区选中态 */
function renderRuleDist() {
  activeRuleName.value = ''
  const dimensionLabel = RULE_DIST_DIMENSIONS.find((d) => d.key === activeDimension.value)?.fieldLabel || ''
  ruleDistChart?.setOption(
    buildDonutOption(
      currentRuleDist.value,
      (item) =>
        `${item.name}<br/>规则：${item.value} 条<br/>要点：${item.points} 个<br/>` +
        `<span style="color:#94a3b8;font-size:11px">${item.code ? '点击联动下方列表' : `${dimensionLabel}无可联动值`}</span>`,
      '条'
    ),
    true
  )
}

/** 清掉本看板下发给主表的筛选条件；没有下发过就什么都不做 */
function clearRuleFilter() {
  const applied = appliedChartFilter.value
  if (!applied) return
  appliedChartFilter.value = null
  emit('filter-change', { field: applied.field, value: '' })
}

/**
 * 切换维度：重画环形图并**重置下方列表**。
 * 原型在 select 的 change 里同样是 renderRuleChart + clearRuleFilter。
 */
function handleDimensionChange() {
  renderRuleDist()
  clearRuleFilter()
}

/**
 * 规则分布点击 → 联动主表搜索条件。
 *
 * 传的是接口返回的 code（后端统计编码值），所以看板与主表用的是同一套码值。
 * 四个维度都已在 RULE_DIST_FILTER_FIELD 里配好落点（按专业 → 主表的规则类型 ruleMajor，两边同码值），
 * 所以只剩「扇区没给 code」这一种情况不筛选、只提示。
 */
function applyRuleFilter(item: RuleDistPoint) {
  const key = activeDimension.value
  const field = RULE_DIST_FILTER_FIELD[key]
  const dimensionLabel = RULE_DIST_DIMENSIONS.find((d) => d.key === key)?.fieldLabel || '该维度'

  if (!item.code) {
    ElMessage.warning(`「${item.name}」没有返回可联动的编码值，无法按${dimensionLabel}筛选`)
    return
  }
  appliedChartFilter.value = { field, value: item.code }
  emit('filter-change', { field, value: item.code })
}

/** 取消高亮时把该搜索条件一起清掉，避免图表看着没选、表格却还筛着 */
function clearRuleFilterOnDeselect() {
  clearRuleFilter()
}

/** 图例点击：高亮对应扇区（single 模式会自动顶掉上一个），并联动主表；再点一次取消 */
function handleRuleLegendClick(item: RuleDistPoint, index: number) {
  if (activeRuleName.value === item.name) {
    activeRuleName.value = ''
    ruleDistChart?.dispatchAction({ type: 'unselect', seriesIndex: 0, dataIndex: index })
    clearRuleFilterOnDeselect()
    return
  }
  activeRuleName.value = item.name
  ruleDistChart?.dispatchAction({ type: 'select', seriesIndex: 0, dataIndex: index })
  applyRuleFilter(item)
}

type DrillType = 'project' | 'file' | 'risk'

/** 穿透目标：name 用于标题，另一个字段是各自明细接口要的 id */
interface DrillTarget {
  name: string
  id?: string
  fjId?: string
  categoryRuleId?: string
}

/** 卡片2/3/4 的穿透：把接口给的 id 交给对应弹窗，弹窗自己去查明细 */
function handleDrill(type: DrillType, target: DrillTarget) {
  if (type === 'project') {
    itemDetailModalRef.value?.acceptParams({ proTypeName: target.name, id: target.id || '' })
    return
  }
  if (type === 'file') {
    // roleParams 给弹窗里的一级/二级单位下拉用，口径与卡片4 的未通过清单一致
    fileListModalRef.value?.acceptParams({ fileType: target.name, fjId: target.fjId || '', roleParams: props.roleParams })
    return
  }
  unpassListModalRef.value?.acceptParams({
    categoryRuleId: target.categoryRuleId || '',
    ruleName: target.name,
    roleParams: props.roleParams
  })
}

/** 卡片4「查看全部」：不带 categoryRuleId，查全部规则的未通过记录（文档把该入参改为可选正是为此） */
function openAllRisk() {
  unpassListModalRef.value?.acceptParams({ roleParams: props.roleParams })
}

/**
 * 卡片2 二级穿透：事项明细里点「已分配审核要点数量」→ 该预算事项关联的审核要点清单
 * （文档十四 getYssxRelaRulePage，入参 zyssxbm）。编码由 itemDetailModal 从行上取好再 emit。
 */
function openYssxPointList(payload: { zyssxbm: string; zyssxmc: string }) {
  yssxPointListModalRef.value?.acceptParams(payload)
}

/* ---------------- 四个卡片的数据加载 ---------------- */

const loadRuleDist = async () => {
  const res = await getCategoryRuleDistribution()
  if (!res.success) {
    ElMessage.error(res.msg || '规则分布获取失败')
    return
  }
  ruleDist.value = res.data || { ruleCnt: '0', categoryRuleCnt: '0', pieChartData: [] }
  // 后端没给当前维度时退回第一个可用维度，避免空图（默认维度是「按级别」）
  if (!dimensionOptions.value.some((d) => d.key === activeDimension.value)) {
    activeDimension.value = dimensionOptions.value[0]?.key || 'level'
  }
  renderRuleDist()
}

const loadProjectDist = async () => {
  const res = await getProDistribution()
  if (!res.success) {
    ElMessage.error(res.msg || '应用分布获取失败')
    return
  }
  const list: ProDistributionItem[] = res.data?.proDistribution || []
  projectTotals.value = { procnt: res.data?.procnt ?? '0', yssxCnt: res.data?.yssxCnt ?? '0' }
  projectIds.value = list.map((item) => item.id)
  // 配色照原型（多色），见 data.ts 的 CHART_PALETTE 说明
  projectDist.value = list.map((item, index) => ({
    name: item.name,
    value: Number(item.cnt) || 0,
    color: CHART_PALETTE.projectDist[index % CHART_PALETTE.projectDist.length]
  }))
  projectTypeChart?.setOption(buildBarOption(projectDist.value, '事项'), true)
  await resizeChartAfterData(projectTypeChart)
}

const loadDocDist = async () => {
  // bmId / dwId 走角色上下文（与穿透弹窗里的下拉同源），由页面 RuleDashboard props 透传；
  // 不传则后端按无权限收口
  const res = await getAuditXmFileQuantity({
    bmId: props.roleParams?.bmId || '',
    dwId: props.roleParams?.dwId || ''
  })
  if (!res.success) {
    ElMessage.error(res.msg || '文件解析数据获取失败')
    return
  }
  const list: AuditXmFileItem[] = res.data?.xmFileData || []
  docTotal.value = res.data?.fileQuantity ?? '0'
  docFjIds.value = list.map((item) => item.fjId)
  docDist.value = list.map((item, index) => ({
    name: item.fileType,
    value: Number(item.cnt) || 0,
    color: CHART_PALETTE.docDist[index % CHART_PALETTE.docDist.length]
  }))
  docTypeChart?.setOption(buildDonutOption(docDist.value, (item) => `${item.name}<br/>文件：${item.value} 个${DRILL_HINT}`, '个'))
  await resizeChartAfterData(docTypeChart)
}

const loadRiskRanking = async () => {
  // bmId / dwId 走角色上下文（与穿透弹窗里的下拉同源），由页面 RuleDashboard props 透传；
  // 不传则后端按无权限收口
  const res = await getProTaskUnPassRule({
    bmId: props.roleParams?.bmId || '',
    dwId: props.roleParams?.dwId || ''
  })
  if (!res.success) {
    ElMessage.error(res.msg || '审核要点异动排名获取失败')
    return
  }
  const list: ProTaskUnPassRuleItem[] = res.data || []
  riskRuleIds.value = list.map((item) => item.categoryRuleId)
  // 排名按顺序取原型的 unifiedColors（排名第一最突出）
  riskRanking.value = list.map((item, index) => ({
    name: item.ruleName,
    value: Number(item.cnt) || 0,
    color: CHART_PALETTE.riskRank[index % CHART_PALETTE.riskRank.length]
  }))
  riskRankChart?.setOption(buildBarOption(riskRanking.value, '', true), true)
  await resizeChartAfterData(riskRankChart)
}

function handleResize() {
  ruleDistChart?.resize()
  projectTypeChart?.resize()
  docTypeChart?.resize()
  riskRankChart?.resize()
}

onMounted(async () => {
  // 本组件挂在页面的 v-if="isShowPage" 内（角色确认后才挂载），此时容器已有尺寸，
  // 但仍等一帧确保布局完成，避免 echarts 按 0 宽高初始化
  await nextTick()

  // 先建实例、再拉数据：数据回来时直接 setOption，不必再判实例是否存在
  if (ruleDistRef.value) {
    ruleDistChart = echarts.init(ruleDistRef.value)
    ruleDistChart.on('click', (params: any) => {
      const item = currentRuleDist.value[params.dataIndex]
      if (!item) return
      activeRuleName.value = item.name
      applyRuleFilter(item)
    })
  }
  if (projectTypeRef.value) {
    projectTypeChart = echarts.init(projectTypeRef.value)
    projectTypeChart.on('click', (params: any) => {
      const index = params.dataIndex
      const id = projectIds.value[index]
      if (id) handleDrill('project', { id, name: projectDist.value[index]?.name || '' })
    })
  }
  if (docTypeRef.value) {
    docTypeChart = echarts.init(docTypeRef.value)
    docTypeChart.on('click', (params: any) => {
      const index = params.dataIndex
      const fjId = docFjIds.value[index]
      if (fjId) handleDrill('file', { fjId, name: docDist.value[index]?.name || '' })
    })
  }
  if (riskRankRef.value) {
    riskRankChart = echarts.init(riskRankRef.value)
    riskRankChart.on('click', (params: any) => {
      const index = params.dataIndex
      const categoryRuleId = riskRuleIds.value[index]
      if (categoryRuleId) handleDrill('risk', { categoryRuleId, name: riskRanking.value[index]?.name || '' })
    })
  }

  window.addEventListener('resize', handleResize)

  // 四个卡片互不依赖，一个挂了不影响其它卡继续显示
  await Promise.allSettled([loadRuleDist(), loadProjectDist(), loadDocDist(), loadRiskRanking()])

  // 数据回来后再 resize 一次：卡片是 grid/flex 布局，首帧量到的容器宽度未必是最终宽度，
  // echarts.init 若拿到 0 宽会建出 0 宽的 canvas，之后不 resize 就一直是空白图。
  // 数据回来后 resize 一次兜底：侧栏宽度是 0.3s 过渡动画，首帧量到的内容区宽度未必是最终宽度，
  // 而 echarts 的尺寸是按 init 那一刻的容器宽度定死的。实测多数情况直接 init 也没问题，
  // 这里只作为布局尚未落定时的一道保险（成本极低、幂等）。
  await nextTick()
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  ruleDistChart?.dispose()
  projectTypeChart?.dispose()
  docTypeChart?.dispose()
  riskRankChart?.dispose()
  ruleDistChart = null
  projectTypeChart = null
  docTypeChart = null
  riskRankChart = null
})
</script>

<style scoped lang="less">
@import '../../css/dashboard.less';
</style>
