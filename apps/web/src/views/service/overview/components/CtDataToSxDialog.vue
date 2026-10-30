<template>
  <vxe-modal
    ref="modalRef"
    v-model="open"
    class-name="overview-sx-modal"
    :title="title"
    width="min(1360px, 94vw)"
    height="85vh"
    position="center"
    :remember="false"
    destroy-on-close
    show-footer
    show-zoom
    mask-closable
    esc-closable
    @show="handleShow"
    @before-hide="releaseDialog"
    @hide="handleHide"
  >
    <template #title
      ><span :id="TITLE_ID">{{ title }}</span></template
    >
    <div class="sx-dialog-content">
      <div class="sx-dialog-toolbar">
        <div class="sx-dialog-actions">
          <el-button size="small" type="primary" :disabled="!canViewSelected" @click="viewSelected">查 看</el-button>
          <el-button size="small" plain :disabled="loading || !!error" @click="viewAll">查看全部项目</el-button>
          <el-button size="small" plain :loading="exporting" :disabled="!canExport" @click="handleExport">导 出</el-button>
          <el-button size="small" plain class="sx-dialog-close" aria-label="关闭预算事项弹窗" @click="close">关 闭</el-button>
        </div>
        <p class="sx-dialog-meta">
          <span>{{ year || '--' }} 年度</span>
          <span>{{ isAmount ? `金额单位：${unit}` : '数量单位：个' }}</span>
          <span v-if="selectedCount">已选 {{ selectedCount }} 项</span>
        </p>
      </div>
      <div class="sx-dialog-body" :aria-busy="loading">
        <div v-if="error" class="sx-dialog-state is-error" role="alert">
          <TriangleAlert :size="18" aria-hidden="true" />
          <span>{{ error }}</span>
          <button type="button" @click="loadPage(page)">重新加载</button>
        </div>
        <vxe-table
          v-else
          ref="tableRef"
          class="sx-table"
          height="100%"
          border
          stripe
          header-align="center"
          align="center"
          show-header-overflow="tooltip"
          show-overflow="tooltip"
          :data="rows"
          :loading="loading"
          :column-config="{ resizable: true }"
          :row-config="{ isHover: true }"
          :checkbox-config="{ trigger: 'row', highlight: true }"
          :seq-config="{ startIndex: (page - 1) * pageSize }"
          row-class-name="sx-selectable-row"
          @checkbox-change="syncSelection"
          @checkbox-all="syncSelection"
        >
          <vxe-column type="checkbox" width="52" />
          <vxe-column type="seq" title="序号" width="64" />
          <vxe-column field="yssxName" title="预算事项" min-width="200" header-align="center" align="left" :formatter="formatCell" />
          <vxe-column field="zdtxName" title="重点投向" min-width="160" :formatter="formatCell" />
          <vxe-column field="xmlxName" title="项目类型" min-width="120" :formatter="formatCell" />
          <vxe-column field="yslxName" title="预算类型" min-width="100" :formatter="formatCell" />
          <vxe-column field="gkbmName" title="归口部门" min-width="120" :formatter="formatCell" />
          <vxe-column
            v-if="isAmount"
            field="amount"
            :title="`金额（${unit}）`"
            min-width="150"
            header-align="center"
            align="right"
            :formatter="formatAmountCell"
          />
          <vxe-column v-else field="num" title="数量（个）" min-width="110" align="right" :formatter="formatCell" />
          <template #empty>
            <div class="sx-dialog-state is-empty">
              <Inbox :size="24" aria-hidden="true" />
              <p>暂无预算事项</p>
              <small>{{ page > 1 ? '该页没有预算事项，可返回上一页查看' : '当前筛选条件下没有返回预算事项数据' }}</small>
            </div>
          </template>
        </vxe-table>
      </div>
      <p class="sx-dialog-hint">勾选预算事项后「查看」所选项目，或「查看全部项目」查看当前筛选下的全部项目</p>
    </div>
    <template #footer>
      <div class="sx-dialog-foot">
        <span class="sx-page-info">{{ total === null ? `本页 ${rows.length} 条` : `共 ${total} 条` }}</span>
        <label class="sx-page-size">
          每页
          <select :value="pageSize" :disabled="loading" aria-label="每页条数" @change="changePageSize">
            <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }} 条</option>
          </select>
        </label>
        <nav v-if="!error && (rows.length || page > 1)" class="sx-pager" aria-label="预算事项分页">
          <button type="button" :disabled="loading || page <= 1" @click="goPage(page - 1)">上一页</button>
          <template v-if="pageCount === null">
            <span class="sx-page-current">第 {{ page }} 页</span>
          </template>
          <template v-else>
            <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
              <span v-if="item === '...'" class="sx-page-ellipsis" aria-hidden="true">…</span>
              <button
                v-else
                type="button"
                :disabled="loading"
                :class="{ active: item === page }"
                :aria-current="item === page ? 'page' : undefined"
                :aria-label="`第 ${item} 页`"
                @click="goPage(item)"
                >{{ item }}</button
              >
            </template>
          </template>
          <button type="button" :disabled="loading || !canNext" @click="goPage(page + 1)">下一页</button>
        </nav>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
