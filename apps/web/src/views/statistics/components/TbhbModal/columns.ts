import { formatNumValue } from '@/utils/utils'
import type { TbhbType } from './types'
import { DW_TYPE_ORDER, DW_TYPE_NAME } from './types'
import Decimal from 'decimal.js'
import { ref } from 'vue'
import type { TbhbModalParams } from './types'

export const currentType = ref<TbhbType>('tb')
export const currentParams = ref<TbhbModalParams | null>(null)
const VALUE_DIGITS = () => {
  if (currentParams.value && currentParams.value?.xsws) {
    return Number(currentParams.value?.xsws.split('_')[1])
  }
}
const RATE_DIGITS = 2

// 同期字段前缀：同比用 Qn（去年），环比用 Sy（上月）
export const samePeriodPrefix = () => (currentType.value === 'hb' ? 'Syhj' : 'QnTq')
const isTb = () => currentType.value === 'tb'

const isEmptyValue = (v: any) => v === null || v === undefined || v === ''

const valueFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    return formatNumValue(cellValue, VALUE_DIGITS())
  }
}

const rateFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '0.00'
    return formatNumValue(cellValue, RATE_DIGITS)
  }
}

const zfFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    const num = Number(cellValue)
    if (!Number.isFinite(num)) return formatNumValue(cellValue, VALUE_DIGITS())
    const text = formatNumValue(num, VALUE_DIGITS())
    return num > 0 ? `${text}` : text
  }
}

// 增率（率差）：2 位小数带符号
const zlFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    const num = Number(cellValue)
    if (!Number.isFinite(num)) return formatNumValue(cellValue, RATE_DIGITS)
    const text = formatNumValue(num, RATE_DIGITS)
    return num > 0 ? `${text}` : text
  }
}

const titleContains = (title: any, key: string) => {
  const t = String(title ?? '')
  return t.indexOf(key) !== -1
}

export type ColumnKind = 'value' | 'rate' | 'je' | 'other' | 'bl'

export const getColumnKind = (col: any): ColumnKind => {
  const title = col?.title
  if (titleContains(title, '完成率')) return 'rate'
  if (titleContains(title, '金额')) return 'je'
  if (titleContains(title, '比率')) return 'bl'
  if (titleContains(title, '值')) return 'value'
  return 'other'
}

const TEXT_FIELD_RE = /(code|id|name|type|rownumber)$/i

export const isTextField = (field: any) => {
  const f = String(field || '')
  if (!f) return true
  if (TEXT_FIELD_RE.test(f)) return true
  return false
}

const applyColumnFormat = (col: any) => {
  const kind = getColumnKind(col)
  if (kind === 'value' || kind === 'je') {
    col.align = 'right'
    col.headerAlign = 'center'
    col.formatter = kind === 'je' ? zfFormatter() : valueFormatter()
  } else if (kind === 'rate') {
    col.align = 'center'
    col.headerAlign = 'center'
    col.formatter = rateFormatter()
  } else if (kind === 'bl') {
    col.align = 'center'
    col.headerAlign = 'center'
    col.formatter = zlFormatter()
  }
}

const walkColumns = (columns: any[], cb: (col: any) => void) => {
  if (!Array.isArray(columns)) return
  columns.forEach((col) => {
    if (!col) return
    cb(col)
    if (Array.isArray(col.children) && col.children.length !== 0) {
      walkColumns(col.children, cb)
    }
  })
}

export const getLeafColumns = (columns: any[]): any[] => {
  const result: any[] = []
  walkColumns(columns, (col) => {
    if (!Array.isArray(col.children) || col.children.length === 0) {
      result.push(col)
    }
  })
  return result
}

export const applyServerColumns = (serverColumns: any[], type: TbhbType): any[] => {
  const periodTitle = type === 'tb' ? '去年同期' : '上月同期'
  const zfTitle = type === 'tb' ? '同比增幅' : '环比增幅'
  const FIXED_LEFT_FIELDS = ['rownumber', 'dwName']
  const replaceTitle = (cols: any[]): any[] => {
    if (!Array.isArray(cols)) return []
    return cols.map((col: any) => {
      const newCol = { ...col }
      if (newCol.title === '去年同期' || newCol.title === '上月同期') newCol.title = periodTitle
      if (newCol.title === '同比增幅' || newCol.title === '环比增幅') newCol.title = zfTitle
      if (Array.isArray(newCol.children) && newCol.children.length !== 0) {
        newCol.children = replaceTitle(newCol.children)
      } else {
        if (FIXED_LEFT_FIELDS.includes(newCol.field)) {
          newCol.fixed = 'left'
        }
        applyColumnFormat(newCol)
      }
      return newCol
    })
  }
  return replaceTitle(serverColumns)
}

