<template>
  <vxe-modal
    ref="modalRef"
    v-model="open"
    class-name="overview-ct-modal"
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
    <div class="ct-dialog-content">
      <div class="ct-dialog-toolbar">
        <div class="ct-dialog-actions">
          <el-button size="small" type="primary" :loading="exporting" :disabled="!canExport" @click="handleExport">导 出</el-button>
          <el-button size="small" plain class="ct-dialog-close" aria-label="关闭项目明细弹窗" @click="close">关 闭</el-button>
        </div>
        <p class="ct-dialog-meta">
          <span>{{ year || '--' }} 年度</span>
          <span>金额单位：{{ unit }}</span>
          <span v-if="statMode === 'count'">数量穿透按项目明细展示</span>
        </p>
      </div>
      <div class="ct-dialog-body" :aria-busy="loading">
        <div v-if="error" class="ct-dialog-state is-error" role="alert">
          <TriangleAlert :size="18" aria-hidden="true" />
          <span>{{ error }}</span>
          <button type="button" @click="loadPage(page)">重新加载</button>
        </div>
        <vxe-table
          v-else
          class="ct-table"
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
          :seq-config="{ startIndex: (page - 1) * pageSize }"
        >
          <vxe-column type="seq" title="序号" width="64" />
          <vxe-column field="xmmc" title="项目名称" min-width="240" header-align="center" align="left" :formatter="formatCell" />
          <vxe-column field="xmbm" title="项目编码" min-width="200" :formatter="formatCell" />
          <vxe-column field="yjdw" title="一级单位" min-width="140" :formatter="formatCell" />
          <vxe-column field="ejdw" title="二级单位" min-width="140" :formatter="formatCell" />
          <vxe-column field="zgkbm" title="归口部门" min-width="120" :formatter="formatCell" />
          <vxe-column field="ysly" title="预算来源" min-width="120" :formatter="formatCell" />
          <vxe-column field="flowStatusName" title="流程状态" min-width="120" :formatter="formatStatus" />
          <vxe-column field="amount" :title="`金额（${unit}）`" min-width="150" header-align="center" align="right" :formatter="formatAmountCell" />
          <template #empty>
            <div class="ct-dialog-state is-empty">
              <Inbox :size="24" aria-hidden="true" />
              <p>暂无项目明细</p>
              <small>{{ page > 1 ? '该页没有项目明细，可返回上一页查看' : '当前筛选条件下没有返回项目数据' }}</small>
            </div>
          </template>
        </vxe-table>
      </div>
    </div>
    <template #footer>
      <div class="ct-dialog-foot">
        <span class="ct-page-info">{{ total === null ? `本页 ${rows.length} 条` : `共 ${total} 条` }}</span>
        <label class="ct-page-size">
          每页
          <select :value="pageSize" :disabled="loading" aria-label="每页条数" @change="changePageSize">
            <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }} 条</option>
          </select>
        </label>
        <nav v-if="!error && (rows.length || page > 1)" class="ct-pager" aria-label="项目明细分页">
          <button type="button" :disabled="loading || page <= 1" @click="goPage(page - 1)">上一页</button>
          <template v-if="pageCount === null">
            <span class="ct-page-current">第 {{ page }} 页</span>
          </template>
          <template v-else>
            <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
              <span v-if="item === '...'" class="ct-page-ellipsis" aria-hidden="true">…</span>
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
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Inbox, TriangleAlert } from '@lucide/vue'
import { ElMessage } from 'element-plus'
import type { VxeModalInstance } from 'vxe-pc-ui'
import { exportCtData, getCtData } from '@/api/overview'
import type { CtDataResult, GetCtDataParams } from '@/api/overview'
import { apiExportHandle } from '@/utils/export'
import { PAGE_SIZES, buildPageItems, normalizePagedResult } from '../data/pagination'
import { buildOverviewBaseParams } from '../data/query'
import { formatOverviewValue, getOverviewUnit } from '../data/format'
import type { AmountUnit, Dimension, OverviewDrillTarget, RoleContext, StatMode } from '../types'

