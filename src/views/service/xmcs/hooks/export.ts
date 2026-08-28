import { ElMessage } from 'element-plus'
import ExcelJS from 'exceljs'

export const exportExcel = (
  primarySheetName: any,
  getCurrentSheetImportedData: () => void,
  createWorkbookData: (params1: any, params2: any, params3: any) => void,
  buildCellReference: (params1: any, params2: any) => void,
  currentCatalogData: any,
  currentSourceData: any,
  ALIGN_LEFT: any,
  ALIGN_CENTER: any,
  ALIGN_MIDDLE: any,
  WRAP: any
) => {
  function stripLeadingEquals(formula: any) {
    return String(formula || '').replace(/^=/, '')
  }

  function sanitizeFileNamePart(value: any) {
    return String(value || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
  }

  function buildTimestamp(date = new Date()) {
    const pad = (value: any) => String(value).padStart(2, '0')
    return (
      [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('') +
      `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    )
  }

  function convertPixelWidthToExcelWidth(width: any) {
    if (!Number.isFinite(width) || width <= 0) return undefined
    return Math.max(1, Number((width / 7).toFixed(2)))
  }

  function convertPixelHeightToExcelHeight(height: any) {
    if (!Number.isFinite(height) || height <= 0) return undefined
    return Math.max(1, Number((height * 0.75).toFixed(2)))
  }

  function normalizeExcelArgb(color: any, fallback = 'FF000000') {
    const normalized = String(color || '')
      .trim()
      .replace(/^#/, '')

    if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
      return normalized.toUpperCase()
    }

    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return `FF${normalized.toUpperCase()}`
    }

    return fallback
  }

  function resolveExcelAlignment(styleConfig: any) {
    if (!styleConfig) return undefined

    const alignment: any = {}

    if (styleConfig.ht === ALIGN_LEFT) {
      alignment.horizontal = 'left'
    } else if (styleConfig.ht === ALIGN_CENTER) {
      alignment.horizontal = 'center'
    }

    if (styleConfig.vt === ALIGN_MIDDLE) {
      alignment.vertical = 'middle'
    }

    if (styleConfig.tb === WRAP) {
      alignment.wrapText = true
    }

    return Object.keys(alignment).length ? alignment : undefined
  }

  function resolveExcelBorder(borderConfig: any) {
    if (!borderConfig || typeof borderConfig !== 'object') return undefined

    const border: any = {}
    const borderMap = {
      t: 'top',
      b: 'bottom',
      l: 'left',
      r: 'right'
    }

    Object.entries(borderMap).forEach(([sourceKey, targetKey]) => {
      const edge = borderConfig[sourceKey]
      if (!edge) return

      border[targetKey] = {
        style: 'thin'
      }

      if (edge.cl && edge.cl.rgb) {
        border[targetKey].color = { argb: normalizeExcelArgb(edge.cl.rgb) }
      }
    })

    return Object.keys(border).length ? border : undefined
  }

  function applyExcelJsStyle(excelCell: any, styleConfig: any) {
    if (!styleConfig) return

    const font: any = {}
    if (styleConfig.ff) {
      font.name = styleConfig.ff
    }
    if (Number.isFinite(Number(styleConfig.fs)) && Number(styleConfig.fs) > 0) {
      font.size = Number(styleConfig.fs)
    }
    if (styleConfig.bl) {
      font.bold = true
    }
    if (styleConfig.cl && styleConfig.cl.rgb) {
      font.color = { argb: normalizeExcelArgb(styleConfig.cl.rgb) }
    }
    if (Object.keys(font).length) {
      excelCell.font = font
    }

    if (styleConfig.bg && styleConfig.bg.rgb) {
      excelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: normalizeExcelArgb(styleConfig.bg.rgb) }
      }
    }

    const border = resolveExcelBorder(styleConfig.bd)
    if (border) {
      excelCell.border = border
    }

    const alignment = resolveExcelAlignment(styleConfig)
    if (alignment) {
      excelCell.alignment = alignment
    }

    if (styleConfig.n && styleConfig.n.pattern) {
      excelCell.numFmt = styleConfig.n.pattern
    }
  }

  function createExcelJsCellValue(payload: any) {
    if (!payload) return null

    if (typeof payload.f === 'string' && payload.f) {
      const formulaValue: any = {
        formula: stripLeadingEquals(payload.f)
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'v') && payload.v !== '' && payload.v !== null && payload.v !== undefined) {
        formulaValue.result = payload.v
      }

      return formulaValue
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'v') && payload.v !== '' && payload.v !== null && payload.v !== undefined) {
      return payload.v
    }

    return null
  }

  function applyWorksheetFreeze(worksheet: any, freeze: any) {
    if (!freeze) return

    const xSplit = Number(freeze.xSplit)
    const ySplit = Number(freeze.ySplit)
    if ((!Number.isFinite(xSplit) || xSplit <= 0) && (!Number.isFinite(ySplit) || ySplit <= 0)) return

    const nextView: any = {
      state: 'frozen'
    }

    if (Number.isFinite(xSplit) && xSplit > 0) {
      nextView.xSplit = xSplit
    }

    if (Number.isFinite(ySplit) && ySplit > 0) {
      nextView.ySplit = ySplit
    }

    const startRow = Number(freeze.startRow)
    const startColumn = Number(freeze.startColumn)
    if (Number.isInteger(startRow) && Number.isInteger(startColumn)) {
      nextView.topLeftCell = buildCellReference(startRow + 1, startColumn)
    }

    worksheet.views = [nextView]
  }

  function applySheetModelToExcelJsWorksheet(worksheet: any, sheetModel: any, styleMap: any) {
    const rowCount = Math.max(1, Number(sheetModel && sheetModel.rowCount) || 1)
    const columnCount = Math.max(1, Number(sheetModel && sheetModel.columnCount) || 1)
    worksheet.getCell(rowCount, columnCount)

    Object.entries((sheetModel && sheetModel.cellData) || {}).forEach(([rowIndexText, rowCells]) => {
      const rowIndex = Number(rowIndexText)
      if (!Number.isInteger(rowIndex)) return

      Object.entries(rowCells || {}).forEach(([columnIndexText, payload]) => {
        const columnIndex = Number(columnIndexText)
        if (!Number.isInteger(columnIndex)) return

        const excelCell = worksheet.getCell(rowIndex + 1, columnIndex + 1)
        const cellValue = createExcelJsCellValue(payload)

        if (cellValue !== null && cellValue !== 'null') {
          excelCell.value = cellValue
        }

        const styleConfig = payload && payload.s ? styleMap[payload.s] : null
        applyExcelJsStyle(excelCell, styleConfig)
      })
    })

    if (Array.isArray(sheetModel && sheetModel.mergeData) && sheetModel.mergeData.length) {
      sheetModel.mergeData.forEach(({ startRow, endRow, startColumn, endColumn }: any) => {
        worksheet.mergeCells(startRow + 1, startColumn + 1, endRow + 1, endColumn + 1)
      })
    }

    Object.entries((sheetModel && sheetModel.columnData) || {}).forEach(([columnIndexText, columnConfig]: any) => {
      const columnIndex = Number(columnIndexText)
      const width = convertPixelWidthToExcelWidth(Number(columnConfig && columnConfig.w))
      if (!Number.isInteger(columnIndex) || !width) return
      worksheet.getColumn(columnIndex + 1).width = width
    })

    Object.entries((sheetModel && sheetModel.rowData) || {}).forEach(([rowIndexText, rowConfig]: any) => {
      const rowIndex = Number(rowIndexText)
      const height = convertPixelHeightToExcelHeight(Number(rowConfig && rowConfig.h))
      if (!Number.isInteger(rowIndex) || !height) return
      worksheet.getRow(rowIndex + 1).height = height
    })

    applyWorksheetFreeze(worksheet, sheetModel && sheetModel.freeze)
  }

  function createExportWorkbook(importedData: any) {
    const workbookData: any = createWorkbookData(importedData, currentCatalogData, currentSourceData.value)
    const exportWorkbook = new ExcelJS.Workbook()
    exportWorkbook.created = new Date()
    exportWorkbook.modified = new Date()
    exportWorkbook.creator = 'core-admin'
    exportWorkbook.lastModifiedBy = 'core-admin'
    exportWorkbook.calcProperties.fullCalcOnLoad = true
    workbookData.sheetOrder.forEach((sheetId: any) => {
      const sheetModel = workbookData.sheets[sheetId]
      if (!sheetModel) return

      const worksheet = exportWorkbook.addWorksheet(sheetModel.name || sheetId)
      if (sheetModel.hidden) {
        worksheet.state = 'hidden'
      }

      applySheetModelToExcelJsWorksheet(worksheet, sheetModel, workbookData.styles || {})
    })

    return exportWorkbook
  }

  function downloadWorkbookBuffer(buffer: any, fileName: any) {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 0)
  }

  function buildExportFileName() {
    const nameParts = [sanitizeFileNamePart(primarySheetName)]
    nameParts.push(buildTimestamp())
    return `${nameParts.filter(Boolean).join('-')}.xlsx`
  }

  async function handleExport() {
    try {
      if (!ExcelJS || typeof ExcelJS.Workbook !== 'function') {
        ElMessage.error('导出组件未就绪，请刷新页面后重试。')
        return
      }

      ElMessage.info('正在导出表格...')

      await new Promise((resolve) => window.setTimeout(resolve, 0))

      const latestImportedData: any = getCurrentSheetImportedData()
      const tableData = latestImportedData.map((sheet: any) => sheet[0])
      const exportWorkbook = createExportWorkbook(tableData)

      const exportFileName = buildExportFileName()
      const exportBuffer = await exportWorkbook.xlsx.writeBuffer()
      downloadWorkbookBuffer(exportBuffer, exportFileName)

      ElMessage.success(`已导出 ${exportFileName}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败，请稍后重试。'
      ElMessage.error(message)
    }
  }

  return {
    handleExport
  }
}