const toDecimal = (v: any): Decimal => {
  if (isEmptyValue(v)) return new Decimal(0)
  const d = new Decimal(v)
  return d.isFinite() ? d : new Decimal(0)
}

const calcRateField = (row: any, field: string): string => {
  const base = field.replace(/Wcl$/i, '')
  const mbzField = `${base}Mbz`
  const wczField = `${base}Wcz`
  const mbz = Number(row[mbzField])
  const wcz = Number(row[wczField])
  if (Number.isFinite(mbz) && Number.isFinite(wcz) && mbz !== 0) {
    return Decimal.div(wcz, mbz).mul(100).toFixed(RATE_DIGITS)
  }
  return '0.00'
}

const calcZfField = (row: any, field: string): string => {
  const base = isTb() ? field.replace(/TbJe$/i, '') : field.replace(/HbJe$/i, '')
  const wczField = `${base}ByhjWcz`
  const qnWczField = `${base}${samePeriodPrefix()}Wcz`
  const wcz = Number(row[wczField])
  const qnWcz = Number(row[qnWczField])
  if (Number.isFinite(wcz) && Number.isFinite(qnWcz)) {
    const diff = Decimal.sub(wcz, qnWcz).toNumber()
    return `${formatNumValue(diff, VALUE_DIGITS())}`
  }
  return ''
}

// 增率 = 本月完成率 − 同期完成率（率差，2 位小数）
const calcZlField = (row: any, field: string): string => {
  const base = isTb() ? field.replace(/TbPl$/i, '') : field.replace(/HbPl$/i, '')
  const wclField = `${base}ByhjWcl`
  const qnWclField = `${base}${samePeriodPrefix()}Wcl`
  const wcl = Number(row[wclField])
  const qnWcl = Number(row[qnWclField])
  if (Number.isFinite(wcl) && Number.isFinite(qnWcl)) {
    const diff = Decimal.sub(wcl, qnWcl).toNumber()
    return `${formatNumValue(diff, VALUE_DIGITS())}`
  }
  return ''
}

export const getNumericLeafFields = (columns: any[]): any[] => {
  const leaves = getLeafColumns(columns)
  return leaves.filter((col) => {
    const field = col?.field
    if (!field || isTextField(field)) return false
    const kind = getColumnKind(col)
    return kind === 'value' || kind === 'rate' || kind === 'je' || kind === 'bl'
  })
}

interface GroupContext {
  sumRow: any
  detailRows: any[]
}

const collectGroups = (rows: any[], numericLeafCols: any[]): { groups: Map<string, GroupContext>; ungrouped: any[] } => {
  const groups = new Map<string, GroupContext>()
  const ungrouped: any[] = []
  rows.forEach((row) => {
    const dwType = String(row?.dwType ?? '')
    if (!dwType || !DW_TYPE_NAME[dwType]) {
      ungrouped.push(row)
      return
    }
    if (!groups.has(dwType)) {
      groups.set(dwType, { sumRow: { dwName: DW_TYPE_NAME[dwType], dwType: '-1', _isGroupRow: true, _groupType: dwType }, detailRows: [] })
    }
    const ctx = groups.get(dwType)!
    ctx.detailRows.push(row)
    // value 类叶子列（含本月目标值/完成值、同期目标值/完成值）累加一次
    // 同期完成率(rate)、增幅(je)、增率(bl) 不累加，由 finalizeSumRowRates 重算
    numericLeafCols.forEach((col) => {
      const field = col.field
      const kind = getColumnKind(col)
      if (kind === 'value') {
        ctx.sumRow[field] = toDecimal(ctx.sumRow[field]).add(toDecimal(row[field])).toString()
      }
    })
  })
  return { groups, ungrouped }
}

