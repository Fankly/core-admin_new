<template>
  <section class="chart-panel" :class="{ 'has-stage-detail': selectedStage }">
    <div class="chart-toolbar">
      <div
        v-if="dimension === 'unit'"
        class="overview-switch"
        role="group"
        aria-label="组织维度"
        :style="{ gridTemplateColumns: `repeat(${orgTypeOptions.length}, 1fr)` }"
      >
        <button
          v-for="option in orgTypeOptions"
          :key="option.value"
          type="button"
          :class="{ active: orgType === option.value }"
          :aria-pressed="orgType === option.value"
          :disabled="orgTypeLoading || !!orgTypeError"
          @click="orgType = option.value"
          >{{ option.label }}</button
        >
      </div>
      <div class="chart-actions">
        <div class="overview-switch" role="group" aria-label="展示方式"
          ><button type="button" :class="{ active: viewMode === 'chart' }" :aria-pressed="viewMode === 'chart'" @click="viewMode = 'chart'"
            ><ChartNoAxesColumnIncreasing :size="15" aria-hidden="true" /> 全览图</button
          >
          <button type="button" :class="{ active: viewMode === 'table' }" :aria-pressed="viewMode === 'table'" @click="viewMode = 'table'"
            ><Table2 :size="15" aria-hidden="true" /> 表</button
          ></div
        >
        <button
          type="button"
          class="icon-button"
          :aria-label="downloadLabel"
          :title="downloadLabel"
          :aria-busy="downloading"
          :disabled="
            downloading || (selectedStage ? !detailDownloadAvailable : !overviewChartRef || !displayData.length || displayLoading || !!displayError)
          "
          @click="downloadCurrentView"
          ><LoaderCircle v-if="downloading" :size="16" class="overview-spinner" aria-hidden="true" /><Download v-else :size="16" aria-hidden="true"
        /></button>
      </div>
    </div>
    <div class="chart-content" :class="{ 'is-chart': isChartView }" :aria-busy="displayLoading && !activeStage">
      <div v-if="!selectedStage" class="chart-controls">
        <div v-if="drillScope" class="control-group is-scope">
          <button
            type="button"
            class="control-back"
            :title="`返回${dimensionLabel}总览`"
            :aria-label="`返回${dimensionLabel}总览`"
            @click="backToOverview"
          >
            <ChevronLeft :size="15" aria-hidden="true" />
            <span>返回{{ dimensionLabel }}总览</span>
          </button>
          <span class="control-divider" aria-hidden="true"></span>
          <span class="control-scope" :title="`${drillScopeLabel} · ${drillRowLabel}`">
            <span class="control-scope-name">{{ drillScopeLabel }}</span>
            <span class="control-scope-tag">{{ drillRowLabel }}</span>
          </span>
        </div>
        <div class="control-group is-sort" :class="{ 'is-disabled': sortDisabled }">
          <button
            type="button"
            class="control-sort-toggle"
            :disabled="sortDisabled"
            :title="sortToggleTitle"
            :aria-label="sortToggleLabel"
            @click="toggleSortOrder"
          >
            <ArrowUpNarrowWide v-if="sortOrder === 'asc'" :size="14" aria-hidden="true" />
            <ArrowDownWideNarrow v-else :size="14" aria-hidden="true" />
            <span>{{ sortOrder === 'desc' ? '降序' : '升序' }}</span>
          </button>
          <span class="control-divider" aria-hidden="true"></span>
          <span class="control-sort-field" :style="{ width: sortFieldWidth }">
            <select v-model="sortBy" :disabled="sortDisabled" aria-label="图表及表格排序方式" :title="sortDescription" @change="sortTouched = true">
              <option v-for="option in sortOptions" :key="option.id" :value="option.id">{{ getSortOptionLabel(option) }}</option>
            </select>
            <ChevronDown :size="13" class="control-sort-arrow" aria-hidden="true" />
          </span>
        </div>
      </div>
      <div class="chart-stage">
        <Transition name="overview-state">
          <StageDetail
            v-if="activeStage"
            :key="activeStage.id"
            ref="stageDetailRef"
            :stage-id="activeStage.id"
            :title="activeStage.title"
            :year="filters.year"
            :month="filters.month"
            :yjdws="filters.yjdws"
            :zybms="filters.zybms"
            :stat-mode="filters.statMode"
            :amount-unit="filters.amountUnit"
            :view-mode="viewMode"
            :org-type="orgType"
            :dimension="dimension"
            :role-context="roleContext"
            @download-availability="detailDownloadAvailable = $event"
          />
          <OverviewLoading
            v-else-if="displayLoading || (!drillScope && dimension === 'unit' && (orgTypeLoading || orgScopeLoading))"
            key="loading"
            class="is-loading-state"
            :variant="viewMode"
            :label="`${drillScope ? drillRowLabel : dimensionLabel}统计数据加载中…`"
          />
          <div v-else-if="displayError || (!drillScope && dimension === 'unit' && orgTypeError)" key="error" class="chart-state" role="alert">
            <span>{{ displayError || orgTypeError }}</span>
            <button type="button" @click="retryCurrent">重新加载</button>
          </div>
          <div v-else-if="!displayData.length" key="empty" class="chart-state" role="status">
            {{
              dimension === 'unit' && !roleContext.dwId
                ? '请先选择角色单位'
                : !filters.year
                ? '请先选择计划实施年度'
                : drillScope
                ? `暂无${drillScopeLabel}的下级${dimensionLabel}数据`
                : `暂无${dimensionLabel}统计数据`
            }}
          </div>
          <OverviewChart
            v-else
            key="data"
            ref="overviewChartRef"
            :visible="!selectedStage"
            :year="filters.year"
            :data="displayData"
            :dimension="dimension"
            :stat-mode="filters.statMode"
            :amount-unit="filters.amountUnit"
            :view-mode="viewMode"
            :scope-name="drillScopeLabel"
            :row-label="drillScope ? drillRowLabel : undefined"
            :drillable="canDrill && !drillScope"
            :ratio-stage-ids="effectiveRatioStageIds"
            :sort-by="sortBy"
            :sort-order="sortOrder"
            @drill="openDrill"
          />
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronLeft,
  Download,
  LoaderCircle,
  Table2
} from '@lucide/vue'
import { ElMessage } from 'element-plus'
import { getPublicCodesList } from '@/api/common'
import { getDataByDw, getDataByDwCt, getDataByZybm, getDataByZybmCt, getOrgFlag } from '@/api/overview'
import type { GroupStatistics } from '@/api/overview'
import {
  ALL_ORG_TYPES,
  DEFAULT_CHART_SORT,
  DEFAULT_RATIO_STAGE_IDS,
  OVERVIEW_ORG_TYPE_PUBLIC_CODE,
  OVERVIEW_PUBLIC_CODES,
  OVERVIEW_RATIO_PUBLIC_CODE,
  OVERVIEW_STAGE_SORT_PUBLIC_CODE,
  createOverviewStages,
  isTotalChartSort,
  parseDefaultChartSort,
  parseRatioStageIds,
  parseStageSortOptions,
  pickPublicCodeItems,
  PROVINCE_BUDGET_ROLE_CODE,
  resolveAllowedOrgTypes,
  resolveChartSort,
  resolveRatioStageIds
} from '../data/overview'
import { buildOverviewBaseParams, buildOverviewFilterParams, getOrgTypeSearchType, withOrgSearchType } from '../data/query'
import type { StageSortOption } from '../data/overview'
import { resolveStageSortOptions } from '../data/sort'
import type { ChartSortOption } from '../data/sort'
import { estimateTextEm } from '../data/format'
import { useAsyncTask } from '../composables/useAsyncTask'
import OverviewChart from './OverviewChart.vue'
import OverviewLoading from './OverviewLoading.vue'
import StageDetail from './StageDetail.vue'
import type { ChartSort, Dimension, OrgType, OverviewFilters, OverviewStage, RoleContext, SortOrder, StageId, ViewMode } from '../types'

