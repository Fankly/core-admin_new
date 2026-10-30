<template>
  <div v-show="isShowPage" class="overview-viewport">
    <div class="overview-page">
      <OverviewFilters
        v-model:filters="filters"
        v-model:dimension="dimension"
        :year-options="yearOptions"
        :unit-options="unitOptions"
        :specialty-options="specialtyOptions"
        :updated-at="updatedAt"
      />
      <OverviewSummary
        :summary="summary"
        :stages="stages"
        :stat-mode="filters.statMode"
        :amount-unit="filters.amountUnit"
        :loading="yearLoading || summaryLoading"
        :error="yearError || summaryError"
        :stage-details-enabled="stageDetailsEnabled"
        :selected-stage="selectedStage"
        @select-stage="selectStage"
        @select-overview="selectOverview"
        @drill="openDrill"
        @retry="yearError ? loadYearOptions() : loadSummary()"
      />
      <OverviewChartPanel
        :active-stage="activeStage"
        :selected-stage="stageDetailsEnabled ? selectedStage : ''"
        :filters="filters"
        :dimension="dimension"
        :role-context="roleContext"
        :default-sort-value="defaultSortValue"
      />
    </div>
    <CtDataToSxDialog
      :target="drillTarget"
      :role-context="roleContext"
      :year="filters.year"
      :month="filters.month"
      :yjdws="filters.yjdws"
      :zybms="filters.zybms"
      :stat-mode="filters.statMode"
      :amount-unit="filters.amountUnit"
      :dimension="dimension"
      @close="drillTarget = null"
      @drill="drillDetail"
    />
    <CtDataDialog
      :target="detailTarget"
      :role-context="roleContext"
      :year="filters.year"
      :month="filters.month"
      :yjdws="filters.yjdws"
      :zybms="filters.zybms"
      :stat-mode="filters.statMode"
      :amount-unit="filters.amountUnit"
      :dimension="dimension"
      @close="detailTarget = null"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="handleRoleLoaded" />
</template>

<script setup lang="ts">
defineOptions({ name: "/service/overview/index" })
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from '@/store/business'
import XEUtils from 'xe-utils'
import userDialog from '@/components/select/userDialog.vue'
import { getGkbmInProvince, getParamValueMulti, getYearData, getYjdw } from '@/api/common'
import { getDataByJd } from '@/api/overview'
import type { OverviewSummaryData } from '@/api/overview'
import OverviewFilters from './components/OverviewFilters.vue'
import OverviewSummary from './components/OverviewSummary.vue'
import OverviewChartPanel from './components/OverviewChartPanel.vue'
import CtDataDialog from './components/CtDataDialog.vue'
import CtDataToSxDialog from './components/CtDataToSxDialog.vue'
import { createOverviewStages, OVERVIEW_AMOUNT_UNIT_PARAM_KEY, OVERVIEW_DEFAULT_SORT_PARAM_KEY, parseAmountUnit } from './data/overview'
import { buildOverviewBaseParams } from './data/query'
import { DEFAULT_AMOUNT_UNIT } from './data/format'
import type {
  Dimension,
  OverviewDrillTarget,
  OverviewFilters as Filters,
  OverviewSelectOption,
  OverviewYearOption,
  RoleContext,
  StageId
} from './types'

const filters = ref<Filters>({
  year: '',
  month: '',
  statMode: 'amount',
  amountUnit: DEFAULT_AMOUNT_UNIT,
  // 项目单位 / 省专业归口默认不筛选，接口按空数组处理。
  yjdws: [],
  zybms: []
})
const yearOptions = ref<OverviewYearOption[]>([])
const yearLoading = ref(false)
const yearError = ref('')
const dimension = ref<Dimension>('unit')
// 开启阶段卡片穿透，详情沿用现有示例数据及空态。
const stageDetailsEnabled = true
const selectedStage = ref<StageId | ''>('')
const stages = computed(() => createOverviewStages(summary.value?.childJd ?? []))
const activeStage = computed(() => (stageDetailsEnabled ? stages.value.find((stage) => stage.id === selectedStage.value) : undefined))
const userDialogRef = ref<InstanceType<typeof userDialog> | null>(null)
const store = useStore()
const isShowPage = ref(false)
// 角色上下文取自 userDialog 选中的角色：用户、单位、专业部门、角色 id 与编码，所有 /xmzl 请求都要携带。
const roleContext = ref<RoleContext>({ userId: '', dwId: '', bmId: '', roleId: '', roleCode: '' })
const summary = ref<OverviewSummaryData | null>(null)
const summaryLoading = ref(false)
const summaryError = ref('')
const updatedAt = ref('')
let summaryRequestId = 0

