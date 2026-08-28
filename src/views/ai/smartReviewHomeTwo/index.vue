<template>
  <main v-if="isShowPage" class="srh2-page" aria-label="AI 智能审核首页">
    <div class="fit-shell">
      <div class="fit-box">
        <section ref="artboardRef" class="artboard" :style="artboardStyle" aria-label="智能审核概览">
          <div class="fx-layer" aria-hidden="true">
            <div class="fx-grid-pulse"></div>
          </div>

          <div class="hero-stage" aria-label="智能审核工作台">
            <div class="hero-device hero-device--split" data-motion="hero-device" style="--motion-order: 1">
              <div class="hero-energy" aria-hidden="true">
                <span class="core-glow"></span>
                <span class="ring ring-a"></span>
                <span class="ring ring-b"></span>
                <span class="ring ring-c"></span>
              </div>
              <div class="hero-device-float">
                <img class="hero-platform" :src="heroPlatform" alt="" />
                <img class="hero-sphere" :src="heroSphere" alt="AI 智能审核核心" />
              </div>
            </div>
          </div>

          <header class="hero-copy" data-motion="hero-copy" style="--motion-order: 3">
            <div class="greeting-row">
              <span class="greeting">{{ greeting }}</span>
              <span class="guard-badge"><ShieldCheck aria-hidden="true" />AI 智审持续运行</span>
            </div>
            <p class="hero-description">AI智审模式全时运行，保障合规填报，护航储备</p>
            <h1><span>AI</span>守底线，<strong>人工把方向</strong></h1>
            <nav class="feature-strip" aria-label="平台能力">
              <span><BadgeDollarSign aria-hidden="true" />财力保障</span>
              <span><HeartHandshake aria-hidden="true" />价值创造</span>
              <span><GitBranch aria-hidden="true" />辅助决策</span>
              <span><ShieldCheck aria-hidden="true" />风险防范</span>
            </nav>
          </header>

          <div class="dashboard-meta" aria-live="polite">
            <span :class="{ 'is-refreshing': refreshing }">{{ refreshStatusText }}</span>
            <button type="button" :disabled="refreshing" aria-label="刷新首页数据" @click="refreshNow">
              <RefreshCw aria-hidden="true" />
              {{ refreshing ? '更新中' : '刷新数据' }}
            </button>
          </div>

          <section class="stats" aria-label="核心审核指标" :class="{ 'is-empty': !metrics.length }">
            <template v-if="metrics.length">
              <article
                v-for="(metric, index) in metrics"
                :key="metric.key"
                class="stat-card"
                data-motion="stat-card"
                :style="{ '--motion-order': 3 + index }"
              >
                <img :src="metric.icon" alt="" />
                <div>
                  <h2 :title="metric.label">{{ metric.label }}</h2>
                  <div class="metric">
                    <AnimatedNumber :value="metric.value" :delay="160 + index * 45" />
                    <small>{{ metric.unit }}</small>
                  </div>
                  <p>
                    <span>今日新增</span>
                    <em> {{ metric.trending ? '+' : '' }}<AnimatedNumber :value="metric.increment" :delay="230 + index * 45" :duration="620" /> </em>
                    <small>{{ metric.incrementUnit }}</small>
                  </p>
                </div>
              </article>
            </template>
            <div v-else class="srh2-empty" role="status">暂无指标数据</div>
          </section>

          <section class="panel rules-panel" :class="{ 'is-expanded': showAllRules }" data-motion="panel" style="--motion-order: 8">
            <div class="panel-heading">
              <img :src="iconRules" alt="" />
              <h2 title="规则库">规则库</h2>
              <button
                v-if="rules.length > 4"
                type="button"
                class="panel-action"
                aria-controls="rule-library-list"
                :aria-expanded="showAllRules"
                @click="onViewRules"
              >
                {{ showAllRules ? '收起' : '查看全部' }}
                <ChevronUp v-if="showAllRules" aria-hidden="true" />
                <ChevronDown v-else aria-hidden="true" />
              </button>
            </div>
            <div v-if="rules.length" id="rule-library-list" class="rule-grid" :class="{ 'is-expanded': showAllRules }">
              <div v-for="rule in displayedRules" :key="rule.code || rule.label" class="rule-item">
                <span class="rule-item__icon" aria-hidden="true">
                  <component :is="resolveRuleIcon(rule.code)" />
                </span>
                <span class="rule-item__name" :title="rule.label">{{ truncateLabel(rule.label) }}</span>
                <strong><AnimatedNumber :value="rule.value" :delay="260" :duration="680" /><small>个</small></strong>
              </div>
            </div>
            <div v-else class="srh2-empty" role="status">暂无规则数据</div>
          </section>

          <section class="panel documents-panel" data-motion="panel" style="--motion-order: 9">
            <div class="panel-heading">
              <img :src="iconDocuments" alt="" />
              <h2 title="文档解析">文档解析</h2>
            </div>
            <template v-if="documentStats.length">
              <div class="document-visual" aria-hidden="true">
                <span class="document-visual__halo"></span>
                <img class="document-illustration" :src="documentIllustration" alt="" />
                <span class="document-visual__scan"></span>
                <span class="document-visual__signal document-visual__signal--a"></span>
                <span class="document-visual__signal document-visual__signal--b"></span>
              </div>
              <div class="document-counts">
                <div class="total">
                  <el-tooltip content="累计解析文档" placement="top" effect="light" popper-class="srh2-overflow-tooltip" :open-delay="300">
                    <span class="document-counts__label">累计解析文档</span>
                  </el-tooltip>
                  <strong><AnimatedNumber :value="documentTotal" :delay="300" /><small>个</small></strong>
                </div>
                <div v-for="item in documentStats" :key="item.label">
                  <el-tooltip :content="item.label" placement="top" effect="light" popper-class="srh2-overflow-tooltip" :open-delay="300">
                    <span class="document-counts__label">{{ item.label }}</span>
                  </el-tooltip>
                  <strong><AnimatedNumber :value="item.value" :delay="340" :duration="680" /><small>个</small></strong>
                </div>
              </div>
            </template>
            <div v-else class="srh2-empty" role="status">暂无文档数据</div>
          </section>

          <section class="panel insights-panel" data-motion="panel" style="--motion-order: 10">
            <div class="panel-heading">
              <img :src="iconRisk" alt="" />
              <h2 title="审核风险项分布">审核风险项分布</h2>
              <div class="risk-mode-switch" role="group" aria-label="风险分布维度">
                <button type="button" :class="{ 'is-active': riskMode === 'level' }" :aria-pressed="riskMode === 'level'" @click="riskMode = 'level'">
                  规则级别
                </button>
                <button type="button" :class="{ 'is-active': riskMode === 'type' }" :aria-pressed="riskMode === 'type'" @click="riskMode = 'type'">
                  规则分类
                </button>
              </div>
            </div>
            <div v-if="activeRiskItems.length" class="chart-block chart-active">
              <div ref="riskChartRef" class="donut-echart" role="img" :aria-label="activeRiskAria"></div>
              <ul>
                <li v-for="item in activeRiskItems" :key="item.code || item.label">
                  <i :style="{ background: item.color }"></i>
                  <span>
                    {{ item.label }}<br />
                    <strong>
                      <AnimatedNumber :value="item.value" :delay="360" :duration="680" />个　<AnimatedNumber
                        :value="item.percent"
                        :delay="410"
                        :duration="620"
                      />%
                    </strong>
                  </span>
                </li>
              </ul>
            </div>
            <div v-else class="srh2-empty" role="status">暂无{{ riskMode === 'level' ? '规则级别' : '规则分类' }}数据</div>
          </section>

          <section class="panel ranking-panel" data-motion="panel" style="--motion-order: 11">
            <div class="panel-heading">
              <img :src="iconRanking" alt="" />
              <h2 title="规则风险项排名">规则风险项排名</h2>
              <button v-if="rankings.length > RANKINGS_DEFAULT_COUNT" type="button" class="panel-action" @click="onViewRanking">
                {{ showAllRankings ? '收起' : '查看全部' }}
                <ChevronUp v-if="showAllRankings" aria-hidden="true" />
                <ChevronDown v-else aria-hidden="true" />
              </button>
            </div>
            <ol v-if="rankings.length" class="ranking-list" :class="{ 'is-expanded': showAllRankings }">
              <li v-for="(item, index) in displayedRankings" :key="`${item.label}-${index}`">
                <b>{{ index + 1 }}</b>
                <el-tooltip :content="item.label" placement="top" effect="light" popper-class="srh2-overflow-tooltip" :open-delay="300">
                  <span class="ranking-list__label">{{ truncateLabel(item.label) }}</span>
                </el-tooltip>
                <strong><AnimatedNumber :value="item.value || 0" :delay="380 + index * 35" :duration="680" /></strong>
              </li>
            </ol>
            <div v-else class="srh2-empty" role="status">暂无排名数据</div>
          </section>

          <section class="panel project-type-ranking-panel" data-motion="panel" style="--motion-order: 12">
            <div class="panel-heading">
              <img :src="iconRanking" alt="" />
              <h2 title="项目类型风险项排名">项目类型风险项排名</h2>
            </div>
            <ol v-if="projectTypeRankings.length" class="ranking-list project-type-ranking-list">
              <li v-for="(item, index) in displayedProjectTypeRankings" :key="`${item.label}-${index}`">
                <b>{{ index + 1 }}</b>
                <el-tooltip :content="item.label" placement="top" effect="light" popper-class="srh2-overflow-tooltip" :open-delay="300">
                  <span class="ranking-list__label">{{ truncateLabel(item.label) }}</span>
                </el-tooltip>
                <strong><AnimatedNumber :value="item.value || 0" :delay="380 + index * 35" :duration="680" /></strong>
              </li>
            </ol>
            <div v-else class="srh2-empty" role="status">暂无项目类型排名数据</div>
          </section>

          <section class="table-panel" data-motion="table" style="--motion-order: 13">
            <div class="panel-heading">
              <img :src="iconBusiness" alt="" />
              <h2>最近审核业务</h2>
            </div>
            <div class="srh-business-table">
              <vxe-grid ref="gridRef" v-bind="gridOptions">
                <template #status_default="{ row }">
                  <span v-if="row.status" class="cell-status" :class="resolveStatusClass(row.status)">
                    <component :is="resolveStatusIcon(row.status)" class="cell-status__icon" aria-hidden="true" />
                    {{ row.status }}
                  </span>
                  <template v-else>—</template>
                </template>
                <template #action_default="{ row }">
                  <button type="button" class="srh-view-btn" @click="showDetail(row)"> 查 看<ArrowRight aria-hidden="true" /> </button>
                </template>
              </vxe-grid>
            </div>
          </section>
        </section>
      </div>
    </div>
  </main>

  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="handleRoleConfirmed" />
  <DetailModal :modal="detailModal" :detail-row="detailRow" @close="closeDetailModal" />
