<template>
  <section
    ref="toolbarRef"
    class="overview-toolbar"
    :class="{ 'is-expanded': expanded, 'is-compact': compact }"
    aria-label="总览筛选条件"
    @keydown.escape="handleEscape"
  >
    <div ref="filtersRef" class="toolbar-filters">
      <div class="filter-group">
        <OverviewSelect v-model="year" label="计划实施年度" :options="yearSelectOptions" :disabled="!yearOptions.length" />
        <OverviewSelect v-model="statMode" label="统计方式" :options="STAT_MODE_OPTIONS" />
        <OverviewSelect v-if="statMode === 'amount'" v-model="amountUnit" label="金额单位" :options="AMOUNT_UNIT_SELECT_OPTIONS" />
      </div>
      <!-- 默认只展示年度/统计方式/金额单位；项目单位、省专业归口、统计月份点右侧箭头展开，展开后与常规条件同处一行。
           展开/收起走 Transition：外层用 0fr → 1fr 的网格列宽过渡揭示宽度，内容在内层裁切，避免文字换行抖动。
           更多条件与展开按钮放在同一组里换行，窄屏时按钮不会单独掉到一行。 -->
      <div class="filter-more">
        <Transition name="overview-extra">
          <div v-if="expanded" id="overview-extra-filters" class="filter-extra">
            <div class="filter-group filter-extra-inner">
              <!-- 项目单位选项取 budget/changes 的一级单位接口（bizOrgTree/getYjdw），
                  省专业归口选项取联合会审的专业部门查询条件接口（commonCode/getGkbmInProvince），两者都是多选。 -->
              <OverviewMultiSelect
                v-model="yjdws"
                label="项目单位"
                :options="unitOptions"
                :disabled="!unitOptions.length"
                :applied="!!yjdws.length"
              />
              <OverviewMultiSelect
                v-model="zybms"
                label="省专业归口"
                :options="specialtyOptions"
                :disabled="!specialtyOptions.length"
                :applied="!!zybms.length"
              />
              <!-- 统计月份沿用 Element Plus 月份面板，胶囊外观与上面的自绘下拉一致；面板经 popper-class 换成同一套圆角、阴影与青绿选中态。
                 月份输入框透明铺满整枚胶囊：点击任意位置都能打开，面板也以整枚胶囊为参照左对齐。
                 内置清空图标只在悬停时出现、且与箭头互斥，这里改为有值时常驻的清空按钮，叠在输入框之上。 -->
              <div class="filter-field month-field" :class="{ 'is-open': monthOpen, 'is-applied': !!month }">
                <span class="filter-label" aria-hidden="true">统计月份</span>
                <span class="filter-value" aria-hidden="true">{{ month || '全部月份' }}</span>
                <span v-if="!month" class="filter-arrow" aria-hidden="true"><ChevronDown :size="14" :stroke-width="2.2" /></span>
                <button v-else type="button" class="month-clear" aria-label="清空统计月份" @click="month = ''">
                  <X :size="13" :stroke-width="2.4" aria-hidden="true" />
                </button>
                <el-date-picker
                  v-model="month"
                  class="month-picker"
                  popper-class="overview-month-popper"
                  placement="bottom-start"
                  :offset="6"
                  type="month"
                  format="YYYY-MM"
                  value-format="YYYY-MM"
                  placeholder="全部月份"
                  size="small"
                  :clearable="false"
                  :editable="false"
                  aria-label="统计月份"
                  @focus="monthOpen = true"
                  @blur="monthOpen = false"
                />
              </div>
            </div>
          </div>
        </Transition>
        <button
          ref="toggleRef"
          type="button"
          class="filter-toggle"
          :class="{ 'is-open': expanded }"
          :data-tip="toggleLabel"
          :aria-label="toggleAriaLabel"
          :aria-expanded="expanded"
          :aria-controls="expanded ? 'overview-extra-filters' : undefined"
          @click="toggleExtraFilters"
        >
          <ChevronRight :size="16" :stroke-width="2" class="filter-toggle-icon" aria-hidden="true" />
          <span v-if="hasExtraFilter" class="filter-toggle-dot" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    <div ref="actionsRef" class="toolbar-actions">
      <span ref="updateTimeRef" class="update-time" :title="`数据更新时间：${updatedAt || '--'}`">
        <CalendarDays :size="13" aria-hidden="true" />
        <span class="update-label">数据更新时间</span>
        <span class="update-value">{{ updatedAt || '--' }}</span>
      </span>
      <span class="action-divider" aria-hidden="true"></span>
      <div class="overview-switch" role="group" aria-label="数据维度">
        <button
          type="button"
          :class="{ active: dimension === 'unit' }"
          :aria-pressed="dimension === 'unit'"
          @click="$emit('update:dimension', 'unit')"
          >按单位</button
        >
        <button
          type="button"
          :class="{ active: dimension === 'specialty' }"
          :aria-pressed="dimension === 'specialty'"
          @click="$emit('update:dimension', 'specialty')"
          >按专业</button
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CalendarDays, ChevronDown, ChevronRight, X } from '@lucide/vue'
import OverviewMultiSelect from './OverviewMultiSelect.vue'
import OverviewSelect from './OverviewSelect.vue'
import { AMOUNT_UNIT_OPTIONS } from '../data/format'
import { shouldCollapseUpdateTime } from '../data/overview'
import type { AmountUnit, Dimension, OverviewFilters, OverviewSelectOption, OverviewYearOption, StatMode } from '../types'

