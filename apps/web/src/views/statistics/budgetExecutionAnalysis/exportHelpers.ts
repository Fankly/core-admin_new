import Decimal from 'decimal.js'
import { addCalculationNote } from './calculationNotes'
import { applyExportNumberCell, BudgetExecutionAnalysisColumn, getExportLeafColumns, isNumericColumnValue, parseExportNumber } from './viewHelpers'
import { BudgetExecutionFormulaContext, INDICATOR_FORMULAS, getIndicatorCellFormula, getIndicatorCodeByField } from './indicatorFormula'
import { applyTreeSumFormulas } from './treeExport'
import { ignoreFormulaRangeWarnings } from './exportFormulaWarnings'

// 与 VXE 默认表格主题及 styles/element.less 的表头样式一致。
const BORDER_COLOR = 'FFE8EAEC'
const HEADER_BACKGROUND = 'FFF8F8F9'
const STRIPE_BACKGROUND = 'FFFAFAFA'

// 叶子列序号转 A1 列标（0 → A，26 → AA）
const getCellRefLetter = (leafIndex: number) => {
  let letter = ''
  let rest = leafIndex + 1
  while (rest > 0) {
    letter = String.fromCharCode(65 + ((rest - 1) % 26)) + letter
    rest = Math.floor((rest - 1) / 26)
  }
  return letter
}

interface CellFormulaWriter {
  kind: 'ratio' | 'diff'
  // ratio 型：分子/分母列序号（1-based），按 multiplier 缩放后舍入 scale 位。
  numeratorColumn: number
  denominatorColumn: number
  multiplier: number
  // diff 型：本期/上期列序号（1-based），公式为「本期 − 上期」按 scale 位舍入。
  currentColumn: number
  compareColumn: number
  scale: number
}

interface BudgetExecutionExportOptions {
  // 仅控制附加说明，单元格公式和自动重算始终保留。
  includeFormulaExplanations?: boolean
  autoFitNumericColumns?: boolean
}

const isMissingExportValue = (value: unknown) => value == null || (typeof value === 'string' && ['', '-'].includes(value.trim()))

// 引用列未导出时仍检查原始行中的分母；未查询分母且已有比率时，保留接口返回值。
const hasMissingStaticDenominator = (cell: any, column: BudgetExecutionAnalysisColumn, sourceRow: any, context: BudgetExecutionFormulaContext) => {
  const field = String(column.field || '')
  const code = getIndicatorCodeByField(field)
  const formula = getIndicatorCellFormula(field, context)
  if (!code || !formula || formula.kind !== 'ratio') return false
  const denominatorField = `${field.slice(0, -code.length)}${formula.refs[1]}`
  if (!Object.prototype.hasOwnProperty.call(sourceRow, denominatorField)) return isMissingExportValue(cell.value)
  const denominator = parseExportNumber(sourceRow[denominatorField])
  return denominator === null || denominator === 0
}

