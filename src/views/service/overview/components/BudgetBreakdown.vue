<template>
  <!-- 两张圆环卡片作为阶段详情网格的直接子项，与两块排名同排；各自加载、失败与筛选，互不影响。 -->
  <OverviewDonutCard
    title="预算类型占比"
    name-label="预算类型"
    :rows="budgetRows"
    :selected-id="selectedYslx"
    :total="total"
    total-caption="合计"
    :stat-mode="statMode"
    :amount-unit="amountUnit"
    :loading="loading"
    loading-text="预算类型数据加载中…"
    :error="error"
    empty-text="暂无预算类型数据"
    :chart-label="budgetChartLabel"
    legend-label="预算类型筛选"
    legend-layout="rows"
    :legend-value="true"
    :legend-height="legendHeight"
    @toggle="toggleYslx"
    @retry="$emit('retry')"
    @legend-height="legendHeights.budget = $event"
  />
  <OverviewDonutCard
    title="项目类型占比"
    name-label="项目类型"
    :rows="categoryRows"
    :selected-id="selectedCategory"
    :total="categoryTotal"
    :total-caption="`${categoryRows.length} 类合计`"
    :stat-mode="statMode"
    :amount-unit="amountUnit"
    :loading="categoryLoading"
    loading-text="项目类型数据加载中…"
    :error="categoryError"
    empty-text="暂无项目类型数据"
    :chart-label="categoryChartLabel"
    legend-label="项目类型筛选"
    legend-layout="grid"
    :legend-height="legendHeight"
    @toggle="toggleCategory"
    @retry="$emit('retry-category')"
    @legend-height="legendHeights.category = $event"
  />
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { getBudgetTypeName } from '../data/overview'
import { BUDGET_TYPE_COLORS, PROJECT_TYPE_COLORS } from '../data/colors'
import { formatOverviewRatio, formatOverviewValue, getOverviewUnit } from '../data/format'
import { calculateStatisticRatio, sumStatisticValues } from '../data/totals'
import OverviewDonutCard from './OverviewDonutCard.vue'
import type { OverviewGlData, OverviewXmlxData } from '@/api/overview'
import type { AmountUnit, BudgetFilter, DonutRow, StatMode } from '../types'

// 筛选值取自接口 yslx：1 省级统筹，2 市域统筹，空字符串表示不筛选。
const CITY_YSLX = '2'
const PROVINCE_YSLX = '1'

const props = defineProps<{
  glData: OverviewGlData | null
  xmlxList: OverviewXmlxData[]
  statMode: StatMode
  amountUnit: AmountUnit
  selectedCategory: string
  /** 当前预算类型筛选，点击预算类型圆环扇区或图例切换；空字符串表示排名不做预算类型筛选。 */
  selectedYslx: BudgetFilter
  loading: boolean
  error: string
  /** 项目类型圆环单独加载与失败，不遮挡预算类型圆环。 */
  categoryLoading: boolean
  categoryError: string
}>()
const emit = defineEmits<{
  (event: 'update:selected-category', value: string): void
  (event: 'update:selected-yslx', value: BudgetFilter): void
  (event: 'retry'): void
  (event: 'retry-category'): void
}>()

// 两个圆环各自筛选两块排名，再次点击已选中的项取消筛选；两个圆环之间互不筛选。
const toggleYslx = (id: string) => {
  emit('update:selected-yslx', props.selectedYslx === id ? '' : (id as BudgetFilter))
}
const toggleCategory = (id: string) => {
  emit('update:selected-category', props.selectedCategory === id ? '' : id)
}

const isAmount = computed(() => props.statMode === 'amount')
const unit = computed(() => getOverviewUnit(props.statMode, props.amountUnit))
const formatValue = (value?: string | number | null) => formatOverviewValue(value, props.statMode, props.amountUnit)

const total = computed(() => (isAmount.value ? props.glData?.sumJe : props.glData?.sumSl))
/** 预算类型扇区、图例与筛选共用一份行定义：id 即接口 yslx 取值，扇区按此顺序绘制。 */
const budgetRows = computed<DonutRow[]>(() => {
  const data = props.glData
  if (!data) return []
  return [
    {
      id: CITY_YSLX,
      name: getBudgetTypeName(CITY_YSLX),
      color: BUDGET_TYPE_COLORS[CITY_YSLX],
      value: isAmount.value ? data.sytcJe : data.sytcSl,
      ratio: formatOverviewRatio(isAmount.value ? data.sytcJeZb : data.sytcSlZb)
    },
    {
      id: PROVINCE_YSLX,
      name: getBudgetTypeName(PROVINCE_YSLX),
      color: BUDGET_TYPE_COLORS[PROVINCE_YSLX],
      value: isAmount.value ? data.sjtcJe : data.sjtcSl,
      ratio: formatOverviewRatio(isAmount.value ? data.sjtcJeZb : data.sjtcSlZb)
    }
  ]
})
const budgetChartLabel = computed(
  () =>
    `预算合计${formatValue(total.value)}${unit.value}，${budgetRows.value
      .map((row) => `${row.name}${formatValue(row.value)}${unit.value}`)
      .join('，')}`
)

/** 项目类型各行：id 为接口 xmlxId，占比按当前口径的项目类型合计现算（接口不返回占比）。 */
const categoryTotal = computed(() => sumStatisticValues(props.xmlxList.map((item) => (isAmount.value ? item.amount : item.num))))
const categoryRows = computed<DonutRow[]>(() =>
  props.xmlxList.map((item, index) => {
    const value = isAmount.value ? item.amount : item.num
    return {
      id: item.xmlxId,
      name: item.xmlxName,
      color: PROJECT_TYPE_COLORS[index % PROJECT_TYPE_COLORS.length],
      value,
      ratio: formatOverviewRatio(calculateStatisticRatio(value, categoryTotal.value))
    }
  })
)
const categoryChartLabel = computed(
  () => `项目类型占比：${categoryRows.value.map((row) => `${row.name}${formatValue(row.value)}${unit.value}，占比${row.ratio}`).join('；')}`
)

// 两张卡片的图例区取较高一侧，两个圆环保持在同一水平线上。
const legendHeights = reactive({ budget: 0, category: 0 })
const legendHeight = computed(() => Math.max(legendHeights.budget, legendHeights.category))
</script>