const STAT_MODE_OPTIONS: OverviewSelectOption[] = [
  { value: 'amount', label: '金额' },
  { value: 'count', label: '数量' }
]
const AMOUNT_UNIT_SELECT_OPTIONS: OverviewSelectOption[] = AMOUNT_UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit }))

const props = defineProps<{
  filters: OverviewFilters
  dimension: Dimension
  yearOptions: OverviewYearOption[]
  /** 项目单位选项：一级单位（bizOrgTree/getYjdw）。 */
  unitOptions: OverviewSelectOption[]
  /** 省专业归口选项：省归口部门（commonCode/getGkbmInProvince）。 */
  specialtyOptions: OverviewSelectOption[]
  updatedAt: string
}>()
const emit = defineEmits<{
  (event: 'update:filters', value: OverviewFilters): void
  (event: 'update:dimension', value: Dimension): void
}>()
const yearSelectOptions = computed<OverviewSelectOption[]>(() => props.yearOptions.map((item) => ({ value: item.yearCode, label: item.yearName })))
const year = computed({
  get: () => props.filters.year,
  set: (year: string) => emit('update:filters', { ...props.filters, year })
})
const month = computed({
  get: () => props.filters.month,
  set: (month: string | null) => emit('update:filters', { ...props.filters, month: month ?? '' })
})
// 下拉只回传字符串，选项已限定为合法取值，这里收窄回对应类型。
const statMode = computed({
  get: (): string => props.filters.statMode,
  set: (statMode: string) => emit('update:filters', { ...props.filters, statMode: statMode as StatMode })
})
const amountUnit = computed({
  get: (): string => props.filters.amountUnit,
  set: (amountUnit: string) => emit('update:filters', { ...props.filters, amountUnit: amountUnit as AmountUnit })
})
// 月份面板打开 / 关闭时 el-date-picker 分别触发 focus / blur，用来同步胶囊的打开态。
const monthOpen = ref(false)
// 更多筛选默认收起，只露出年度 / 统计方式 / 金额单位；展开后三个条件直接排在当前行，不再单独占一行。
const expanded = ref(false)
const toggleRef = ref<HTMLButtonElement | null>(null)
// 项目单位 / 省专业归口是多选：值直接写回 filters，由父级统一并入每次 /xmzl 请求的 chooseYjdws / chooseZybms。
// 兼容只传了旧字段的调用方：缺省按「全部」处理，避免读 length 抛错。
const yjdws = computed({
  get: (): string[] => props.filters.yjdws ?? [],
  set: (value: string[]) => emit('update:filters', { ...props.filters, yjdws: value })
})
const zybms = computed({
  get: (): string[] => props.filters.zybms ?? [],
  set: (value: string[]) => emit('update:filters', { ...props.filters, zybms: value })
})
const hasExtraFilter = computed(() => !!props.filters.month || !!yjdws.value.length || !!zybms.value.length)
// 图标按钮只展示图形，文案放在悬停提示与无障碍名称里。
const toggleLabel = computed(() => (expanded.value ? '收起筛选' : '更多筛选'))
// 图标按钮没有可见文字，读屏时需要额外说明「已设置高级条件」，避免只听到「更多筛选」而漏掉收起状态下的已选条件。
const toggleAriaLabel = computed(() => {
  if (expanded.value) return '收起筛选'
  return hasExtraFilter.value ? '更多筛选，已设置高级条件' : '更多筛选'
})