const props = defineProps<{
  activeStage?: OverviewStage
  selectedStage: StageId | ''
  filters: OverviewFilters
  dimension: Dimension
  roleContext: RoleContext
  /** 系统参数 XMZL_DEFAULT_SORT 的原始值；由页面一次批量取回后下发，未配置或格式非法时用默认排序。 */
  defaultSortValue?: unknown
}>()
const orgType = ref<OrgType>('province')
const defaultOrgTypeOptions: { value: OrgType; label: string }[] = [
  { value: 'province', label: '全省' },
  { value: 'city', label: '地市公司' },
  { value: 'direct', label: '直属单位及本部' }
]
// 公共代码配置的全部组织类型；实际展示项再按当前权限过滤。
const allOrgTypeOptions = ref(defaultOrgTypeOptions)
// 当前权限可展示的组织类型：orgFlag 为 PROVINCE 时全部，否则只保留地市公司或直属单位及本部。
const allowedOrgTypes = ref<OrgType[]>([...ALL_ORG_TYPES])
const orgTypeOptions = computed(() => {
  const permitted = allOrgTypeOptions.value.filter((option) => allowedOrgTypes.value.includes(option.value))
  // 公共代码配置与权限对不上时用内置选项兜底，避免切换组为空导致整页无数据。
  return permitted.length ? permitted : defaultOrgTypeOptions.filter((option) => allowedOrgTypes.value.includes(option.value))
})
const orgTypeLoading = ref(true)
const orgTypeError = ref('')
let orgTypeRequestId = 0
// 权限切换后，当前选中项不可见时自动落到第一个可选项，后续 searchType 随之固定。
watch(
  orgTypeOptions,
  (options) => {
    if (options.length && !options.some((option) => option.value === orgType.value)) orgType.value = options[0].value
  },
  { immediate: true }
)
// 权限查询期间不发起单位查询，避免先用「全省」拉一次再切换到受限范围。
const orgScopeLoading = ref(false)
let orgScopeRequestId = 0

