<template>
  <section class="aep-cards">
    <!-- 卡片 1：文件智能解析 -->
    <div class="aep-card aep-card--teal" title="点击查看文件列表明细" @click="emit('drilldown', 'parse')">
      <!-- <div class="aep-card__hint">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        查看明细
      </div> -->
      <div class="aep-card__head">
        <div class="aep-icon-chip">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h3 class="aep-card__title">文件智能解析</h3>
          <p class="aep-card__desc">{{ METRIC_TIPS.parse }}</p>
        </div>
      </div>
      <div class="aep-card__body">
        <div class="aep-donut" :style="{ background: donutBackground }">
          <div class="aep-donut__center">
            <div class="aep-donut__value aep-num">{{ fileTotal }}</div>
            <div class="aep-donut__label">个文件</div>
          </div>
        </div>
        <div class="aep-legend aep-legend--dept">
          <div
            v-for="item in deptStats"
            :key="item.dept"
            class="aep-legend-row"
            :title="`点击查看${item.dept}文件`"
            @click.stop="emit('legend', { tab: 'file', field: 'fwbm', value: item.dept, label: `发布部门：${item.dept}` })"
          >
            <span class="aep-legend-text"> <span class="aep-dot" :style="{ background: item.color }"></span>{{ item.dept }} </span>
            <span class="aep-legend-value aep-num">{{ item.count }}<span>个</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片 2：审核要点分布（按来源 / 按状态，默认按来源） -->
    <div class="aep-card aep-card--green" title="点击查看知识管理列表明细" @click="emit('drilldown', 'extract')">
      <div class="aep-card__head">
        <div class="aep-icon-chip">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h3 class="aep-card__title">审核要点分布</h3>
          <p class="aep-card__desc">{{ METRIC_TIPS.extract }}</p>
        </div>
        <!-- 分布维度：右上角下拉，默认按来源（点击不触发整卡下钻） -->
        <select v-model="extractDimension" class="aep-card__dimension" @click.stop>
          <option value="source">按来源</option>
          <option value="status">按状态</option>
        </select>
      </div>
      <div class="aep-card__body">
        <div class="aep-donut" :style="{ background: extractDonutBackground }">
          <div class="aep-donut__center">
            <div class="aep-donut__value aep-num">{{ ruleTotal }}</div>
            <div class="aep-donut__label">个审核要点</div>
          </div>
        </div>
        <div class="aep-legend">
          <div v-for="item in extractRows" :key="item.label" class="aep-legend-item">
            <div
              class="aep-legend-row"
              :title="`点击查看${item.label}审核要点`"
              @click.stop="emit('legend', { tab: 'knowledge', field: item.field, value: item.value, extra: item.extra, label: item.label })"
            >
              <span class="aep-legend-text"> <span class="aep-dot" :style="{ background: item.color }"></span>{{ item.label }} </span>
              <span class="aep-legend-value aep-num">{{ item.count }}<span>个</span></span>
            </div>
            <div class="aep-track">
              <div class="aep-track__bar" :style="{ width: `${item.percent}%`, background: item.barColor }"></div>
            </div>
          </div>
          <!-- 按状态时给出确认率；按来源时中心已给总数，不再重复 -->
          <div v-if="extractDimension === 'status'" class="aep-legend-foot"
            >已确认率 <b class="aep-num">{{ extractStat.percent }}%</b></div
          >
        </div>
      </div>
    </div>

    <!-- 卡片 3：审核要点转化 -->
    <div class="aep-card aep-card--blue" title="点击查看已确认审核要点" @click="emit('drilldown', 'translate')">
      <!-- <div class="aep-card__hint">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        查看明细
      </div> -->
      <div class="aep-card__head">
        <div class="aep-icon-chip">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 class="aep-card__title">审核要点转化</h3>
          <p class="aep-card__desc">{{ METRIC_TIPS.translate }}</p>
        </div>
      </div>
      <div class="aep-card__body">
        <GaugeRing type="gauge" :rate="translateStat.percent" :center-text="`${translateStat.percent}%`" center-sub="转化率" tone="blue" />
        <div class="aep-legend">
          <div v-for="item in translateRows" :key="item.label" class="aep-legend-item">
            <div
              class="aep-legend-row"
              :title="`点击查看${item.label}`"
              @click.stop="emit('legend', { tab: 'knowledge', field: item.field, value: item.value, extra: item.extra, label: item.label })"
            >
              <span class="aep-legend-text"> <span class="aep-dot" :style="{ background: item.color }"></span>{{ item.label }} </span>
              <span class="aep-legend-value aep-num">{{ item.count }}<span>个</span></span>
            </div>
            <div class="aep-track">
              <div class="aep-track__bar" :style="{ width: `${item.percent}%`, background: item.barColor }"></div>
            </div>
          </div>
          <div class="aep-legend-foot"
            >转化率 <b class="aep-num">{{ translateStat.percent }}%</b></div
          >
        </div>
      </div>
    </div>

    <!-- 卡片 4：审核要点实现 -->
    <div class="aep-card aep-card--orange" title="点击查看已转化AI审核要点" @click="emit('drilldown', 'implement')">
      <!-- <div class="aep-card__hint">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        查看明细
      </div> -->
      <div class="aep-card__head">
        <div class="aep-icon-chip">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h3 class="aep-card__title">审核要点实现</h3>
          <p class="aep-card__desc">{{ METRIC_TIPS.implement }}</p>
        </div>
      </div>
      <div class="aep-card__body">
        <GaugeRing type="full" :rate="implementStat.percent" :center-text="`${implementStat.percent}%`" center-sub="实现率" tone="orange" />
        <div class="aep-legend">
          <div v-for="item in implementRows" :key="item.label" class="aep-legend-item">
            <div
              class="aep-legend-row"
              :title="`点击查看${item.label}审核要点`"
              @click.stop="emit('legend', { tab: 'knowledge', field: item.field, value: item.value, extra: item.extra, label: item.label })"
            >
              <span class="aep-legend-text"> <span class="aep-dot" :style="{ background: item.color }"></span>{{ item.label }} </span>
              <span class="aep-legend-value aep-num">{{ item.count }}<span>个</span></span>
            </div>
            <div class="aep-track">
              <div class="aep-track__bar" :style="{ width: `${item.percent}%`, background: item.barColor }"></div>
            </div>
          </div>
          <div class="aep-legend-foot"
            >实现率 <b class="aep-num">{{ implementStat.percent }}%</b></div
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: 'AepMetricCards'
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { StatisticsData } from '@/api/ai/automaticExtractionPoints'
import { CardDrillType, DeptStat, LegendDrillPayload, TrackStat } from '../types'
import { usePointSourceDict } from '../hooks/usePointSourceDict'
import GaugeRing from './GaugeRing.vue'