// 按指标 code 拆分「分组前缀_指标代码」字段，前缀相同的列视为同一分组（顶层指标前缀为空）。
// 为存在单元格公式的列构造写入器；引用的指标列缺失时返回 undefined，导出静态值。
const buildCellFormulaWriters = (
  exportColumns: BudgetExecutionAnalysisColumn[],
  context: BudgetExecutionFormulaContext
): Array<CellFormulaWriter | undefined> => {
  const fieldIndexMap = new Map<string, number>()
  exportColumns.forEach((column, index) => {
    const field = String(column.field || '')
    if (field && !fieldIndexMap.has(field)) fieldIndexMap.set(field, index)
  })

  return exportColumns.map((column) => {
    const field = String(column.field || '')
    const code = getIndicatorCodeByField(field)
    const cellFormula = getIndicatorCellFormula(field, context)
    if (!code || !cellFormula) return undefined

    if (cellFormula.kind === 'diff') {
      // 同比/环比金额/比率：本期取 CURRENT 标记列、上期取 LAST 标记列。
      // 列 field 形如「ORGID_<org>;INDICATORID_TBHBJE」，去掉「;INDICATORID_TBHBJE」后拼「;CURRENT;INDICATORID_WCZ」/「;LAST;INDICATORID_WCZ」。
      const orgPrefix = field.endsWith(`;INDICATORID_${code}`) ? field.slice(0, -`;INDICATORID_${code}`.length) : ''
      const currentField = `${orgPrefix};CURRENT;INDICATORID_${cellFormula.refs[0]}`
      const compareField = `${orgPrefix};LAST;INDICATORID_${cellFormula.refs[1]}`
      const currentIndex = fieldIndexMap.get(currentField)
      const compareIndex = fieldIndexMap.get(compareField)
      if (currentIndex === undefined || compareIndex === undefined) return undefined
      return {
        kind: 'diff',
        numeratorColumn: 0,
        denominatorColumn: 0,
        multiplier: 1,
        currentColumn: currentIndex + 1,
        compareColumn: compareIndex + 1,
        scale: cellFormula.scale
      }
    }

    const prefix = field.length > code.length ? field.slice(0, field.length - code.length - 1) : ''
    const [numeratorCode, denominatorCode] = cellFormula.refs
    const siblingField = (refCode: string) => (prefix ? `${prefix}_${refCode}` : refCode)
    const numeratorIndex = fieldIndexMap.get(siblingField(numeratorCode))
    const denominatorIndex = fieldIndexMap.get(siblingField(denominatorCode))
    if (numeratorIndex === undefined || denominatorIndex === undefined) return undefined
    return {
      kind: 'ratio',
      numeratorColumn: numeratorIndex + 1,
      denominatorColumn: denominatorIndex + 1,
      multiplier: cellFormula.multiplier,
      currentColumn: 0,
      compareColumn: 0,
      scale: cellFormula.scale
    }
  })
}

const appendFormulaWorksheet = (
  worksheet: any,
  columns: BudgetExecutionAnalysisColumn[],
  border: object,
  formulaWriters: Array<CellFormulaWriter | undefined>
) => {
  const collected: Array<{ title: string; formula: string; status: string }> = []
  const seenCodes = new Set<string>()
  const matches = getExportLeafColumns(columns).map((column, index) => ({
    code: getIndicatorCodeByField(column.field),
    writer: formulaWriters[index]
  }))
  const collect = (list: BudgetExecutionAnalysisColumn[]) => {
    list.forEach((column) => {
      if (!column) return
      if (Array.isArray(column.children) && column.children.length !== 0) {
        collect(column.children)
        return
      }
      const code = getIndicatorCodeByField(column.field)
      if (!code || seenCodes.has(code)) return
      const formula = INDICATOR_FORMULAS[code]
      if (!formula) return
      seenCodes.add(code)
      const applicable = matches.filter((item) => item.code === code)
      const appliedCount = applicable.filter((item) => item.writer).length
      const status = !appliedCount
        ? '当前口径未配置公式或缺少同单位的引用列，保留原值。'
        : appliedCount === applicable.length
        ? '已写入单元格公式，修改引用值后可重算。'
        : '部分单位已写入公式；未配置公式或缺少引用列的单位保留原值。'
      collected.push({ title: String(column.title || code), formula, status })
    })
  }
  collect(columns)
  if (!collected.length) return

  const formulaSheet = worksheet.workbook.addWorksheet('计算公式说明')
  const writeRow = (rowNumber: number, values: string[], isHeader: boolean) => {
    const wrapFormula = !isHeader && values[1].length > 45
    if (wrapFormula) formulaSheet.getRow(rowNumber).height = Math.ceil(values[1].length / 45) * 15
    values.forEach((value, index) => {
      const cell = formulaSheet.getCell(rowNumber, index + 1)
      cell.value = value
      cell.font = { size: isHeader ? 9 : 10.5, bold: isHeader, color: { argb: isHeader ? 'FF303133' : 'FF606266' } }
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: index === 1 && wrapFormula }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isHeader ? HEADER_BACKGROUND : 'FFFFFFFF' } }
      cell.border = border
    })
  }
  writeRow(1, ['指标名称', '计算公式/口径', '单元格公式应用情况'], true)
  collected.forEach((item, index) => writeRow(index + 2, [item.title, item.formula, item.status], false))
  formulaSheet.getColumn(1).width = 26
  formulaSheet.getColumn(2).width = 72
  formulaSheet.getColumn(3).width = 64
}