// 公共代码 → 组织类型选项：码值 0 / 空值为全省、1 为地市公司、2 为直属单位；
// 码值未知、名称缺失或码值重复视为配置错误，由批量加载函数统一记录并展示原因。
const applyOrgTypeOptions = (data: unknown) => {
  if (!Array.isArray(data)) throw new Error('单位类型配置格式错误')
  // 公共代码提供地市公司（1）与直属单位（2）；空值或 0 表示全省，未配置时由前端补在首位。
  const orgTypeByCode: Record<string, OrgType> = { '': 'province', '0': 'province', '1': 'city', '2': 'direct' }
  const options: { value: OrgType; label: string }[] = data.map((item: { code: string | number; name: string }) => {
    const code = String(item?.code ?? '').trim()
    const value = orgTypeByCode[code]
    if (!value || typeof item?.name !== 'string' || !item.name.trim()) {
      throw new Error('单位类型配置需使用码值 0、1、2（全省可为空值），并填写名称')
    }
    return { value, label: value === 'province' ? '全省' : value === 'direct' ? '直属单位及本部' : item.name }
  })
  if (new Set(options.map((option) => option.value)).size !== options.length) throw new Error('单位类型配置的码值不能重复')
  // 「全省」固定排在首位，公共代码未配置时补上，其余选项沿用接口顺序。
  const province = options.find((option) => option.value === 'province') || { value: 'province' as OrgType, label: '全省' }
  // 仅未配置时使用默认选项；查询失败和错误配置显示原因，支持重试。
  allOrgTypeOptions.value = options.length ? [province, ...options.filter((option) => option.value !== 'province')] : defaultOrgTypeOptions
}

/**
 * 选择权限后按所选的 dwId 查询组织范围（getOrgFlag）：
 * orgFlag 为 PROVINCE 展示全部；否则 dwsxId 为 GSSX_GDGS 只展示地市公司，
 * GSSX_JGBB / GSSX_ZSDW 只展示直属单位及本部。
 * 查询失败或返回未知码值时回落到全部选项，真实数据范围仍由后端按角色控制。
 */
const loadOrgScope = async () => {
  const requestId = ++orgScopeRequestId
  const dwId = props.roleContext.dwId
  if (!dwId) {
    allowedOrgTypes.value = [...ALL_ORG_TYPES]
    orgScopeLoading.value = false
    return
  }
  orgScopeLoading.value = true
  try {
    const result = await getOrgFlag(dwId)
    if (requestId !== orgScopeRequestId) return
    allowedOrgTypes.value = result.success ? resolveAllowedOrgTypes(result.data) : [...ALL_ORG_TYPES]
  } catch {
    if (requestId === orgScopeRequestId) allowedOrgTypes.value = [...ALL_ORG_TYPES]
  } finally {
    if (requestId === orgScopeRequestId) orgScopeLoading.value = false
  }
}
// 角色切换（含首次选择权限）即查询组织范围；此监听先于下方单位数据监听注册，保证先进入加载态。
watch(() => props.roleContext.dwId, loadOrgScope, { immediate: true })