const props = defineProps<{
  /** 统计接口返回数据（未取到时为 null，卡片显示 0） */
  statistics: StatisticsData | null
}>()

const emit = defineEmits<{
  (e: 'drilldown', type: CardDrillType): void
  (e: 'legend', payload: LegendDrillPayload): void
}>()

/** 卡片副标题 */
const METRIC_TIPS = {
  parse: '已上传文件按部门分布',
  extract: '已提取审核要点确认情况',
  translate: '已确认审核要点转化情况',
  implement: '已转化AI审核要点系统实现情况'
}

/** 部门分布配色（最新设计稿：同色系青绿三档 + 深浅衍生，环形图与图例圆点共用） */
const DONUT_COLORS = ['#35a98c', '#74cdb4', '#bce9dd', '#22876f', '#8fd9c6', '#d8f2ea']

const toNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

/** 接口给的百分比字符串（如 '56%'）转数值 */
const parseRate = (rate?: string): number => {
  const num = Number(String(rate ?? '').replace('%', ''))
  return Number.isFinite(num) ? Math.max(0, Math.min(100, Math.round(num))) : 0
}

const fileParse = computed(() => props.statistics?.fileParse)
const pointDistribute = computed(() => props.statistics?.pointDistribute)
const pointTranslate = computed(() => props.statistics?.pointTranslate)
const pointImplement = computed(() => props.statistics?.pointImplement)

