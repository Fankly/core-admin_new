<template>
  <vxe-modal
    v-model="visible"
    class-name="ai-audit-range-modal yszxylb-tbhb-modal"
    resize
    show-zoom
    destroy-on-close
    :title="modalTitle"
    width="90vw"
    height="85vh"
    :loading="loading"
    @close="handleClose"
  >
    <div class="tbhb_table">
      <div class="tbhb_table_button">
        <el-button :loading="loading" size="small" plain type="primary" @click="exportDataHandle">导 出</el-button>
        <div class="tbhb_table_button_right">
          <div class="tbhb_table_button_year">
            <span class="unit-wanyuan">单位：万元</span>
            <span class="unit-wanyuan">小数位数：{{ xswsDigits }}</span>
          </div>
        </div>
      </div>
      <div class="tbhb_table_main">
        <vxe-grid ref="gridRef" v-bind="gridOptions"></vxe-grid>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import { getDynamicColumnByDwTbHb, getTbHbData, getTbHbDataYap } from '@/api/statistics/ydxcylb'
import type { Data } from '@/api/statistics/ydxcylb'
import { formatNumValue } from '@/utils/utils'
import type { BudgetExecutionFormulaContext } from '@/views/statistics/budgetExecutionAnalysis/indicatorFormula'
import {
  applyZeroDenominatorPlaceholders,
  decorateDynamicColumns,
  fitNumericColumnWidths,
  stripColumnWidths
} from '@/views/statistics/budgetExecutionAnalysis/viewHelpers'
import type { BudgetExecutionAnalysisColumn } from '@/views/statistics/budgetExecutionAnalysis/viewHelpers'
import { formatBudgetExecutionExportSheet } from '@/views/statistics/budgetExecutionAnalysis/exportHelpers'
import { loadBudgetExecutionFormulaContext } from '@/views/statistics/budgetExecutionAnalysis/exportContext'
import { applyFormulaHeaderTooltips } from '@/views/statistics/components/formulaHeader'

interface Result {
  data: any
  msg: string
  success: boolean
}

type TbhbSearchParams = Data & {
  searchType: '1' | '2'
}

interface BaseOpenParams {
  title: string
  xsws: string
  exportName?: string
}

type OpenParams = BaseOpenParams &
  ({ params: TbhbSearchParams; dataSource?: 'standard' } | { params: Parameters<typeof getTbHbDataYap>[0]; dataSource: 'yap' })

interface RowVo {
  id: string
  leaf?: boolean
}

const visible = ref(false)
const loading = ref(false)
const modalTitle = ref('同比环比分析')
const gridRef = ref()
const currentParams = ref<OpenParams | null>(null)
const exportFormulaContext = ref<BudgetExecutionFormulaContext>()
// 懒加载子行时复用本次查询的计算口径，保证分母为 0 的比率同样显示“-”。
const formulaContext = ref<BudgetExecutionFormulaContext>()
// 金额明细固定按万元处理，小数位数沿用调用页面的当前取值，仅在弹窗内展示。
const xsws = ref('XSWS_4')
const xswsDigits = computed(() => {
  const digits = Number(String(xsws.value).split('_')[1])
  return Number.isFinite(digits) ? digits : 4
})
// 表头原始列（已剔除后端下发的 width），装饰与列宽测量都基于它，避免重复请求表头接口。
const rawColumns = ref<BudgetExecutionAnalysisColumn[]>([])

const mapTableRows = (rows: any[] = []) =>
  rows.map((item) => ({
    ...item,
    leaf: item.leaf === '0' || item.leaf === true
  }))

// 按当前小数位数装饰原始表头并按显示值测量列宽。
const applyColumns = (rows: Record<string, unknown>[] = []) => {
  if (!rawColumns.value.length) {
    gridOptions.columns = []
    return
  }
  const columns = fitNumericColumnWidths(decorateDynamicColumns(rawColumns.value, xsws.value, formatNumValue), rows, gridRef.value?.$el, {
    fitTextColumns: true
  }) as any
  // 与主表一致：完成率、同比/环比金额与比率的表头悬停展示计算公式。
  applyFormulaHeaderTooltips(columns)
  gridOptions.columns = columns
}

