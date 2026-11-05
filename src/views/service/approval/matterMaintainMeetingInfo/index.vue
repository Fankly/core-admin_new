<template>
  <div class="matter-meeting-report" v-loading="loading">
    <div class="report-toolbar">
      <div class="report-toolbar__info">
        <em v-if="meetingId"><strong>会议ID：</strong>{{ meetingId }}</em>
        <em v-if="meetingName"><strong>会议名称：</strong>{{ meetingName }}</em>
      </div>
      <div class="report-toolbar__actions">
        <el-button size="mini" type="primary" plain @click="loadData">刷 新</el-button>
        <el-button size="mini" type="primary" plain :disabled="tableData.length === 0" @click="handleExport">导 出</el-button>
      </div>
    </div>
    <div class="report-table">
      <vxe-grid v-bind="gridOptions" />
    </div>
  </div>
</template>

<script setup lang="ts" name="/service/approval/matterMaintainMeetingInfo/index">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import ExcelJS from 'exceljs'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import { getMatterMeetingReviewInfoList } from '@/api/service/approval/matterMaintainMeetingInfo'
import { formatNumValue } from '@/utils/utils'
import { useReviewModeCode } from '@/hooks/useReviewModeCode'

type CellValue = string | number | boolean | null | undefined
type Align = 'left' | 'center' | 'right'
type FormatterType = 'text' | 'amount' | 'percent' | 'reviewMode'
type RawRow = Record<string, unknown>

type ReportField =
  | 'meetingStatus'
  | 'meetingCode'
  | 'pspcName'
  | 'meetingName'
  | 'bmName'
  | 'projectTypeName'
  | 'budgetMatterName'
  | 'reviewProjectCount'
  | 'initialApplyAmount'
  | 'firstMeetingAmount'
  | 'approvedAmount'
  | 'reducedAmount'
  | 'reductionRate'
  | 'reviewProjectPassCount'
  | 'outboundAmount'
  | 'outboundCount'
  | 'notOutboundAmount'
  | 'notOutboundCount'
  | 'financeExpertInfo'
  | 'reviewExpertCount'
  | 'reviewMode'
  | 'meetingAddr'
  | 'organizer'
  | 'phone'
  | 'budgetSource'
  | 'lhhsSkTime'
  | 'lhhsOneStartTime'
  | 'lhhsOneEndTime'
  | 'lhhsTwoStartTime'
  | 'lhhsTwoEndTime'
  | 'majorName'

type ReportRow = RawRow &
  Record<ReportField, CellValue> & {
    rowKey: string
    meetingId: CellValue
  }

interface ReportColumn {
  field: ReportField
  title: string
  width: number
  align?: Align
  formatter?: FormatterType
  sources?: string[]
  merge?: boolean
}

interface PageResult {
  data?: unknown
}

interface SpanParams {
  row: ReportRow
  _rowIndex: number
  column: {
    field?: string
  }
  visibleData: ReportRow[]
}

const EXCEL_FILE_NAME = '联会会审会议按预算事项统计报表.xlsx'
const EXCEL_SHEET_NAME = '会审信息'
const HEADER_ROW_COUNT = 1

const route = useRoute()
const loading = ref(false)
const tableData = ref<ReportRow[]>([])
const { loadReviewModeOptions, getReviewModeName } = useReviewModeCode()

const meetingId = computed(() => String(route.query.meetingId || ''))

const meetingName = computed(() => String(route.query.meetingName || ''))
const isEmptyValue = (value: unknown) => value === undefined || value === null || value === ''

const formatText = (value: unknown) => {
  if (isEmptyValue(value)) return '-'
  return String(value)
}

const formatAmount = (value: unknown) => {
  if (isEmptyValue(value)) return '-'
  return formatNumValue(value as string | number, 6) as string
}

const formatPercent = (value: unknown) => {
  if (isEmptyValue(value)) return '-'
  const text = String(value)
  return text.includes('%') ? text : `${text}%`
}

const formatReviewMode = (value: unknown) => {
  return getReviewModeName(value, formatText(value))
}

const formatters: Record<FormatterType, (value: unknown) => string> = {
  text: formatText,
  amount: formatAmount,
  percent: formatPercent,
  reviewMode: formatReviewMode
}

