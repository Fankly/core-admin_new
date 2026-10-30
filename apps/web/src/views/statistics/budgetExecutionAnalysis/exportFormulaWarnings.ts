import type { Workbook, Worksheet } from 'exceljs'

// ExcelJS 4.4 的工作表写出接口，未在官方类型中声明。
interface WorksheetXmlArchive {
  append(xml: string, options: { name: string }): void
}

type WorksheetXmlWriter = Workbook['xlsx'] & {
  addWorksheets(archive: WorksheetXmlArchive, model: unknown): Promise<void>
}

const formulaWarnings = new WeakMap<Workbook, Map<Worksheet, Set<string>>>()

// 按列合并连续公式地址，避免大表的 sqref 写入大量重复列标。
const getFormulaRanges = (worksheet: Worksheet, addresses: Set<string>) => {
  const columns = new Map<string, number[]>()
  addresses.forEach((address) => {
    const cell = worksheet.getCell(address)
    if (!cell.formula) return
    const column = address.replace(/\d+$/, '')
    const rows = columns.get(column) || []
    rows.push(Number(cell.row))
    columns.set(column, rows)
  })
  const ranges: string[] = []
  columns.forEach((rows, column) => {
    rows.sort((a, b) => a - b)
    for (let index = 0; index < rows.length; index++) {
      const start = rows[index]
      let end = start
      while (rows[index + 1] === end + 1) end = rows[++index]
      ranges.push(start === end ? `${column}${start}` : `${column}${start}:${column}${end}`)
    }
  })
  return ranges.join(' ')
}

export const ignoreFormulaRangeWarnings = (worksheet: Worksheet, addresses: string[]) => {
  if (!addresses.length) return
  const workbook = worksheet.workbook
  let sheets = formulaWarnings.get(workbook)
  if (!sheets) {
    sheets = new Map()
    formulaWarnings.set(workbook, sheets)
    const registeredSheets = sheets
    const writer = workbook.xlsx as WorksheetXmlWriter
    const addWorksheets = writer.addWorksheets.bind(writer)
    // ExcelJS 4.x 不序列化 ignoredErrors；在原始 XML 写出时补充，不二次解压/压缩。
    // 仅包装本次导出的实例，保留插件在 sheetMethod 后执行的合并及原有 writeBuffer 行为。
    writer.addWorksheets = (archive, model) => {
      const sheetRanges = new Map<string, string>()
      for (const [sheet, refs] of registeredSheets) {
        const sqref = getFormulaRanges(sheet, refs)
        if (sqref) sheetRanges.set(`xl/worksheets/sheet${sheet.id}.xml`, sqref)
      }
      return addWorksheets(
        {
          append(xml, options) {
            const sqref = sheetRanges.get(options.name)
            if (sqref) {
              // 直属子级汇总和指标比率会有意跳过相邻数字，只忽略 formulaRange，不屏蔽计算错误。
              const ignoredError = `<ignoredError sqref="${sqref}" formulaRange="1"/>`
              xml = xml.includes('</ignoredErrors>')
                ? xml.replace('</ignoredErrors>', `${ignoredError}</ignoredErrors>`)
                : xml.replace(
                    /<(?:smartTags|drawing|legacyDrawing|legacyDrawingHF|picture|oleObjects|controls|webPublishItems|tableParts|extLst)\b|<\/worksheet>/,
                    (tag) => `<ignoredErrors>${ignoredError}</ignoredErrors>${tag}`
                  )
            }
            archive.append(xml, options)
          }
        },
        model
      )
    }
  }
  const refs = sheets.get(worksheet) || new Set<string>()
  addresses.forEach((address) => refs.add(address))
  sheets.set(worksheet, refs)
}