/** 审核要点来源字典（图例 label 展示名称、下钻传码值） */
const { pointSourceName, pointSourceCodeOf } = usePointSourceDict()

const fileTotal = computed(() => toNumber(fileParse.value?.total))
const ruleTotal = computed(() => toNumber(pointDistribute.value?.total))

/** 部门分布（文件智能解析卡片） */
const deptStats = computed<DeptStat[]>(() =>
  (fileParse.value?.deptDistribution || []).map((item, index) => ({
    dept: item.name,
    count: toNumber(item.cnt),
    percent: parseRate(item.rate),
    color: DONUT_COLORS[index % DONUT_COLORS.length]
  }))
)

/** 环形图配色（按部门占比拼 conic-gradient） */
const buildDonut = (stats: Array<{ count: number; color: string }>, total: number): string => {
  const visible = stats.filter((item) => item.count > 0)
  if (!visible.length) return '#eef2f7'
  const sum = Math.max(1, total)
  let deg = 0
  const stops = visible.map((item) => {
    const from = deg
    deg += (item.count / sum) * 360
    return `${item.color} ${from.toFixed(2)}deg ${deg.toFixed(2)}deg`
  })
  return `conic-gradient(${stops.join(', ')})`
}

/** 卡片 1 环形图（部门占比） */
const donutBackground = computed(() => buildDonut(deptStats.value, fileTotal.value))

/** 按状态：确认数 / 确认率（取接口 byStatus） */
const extractStat = computed(() => ({
  confirmed: toNumber(pointDistribute.value?.byStatus?.confirmCnt),
  pending: toNumber(pointDistribute.value?.byStatus?.waitConfirmCnt),
  percent: parseRate(pointDistribute.value?.byStatus?.confirmRate)
}))

/** 审核要点分布维度：默认按来源，可切换按状态（接口给了 defaultGroupBy 时以接口为准） */
const extractDimension = ref<'source' | 'status'>('source')
/** 默认维度是否已按接口初始化（接口每次刷新不回退用户的手动切换） */
const dimensionInitialized = ref(false)

watch(
  () => pointDistribute.value?.defaultGroupBy,
  (groupBy) => {
    if (dimensionInitialized.value || (groupBy !== 'source' && groupBy !== 'status')) return
    dimensionInitialized.value = true
    extractDimension.value = groupBy
  },
  { immediate: true }
)

/** 按状态图例配色（已确认 = 湖水绿、待确认 = 浅青绿） */
const EXTRACT_STATUS_TONES = [
  { color: '#2a9d8f', barColor: 'linear-gradient(90deg, #2a9d8f, #6ecfc4)' },
  { color: '#a8e0d8', barColor: 'linear-gradient(90deg, #8bd6cb, #a8e0d8)' }
]

/** 按来源图例配色（制度文件 = 湖水绿、经验知识 = 湖蓝，与卡片 2/3 配色一致） */
const EXTRACT_SOURCE_COLORS = [
  { color: '#2a9d8f', barColor: 'linear-gradient(90deg, #2a9d8f, #6ecfc4)' },
  { color: '#2a8fb0', barColor: 'linear-gradient(90deg, #2a8fb0, #6cc2dd)' }
]

/** 按状态：名称直接取接口 byStatus.distribution；下钻值按名称判定（待确认 = 0，其余确认 = 1） */
const extractStatusRows = computed<TrackStat[]>(() => {
  const dist = pointDistribute.value?.byStatus?.distribution || []
  const rows = dist.length
    ? dist.map((item, index) => ({
        label: item.name,
        count: toNumber(item.cnt),
        percent: parseRate(item.rate),
        value: item.name.includes('待') ? '0' : '1',
        tone: EXTRACT_STATUS_TONES[index % EXTRACT_STATUS_TONES.length]
      }))
    : [
        { label: '已确认', count: extractStat.value.confirmed, percent: extractStat.value.percent, value: '1', tone: EXTRACT_STATUS_TONES[0] },
        { label: '待确认', count: extractStat.value.pending, percent: 100 - extractStat.value.percent, value: '0', tone: EXTRACT_STATUS_TONES[1] }
      ]
  return rows.map((row) => ({ ...row, color: row.tone.color, barColor: row.tone.barColor, field: 'isConfirm' as const }))
})