// 金额单位与默认排序都来自系统参数：一次 getParamValueMulti 取回，避免同一接口请求两次。
// 未配置、读取失败或值非法时保持万元与需求储备库占比；切换下拉只影响前端展示。
const defaultSortValue = ref<unknown>('')
const loadSystemParams = async () => {
  try {
    const result = await getParamValueMulti([OVERVIEW_AMOUNT_UNIT_PARAM_KEY, OVERVIEW_DEFAULT_SORT_PARAM_KEY])
    const values = result.success && result.data && typeof result.data === 'object' ? (result.data as Record<string, unknown>) : null
    const configured = parseAmountUnit(values?.[OVERVIEW_AMOUNT_UNIT_PARAM_KEY]) ?? DEFAULT_AMOUNT_UNIT
    // 配置返回前用户已手动切换单位时，不覆盖用户选择。
    if (filters.value.amountUnit === DEFAULT_AMOUNT_UNIT) filters.value.amountUnit = configured
    // 默认排序原样下发给图表选择面板：格式校验与阶段编码换算由 parseDefaultChartSort / resolveChartSort 完成。
    defaultSortValue.value = values?.[OVERVIEW_DEFAULT_SORT_PARAM_KEY] ?? ''
  } catch {
    // 读取失败保持当前单位与默认排序（初始为默认万元 / 需求储备库占比）。
  }
}

const loadYearOptions = async () => {
  yearLoading.value = true
  yearError.value = ''
  try {
    const result = await getYearData()
    if (!result.success) throw new Error(result.msg || '计划实施年度加载失败')
    if (!Array.isArray(result.data) || !result.data.length) throw new Error('暂无可用的计划实施年度')
    yearOptions.value = result.data
    const currentYear = new Date().getFullYear().toString()
    filters.value.year = (yearOptions.value.find((item) => item.yearCode === currentYear) || yearOptions.value[0]).yearCode
  } catch (error) {
    yearError.value = (error as Error).message || '计划实施年度加载失败，请重试'
  } finally {
    yearLoading.value = false
  }
}

const loadSummary = async () => {
  if (!roleContext.value.dwId || !filters.value.year) return
  const requestId = ++summaryRequestId
  summaryLoading.value = true
  summaryError.value = ''
  summary.value = null
  try {
    // searchBy 跟随右上角切换：1 按单位，2 按专业；角色与筛选参数统一由 data/query 组装。
    const result = await getDataByJd(
      buildOverviewBaseParams({
        roleContext: roleContext.value,
        dimension: dimension.value,
        year: filters.value.year,
        month: filters.value.month,
        yjdws: filters.value.yjdws,
        zybms: filters.value.zybms
      })
    )
    if (requestId !== summaryRequestId) return
    if (!result.success) throw new Error(result.msg || '总览统计数据加载失败')
    summary.value = result.data
    updatedAt.value = XEUtils.toDateString(new Date(), 'yyyy-MM-dd HH:mm:ss')
  } catch (error) {
    if (requestId !== summaryRequestId) return
    summaryError.value = (error as Error).message || '总览统计数据加载失败，请重试'
  } finally {
    if (requestId === summaryRequestId) summaryLoading.value = false
  }
}

const unitOptions = ref<OverviewSelectOption[]>([])
const specialtyOptions = ref<OverviewSelectOption[]>([])
let filterOptionsRequestId = 0

/** 公共代码 → 下拉选项：只接受非空的 code / name，重复编码保留首个。 */
const toSelectOptions = (data: unknown): OverviewSelectOption[] => {
  if (!Array.isArray(data)) return []
  const options = data
    .map((item) => {
      const record = (item ?? {}) as { code?: unknown; name?: unknown }
      return { value: String(record.code ?? '').trim(), label: String(record.name ?? '').trim() }
    })
    .filter((option) => !!option.value && !!option.label)
  return options.filter((option, index) => options.findIndex((item) => item.value === option.value) === index)
}

