<template>
  <div>
    <main class="dashboard-main">
      <section>
        <div class="metrics-grid">
          <div v-for="m in metrics" :key="m.label" class="metric-card">
            <div class="metric-stripe" :style="{ background: m.color }" />
            <div class="metric-body">
              <div class="metric-header-row">
                <div class="metric-icon" :style="{ background: m.bg }">
                  <component :is="m.icon" :size="14" :style="{ color: m.color }" />
                </div>
                <span class="metric-label">{{ m.label }}</span>
              </div>
              <div class="metric-total-block">
                <div class="metric-total" style="font-family: 'JetBrains Mono', monospace">
                  {{ m.isPercent ? `${m.total}${m.unit}` : m.total.toLocaleString('zh-CN') }}
                </div>
                <div v-if="!m.isPercent" class="metric-unit-label">累计{{ m.unit }}</div>
              </div>
              <div class="metric-divider" />
              <div class="metric-today-row">
                <span class="metric-today-label">{{ m.todayLabel }}</span>
                <span class="metric-today-val" :style="{ color: m.color, fontFamily: '\'JetBrains Mono\', monospace' }">
                  {{ m.todayVal }}
                  <span v-if="!m.isPercent && !m.todayVal.includes('%')" class="metric-today-unit">{{ m.unit }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div class="charts-row">
          <div class="card chart-line">
            <h3 class="card-title">AI评审准确率走势</h3>
            <div ref="lineChartRef" class="echarts-container" style="height: 220px" />
          </div>
          <div class="card chart-pie">
            <h3 class="card-title" style="margin-bottom: 8px">地区分布</h3>
            <div ref="pie1Ref" class="echarts-container" style="height: 170px" />
          </div>
          <div class="card chart-pie">
            <h3 class="card-title" style="margin-bottom: 8px">问题类型分布</h3>
            <div ref="pie2Ref" class="echarts-container" style="height: 170px" />
          </div>
        </div>
      </section>
      <section class="section-table">
        <ProTable
          @search="resetTable"
          @reset="resetTable"
          @row-click="handleClickRow"
          :pagination="true"
          :data-callback="callBackHandle"
          :request-api="getPageList"
          :request-auto="true"
          :search-col="4"
          :columns="tableColumns"
          guide-module-key="ruleId"
          ref="proTableRef"
          stripe
        >
          <template #tableHeader> </template>
        </ProTable>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getPublicData } from '@/api/common'
import ProTable from '@/components/ProTablePage/index.vue'
import { rulManageGeGetRulePage } from '@/api/suzhou/aiAuditRuleManage'
import { Search, FileText } from 'lucide-vue-next'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Metric {
  label: string
  icon: string
  total: number
  todayLabel: string
  todayVal: string
  color: string
  bg: string
  unit: string
  isPercent?: boolean
}

// ─── Data ────────────────────────────────────────────────────────────────────

const metrics: Metric[] = [
  {
    label: '文档数量',
    icon: FileText,
    total: 48320,
    todayLabel: '今日上传',
    todayVal: '1,284',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.10)',
    unit: '份'
  },
  {
    label: '拦截数量',
    icon: 'ShieldOff',
    total: 3847,
    todayLabel: '今日拦截',
    todayVal: '128',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.10)',
    unit: '次'
  },
  {
    label: '审核项目数量',
    icon: 'ClipboardList',
    total: 12430,
    todayLabel: '今日完成',
    todayVal: '342',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.10)',
    unit: '个'
  },
  {
    label: '审核中项目',
    icon: 'Loader',
    total: 287,
    todayLabel: '新增进入',
    todayVal: '23',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    unit: '个'
  },
  {
    label: '项目申报金额',
    icon: 'Banknote',
    total: 584302,
    todayLabel: '今日申报',
    todayVal: '1,428',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.10)',
    unit: '万元'
  },
  {
    label: '项目核减金额',
    icon: 'TrendingDown',
    total: 82410,
    todayLabel: '今日核减',
    todayVal: '180',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.10)',
    unit: '万元'
  },
  {
    label: '发现问题数量',
    icon: 'AlertTriangle',
    total: 4821,
    todayLabel: '今日发现',
    todayVal: '87',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
    unit: '项'
  },
  {
    label: '审核准确率',
    icon: 'BadgeCheck',
    total: 98.7,
    todayLabel: '较昨日',
    todayVal: '+0.2%',
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.10)',
    unit: '%',
    isPercent: true
  }
]

const lineDataRaw = [
  { date: '5/15', proNum: 2840 },
  { date: '5/16', proNum: 3120 },
  { date: '5/17', proNum: 2910 },
  { date: '5/18', proNum: 3540 },
  { date: '5/19', proNum: 3820 },
  { date: '5/20', proNum: 3210 },
  { date: '5/21', proNum: 3421 }
]