const reportColumns: ReportColumn[] = [
  { field: 'meetingStatus', title: '会议状态', width: 110, align: 'center', sources: ['meetingStatus'], merge: true },
  { field: 'meetingCode', title: '会议编号', width: 140, align: 'center', merge: true },
  { field: 'pspcName', title: '评审批次', width: 220, align: 'center', sources: ['pspcName'], merge: true },
  { field: 'meetingName', title: '会议名称', width: 260, align: 'center', merge: true },
  { field: 'bmName', title: '专业部门', width: 160, align: 'center', sources: ['bmName'], merge: true },
  { field: 'projectTypeName', title: '项目类别', width: 180, align: 'center', sources: ['protypeName'] },
  { field: 'budgetMatterName', title: '预算事项', width: 220, align: 'center', sources: ['yssxName'] },
  { field: 'reviewProjectCount', title: '评审项目数量', width: 120, align: 'center', sources: ['psxmsl'] },
  { field: 'initialApplyAmount', title: '初始申报金额（万元）', width: 170, align: 'right', formatter: 'amount', sources: ['cssbje'] },
  {
    field: 'firstMeetingAmount',
    title: '首次纳会金额（万元）',
    width: 170,
    align: 'right',
    formatter: 'amount',
    sources: ['scnhje', 'firstNhAmount']
  },
  { field: 'approvedAmount', title: '审定金额（万元）', width: 150, align: 'right', formatter: 'amount', sources: ['sdje'] },
  { field: 'reducedAmount', title: '核减金额（万元）', width: 150, align: 'right', formatter: 'amount', sources: ['jhje'] },
  { field: 'reductionRate', title: '项目金额核减率', width: 140, align: 'right', formatter: 'percent', sources: ['hjl', 'amountReductionRate'] },
  { field: 'reviewProjectPassCount', title: '评审项目通过数量', width: 150, align: 'center', sources: ['pstgsl'] },
  { field: 'outboundAmount', title: '已出库金额（万元）', width: 160, align: 'right', formatter: 'amount', sources: ['yckje'] },
  { field: 'outboundCount', title: '已出库数量', width: 120, align: 'center', sources: ['ycksl'] },
  { field: 'notOutboundAmount', title: '未出库金额（万元）', width: 160, align: 'right', formatter: 'amount', sources: ['wckje'] },
  { field: 'notOutboundCount', title: '未出库数量', width: 120, align: 'center', sources: ['wcksl'] },
  { field: 'financeExpertInfo', title: '财务专家信息', width: 220, align: 'center', sources: ['cwzj'] },
  { field: 'reviewExpertCount', title: '评审专家人数', width: 120, align: 'center', sources: ['pszjrs'] },
  { field: 'reviewMode', title: '评审模式', width: 110, align: 'center', formatter: 'reviewMode', sources: ['psmsName', 'psms'] },
  { field: 'meetingAddr', title: '会议地点', width: 180, align: 'center' },
  { field: 'organizer', title: '组织人', width: 100, align: 'center' },
  { field: 'phone', title: '组织电话', width: 130, align: 'center' },
  { field: 'budgetSource', title: '预算来源', width: 120, align: 'center', sources: ['yslyName', 'ysly'] },
  { field: 'lhhsSkTime', title: '需求申请与提报截止日期', width: 190, align: 'center' },
  { field: 'lhhsOneStartTime', title: '线上预审开始日期', width: 170, align: 'center' },
  { field: 'lhhsOneEndTime', title: '线上预审结束日期', width: 170, align: 'center' },
  { field: 'lhhsTwoStartTime', title: '线下会审开始日期', width: 170, align: 'center' },
  { field: 'lhhsTwoEndTime', title: '线下会审结束日期', width: 170, align: 'center' },
  { field: 'majorName', title: '评审专业', width: 200, align: 'center', sources: ['major'] }
]

const mergeFields = reportColumns.filter((column) => column.merge).map((column) => column.field)
const mergeColumnIndexes = reportColumns.reduce<number[]>((indexes, column, index) => {
  if (column.merge) indexes.push(index + 1)
  return indexes
}, [])

const getColumnSources = (column: ReportColumn) => [column.field, ...(column.sources || [])]

const getFirstValue = (row: RawRow | undefined, fields: string[], defaultValue: CellValue = ''): CellValue => {
  for (const field of fields) {
    const value = row?.[field]
    if (!isEmptyValue(value)) return value as CellValue
  }
  return defaultValue
}

const normalizeRow = (rawRow: RawRow, index: number): ReportRow => {
  const row = {
    ...rawRow,
    rowKey: `${getFirstValue(rawRow, ['meetingId', 'id'], meetingId.value)}-${index}`,
    meetingId: getFirstValue(rawRow, ['meetingId', 'id'])
  } as ReportRow

  reportColumns.forEach((column) => {
    row[column.field] = getFirstValue(rawRow, getColumnSources(column))
  })

  return row
}

const formatCell = (row: ReportRow, column: ReportColumn) => {
  const formatter = formatters[column.formatter || 'text']
  return formatter(row[column.field])
}

const getGroupKey = (row: ReportRow | undefined) => {
  if (!row) return ''
  return row.meetingId || [row.meetingCode, row.pspcName, row.meetingName, row.bmName].join('|')
}

