import ExcelJS from 'exceljs'
import { VxeTableInstance } from 'vxe-table'
import { TableCellStyle } from '@/utils/tableCellStyle'
import { ElMessage } from 'element-plus'
import { IObject } from '@/types/interface'

export interface ExportOptions {
  fileName?: string
  isTree?: boolean
  treeNodeField?: string
  colorMapper?: TableCellStyle
  ignoreColumns?: string[]
}

// 计算Excel宽度
/* const calculateExcelColulmnWidth = (col: any) => {
  if (col.width) {
    const pixelWidth = typeof col.width === 'string' ? parseFloat(col.width) : col.width
    return Math.max(8, Math.min(pixelWidth / 7, 100))
  }

  if (col.minWidth) {
    const pixelWidth = typeof col.width === 'string' ? parseFloat(col.minWidth) : col.minWidth
    return Math.max(8, pixelWidth / 7)
  }

  if (col.title || col.label) {
    const titleLength = (col.title || col.label).length
    return Math.max(10, titleLength * 2 + 5)
  }

  return 20
} */

const hexToArgb = (hex: string): string => {
  if (!hex || typeof hex !== 'string') return 'FF000000'
  const normalized = hex.trim()
  if (!/^#?[0-9a-fA-F]{6}$/.test(normalized)) {
    console.warn('Invalid hex color:', hex)
    return 'FF000000'
  }
  return normalized.startsWith('#') ? 'FF' + normalized.substring(1).toUpperCase() : 'FF' + normalized.toUpperCase()
}

const sanitizeExcelValue = (value: unknown): unknown => {
  // 取消安全检查
  // if (typeof value !== 'string') return value
  // return /^[=+\-@]/.test(value) ? `'${value}` : value
  return value
}