const requestRows = async (parentId: string | number) => {
  const options = currentParams.value
  if (!options) return []
  try {
    const res: Result =
      options.dataSource === 'yap' ? await getTbHbDataYap({ ...options.params, parentId }) : await getTbHbData({ ...options.params, parentId })
    if (!res.success) {
      ElMessage.error(res.msg)
      return []
    }
    return applyZeroDenominatorPlaceholders(mapTableRows(Array.isArray(res.data) ? res.data : []), formulaContext.value)
  } catch (error) {
    console.error('加载同比环比明细失败', error)
    ElMessage.error('加载同比环比明细失败，请稍后重试')
    return []
  }
}

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  stripe: true,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  rowStyle: ({ row }: any) => ({
    fontWeight: row?.sfjc === 1 || row?.sfjc === '1' ? 'bold' : 'normal'
  }),
  columnConfig: {
    resizable: true
  },
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod: async ({ row }: any) => requestRows(row.id)
  },
  columns: [],
  data: [],
  exportConfig: {
    type: 'xlsx',
    filename: '预算执行统计报表-同比环比分析',
    sheetName: '预算执行统计报表-同比环比分析',
    useStyle: true,
    isColgroup: true
  }
})

const loadData = async () => {
  const options = currentParams.value
  if (!options) return
  loading.value = true
  exportFormulaContext.value = undefined
  formulaContext.value = undefined
  try {
    const { busiType, dwId, dwList, searchType, xmlbIds, indicators } = options.params
    const [columnRes, rows, context] = await Promise.all([
      getDynamicColumnByDwTbHb({ busiType, dwId, dwList, searchType, xmlbIds, indicators }),
      requestRows(options.params.parentId),
      loadBudgetExecutionFormulaContext(options.dataSource === 'yap' ? 'yap' : 'budget', dwId, dwList)
    ])
    if (currentParams.value !== options) return
    if (!columnRes.success) {
      ElMessage.error(columnRes.msg)
      rawColumns.value = []
      gridOptions.columns = []
      gridOptions.data = []
      return
    }
    const columns = Array.isArray(columnRes.data) ? columnRes.data : []
    if (!columns.length) {
      ElMessage.warning('未获取到表头数据')
      rawColumns.value = []
      gridOptions.columns = []
      gridOptions.data = []
      return
    }
    // 同比环比接口固定使用扩展版统计服务，不受外部页面的版本开关影响。
    const effectiveContext = { ...context, extended: true }
    formulaContext.value = effectiveContext
    exportFormulaContext.value = effectiveContext
    // 先在数据层把分母为 0 的比率置为“-”，再按当前显示值测量列宽。
    applyZeroDenominatorPlaceholders(rows, effectiveContext)
    await nextTick()
    if (currentParams.value !== options) return
    // 表头接口下发的 width 不使用：剔除后由前端按表头和本期数据统一测量列宽。
    rawColumns.value = stripColumnWidths(columns)
    applyColumns(rows)
    gridOptions.data = rows
  } catch (error) {
    if (currentParams.value !== options) return
    console.error('加载同比环比数据失败', error)
    ElMessage.error(error instanceof Error ? error.message : '加载同比环比数据失败，请稍后重试')
    rawColumns.value = []
    gridOptions.columns = []
    gridOptions.data = []
  } finally {
    if (currentParams.value === options) loading.value = false
  }
}

const open = (options: OpenParams) => {
  currentParams.value = options
  xsws.value = options.xsws || 'XSWS_4'
  rawColumns.value = []
  gridOptions.columns = []
  gridOptions.data = []
  modalTitle.value = options.title
  const exportName = options.exportName || `预算执行统计报表-${options.title}`
  gridOptions.exportConfig = {
    ...gridOptions.exportConfig,
    filename: exportName,
    sheetName: exportName
  }
  visible.value = true
  loadData()
}

const handleClose = () => {
  visible.value = false
  currentParams.value = null
  exportFormulaContext.value = undefined
  formulaContext.value = undefined
  rawColumns.value = []
  gridOptions.columns = []
  gridOptions.data = []
}

const exportDataHandle = () => {
  if (loading.value) return
  if (!gridOptions.data?.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const $table = gridRef.value
  if (!$table) return
  const context = exportFormulaContext.value
  if (!context) {
    ElMessage.error('请先查询数据后再导出')
    return
  }
  // 列配置已按弹窗内当前的 xsws 装饰，导出沿用同一 formatter 的小数位；
  // 同时按最终显示值自适应导出列宽，避免数字列出现 ####。
  $table.exportData({
    ...gridOptions.exportConfig,
    sheetMethod: (params: any) =>
      formatBudgetExecutionExportSheet(params, context, { includeFormulaExplanations: false, autoFitNumericColumns: false })
  })
}

defineExpose({ open })
</script>

<style scoped lang="less">
// 工具栏与表格布局对齐 TbhbModal（statistics/components/TbhbModal/index.vue）
.tbhb_table {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .tbhb_table_button {
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tbhb_table_main {
    flex: 1;
    min-width: 0;
    min-height: 0;
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

// 单位固定为万元（与页面的查询口径一致），与小数位数并排展示
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