/**
 * 按来源：完全按接口 bySource.distribution 渲染（接口返回「制度文件 / 经验知识」名称两项），
 * label 经来源字典兜底转名称，下钻值转成码值（pointPage 的 pointSource 按码值过滤，传名称查不到数据）；
 * 接口没返回数据时不额外造行，图例为空、环形图为空态
 */
const extractSourceRows = computed<TrackStat[]>(() =>
  (pointDistribute.value?.bySource?.distribution || []).map((item, index) => {
    const tone = EXTRACT_SOURCE_COLORS[index % EXTRACT_SOURCE_COLORS.length]
    const total = ruleTotal.value
    const count = toNumber(item.cnt)
    return {
      label: pointSourceName(item.name),
      count,
      percent: item.rate ? parseRate(item.rate) : total > 0 ? Math.round((count / total) * 100) : 0,
      color: tone.color,
      barColor: tone.barColor,
      field: 'pointSource',
      value: pointSourceCodeOf(item.name)
    }
  })
)

/** 当前维度下的图例行 */
const extractRows = computed<TrackStat[]>(() => (extractDimension.value === 'source' ? extractSourceRows.value : extractStatusRows.value))

/** 卡片 2 环形图（当前维度占比） */
const extractDonutBackground = computed(() => buildDonut(extractRows.value, ruleTotal.value))

/**
 * 审核要点转化：已转化 / 未转化
 * 卡片口径是「已确认审核要点」的转化情况（base = 已确认），
 * 图例下钻叠加 isConfirm=1，条数才与卡片数字一致（不带基数会混入未确认的要点）
 */
const translateStat = computed(() => ({
  converted: toNumber(pointTranslate.value?.solidifyCnt),
  unconverted: toNumber(pointTranslate.value?.notSolidifyCnt),
  percent: parseRate(pointTranslate.value?.translateRate)
}))

const translateRows = computed<TrackStat[]>(() => [
  {
    label: '已转化AI审核要点',
    count: translateStat.value.converted,
    percent: translateStat.value.percent,
    color: '#2a8fb0',
    barColor: 'linear-gradient(90deg, #2a8fb0, #6cc2dd)',
    field: 'isSolidify',
    value: '1',
    extra: { isConfirm: '1' }
  },
  {
    label: '未转化AI审核要点',
    count: translateStat.value.unconverted,
    percent: 100 - translateStat.value.percent,
    color: '#cbd5e1',
    barColor: '#cbd5e1',
    field: 'isSolidify',
    value: '0',
    extra: { isConfirm: '1' }
  }
])

/**
 * 审核要点实现：已实现 / 未实现
 * 卡片口径是「已转化AI审核要点」的系统实现情况（base = 已转化），
 * 图例下钻叠加 isSolidify=1，条数才与卡片数字一致
 */
const implementStat = computed(() => ({
  implemented: toNumber(pointImplement.value?.implementCnt),
  unimplemented: toNumber(pointImplement.value?.notImplementCnt),
  percent: parseRate(pointImplement.value?.implementRate)
}))

const implementRows = computed<TrackStat[]>(() => [
  {
    label: '已实现',
    count: implementStat.value.implemented,
    percent: implementStat.value.percent,
    color: '#3f9e6a',
    barColor: 'linear-gradient(90deg, #3f9e6a, #7fd0a0)',
    field: 'isImplement',
    value: '1',
    extra: { isSolidify: '1' }
  },
  {
    label: '未实现',
    count: implementStat.value.unimplemented,
    percent: 100 - implementStat.value.percent,
    color: '#cbd5e1',
    barColor: '#cbd5e1',
    field: 'isImplement',
    value: '0',
    extra: { isSolidify: '1' }
  }
])
</script>