import type { VxeModalInstance } from 'vxe-pc-ui'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Inbox, TriangleAlert } from '@lucide/vue'
import { ElMessage } from 'element-plus'
import type { VxeTableInstance } from 'vxe-table'
import { exportCtDataToSx, getCtDataToSx } from '@/api/overview'
import type { CtDataToSxResult, GetCtDataToSxParams } from '@/api/overview'
import { apiExportHandle } from '@/utils/export'
import { PAGE_SIZES, buildPageItems, normalizePagedResult } from '../data/pagination'
import { buildOverviewBaseParams } from '../data/query'
import { formatOverviewValue, getOverviewUnit } from '../data/format'
import type { AmountUnit, Dimension, OverviewDrillTarget, RoleContext, StatMode } from '../types'

const TITLE_ID = 'ct-data-sx-dialog-title'

const props = withDefaults(
  defineProps<{
    /** 穿透目标；非空即打开弹窗，关闭由父级把目标置空。 */
    target: OverviewDrillTarget | null
    roleContext: RoleContext
    year: string
    month: string
    /** 项目单位筛选（chooseYjdws）：所选一级单位编码，空数组表示全部。 */
    yjdws: string[]
    /** 省专业归口筛选（chooseZybms）：所选省归口部门编码，空数组表示全部。 */
    zybms: string[]
    /** 统计方式：金额 / 数量，决定列表展示的数值列与单位。 */
    statMode: StatMode
    /** 金额展示单位：万元/亿元，仅前端换算。 */
    amountUnit: AmountUnit
    /** 数据维度：跟随右上角切换，按单位 1 / 按专业 2 传给穿透接口。 */
    dimension: Dimension
  }>(),
  { yjdws: () => [], zybms: () => [] }
)
const emit = defineEmits<{
  (event: 'close'): void
  /** 多选「查看」或「查看全部项目」：携带所选的 yssxId 数组（全部项目不传）与当前阶段编码，由父级打开项目明细弹窗。 */
  (event: 'drill', target: OverviewDrillTarget): void
}>()

const open = computed({
  get: () => props.target !== null,
  set: (value: boolean) => {
    if (!value) emit('close')
  }
})
// 关闭过渡期间弹窗仍需渲染标题与表体，因此目标快照留到过渡结束再清空。
const snapshot = ref<OverviewDrillTarget | null>(null)
const rows = ref<CtDataToSxResult[]>([])
const total = ref<number | null>(null)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const exporting = ref(false)
const error = ref('')
// 接口未给出总数时记录「本页是否满页」，翻到空页后不再放行下一页。
const hasMore = ref(false)
// 多选的事项行：只统计当前页勾选的记录，翻页或重新查询后清空。
const selectedRows = ref<CtDataToSxResult[]>([])
const modalRef = ref<VxeModalInstance>()
const tableRef = ref<VxeTableInstance>()
let requestId = 0
let restoreFocus: HTMLElement | null = null

const title = computed(() => (snapshot.value ? `${snapshot.value.title} - 预算事项` : '预算事项'))
// 数值列跟随统计方式：金额口径展示当前金额单位，数量口径展示数量（个），不重新请求、复用同一次响应。
const isAmount = computed(() => props.statMode === 'amount')
const unit = computed(() => getOverviewUnit(props.statMode, props.amountUnit))
const queryParams = computed<GetCtDataToSxParams>(() => ({
  // 角色、年度月度、项目单位 / 省专业归口与统计口径与总览其它接口同源。
  ...buildOverviewBaseParams({
    roleContext: props.roleContext,
    dimension: props.dimension,
    year: props.year,
    month: props.month,
    yjdws: props.yjdws,
    zybms: props.zybms
  }),
  ...(snapshot.value?.jdbm ? { jdbm: snapshot.value.jdbm } : {})
}))
const canExport = computed(
  () =>
    !!props.target &&
    !!props.roleContext.dwId &&
    !!props.year &&
    !loading.value &&
    !error.value &&
    (total.value === null ? rows.value.length > 0 || page.value > 1 : total.value > 0)
)
const pageCount = computed(() => (total.value === null ? null : Math.max(1, Math.ceil(total.value / pageSize.value))))
const canNext = computed(() => (pageCount.value === null ? hasMore.value : page.value < pageCount.value))
const selectedCount = computed(() => selectedRows.value.length)
// 「查看」至少勾选一条带 yssxId 的事项；「查看全部项目」不看勾选，只看当前查询是否可用。
const canViewSelected = computed(() => !loading.value && !error.value && selectedCount.value > 0)
// 接口没有返回总条数时只显示当前页（模板里的「第 N 页」），有总条数时渲染可点击页码。
const pageItems = computed(() => (pageCount.value === null ? [] : buildPageItems(page.value, pageCount.value)))

