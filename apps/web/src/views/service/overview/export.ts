import Decimal from 'decimal.js'

export interface OverviewExportSheet {
  name: string
  columns: { title: string; amount?: boolean; numFmt?: string }[]
  rows: (string | number | null)[][]
}

// 普通金额仍按数值写入；超过 Excel 的 15 位有效数字或转 Number 会改变原值时保留文本。
const toNumericCell = (value: string | number | null | undefined): string | number => {
  if (value === null || value === undefined) return '--'
  if (typeof value === 'number') return value
  const text = String(value).trim()
  if (!text || text === '--' || text === '-') return '--'
  try {
    const decimal = new Decimal(text)
    const number = Number(text)
    return decimal.isFinite() && decimal.precision() <= 15 && Number.isFinite(number) && decimal.equals(new Decimal(number)) ? number : text
  } catch {
    return text
  }
}

export const downloadOverviewTables = async (filename: string, sheets: OverviewExportSheet[]) => {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  sheets.forEach(({ name, columns, rows }) => {
    const sheet = workbook.addWorksheet(name)
    sheet.columns = columns.map((column) => ({ header: column.title, width: 24 }))
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
    rows.forEach((row) =>
      sheet.addRow(
        row.map((value, columnIndex) => {
          const column = columns[columnIndex]
          // numFmt 为 '@' 表示文本列；其它数值列只在不丢精度时转换。
          if (column?.numFmt && column.numFmt !== '@') return toNumericCell(value)
          return value ?? '--'
        })
      )
    )
    sheet.eachRow((row, rowNumber) => {
      row.height = 28
      row.eachCell((cell, columnNumber) => {
        const column = columns[columnNumber - 1]
        cell.alignment = {
          vertical: 'middle',
          horizontal: rowNumber > 1 && column.amount ? 'right' : 'center',
          shrinkToFit: rowNumber > 1 && !!column.amount
        }
        if (rowNumber === 1) {
          cell.font = { bold: true, color: { argb: 'FF00766E' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F5F3' } }
        } else if (column.numFmt) {
          cell.numFmt = column.numFmt
        }
      })
    })
  })
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}