// 占比曲线默认显示项来自公共代码：读取失败或未配置时保持需求储备库（01），不影响图表其余内容。
const ratioStageIds = ref<StageId[]>([...DEFAULT_RATIO_STAGE_IDS])
const viewMode = ref<ViewMode>('chart')
// 图表视图下控制条悬浮在画布左上角；表格视图下排在表格上方，不占图表高度。
const isChartView = computed(() => !props.activeStage && viewMode.value === 'chart')
const detailDownloadAvailable = ref(false)
const downloading = ref(false)
const downloadLabel = computed(() =>
  downloading.value ? '正在下载' : viewMode.value === 'table' ? '下载表格（Excel）' : props.selectedStage ? '下载城市排名图' : '下载图表'
)
const stageDetailRef = ref<InstanceType<typeof StageDetail> | null>(null)
const overviewChartRef = ref<InstanceType<typeof OverviewChart> | null>(null)
const dimensionLabel = computed(() => (props.dimension === 'specialty' ? '专业' : '单位'))
// 一级汇总与柱形穿透各自一块数据：独立的 data / loading / error 与在途请求作废（见 useAsyncTask）。
const group = useAsyncTask<GroupStatistics[]>(() => [])
const drill = useAsyncTask<GroupStatistics[]>(() => [])
// 点击柱形后的一级单位/专业钻取状态：为空表示仍在一级汇总，非空时图表展示下级接口数据。
const drillScope = ref<{ code: string; name: string } | null>(null)
const displayData = computed(() => (drillScope.value ? drill.data.value : group.data.value))
const displayLoading = computed(() => (drillScope.value ? drill.loading.value : group.loading.value))
const displayError = computed(() => (drillScope.value ? drill.error.value : group.error.value))
const drillRowLabel = computed(() => (props.dimension === 'specialty' ? '下级专业' : '二级单位'))
/** 只有省财务预算专职（SCWYSZZ）可以点击柱形钻取，其他角色只看一级汇总。 */
const canDrill = computed(() => props.roleContext.roleCode === PROVINCE_BUDGET_ROLE_CODE)
// 穿透范围展示为所点单位/专业名称，说明当前图只统计该一级单位/专业。
const drillScopeLabel = computed(() => drillScope.value?.name || '')

// 四个阶段各提供数值、占比两种排序，方向默认降序；默认排序阶段由系统参数决定，未配置时为项目需求库占比。
// 系统参数由页面一次批量取回后下发，格式校验与兜底由 parseDefaultChartSort 完成。
const defaultSortBy = computed<ChartSort>(() => parseDefaultChartSort(props.defaultSortValue) ?? DEFAULT_CHART_SORT)
const sortBy = ref<ChartSort>(defaultSortBy.value)
const sortOrder = ref<SortOrder>('desc')
// 用户一旦手动改过排序，异步返回的默认排序配置不再覆盖其选择。
const sortTouched = ref(false)
watch(defaultSortBy, (value) => {
  if (!sortTouched.value) sortBy.value = value
})
const toggleSortOrder = () => {
  if (sortDisabled.value) return
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  sortTouched.value = true
}
// 公共代码配置的排序选项（需求储备库、联合会审……）；未配置或读取失败时回落到接口返回的阶段列表。
const configuredSortOptions = ref<StageSortOption[]>([])
// 当前数据中的全部阶段：占比曲线配置与排序选项共用，穿透后仍按接口返回的全部阶段提供。
const chartStages = ref<OverviewStage[]>([])
watch(
  [displayData, displayLoading, displayError],
  ([data, loading, error]) => {
    // 加载和失败时保留上次选项，避免清空数据后已选阶段短暂显示为空白。
    if (loading || error) return
    chartStages.value = createOverviewStages(data.flatMap((group) => group.datas))
  },
  { immediate: true }
)
// 占比曲线配置按 code 与接口 jdbm 精确比对：公共代码未配置、编码写错或与接口编码不一致时，
// 回落到需求储备库（按 jdmc 名称识别）的实际编码，不再因为对不上而把所有占比曲线隐藏。
const effectiveRatioStageIds = computed(() => resolveRatioStageIds(ratioStageIds.value, chartStages.value))
const sortOptions = computed(() => resolveStageSortOptions(configuredSortOptions.value, chartStages.value))
// 默认排序键按语义生成（ratio-需求储备库），这里换成当前数据里需求储备库的实际编码。
const resolvedDefaultSort = computed(() => resolveChartSort(DEFAULT_CHART_SORT, chartStages.value))
const sortDisabled = computed(
  () =>
    displayLoading.value ||
    !!displayError.value ||
    (props.dimension === 'unit' && (orgTypeLoading.value || !!orgTypeError.value || orgScopeLoading.value)) ||
    !sortOptions.value.length
)
const sortMetricLabel = computed(() => (props.filters.statMode === 'amount' ? '金额' : '数量'))
const sortOrderLabel = computed(() => (sortOrder.value === 'desc' ? '降序' : '升序'))
const getSortOptionLabel = (option: ChartSortOption) => `${option.label}${option.metric === 'ratio' ? '占比' : ''}`
/**
 * 下拉宽度跟着最长选项走：按 13px 字号估算文字宽度，只多出左右内边距（9px + 26px 箭头区）与 2px 余量，
 * 不再固定 178px 留出大片空白；下限保证「合计」这类短文案不拥挤，上限仍为 178px，超长配置名照旧省略。
 */