const toggleExtraFilters = () => {
  expanded.value = !expanded.value
}

// Esc 收起后把焦点还给展开按钮，避免焦点留在被隐藏的条件里。
const handleEscape = () => {
  if (!expanded.value) return
  expanded.value = false
  toggleRef.value?.focus()
}

/* ------------------------------------------------------------------ *
 * 「数据更新时间」的让位
 * 条件胶囊宽度随取值变化（一级单位名、已选数量、统计月份），工具栏又是 flex-wrap：
 * 只要条件区的自然宽度加上右侧操作区超过一行，整块操作区就会掉到第二行，
 * 表现为选了查询条件后「数据更新时间」换行。这里按自然宽度预先量一次，
 * 放不下时先收起更新时间与分隔线（与展开态窄屏的处理一致），把宽度让给条件。
 * ------------------------------------------------------------------ */
const toolbarRef = ref<HTMLElement | null>(null)
const filtersRef = ref<HTMLElement | null>(null)
const actionsRef = ref<HTMLElement | null>(null)
const updateTimeRef = ref<HTMLElement | null>(null)
const compact = ref(false)
// 与样式保持一致：胶囊之间 10px（.filter-group / .filter-extra-inner 的 gap），条件区与操作区 14px（.overview-toolbar 的 column-gap）。
const PILL_GAP = 10
const ACTIONS_GAP = 14
// 更新时间胶囊的宽度上限（.update-time 的 max-width），量宽时按同一上限夹取。
const UPDATE_TIME_MAX_WIDTH = 240
// 操作区里「更新时间 / 分隔线 / 维度切换」之间的间距与分隔线宽度，与样式保持一致。
const ACTION_GAP = 10
const ACTION_DIVIDER_WIDTH = 1

/**
 * 是否收起更新时间：比较「所有条件胶囊排成一行的自然宽度 + 右侧操作区完整宽度」与工具栏可用宽度。
 * 结果只取决于内容宽度，不依赖当前是否已收起，因此反复触发量宽也不会来回抖动。
 */
const measureToolbar = () => {
  const toolbar = toolbarRef.value
  const filters = filtersRef.value
  const actions = actionsRef.value
  const updateTime = updateTimeRef.value
  const switchEl = actions?.querySelector<HTMLElement>('.overview-switch')
  if (!toolbar || !filters || !actions || !updateTime || !switchEl) return
  // 胶囊都是 flex: none 且内部 nowrap，offsetWidth 就是自然宽度；展开过渡期间被裁切也不影响取值。
  const pills = Array.from(filters.querySelectorAll<HTMLElement>('.filter-field, .filter-toggle'))
  const pillsWidth = pills.reduce((total, pill) => total + pill.offsetWidth, 0) + PILL_GAP * Math.max(pills.length - 1, 0)
  // 操作区按「更新时间 + 分隔线 + 维度切换」逐项累加，而不是读容器宽度：
  // 已收起时容器里这几项宽度为 0，直接读容器会让判断依赖当前收起状态，收起与展开来回抖动。
  // 已收起时更新时间 offsetWidth 为 0，用 scrollWidth（不受 max-width 裁切）还原它显示时的宽度。
  const updateTimeWidth = Math.min(updateTime.scrollWidth, UPDATE_TIME_MAX_WIDTH)
  const actionsWidth = updateTimeWidth + ACTIONS_GAP * 2 + ACTION_DIVIDER_WIDTH + switchEl.offsetWidth
  const styles = getComputedStyle(toolbar)
  const availableWidth = toolbar.clientWidth - parseFloat(styles.paddingLeft || '0') - parseFloat(styles.paddingRight || '0')
  const next = shouldCollapseUpdateTime(pillsWidth, actionsWidth, availableWidth, ACTIONS_GAP)
  if (next !== compact.value) compact.value = next
}