export const formatBudgetExecutionExportSheet = (
  { options, worksheet, columns, colgroups, datas, $table }: any,
  context: BudgetExecutionFormulaContext | undefined,
  { includeFormulaExplanations = true, autoFitNumericColumns = false }: BudgetExecutionExportOptions = {}
) => {
  if (!context) throw new Error('缺少导出计算口径，请重新查询')
  const exportColumns = getExportLeafColumns(columns)
  const formulaWriters = buildCellFormulaWriters(exportColumns, context)
  const headerRowCount = options.isHeader === false ? 0 : options.isColgroup && colgroups?.length ? colgroups.length : 1
  const { align, headerAlign, rowConfig, stripe, treeConfig } = $table.props
  const border = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } }
  }
  let fixedColumnCount = 0
  for (const column of exportColumns) {
    if (column.fixed !== 'left') break
    fixedColumnCount += 1
  }
  if (headerRowCount || fixedColumnCount) {
    worksheet.views = [{ state: 'frozen', xSplit: fixedColumnCount, ySplit: headerRowCount }]
  }

  worksheet.eachRow((row: any, rowNumber: number) => {
    const isHeader = rowNumber <= headerRowCount
    const exportRow = isHeader ? null : datas[rowNumber - headerRowCount - 1]
    if (!isHeader && !exportRow) return
    const sourceRow = exportRow?._row || exportRow
    const isStripe = !isHeader && stripe && ($table.getVTRowIndex(sourceRow) + 1) % 2 === 0
    if (!isHeader && rowConfig?.height) row.height = rowConfig.height * 0.75

    // includeEmpty 仍可能漏掉行尾空格，按实际导出列补齐整行样式。
    exportColumns.forEach((column, index) => {
      const cell = row.getCell(index + 1)
      if (!isHeader) {
        // 用页面文本设置显示格式，原始数值用于公式计算，避免小额金额先被舍入成零。
        const displayValue = exportRow[String(column.id)]
        if (displayValue !== undefined) cell.value = displayValue
        applyExportNumberCell(cell, sourceRow, column, true)
        if (!formulaWriters[index] && hasMissingStaticDenominator(cell, column, sourceRow, context)) {
          cell.value = '-'
        } else if (isNumericColumnValue(column, 0) && isMissingExportValue(cell.value)) {
          // 空数值按当前列的小数位数补零，名称、编码等文本列不参与。
          cell.value = column.formatter ? column.formatter({ cellValue: 0 }) : '0.00'
          applyExportNumberCell(cell, {}, column, true)
        }
        if (typeof cell.value === 'number') cell.numFmt = `#,##${cell.numFmt}`
      }
      cell.font = {
        ...cell.font,
        size: isHeader ? 9 : 10.5,
        bold: isHeader || sourceRow?.sfjc === 1 || sourceRow?.sfjc === '1',
        color: { argb: isHeader ? 'FF303133' : 'FF606266' }
      }
      cell.alignment = {
        ...cell.alignment,
        ...(isHeader ? { wrapText: false } : {}),
        vertical: 'middle',
        horizontal: isHeader ? column.headerAlign || headerAlign || 'center' : column.align || align || 'center',
        indent: !isHeader && (column.treeNode || column.field === 'name') ? Number(exportRow._level || 0) : 0
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isHeader ? HEADER_BACKGROUND : isStripe ? STRIPE_BACKGROUND : 'FFFFFFFF' }
      }
      cell.border = border
    })
  })

  // 先完成整张表的数值转换及父级汇总，保证比率公式引用的是最终数值。
  const hasTreeFormulas = applyTreeSumFormulas(worksheet, datas, exportColumns, headerRowCount, treeConfig)
  const formulaAddresses: string[] = []
  const numericWidths = new Map<number, number>()
  datas.forEach((exportRow: any, index: number) => {
    const rowNumber = headerRowCount + index + 1
    const row = worksheet.getRow(rowNumber)
    // 所有输入单元格完成数值转换后再写公式，支持指标列重排。
    formulaWriters.forEach((writer, index) => {
      if (!writer) return
      const column = exportColumns[index]
      const cell = row.getCell(index + 1)

      if (writer.kind === 'diff') {
        // 同比/环比金额（TBHBJE）= 本期完成值 − 上期完成值；比率（TBHBL）= 本期完成率 − 上期完成率。
        // 与后端 BudgetStaticsTbHbService.buildData 的 BigDecimal.subtract + ROUND_HALF_UP 口径一致。
        const currentCell = row.getCell(writer.currentColumn)
        const compareCell = row.getCell(writer.compareColumn)
        const currentValue = currentCell.formula ? currentCell.result : currentCell.value
        const compareValue = compareCell.formula ? compareCell.result : compareCell.value
        const currentRef = `${getCellRefLetter(writer.currentColumn - 1)}${rowNumber}`
        const compareRef = `${getCellRefLetter(writer.compareColumn - 1)}${rowNumber}`
        const formula = `IFERROR(ROUND(${currentRef}-${compareRef},${writer.scale}),"-")`
        const result =
          typeof currentValue !== 'number' || typeof compareValue !== 'number'
            ? '-'
            : new Decimal(currentValue).minus(compareValue).toDecimalPlaces(writer.scale, Decimal.ROUND_HALF_UP).toNumber()
        if (typeof cell.value !== 'number') {
          const formatCell = { value: column.formatter ? column.formatter({ cellValue: 0 }) : 0, numFmt: '0' }
          applyExportNumberCell(formatCell, {}, column)
          cell.numFmt = `#,##${formatCell.numFmt}`
        }
        cell.value = { formula, result }
        cell.protection = { ...cell.protection, locked: true }
        return
      }

      const numeratorCell = row.getCell(writer.numeratorColumn)
      const denominatorCell = row.getCell(writer.denominatorColumn)
      const numeratorValue = numeratorCell.formula ? numeratorCell.result : numeratorCell.value
      const denominatorValue = denominatorCell.formula ? denominatorCell.result : denominatorCell.value
      const numerator = `${getCellRefLetter(writer.numeratorColumn - 1)}${rowNumber}`
      const denominator = `${getCellRefLetter(writer.denominatorColumn - 1)}${rowNumber}`
      const isPercentText = typeof cell.value === 'string' && /^-?\d+(?:\.\d+)?%$/.test(cell.value)
      // 先按后端口径舍入，再转换 Excel 百分比格式；小数比率无需再次缩小 100 倍。
      const percentDivisor = isPercentText && writer.multiplier === 100 ? 100 : 1
      const factor = writer.multiplier === 1 ? '' : `*${writer.multiplier}`
      // 空分子已补零；分母为空、为零或引用值无效时，缓存结果和 Excel 重算都显示“-”。
      const formula = `IFERROR(ROUND(${numerator}/${denominator}${factor},${writer.scale})${percentDivisor === 100 ? '/100' : ''},"-")`
      const result =
        typeof numeratorValue !== 'number' || typeof denominatorValue !== 'number' || denominatorValue === 0
          ? '-'
          : new Decimal(numeratorValue)
              .mul(writer.multiplier)
              .div(denominatorValue)
              .toDecimalPlaces(writer.scale, Decimal.ROUND_HALF_UP)
              .div(percentDivisor)
              .toNumber()
      if (isPercentText) {
        const decimals = String(cell.value).split('.')[1]?.replace('%', '').length || 0
        cell.numFmt = decimals ? `0.${'0'.repeat(decimals)}%` : '0%'
      } else if (typeof cell.value !== 'number') {
        const formatCell = { value: column.formatter ? column.formatter({ cellValue: 0 }) : 0, numFmt: '0' }
        applyExportNumberCell(formatCell, {}, column)
        cell.numFmt = `#,##${formatCell.numFmt}`
      }
      cell.value = { formula, result }
      // 覆盖插件默认的未锁定状态，避免 Excel/WPS 提示“未锁定的公式”；不启用工作表保护。
      cell.protection = { ...cell.protection, locked: true }
      if (includeFormulaExplanations) {
        addCalculationNote(cell, {
          title: String(column.title || column.field),
          numeratorTitle: String(exportColumns[writer.numeratorColumn - 1].title || exportColumns[writer.numeratorColumn - 1].field),
          denominatorTitle: String(exportColumns[writer.denominatorColumn - 1].title || exportColumns[writer.denominatorColumn - 1].field),
          numerator: numeratorCell,
          denominator: denominatorCell,
          multiplier: writer.multiplier,
          scale: writer.scale,
          percentDivisor
        })
      }
    })

    // 按最终显示的数字（含公式缓存结果）测量，避免 Excel 显示 ####。
    exportColumns.forEach((column, index) => {
      const cell = row.getCell(index + 1)
      if (cell.formula) formulaAddresses.push(cell.address)
      if (autoFitNumericColumns && !isNumericColumnValue(column, cell.formula ? cell.result : cell.value)) return
      const value = typeof cell.value === 'number' ? cell.value : cell.result
      let displayText: string
      if (typeof value === 'number' && Number.isFinite(value)) {
        const format = cell.numFmt || '0'
        const isPercent = format.endsWith('%')
        const decimals = format.match(/\.(0+)/)?.[1].length || 0
        const [integer, fraction] = new Decimal(value)
          .mul(isPercent ? 100 : 1)
          .toFixed(decimals, Decimal.ROUND_HALF_UP)
          .split('.')
        const groupedInteger = format.includes(',') ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : integer
        displayText = `${groupedInteger}${fraction ? `.${fraction}` : ''}${isPercent ? '%' : ''}`
      } else if (autoFitNumericColumns && isNumericColumnValue(column, cell.value)) {
        displayText = String(cell.value)
      } else {
        return
      }
      // 给加粗合计行和边距留空间；至少 10 字符，避开 ExcelJS 会省略的默认列宽 9。
      const requiredWidth = Math.max(10, Math.ceil(displayText.length * (cell.font?.bold ? 1.1 : 1) + 2))
      const sheetColumn = worksheet.getColumn(index + 1)
      if (autoFitNumericColumns) {
        numericWidths.set(index, Math.max(numericWidths.get(index) || 0, requiredWidth))
      } else {
        sheetColumn.width = Math.max(sheetColumn.width || worksheet.properties.defaultColWidth || 9, requiredWidth)
      }
    })
  })

  // 从底层表头向上补足宽度；分组表头按实际合并跨度分摊到数字列，保持单行。
  if (autoFitNumericColumns) {
    for (let rowNumber = headerRowCount; rowNumber > 0; rowNumber--) {
      const spans = new Map<number, number>()
      if (options.isColgroup) {
        const headers = colgroups?.[rowNumber - 1] || []
        headers.forEach((header: any) => {
          let firstLeaf = header
          while (firstLeaf.childNodes?.length || firstLeaf.children?.length) {
            firstLeaf = (firstLeaf.childNodes?.length ? firstLeaf.childNodes : firstLeaf.children)[0]
          }
          const index = exportColumns.findIndex((column) => column === firstLeaf || (column.id && column.id === firstLeaf.id))
          if (index >= 0) spans.set(index, Number(header._colSpan) || 1)
        })
      }
      exportColumns.forEach((_, index) => {
        const title = worksheet.getRow(rowNumber).getCell(index + 1).text
        if (!title) return
        const indices = Array.from({ length: spans.get(index) || 1 }, (_, offset) => index + offset).filter((i) => i < exportColumns.length)
        const adjustable = indices.filter((i) => numericWidths.has(i))
        if (!adjustable.length) return
        // 中文按双字符计算，并为加粗表头和左右边距留白。
        const titleWidth = Math.ceil(Array.from(title as string).reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? 2 : 1), 0) * 1.1 + 2)
        const totalWidth = indices.reduce((sum, i) => sum + (numericWidths.get(i) || worksheet.getColumn(i + 1).width || 9), 0)
        if (titleWidth > totalWidth) {
          adjustable.forEach((i) => numericWidths.set(i, numericWidths.get(i)! + Math.ceil((titleWidth - totalWidth) / adjustable.length)))
        }
      })
    }
  }

  // 数字列按本次导出内容重新设置，支持收窄；文本列及无数字列沿用原宽度。
  numericWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width
  })

  if (hasTreeFormulas || formulaWriters.some(Boolean)) worksheet.workbook.calcProperties.fullCalcOnLoad = true
  ignoreFormulaRangeWarnings(worksheet, formulaAddresses)
  // 导出附带“计算公式说明”sheet，列出本次结果中出现过的指标及其公式
  if (includeFormulaExplanations) appendFormulaWorksheet(worksheet, columns, border, formulaWriters)
}