</template>

<script lang="ts">
export default {
  name: '/ai/smartReviewHomeTwo/index'
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleDollarSign,
  CircleHelp,
  CircleX,
  ClipboardCheck,
  Clock3,
  FileCheck,
  GitBranch,
  HeartHandshake,
  LoaderCircle,
  RefreshCw,
  Scale,
  ScanSearch,
  ShieldCheck,
  Target
} from 'lucide-vue-next'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import DetailModal from '@/views/ai/smartTaskAudit/components/DetailModal.vue'
import AnimatedNumber from './components/AnimatedNumber.vue'
import globalBackground from '@/assets/images/smart-review/smart-review-home-two/images/image-global-background-theme-02.png'
import heroPlatform from '@/assets/images/smart-review/smart-review-home-two/illustrations/illustration-hero-platform-cli-01.png'
import heroSphere from '@/assets/images/smart-review/smart-review-home-two/illustrations/illustration-hero-ai-sphere-cli-01.png'
import documentIllustration from '@/assets/images/smart-review/smart-review-home-two/illustrations/illustration-document-stack-theme-02.png'
import iconRules from '@/assets/images/smart-review/smart-review-home-two/icons/icon-section-rules-02.svg'
import iconDocuments from '@/assets/images/smart-review/smart-review-home-two/icons/icon-section-documents-02.svg'
import iconRisk from '@/assets/images/smart-review/smart-review-home-two/icons/icon-section-risk-02.svg'
import iconRanking from '@/assets/images/smart-review/smart-review-home-two/icons/icon-section-ranking-02.svg'
import iconBusiness from '@/assets/images/smart-review/smart-review-home-two/icons/icon-section-business-02.svg'
import { useSmartReviewHome } from './hooks/useSmartReviewHome'
import type { AuditRow, RiskItem } from './hooks/useSmartReviewHome'
import { useArtboardMotion } from './hooks/useArtboardMotion'
import { resolveStatusClass, truncateText } from './utils'
import './styles.css'