/**
 * 两个新增筛选条件的选项与预算变更 / 联合会审同源：
 * 项目单位取一级单位接口 bizOrgTree/getYjdw（参数与 budget/changes 一致），
 * 省专业归口取省归口部门查询条件接口 commonCode/getGkbmInProvince。
 * 两个接口并行请求、互不阻塞；任一个失败时保留上一次的选项（首次失败则该下拉只有「全部」并禁用），
 * 不影响页面其它统计，也不清空用户已选条件。
 */
const loadFilterOptions = async () => {
  const requestId = ++filterOptionsRequestId
  const { bmId, dwId, roleId, userId } = roleContext.value
  if (!dwId) {
    unitOptions.value = []
    specialtyOptions.value = []
    return
  }
  const [unitResult, specialtyResult] = await Promise.allSettled([getYjdw({ bmId, dwId, userId, spRoleId: roleId }), getGkbmInProvince()])
  if (requestId !== filterOptionsRequestId) return
  if (unitResult.status === 'fulfilled' && unitResult.value.success) unitOptions.value = toSelectOptions(unitResult.value.data)
  if (specialtyResult.status === 'fulfilled' && specialtyResult.value.success) specialtyOptions.value = toSelectOptions(specialtyResult.value.data)
  // 角色切换后旧编码可能已不在新选项里，剔除掉，避免胶囊显示已失效的条件。
  const yjdws = filters.value.yjdws.filter((code) => unitOptions.value.some((option) => option.value === code))
  const zybms = filters.value.zybms.filter((code) => specialtyOptions.value.some((option) => option.value === code))
  if (yjdws.length !== filters.value.yjdws.length || zybms.length !== filters.value.zybms.length) {
    filters.value = { ...filters.value, yjdws, zybms }
  }
}

const handleRoleLoaded = () => {
  const userMsg = (userDialogRef.value?.userMsg || {}) as Record<string, string>
  const dialog = userDialogRef.value
  roleContext.value = {
    // 选择权限的 userId 优先取角色返回值，兜底取当前登录用户 id（与拉取角色列表同源）。
    userId: userMsg.userId || store.getters.getUserMsg.id || '',
    dwId: userMsg.org_id || '',
    bmId: userMsg.specialorgid || dialog?.specialorgid || '',
    roleId: userMsg.role_id || userMsg.id || dialog?.spRoleId || '',
    roleCode: userMsg.code || dialog?.roleCode || ''
  }
  // 换角色后一级单位 / 省专业归口的可选项随权限变化，清空已选条件再按新角色重新拉取。
  if (filters.value.yjdws.length || filters.value.zybms.length) filters.value = { ...filters.value, yjdws: [], zybms: [] }
  isShowPage.value = true
  if (!roleContext.value.dwId) summaryError.value = '当前角色未关联单位，无法查询总览统计数据'
}

watch([() => roleContext.value.userId, () => roleContext.value.dwId, () => filters.value.year, () => filters.value.month, dimension], loadSummary)
watch([() => roleContext.value.userId, () => roleContext.value.dwId], loadFilterOptions)
// 项目单位 / 省专业归口变化时，汇总与下方所有统计都按新的 chooseYjdws / chooseZybms 重新查询。
watch([() => filters.value.yjdws, () => filters.value.zybms], loadSummary)
watch(stages, (value) => {
  if (!value.some((stage) => stage.id === selectedStage.value)) selectedStage.value = ''
})
onMounted(() => {
  loadSystemParams()
  loadYearOptions()
  userDialogRef.value?.getUser()
})

const selectStage = (id: StageId) => {
  if (!stageDetailsEnabled) return
  selectedStage.value = selectedStage.value === id ? '' : id
}

const selectOverview = () => {
  if (!stageDetailsEnabled) return
  selectedStage.value = ''
}

