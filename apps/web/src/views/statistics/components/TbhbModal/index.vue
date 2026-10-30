<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal tbhb-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="90vw"
    height="85vh"
    @close="handleClose"
    :loading="loading"
  >
    <div class="tbhb_table">
      <div class="tbhb_table_button">
        <el-button :loading="loading" size="small" plain type="primary" @click="exportDataHandle">导 出</el-button>
        <div class="tbhb_table_button_right">
          <div class="tbhb_table_button_year">
            <span class="unit-wanyuan">单位：万元</span>
            <span class="unit-wanyuan">小数位数：{{ Number(currentParams?.xsws.split('_')[1]) }}</span>
          </div>
        </div>
      </div>
      <div class="tbhb_table_main">
        <vxe-grid ref="gridRef" class="range-vxe-table" v-bind="gridOptions" @cell-click="handleCellClick" />
      </div>
    </div>
    <FxbgModal ref="fxbgModalRef" />
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'TbhbModal'
}
</script>

<script setup lang="ts">
import { h, ref, reactive, computed, watch } from 'vue'
import { VxeGridProps, VxeTablePropTypes } from 'vxe-table'
import { ElMessage, ElTooltip } from 'element-plus'
import * as defaultApi from '@/api/statistics/yszxfx'
import {
  applyServerColumns,
  buildGroupedRows,
  calcZfForRows,
  currentType,
  currentParams,
  getLeafColumns,
  getColumnKind,
  getNumericLeafFields,
  samePeriodPrefix
} from './columns'
import type { TbhbApi, TbhbModalParams, TbhbRowVo } from './types'
import Decimal from 'decimal.js'
import { vxeExportFormulaHandle } from '@/utils/export'
import type { FormulaConfig, SumFormulaConfig, SumRangeSpec, InlineSumConfig, InlineSumOptions, RankFormulaConfig, RankSpec } from '@/utils/export'
import FxbgModal from '@/views/statistics/components/FxbgModal/index.vue'

const isShowModal = ref(false)
const loading = ref(false)
const reportLoading = ref(false)
const modalTitle = ref('同比分析')
const gridRef = ref()
const fxbgModalRef = ref()

const allRows = ref<TbhbRowVo[]>([])
const collapsedGroups = ref<Set<string>>(new Set())

const displayData = computed<TbhbRowVo[]>(() => {
  if (collapsedGroups.value.size === 0) return allRows.value
  return allRows.value.filter((row: any) => {
    if (row._isGroupRow || row._isTotalRow || row._isDfjRow) return true
    const parent = row._parentGroup
    if (parent && collapsedGroups.value.has(parent)) return false
    return true
  })
})

const rowClassName: VxeTablePropTypes.RowClassName<TbhbRowVo> = ({ row }: { row: TbhbRowVo }) => {
  const r = row as any
  const classNames: string[] = []
  if (r._isGroupRow || r._isTotalRow || r._isDfjRow) {
    classNames.push('col-font')
  }
  if (r._isGroupRow) {
    classNames.push('tbhb-group-row')
  }
  return classNames.length ? classNames.join(' ') : null
}

const toggleGroup = (groupType: string) => {
  const next = new Set(collapsedGroups.value)
  if (next.has(groupType)) {
    next.delete(groupType)
  } else {
    next.add(groupType)
  }
  collapsedGroups.value = next
}

const handleCellClick = ({ row }: any) => {
  const r = row as any
  if (r && r._isGroupRow && r._groupType) {
    toggleGroup(r._groupType)
  }
}

const gridOptions = reactive<VxeGridProps<TbhbRowVo>>({
  border: true,
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  height: '100%',
  rowConfig: {
    height: 36
  },
  size: 'mini',
  columns: [],
  data: [],
  rowClassName,
  exportConfig: {
    type: 'xlsx',
    filename: '预算执行情况-同比分析',
    sheetName: '预算执行情况-同比分析',
    useStyle: true,
    isMergeHead: true
  }
})

watch(displayData, (val) => {
  gridOptions.data = val as any
})

