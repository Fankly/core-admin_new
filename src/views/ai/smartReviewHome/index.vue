<template>
  <main v-if="isShowPage" class="srh-page" v-loading="loading" aria-label="AI 智能审核首页">
    <!-- 顶部主视觉 -->
    <section class="srh-header" aria-label="智能审核概览">
      <img class="srh-header-background" :src="headerBackground" alt="" />
      <div class="srh-header-bg-fx" aria-hidden="true">
        <span class="srh-header-mesh"></span>
        <span class="srh-header-orb srh-header-orb--a"></span>
        <span class="srh-header-orb srh-header-orb--b"></span>
        <span class="srh-header-orb srh-header-orb--c"></span>
        <span class="srh-header-beam"></span>
        <span class="srh-header-particles"></span>
      </div>
      <div class="srh-header-glow" aria-hidden="true"></div>
      <div class="srh-header-body">
        <div class="srh-header-left">
          <strong class="srh-greeting">{{ greeting }}</strong>
          <div class="srh-mode-pill">
            <img :src="auditModeIcon" alt="" />
            <p>AI智审模式全时运行，保障合规填报，护航储备</p>
          </div>
        </div>
        <div class="srh-header-center">
          <h1>
            <span class="srh-title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L4 5.5V11.2C4 16.1 7.4 20.6 12 22C16.6 20.6 20 16.1 20 11.2V5.5L12 2Z"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                />
                <path d="M9 12.2L11 14.2L15.2 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            AI守底线，人工把方向
          </h1>
          <div class="srh-capability-list">
            <span v-for="item in capabilities" :key="item">{{ item }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心指标 -->
    <section class="srh-metrics-panel" aria-label="核心审核指标" :class="{ 'is-empty': !metrics.length }">
      <template v-if="metrics.length">
        <article v-for="metric in metrics" :key="metric.key" class="srh-metric-card">
          <div class="srh-metric-icon-wrap">
            <img :src="metric.icon" alt="" />
          </div>
          <div class="srh-metric-main">
            <p>{{ metric.label }}</p>
            <strong>{{ metric.value }}</strong>
          </div>
          <span class="srh-metric-inc">
            今日新增: <b>{{ metric.increment }}</b>
            <i v-if="metric.trending" class="srh-trend-arrow" aria-hidden="true"></i>
          </span>
        </article>
      </template>
      <div v-else class="srh-panel-empty" role="status">
        <p class="srh-empty-tip">暂无指标数据</p>
      </div>
    </section>

    <!-- 中部洞察区 -->
    <section class="srh-insight-row" aria-label="业务洞察">
      <section class="srh-card srh-rules-card" aria-labelledby="rules-title">
        <h2 id="rules-title" class="srh-card-title">
          <span class="srh-card-title-icon srh-card-title-icon--rules" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3.5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.4" />
              <path d="M6.5 8H13.5M6.5 11H11.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              <circle cx="14" cy="14" r="3.2" fill="currentColor" opacity="0.18" />
              <path d="M12.8 14L13.7 14.9L15.4 13.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          规则库
        </h2>
        <div class="srh-rule-grid" :class="{ 'is-empty': !rules.length }">
          <template v-if="rules.length">
            <article v-for="rule in rules" :key="rule.code || rule.label">
              <p>{{ rule.label }}</p>
              <strong>{{ rule.value }}<small>个</small></strong>
            </article>
          </template>
          <div v-else class="srh-panel-empty" role="status">
            <p class="srh-empty-tip">暂无规则数据</p>
          </div>
        </div>
      </section>

      <section class="srh-card srh-document-card" aria-labelledby="document-title">
        <h2 id="document-title" class="srh-card-title">
          <span class="srh-card-title-icon srh-card-title-icon--document" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 3.5H11.2L14.5 6.8V16.5H6V3.5Z"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linejoin="round"
              />
              <path d="M11 3.6V7H14.3" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
              <path d="M8 10H12.5M8 12.8H11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </span>
          文档解析
        </h2>
        <div class="srh-document-body" :class="{ 'is-empty': !documentStats.length }">
          <template v-if="documentStats.length">
            <div class="srh-document-total">
              <p>累计解析文档</p>
              <strong>{{ formatCount(documentTotal) }}<small>个</small></strong>
              <img :src="documentIllustration" alt="文档解析插画" />
            </div>
            <div class="srh-document-list">
              <p v-for="item in documentStats" :key="item.label">
                <span>{{ item.label }}</span>
                <b>{{ item.value }}<small>个</small></b>
              </p>
            </div>
          </template>
          <div v-else class="srh-panel-empty" role="status">
            <p class="srh-empty-tip">暂无文档数据</p>
          </div>
        </div>
      </section>

      <section class="srh-card srh-risk-card" aria-labelledby="risk-title">
        <h2 id="risk-title" class="srh-card-title">
          <span class="srh-card-title-icon srh-card-title-icon--risk" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3.2L17 15.8H3L10 3.2Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
              <path d="M10 8V11.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="10" cy="13.6" r="0.9" fill="currentColor" />
            </svg>
          </span>
          审核风险项分布
        </h2>
        <div class="srh-risk-body" :class="{ 'is-empty': !riskLevels.length && !riskTypes.length }">
          <template v-if="riskLevels.length || riskTypes.length">
            <div v-if="riskLevels.length" class="srh-risk-group">
              <div ref="levelChartRef" class="srh-donut" role="img" :aria-label="levelChartAria"></div>
              <ul>
                <li v-for="item in riskLevels" :key="item.code || item.label">
                  <i :style="{ backgroundColor: item.color }"></i>
                  <span
                    >{{ item.label }}<b>{{ item.value }}个&nbsp;&nbsp;占比{{ item.percent }}</b></span
                  >
                </li>
              </ul>
            </div>
            <div v-else class="srh-risk-group srh-risk-group--empty">
              <div class="srh-panel-empty" role="status">
                <p class="srh-empty-tip">暂无级别数据</p>
              </div>
            </div>
            <div v-if="riskTypes.length" class="srh-risk-group">
              <div ref="typeChartRef" class="srh-donut" role="img" :aria-label="typeChartAria"></div>
              <ul>
                <li v-for="item in riskTypes" :key="item.code || item.label">
                  <i :style="{ backgroundColor: item.color }"></i>
                  <span
                    >{{ item.label }}<b>{{ item.value }}个&nbsp;&nbsp;占比{{ item.percent }}</b></span
                  >
                </li>
              </ul>
            </div>
            <div v-else class="srh-risk-group srh-risk-group--empty">
              <div class="srh-panel-empty" role="status">
                <p class="srh-empty-tip">暂无类型数据</p>
              </div>
            </div>
          </template>
          <div v-else class="srh-panel-empty" role="status">
            <p class="srh-empty-tip">暂无风险分布数据</p>
          </div>
        </div>
      </section>

      <section class="srh-card srh-ranking-card" aria-labelledby="ranking-title">
        <h2 id="ranking-title" class="srh-card-title">
          <span class="srh-card-title-icon srh-card-title-icon--ranking" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 15.5V9.5H7.2V15.5H4Z" fill="currentColor" opacity="0.28" />
              <path d="M8.4 15.5V5H11.6V15.5H8.4Z" fill="currentColor" opacity="0.55" />
              <path d="M12.8 15.5V7.8H16V15.5H12.8Z" fill="currentColor" />
              <path d="M3.5 15.5H16.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </span>
          风险项排名
        </h2>
        <ol v-if="rankings.length" class="srh-ranking-list">
          <li v-for="(item, index) in rankings" :key="`${item.label}-${index}`">
            <i :class="`is-${index + 1}`">{{ index + 1 }}</i>
            <span>{{ item.label }}</span>
          </li>
        </ol>
        <div v-else class="srh-ranking-empty srh-panel-empty" role="status">
          <p class="srh-empty-tip">暂无排名数据</p>
        </div>
      </section>
    </section>

    <!-- 最近审核业务 -->
    <section class="srh-card srh-business-card" aria-labelledby="business-title">
      <h2 id="business-title" class="srh-card-title">
        <span class="srh-card-title-icon srh-card-title-icon--business" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3.5" y="4" width="13" height="12" rx="2" stroke="currentColor" stroke-width="1.4" />
            <path d="M6.5 7.5H13.5M6.5 10.5H13.5M6.5 13.5H11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
          </svg>
        </span>
        最近审核业务
      </h2>
      <div class="srh-business-table">
        <vxe-grid ref="gridRef" v-bind="gridOptions">
          <template #action_default="{ row }">
            <button type="button" class="srh-view-btn" @click="showDetail(row)">查看</button>
          </template>
        </vxe-grid>
      </div>
    </section>
  </main>

  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="handleRoleConfirmed" />
  <DetailModal :modal="detailModal" :detail-row="detailRow" @close="closeDetailModal" />
</template>

<script lang="ts">
export default {
  name: '/ai/smartReviewHome/index'
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import DetailModal from '@/views/ai/smartTaskAudit/components/DetailModal.vue'
import headerBackground from '@/assets/images/smart-review/smart-review-home/images/image-header-tech-banner-01.png'
import auditModeIcon from '@/assets/images/smart-review/smart-review-home/icons/icon-header-audit-mode-01.png'
import documentIllustration from '@/assets/images/smart-review/smart-review-home/illustrations/illustration-document-analysis-01.png'
import { useSmartReviewHome } from './hooks/useSmartReviewHome'
import type { AuditRow, RiskItem } from './hooks/useSmartReviewHome'
import { formatCount } from './utils'
import './styles.css'

const capabilities = ['财力保障', '价值创造', '辅助决策', '风险防范']

const {
  isShowPage,
  userRoleSelectorRef,
  greeting,
  getRoleHandle,
  loading,
  metrics,
  rules,
  documentTotal,
  documentStats,
  riskLevels,
  riskTypes,
  rankings,
  auditRows
} = useSmartReviewHome()

const levelChartRef = ref<HTMLElement | null>(null)
const typeChartRef = ref<HTMLElement | null>(null)
const gridRef = ref<VxeGridInstance>()
let levelChart: echarts.ECharts | null = null
let typeChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const levelChartAria = computed(() => riskLevels.value.map((item) => `${item.label} ${item.percent}`).join('，'))
const typeChartAria = computed(() => riskTypes.value.map((item) => `${item.label} ${item.percent}`).join('，'))

const gridOptions = reactive<VxeGridProps<AuditRow>>({
  border: 'inner',
  stripe: false,
  height: '100%',
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  loading: false,
  columnConfig: {
    resizable: true
  },
  rowConfig: {
    height: 42,
    isHover: true
  },
  columns: [
    { field: 'code', title: '项目编码', minWidth: 150 },
    { field: 'name', title: '项目名称', minWidth: 220 },
    { field: 'year', title: '计划实施年度', minWidth: 120 },
    { field: 'status', title: 'AI审核状态', minWidth: 120 },
    { field: 'audit_time', title: 'AI审核时间', minWidth: 180 },
    {
      field: 'action',
      title: '操作',
      width: 100,
      slots: { default: 'action_default' }
    }
  ],
  data: []
})

watch(
  loading,
  (value) => {
    gridOptions.loading = value
  },
  { immediate: true }
)

watch(
  auditRows,
  (rows) => {
    gridOptions.data = rows
  },
  { immediate: true, deep: true }
)

const detailModal = reactive({
  visible: false,
  loading: false
})
const detailRow = shallowRef<AuditRow>({} as AuditRow)

/** 查看项目审核详情 */
const showDetail = (row: AuditRow) => {
  detailRow.value = row || ({} as AuditRow)
  detailModal.visible = true
}

const closeDetailModal = () => {
  detailModal.visible = false
}

/** @param animate 仅首次渲染带入场动画，静默刷新时关闭，避免每轮重播 */
const buildDonutOption = (items: RiskItem[], animate = true): EChartsOption => ({
  animation: animate,
  animationDuration: animate ? 1000 : 0,
  animationEasing: 'cubicOut',
  animationDelay: (idx: number) => (animate ? idx * 90 : 0),
  tooltip: {
    trigger: 'item',
    // 挂到 body，避免被 .srh-card overflow:hidden 及左右相邻卡片遮挡
    appendToBody: true,
    // 高于页面卡片、loading 蒙层等
    extraCssText: 'z-index: 10000; pointer-events: none;',
    formatter: (params: any) => {
      const item = items[params.dataIndex]
      if (!item) return ''
      return `${item.label}<br/>${item.value}个（${item.percent}）`
    }
  },
  series: [
    {
      type: 'pie',
      clockwise: true,
      startAngle: 90,
      radius: ['68%', '92%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      animationType: 'scale',
      animationEasing: 'cubicOut',
      animationDuration: animate ? 1000 : 0,
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(0, 163, 174, 0.12)'
      },
      emphasis: {
        scale: true,
        scaleSize: 6,
        focus: 'self'
      },
      data: items.map((item) => ({
        name: item.label,
        value: item.value > 0 ? item.value : 0.0001,
        itemStyle: {
          color: item.color,
          opacity: item.value > 0 ? 1 : 0.18
        }
      }))
    }
  ]
})

const ensureChart = (chart: echarts.ECharts | null, element: HTMLElement | null, items: RiskItem[]) => {
  if (!element) return chart
  // 已存在实例说明是数据刷新：不重播动画、无需再 resize（尺寸由 ResizeObserver 维护）
  const isFirstRender = !chart
  if (!chart) {
    chart = echarts.init(element, undefined, { renderer: 'canvas' })
  }
  chart.setOption(buildDonutOption(items, isFirstRender), true)
  if (isFirstRender) chart.resize()
  return chart
}

const resizeCharts = () => {
  levelChart?.resize()
  typeChart?.resize()
}

// 图表容器在角色确认后才挂载，每次渲染时补挂 ResizeObserver
const observeCharts = () => {
  if (!resizeObserver) resizeObserver = new ResizeObserver(() => resizeCharts())
  if (levelChartRef.value) resizeObserver.observe(levelChartRef.value)
  if (typeChartRef.value) resizeObserver.observe(typeChartRef.value)
}

const renderCharts = async () => {
  await nextTick()
  // 数据为空时容器卸载，需释放图表实例，避免残留引用
  if (!levelChartRef.value) {
    levelChart?.dispose()
    levelChart = null
  }
  if (!typeChartRef.value) {
    typeChart?.dispose()
    typeChart = null
  }
  if (!levelChartRef.value && !typeChartRef.value) return
  levelChart = ensureChart(levelChart, levelChartRef.value, riskLevels.value)
  typeChart = ensureChart(typeChart, typeChartRef.value, riskTypes.value)
  observeCharts()
}

watch(
  [riskLevels, riskTypes, isShowPage],
  () => {
    renderCharts()
  },
  { deep: true }
)

const handleRoleConfirmed = async () => {
  await getRoleHandle()
  await renderCharts()
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  levelChart?.dispose()
  typeChart?.dispose()
  levelChart = null
  typeChart = null
})

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>