const refreshMeasurement = () => void nextTick(measureToolbar)

// 条件个数、取值文案与工具栏宽度都会改变一行所需宽度，任一处变化都重新量宽。
const layoutKey = computed(() =>
  [
    expanded.value ? '1' : '0',
    props.filters.year,
    props.filters.month,
    props.filters.statMode,
    props.filters.amountUnit,
    (props.filters.yjdws ?? []).join(','),
    (props.filters.zybms ?? []).join(','),
    props.yearOptions.map((option) => option.yearName).join(','),
    props.unitOptions.length,
    props.specialtyOptions.length
  ].join('|')
)
watch(layoutKey, refreshMeasurement)

let toolbarObserver: ResizeObserver | null = null
onMounted(() => {
  refreshMeasurement()
  // 外层容器宽度变化会改变可用宽度，交给 ResizeObserver 重新量一次。
  if (typeof ResizeObserver !== 'undefined') {
    toolbarObserver = new ResizeObserver(refreshMeasurement)
    if (toolbarRef.value) toolbarObserver.observe(toolbarRef.value)
  }
  // 本地 Noto Sans SC 生效前后胶囊宽度不同（回退字体更宽），字体就绪后再量一次，避免首屏判断偏差。
  document.fonts?.ready.then(refreshMeasurement).catch(() => {})
})
onBeforeUnmount(() => {
  toolbarObserver?.disconnect()
  toolbarObserver = null
})
</script>

<style scoped lang="less">
@import '../styles/switch.less';
@import '../styles/filter-field.less';