const getRequestParams = (params: TbhbModalParams) => {
  const { formData, dwId, type } = params
  const { ysqj, month, ...rest } = formData
  let newMonth = month
  if (ysqj) {
    const arr = String(ysqj).split('-')
    newMonth = Number(arr[arr.length - 1]).toString()
  }
  return {
    dwId,
    ...rest,
    month: newMonth,
    type
  }
}

// 公式提示表头：标题 + 问号图标，hover 弹出公式（el-tooltip 的 popper 默认 append 到 body，不受弹窗 overflow 裁剪）
const renderFormulaHeader = (title: string, formula: string) => {
  return () =>
    h(
      ElTooltip,
      { effect: 'dark', placement: 'top', content: formula },
      {
        default: () => h('span', { style: 'display: inline-flex; align-items: center; gap: 2px' }, [title])
      }
    )
}

const loadData = async (params: TbhbModalParams) => {
  loading.value = true
  gridOptions.loading = true
  try {
    const requestParams = getRequestParams(params)
    const api: TbhbApi = params.api ?? defaultApi
    const isTb = params.type === 'tb'
    const getTbhbColumn = isTb ? api.tbgetDynamicColumn : api.hbgetDynamicColumn
    const getTbhbData = isTb ? api.getTbData : api.getHbData
    let serverColumns: any[] = []
    try {
      const colRes = await getTbhbColumn(requestParams)
      if (colRes.success && Array.isArray(colRes.data) && colRes.data.length !== 0) {
        serverColumns = colRes.data
      }
    } catch (e) {
      console.error('获取同比/环比表头失败', e)
    }

    if (serverColumns.length === 0) {
      gridOptions.columns = []
      allRows.value = []
      collapsedGroups.value = new Set()
      ElMessage.warning('未获取到表头数据')
      return
    }
    const columns = applyServerColumns(serverColumns, params.type)
    // 表头公式提示：仅对带 tipContent 的叶子列挂表头 tooltip
    getLeafColumns(columns).forEach((col: any) => {
      const tip = col?.tipContent
      if (tip) {
        col.slots = col.slots || {}
        col.slots.header = renderFormulaHeader(col.title, String(tip))
      }
    })
    gridOptions.columns = columns

    const dataRes = await getTbhbData(requestParams)
    if (dataRes.success) {
      const rows: TbhbRowVo[] = Array.isArray(dataRes.data) ? dataRes.data : []
      calcZfForRows(rows)
      const grouped = buildGroupedRows(rows, columns)
      collapsedGroups.value = new Set()
      allRows.value = grouped
    } else {
      ElMessage.error(dataRes.msg)
      allRows.value = []
    }
  } catch (e: any) {
    console.error('加载同比/环比数据失败', e)
    ElMessage.error('加载数据失败')
    allRows.value = []
  } finally {
    loading.value = false
    gridOptions.loading = false
  }
}

const open = (params: TbhbModalParams) => {
  currentType.value = params.type
  currentParams.value = params
  modalTitle.value = params.type === 'tb' ? '同比分析' : '环比分析'
  gridOptions.exportConfig = {
    ...gridOptions.exportConfig,
    filename: `预算执行情况-${modalTitle.value}`,
    sheetName: `预算执行情况-${modalTitle.value}`
  }
  isShowModal.value = true
  loadData(params)
}

const handleClose = () => {
  isShowModal.value = false
  allRows.value = []
  collapsedGroups.value = new Set()
  gridOptions.columns = []
  currentParams.value = null
}