const text = (value: unknown) => {
  if (value === undefined || value === null) return '--'
  const content = String(value).trim()
  return content === '' ? '--' : content
}
const formatCell = ({ cellValue }: { cellValue: unknown }) => text(cellValue)
const formatAmountCell = ({ cellValue }: { cellValue: unknown }) => formatOverviewValue(cellValue, 'amount', props.amountUnit)

// 兼容「直接返回数组」与「分页对象」两种包体；数组形态没有总数，交给 canNext 判断下一页。
const normalizePage = (data: unknown) => normalizePagedResult<CtDataToSxResult>(data)

const loadPage = async (target: number) => {
  const current = snapshot.value
  if (!current) return
  if (!props.roleContext.dwId || !props.year) {
    error.value = '缺少当前单位或计划实施年度，无法查询预算事项'
    return
  }
  const currentRequestId = ++requestId
  const limit = pageSize.value
  loading.value = true
  error.value = ''
  try {
    const result = await getCtDataToSx({
      ...queryParams.value,
      page: target,
      limit
    })
    if (currentRequestId !== requestId) return
    if (!result.success) throw new Error(result.msg || '预算事项加载失败')
    const pageData = normalizePage(result.data)
    rows.value = pageData.rows
    total.value = pageData.total
    hasMore.value = pageData.rows.length >= limit
    page.value = target
    // 换页后事项行已变化，选区归零，避免把上一页的 yssxId 带进项目明细。
    clearSelection()
  } catch (loadError) {
    if (currentRequestId !== requestId) return
    rows.value = []
    total.value = null
    hasMore.value = false
    clearSelection()
    error.value = (loadError as Error).message || '预算事项加载失败，请重试'
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

const handleExport = async () => {
  if (exporting.value || !canExport.value) return
  exporting.value = true
  try {
    // 导出沿用事项列表筛选条件，不传分页参数，交由后端导出全部匹配数据。
    await apiExportHandle(queryParams.value, `${props.year}年度-${title.value}`, exportCtDataToSx)
  } catch (exportError) {
    ElMessage.error((exportError as Error).message || '预算事项导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

const goPage = (target: number) => {
  if (loading.value || target < 1 || target === page.value) return
  if (pageCount.value !== null && target > pageCount.value) return
  void loadPage(target)
}

const changePageSize = (event: Event) => {
  const size = Number((event.target as HTMLSelectElement).value)
  if (loading.value || !PAGE_SIZES.includes(size) || size === pageSize.value) return
  pageSize.value = size
  page.value = 1
  rows.value = []
  void loadPage(1)
}

// 勾选变化（行点击或表头全选）后同步选区，翻页与重新查询时由 clearSelection 归零。
const syncSelection = () => {
  selectedRows.value = tableRef.value?.getCheckboxRecords() ?? []
}

const clearSelection = () => {
  selectedRows.value = []
  void nextTick(() => tableRef.value?.clearCheckboxRow())
}

// 多选穿透：把勾选行的 yssxId 组成数组交给项目明细，标题按「单个事项 / 已选 N 个事项」区分。
const rowTitle = (current: OverviewDrillTarget, yssxName?: string) => (yssxName ? `${current.title} · ${yssxName}` : current.title)

const viewSelected = () => {
  const current = snapshot.value
  if (!current || loading.value || error.value) return
  const selected = selectedRows.value.filter((row) => !!row?.yssxId)
  if (!selected.length) return
  emit('drill', {
    jdbm: current.jdbm,
    yssxId: selected.map((row) => row.yssxId),
    title: selected.length === 1 ? rowTitle(current, selected[0].yssxName) : `${current.title} · 已选 ${selected.length} 个预算事项`
  })
}

// 查看全部项目：不传 yssxId，项目明细按当前单位、年度、月度与阶段条件查询全部项目。
const viewAll = () => {
  const current = snapshot.value
  if (!current || loading.value || error.value) return
  emit('drill', { jdbm: current.jdbm, title: `${current.title} · 全部项目` })
}

const releaseDialog = () => {
  // 让在途响应失效，避免关闭后旧数据覆盖下次打开的结果。
  requestId += 1
}

const close = () => {
  releaseDialog()
  emit('close')
}

const handleShow = () => {
  const panel = modalRef.value?.getBox()
  if (!panel) return
  // 当前 VXE 版本没有生成 dialog 语义，补充名称与键盘初始焦点。
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.setAttribute('aria-labelledby', TITLE_ID)
  panel.tabIndex = -1
  panel.focus({ preventScroll: true })
}

const handleHide = () => {
  releaseDialog()
  snapshot.value = null
  rows.value = []
  total.value = null
  hasMore.value = false
  page.value = 1
  error.value = ''
  loading.value = false
  clearSelection()
  // 上层项目明细弹窗关闭后焦点回到触发的事项行，等 VXE 完成关闭再还原。
  if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true })
  restoreFocus = null
}

watch(
  () => props.target,
  (value, previous) => {
    if (!value) {
      releaseDialog()
      return
    }
    snapshot.value = value
    rows.value = []
    total.value = null
    hasMore.value = false
    page.value = 1
    error.value = ''
    clearSelection()
    if (!previous) restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    void loadPage(1)
  }
)

onBeforeUnmount(releaseDialog)
</script>

<style scoped lang="less">
.sx-dialog-content,
.sx-dialog-content *,
.sx-dialog-foot,
.sx-dialog-foot * {
  box-sizing: border-box;
}
:global(.overview-sx-modal) {
  --overview-border: #c6e5e8;
  --ct-teal: #00857e;
  --ct-teal-strong: #007d77;
  font-family: 'Overview Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-variant-numeric: tabular-nums;
}
:global(.overview-sx-modal.vxe-modal--wrapper .vxe-modal--body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
:global(.overview-sx-modal.vxe-modal--wrapper .vxe-modal--body .vxe-modal--content) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  white-space: normal;
}
:global(.overview-sx-modal .vxe-modal--footer) {
  padding: 0;
}
.sx-dialog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 8px 18px;
}
.sx-dialog-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.sx-dialog-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
  // 事项多选后操作项增至「查看 / 查看全部项目 / 导出 / 关闭」，按钮间距统一由 gap 提供。
  gap: 12px;
}
.sx-dialog-actions :deep(.el-button) {
  margin: 0;
}
.sx-dialog-meta {
  display: flex;
  flex-shrink: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 2px 8px;
  margin: 0;
  padding: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 20px;
}
.sx-dialog-meta span + span::before {
  content: '·';
  margin-right: 8px;
  color: #b8ddd9;
}
.sx-dialog-close {
  flex: 0 0 auto;
  margin: 0;
}
.sx-dialog-hint {
  flex-shrink: 0;
  margin: 0;
  padding: 0 18px 8px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 16px;
  text-align: right;
}
.sx-dialog-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.sx-dialog-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 24px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}
.sx-dialog-state.is-empty svg {
  color: #9ecfd0;
}
.sx-dialog-state.is-empty p {
  margin: 0;
  color: #475569;
  font-size: 14px;
}
.sx-dialog-state.is-error {
  flex-direction: row;
  gap: 10px;
  color: #475569;
}
.sx-dialog-state.is-error button {
  padding: 4px 12px;
  border: 1px solid var(--overview-border);
  border-radius: 6px;
  color: var(--ct-teal-strong);
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}
.sx-dialog-state.is-error button:hover {
  background: #e6f4f3;
}
// 事项行点击切换勾选（多选穿透的入口），悬停保留 vxe-table 的行高亮并切换指针。
.sx-table :deep(.sx-selectable-row) {
  cursor: pointer;
}
.sx-dialog-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  gap: 12px;
  min-height: 44px;
  padding: 8px 18px;
  border-top: 1px solid var(--overview-border);
}
.sx-page-info {
  flex: 1;
  text-align: left;
  color: #64748b;
  font-size: 12px;
}
.sx-page-size {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}
.sx-page-size select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font: inherit;
  cursor: pointer;
}
.sx-page-size select:disabled {
  color: #94a3b8;
  background: #f7f9f9;
  cursor: not-allowed;
}
.sx-pager {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sx-pager button {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  color: #475569;
  background: #fff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.sx-pager button:not(:disabled):hover {
  border-color: #b8ddd9;
  color: var(--ct-teal-strong);
  background: #e6f4f3;
}
.sx-pager button.active {
  border-color: var(--ct-teal);
  color: #fff;
  background: var(--ct-teal);
  cursor: default;
}
.sx-pager button:disabled {
  color: #94a3b8;
  background: #f7f9f9;
  cursor: not-allowed;
}
.sx-page-current,
.sx-page-ellipsis {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}
.sx-page-ellipsis {
  padding: 0 2px;
}
.sx-dialog-content button:focus-visible,
.sx-dialog-foot button:focus-visible,
.sx-dialog-foot select:focus-visible {
  outline: 2px solid var(--ct-teal-strong);
  outline-offset: 2px;
}
</style>