button {
  font-family: inherit;
}
.overview-toolbar,
.toolbar-filters,
.toolbar-actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
}
.overview-toolbar {
  // 悬停下拉提示要盖住下方汇总卡片，需要自身成为定位上下文并抬高层级。
  position: relative;
  z-index: 3;
  min-height: min-content;
  // 操作区（数据更新时间 + 维度切换）不单独换行：条件放不下时由条件区自己换行，
  // 否则选中较长取值后整块操作区会被挤到第二行，看起来像「数据更新时间换行」。
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 10px 14px;
  padding: 10px 12px 10px 14px;
  border: 1px solid var(--overview-border);
  border-radius: var(--overview-radius);
  background: #fff;
  box-shadow: 0 1px 2px rgba(28, 57, 68, 0.04), 0 6px 16px -12px rgba(28, 57, 68, 0.22);
}
.toolbar-filters {
  flex: 1 1 auto;
  gap: 10px;
}
.filter-group {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.filter-more {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}
// 展开区外层只负责「宽度」：0fr → 1fr 的网格列过渡无需 JS 量宽，展开时条件从左向右生长。
// 内层负责排布（nowrap），只在过渡期间裁切，动画过程中文字不会换行导致高度抖动；
// 过渡结束后不再裁切，否则条件的下拉面板会被截掉。
// 默认态必须是展开态（1fr）：Vue 会在过渡结束后移除 enter-to / leave-from，
// 若把 1fr 只写在 enter-to 上，展开动画一结束面板就会塌回 0 宽。
.filter-extra {
  display: grid;
  grid-template-columns: 1fr;
  min-width: 0;
}
.filter-extra-inner {
  display: flex;
  min-width: 0;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
}
.overview-extra-enter-active .filter-extra-inner,
.overview-extra-leave-active .filter-extra-inner {
  overflow: hidden;
}
.overview-extra-enter-from,
.overview-extra-leave-to {
  grid-template-columns: 0fr;
  opacity: 0;
}
.overview-extra-enter-active,
.overview-extra-leave-active {
  transition: grid-template-columns 280ms var(--overview-motion-ease, cubic-bezier(0.16, 1, 0.3, 1)), opacity 200ms ease;
}
// 条件随宽度展开轻微右移归位，收起时一同淡出并回缩，避免只在边缘「擦出」。
.overview-extra-enter-from .filter-extra-inner,
.overview-extra-leave-to .filter-extra-inner {
  transform: translateX(-8px);
}
.overview-extra-enter-active .filter-extra-inner,
.overview-extra-leave-active .filter-extra-inner {
  transition: transform 280ms var(--overview-motion-ease, cubic-bezier(0.16, 1, 0.3, 1));
}
// 条件胶囊与下拉面板的外观在 styles/filter-field.less（与 OverviewSelect 共用），这里只补统计月份的特殊部分。
// 胶囊不参与收缩（flex: none），放不下时整行换行，取值永远不会被挤到看不见。
.month-field {
  position: relative;
}
// 有值时箭头位换成清空按钮，层级高于铺满胶囊的输入框，点击只清空、不打开面板。
.month-clear {
  position: relative;
  z-index: 1;
  display: grid;
  flex: none;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-left: -2px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  color: #4d8f8a;
  background: transparent;
  cursor: pointer;
}
.month-clear:hover {
  color: #fff;
  background: #00857e;
}
.month-clear:focus-visible {
  outline: 2px solid #007d77;
  outline-offset: 1px;
}
// 月份输入框透明铺满胶囊，只负责接收点击 / 键盘焦点并作为面板定位参照，文字由胶囊里的取值负责展示。
.month-field :deep(.month-picker) {
  position: absolute;
  inset: -1px;
  width: auto;
  height: auto;
}
.month-field :deep(.month-picker .el-input__inner) {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 8px;
  outline: none;
  opacity: 0;
  cursor: pointer;
}
.month-field :deep(.month-picker .el-input__prefix),
.month-field :deep(.month-picker .el-input__suffix) {
  display: none;
}
// 更多筛选只保留左右箭头：收起为「>」（点击展开更多条件），展开翻转为「<」（点击收起），展开时加深底色；条件生效时在右上角点一个小圆点。
.filter-toggle {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #dde7eb;
  border-radius: 8px;
  color: #5f7681;
  background: #fff;
  cursor: pointer;
  transition: color 140ms ease, background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}
.filter-toggle-icon {
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.filter-toggle.is-open .filter-toggle-icon {
  transform: rotate(180deg);
}
.filter-toggle:hover {
  border-color: #b9d6d3;
  color: var(--overview-teal);
  background: #f1f9f8;
}
.filter-toggle.is-open {
  border-color: #9ccfca;
  color: var(--overview-teal);
  background: #e6f5f3;
  box-shadow: inset 0 0 0 1px rgba(0, 133, 126, 0.06);
}
.filter-toggle:focus-visible {
  outline: 2px solid #007d77;
  outline-offset: 2px;
}
.filter-toggle-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--overview-teal);
  box-shadow: 0 0 0 2px #fff;
  animation: overview-filter-dot 200ms ease 120ms both;
}
.filter-toggle.is-open .filter-toggle-dot {
  box-shadow: 0 0 0 2px #e6f5f3;
}
// 图标按钮的自绘提示，悬停与键盘聚焦都可见；同时保留 aria-label 供读屏使用。
.filter-toggle::before,
.filter-toggle::after {
  position: absolute;
  left: 50%;
  z-index: 6;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease, transform 120ms ease;
}
.filter-toggle::before {
  content: '';
  top: calc(100% + 3px);
  width: 8px;
  height: 8px;
  background: #243b46;
  transform: translate(-50%, -2px) rotate(45deg);
}
.filter-toggle::after {
  content: attr(data-tip);
  top: calc(100% + 7px);
  padding: 4px 9px;
  border-radius: 6px;
  color: #fff;
  background: #243b46;
  box-shadow: 0 6px 16px -6px rgba(20, 40, 50, 0.5);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  transform: translate(-50%, -2px);
}
.filter-toggle:hover::before,
.filter-toggle:hover::after,
.filter-toggle:focus-visible::before,
.filter-toggle:focus-visible::after {
  opacity: 1;
}
.filter-toggle:hover::after,
.filter-toggle:focus-visible::after {
  transform: translate(-50%, 0);
}
.filter-toggle:hover::before,
.filter-toggle:focus-visible::before {
  transform: translate(-50%, 0) rotate(45deg);
}
.toolbar-actions {
  flex: none;
  margin-left: auto;
  gap: 10px;
}
// max-width 固定上限用于收起时做宽度过渡（实际宽度约 213px），文字不换行、超出部分裁切。
// 延迟只写在「非展开态」：展开时立即让位，收起时等条件区退回后再淡入，
// 否则两者同时占宽会让工具栏多换一行（栏高瞬间从 54px 变成 96px）。
.update-time {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  max-width: 240px;
  overflow: hidden;
  color: #62767f;
  font-size: 12px;
  white-space: nowrap;
  transition: max-width 240ms var(--overview-motion-ease, cubic-bezier(0.16, 1, 0.3, 1)) 200ms, opacity 160ms ease 200ms;
}
.update-time > svg {
  flex: none;
  color: #748c96;
}
.update-label {
  color: #62767f;
  font-weight: 500;
}
.update-value {
  color: #3f5663;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.action-divider {
  flex: none;
  width: 1px;
  height: 18px;
  background: linear-gradient(180deg, transparent, #e1e9ec 22%, #e1e9ec 78%, transparent);
  transition: width 240ms var(--overview-motion-ease, cubic-bezier(0.16, 1, 0.3, 1)), opacity 160ms ease;
}
.overview-toolbar .overview-switch {
  border-color: #e0eaec;
  background: #f3f8f8;
}
// 量宽结果（is-compact）：条件胶囊的取值变长或条件个数变化后一行放不下时，
// 先收起「数据更新时间」与分隔线，把宽度让给条件，避免整块操作区被挤到第二行。
// 与展开态窄屏的处理保持一致，只是触发条件由实测宽度决定，而不是写死的容器断点。
.overview-toolbar.is-compact .update-time {
  max-width: 0;
  opacity: 0;
  transition: max-width 240ms var(--overview-motion-ease, cubic-bezier(0.16, 1, 0.3, 1)), opacity 160ms ease;
}
.overview-toolbar.is-compact .action-divider {
  width: 0;
  opacity: 0;
  transition: width 240ms var(--overview-motion-ease, cubic-bezier(0.16, 1, 0.3, 1)), opacity 160ms ease;
}
// 操作区不参与收缩、也不单独换行：要么与条件同排，要么在条件已占满时由上面的 is-compact 让位。
.overview-toolbar .toolbar-actions {
  flex-wrap: nowrap;
  white-space: nowrap;
}
// 收起更新时间后连带去掉它与维度切换之间的空隙，把宽度全部让给条件。
.overview-toolbar.is-compact .toolbar-actions {
  gap: 0;
}
// 极窄容器（侧栏全开的小屏）下不再强行单行，允许操作区整体换到下一行，避免条件被压到无法阅读。
@container overview (max-width: 720px) {
  .overview-toolbar {
    flex-wrap: wrap;
  }
}
// 展开更多条件后若一行放不下，先收起更新时间，把整行留给筛选条件与维度切换。
// 收起状态不占用这段宽度，因此窄屏下仍保留更新时间；六个条件 + 更新时间 + 维度切换实测需要约 1376px，留余量取 1400px。
// 这是无 JS 时的兜底断点：条件胶囊的取值变长（如选中较长的单位名）时，另有上面的 is-compact 按实测宽度动态让位。
@container overview (max-width: 1400px) {
  .overview-toolbar.is-expanded .update-time {
    max-width: 0;
    opacity: 0;
    transition: max-width 240ms var(--overview-motion-ease, cubic-bezier(0.16, 1, 0.3, 1)), opacity 160ms ease;
  }
  .overview-toolbar.is-expanded .action-divider {
    width: 0;
    opacity: 0;
    transition: width 240ms var(--overview-motion-ease, cubic-bezier(0.16, 1, 0.3, 1)), opacity 160ms ease;
  }
}
// 小圆点用「淡入 + 2px 上浮」出现，不再从 0.4 倍缩放弹入：缩放会把 6px 的圆点连同白描边一起压小，边缘发虚。
@keyframes overview-filter-dot {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .filter-toggle-dot {
    animation: none;
  }
  .overview-extra-enter-active,
  .overview-extra-leave-active,
  .overview-extra-enter-active .filter-extra-inner,
  .overview-extra-leave-active .filter-extra-inner {
    transition-duration: 1ms;
  }
  .filter-toggle-icon {
    transition: none;
  }
  .filter-toggle::before,
  .filter-toggle::after {
    transition: none;
  }
}
</style>

<style lang="less">
// 统计月份面板挂在 body 下，scoped 样式够不到；只按 popper-class 定位，不影响其它页面的日期面板。
// 外观与自绘下拉面板一致：10px 圆角、细边框、柔和投影，去掉指向箭头；月份格为 32px 圆角块，当前月青绿实底、本月青绿字。
.el-picker__popper.el-popper.overview-month-popper[role='tooltip'] {
  margin-top: 0;
  border: 1px solid #e3eaed;
  border-radius: 10px;
  box-shadow: 0 12px 32px -12px rgba(20, 48, 58, 0.28), 0 2px 6px rgba(20, 48, 58, 0.06);
  font-family: 'Overview Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  .el-popper__arrow {
    display: none;
  }
  .el-picker-panel {
    width: 264px;
    border-radius: 10px;
    color: #34495a;
    line-height: 20px;
  }
  .el-date-picker__header {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    padding: 10px 10px 8px;
    border-bottom: 1px solid #edf2f4;
  }
  .el-date-picker__header-label {
    flex: 1 1 auto;
    padding: 2px 8px;
    border-radius: 6px;
    color: #233743;
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 24px;
    text-align: center;
    &:hover {
      color: #00706b;
      background: #f1f6f7;
    }
  }
  .el-picker-panel__icon-btn {
    display: grid;
    flex: none;
    place-items: center;
    width: 28px;
    height: 28px;
    margin: 0;
    padding: 0;
    border-radius: 6px;
    color: #61757f;
    font-size: 12px;
    &:hover {
      color: #00857e;
      background: #ecf6f5;
    }
    &:focus-visible {
      outline: 2px solid #007d77;
      outline-offset: 1px;
    }
  }
  .el-picker-panel__content {
    width: auto;
    margin: 0;
    padding: 8px;
  }
  .el-month-table,
  .el-year-table {
    width: 100%;
    margin: 0;
    font-size: 13px;
  }
  .el-month-table td,
  .el-year-table td {
    padding: 3px;
  }
  .el-month-table td div {
    height: auto;
    padding: 0;
  }
  .el-month-table td .cell,
  .el-year-table td .cell {
    width: auto;
    height: 34px;
    border-radius: 7px;
    color: #34495a;
    line-height: 34px;
    transition: color 120ms ease, background-color 120ms ease;
  }
  .el-month-table td .cell:hover,
  .el-year-table td .cell:hover {
    color: #00706b;
    background: #f1f6f7;
  }
  .el-month-table td.today .cell,
  .el-year-table td.today .cell {
    color: #00706b;
    font-weight: 600;
  }
  .el-month-table td.current:not(.disabled) .cell,
  .el-year-table td.current:not(.disabled) .cell {
    color: #fff;
    background: #00857e;
    font-weight: 600;
  }
  .el-month-table td.current:not(.disabled) .cell:hover,
  .el-year-table td.current:not(.disabled) .cell:hover {
    background: #007d77;
  }
}
</style>