// 根据叶子列动态构建公式配置（statistics/TbhbModal 的 field 为驼峰命名，无 _ 分隔）
// 完成率：{base}Wcl = {base}Wcz / {base}Mbz * 100
// 同比/环比增幅：{base}TbJe / {base}HbJe = {base}ByhjWcz - {base}QnTqWcz / {base}SyhjWcz
// 同比/环比增率：{base}TbPl / {base}HbPl = {base}ByhjWcl - {base}QnTqWcl / {base}SyhjWcl
const buildFormulaConfig = (columns: any[]): FormulaConfig | undefined => {
  const leaves = getLeafColumns(columns)
  const isTb = currentType.value === 'tb'
  const cmpSuffix = isTb ? 'QnTq' : 'Syhj' // 同比 QnTq（去年），环比 Syhj（上月）
  const cfg: FormulaConfig = {}
  leaves.forEach((col: any) => {
    const field = String(col.field || '')
    if (!field) return
    const kind = getColumnKind(col)
    if (kind === 'rate') {
      // 完成率 = 完成值/目标值*100
      const base = field.replace(/Wcl$/i, '')
      if (base !== field) {
        cfg[field] = {
          type: 'ratio',
          valueField: `${base}Wcz`,
          targetField: `${base}Mbz`,
          skipField: `${base}Mbz`,
          matchMode: 'exact'
        }
      }
    } else if (kind === 'je') {
      // 同比/环比增幅 = 本月完成值 - 对比期完成值
      const base = isTb ? field.replace(/TbJe$/i, '') : field.replace(/HbJe$/i, '')
      if (base !== field) {
        cfg[field] = {
          type: 'diff',
          currentField: `${base}ByhjWcz`,
          compareField: `${base}${cmpSuffix}Wcz`,
          matchMode: 'exact'
        }
      }
    } else if (kind === 'bl') {
      // 同比/环比增率 = 本月完成率 - 对比期完成率
      const base = isTb ? field.replace(/TbPl$/i, '') : field.replace(/HbPl$/i, '')
      if (base !== field) {
        cfg[field] = {
          type: 'diff',
          currentField: `${base}ByhjWcl`,
          compareField: `${base}${cmpSuffix}Wcl`,
          matchMode: 'exact'
        }
      }
    }
  })
  return Object.keys(cfg).length > 0 ? cfg : undefined
}

// 构造导出 SUM 公式配置：分组小计行 = 本组明细区间求和；合计行 = 全部明细 + 待分解 多区间求和。
// 仅对 value 类叶子列（本月目标值/完成值、同期目标值/完成值）写 SUM；rate/je/bl 走各自的 IFERROR/diff 公式。
// 行判定复用 buildGroupedRows 注入的运行时标记：_isGroupRow / _isTotalRow / _isDfjRow。
// gridOptions.data 形如：[小计_1, 明细_1a, 明细_1b, ..., 小计_2, 明细_2a, ..., 待分解?, 合计]
const buildSumConfig = (columns: any[], data: TbhbRowVo[]): SumFormulaConfig | undefined => {
  if (!data || data.length === 0) return undefined
  const leaves = getNumericLeafFields(columns)
  const fields = leaves
    .filter((col: any) => getColumnKind(col) === 'value')
    .map((col: any) => String(col.field || ''))
    .filter(Boolean)
  if (fields.length === 0) return undefined

  const isGroupRow = (r: TbhbRowVo) => !!(r as any)._isGroupRow
  const isTotalRow = (r: TbhbRowVo) => !!(r as any)._isTotalRow
  const isDfjRow = (r: TbhbRowVo) => !!(r as any)._isDfjRow
  const isAggRow = (r: TbhbRowVo) => isGroupRow(r) || isTotalRow(r) || isDfjRow(r)
  const isDetail = (r: TbhbRowVo) => !isAggRow(r)

  const items: SumRangeSpec[] = []

  // 分组小计：小计行 i 的明细区间为紧随其后直到下一个聚合行之前的连续 detail 行
  for (let i = 0; i < data.length; i++) {
    if (!isGroupRow(data[i])) continue
    let j = i + 1
    while (j < data.length && isDetail(data[j])) j++
    if (j - 1 >= i + 1) {
      items.push({ rowIndex: i, detailRanges: [[i + 1, j - 1]] })
    }
  }

  // 合计行：明细 + 待分解 多区间相加（跨过中间小计行避免双重计数）
  const totalIdx = data.findIndex(isTotalRow)
  if (totalIdx >= 0) {
    const ranges: [number, number][] = []
    // 1) 连续 detail 段
    let k = 0
    while (k < totalIdx) {
      if (!isDetail(data[k])) {
        k++
        continue
      }
      let m = k
      while (m < totalIdx && isDetail(data[m])) m++
      ranges.push([k, m - 1])
      k = m
    }
    // 2) 待分解单点行（_isDfjRow 标记，含真实数值）
    for (let p = 0; p < totalIdx; p++) {
      if (isDfjRow(data[p])) ranges.push([p, p])
    }
    if (ranges.length > 0) {
      items.push({ rowIndex: totalIdx, detailRanges: ranges })
    }
  }

  return items.length > 0 ? { fields, items } : undefined
}

