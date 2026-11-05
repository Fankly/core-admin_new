import { Univer, UniverInstanceType } from '@univerjs/core'
import { ICalculateFormulaService, UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import type { Worksheet } from 'exceljs'

// 使用项目已有的公式引擎验证 XLSX 中的公式，而非只检查导出时保存的缓存结果。
export const recalculateExport = async (sheet: Worksheet, changes: Record<string, number | string> = {}) => {
  const cellData: any = {}
  const formulas: any = {}
  const addresses: Array<{ address: string; row: number; column: number }> = []
  sheet.eachRow((row, rowNumber) => {
    cellData[rowNumber - 1] = {}
    row.eachCell((cell, columnNumber) => {
      const r = rowNumber - 1
      const c = columnNumber - 1
      cellData[r][c] = { v: changes[cell.address] ?? (cell.formula ? cell.result : cell.value) }
      if (cell.formula) {
        cellData[r][c].f = `=${cell.formula}`
        if (!formulas[r]) formulas[r] = {}
        formulas[r][c] = [`=${cell.formula}`]
        addresses.push({ address: cell.address, row: r, column: c })
      }
    })
  })
  // 批量表达式 API 读取引用单元格的缓存值，每轮新建引擎以清除表达式缓存，直到父子公式全部稳定。
  for (let pass = 0; pass <= addresses.length; pass++) {
    const univer = new Univer()
    univer.registerPlugin(UniverFormulaEnginePlugin)
    try {
      univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
        id: 'export',
        sheetOrder: ['sheet'],
        sheets: { sheet: { id: 'sheet', name: 'sheet', rowCount: sheet.rowCount, columnCount: sheet.columnCount, cellData } }
      })
      const engine = univer.__getInjector().get(ICalculateFormulaService)
      const results = await engine.executeFormulas({ export: { sheet: formulas } })
      let changed = false
      const values: Record<string, unknown> = {}
      for (const { address, row, column } of addresses) {
        const value = results.export?.sheet?.[row]?.[column]?.[0].value
        const previous = cellData[row][column]
        if (!Object.is(previous.v, value)) changed = true
        cellData[row][column] = { ...previous, v: value }
        values[address] = value
      }
      if (!changed) return values
    } finally {
      univer.dispose()
    }
  }
  throw new Error('导出公式未能稳定重算，请检查循环引用')
}
