import Decimal from 'decimal.js'
import type { Worksheet } from 'exceljs'
import type { BudgetExecutionAnalysisColumn } from './viewHelpers'
import type { BudgetExecutionSummaryRows } from './summaryConfig'
import { isStaticExportRow } from './exportRowRules'

// 与后端 IndicatorEnum 的金额、数量指标对应；比率和未知自定义指标不能直接相加。
const SUM_INDICATORS = [
  'MBZ',
  'PHMBZ',
  'DFJ',
  'NDDFJ',
  'LXZ',
  'WCZ',
  'YJQNWCZ',
  'YJJY',
  'MBZ_NEW',
  'PHTZFD',
  'XMSL',
  'GBSL',
  'YKGXMSL',
  'YZTBXMSL',
  'HTQDXMSL',
  'YFJ',
  'ZWZZBJE',
  'ZFWZBJE',
  'ZWZHTJE',
  'ZFWHTJE',
  'YGBXMSFYS'
]

const getSumFormula = (column: string, rowNumbers: number[]) => {
  const ranges: string[] = []
  const sorted = [...rowNumbers].sort((a, b) => a - b)
  for (let index = 0; index < sorted.length; index++) {
    const start = sorted[index]
    let end = start
    while (sorted[index + 1] === end + 1) end = sorted[++index]
    ranges.push(start === end ? `${column}${start}` : `${column}${start}:${column}${end}`)
  }
  // Excel 单个函数最多接收 255 个参数；不连续子级较多时分组求和。
  const groups: string[] = []
  for (let index = 0; index < ranges.length; index += 255) groups.push(`SUM(${ranges.slice(index, index + 255).join(',')})`)
  return groups.join('+')
}

export const applyTreeSumFormulas = (
  worksheet: Worksheet,
  datas: any[],
  columns: BudgetExecutionAnalysisColumn[],
  headerRowCount: number,
  treeConfig: any,
  summaryRows?: BudgetExecutionSummaryRows,
  previousSummaryRows?: BudgetExecutionSummaryRows,
  formulaAddresses?: Set<string>
) => {
  if (!treeConfig && !summaryRows) return false
  treeConfig = treeConfig || {}
  const childrenField = treeConfig.children || treeConfig.childrenField || 'children'
  const rowField = treeConfig.rowField || 'id'
  const rows = datas.map((item) => item._row || item)
  const rowIndexes = new Map(rows.map((row, index) => [row, index]))
  const idIndexes = new Map<string, number>()
  rows.forEach((row, index) => {
    if (row[rowField] === undefined || row[rowField] === null) return
    const id = String(row[rowField])
    // 重复 ID 不作为匹配依据，优先用 VXE 保留的原始行引用。
    idIndexes.set(id, idIndexes.has(id) ? -1 : index)
  })
  let hasFormulas = false
  const relationships = rows.map((parent, parentIndex) => {
    if (isStaticExportRow(parent)) return { currentIndexes: [], previousIndexes: [] }
    // 在完整性检查前排除标记行；即使该行未导出，也不影响其他子项汇总。
    const children = Array.isArray(parent[childrenField]) ? parent[childrenField].filter((item: any) => !isStaticExportRow(item._row || item)) : []
    const resolveIndexes = (relations?: BudgetExecutionSummaryRows): number[] => {
      const configuredRefs = relations?.get(String(parent[rowField]))
      if (relations ? !configuredRefs?.length : !Array.isArray(children) || !children.length) return []
      const indexes: number[] = relations
        ? configuredRefs!.map((id) => idIndexes.get(id) ?? -1).filter((index) => index < 0 || !isStaticExportRow(rows[index]))
        : children.map((item: any) => {
            const child = item._row || item
            return rowIndexes.get(child) ?? idIndexes.get(String(child[rowField])) ?? -1
          })
      // 折叠、懒加载或只导出部分子级时，不能用不完整明细覆盖父级总额。
      if (indexes.some((index) => index < 0 || index === parentIndex)) return []
      return !relations && new Set(indexes).size !== children.length ? [] : indexes
    }
    const currentIndexes = resolveIndexes(summaryRows)
    const previousIndexes = previousSummaryRows ? resolveIndexes(previousSummaryRows) : currentIndexes

    return { currentIndexes, previousIndexes }
  })
  columns.forEach((column, columnIndex) => {
    const field = String(column.field || '')
    if (!SUM_INDICATORS.some((code) => field === code || field.endsWith(`_${code}`))) return
    const visited = new Set<number>()
    const visiting = new Set<number>()
    // 按引用关系先算子级，再算父级，保证取消原值对账后公式缓存也立即正确。
    const calculate = (parentIndex: number): boolean => {
      if (visited.has(parentIndex)) return true
      if (visiting.has(parentIndex)) return false
      visiting.add(parentIndex)
      const { currentIndexes, previousIndexes } = relationships[parentIndex]
      const childIndexes = field.includes(';LAST;') ? previousIndexes : currentIndexes
      if (childIndexes.some((index) => !calculate(index))) return false
      visiting.delete(parentIndex)
      visited.add(parentIndex)
      if (!childIndexes.length) return true
      const cell = worksheet.getCell(headerRowCount + parentIndex + 1, columnIndex + 1)
      const childCells = childIndexes.map((index) => worksheet.getCell(headerRowCount + index + 1, columnIndex + 1))
      if (childIndexes.some((index, childIndex) => !Object.prototype.hasOwnProperty.call(rows[index], field) && !childCells[childIndex].formula))
        return true
      const values = childCells.map((child) => (child.formula ? child.result : child.value))
      if (values.some((value) => typeof value !== 'number' && value !== '-' && value !== '' && value !== null && value !== undefined)) return true
      const sum = values.reduce<Decimal>((total, value) => (typeof value === 'number' ? total.add(value) : total), new Decimal(0))
      const formula = getSumFormula(
        cell.address.replace(/\d+$/, ''),
        childCells.map((child) => Number(child.row))
      )
      if (formula.length > 8192) return true
      cell.value = { formula, result: sum.toNumber() }
      formulaAddresses?.add(cell.address)
      cell.protection = { ...cell.protection, locked: true }
      hasFormulas = true
      return true
    }
    rows.forEach((_, index) => calculate(index))
  })
  return hasFormulas
}
