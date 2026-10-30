import Decimal from 'decimal.js'
import type { Worksheet } from 'exceljs'
import type { BudgetExecutionAnalysisColumn } from './viewHelpers'

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
  treeConfig: any
) => {
  if (!treeConfig) return false
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
  rows.forEach((parent, parentIndex) => {
    const children = parent[childrenField]
    if (!Array.isArray(children) || !children.length) return
    const childIndexes = children.map((item: any) => {
      const child = item._row || item
      return rowIndexes.get(child) ?? idIndexes.get(String(child[rowField])) ?? -1
    })
    // 折叠、懒加载或只导出部分子级时，不能用不完整明细覆盖父级总额。
    if (childIndexes.some((index) => index < 0 || index === parentIndex) || new Set(childIndexes).size !== children.length) return

    columns.forEach((column, columnIndex) => {
      const field = String(column.field || '')
      if (!SUM_INDICATORS.some((code) => field === code || field.endsWith(`_${code}`))) return
      const cell = worksheet.getCell(headerRowCount + parentIndex + 1, columnIndex + 1)
      if (typeof cell.value !== 'number') return
      const childCells = childIndexes.map((index) => worksheet.getCell(headerRowCount + index + 1, columnIndex + 1))
      const values = childCells.map((child) => (child.formula ? child.result : child.value))
      if (values.some((value) => typeof value !== 'number' && value !== '-' && value !== '' && value !== null && value !== undefined)) return
      const sum = values.reduce<Decimal>((total, value) => (typeof value === 'number' ? total.add(value) : total), new Decimal(0))
      // 配置可能含跨节点绑定或独立统计值，仅在直属子级与父级对账一致时建立汇总关系。
      if (sum.toNumber() !== cell.value) return
      const formula = getSumFormula(
        cell.address.replace(/\d+$/, ''),
        childCells.map((child) => Number(child.row))
      )
      if (formula.length > 8192) return
      cell.value = { formula, result: sum.toNumber() }
      cell.protection = { ...cell.protection, locked: true }
      hasFormulas = true
    })
  })
  return hasFormulas
}