const pie1Data = [
  { name: '华东', value: 38.4 },
  { name: '华南', value: 24.1 },
  { name: '华北', value: 18.7 },
  { name: '华西', value: 11.2 },
  { name: '其他', value: 7.6 }
]
const pie1Colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4']

const pie2Data = [
  { name: '财务违规', value: 32 },
  { name: '程序缺失', value: 24 },
  { name: '标准超出', value: 18 },
  { name: '资料不全', value: 15 },
  { name: '其他问题', value: 11 }
]
const pie2Colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#94a3b8']

// ========== 表格列配置 ==========
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'ruleCode', label: '规则编码', width: 150, search: { el: 'input', order: 1 } },
  { prop: 'ruleName', label: '规则名称', width: 280, search: { el: 'input', order: 2 } },
  { prop: 'ruleClassifyName', label: '规则分类', width: 120 },
  { prop: 'ruleLevelName', label: '规则级别', width: 120 },
  { prop: 'ruleDesc', label: '规则描述', search: { el: 'input', order: 3 } }
])

// ─── Charts ──────────────────────────────────────────────────────────────────
const lineChartRef = ref<HTMLDivElement>()
const pie1Ref = ref<HTMLDivElement>()
const pie2Ref = ref<HTMLDivElement>()
const proTableRef = ref<any>()

let lineChart: echarts.ECharts | null = null
let pie1Chart: echarts.ECharts | null = null
let pie2Chart: echarts.ECharts | null = null

function buildLineOption(): echarts.EChartsOption {
  return {
    grid: { top: 8, right: 12, bottom: 24, left: 40 },
    xAxis: {
      type: 'category',
      data: lineDataRaw.map((d) => d.date),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: 'rgba(0,0,0,0.08)',
      textStyle: { color: '#1a1d2e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08);'
    },
    series: {
      name: 'title',
      type: 'line' as const,
      smooth: true,
      symbol: 'none',
      data: lineDataRaw.map((d) => d.proNum),
      lineStyle: {
        color: '#6366f1',
        width: 2.5,
        opacity: 1
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'rgba(99, 102, 241, 0.9)'
            },
            {
              offset: 1,
              color: 'rgba(99, 102, 241, 0)'
            }
          ]
        }
      },
      itemStyle: { color: '#6366f1' }
    }
  }
}

function buildPieOption(data: { name: string; value: number }[], colors: string[]): echarts.EChartsOption {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%',
      backgroundColor: '#fff',
      borderColor: 'rgba(0,0,0,0.08)',
      textStyle: { color: '#1a1d2e', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08);'
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#8b93a7', fontSize: 10 }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['38%', '50%'],
        // padAngle: 2,
        data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
        label: { show: false }
      }
    ]
  }
}

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  return data
}

const getPageList = (params: any) => {
  return rulManageGeGetRulePage(params)
}

onMounted(async () => {
  await nextTick()

  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
    lineChart.setOption(buildLineOption())
  }
  if (pie1Ref.value) {
    pie1Chart = echarts.init(pie1Ref.value)
    pie1Chart.setOption(buildPieOption(pie1Data, pie1Colors))
  }
  if (pie2Ref.value) {
    pie2Chart = echarts.init(pie2Ref.value)
    pie2Chart.setOption(buildPieOption(pie2Data, pie2Colors))
  }

  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  pie1Chart?.dispose()
  pie2Chart?.dispose()
})

function handleResize() {
  lineChart?.resize()
  pie1Chart?.resize()
  pie2Chart?.resize()
}
</script>

<style scoped>
/* ── Layout ── */

.dashboard-main {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8b93a7;
  margin: 0 0 16px;
}

/* ── Metric Cards ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (min-width: 1280px) {
  .metrics-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

.metric-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 12px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s;
}
.metric-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.metric-stripe {
  height: 4px;
  width: 100%;
}
.metric-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.metric-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.metric-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.metric-label {
  font-size: 12px;
  font-weight: 500;
  color: #8b93a7;
  line-height: 1.3;
}
.metric-total {
  font-size: 24px;
  font-weight: 700;
  color: #1a1d2e;
  line-height: 1;
}
.metric-unit-label {
  font-size: 12px;
  color: #8b93a7;
  margin-top: 2px;
}
.metric-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.07);
}
.metric-today-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric-today-label {
  font-size: 12px;
  color: #8b93a7;
}
.metric-today-val {
  font-size: 14px;
  font-weight: 600;
}
.metric-today-unit {
  font-size: 11px;
  font-weight: 400;
  color: #8b93a7;
  margin-left: 2px;
}

/* ── Charts ── */
.charts-row {
  display: grid;
  grid-template-columns: 6fr 3fr 3fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 8px;
  padding: 16px;
}
.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1d2e;
  margin: 0;
}
.echarts-container {
  width: 100%;
}
.section-table {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