const sortFieldWidth = computed(() => {
  const widest = sortOptions.value.reduce((max, option) => Math.max(max, estimateTextEm(getSortOptionLabel(option))), 0)
  return `${Math.min(178, Math.max(84, Math.round(widest * 13 + 37)))}px`
})
const describeSort = (option: ChartSortOption) => {
  const direction = sortOrder.value === 'desc' ? '高到低' : '低到高'
  // 「合计」不是阶段，不切换图表展示的阶段，只按行合计排序。
  if (isTotalChartSort(option.id)) return `按合计${sortMetricLabel.value}从${direction}排序`
  // 其余排序同时决定图表默认显示哪个阶段，提示里说明；隐藏的系列仍可在图例中打开。
  return option.metric === 'ratio'
    ? `按${option.label}占比从${direction}排序，并默认只显示该阶段占比曲线`
    : `按${option.label}${sortMetricLabel.value}从${direction}排序，并默认只显示该阶段柱状图`
}
const sortDescription = computed(() => {
  const option = sortOptions.value.find((option) => option.id === sortBy.value)
  if (option) return describeSort(option)
  const fallback =
    sortOptions.value.find((option) => option.id === defaultSortBy.value) ||
    sortOptions.value.find((option) => option.id === resolvedDefaultSort.value)
  return fallback ? describeSort(fallback) : `按需求储备库占比从${sortOrder.value === 'desc' ? '高到低' : '低到高'}排序`
})
// 左侧「排序」按钮点击切换方向：默认降序，再次点击变升序，图标与提示同步。
const sortToggleLabel = computed(() => `排序方向：当前${sortOrderLabel.value}，点击切换为${sortOrder.value === 'desc' ? '升序' : '降序'}`)
const sortToggleTitle = computed(() =>
  sortDisabled.value ? sortDescription.value : `${sortDescription.value}，点击切换为${sortOrder.value === 'desc' ? '升序' : '降序'}`
)
/**
 * 组织类型、占比曲线默认项与排序选项来自同一组公共代码：一次批量请求取回，避免同一接口按 code 请求多次。
 * 三者各自解析、互不影响：组织类型配置异常时记录原因并支持重试，其余两项回落到默认值。
 */