const finalizeSumRowRates = (sumRow: any, numericLeafCols: any[]) => {
  numericLeafCols.forEach((col) => {
    const field = col.field
    const kind = getColumnKind(col)
    if (kind === 'rate') {
      sumRow[field] = calcRateField(sumRow, field)
    } else if (kind === 'je') {
      sumRow[field] = calcZfField(sumRow, field)
    } else if (kind === 'bl') {
      sumRow[field] = calcZlField(sumRow, field)
    }
  })
}

// 从数据末尾分离"待分解"行（后端返回，带真实数值）；若不存在则构造空行
const extractDfjRow = (rows: any[]): { dfjRow: any | null; rest: any[] } => {
  if (!rows || rows.length === 0) return { dfjRow: null, rest: [] }
  const last = rows[rows.length - 1]
  if (last && last.dwName === '待分解') {
    const dfjRow = { ...last, dwType: '-1', _isDfjRow: true }
    return { dfjRow, rest: rows.slice(0, -1) }
  }
  return { dfjRow: null, rest: rows }
}

const buildTotalRow = (allDetailRows: any[], numericLeafCols: any[], dfjRow?: any | null): any => {
  // 合计 = 各组小计（明细行累加）+ 待分解行数值，与 yszxfx 逻辑一致
  const sumRows = dfjRow ? allDetailRows.concat(dfjRow) : allDetailRows
  const totalRow: any = { dwName: '合计', dwType: '-1', _isTotalRow: true }
  // value 类叶子列（含本月目标值/完成值、同期目标值/完成值）累加一次
  // 同期完成率(rate)、增幅(je)、增率(bl) 不累加，由 finalizeSumRowRates 重算
  numericLeafCols.forEach((col) => {
    const field = col.field
    const kind = getColumnKind(col)
    if (kind === 'value') {
      const sum = sumRows.reduce((acc, row) => acc.add(toDecimal(row[field])), new Decimal(0))
      totalRow[field] = sum.toString()
    }
  })
  finalizeSumRowRates(totalRow, numericLeafCols)
  return totalRow
}

export const buildGroupedRows = (rows: any[], columns: any[]): any[] => {
  if (!rows || rows.length === 0) return []
  const numericLeafCols = getNumericLeafFields(columns)
  // 先从数据末尾分离"待分解"行，使其不参与分组小计，但参与合计累加
  const { dfjRow, rest } = extractDfjRow(rows)
  const { groups, ungrouped } = collectGroups(rest, numericLeafCols)

  const result: any[] = []
  DW_TYPE_ORDER.forEach((dwType) => {
    const ctx = groups.get(dwType)
    if (!ctx) return
    finalizeSumRowRates(ctx.sumRow, numericLeafCols)
    result.push(ctx.sumRow)
    ctx.detailRows.forEach((row) => {
      row._parentGroup = dwType
      result.push(row)
    })
  })

  if (ungrouped.length !== 0) {
    ungrouped.forEach((row) => result.push(row))
  }

  const allDetailRows = Array.from(groups.values())
    .flatMap((ctx) => ctx.detailRows)
    .concat(ungrouped)
  if (dfjRow) {
    result.push(dfjRow)
  }
  result.push(buildTotalRow(allDetailRows, numericLeafCols, dfjRow))

  fillRownumber(result)
  return result
}

export const calcZfForRows = (rows: any[]) => {
  rows.forEach((row) => {
    if (row._isGroupRow || row._isTotalRow || row._isDfjRow) return
    if (row.dwName === '待分解') return
    const keys = Object.keys(row)
    keys.forEach((key) => {
      if (/Je$/i.test(key)) {
        if (isEmptyValue(row[key])) row[key] = calcZfField(row, key)
      } else if (/Pl$/i.test(key)) {
        if (isEmptyValue(row[key])) row[key] = calcZlField(row, key)
      }
    })
  })
}

export const fillRownumber = (rows: any[]) => {
  let seq = 1
  rows.forEach((row) => {
    if (row._isGroupRow || row._isTotalRow || row._isDfjRow) {
      row.rownumber = ''
      return
    }
    row.rownumber = seq
    seq += 1
  })
}