// 构造导出「成本小计」横向求和公式配置：
// 对 cbxj 前缀、值后缀 Mbz/Wcz/Lxz 的汇总列，按"时期前缀 + 值后缀"分组，
// 收集同行右侧所有"以同 (period+valueSuffix) 结尾且不以 cbxj 开头"的叶子列作为求和源。
// 时期前缀：本月 Byhj（必出现）+ 同期 QnTq / Syhj（由 currentType 决定）。
// 列名后端定，动态跟随；后端没返回 cbxj* 列时返回 undefined（安全 no-op）。
// rowFilter 跳过分组/合计/待分解等聚合行（_isGroupRow/_isTotalRow/_isDfjRow）：
// 这些行的汇总值由后端给出，不应被横向求和公式覆盖。
const INLINE_SUM_PREFIX = 'cbxj'
const INLINE_SUM_VALUE_SUFFIXES = ['Mbz', 'Wcz', 'Lxz']
const INLINE_SUM_PERIOD_PREFIXES = ['Byhj', samePeriodPrefix()] // 本月 + 同期（同比 QnTq / 环比 Syhj）

const buildInlineSumConfig = (columns: any[]): InlineSumOptions | undefined => {
  const leaves = getLeafColumns(columns)
  const specs: InlineSumConfig = []
  INLINE_SUM_PERIOD_PREFIXES.forEach((period) => {
    INLINE_SUM_VALUE_SUFFIXES.forEach((suffix) => {
      const targetField = `${INLINE_SUM_PREFIX}${period}${suffix}` // cbxjByhjMbz / cbxjQnTqMbz / cbxjSyhjMbz ...
      const hasTarget = leaves.some((c: any) => c?.field === targetField)
      if (!hasTarget) return // 后端没返回该汇总列 → 跳过
      const compositeSuffix = `${period}${suffix}`
      const sourceFields = leaves
        .filter((c: any) => {
          const f = String(c?.field || '')
          return f.endsWith(compositeSuffix) && !f.startsWith(INLINE_SUM_PREFIX) && f !== targetField
        })
        .map((c: any) => String(c.field))
        .filter(Boolean)
      if (sourceFields.length === 0) return
      specs.push({ targetField, sourceFields })
    })
  })
  if (specs.length === 0) return undefined
  return {
    config: specs,
    // 仅明细行写横向求和公式；分组小计/合计/待分解保持原值（行判定与 buildSumConfig 同一套标记）
    rowFilter: (row: any) => !(row?._isGroupRow || row?._isTotalRow || row?._isDfjRow)
  }
}