const loadPublicCodeConfig = async () => {
  const requestId = ++orgTypeRequestId
  orgTypeLoading.value = true
  orgTypeError.value = ''
  try {
    const result = await getPublicCodesList({ codes: OVERVIEW_PUBLIC_CODES })
    if (requestId !== orgTypeRequestId) return
    if (!result.success) throw new Error(result.msg || '单位类型配置加载失败')
    try {
      applyOrgTypeOptions(pickPublicCodeItems(result.data, OVERVIEW_ORG_TYPE_PUBLIC_CODE))
    } catch (error) {
      orgTypeError.value = (error as Error).message || '单位类型配置加载失败，请重试'
    }
    ratioStageIds.value = parseRatioStageIds(pickPublicCodeItems(result.data, OVERVIEW_RATIO_PUBLIC_CODE))
    configuredSortOptions.value = parseStageSortOptions(pickPublicCodeItems(result.data, OVERVIEW_STAGE_SORT_PUBLIC_CODE))
  } catch (error) {
    if (requestId !== orgTypeRequestId) return
    orgTypeError.value = (error as Error).message || '单位类型配置加载失败，请重试'
    ratioStageIds.value = [...DEFAULT_RATIO_STAGE_IDS]
    configuredSortOptions.value = []
  } finally {
    if (requestId === orgTypeRequestId) orgTypeLoading.value = false
  }
}
onMounted(loadPublicCodeConfig)
// 选中阶段不存在时优先恢复配置的默认排序，其次需求储备库占比，穿透数据则回落到当前阶段占比。
watch([sortOptions, displayLoading, displayError, sortBy], ([options, loading, error]) => {
  // 查询期间数据暂时清空，不因此丢失选择；新数据完成后再校验（含穿透层级）。
  if (!loading && !error && options.length && !options.some((option) => option.id === sortBy.value)) {
    // 默认排序键是语义键（ratio-需求储备库），系统参数则是接口实际编码，两者都按实际编码精确比对。
    const findSort = (target: ChartSort) => {
      const resolved = resolveChartSort(target, chartStages.value)
      return options.find((option) => option.id === resolved)?.id
    }
    sortBy.value =
      findSort(sortBy.value) ??
      findSort(defaultSortBy.value) ??
      findSort(DEFAULT_CHART_SORT) ??
      options.find((option) => option.metric === 'ratio')!.id
  }
})

const resetDrill = () => {
  drillScope.value = null
  drill.reset()
}

const loadGroupData = async () => {
  // 条件变化时同时清空旧数据与钻取状态、作废旧请求，避免跨年度、单位或维度显示过期响应。
  resetDrill()
  // 权限查询未结束时不发起单位查询；缺年度（按单位还缺角色单位）时回到空态。
  if (props.dimension === 'unit' && (orgTypeLoading.value || orgTypeError.value || orgScopeLoading.value)) return group.reset()
  if (!props.filters.year || (props.dimension === 'unit' && !props.roleContext.dwId)) return group.reset()
  const label = dimensionLabel.value
  // 角色、年度月度、项目单位 / 省专业归口与统计口径统一由 data/query 组装；
  // 组织类型 searchType 只在按单位时追加，与汇总、阶段详情与穿透接口保持同一口径。
  const query = {
    roleContext: props.roleContext,
    dimension: props.dimension,
    orgType: orgType.value,
    year: props.filters.year,
    month: props.filters.month,
    yjdws: props.filters.yjdws,
    zybms: props.filters.zybms
  }
  const params = withOrgSearchType(buildOverviewBaseParams(query), query)
  await group.run(async () => {
    const result = props.dimension === 'specialty' ? await getDataByZybm(params) : await getDataByDw(params)
    if (!result.success) throw new Error(result.msg || `${label}统计数据加载失败`)
    if (!Array.isArray(result.data)) throw new Error(`${label}统计数据格式错误`)
    return result.data
  }, `${label}统计数据加载失败，请重试`)
}

/** 点击一级单位/专业柱形后查询下级数据：按单位走 getDataByDwCt，按专业走 getDataByZybmCt。 */
const loadDrillData = async () => {
  const scope = drillScope.value
  if (!scope || !props.filters.year) return
  // 两个点击穿透接口只接收各自约定的字段，不展开整个 roleContext（不含 userId / roleCode）。
  const filterParams = buildOverviewFilterParams({
    roleContext: props.roleContext,
    dimension: props.dimension,
    year: props.filters.year,
    month: props.filters.month,
    yjdws: props.filters.yjdws,
    zybms: props.filters.zybms
  })
  const roleParams = { bmId: props.roleContext.bmId, dwId: props.roleContext.dwId, roleId: props.roleContext.roleId }
  await drill.run(async () => {
    const result =
      props.dimension === 'specialty'
        ? await getDataByZybmCt({ ...roleParams, ...filterParams, ctbm: scope.code })
        : await getDataByDwCt({
            ...roleParams,
            ...filterParams,
            ctdw: scope.code,
            // 组织类型与总览筛选一致；总览未筛选预算类型，yslx 固定传空字符串。
            searchType: getOrgTypeSearchType(orgType.value),
            yslx: ''
          })
    if (!result.success) throw new Error(result.msg || '下级数据加载失败')
    if (!Array.isArray(result.data)) throw new Error('下级数据格式错误')
    return result.data
  }, '下级数据加载失败，请重试')
}