const spanMethod = ({ row, _rowIndex, column, visibleData }: SpanParams) => {
  const field = column.field
  if (!field || !mergeFields.includes(field as ReportField)) return undefined

  const currentKey = getGroupKey(row)
  const prevRow = visibleData[_rowIndex - 1]
  if (prevRow && getGroupKey(prevRow) === currentKey) {
    return { rowspan: 0, colspan: 0 }
  }

  let rowspan = 1
  for (let index = _rowIndex + 1; index < visibleData.length; index++) {
    const nextRow = visibleData[index]
    if (!nextRow || getGroupKey(nextRow) !== currentKey) break
    rowspan++
  }

  return rowspan > 1 ? { rowspan, colspan: 1 } : undefined
}

const gridOptions = reactive<VxeGridProps<ReportRow>>({
  border: true,
  autoResize: true,
  showOverflow: true,
  height: '100%',
  align: 'center',
  data: tableData.value,
  spanMethod,
  rowConfig: {
    height: 36,
    keyField: 'rowKey'
  },
  scrollY: {
    enabled: true,
    gt: 100
  },
  scrollX: {
    enabled: true,
    gt: 12
  },
  columns: reportColumns.map((column) => ({
    field: column.field,
    title: column.title,
    width: column.width,
    align: column.align || 'center',
    headerAlign: 'center',
    formatter: ({ row }: { row: ReportRow }) => formatCell(row, column)
  }))
})

const setTableData = (rows: ReportRow[]) => {
  tableData.value = rows
  gridOptions.data = rows
}

const extractRows = (res: PageResult) => {
  const data = res?.data as any
  if (Array.isArray(data)) return data as RawRow[]
  if (Array.isArray(data?.records)) return data.records as RawRow[]
  if (Array.isArray(data?.list)) return data.list as RawRow[]
  return []
}

const loadData = async () => {
  if (!meetingId.value) {
    setTableData([])
    ElMessage.warning('缺少会议ID，无法查询会审信息')
    return
  }

  loading.value = true
  try {
    const res = await getMatterMeetingReviewInfoList({
      meetingId: meetingId.value,
      dwId: String(route.query.dwId || ''),
      bmId: String(route.query.bmId || ''),
      roleId: String(route.query.roleId || ''),
      roleCode: String(route.query.roleCode || '')
    })
    if (!res.success) throw new Error(res.msg)
    setTableData(extractRows(res).map(normalizeRow))
    if (tableData.value.length === 0) ElMessage.warning('暂无数据')
  } catch (error) {
    setTableData([])
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const getExcelColumnWidth = (column: ReportColumn) => Math.max(12, Math.ceil(column.width / 8))

const downloadWorkbook = async (workbook: ExcelJS.Workbook, fileName: string) => {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
  } finally {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

const applyExcelMerge = (worksheet: ExcelJS.Worksheet, rows: ReportRow[]) => {
  let startIndex = 0

  while (startIndex < rows.length) {
    const currentKey = getGroupKey(rows[startIndex])
    let endIndex = startIndex
    while (endIndex + 1 < rows.length && getGroupKey(rows[endIndex + 1]) === currentKey) {
      endIndex++
    }

    if (endIndex > startIndex) {
      mergeColumnIndexes.forEach((colIndex) => {
        worksheet.mergeCells(HEADER_ROW_COUNT + startIndex + 1, colIndex, HEADER_ROW_COUNT + endIndex + 1, colIndex)
      })
    }
    startIndex = endIndex + 1
  }
}

const styleWorksheet = (worksheet: ExcelJS.Worksheet) => {
  worksheet.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 28 : 24
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: rowNumber === 1 ? 'center' : reportColumns[colNumber - 1]?.align || 'left',
        wrapText: true
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      if (rowNumber === 1) {
        cell.font = { bold: true }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F7FA' }
        }
      }
    })
  })
}

const handleExport = async () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  loading.value = true
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(EXCEL_SHEET_NAME)
    worksheet.columns = reportColumns.map((column) => ({
      key: column.field,
      width: getExcelColumnWidth(column)
    }))
    worksheet.addRow(reportColumns.map((column) => column.title))
    tableData.value.forEach((row) => {
      worksheet.addRow(reportColumns.map((column) => formatCell(row, column)))
    })
    applyExcelMerge(worksheet, tableData.value)
    styleWorksheet(worksheet)

    await downloadWorkbook(workbook, EXCEL_FILE_NAME)
  } catch (error) {
    ElMessage.error((error as Error).message || '导出失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadReviewModeOptions()
  if (route.query.roleId) {
    loadData()
  } else {
    ElMessage.warning('缺少角色信息，无法查询会审信息')
  }
})
</script>

<style scoped lang="less">
.matter-meeting-report {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  background: #fff;
}

.report-toolbar {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  margin-bottom: 8px;
}

.report-toolbar__info {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
  color: #303133;
  font-size: 14px;
  font-weight: 600;

  em {
    color: #606266;
    font-style: normal;
    font-weight: 400;
  }
}

.report-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.report-table {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