export const exportVxeGrid = async (grid: VxeTableInstance, options: ExportOptions = {}) => {
  const { fileName = 'export', isTree = false, treeNodeField = 'name', colorMapper, ignoreColumns = ['seq', 'checkbox', 'radio', 'expand'] } = options

  try {
    const tableDataResult = grid.getTableData()
    if (!tableDataResult) {
      ElMessage.warning('表格未初始化')
      return
    }
    const { tableData } = tableDataResult
    const data = (tableData?.length ?? 0) > 0 ? tableData : grid.getData()

    if (!data || data.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    if (data.length > 5000) {
      ElMessage.warning('数据量较大，导出可能需要较长时间，请耐心等待')
    }

    const tableColumnInfo = grid.getTableColumn()
    const columnsSource =
      tableColumnInfo?.collectColumn && tableColumnInfo.collectColumn.length > 0 ? tableColumnInfo.collectColumn : grid.getColumns()

    if (!columnsSource || columnsSource.length === 0) {
      ElMessage.warning('没有可导出的列')
      return
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    const leafColumns: any[] = []
    const headerRows: any[][] = []
    let maxLevel = 0

    const flattenColumns = (cols: any[], level = 0, parentPath: any[] = []) => {
      cols.forEach((col) => {
        if (!col || col.visible === false) return
        if (col.type && ignoreColumns.includes(col.type as string)) return

        const currentPath = [...parentPath, col]
        if (col.children && col.children.length > 0) {
          flattenColumns(col.children, level + 1, currentPath)
        } else if (col.field) {
          leafColumns.push({ ...col, level, path: currentPath })
          maxLevel = Math.max(maxLevel, level)
        }
      })
    }

    flattenColumns(columnsSource)

    if (leafColumns.length === 0) {
      ElMessage.warning('没有可导出的列')
      return
    }

    worksheet.columns = leafColumns.map((col) => ({ key: col.field, width: 20 }))
    interface HeaderCell {
      title: string
      rowIndex: number
      colIndex: number
      rowspan: number
      colspan: number
    }

    const headerCells: HeaderCell[] = []
    const cellMap = new Map<string, HeaderCell>()

    leafColumns.forEach((leafCol, leafColIndex) => {
      const path = leafCol.path

      path.forEach((col: any, level: number) => {
        const key = `${level}-${leafColIndex}`

        if (cellMap.has(key)) return

        let startCol = leafColIndex

        for (let i = 0; i < leafColIndex; i++) {
          if (leafColumns[i].path[level] === col) {
            startCol = i
            break
          }
        }

        let colspan = 0
        for (let i = 0; i < leafColumns.length; i++) {
          if (leafColumns[i].path[level] === col) {
            colspan++
          }
        }

        const rowspan = col.children && col.children.length > 0 ? 1 : maxLevel - level + 1

        const cell: HeaderCell = {
          title: col.title || '',
          rowIndex: level,
          colIndex: startCol,
          rowspan,
          colspan
        }

        headerCells.push(cell)

        for (let r = 0; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            cellMap.set(`${level + r}-${startCol + c}`, cell)
          }
        }
      })
    })

    for (let rowIndex = 0; rowIndex <= maxLevel; rowIndex++) {
      const excelRow = worksheet.insertRow(rowIndex + 1, [])
      excelRow.height = 32
    }

    const processedCells = new Set<HeaderCell>()

    headerCells.forEach((cell) => {
      if (processedCells.has(cell)) return
      processedCells.add(cell)

      const rowNum = cell.rowIndex + 1
      const colNum = cell.colIndex + 1
      const excelCell = worksheet.getCell(rowNum, colNum)

      excelCell.value = cell.title
      excelCell.font = { bold: true }
      excelCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      excelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F8F9' }
      }
      excelCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }

      if (cell.colspan > 1 || cell.rowspan > 1) {
        const endRow = rowNum + cell.rowspan - 1
        const endCol = colNum + cell.colspan - 1
        worksheet.mergeCells(rowNum, colNum, endRow, endCol)
      }
    })
    const treeColumnIndex = isTree && treeNodeField ? leafColumns.findIndex((col) => col.field === treeNodeField) : -1
    const warnedColumns = new Set<string>()

    data.forEach((row: IObject) => {
      const sanitizedRow: IObject = {}
      leafColumns.forEach((col) => {
        if (col.field) {
          sanitizedRow[col.field] = sanitizeExcelValue(row[col.field])
        }
      })
      const excelRow = worksheet.addRow(sanitizedRow)
      excelRow.height = 32

      excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        cell.font = {
          ...cell.font,
          bold: !!row.leaf
        }
        if (colNumber === treeColumnIndex + 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'right' }
        }
      })
      if (treeColumnIndex !== -1) {
        const cj = row.cj ?? 0
        if (Number(cj) > 0) {
          const cell = excelRow.getCell(treeColumnIndex + 1)
          const rawValue = row[treeNodeField] ?? ''
          cell.value = '   '.repeat(cj) + sanitizeExcelValue(rawValue)
        }
      }

      if (colorMapper) {
        leafColumns.forEach((col, index) => {
          if (!col.field) return

          let style
          try {
            style = colorMapper.getCellStyle(row, col.field)
          } catch (error) {
            if (!warnedColumns.has(col.field)) {
              console.warn(`样式映射失败: ${col.field}`, error)
              warnedColumns.add(col.field)
            }
            return
          }
          if (!style) return

          const cell = excelRow.getCell(index + 1)
          if (style.color) {
            cell.font = {
              ...cell.font,
              color: { argb: hexToArgb(style.color) },
              bold: !!row.leaf
            }
          }

          if (style.backgroundColor) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: hexToArgb(style.backgroundColor) }
            }
          }
        })
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    try {
      link.href = objectUrl
      link.download = `${fileName}.xlsx`
      document.body.appendChild(link)
      link.click()
    } finally {
      if (link.parentNode) {
        document.body.removeChild(link)
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100)
    }
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败')
    throw error
  }
}
