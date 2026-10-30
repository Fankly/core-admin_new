import { formatNumValue } from '@/utils/utils'

const RATE_DIGITS = 2
const VALUE_DIGITS = 2

const isEmptyValue = (v: any) => v === null || v === undefined || v === '' || v === '-'

const titleContains = (title: any, key: string) => {
  const t = String(title ?? '')
  return t.indexOf(key) !== -1
}

// 判断列类型：完成率→rate；金额→je；比率→bl；值→value；其余→other
export type ColumnKind = 'value' | 'rate' | 'je' | 'bl' | 'other'
export const getColumnKind = (col: any): ColumnKind => {
  const title = col?.title
  if (titleContains(title, '完成率')) return 'rate'
  if (titleContains(title, '金额')) return 'je'
  if (titleContains(title, '比率')) return 'bl'
  if (titleContains(title, '值')) return 'value'
  return 'other'
}

// 递归展平多级表头，获取叶子列列表
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

const isTextField = (field: any) => {
  const f = String(field || '')
  if (!f) return true
  if (/(code|id|name|type|rownumber)$/i.test(f)) return true
  return false
}

const valueFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    return formatNumValue(cellValue, VALUE_DIGITS)
  }
}

const rateFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    return formatNumValue(cellValue, RATE_DIGITS)
  }
}

// 金额（增幅）格式化
const jeFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    return formatNumValue(cellValue, VALUE_DIGITS)
  }
}

// 比率（率差）格式化
const blFormatter = () => {
  return ({ cellValue }: any) => {
    if (isEmptyValue(cellValue)) return '-'
    return formatNumValue(cellValue, RATE_DIGITS)
  }
}

// 对表头应用格式化：值列右对齐两位小数；率/比率列居中两位小数；金额列右对齐两位小数
export const applyColumnFormat = (serverColumns: any[]): any[] => {
  const process = (cols: any[]): any[] => {
    if (!Array.isArray(cols)) return []
    return cols.map((col: any) => {
      const newCol = { ...col }
      if (Array.isArray(newCol.children) && newCol.children.length !== 0) {
        newCol.children = process(newCol.children)
      } else {
        const kind = getColumnKind(newCol)
        if (kind === 'value' || kind === 'je') {
          newCol.align = 'right'
          newCol.headerAlign = 'center'
          newCol.formatter = kind === 'je' ? jeFormatter() : valueFormatter()
        } else if (kind === 'rate' || kind === 'bl') {
          newCol.align = 'center'
          newCol.headerAlign = 'center'
          newCol.formatter = kind === 'bl' ? blFormatter() : rateFormatter()
        }
        if (newCol.field === 'dwName' || newCol.field === 'xmlx') {
          newCol.fixed = 'left'
        }
      }
      return newCol
    })
  }
  return process(serverColumns)
}

// 填充序号
const fillRownumber = (rows: any[]) => {
  let seq = 1
  rows.forEach((row) => {
    row.rownumber = seq
    seq += 1
  })
}

// 组装表格数据
export const buildRows = (rows: any[]): any[] => {
  if (!rows || rows.length === 0) return []
  fillRownumber(rows)
  return rows
}