const openDrill = (target: { code: string; name: string }) => {
  // 角色变化后仍可能收到残留点击，这里再校验一次，避免非省财务预算专职发起穿透请求。
  if (!canDrill.value || drillScope.value || !target.code) return
  drillScope.value = target
  void loadDrillData()
}

const backToOverview = () => {
  resetDrill()
}

const retryCurrent = () => {
  if (drillScope.value) void loadDrillData()
  else if (props.dimension === 'unit' && orgTypeError.value) void loadPublicCodeConfig()
  else void loadGroupData()
}

watch(
  [
    () => props.roleContext.userId,
    () => props.roleContext.dwId,
    // 角色编码决定能否钻取，切换角色时必须退出当前穿透层级。
    () => props.roleContext.roleCode,
    () => props.filters.year,
    () => props.filters.month,
    // 项目单位 / 省专业归口变化时重新统计，并退出当前穿透层级（下级数据按新的筛选口径重建）。
    () => props.filters.yjdws,
    () => props.filters.zybms,
    () => props.dimension,
    orgType,
    orgTypeLoading,
    orgTypeError,
    // 权限查询结束后按过滤后的组织类型重新查询，保证首个单位请求就带正确的 searchType。
    orgScopeLoading
  ],
  loadGroupData,
  { immediate: true }
)
onBeforeUnmount(() => {
  // 单位数据与穿透请求由 useAsyncTask 在作用域销毁时作废，这里只处理组织范围与公共代码两个请求号。
  orgTypeRequestId++
  orgScopeRequestId++
})

watch(
  () => props.selectedStage,
  () => {
    detailDownloadAvailable.value = false
  }
)
const refresh = () => overviewChartRef.value?.renderChart()
const downloadCurrentView = async () => {
  const target = props.selectedStage ? stageDetailRef.value : overviewChartRef.value
  if (!target || downloading.value) return
  downloading.value = true
  try {
    if (viewMode.value === 'table') await target.downloadTable()
    else target.downloadChart()
  } catch (error) {
    console.error('总览数据下载失败', error)
    ElMessage.error('下载失败，请重试')
  } finally {
    downloading.value = false
  }
}
defineExpose({ refresh })
</script>

<style scoped lang="less">
@import '../styles/switch.less';