// 构造导出 RANK 公式配置：省排名 spm 走 global（仅 dwType=1 行参与），分组排名 fzpm 走 segment（组内明细）
// 排序基准 = 成本小计下「同比/环比增率」列 = cbxjTbPl（同比）/ cbxjHbPl（环比），与 buildFormulaConfig 同源
const buildRankFormulaConfig = (columns: any[]): RankFormulaConfig | undefined => {
  const leaves = getLeafColumns(columns)
  const leafFields = new Set(leaves.map((c: any) => String(c.field || '')).filter(Boolean))
  const isTb = currentType.value === 'tb'
  const rateField = isTb ? 'cbxjTbPl' : 'cbxjHbPl'
  const hasSpm = leafFields.has('spm')
  const hasFzpm = leafFields.has('fzpm')
  if (!leafFields.has(rateField) || (!hasSpm && !hasFzpm)) return undefined
  // 省排名完成率现算：rateField=cbxjTbPl/cbxjHbPl 是导出公式列（= cbxjByhjWcl − cbxjQnTqWcl/SyhjWcl），
  // row 里通常无 JS 值（屏幕虽经 calcZfForRows 现算填回，但导出走的是原始 row）。故与 columns.ts 的
  // calcZlField 同源：从底层真实字段 cbxjByhjWcz/Mbz 与 cbxj{QnTq|Syhj}Wcz/Mbz 现算两个完成率再相减。
  // 用 Decimal 保证除法精度，Mbz 为 0 视为该周期完成率无效 → 增率返回 null（该行不参与排名）。
  const cmp = samePeriodPrefix() // 'QnTq'（同比）或 'Syhj'（环比）
  const wclOf = (row: any, prefix: string): number | null => {
    const wcz = Number(row?.[`cbxj${prefix}Wcz`])
    const mbz = Number(row?.[`cbxj${prefix}Mbz`])
    if (!Number.isFinite(wcz) || !Number.isFinite(mbz) || mbz === 0) return null
    return Number(Decimal.div(wcz, mbz).mul(100).toFixed(2))
  }
  const rateCalc = (row: any): number | null => {
    const cur = wclOf(row, 'Byhj')
    const cmpWcl = wclOf(row, cmp)
    if (cur === null || cmpWcl === null) return null
    return Number(Decimal.sub(cur, cmpWcl).toFixed(2))
  }
  const specs: RankSpec[] = []
  if (hasSpm) {
    specs.push({ field: 'spm', rateField, scope: 'global', rankFieldHasValue: true, rateCalc })
  }
  if (hasFzpm) {
    specs.push({ field: 'fzpm', rateField, scope: 'segment' })
  }
  return specs.length > 0 ? { specs } : undefined
}

const exportDataHandle = () => {
  const $grid = gridRef.value
  if (!$grid) return
  if (!allRows.value || allRows.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const xsws = Number(currentParams.value?.xsws.split('_')[1])
  const formulaConfig = buildFormulaConfig(gridOptions.columns)
  const sumConfig = buildSumConfig(gridOptions.columns, gridOptions.data as TbhbRowVo[])
  const inlineSumOptions = buildInlineSumConfig(gridOptions.columns)
  const rankFormulaConfig = buildRankFormulaConfig(gridOptions.columns)
  vxeExportFormulaHandle(
    $grid,
    gridOptions.exportConfig?.filename,
    gridOptions.data,
    xsws,
    formulaConfig,
    { tbhbMode: true },
    sumConfig,
    inlineSumOptions,
    rankFormulaConfig
  )
}

const viewReportHandle = async () => {
  if (!currentParams.value) return
  if (reportLoading.value) return
  reportLoading.value = true
  try {
    const api: TbhbApi = currentParams.value.api ?? defaultApi
    const requestParams = getRequestParams(currentParams.value)
    const isTb = currentParams.value.type === 'tb'
    const reportFn: any = isTb ? api.tbGetFxbg : api.hbGetFxbg
    if (!reportFn) {
      ElMessage.warning('暂无分析报告接口')
      return
    }
    fxbgModalRef.value?.open(requestParams, reportFn)
  } catch (e: any) {
    console.error('查看分析报告失败', e)
    ElMessage.error('查看分析报告失败')
  } finally {
    reportLoading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="less">
.tbhb_table {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .tbhb_table_button {
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }
  .tbhb_table_main {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}

:deep(.range-vxe-table .col-font) {
  font-weight: bold;
}

:deep(.range-vxe-table .tbhb-group-row) {
  cursor: pointer;
  background-color: var(--el-fill-color-light, #f5f7fa);
}

// 公式提示图标：让用户一眼看出该表头可悬浮查看公式
:deep(.vxe-formula-icon) {
  margin-left: 2px;
  color: var(--color-primary, #00706b);
  font-size: 14px;
  cursor: pointer;
  vertical-align: middle;
  transition: color 0.2s ease, transform 0.2s ease;
  &:hover {
    color: #005f5b;
    transform: scale(1.15);
  }
}
.tbhb_table_button_right {
  line-height: 40px;
  height: 100%;
  min-width: 0;
  min-height: 0;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tbhb_table_button_year {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  white-space: nowrap;
}

.unit-wanyuan {
  background: var(--color-primary, #00706b);
  color: #fff;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  height: 30px;
  line-height: 30px;
}
</style>