const resolveStatusIcon = (status: string) => {
  switch (resolveStatusClass(status)) {
    case 'is-waiting':
      return Clock3
    case 'is-processing':
      return LoaderCircle
    case 'is-done':
      return CircleCheck
    case 'is-failed':
      return CircleX
    default:
      return CircleHelp
  }
}

const {
  isShowPage,
  userRoleSelectorRef,
  greeting,
  getRoleHandle,
  refreshing,
  lastUpdatedAt,
  refreshNow,
  metrics,
  rules,
  documentTotal,
  documentStats,
  riskLevels,
  riskTypes,
  rankings,
  projectTypeRankings,
  auditRows
} = useSmartReviewHome()

const artboardRef = ref<HTMLElement | null>(null)
const gridRef = ref<VxeGridInstance>()
const riskChartRef = ref<HTMLElement | null>(null)

let riskChart: echarts.ECharts | null = null
let chartResizeObserver: ResizeObserver | null = null

const { bootMotion } = useArtboardMotion({ artboardRef })

const artboardStyle = computed(() => ({
  '--srh2-bg-image': `url(${globalBackground})`
}))

const LABEL_MAX_LENGTH = 10
const truncateLabel = (label: string) => truncateText(label, LABEL_MAX_LENGTH)

const RULE_ICON_MAP: Record<string, typeof BookOpenCheck> = {
  PRICE_COMPARE: Scale,
  PROJECT_INFO: ClipboardCheck,
  COMPLIANCE: ShieldCheck,
  DOCUMENT: FileCheck,
  INVESTMENT: CircleDollarSign,
  SCALE_MATCH: ScanSearch,
  NECESSITY: Target,
  ECONOMY: CircleDollarSign,
  COMPLIANCE_V2: ShieldCheck,
  BUDGET_MATCH: Scale,
  ATTACHMENT_V2: FileCheck,
  DUP_PROJECT: ScanSearch,
  QUOTE_DEVIATION: BookOpenCheck
}