button,
select {
  font-family: inherit;
}
.chart-actions {
  display: flex;
  align-items: center;
}
button:focus-visible,
select:focus-visible {
  outline: 2px solid #007d77;
  outline-offset: 3px;
}
.icon-button {
  display: grid;
  place-items: center;
  padding: 0;
  width: 32px;
  height: 32px;
  border: 1px solid #d8e2e7;
  border-radius: 6px;
  color: var(--overview-teal);
  background: #fff;
  cursor: pointer;
}
.chart-panel {
  border: 1px solid var(--overview-border);
  border-radius: var(--overview-radius);
  background: #fff;
  box-shadow: var(--overview-shadow);
}
.chart-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.chart-content {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.chart-stage {
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.chart-stage > :deep(*) {
  grid-area: 1 / 1;
}
.chart-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  flex: 0 0 auto;
  min-height: 48px;
  padding: 12px 14px;
  border-bottom: 1px solid #edf1f3;
  gap: 6px 12px;
  align-items: center;
}
.chart-toolbar > .overview-switch {
  grid-column: 1;
  grid-row: 1;
  justify-self: start;
  max-width: 100%;
}
// 图表左上角的控制条：穿透时「返回总览 + 当前范围」，常态只有排序，两者共用同一套胶囊。
.chart-controls {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 12px 18px 0;
}
// 图表视图下悬浮在画布左上角，不占图表高度；图例与坐标轴名在 charts.ts 中下移避让。
.chart-content.is-chart .chart-controls {
  position: absolute;
  top: 8px;
  left: 14px;
  right: 14px;
  z-index: 3;
  padding: 0;
  // 只让胶囊本身接收鼠标，间隙仍可悬停柱形。
  pointer-events: none;
}
.chart-content.is-chart .chart-controls > * {
  pointer-events: auto;
}
.control-group {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  min-width: 0;
  height: 32px;
  border: 1px solid #dae4e8;
  border-radius: 8px;
  color: #52656f;
  background: #fff;
  font-size: 13px;
  white-space: nowrap;
  transition: border-color var(--overview-motion-fast) ease, box-shadow var(--overview-motion-fast) ease,
    background-color var(--overview-motion-fast) ease;
}
.chart-content.is-chart .control-group {
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.09);
}
.control-group:hover,
.control-group:focus-within {
  border-color: #b9d3cd;
}
.control-group.is-disabled {
  border-color: #e4e9ec;
  color: #b5bac3;
  background: #f5f6f8;
}
// 穿透后当前范围用浅青底区分：一眼看出图里只是某个单位/专业的下级数据。
.control-group.is-scope {
  border-color: #d3e6e0;
  background: #f7fbfa;
  animation: overview-control-arrive var(--overview-motion-enter, 260ms) var(--overview-motion-ease, ease) both;
}
// 只位移不改透明度：即使动画被禁用，返回入口也始终可见可点。
@keyframes overview-control-arrive {
  from {
    transform: translateX(-6px);
  }
}
// 组内分隔线不顶到边框，胶囊内文字与图标两侧留白一致。
.control-divider {
  flex-shrink: 0;
  align-self: stretch;
  width: 1px;
  margin: 7px 0;
  background: #e7eef0;
}
.control-back,
.control-sort-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 3px;
  height: 30px;
  padding: 0 10px 0 7px;
  border: 0;
  border-radius: 7px 0 0 7px;
  color: var(--overview-teal);
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.control-sort-toggle {
  gap: 5px;
  padding: 0 10px 0 9px;
}
.control-back:hover,
.control-sort-toggle:not(:disabled):hover {
  background: #e6f5f2;
}
// 返回箭头在悬停时轻推，提示这是一次「退回上一级」的操作。
.control-back svg {
  transition: transform var(--overview-motion-fast, 140ms) ease;
}
.control-back:hover svg {
  transform: translateX(-2px);
}
.control-back:focus-visible,
.control-sort-toggle:focus-visible {
  outline: 2px solid #007d77;
  outline-offset: -2px;
}
.control-sort-toggle:disabled {
  color: #b5bac3;
  cursor: not-allowed;
}
// 穿透范围：所点单位/专业名称加粗，右侧标签说明当前展示的是下级数据。
.control-scope {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 0 10px 0 9px;
}
.control-scope-name {
  min-width: 0;
  max-width: 11em;
  overflow: hidden;
  color: #1e293b;
  font-weight: 600;
  text-overflow: ellipsis;
}
.control-scope-tag {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 4px;
  color: #0d7c75;
  background: #eaf6f4;
  font-size: 12px;
  line-height: 18px;
}
.control-sort-field {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;
  // 宽度由 sortFieldWidth 内联给出，工作区过窄时仍可收缩，不撑破排序胶囊。
  max-width: 100%;
}
.control-sort-field select {
  appearance: none;
  // 宽度由 sortFieldWidth 按最长选项计算（内联样式），这里不再写死。
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 30px;
  padding: 0 26px 0 9px;
  border: 0;
  border-radius: 0 7px 7px 0;
  color: #1e293b;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  text-overflow: ellipsis;
  cursor: pointer;
}
.control-sort-field select:not(:disabled):hover {
  background: #f3f8f7;
}
.control-sort-field select:disabled {
  color: #b5bac3;
  cursor: not-allowed;
}
.control-sort-arrow {
  position: absolute;
  right: 9px;
  color: #7c8b93;
  pointer-events: none;
}
.control-group.is-disabled .control-sort-arrow {
  color: #b5bac3;
}
.chart-actions {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  max-width: 100%;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px 4px;
}
.overview-switch > button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.icon-button {
  width: 28px;
  height: 28px;
}
.icon-button:disabled {
  color: #b5bac3;
  background: #f5f6f8;
  cursor: not-allowed;
}
.icon-button:not(:disabled):hover {
  border-color: var(--overview-teal);
  background: #e6f5f3;
}
.chart-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overflow-wrap: anywhere;
  flex-wrap: wrap;
  padding: 24px;
  color: #64748b;
  font-size: 14px;
}
.chart-state button {
  padding: 6px 12px;
  border: 1px solid var(--overview-teal);
  border-radius: 4px;
  color: var(--overview-teal);
  background: #fff;
  cursor: pointer;
}
</style>