// 金额/数量先穿透到预算事项列表弹窗：勾选事项（可多选）后「查看」把 yssxId 数组传给项目明细，「查看全部项目」不带事项；
// 均不改变卡片的阶段选中状态。
const drillTarget = ref<OverviewDrillTarget | null>(null)
const detailTarget = ref<OverviewDrillTarget | null>(null)
const openDrill = (target: OverviewDrillTarget) => {
  drillTarget.value = target
  // 换一个阶段/合计重新穿透时，撤销可能遗留在最上层的项目明细弹窗。
  detailTarget.value = null
}
// 事项列表「查看 / 查看全部项目」：携带所选 yssxId 数组（全部项目为空）与当前阶段编码打开项目明细。
const drillDetail = (target: OverviewDrillTarget) => {
  detailTarget.value = target
}
</script>

<style lang="less">
/* 全页统一盒模型：非 scoped，包在页面根节点下，只作用于本页子树。
   此前本目录有 8 处各自声明盒模型，全部只覆盖自己的子树，谁也管不到谁：
   OverviewFilters / OverviewSummary / OverviewChartPanel / OverviewChart / StageWideTable 五个组件
   写在 scoped 样式里的 `*`——Vue 会把它编译成 `*[data-v-x]`，只在本组件子树内生效，于是五个组件
   各编译一份，共 15 条选择器反复参与匹配；另有 detail-card.less（2 条）与 OverviewSelect / OverviewMultiSelect
   （各 3 条）。这里收敛成一条。选择器带上 `.overview-page` 后优先级与原来的 `*[data-v-x]` 相同
   （一个类 vs 一个属性），又因为随页面 chunk 在全局样式之后加载，层叠顺序也不变，渲染结果与逐处声明一致。
   不直接依赖 main.ts 里的 Tailwind preflight：这份 reset 是本页布局的前提，不该由框架配置决定。 */
.overview-page,
.overview-page *,
.overview-page *::before,
.overview-page *::after {
  box-sizing: border-box;
}
</style>

<style scoped lang="less">
@import './styles/motion.less';

@font-face {
  font-family: 'Overview Noto Sans SC';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('@/assets/images/overview/noto-sans-sc-400.ttf') format('truetype');
}
@font-face {
  font-family: 'Overview Noto Sans SC';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('@/assets/images/overview/noto-sans-sc-500.ttf') format('truetype');
}
@font-face {
  font-family: 'Overview Noto Sans SC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('@/assets/images/overview/noto-sans-sc-700.ttf') format('truetype');
}
.overview-viewport {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  scrollbar-color: #b9c9ce transparent;
  scrollbar-width: thin;
  background: #f3f6f8;
}
.overview-page {
  --overview-teal: #00857e;
  --overview-border: #dfe8ec;
  --overview-text: #233743;
  --overview-muted: #617580;
  --overview-radius: 12px;
  --overview-shadow: 0 2px 6px rgba(28, 57, 68, 0.035);
  // 区块间距随屏幕轻微放大（8 → 12px）：大屏上卡片本身变大，间距不跟着长会显得挤在一起。
  --overview-gap: clamp(8px, 0.5vw, 12px);
  container-name: overview;
  // 页面宽度自适应工作区，只按宽度断点重排（列数、换行、滚动），高度始终交给内容自然分配；
  // 命名容器放在页面上，筛选栏、阶段详情的宽度断点量到的是实际内容宽度。
  container-type: inline-size;
  box-sizing: border-box;
  display: grid;
  // 筛选栏之外的高度按 1 : 2 分给上方汇总与下方图表/详情；两行都以 0 为下限，比例不受内容撑开。
  // 汇总区的文字随分到的宽高缩放（见 OverviewSummary），过矮窗口由 min-height 兜底并整体滚动。
  grid-template-rows: max-content minmax(0, 1fr) minmax(0, 2fr);
  gap: var(--overview-gap);
  width: 100%;
  // 常规宽屏全部铺满；仅超宽屏（工作区 > 2240px，如 4K / 带鱼屏）才收敛，避免一行拉到几千像素反而看不清。
  max-width: 2240px;
  height: 100%;
  min-width: 0;
  min-height: 700px;
  margin-inline: auto;
  padding: 0;
  color: var(--overview-text);
  background: #f3f6f8;
  font-family: 'Overview Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
</style>