const resolveRuleIcon = (code?: string) => RULE_ICON_MAP[code || ''] || BookOpenCheck

const riskMode = ref<'level' | 'type'>('level')
const activeRiskItems = computed(() => (riskMode.value === 'level' ? riskLevels.value : riskTypes.value))
const activeRiskAria = computed(() => activeRiskItems.value.map((item) => `${item.label} ${item.percent}`).join('，'))
const refreshStatusText = computed(() => {
  if (refreshing.value) return '数据正在更新'
  if (!lastUpdatedAt.value) return '数据加载完成后自动更新'
  return `更新于 ${new Date(lastUpdatedAt.value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })}`
})

/** 与 smartReviewHome 一致的环形图配置 */
const buildDonutOption = (items: RiskItem[]): EChartsOption => ({
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicOut',
  animationDelay: (idx: number) => idx * 90,
  tooltip: {
    trigger: 'item',
    // 挂到 body，避免被面板 overflow / 画板 scale 裁切或遮挡
    appendToBody: true,
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
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 2,
        shadowBlur: 8,
        shadowColor: 'rgba(13, 163, 115, 0.12)'
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
  if (!chart) {
    chart = echarts.init(element, undefined, { renderer: 'canvas' })
  }
  chart.setOption(buildDonutOption(items), true)
  chart.resize()
  return chart
}

const resizeCharts = () => {
  riskChart?.resize()
}

const observeCharts = () => {
  if (!chartResizeObserver) chartResizeObserver = new ResizeObserver(() => resizeCharts())
  if (riskChartRef.value) chartResizeObserver.observe(riskChartRef.value)
}

const renderCharts = async () => {
  await nextTick()
  if (!riskChartRef.value) {
    riskChart?.dispose()
    riskChart = null
    return
  }
  riskChart = ensureChart(riskChart, riskChartRef.value, activeRiskItems.value)
  observeCharts()
}

/** 规则库默认展示 4 条，展开后展示全部 */
const RULES_DEFAULT_COUNT = 4
const showAllRules = ref(false)
const sortedRules = computed(() =>
  rules.value
    .map((rule, index) => ({ rule, index }))
    .sort((left, right) => right.rule.value - left.rule.value || left.index - right.index)
    .map(({ rule }) => rule)
)
const displayedRules = computed(() => (showAllRules.value ? sortedRules.value : sortedRules.value.slice(0, RULES_DEFAULT_COUNT)))

/** 风险项排名默认展示 5 条，展开后展示 10 条 */
const RANKINGS_DEFAULT_COUNT = 5
const RANKINGS_EXPANDED_COUNT = 10
const showAllRankings = ref(false)
const displayedRankings = computed(() => rankings.value.slice(0, showAllRankings.value ? RANKINGS_EXPANDED_COUNT : RANKINGS_DEFAULT_COUNT))
const PROJECT_TYPE_RANKING_COUNT = 5
const displayedProjectTypeRankings = computed(() => projectTypeRankings.value.slice(0, PROJECT_TYPE_RANKING_COUNT))

/** 最近审核业务：与 smartReviewHome 共用同一套 VXE 列表配置 */
const gridOptions = reactive<VxeGridProps<AuditRow>>({
  border: true,
  stripe: true,
  height: '100%',
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  columnConfig: {
    resizable: true
  },
  rowConfig: {
    height: 32,
    isHover: true
  },
  columns: [
    { field: 'code', title: '项目编码', minWidth: 150 },
    { field: 'name', title: '项目名称', minWidth: 220 },
    { field: 'year', title: '计划实施年度', minWidth: 120 },
    {
      field: 'status',
      title: 'AI审核状态',
      minWidth: 120,
      slots: { default: 'status_default' }
    },
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

const onViewRules = () => {
  showAllRules.value = !showAllRules.value
}

const onViewRanking = () => {
  showAllRankings.value = !showAllRankings.value
}

const handleRoleConfirmed = async () => {
  await getRoleHandle()
  await nextTick()
  await bootMotion()
  await renderCharts()
}

watch(
  [riskLevels, riskTypes, riskMode, isShowPage],
  () => {
    renderCharts()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect()
  chartResizeObserver = null
  riskChart?.dispose()
  riskChart = null
})

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>
