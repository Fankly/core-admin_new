export const univerFun = (MIN_DETAIL_ROWS: any) => {
  // ==================== 数据规范化函数 ====================
  /**
   * 规范化数字值
   * @param {*} value - 原始值
   * @returns {number|string} 规范化后的值
   */
  const normalizeNumber = (value: any) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    const text = String(value || '')
      .replace(/,/g, '')
      .trim()
    if (!text) return ''

    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : text
  }

  // ==================== 工具函数 ====================

  /**
   * 安全获取window对象的属性
   * @param {Window} targetWindow - 目标window对象
   * @param {string} path - 属性路径，如'SITE_CONFIG.apiURL'
   * @returns {*} 属性值，获取失败返回undefined
   */
  const safeGetWindowProperty = (targetWindow: any, path: any) => {
    try {
      return path.split('.').reduce((current: any, key: any) => (current == null ? undefined : current[key]), targetWindow)
    } catch (error) {
      return undefined
    }
  }

  // ==================== 公式构建函数 ====================

  /**
   * 生成明细行计算公式
   * 计算公式：数量 × 工日 × 单价 / 工作量
   * @param {number} rowNumber - 行号
   * @returns {string} Excel公式字符串
   */
  const detailFormula = (rowNumber: any) => {
    return `=IFERROR(C${rowNumber}*D${rowNumber}*F${rowNumber}/E${rowNumber},"")`
  }

  /**
   * 生成小计公式
   * @param {number} startRow - 起始行号
   * @param {number} endRow - 结束行号
   * @returns {string} Excel公式字符串
   */
  const subtotalFormula = (startRow: any, endRow: any) => {
    return `=IF(COUNT(G${startRow}:G${endRow})=0,"",SUM(G${startRow}:G${endRow}))`
  }

  // ==================== 单元格创建函数 ====================

  /**
   * 创建文本单元格
   * @param {string} value - 单元格值
   * @param {string} styleName - 样式名称
   * @returns {Object} 单元格对象
   */
  const createTextCell = (value: any, styleName: any) => {
    return { v: value, t: 1, s: styleName }
  }

  /**
   * 创建数字单元格
   * @param {number} value - 单元格值
   * @param {string} styleName - 样式名称
   * @returns {Object} 单元格对象
   */
  const createNumberCell = (value: any, styleName: any) => {
    return { v: value, s: styleName }
  }

  /**
   * 创建值单元格
   * 根据值类型自动选择文本或数字单元格
   * @param {*} value - 单元格值
   * @param {string} styleName - 样式名称
   * @returns {Object} 单元格对象
   */
  const createValueCell = (value: any, styleName: any) => {
    return typeof value === 'number' && Number.isFinite(value) ? createNumberCell(value, styleName) : createTextCell(value || '', styleName)
  }

  /**
   * 根据调色板获取样式映射
   * @param {string} palette - 调色板名称（orange/green）
   * @returns {Object} 样式名称映射对象
   */
  const getPaletteStyles = (palette: any) => {
    return {
      center: palette === 'orange' ? 'orangeCenter' : 'greenCenter',
      left: palette === 'orange' ? 'orangeLeft' : 'greenLeft',
      number: palette === 'orange' ? 'orangeNumber' : 'greenNumber',
      number3: palette === 'orange' ? 'orangeNumber3' : 'greenNumber3', // 新增：三位小数
      calc: palette === 'orange' ? 'calcOrange' : 'calcGreen',
      rate: palette === 'orange' ? 'orangeRate' : 'greenRate'
    }
  }

  /**
   * 创建公式单元格
   * @param {string} formula - Excel公式
   * @param {string} styleName - 样式名称
   * @returns {Object} 单元格对象
   */
  function createFormulaCell(formula: any, styleName: any) {
    return { f: formula, s: styleName }
  }

  /**
   * 转义sheet名称用于公式
   * 将单引号替换为两个单引号
   * @param {string} sheetName - sheet名称
   * @returns {string} 转义后的名称
   */
  const escapeSheetNameForFormula = (sheetName: any) => {
    return String(sheetName || '').replace(/'/g, "''")
  }

  /**
   * 列索引转字母
   * 如：0 -> A, 1 -> B, 26 -> AA
   * @param {number} columnIndex - 列索引（从0开始）
   * @returns {string} 列字母
   */
  const columnIndexToLetter = (columnIndex: any) => {
    let dividend = columnIndex + 1
    let columnLabel = ''

    while (dividend > 0) {
      const modulo = (dividend - 1) % 26
      columnLabel = String.fromCharCode(65 + modulo) + columnLabel
      dividend = Math.floor((dividend - modulo) / 26)
    }

    return columnLabel
  }

  /**
   * 构建单元格引用
   * @param {number} rowNumber - 行号
   * @param {number} columnIndex - 列索引
   * @param {boolean} absoluteColumn - 是否绝对引用列
   * @param {boolean} absoluteRow - 是否绝对引用行
   * @returns {string} 单元格引用字符串
   */
  const buildCellReference = (rowNumber: any, columnIndex: any, absoluteColumn = false, absoluteRow = false) => {
    const columnLabel = columnIndexToLetter(columnIndex)
    const normalizedRowNumber = Number(rowNumber) || 1
    return `${absoluteColumn ? '$' : ''}${columnLabel}${absoluteRow ? '$' : ''}${normalizedRowNumber}`
  }

  // const buildCellReferenceNew = (rowNumber: any, columnIndex: any, absoluteColumn = false, absoluteRow = false) => {
  //   const columnLabel = columnIndexToLetter(columnIndex)
  //   const normalizedRowNumber = Number(rowNumber) || 1
  //   return `${absoluteColumn ? '$' : ''}${columnLabel}${absoluteRow ? '$' : ''}${normalizedRowNumber}`
  // }

  /**
   * 构建sheet范围引用
   * @param {string} sheetName - sheet名称
   * @param {number} startRowNumber - 起始行号
   * @param {number} startColumnIndex - 起始列索引
   * @param {number} endRowNumber - 结束行号
   * @param {number} endColumnIndex - 结束列索引
   * @returns {string} 范围引用字符串
   */
  const buildSheetRangeReference = (sheetName: any, startRowNumber: any, startColumnIndex: any, endRowNumber: any, endColumnIndex: any) => {
    const escapedSheetName = escapeSheetNameForFormula(sheetName)
    const startCell = buildCellReference(startRowNumber, startColumnIndex, true, true)
    const endCell = buildCellReference(endRowNumber, endColumnIndex, true, true)
    return `'${escapedSheetName}'!${startCell}:${endCell}`
  }

  /**
   * 构建VLOOKUP公式
   * @param {string} lookupCellReference - 查找单元格引用
   * @param {string} tableRangeReference - 查找范围引用
   * @param {number} returnColumnIndex - 返回列索引
   * @returns {string} VLOOKUP公式字符串
   */
  const buildLookupFormula = (lookupCellReference: any, tableRangeReference: any, returnColumnIndex: any) => {
    return `=IF(${lookupCellReference}="","",IFERROR(VLOOKUP(${lookupCellReference},${tableRangeReference},${returnColumnIndex},FALSE),""))`
  }

  // const buildLookupFormulaNew = (lookupCellReference: any, tableRangeReference: any, returnColumnIndex: any) => {
  //   return `=IF(${lookupCellReference}="","",IFERROR(VLOOKUP(${lookupCellReference},${tableRangeReference},${returnColumnIndex},FALSE),""))`
  // }

  /**
   * 创建分区布局
   * 计算分区的起始行、结束行等布局信息
   * @param {number} startRowIndex - 起始行索引
   * @param {Array} records - 数据记录数组
   * @param {number} minimumRows - 最小行数
   * @param {number} defaultRows - 无数据默认行数
   * @param {number} capacityCount - 容量行数
   * @returns {Object} 布局信息对象
   */
  const createSectionLayout = (startRowIndex: any, records: any, minimumRows = MIN_DETAIL_ROWS) => {
    const detailCount = Math.max(minimumRows, records.length)
    // const showGuideRow = records.length === 0
    const showGuideRow = false
    const detailStartRowIndex = showGuideRow ? startRowIndex + 1 : startRowIndex
    const detailEndRowIndex = detailStartRowIndex + detailCount - 1

    return {
      sectionStartRowIndex: startRowIndex, // 分区起始行
      showGuideRow, // 是否显示引导行
      guideRowIndex: showGuideRow ? startRowIndex : -1, // 引导行索引
      detailStartRowIndex, // 明细起始行
      detailEndRowIndex, // 明细结束行
      sectionEndRowIndex: detailEndRowIndex // 分区结束行
    }
  }

  // ==================== 单元格数据读取函数 ====================

  /**
   * 获取单元格原始值
   * @param {Object} worksheet - 工作表对象
   * @param {number} rowIndex - 行索引
   * @param {number} columnIndex - 列索引
   * @returns {*} 单元格原始值
   */
  function getCellRawValue(worksheet: any, rowIndex: any, columnIndex: any) {
    return worksheet.getRange(rowIndex, columnIndex, 1, 1).getRawValue()
  }

  /**
   * 获取单元格文本值
   * @param {Object} worksheet - 工作表对象
   * @param {number} rowIndex - 行索引
   * @param {number} columnIndex - 列索引
   * @returns {string} 单元格文本值
   */
  function getCellTextValue(worksheet: any, rowIndex: any, columnIndex: any) {
    const value = getCellRawValue(worksheet, rowIndex, columnIndex)
    return value == null ? '' : String(value).trim()
  }

  /**
   * 设置单元格数据的辅助函数
   * @param {Object} cellData - 单元格数据对象
   * @param {number} rowIndex - 行索引
   * @param {number} columnIndex - 列索引
   * @param {Object} payload - 单元格数据
   */
  function setCell(cellData: any, rowIndex: any, columnIndex: any, payload: any) {
    if (!cellData[rowIndex]) {
      cellData[rowIndex] = {}
    }
    cellData[rowIndex][columnIndex] = payload
  }

  return {
    normalizeNumber,
    safeGetWindowProperty,
    detailFormula,
    subtotalFormula,
    createTextCell,
    createNumberCell,
    createValueCell,
    getPaletteStyles,
    createFormulaCell,
    buildCellReference,
    buildSheetRangeReference,
    buildLookupFormula,
    createSectionLayout,
    getCellRawValue,
    getCellTextValue,
    setCell
  }
}