const TITLE_ID = 'ct-data-dialog-title'

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
    statMode: StatMode
    /** 金额展示单位：万元/亿元，仅前端换算。 */
    amountUnit: AmountUnit
    /** 数据维度：跟随右上角切换，按单位 1 / 按专业 2 传给穿透接口。 */
    dimension: Dimension
  }>(),
  { yjdws: () => [], zybms: () => [] }
)
const emit = defineEmits<{ (event: 'close'): void }>()

const open = computed({
  get: () => props.target !== null,
  set: (value: boolean) => {
    if (!value) emit('close')
  }
})
// 关闭过渡期间弹窗仍需渲染标题与表体，因此目标快照留到过渡结束再清空。
const snapshot = ref<OverviewDrillTarget | null>(null)
const rows = ref<CtDataResult[]>([])
const total = ref<number | null>(null)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const exporting = ref(false)
const error = ref('')
// 接口未给出总数时记录「本页是否满页」，翻到空页后不再放行下一页。
const hasMore = ref(false)
const modalRef = ref<VxeModalInstance>()
let requestId = 0
let restoreFocus: HTMLElement | null = null

const title = computed(() => (snapshot.value ? `${snapshot.value.title} - 项目明细` : '项目明细'))
// 项目明细始终展示 amount，即使由数量入口打开也必须使用金额单位。
const unit = computed(() => getOverviewUnit('amount', props.amountUnit))
const queryParams = computed<GetCtDataParams>(() => ({
  // 角色、年度月度、项目单位 / 省专业归口与统计口径与总览其它接口同源。
  ...buildOverviewBaseParams({
    roleContext: props.roleContext,
    dimension: props.dimension,
    year: props.year,
    month: props.month,
    yjdws: props.yjdws,
    zybms: props.zybms
  }),
  ...(snapshot.value?.jdbm ? { jdbm: snapshot.value.jdbm } : {}),
  // 事项列表多选穿透时携带 yssxId 数组；「查看全部项目」与卡片数值直接穿透都不传。
  ...(snapshot.value?.yssxId?.length ? { yssxId: snapshot.value.yssxId } : {})
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
// 接口没有返回总条数时只显示当前页（模板里的「第 N 页」），有总条数时渲染可点击页码。
const pageItems = computed(() => (pageCount.value === null ? [] : buildPageItems(page.value, pageCount.value)))

const text = (value: unknown) => {
  if (value === undefined || value === null) return '--'
  const content = String(value).trim()
  return content === '' ? '--' : content
}
const formatCell = ({ cellValue }: { cellValue: unknown }) => text(cellValue)
const formatAmountCell = ({ cellValue }: { cellValue: unknown }) => formatOverviewValue(cellValue, 'amount', props.amountUnit)
const formatStatus = ({ row }: { row: CtDataResult }) => text(row.flowStatusName || row.flowStatus)

// 兼容「直接返回数组」与「分页对象」两种包体；数组形态没有总数，交给 canNext 判断下一页。
const normalizePage = (data: unknown) => normalizePagedResult<CtDataResult>(data)

const loadPage = async (target: number) => {
  const current = snapshot.value
  if (!current) return
  if (!props.roleContext.dwId || !props.year) {
    error.value = '缺少当前单位或计划实施年度，无法查询项目明细'
    return
  }
  const currentRequestId = ++requestId
  const limit = pageSize.value
  loading.value = true
  error.value = ''
  try {
    const result = await getCtData({
      ...queryParams.value,
      page: target,
      limit
    })
    if (currentRequestId !== requestId) return
    if (!result.success) throw new Error(result.msg || '项目明细加载失败')
    const pageData = normalizePage(result.data)
    rows.value = pageData.rows
    total.value = pageData.total
    hasMore.value = pageData.rows.length >= limit
    page.value = target
  } catch (loadError) {
    if (currentRequestId !== requestId) return
    rows.value = []
    total.value = null
    hasMore.value = false
    error.value = (loadError as Error).message || '项目明细加载失败，请重试'
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

const handleExport = async () => {
  if (exporting.value || !canExport.value) return
  exporting.value = true
  try {
    // 导出沿用明细筛选条件（含多选预算事项的 yssxId 数组），不传分页参数，交由后端导出全部匹配数据。
    await apiExportHandle(queryParams.value, `${props.year}年度-${title.value}`, exportCtData)
  } catch (exportError) {
    ElMessage.error((exportError as Error).message || '项目明细导出失败，请重试')
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

const handleKeydown = (event: KeyboardEvent) => {
  const panel = modalRef.value?.getBox()
  if (event.key !== 'Tab' || !panel) return
  // 焦点留在弹窗内：Tab 到首尾时回绕，避免落到被遮住的页面上。
  const focusables = Array.from(
    panel.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')
  )
  if (!focusables.length) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === panel || !panel.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}

const releaseDialog = () => {
  document.removeEventListener('keydown', handleKeydown, true)
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
  document.addEventListener('keydown', handleKeydown, true)
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
  // 等 VXE 完成关闭后再还原焦点，避免焦点落回仍被遮罩覆盖的卡片。
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
    if (!previous) restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    void loadPage(1)
  }
)

onBeforeUnmount(releaseDialog)
</script>

<style scoped lang="less">
.ct-dialog-content,
.ct-dialog-content *,
.ct-dialog-foot,
.ct-dialog-foot * {
  box-sizing: border-box;
}
:global(.overview-ct-modal) {
  --overview-border: #c6e5e8;
  --ct-teal: #00857e;
  --ct-teal-strong: #007d77;
  font-family: 'Overview Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-variant-numeric: tabular-nums;
}
:global(.overview-ct-modal.vxe-modal--wrapper .vxe-modal--body) {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
:global(.overview-ct-modal.vxe-modal--wrapper .vxe-modal--body .vxe-modal--content) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  white-space: normal;
}
:global(.overview-ct-modal .vxe-modal--footer) {
  padding: 0;
}
.ct-dialog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 8px 18px;
}
.ct-dialog-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.ct-dialog-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  // 「导 出」与「关 闭」之间的固定间距（相邻按钮的默认 margin 已被清零）。
  gap: 12px;
}
.ct-dialog-actions :deep(.el-button) {
  margin: 0;
}
.ct-dialog-meta {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 2px 8px;
  margin: 0;
  padding: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 20px;
}
.ct-dialog-meta span + span::before {
  content: '·';
  margin-right: 8px;
  color: #b8ddd9;
}
.ct-dialog-close {
  flex: 0 0 auto;
  margin: 0;
}
.ct-dialog-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.ct-dialog-state {
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
.ct-dialog-state.is-empty svg {
  color: #9ecfd0;
}
.ct-dialog-state.is-empty p {
  margin: 0;
  color: #475569;
  font-size: 14px;
}
.ct-dialog-state.is-error {
  flex-direction: row;
  gap: 10px;
  color: #475569;
}
.ct-dialog-state.is-error button {
  padding: 4px 12px;
  border: 1px solid var(--overview-border);
  border-radius: 6px;
  color: var(--ct-teal-strong);
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}
.ct-dialog-state.is-error button:hover {
  background: #e6f4f3;
}
.ct-dialog-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  gap: 12px;
  min-height: 44px;
  padding: 8px 18px;
  border-top: 1px solid var(--overview-border);
}
.ct-page-info {
  flex: 1;
  text-align: left;
  color: #64748b;
  font-size: 12px;
}
.ct-page-size {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}
.ct-page-size select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font: inherit;
  cursor: pointer;
}
.ct-page-size select:disabled {
  color: #94a3b8;
  background: #f7f9f9;
  cursor: not-allowed;
}
.ct-pager {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ct-pager button {
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
.ct-pager button:not(:disabled):hover {
  border-color: #b8ddd9;
  color: var(--ct-teal-strong);
  background: #e6f4f3;
}
.ct-pager button.active {
  border-color: var(--ct-teal);
  color: #fff;
  background: var(--ct-teal);
  cursor: default;
}
.ct-pager button:disabled {
  color: #94a3b8;
  background: #f7f9f9;
  cursor: not-allowed;
}
.ct-page-current,
.ct-page-ellipsis {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}
.ct-page-ellipsis {
  padding: 0 2px;
}
.ct-dialog-content button:focus-visible,
.ct-dialog-foot button:focus-visible,
.ct-dialog-foot select:focus-visible {
  outline: 2px solid var(--ct-teal-strong);
  outline-offset: 2px;
}
</style>
