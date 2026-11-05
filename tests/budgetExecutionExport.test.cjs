const assert = require('node:assert/strict')
const Module = require('node:module')
const path = require('node:path')
const { test } = require('node:test')
const { buildSync } = require('esbuild')
const ExcelJS = require('exceljs')
const { Open } = require('unzipper')

// 只读检查实际 XLSX 内容，使用 ExcelJS 已依赖的 Node 解包器。
const readXlsxXml = async (buffer) => {
  const { files } = await Open.buffer(buffer)
  return async (filename) => {
    const entry = files.find((file) => file.path === filename)
    assert.ok(entry, `Missing XLSX entry: ${filename}`)
    return (await entry.buffer()).toString('utf8')
  }
}

const loadTypeScript = (relativePath, mocks = {}) => {
  const filename = path.resolve(__dirname, '..', relativePath)
  const result = buildSync({ entryPoints: [filename], bundle: true, platform: 'node', format: 'cjs', write: false, external: Object.keys(mocks) })
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  loaded.require = (id) => Object.prototype.hasOwnProperty.call(mocks, id) ? mocks[id] : Module.prototype.require.call(loaded, id)
  loaded._compile(result.outputFiles[0].text, filename)
  return loaded.exports
}

const { formatBudgetExecutionExportSheet } = loadTypeScript('src/views/statistics/budgetExecutionAnalysis/exportHelpers.ts')
const { buildBudgetExecutionSummaryRows } = loadTypeScript('src/views/statistics/budgetExecutionAnalysis/summaryConfig.ts')
const {
  applyExportNumberCell,
  decorateDynamicColumns,
  fitNumericColumnWidths,
  getExportLeafColumns,
  stripColumnWidths
} = loadTypeScript('src/views/statistics/budgetExecutionAnalysis/viewHelpers.ts')
const { formatNumValue } = loadTypeScript('src/utils/utils.ts')
const { createFormulaTitleMap, resolveBudgetExecutionUnitType } = loadTypeScript('src/views/statistics/budgetExecutionAnalysis/indicatorFormula.ts')
const extendedBudgetContext = { reportType: 'budget', extended: true, unitType: 'SGS' }

const createExport = async ({ stripe = true, digits = 'XSWS_4', isHeader = true, isColgroup = true, returnSaved = false } = {}) => {
  const columns = decorateDynamicColumns(
    [
      { id: 'c1', field: 'name', title: '名称' },
      { id: 'c2', field: 'gkbm', title: '归口部门' },
      { id: 'c3', field: 'MBZ', title: '目标值' },
      { id: 'c4', field: 'WCL', title: '完成率' },
      { id: 'c5', field: 'cnxmms', title: '项目描述' }
    ],
    digits,
    formatNumValue,
    undefined,
    { emptyNumericAsZero: true }
  )
  const rows = [
    { name: '合计', leaf: true, sfjc: '1', gkbm: '0012', MBZ: '1234.56789', WCL: '12.3', cnxmms: '' },
    { name: '二级分类', leaf: true, sfjc: 0, gkbm: '0003', MBZ: '-2345.6', WCL: '0', cnxmms: '' },
    { name: '明细项目', leaf: false, sfjc: 1, gkbm: '0004', MBZ: null, WCL: '25.00%', cnxmms: '' },
    { name: '无子级的顶层项目', leaf: false, gkbm: '0005', MBZ: '0', WCL: null, cnxmms: '' }
  ]
  const datas = rows.map((row, index) => {
    const item = { _row: row, _level: [0, 1, 2, 0][index] }
    columns.forEach((column) => {
      const value = row[column.field]
      item[column.id] = String(column.formatter ? column.formatter({ cellValue: value, row }) : value)
    })
    return item
  })
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('预算执行')
  worksheet.columns = columns.map((column) => ({ key: column.id, width: 22 }))
  if (isHeader) {
    worksheet.addRow(isColgroup ? ['名称', '归口部门', '预算执行', null, '项目描述'] : columns.map((column) => column.title))
    if (isColgroup) worksheet.addRow([null, null, '目标值', '完成率', null])
  }
  // 使用实际 ExcelJS 单元格及序列化，覆盖导出插件将短数字文本转为数字的情况。
  worksheet.addRows(
    datas.map((item) => Object.fromEntries(columns.map(({ id }) => [id, item[id] && !isNaN(item[id]) ? Number(item[id]) : item[id]])))
  )
  formatBudgetExecutionExportSheet(
    {
      options: { isHeader, isColgroup },
      worksheet,
      columns,
      colgroups: isColgroup ? [[], []] : [],
      datas,
      $table: {
        props: { stripe, align: 'center', headerAlign: 'center', rowConfig: { height: 32 } },
        getVTRowIndex: (row) => rows.indexOf(row)
      }
    },
    extendedBudgetContext,
    { autoFitNumericColumns: true }
  )
  // XLSX 插件在 sheetMethod 之后执行合并。
  if (isHeader && isColgroup) {
    for (const range of ['A1:A2', 'B1:B2', 'C1:D1', 'E1:E2']) worksheet.mergeCells(range)
  }
  const saved = new ExcelJS.Workbook()
  await saved.xlsx.load(await workbook.xlsx.writeBuffer())
  if (returnSaved) return saved
  return saved.getWorksheet('预算执行')
}

test('exported numbers retain page precision and separators while empty amounts become zero', async () => {
  const sheet = await createExport()
  assert.equal(sheet.getCell('C3').value, 1234.56789)
  assert.equal(sheet.getCell('C3').numFmt, '#,##0.0000')
  assert.equal(sheet.getCell('C4').value, -2345.6)
  assert.equal(sheet.getCell('C4').numFmt, '#,##0.0000')
  assert.equal(sheet.getCell('D3').value, 12.3)
  assert.equal(sheet.getCell('D3').numFmt, '#,##0.0000')
  assert.equal(sheet.getCell('C5').value, 0)
  assert.equal(sheet.getCell('C6').value, 0)
  assert.equal(sheet.getCell('C6').numFmt, '#,##0.0000')
  assert.equal(sheet.getCell('D5').value, '-')
  assert.equal(sheet.getCell('D6').value, '-')
  assert.equal(sheet.getCell('B3').value, '0012')
})

test('page formatters use selected precision for numeric zeros while preserving text codes', () => {
  const fields = ['name', 'subName', 'gkbm', 'ysly', 'cnxm', 'cnxmms', 'MBZ', 'WCL', 'JYL', 'LXL', 'GBL', 'XMZBL', 'XMHTQDL', 'XMKGL']
  for (const digits of [0, 2, 4]) {
    const columns = decorateDynamicColumns(fields.map((field) => ({ field, title: field })), `XSWS_${digits}`, formatNumValue, undefined, { emptyNumericAsZero: true })
    for (const column of columns) {
      for (const value of ['', null, undefined]) {
        const expected = column.field === 'name' ? '-' : fields.indexOf(column.field) < 6 ? value : formatNumValue(0, digits)
        assert.equal(column.formatter({ cellValue: value }), expected)
      }
      if (fields.indexOf(column.field) < 6) {
        assert.equal(column.formatter({ cellValue: '0012' }), '0012')
      } else {
        assert.equal(column.formatter({ cellValue: '1234.56789' }), formatNumValue('1234.56789', digits))
        assert.equal(column.formatter({ cellValue: 0 }), formatNumValue(0, digits))
        assert.equal(column.formatter({ cellValue: '12.3456%' }), `${formatNumValue('12.3456', digits)}%`)
      }
    }
  }
})

test('pages format returned null ratios while XLSX calculates them from the exported inputs', async () => {
  const rates = ['WCL', 'LXL', 'XMZBL', 'XMHTQDL', 'XMKGL', 'GBL']
  for (const reportType of ['budget', 'yap']) {
    for (const period of ['', 'CURRENT;']) {
      for (const digits of [0, 2, 4]) {
        const context = { reportType, extended: true, unitType: 'DW' }
        const field = (code) => `ORGID_A;${period}INDICATORID_${code}`
        const values = { MBZ: 3, PHMBZ: 6, WCZ: 1, LXZ: 2, XMSL: 3, YZTBXMSL: 1, HTQDXMSL: 2, YKGXMSL: null, GBSL: '', JYL: null,
          ...Object.fromEntries(rates.map((code) => [code, null])) }
        const row = Object.fromEntries(Object.entries(values).map(([code, value]) => [field(code), value]))
        const zeroRow = { ...row, [field('MBZ')]: '', [field('PHMBZ')]: null, [field('XMSL')]: '0.0000' }
        const rawColumns = Object.keys(values).map((code) => ({ field: field(code), title: code }))
        const columns = decorateDynamicColumns(rawColumns, `XSWS_${digits}`, formatNumValue, undefined, { emptyNumericAsZero: true })
        const saved = await createFormulaExport({ context, digits: `XSWS_${digits}`, columns: rawColumns, rows: [row, zeroRow] })
        const sheet = saved.getWorksheet('预算执行')
        const expected = { WCL: reportType === 'budget' ? 100 / 3 : 100 / 6, LXL: reportType === 'budget' ? 200 / 3 : 200 / 6, XMZBL: 100 / 3, XMHTQDL: 200 / 3, XMKGL: 0, GBL: 0 }
        for (const [code, value] of Object.entries(expected)) {
          const index = columns.findIndex((column) => column.field === field(code))
          const text = formatNumValue(value, digits)
          assert.equal(columns[index].formatter({ cellValue: row[field(code)], row }), formatNumValue(0, digits))
          assert.equal(sheet.getCell(2, index + 1).result, Number(text.replace(/,/g, '')))
          assert.equal(columns[index].formatter({ cellValue: null, row: zeroRow }), formatNumValue(0, digits))
          assert.equal(sheet.getCell(3, index + 1).result, '-')
        }
        const empty = columns.findIndex((column) => column.field === field('JYL'))
        assert.equal(columns[empty].formatter({ cellValue: null, row }), formatNumValue(0, digits))
        assert.equal(sheet.getCell(2, empty + 1).value, 0)
        assert.equal(row[field('WCL')], null, 'formatting must preserve raw backend results')
      }
    }
  }
})

test('XLSX fills empty amounts with zero and recalculates empty ratios from valid inputs', async () => {
  for (const reportType of ['budget', 'yap']) {
    for (const digits of [0, 2, 4]) {
      const fields = ['name', 'gkbm', 'MBZ', 'WCZ', 'WCL', 'JYL', 'PHMBZ']
      const emptyRows = ['', null].map((value) => Object.fromEntries(fields.map((field) => [field, value])))
      const saved = await createFormulaExport({
        context: { reportType, extended: true, unitType: 'DW' },
        digits: `XSWS_${digits}`,
        columns: fields.map((field) => ({ field, title: field })),
        rows: [
          ...emptyRows,
          { name: '未返回比率', gkbm: '0012', MBZ: 10, PHMBZ: 10, WCZ: 5, WCL: null, JYL: '' },
          { name: '有效零值', gkbm: '0012', MBZ: '0.00004', PHMBZ: '0.00004', WCZ: 0, WCL: 0, JYL: '12.3456%' }
        ]
      })
      const sheet = saved.getWorksheet('预算执行')
      for (const row of [2, 3]) {
        for (let col = 1; col <= fields.length; col++) {
          const cell = sheet.getCell(row, col)
          assert.equal(cell.formula ? cell.result : cell.value, col === 2 ? emptyRows[row - 2].gkbm : col === 1 || col === 5 ? '-' : 0)
        }
      }
      assert.equal(sheet.getCell('E4').result, 50)
      assert.equal(sheet.getCell('F4').value, 0)
      assert.equal(sheet.getCell('B4').value, '0012')
      assert.equal(sheet.getCell('C5').value, 0.00004)
      assert.equal(sheet.getCell('D5').value, 0)
      assert.equal(sheet.getCell('E5').result, 0)
      const numFmt = digits ? `#,##0.${'0'.repeat(digits)}` : '#,##0'
      for (const column of ['C', 'D', 'E', 'G']) assert.equal(sheet.getCell(`${column}5`).numFmt, numFmt)
      assert.equal(sheet.getCell('F5').value, `${formatNumValue('12.3456', digits)}%`)
    }
  }
})

test('zero and empty denominators remain dashes when the denominator column is omitted from the export', async () => {
  for (const denominator of [0, '0', '0.0000', '', null]) {
    const saved = await createFormulaExport({
      context: { reportType: 'yap', extended: true, unitType: 'DW' },
      columns: ['ORGID_DW_1;INDICATORID_WCL', 'total_WCL'].map((field) => ({ field, title: field })),
      rows: [{ 'ORGID_DW_1;INDICATORID_WCL': 0, 'ORGID_DW_1;INDICATORID_PHMBZ': denominator, total_WCL: 0, total_MBZ: denominator }]
    })
    const sheet = saved.getWorksheet('预算执行')
    assert.equal(sheet.getCell('A2').value, '-')
    assert.equal(sheet.getCell('B2').value, '-')
  }
})

test('sfjc emphasis, tree indentation, merged headers and empty-cell borders survive XLSX serialization', async () => {
  const sheet = await createExport()
  assert.equal(sheet.getCell('A3').font.bold, true)
  assert.ok(!sheet.getCell('A4').font.bold)
  assert.equal(sheet.getCell('A5').font.bold, true)
  assert.ok(!sheet.getCell('A6').font.bold)
  assert.equal(sheet.getCell('A5').value, '明细项目')
  assert.equal(sheet.getCell('A5').alignment.indent, 2)
  assert.equal(sheet.getCell('A4').alignment.horizontal, 'left')
  assert.equal(sheet.getCell('C4').alignment.horizontal, 'right')
  assert.equal(sheet.getCell('B4').alignment.horizontal, 'center')
  assert.equal(sheet.getCell('D1').master.address, 'C1')
  assert.equal(sheet.getCell('A2').master.address, 'A1')
  assert.equal(sheet.getCell('D1').fill.fgColor.argb, 'FFF8F8F9')
  assert.ok(!sheet.getCell('C1').alignment.wrapText)
  assert.ok(!sheet.getCell('C2').alignment.wrapText)
  assert.equal(sheet.getCell('E4').border.bottom.color.argb, 'FFE8EAEC')
  assert.equal(sheet.getRow(4).height, 24)
  assert.equal(sheet.getColumn(1).width, 22)
  assert.ok(sheet.getColumn(3).width >= '-2,345.6000'.length + 2)
  assert.ok(sheet.getColumn(3).width < 22)
  // 只冻结第一列，导出与页面展示保持一致。
  assert.equal(sheet.views[0].xSplit, 1)
  assert.equal(sheet.views[0].ySplit, 2)
})

test('each page keeps its stripe setting, including trailing empty cells', async () => {
  const striped = await createExport()
  const plain = await createExport({ stripe: false })
  assert.equal(striped.getCell('E4').fill.fgColor.argb, 'FFFAFAFA')
  assert.equal(striped.getCell('E5').fill.fgColor.argb, 'FFFFFFFF')
  assert.equal(plain.getCell('E4').fill.fgColor.argb, 'FFFFFFFF')
})

test('zero decimal places and flat or omitted headers keep the first data row intact', async () => {
  const flat = await createExport({ digits: 'XSWS_0', isColgroup: false })
  assert.equal(flat.getCell('C2').value, 1234.56789)
  assert.equal(flat.getCell('C2').numFmt, '#,##0')
  assert.equal(flat.getCell('D2').numFmt, '#,##0')
  assert.equal(flat.views[0].ySplit, 1)
  const noHeader = await createExport({ isHeader: false })
  assert.equal(noHeader.getCell('C1').value, 1234.56789)
  assert.equal(noHeader.getCell('A2').alignment.indent, 1)
  assert.equal(noHeader.views[0].ySplit, 0)
})

test('formula explanations are omitted when a referenced title was not returned', async () => {
  // 当前列仅返回目标值和完成率，缺少完成值的 title，不再使用固定指标名称兜底。
  const saved = await createExport({ returnSaved: true })
  assert.equal(saved.getWorksheet('计算公式说明'), undefined)
})

const createFormulaExport = async ({
  columns,
  rows,
  headerRows = 1,
  digits = 'XSWS_4',
  context = extendedBudgetContext,
  columnWidth = 22,
  treeConfig,
  exportOptions,
  returnXml = false,
  pluginColumnTree = false,
  headerMerges = []
}) => {
  columns = decorateDynamicColumns(columns, digits, formatNumValue, undefined, { emptyNumericAsZero: true })
  const leafColumns = getExportLeafColumns(columns)
  leafColumns.forEach((column, index) => {
    column.id = `col${index}`
  })
  const datas = rows.map((row, index) => {
    const data = { _row: row, _level: index }
    leafColumns.forEach((column) => {
      data[column.id] = column.formatter ? column.formatter({ cellValue: row[column.field], row }) : row[column.field]
    })
    return data
  })
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('预算执行')
  worksheet.columns = leafColumns.map((column) => ({ key: column.id, width: columnWidth }))
  for (let index = 0; index < headerRows; index++) worksheet.addRow(leafColumns.map((column) => column.title))
  worksheet.addRows(datas)
  // VXE XLSX 插件在调用 sheetMethod 前会将已有单元格全部设为未锁定。
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.protection = { locked: false }
    })
  })
  formatBudgetExecutionExportSheet(
    {
      options: { isHeader: headerRows > 0, isColgroup: headerRows > 1 },
      worksheet,
      columns: pluginColumnTree ? leafColumns : columns,
      colgroups: pluginColumnTree
        ? [
            columns.map(function toPluginColumn(column) {
              return { ...column, children: undefined, childNodes: column.children?.map(toPluginColumn) }
            })
          ]
        : Array.from({ length: headerRows }, () => []),
      datas,
      $table: {
        props: { stripe: true, align: 'center', rowConfig: { height: 32 }, treeConfig },
        getVTRowIndex: (row) => rows.indexOf(row)
      }
    },
    context,
    exportOptions
  )
  // 与 XLSX 插件一致：自定义 sheetMethod 执行后再合并分组表头。
  headerMerges.forEach((range) => worksheet.mergeCells(range))
  const saved = new ExcelJS.Workbook()
  const buffer = await workbook.xlsx.writeBuffer()
  const readXml = await readXlsxXml(buffer)
  const workbookXml = await readXml('xl/workbook.xml')
  if ((worksheet.getRows(headerRows + 1, rows.length) || []).some((row) => row.values.some((value) => value?.formula))) {
    assert.match(workbookXml, /<calcPr[^>]*fullCalcOnLoad="1"/)
  }
  await saved.xlsx.load(buffer)
  if (returnXml) return { saved, readXml }
  return saved
}

test('the five unformatted columns preserve backend values on screen and in saved XLSX cells', async () => {
  const fields = ['subName', 'gkbm', 'ysly', 'cnxm', 'cnxmms']
  const values = ['', null, undefined, '-', '  ', ' 0012 ', '0012', '1,234.5000', '12.30%', '预算来源', 0, 1234.56789]
  for (const digits of [0, 2, 4]) {
    // 覆盖嵌套列以及后端已有 formatter 的情况。
    const sourceColumns = [{ title: '基本信息', children: fields.map((field) => ({ field, title: field, formatter: () => '不应使用' })) }]
    const columns = getExportLeafColumns(decorateDynamicColumns(sourceColumns, `XSWS_${digits}`, formatNumValue, undefined, { emptyNumericAsZero: true }))
    const rows = values.map((value, index) => ({ name: `行${index}`, ...Object.fromEntries(fields.map((field) => [field, value])) }))
    columns.forEach((column) => values.forEach((value) => assert.equal(column.formatter({ cellValue: value }), value)))
    const saved = await createFormulaExport({
      columns: [{ field: 'name', title: '名称' }, ...sourceColumns], rows, digits: `XSWS_${digits}`,
      exportOptions: { autoFitNumericColumns: true }
    })
    const sheet = saved.getWorksheet('预算执行')
    values.forEach((value, rowIndex) => fields.forEach((field, columnIndex) => {
      const cell = sheet.getCell(rowIndex + 2, columnIndex + 2)
      assert.equal(cell.value, value ?? null, `${field}: ${String(value)}`)
      assert.equal(cell.numFmt || 'General', 'General')
    }))
  }
})

test('sequence merges follow exported visible rows and coexist with grouped headers and reordered columns', async () => {
  const child = { id: 'child', subName: '01', name: '子项', MBZ: 2 }
  const parent = { id: 'parent', subName: '01', name: '父项', MBZ: 2, children: [child] }
  const next = { id: 'next', subName: '01', name: '下一项', MBZ: 3 }
  const separator = { ...child, subName: '02' }
  for (const headerRows of [0, 1, 3]) {
    for (const sequenceIndex of [0, 2]) {
      for (const { rows: visibleRows, spanLength } of [
        { rows: [parent, next], spanLength: 2 },
        { rows: [parent, child, next], spanLength: 3 },
        { rows: [{ ...parent, children: [separator] }, separator, next], spanLength: 0 }
      ]) {
        // 空序号和“-”不合并；0 和 '0' 沿用页面规则；带前导零的不同编码不合并。
        const tail = ['', '', null, undefined, '-', '-', 0, '0', '001', '1'].map((subName, index) => ({ id: `tail${index}`, name: `尾行${index}`, subName, MBZ: 1 }))
        const fields = ['name', 'MBZ']
        fields.splice(sequenceIndex, 0, 'subName')
        const letter = sequenceIndex === 0 ? 'A' : 'C'
        const headerMerges = headerRows > 1 ? [`${letter}1:${letter}${headerRows}`] : []
        const { saved, readXml } = await createFormulaExport({
          columns: fields.map((field) => ({ field, title: field })), rows: [...visibleRows, ...tail],
          headerRows, headerMerges, treeConfig: { lazy: true }, returnXml: true,
          exportOptions: { mergeSequenceCells: true, includeFormulaExplanations: false }
        })
        const firstRow = headerRows + 1
        const zeroRow = firstRow + visibleRows.length + 6
        const expected = [...headerMerges, `${letter}${zeroRow}:${letter}${zeroRow + 1}`]
        if (spanLength) expected.push(`${letter}${firstRow}:${letter}${firstRow + spanLength - 1}`)
        const sheet = saved.getWorksheet('预算执行')
        assert.deepEqual(sheet.model.merges.sort(), expected.sort())
        if (spanLength) assert.equal(sheet.getCell(firstRow + spanLength - 1, sequenceIndex + 1).master.address, `${letter}${firstRow}`)
        assert.equal(sheet.getCell(zeroRow, sequenceIndex + 1).value, 0)
        assert.equal(sheet.getCell(firstRow, fields.indexOf('MBZ') + 1).isMerged, false)
        const xml = await readXml('xl/worksheets/sheet1.xml')
        expected.forEach((range) => assert.ok(xml.includes(`<mergeCell ref="${range}"/>`)))
      }
    }
  }
})

test('sequence merging is opt-in and safely handles an omitted sequence column or no rows', async () => {
  for (const { fields, rows, exportOptions } of [
    { fields: ['name', 'subName'], rows: [{ name: '甲', subName: '1' }, { name: '乙', subName: '1' }] },
    { fields: ['name'], rows: [{ name: '甲', subName: '1' }, { name: '乙', subName: '1' }], exportOptions: { mergeSequenceCells: true } },
    { fields: ['name', 'subName'], rows: [], exportOptions: { mergeSequenceCells: true } }
  ]) {
    const saved = await createFormulaExport({ columns: fields.map((field) => ({ field, title: field })), rows, exportOptions })
    assert.deepEqual(saved.getWorksheet('预算执行').model.merges, [])
  }
})

const getIgnoredFormulaCells = (xml, sheet) => {
  const cells = new Set()
  for (const [, attributes] of xml.matchAll(/<ignoredError\b([^>]*)\/>/g)) {
    assert.match(attributes, /formulaRange="1"/)
    assert.match(attributes, /\bformula="1"/)
    assert.doesNotMatch(attributes, /evalError|numberStoredAsText|unlockedFormula|emptyCellReference/)
    const sqref = attributes.match(/sqref="([^"]+)"/)[1]
    for (const range of sqref.split(' ')) {
      const [start, end = start] = range.split(':')
      const first = sheet.getCell(start)
      const last = sheet.getCell(end)
      for (let row = first.row; row <= last.row; row++) {
        for (let col = first.col; col <= last.col; col++) cells.add(sheet.getCell(row, col).address)
      }
    }
  }
  return cells
}

test('exported XLSX ignores inconsistent-formula and adjacent-number warnings only for generated formulas and retains direct-child sums', async () => {
  for (const reportType of ['budget', 'yap']) {
    for (const headerRows of [0, 1, 3]) {
      for (const includeFormulaExplanations of [false, true]) {
        const leaf = { name: '明细', WCZ: 10, MBZ: 100, PHMBZ: 200, WCL: 10, LXL: 5 }
        const branch = { ...leaf, name: '类别一', children: [leaf] }
        const sibling = { name: '类别二', WCZ: 90, MBZ: 300, PHMBZ: 300, WCL: 30, LXL: 5 }
        const root = { name: '合计', WCZ: 100, MBZ: 400, PHMBZ: 500, WCL: 25, LXL: 5, children: [branch, sibling] }
        const { saved, readXml } = await createFormulaExport({
          headerRows,
          context: { reportType, extended: true, unitType: 'DW' },
          treeConfig: {},
          exportOptions: { includeFormulaExplanations },
          columns: ['name', 'WCL', 'WCZ', 'MBZ', 'PHMBZ', 'LXL'].map((field) => ({ field, title: field })),
          rows: [root, branch, leaf, sibling],
          returnXml: true
        })
        const sheet = saved.getWorksheet('预算执行')
        const first = headerRows + 1
        const xml = await readXml('xl/worksheets/sheet1.xml')
        assert.deepEqual(getIgnoredFormulaCells(xml, sheet), new Set([
          ...['B', 'C', 'D', 'E'].flatMap((col) => [`${col}${first}`, `${col}${first + 1}`]),
          `B${first + 2}`, `B${first + 3}`
        ]))
        assert.deepEqual(sheet.getCell(`D${first}`).value, { formula: `SUM(D${first + 1},D${first + 3})`, result: 400 })
        assert.equal(sheet.getCell(`B${first}`).result, reportType === 'budget' ? 25 : 20)
        assert.equal(sheet.getCell(`F${first}`).value, 5)
        assert.equal(sheet.sheetProtection, undefined)
        if (includeFormulaExplanations) {
          // ignoredErrors 必须位于批注绘图之前，避免 Excel 修复工作表 XML。
          assert.ok(xml.indexOf('<ignoredErrors>') < xml.indexOf('<legacyDrawing'))
          assert.ok(sheet.getCell(`B${first}`).note)
          assert.doesNotMatch(await readXml('xl/worksheets/sheet2.xml'), /ignoredErrors/)
        }
      }
    }
  }
})

test('static exports do not suppress any formula checks', async () => {
  const { readXml } = await createFormulaExport({
    columns: [{ field: 'MBZ', title: '目标值' }],
    rows: [{ MBZ: 100 }],
    returnXml: true
  })
  assert.doesNotMatch(await readXml('xl/worksheets/sheet1.xml'), /ignoredErrors/)
})

test('formula warning settings stay local to the workbook and serialize once across multiple sheets and writes', async () => {
  const { ignoreFormulaRangeWarnings } = loadTypeScript('src/views/statistics/budgetExecutionAnalysis/exportFormulaWarnings.ts')
  const workbook = new ExcelJS.Workbook()
  const first = workbook.addWorksheet('第一张')
  const other = workbook.addWorksheet('未配置的工作表')
  const last = workbook.addWorksheet('第三张')
  for (const sheet of [first, other, last]) {
    sheet.getCell('A2').value = { formula: 'SUM(B2:C2)', result: 3 }
    sheet.getCell('A3').value = { formula: 'SUM(B3:C3)', result: 7 }
    sheet.getCell('B2').value = 1
    sheet.getCell('C2').value = 2
    sheet.getCell('B3').value = 3
    sheet.getCell('C3').value = 4
  }
  const separateWorkbook = new ExcelJS.Workbook()
  const originalAddWorksheets = separateWorkbook.xlsx.addWorksheets
  const originalWriteBuffer = workbook.xlsx.writeBuffer
  ignoreFormulaRangeWarnings(first, ['A2'])
  ignoreFormulaRangeWarnings(first, ['A2', 'A3'])
  ignoreFormulaRangeWarnings(last, ['A3'])
  assert.equal(separateWorkbook.xlsx.addWorksheets, originalAddWorksheets)
  assert.equal(workbook.xlsx.writeBuffer, originalWriteBuffer)
  // 模拟插件在 sheetMethod 返回后才执行合并。
  first.mergeCells('A1:C1')
  first.getCell('A1').value = '合并表头'
  for (let attempt = 0; attempt < 2; attempt++) {
    const buffer = await workbook.xlsx.writeBuffer()
    const readXml = await readXlsxXml(buffer)
    const firstXml = await readXml('xl/worksheets/sheet1.xml')
    assert.equal([...firstXml.matchAll(/<ignoredErrors>/g)].length, 1)
    assert.deepEqual(getIgnoredFormulaCells(firstXml, first), new Set(['A2', 'A3']))
    assert.doesNotMatch(await readXml('xl/worksheets/sheet2.xml'), /ignoredErrors/)
    assert.deepEqual(getIgnoredFormulaCells(await readXml('xl/worksheets/sheet3.xml'), last), new Set(['A3']))
    const loaded = new ExcelJS.Workbook()
    await loaded.xlsx.load(buffer)
    assert.equal(loaded.getWorksheet(1).getCell('C1').master.address, 'A1')
    assert.deepEqual(loaded.getWorksheet(1).getCell('A2').value, { formula: 'SUM(B2:C2)', result: 3 })
  }
})

test('browser ExcelJS writes formula warning flags without replacing its buffer exporter', async () => {
  const BrowserExcelJS = require('exceljs/dist/exceljs.min.js')
  const { ignoreFormulaRangeWarnings } = loadTypeScript('src/views/statistics/budgetExecutionAnalysis/exportFormulaWarnings.ts')
  const workbook = new BrowserExcelJS.Workbook()
  const sheet = workbook.addWorksheet('浏览器导出')
  sheet.getCell('A1').value = { formula: 'SUM(B1:C1)', result: 3 }
  sheet.getCell('B1').value = 1
  sheet.getCell('C1').value = 2
  const writeBuffer = workbook.xlsx.writeBuffer
  ignoreFormulaRangeWarnings(sheet, ['A1'])
  assert.equal(workbook.xlsx.writeBuffer, writeBuffer)
  const buffer = await workbook.xlsx.writeBuffer()
  const readXml = await readXlsxXml(Buffer.from(buffer))
  assert.deepEqual(getIgnoredFormulaCells(await readXml('xl/worksheets/sheet1.xml'), sheet), new Set(['A1']))
  const loaded = new ExcelJS.Workbook()
  await loaded.xlsx.load(buffer)
  assert.deepEqual(loaded.getWorksheet(1).getCell('A1').value, { formula: 'SUM(B1:C1)', result: 3 })
})

test('formula cells override plugin unlock settings after XLSX serialization without protecting the worksheet', async () => {
  for (const reportType of ['budget', 'yap']) {
    for (const includeFormulaExplanations of [true, false]) {
      for (const headerRows of [0, 1, 3]) {
        const saved = await createFormulaExport({
          headerRows,
          context: { reportType, extended: true, unitType: 'DW' },
          exportOptions: { includeFormulaExplanations },
          columns: ['name', 'WCL', 'WCZ', 'MBZ', 'PHMBZ', 'LXL'].map((field) => ({ field, title: field })),
          rows: [{ name: '项目', WCL: 25, WCZ: 50, MBZ: 200, PHMBZ: 200, LXL: 10 }]
        })
        const sheet = saved.getWorksheet('预算执行')
        const dataRow = headerRows + 1
        const formulaCell = sheet.getCell(`B${dataRow}`)
        assert.ok(formulaCell.formula)
        assert.equal(formulaCell.result, 25)
        // XLSX 的默认保护状态为 locked=true，ExcelJS 读取时可能省略默认值。
        assert.equal(formulaCell.protection?.locked ?? true, true)
        for (const column of ['A', 'C', 'D', 'E', 'F']) {
          assert.equal(sheet.getCell(`${column}${dataRow}`).protection.locked, false)
        }
        assert.equal(sheet.getCell(`F${dataRow}`).value, 10) // 缺少 LXZ，保留静态值及未锁定状态。
        if (headerRows) assert.equal(sheet.getCell('B1').protection.locked, false)
        assert.equal(sheet.sheetProtection, undefined)
      }
    }
  }
})

test('exports without explanations preserve formulas, cached results, formatting and automatic recalculation', async () => {
  for (const reportType of ['budget', 'yap']) {
    for (const headerRows of [0, 1, 3]) {
      const fields = ['WCL', 'WCZ', 'MBZ', 'PHMBZ', 'LXL', 'LXZ', 'GBL', 'GBSL', 'XMSL', 'XMZBL', 'YZTBXMSL', 'XMHTQDL', 'HTQDXMSL', 'XMKGL', 'YKGXMSL']
      const args = {
        headerRows,
        context: { reportType, extended: true, unitType: 'DW' },
        columns: [
          { field: 'name', title: '项目类别' },
          { title: '单位', children: fields.map((field) => ({ field, title: field })) },
          { title: '合计', children: ['WCL', 'WCZ', 'MBZ'].map((field) => ({ field: `total_${field}`, title: field })) }
        ],
        rows: [
          {
            name: '项目', sfjc: 1, WCL: '25.00%', WCZ: 50, MBZ: 200, PHMBZ: 200, LXL: 50, LXZ: 100,
            GBL: 10, GBSL: 1, XMSL: 10, XMZBL: 80, YZTBXMSL: 8, XMHTQDL: 60, HTQDXMSL: 6, XMKGL: 40, YKGXMSL: 4,
            total_WCL: 0.25, total_WCZ: 50, total_MBZ: 200
          },
          { name: '零目标', WCL: 0, WCZ: 1, MBZ: 0, PHMBZ: 0 },
          { name: '缺失目标', WCL: null, WCZ: null, MBZ: null, PHMBZ: null }
        ]
      }
      const baseline = (await createFormulaExport(args)).getWorksheet('预算执行')
      const saved = await createFormulaExport({ ...args, exportOptions: { includeFormulaExplanations: false, autoFitNumericColumns: true } })
      const sheet = saved.getWorksheet('预算执行')
      assert.equal(saved.worksheets.length, 1)
      assert.equal(saved.getWorksheet('计算公式说明'), undefined)
      assert.equal(sheet.getCell(`B${headerRows + 1}`).result, 0.25)
      assert.ok(sheet.getCell(`B${headerRows + 1}`).formula.includes('ROUND('))
      assert.deepEqual(sheet.views, baseline.views)
      sheet.eachRow((row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
          const before = baseline.getCell(rowNumber, columnNumber)
          assert.deepEqual(cell.value, before.value)
          assert.deepEqual(cell.style, before.style)
          assert.equal(cell.note, undefined)
        })
      })
    }
  }
})

test('exports without explanations keep original values when the calculation context or inputs do not support formulas', async () => {
  for (const context of [
    { reportType: 'budget', extended: false, unitType: 'SGS' },
    { reportType: 'yap', extended: true, unitType: 'BM' }
  ]) {
    const saved = await createFormulaExport({
      context,
      exportOptions: { includeFormulaExplanations: false },
      columns: ['WCL', 'LXL', 'LXZ', 'MBZ'].map((field) => ({ field, title: field })),
      rows: [{ WCL: 25, LXL: 50, LXZ: 100, MBZ: 200 }]
    })
    const sheet = saved.getWorksheet('预算执行')
    assert.equal(saved.worksheets.length, 1)
    assert.equal(sheet.getCell('A2').value, 25)
    assert.equal(sheet.getCell('B2').value, 50)
    assert.equal(sheet.getCell('A2').note, undefined)
    assert.equal(sheet.getCell('B2').note, undefined)
  }
})

test('completion formulas reference the exported row after column reordering and retain number formats', async () => {
  for (const headerRows of [0, 1, 3]) {
    const saved = await createFormulaExport({
      headerRows,
      columns: [
        { field: 'name', title: '名称' },
        { field: 'WCL', title: '完成率' },
        { field: 'WCZ', title: '完成值' },
        { field: 'MBZ', title: '目标值' }
      ],
      rows: [
        { name: '父级', leaf: true, sfjc: 1, WCL: 25, WCZ: 250, MBZ: 1000 },
        { name: '明细', WCL: 50, WCZ: 10, MBZ: 20 },
        { name: '零目标', WCL: 0, WCZ: 1, MBZ: 0 },
        { name: '缺失目标', WCL: null, WCZ: 1, MBZ: null },
        { name: '缺失完成值', WCL: null, WCZ: null, MBZ: 10 }
      ]
    })
    const sheet = saved.getWorksheet('预算执行')
    const first = headerRows + 1
    assert.deepEqual(sheet.getCell(`B${first}`).value, {
      formula: `IFERROR(ROUND(C${first}/D${first}*100,4),"-")`,
      result: 25
    })
    assert.equal(sheet.getCell(`B${first + 1}`).result, 50)
    assert.equal(sheet.getCell(`B${first + 2}`).result, '-')
    assert.equal(sheet.getCell(`B${first + 3}`).result, '-')
    assert.equal(sheet.getCell(`B${first + 4}`).result, 0)
    assert.equal(sheet.getCell(`B${first}`).numFmt, '#,##0.0000')
    assert.equal(sheet.getCell(`B${first + 3}`).numFmt, '#,##0.0000')
    assert.equal(sheet.getCell(`C${first}`).numFmt, '#,##0.0000')
    assert.equal(sheet.getCell(`B${first}`).font.bold, true)
    assert.equal(sheet.getCell(`B${first + 1}`).fill.fgColor.argb, 'FFFAFAFA')
    assert.ok(saved.getWorksheet('计算公式说明').getCell('C2').value.includes('已写入'))
  }
})

test('all maintained ratios use their own unit inputs, including real backend fields and columns beyond Z', async () => {
  const input = {
    MBZ: 200,
    WCZ: 50,
    LXZ: 100,
    XMSL: 10,
    YZTBXMSL: 8,
    HTQDXMSL: 6,
    YKGXMSL: 4,
    GBSL: 2,
    WCL: 25,
    LXL: 50,
    XMZBL: 80,
    XMHTQDL: 60,
    XMKGL: 40,
    GBL: 20
  }
  const prefixes = ['GSSX_ZGS_', 'ORGID_DW_02;INDICATORID_']
  const columns = [
    { field: 'name', title: '名称' },
    ...prefixes.map((prefix) => ({ title: prefix, children: Object.keys(input).map((code) => ({ field: `${prefix}${code}`, title: code })) }))
  ]
  const row = {
    name: '独立单位',
    ...Object.fromEntries(prefixes.flatMap((prefix) => Object.entries(input).map(([code, value]) => [`${prefix}${code}`, value])))
  }
  row['ORGID_DW_02;INDICATORID_WCZ'] = 100
  const saved = await createFormulaExport({ columns, rows: [row] })
  const sheet = saved.getWorksheet('预算执行')
  for (const [address, result] of Object.entries({
    J2: 25,
    K2: 50,
    L2: 80,
    M2: 60,
    N2: 40,
    O2: 20,
    X2: 50,
    Y2: 50,
    Z2: 80,
    AA2: 60,
    AB2: 40,
    AC2: 20
  })) {
    assert.equal(sheet.getCell(address).type, ExcelJS.ValueType.Formula)
    assert.equal(sheet.getCell(address).result, result)
  }
  assert.ok(sheet.getCell('J2').formula.includes('C2/B2*100'))
  assert.ok(sheet.getCell('X2').formula.includes('Q2/P2*100'))
  assert.ok(sheet.getCell('AA2').formula.includes('U2/S2*100'))
  assert.equal(saved.getWorksheet('计算公式说明').rowCount, 7)
})

test('missing sibling columns preserve original values and report partial application', async () => {
  const saved = await createFormulaExport({
    columns: ['A_WCL', 'A_WCZ', 'A_MBZ', 'B_WCL', 'B_WCZ', 'C_MBZ', 'JYL'].map((field) => ({ field, title: field })),
    rows: [{ A_WCL: 25, A_WCZ: 5, A_MBZ: 20, B_WCL: 33, B_WCZ: 11, C_MBZ: 33, JYL: 10 }]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.equal(sheet.getCell('A2').result, 25)
  assert.equal(sheet.getCell('D2').value, 33)
  assert.equal(sheet.getCell('G2').value, 10)
  assert.ok(saved.getWorksheet('计算公式说明').getCell('C2').value.includes('部分单位'))
})

test('total completion uses MBZ percentage points with or without PHMBZ in main and period exports', async () => {
  for (const prefix of ['total_', 'ORGID_total;INDICATORID_', 'ORGID_total;CURRENT;INDICATORID_', 'ORGID_total;LAST;INDICATORID_']) {
    for (const context of [
      { reportType: 'budget', extended: false, unitType: 'DW' },
      { reportType: 'budget', extended: true, unitType: 'BM' },
      { reportType: 'yap', extended: false, unitType: 'BM' },
      { reportType: 'yap', extended: true, unitType: 'DW' }
    ]) {
      for (const withBalancedTarget of [false, true]) {
        for (const digits of [0, 2, 4]) {
          const codes = ['WCL', 'WCZ', 'MBZ', ...(withBalancedTarget ? ['PHMBZ'] : [])]
          const rows = [3, 0, null].map((target) => ({
            [prefix + 'WCL']: 0, [prefix + 'WCZ']: 1, [prefix + 'MBZ']: target,
            ...(withBalancedTarget ? { [prefix + 'PHMBZ']: 200 } : {})
          }))
          const saved = await createFormulaExport({
            context, digits: `XSWS_${digits}`,
            columns: codes.map((code) => ({ field: prefix + code, title: code })), rows
          })
          const sheet = saved.getWorksheet('预算执行')
          assert.equal(sheet.getCell('A2').result, Number((100 / 3).toFixed(digits)))
          assert.equal(sheet.getCell('A2').formula, `IFERROR(ROUND(B2/C2*100,${digits}),"-")`)
          assert.equal(sheet.getCell('A3').result, '-')
          assert.equal(sheet.getCell('A4').result, '-')
        }
      }
    }
  }
})

test('percentage text retains its scale and nonnumeric operands use the missing value fallback', async () => {
  const saved = await createFormulaExport({
    columns: ['WCL', 'WCZ', 'MBZ'].map((field) => ({ field, title: field })),
    rows: [
      { WCL: '25.00%', WCZ: 5, MBZ: 20 },
      { WCL: 0, WCZ: 'invalid', MBZ: 20 }
    ]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.equal(sheet.getCell('A2').result, 0.25)
  assert.equal(sheet.getCell('A2').numFmt, '0.0000%')
  assert.equal(sheet.getCell('A3').result, '-')
  assert.equal(sheet.getCell('A3').formula, 'IFERROR(ROUND(B3/C3*100,4),"-")')
})

test('total completion uses percentages while initiation and closure preserve their fraction scales', async () => {
  for (const reportType of ['budget', 'yap']) {
    for (const prefix of ['total_', 'ORGID_total;INDICATORID_']) {
      const input = { WCL: 0.25, LXL: 0.5, GBL: 0.2, WCZ: 50, LXZ: 100, MBZ: 100, PHMBZ: 200, GBSL: 2, XMSL: 10 }
      const saved = await createFormulaExport({
        context: { reportType, extended: true, unitType: 'DW' },
        columns: Object.keys(input).map((code) => ({ field: prefix + code, title: code })),
        rows: [Object.fromEntries(Object.entries(input).map(([code, value]) => [prefix + code, value]))]
      })
      const sheet = saved.getWorksheet('预算执行')
      assert.equal(sheet.getCell('A2').result, 50)
      assert.equal(sheet.getCell('B2').result, 0.5)
      assert.equal(sheet.getCell('C2').result, 0.2)
      assert.ok(sheet.getCell('A2').formula.includes('ROUND(D2/F2*100,4)'))
      assert.ok(sheet.getCell('B2').formula.includes('ROUND(E2/G2,4)'))
      assert.ok(sheet.getCell('C2').formula.includes('ROUND(H2/I2,4)'))
    }
  }
})

test('YAP unit ratios use balanced targets while province and budget ratios use targets', async () => {
  const prefix = 'ORGID_DW_01;INDICATORID_'
  const input = { WCL: 25, LXL: 50, WCZ: 50, LXZ: 100, MBZ: 100, PHMBZ: 200 }
  for (const [context, completion, initiation, denominator] of [
    [{ reportType: 'yap', extended: true, unitType: 'DW' }, 25, 50, 'F2'],
    [{ reportType: 'yap', extended: true, unitType: 'SGS' }, 50, 100, 'E2'],
    [{ reportType: 'budget', extended: true, unitType: 'DW' }, 50, 100, 'E2']
  ]) {
    const saved = await createFormulaExport({
      context,
      columns: Object.keys(input).map((code) => ({ field: prefix + code, title: code })),
      rows: [Object.fromEntries(Object.entries(input).map(([code, value]) => [prefix + code, value]))]
    })
    const sheet = saved.getWorksheet('预算执行')
    assert.equal(sheet.getCell('A2').result, completion)
    assert.equal(sheet.getCell('B2').result, initiation)
    assert.ok(sheet.getCell('A2').formula.includes(`ROUND(C2/${denominator}*100,4)`))
    assert.ok(sheet.getCell('B2').formula.includes(`ROUND(D2/${denominator}*100,4)`))
  }
})

test('missing balanced targets never fall back to ordinary targets', async () => {
  const saved = await createFormulaExport({
    context: { reportType: 'yap', extended: true, unitType: 'DW' },
    columns: ['A_WCL', 'A_LXL', 'A_WCZ', 'A_LXZ', 'A_MBZ'].map((field) => ({ field, title: field })),
    rows: [{ A_WCL: 25, A_LXL: 50, A_WCZ: 50, A_LXZ: 100, A_MBZ: 100 }]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.equal(sheet.getCell('A2').value, 25)
  assert.equal(sheet.getCell('B2').value, 50)
  assert.ok(saved.getWorksheet('计算公式说明').getCell('C2').value.includes('缺少'))
})

test('small original amounts remain numeric and nonzero at any display precision', async () => {
  for (const digits of ['XSWS_0', 'XSWS_2', 'XSWS_4']) {
    const saved = await createFormulaExport({
      digits,
      columns: ['WCL', 'WCZ', 'MBZ'].map((field) => ({ field, title: field })),
      rows: [{ WCL: 50, WCZ: '0.00002', MBZ: '0.00004' }]
    })
    const sheet = saved.getWorksheet('预算执行')
    assert.equal(sheet.getCell('A2').result, 50)
    assert.equal(sheet.getCell('B2').value, 0.00002)
    assert.equal(sheet.getCell('C2').value, 0.00004)
    assert.equal(sheet.getCell('A2').numFmt, digits === 'XSWS_0' ? '#,##0' : digits === 'XSWS_2' ? '#,##0.00' : '#,##0.0000')
    assert.equal(sheet.getCell('B2').numFmt, digits === 'XSWS_0' ? '#,##0' : digits === 'XSWS_2' ? '#,##0.00' : '#,##0.0000')
  }
})

test('ratios recalculate at selected precision, including empty results and negative ties', async () => {
  for (const [digits, expected] of [[0, [33, 1, -1]], [2, [33.33, 1.01, -1.01]], [4, [33.3333, 1.005, -1.005]]]) {
    const saved = await createFormulaExport({
      digits: `XSWS_${digits}`,
      columns: ['LXL', 'LXZ', 'MBZ'].map((field) => ({ field, title: field })),
      rows: [
        { LXL: null, LXZ: 1, MBZ: 3 },
        { LXL: '', LXZ: 1.005, MBZ: 100 },
        { LXL: -1.01, LXZ: -1.005, MBZ: 100 }
      ]
    })
    const sheet = saved.getWorksheet('预算执行')
    expected.forEach((value, index) => assert.equal(sheet.getCell(index + 2, 1).result, value))
    assert.equal(sheet.getCell('A2').numFmt, digits ? `#,##0.${'0'.repeat(digits)}` : '#,##0')
    assert.ok(sheet.getCell('A3').formula.includes(`ROUND(B3/C3*100,${digits})`))
  }
})

test('legacy completion uses ordinary targets and four decimal places without inventing other ratios', async () => {
  for (const reportType of ['budget', 'yap']) {
    const saved = await createFormulaExport({
      context: { reportType, extended: false, unitType: 'DW' },
      columns: ['WCL', 'LXL', 'WCZ', 'LXZ', 'MBZ', 'PHMBZ', 'total_WCL', 'total_WCZ', 'total_MBZ'].map((field) => ({ field, title: field })),
      rows: [{ WCL: 33.3333, LXL: 12.34, WCZ: 1, LXZ: 2, MBZ: 3, PHMBZ: 10, total_WCL: 0.3333, total_WCZ: 1, total_MBZ: 3 }]
    })
    const sheet = saved.getWorksheet('预算执行')
    assert.equal(sheet.getCell('A2').result, 33.3333)
    assert.equal(sheet.getCell('B2').value, 12.34)
    assert.equal(sheet.getCell('G2').result, 33.3333)
    assert.ok(sheet.getCell('A2').formula.includes('ROUND(C2/E2*100,4)'))
    assert.ok(sheet.getCell('G2').formula.includes('ROUND(H2/I2*100,4)'))
  }
})

test('cost center cells only receive formulas calculated by their backend branch', async () => {
  for (const context of [
    { reportType: 'budget', extended: true, unitType: 'BM' },
    { reportType: 'yap', extended: true, unitType: 'BM' },
    { reportType: 'budget', extended: false, unitType: 'BM' }
  ]) {
    const saved = await createFormulaExport({
      context,
      columns: ['WCL', 'LXL', 'GBL', 'WCZ', 'LXZ', 'MBZ', 'GBSL', 'XMSL'].map((field) => ({ field, title: field })),
      rows: [{ WCL: 0, LXL: 7, GBL: null, WCZ: 5, LXZ: 10, MBZ: 20, GBSL: 1, XMSL: 2 }]
    })
    const sheet = saved.getWorksheet('预算执行')
    if (context.extended && context.reportType === 'budget') {
      assert.equal(sheet.getCell('A2').result, 25)
      assert.equal(sheet.getCell('B2').result, 50)
    } else {
      assert.equal(sheet.getCell('A2').value, 0)
      assert.equal(sheet.getCell('B2').value, 7)
    }
    assert.equal(sheet.getCell('C2').value, 0)
  }
})

test('percentage formatting keeps total fractions and rounds percentage points before conversion', async () => {
  const saved = await createFormulaExport({
    columnWidth: 4,
    columns: ['WCL', 'WCZ', 'MBZ', 'total_WCL', 'total_WCZ', 'total_MBZ'].map((field) => ({ field, title: field })),
    rows: [{ WCL: '33.33%', WCZ: 1, MBZ: 3, total_WCL: '25.00%', total_WCZ: 50, total_MBZ: 200 }]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.equal(sheet.getCell('A2').result, 0.333333)
  assert.equal(sheet.getCell('D2').result, 0.25)
  assert.equal(sheet.getCell('A2').numFmt, '0.0000%')
  assert.equal(sheet.getCell('D2').numFmt, '0.0000%')
  assert.ok(sheet.getColumn(1).width >= '33.33%'.length + 2)
  assert.ok(sheet.getColumn(4).width >= '25.00%'.length + 2)
  assert.ok(sheet.getCell('A2').formula.includes('ROUND(B2/C2*100,4)/100'))
  assert.ok(sheet.getCell('D2').formula.includes('ROUND(E2/F2*100,4)/100'))
})

test('percentage zero-denominator formulas retain selected precision when edited to a valid denominator', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  const saved = await createFormulaExport({
    columns: ['WCL', 'WCZ', 'MBZ', 'total_WCL', 'total_WCZ', 'total_MBZ'].map((field) => ({ field, title: field })),
    rows: [{ WCL: '0.00%', WCZ: 1, MBZ: 0, total_WCL: '0.00%', total_WCZ: 1, total_MBZ: 3 }]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.equal(sheet.getCell('A2').result, '-')
  assert.equal(sheet.getCell('A2').numFmt, '0.0000%')
  assert.equal(sheet.getCell('D2').result, 0.333333)
  const edited = await recalculateExport(sheet, { C2: 3 })
  assert.equal(edited.A2, 0.333333)
})

test('unit selection follows backend priority and default permission instead of GSSX labels', () => {
  assert.equal(resolveBudgetExecutionUnitType('PROVINCE', []), 'SGS')
  assert.equal(resolveBudgetExecutionUnitType('COUNTY', []), 'DW')
  assert.equal(resolveBudgetExecutionUnitType('PROVINCE', ['GSSX_ZGS']), 'SGS')
  assert.equal(resolveBudgetExecutionUnitType('CITY', ['GSSX_ZGS']), 'DW')
  assert.equal(resolveBudgetExecutionUnitType('PROVINCE', ['CITY', 'COUNTY']), 'DW')
  assert.equal(resolveBudgetExecutionUnitType('PROVINCE', ['ZSDW']), 'DW')
  assert.equal(resolveBudgetExecutionUnitType('PROVINCE', ['CITY', 'BM', 'GSSX_ZGS']), 'BM')
})

test('missing calculation context fails explicitly instead of exporting guessed formulas', () => {
  assert.throws(() => formatBudgetExecutionExportSheet({}), /缺少导出计算口径/)
})

test('export emphasis depends only on sfjc for parent and leaf rows', async () => {
  const flags = [1, '1', 0, '0', 2, '2', null, undefined, '', true]
  const saved = await createFormulaExport({
    columns: [{ field: 'name', title: '名称' }],
    rows: flags.flatMap((sfjc) => [
      { name: '父级', leaf: true, sfjc },
      { name: '明细', leaf: false, sfjc }
    ])
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.equal(sheet.getCell('A1').font.bold, true)
  flags.forEach((flag, index) => {
    const expected = flag === 1 || flag === '1'
    for (const offset of [0, 1]) assert.equal(!!sheet.getCell(`A${index * 2 + offset + 2}`).font.bold, expected)
  })
})

test('comparison exports keep period formulas, total scales, differences and page formatting', async () => {
  for (const reportType of ['budget', 'yap']) {
    const periods = ['CURRENT', 'LAST']
    const input = { WCL: 0.25, WCZ: 50, MBZ: 100, PHMBZ: 200 }
    const groups = periods.map((period) => ({
      title: period,
      children: Object.keys(input).map((code) => ({ field: `ORGID_total;${period};INDICATORID_${code}`, title: code }))
    }))
    const differenceFields = ['ORGID_total;INDICATORID_TBHBJE', 'ORGID_total;INDICATORID_TBHBL']
    const row = {
      name: '合计',
      leaf: false,
      sfjc: '1',
      ...Object.fromEntries(periods.flatMap((period) => Object.entries(input).map(([code, value]) => [`ORGID_total;${period};INDICATORID_${code}`, value]))),
      [differenceFields[0]]: '0.00002',
      [differenceFields[1]]: '-0.123456'
    }
    row['ORGID_total;LAST;INDICATORID_WCZ'] = 20
    const saved = await createFormulaExport({
      headerRows: 3,
      context: { reportType, extended: true, unitType: 'DW' },
      columns: [
        { field: 'name', title: '项目类别' },
        ...groups,
        { title: '同比/环比', children: differenceFields.map((field) => ({ field, title: field })) }
      ],
      rows: [row]
    })
    const sheet = saved.getWorksheet('预算执行')
    assert.equal(sheet.getCell('B4').result, 50)
    assert.ok(sheet.getCell('B4').formula.includes('ROUND(C4/D4*100,4)'))
    assert.equal(sheet.getCell('F4').result, 20)
    assert.ok(sheet.getCell('F4').formula.includes('ROUND(G4/H4*100,4)'))
    // 金额和比率已按后端的两期相减口径生成公式，不再保留传入的旧静态值。
    assert.equal(sheet.getCell('J4').formula, 'IFERROR(ROUND(C4-G4,4),"-")')
    assert.equal(sheet.getCell('J4').result, 30)
    assert.equal(sheet.getCell('K4').formula, 'IFERROR(ROUND(B4-F4,4),"-")')
    assert.equal(sheet.getCell('K4').result, 30)
    assert.equal(sheet.getCell('J4').numFmt, '#,##0.0000')
    assert.equal(sheet.getCell('B4').numFmt, '#,##0.0000')
    assert.equal(sheet.getCell('J4').font.bold, true)
    assert.equal(sheet.getCell('A4').alignment.horizontal, 'left')
    assert.equal(sheet.views[0].xSplit, 1)
    assert.equal(sheet.views[0].ySplit, 3)
    assert.ok(saved.getWorksheet('计算公式说明'))
  }
})

test('comparison exports widen narrow numeric columns for grouped amounts and final formula results', async () => {
  for (const reportType of ['budget', 'yap']) {
    for (const [digits, displayedAmount] of [
      ['XSWS_0', '-123,456,790'],
      ['XSWS_2', '-123,456,789.99'],
      ['XSWS_4', '-123,456,789.9877']
    ]) {
      const saved = await createFormulaExport({
        headerRows: 3,
        columnWidth: 6,
        digits,
        context: { reportType, extended: true, unitType: 'SGS' },
        columns: [
          { field: 'name', title: '名称' },
          { field: 'ORGID_total;INDICATORID_TBHBJE', title: '同比/环比金额' },
          { title: '本期', children: ['WCL', 'WCZ', 'MBZ'].map((field) => ({ field, title: field })) }
        ],
        rows: [
          { name: '普通行', WCL: 0, WCZ: 1, MBZ: 100 },
          { name: '合计', sfjc: '1', 'ORGID_total;INDICATORID_TBHBJE': '-123456789.98765', WCL: 0, WCZ: 123456789.9999, MBZ: 100 }
        ]
      })
      const sheet = saved.getWorksheet('预算执行')
      assert.equal(sheet.getColumn(1).width, 6)
      assert.equal(sheet.getCell('B5').value, -123456789.98765)
      assert.equal(sheet.getCell('B5').font.bold, true)
      assert.ok(sheet.getColumn(2).width >= displayedAmount.length + 2)
      assert.equal(sheet.getCell('C5').result, digits === 'XSWS_4' ? 123456789.9999 : 123456790)
      assert.equal(sheet.getCell('C5').numFmt, digits === 'XSWS_0' ? '#,##0' : digits === 'XSWS_2' ? '#,##0.00' : '#,##0.0000')
      assert.ok(sheet.getColumn(3).width >= formatNumValue(123456790, Number(digits.split('_')[1])).length + 2)
    }
  }
})

test('numeric fitting can shrink to content while formatting absent numeric columns as zero and retaining text widths', async () => {
  for (const [columnWidth, autoFitNumericColumns] of [
    [4, false],
    [40, false],
    [4, true],
    [40, true]
  ]) {
    const saved = await createFormulaExport({
      columnWidth,
      headerRows: 0,
      exportOptions: { autoFitNumericColumns },
      columns: ['MBZ', 'WCZ', 'JYL', 'gkbm'].map((field) => ({ field, title: field })),
      rows: [{ MBZ: 0, JYL: '1234567890.12%', gkbm: 123456789012345 }, { MBZ: -0.00002 }]
    })
    const sheet = saved.getWorksheet('预算执行')
    assert.equal(sheet.getCell('A1').value, 0)
    assert.equal(sheet.getCell('A2').value, -0.00002)
    assert.equal(sheet.getCell('A2').numFmt, '#,##0.0000')
    assert.ok(sheet.getColumn(1).width >= '-0.0000'.length + 2)
    if (autoFitNumericColumns) assert.ok(sheet.getColumn(1).width < 40)
    else if (columnWidth === 40) assert.equal(sheet.getColumn(1).width, 40)
    assert.equal(sheet.getColumn(2).width, autoFitNumericColumns ? 10 : Math.max(10, columnWidth))
    if (autoFitNumericColumns) {
      assert.ok(sheet.getColumn(3).width >= '1234567890.12%'.length + 2)
      assert.equal(sheet.getColumn(4).width, columnWidth)
    }
    assert.equal(sheet.getCell('B2').value, 0)
  }
})

test('comparison page formatters preserve backend ratios even with zero or missing denominators', () => {
  const rows = [
    {
      'ORGID_DW001;CURRENT;INDICATORID_WCL': 0,
      'ORGID_DW001;CURRENT;INDICATORID_WCZ': 10,
      'ORGID_DW001;CURRENT;INDICATORID_MBZ': 0
    },
    {
      'ORGID_DW001;CURRENT;INDICATORID_WCL': 0,
      'ORGID_DW001;CURRENT;INDICATORID_WCZ': 10,
      'ORGID_DW001;CURRENT;INDICATORID_MBZ': 100
    },
    {
      'ORGID_DW001;CURRENT;INDICATORID_WCL': 0,
      'ORGID_DW001;CURRENT;INDICATORID_WCZ': 10
    },
    {
      total_WCL: 0,
      total_WCZ: 10,
      total_PHMBZ: 0,
      children: [{ 'ORGID_DW001;LAST;INDICATORID_WCL': 0, 'ORGID_DW001;LAST;INDICATORID_WCZ': 10, 'ORGID_DW001;LAST;INDICATORID_PHMBZ': 0 }]
    }
  ]
  const original = JSON.parse(JSON.stringify(rows))
  for (const row of [...rows, ...rows[3].children]) {
    const fields = Object.keys(row).filter((field) => field.endsWith('_WCL'))
    const columns = decorateDynamicColumns(fields.map((field) => ({ field })), 'XSWS_4', formatNumValue, undefined, { emptyNumericAsZero: true })
    for (const column of columns) assert.equal(column.formatter({ cellValue: row[column.field], row }), '0.0000')
  }
  assert.deepEqual(rows, original)
})

test('zero denominators produce dashes while zero ratios with a valid denominator remain zero', async () => {
  const saved = await createFormulaExport({
    columns: ['WCL', 'WCZ', 'MBZ'].map((field) => ({ field, title: field })),
    rows: [
      { WCL: 0 },
      { WCL: 0, WCZ: null, MBZ: 10 },
      { WCL: 0, WCZ: 10, MBZ: null },
      { WCL: null, WCZ: null, MBZ: null },
      { WCL: 0, WCZ: 1, MBZ: 0 },
      { WCL: 0, WCZ: 0, MBZ: 10 }
    ]
  })
  const sheet = saved.getWorksheet('预算执行')
  // 未查询引用字段时保留结果；已返回的空分子按 0，空分母按零分母处理。
  assert.equal(sheet.getCell('A2').value, 0)
  assert.equal(sheet.getCell('A3').result, 0)
  assert.equal(sheet.getCell('B3').value, 0)
  assert.equal(sheet.getCell('A4').result, '-')
  assert.equal(sheet.getCell('A5').result, '-')
  assert.equal(sheet.getCell('A6').result, '-')
  assert.equal(sheet.getCell('A7').result, 0)
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  const recalculated = await recalculateExport(sheet)
  assert.equal(recalculated.A6, '-')
  assert.equal(recalculated.A7, 0)
  const edited = await recalculateExport(sheet, { C6: 2, C7: 0 })
  assert.equal(edited.A6, 50)
  assert.equal(edited.A7, '-')
})

test('raw value preservation is opt-in so other reports keep their existing export behavior', () => {
  const sheet = new ExcelJS.Workbook().addWorksheet('共享工具兼容性')
  const column = { field: 'MBZ' }
  const source = { MBZ: '1234.56789' }
  sheet.getCell('A1').value = '1,234.57'
  sheet.getCell('B1').value = '1,234.57'
  applyExportNumberCell(sheet.getCell('A1'), source, column)
  applyExportNumberCell(sheet.getCell('B1'), source, column, true)
  assert.equal(sheet.getCell('A1').value, 1234.57)
  assert.equal(sheet.getCell('A1').numFmt, '0.00000')
  assert.equal(sheet.getCell('B1').value, 1234.56789)
  assert.equal(sheet.getCell('B1').numFmt, '0.00')
})

const noteText = (cell) => (typeof cell.note === 'string' ? cell.note : cell.note.texts.map((part) => part.text).join(''))

test('backend configuration drives cross-node totals and ancestor recalculation without loaded tree children', async () => {
  const configs = [
    { configId: 'root', parentId: '2026', isleaf: 0, recState: 1 },
    { configId: 'a', parentId: 'root', isleaf: 0, recState: 1 },
    { configId: 'a1', parentId: 'a', isleaf: 1, recState: 1, statMethod: 1 },
    { configId: 'a2', parentId: 'a', isleaf: 1, recState: 1, statMethod: 1 },
    { configId: 'b', parentId: 'root', isleaf: 1, recState: 1, statMethod: 1 },
    { configId: 'summary', parentId: 'root', isleaf: 1, recState: 1, statMethod: 2, targetIds: ['a', 'b'] }
  ]
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  for (const reportType of ['budget', 'yap']) {
    const saved = await createFormulaExport({
      treeConfig: { lazy: true },
      context: { reportType, extended: true, unitType: 'DW', summaryRows: buildBudgetExecutionSummaryRows(configs) },
      columns: [{ field: 'MBZ', title: '目标值' }],
      rows: [{ id: 'root', MBZ: 100 }, { id: 'a', MBZ: 30 }, { id: 'a1', MBZ: 10 }, { id: 'a2', MBZ: 20 }, { id: 'b', MBZ: 20 }, { id: 'summary', MBZ: 50 }]
    })
    const sheet = saved.getWorksheet('预算执行')
    assert.deepEqual(sheet.getCell('A2').value, { formula: 'SUM(A3,A6:A7)', result: 100 })
    assert.deepEqual(sheet.getCell('A3').value, { formula: 'SUM(A4:A5)', result: 30 })
    assert.deepEqual(sheet.getCell('A7').value, { formula: 'SUM(A4:A6)', result: 50 })
    const edited = await recalculateExport(sheet, { A4: 15 })
    assert.equal(edited.A3, 35)
    assert.equal(edited.A7, 55)
    assert.equal(edited.A2, 110)
  }
})

test('configured totals retain backend values for hidden inputs, missing targets and unrelated equal-valued tree rows', async () => {
  const a = { id: 'a', MBZ: 10 }
  const root = { id: 'root', MBZ: 10, children: [a] }
  const activeLeaf = { isleaf: '1', recState: '1', statMethod: '1' }
  for (const configs of [
    [
      { configId: 'root', parentId: '2026', isleaf: 0, recState: 1 },
      { configId: 'a', parentId: 'root', ...activeLeaf },
      { configId: 'hidden', parentId: 'root', ...activeLeaf, isDisplay: 0 }
    ],
    [{ configId: 'root', parentId: '2026', ...activeLeaf }],
    [{ configId: 'root', parentId: '2026', ...activeLeaf, statMethod: 2, targetIds: ['missing', 'a'] }, { configId: 'a', parentId: '2026', ...activeLeaf }],
    []
  ]) {
    const saved = await createFormulaExport({
      treeConfig: {},
      context: { ...extendedBudgetContext, summaryRows: buildBudgetExecutionSummaryRows(configs) },
      columns: [{ field: 'MBZ', title: '目标值' }], rows: [root, a]
    })
    assert.equal(saved.getWorksheet('预算执行').getCell('A2').value, 10)
  }
})

test('summary bindings follow active data leaves, preserve overlapping paths and do not recursively sum other summary nodes', () => {
  const configs = [
    { configId: 'a', parentId: '2026', isleaf: 0, recState: 1 },
    { configId: 'a1', parentId: 'a', isleaf: 1, recState: 1, statMethod: 1 },
    { configId: 'disabled', parentId: 'a', isleaf: 1, recState: 0, statMethod: 1 },
    { configId: 'hidden', parentId: 'a', isleaf: 1, recState: 1, statMethod: 1, isDisplay: 0 },
    { configId: 'nested', parentId: 'a', isleaf: 1, recState: 1, statMethod: 2, targetIds: ['a1'] },
    { configId: 'sum', parentId: '2026', isleaf: 1, recState: 1, statMethod: 2, targetIds: ['a', 'a', 'a1', 'nested'] }
  ]
  const relations = buildBudgetExecutionSummaryRows(configs)
  assert.deepEqual(relations.get('a'), ['a1', 'hidden', 'nested'])
  assert.deepEqual(relations.get('sum'), ['a1', 'hidden', 'a1'])
  assert.deepEqual(relations.get('nested'), ['a1'])
})

test('unit totals use backend amount differences and weighted ratios and recalculate after edits', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  for (const reportType of ['budget', 'yap']) {
    for (const extended of [false, true]) {
      for (const backendFields of [false, true]) {
        const field = (unit, code) => backendFields ? `ORGID_${unit};INDICATORID_${code}` : `${unit}_${code}`
        const codes = ['PHTZFD', 'WCL', 'PHMBZ', 'WCZ', 'MBZ_NEW', 'DFJ', 'YFJ', 'XMSL']
        const units = ['total', 'DW_A', 'DW_B']
        const values = [
          [extended ? 70 : 55, extended ? 0.27 : 0.2667, 300, 80, 370, 15, 355, 3],
          [15, 20, 100, 20, 120, 5, 115, 1],
          [40, 30, 200, 60, 250, 10, 240, 2]
        ]
        const row = Object.fromEntries(units.flatMap((unit, i) => [...codes.map((code, j) => [field(unit, code), values[i][j]]), [field(unit, 'MBZ'), [300, 100, 200][i]]]))
        const saved = await createFormulaExport({
          context: { reportType, extended, unitType: 'DW' },
          columns: units.flatMap((unit) => codes.map((code) => ({ field: field(unit, code), title: `${unit}${code}` }))), rows: [row]
        })
        const sheet = saved.getWorksheet('预算执行')
        assert.equal(sheet.getCell('A2').formula, extended ? 'E2-C2' : 'SUM(I2,Q2)')
        assert.deepEqual(sheet.getCell('C2').value, { formula: 'SUM(K2,S2)', result: 300 })
        assert.deepEqual(sheet.getCell('D2').value, { formula: 'SUM(L2,T2)', result: 80 })
        assert.equal(sheet.getCell('G2').formula, extended ? 'E2-F2' : 'SUM(O2,W2)')
        assert.equal(sheet.getCell('B2').result, 26.6667)
        const edited = await recalculateExport(sheet, { M2: 140, L2: 60 })
        assert.equal(edited.C2, 300)
        assert.equal(edited.D2, 120)
        assert.equal(edited.B2, 40)
        if (extended) {
          assert.equal(edited.A2, 90)
          assert.equal(edited.G2, 375)
        }
      }
    }
  }
})

test('omitted unit columns become hidden inputs while genuinely missing inputs preserve backend totals', async () => {
  const sourceColumns = ['total_MBZ', 'A_MBZ', 'B_MBZ'].map((field) => ({ field, title: field }))
  for (const [columns, row] of [
    [sourceColumns.slice(0, 2), { total_MBZ: 10, A_MBZ: 10, B_MBZ: 0 }],
    [sourceColumns.slice(0, 2), { total_MBZ: 10, A_MBZ: 10 }],
    [sourceColumns, { total_MBZ: 50, A_MBZ: 10, B_MBZ: 20 }]
  ]) {
    const saved = await createFormulaExport({
      context: { reportType: 'budget', extended: true, unitType: 'DW' },
      exportOptions: { sourceColumns }, columns, rows: [row]
    })
    const cell = saved.getWorksheet('预算执行').getCell('A2')
    if (Object.hasOwn(row, 'B_MBZ')) {
      assert.deepEqual(cell.value, { formula: 'SUM(B2,C2)', result: row.A_MBZ + row.B_MBZ })
      assert.equal(saved.getWorksheet('预算执行').getColumn(3).hidden, columns.length < 3)
    }
    else assert.equal(cell.value, row.total_MBZ)
  }
})

test('comparison unit totals isolate current, previous and unmarked fields and recalculate differences', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  const key = (unit, period) => `ORGID_${unit};${period ? `${period};` : ''}INDICATORID_WCZ`
  const delta = 'ORGID_total;INDICATORID_TBHBJE'
  const row = { [delta]: 18 }
  for (const [period, amounts] of [['', [300, 100, 200]], ['CURRENT', [30, 10, 20]], ['LAST', [12, 5, 7]]]) {
    for (const [index, unit] of ['total', 'A', 'B'].entries()) row[key(unit, period)] = amounts[index]
  }
  const fields = Object.keys(row)
  const saved = await createFormulaExport({
    context: { reportType: 'budget', extended: true, unitType: 'DW' },
    columns: fields.map((field) => ({ field, title: field })), rows: [row]
  })
  const sheet = saved.getWorksheet('预算执行')
  const cell = (field) => sheet.getCell(2, fields.indexOf(field) + 1)
  for (const period of ['', 'CURRENT', 'LAST']) {
    assert.equal(cell(key('total', period)).formula, `SUM(${cell(key('A', period)).address},${cell(key('B', period)).address})`)
  }
  const edited = await recalculateExport(sheet, { [cell(key('B', 'CURRENT')).address]: 50, [cell(key('A', 'LAST')).address]: 1 })
  assert.equal(edited[cell(key('total', '')).address], 300)
  assert.equal(edited[cell(key('total', 'CURRENT')).address], 60)
  assert.equal(edited[cell(key('total', 'LAST')).address], 8)
  assert.equal(edited[cell(delta).address], 52)
})

test('province and mother formulas sum budget inputs as well as execution values and recalculate ratios after edits', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  const data = {
    GSSX_SGS: { WCL: 6.2, MBZ: 1080, WCZ: 67, LXZ: 91, XMSL: 10 },
    GSSX_MGS: { WCL: 6, MBZ: 1000, WCZ: 60, LXZ: 80, XMSL: 6 },
    GSSX_JGBB: { WCL: 20, MBZ: 50, WCZ: 10, LXZ: 15, XMSL: 1 },
    GSSX_GDGS: { WCL: 13.33, MBZ: 150, WCZ: 20, LXZ: 25, XMSL: 2 },
    GSSX_ZSDW: { WCL: 10, MBZ: 300, WCZ: 30, LXZ: 40, XMSL: 3 },
    GSSX_ZGS: { WCL: 8.75, MBZ: 80, WCZ: 7, LXZ: 11, XMSL: 4 }
  }
  for (const reportType of ['budget', 'yap']) {
    for (const style of ['backend', 'short', 'CURRENT', 'LAST']) {
      const field = (unit, code) => style === 'short' ? `${unit}_${code}` : `ORGID_${unit};${['CURRENT', 'LAST'].includes(style) ? `${style};` : ''}INDICATORID_${code}`
      const row = Object.fromEntries(Object.entries(data).flatMap(([unit, values]) => Object.entries(values).map(([code, value]) => [field(unit, code), value])))
      const fields = Object.keys(row)
      const saved = await createFormulaExport({
        context: { reportType, extended: true, unitType: 'SGS' },
        columns: fields.map((field) => ({ field, title: field })), rows: [row]
      })
      const sheet = saved.getWorksheet('预算执行')
      const cell = (unit, code) => sheet.getCell(2, fields.indexOf(field(unit, code)) + 1)
      const refs = (units, code) => `SUM(${units.map((unit) => cell(unit, code).address).join(',')})`
      const components = ['GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW']
      for (const code of ['WCZ', 'LXZ', 'XMSL']) {
        assert.equal(cell('GSSX_MGS', code).formula, refs(components, code))
        assert.equal(cell('GSSX_SGS', code).formula, refs([...components, 'GSSX_ZGS'], code))
        assert.equal(cell('GSSX_MGS', code).result, data.GSSX_MGS[code])
      }
      assert.deepEqual(cell('GSSX_MGS', 'MBZ').value, { formula: refs(components, 'MBZ'), result: 500 })
      assert.equal(cell('GSSX_SGS', 'MBZ').result, 580)
      assert.equal(cell('GSSX_SGS', 'MBZ').formula, refs(['GSSX_MGS', 'GSSX_ZGS'], 'MBZ'))
      assert.equal(cell('GSSX_MGS', 'WCL').result, 12)
      assert.equal(cell('GSSX_MGS', 'WCZ').numFmt, '#,##0.0000')
      assert.equal(cell('GSSX_MGS', 'WCZ').protection?.locked ?? true, true)
      const edited = await recalculateExport(sheet, { [cell('GSSX_JGBB', 'WCZ').address]: 50, [cell('GSSX_ZGS', 'WCZ').address]: 17 })
      assert.equal(edited[cell('GSSX_MGS', 'WCZ').address], 100)
      assert.equal(edited[cell('GSSX_SGS', 'WCZ').address], 117)
      assert.equal(edited[cell('GSSX_MGS', 'WCL').address], 20)
      assert.equal(edited[cell('GSSX_SGS', 'WCL').address], 20.1724)
      const zero = await recalculateExport(sheet, Object.fromEntries(components.map((unit) => [cell(unit, 'MBZ').address, 0])))
      assert.equal(zero[cell('GSSX_MGS', 'WCL').address], '-')
    }
  }
})

test('mother formulas require complete inputs but do not depend on the returned aggregate', async () => {
  const units = ['GSSX_MGS', 'GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW']
  const field = (unit, code = 'WCZ') => `ORGID_${unit};INDICATORID_${code}`
  const columns = units.map((unit) => ({ field: field(unit), title: unit }))
  const row = { [field(units[0])]: 10, [field(units[1])]: 10, [field(units[2])]: 0, [field(units[3])]: 0 }
  for (const entry of [
    { columns: columns.slice(0, -1), row },
    { columns, row: Object.fromEntries(Object.entries(row).slice(0, -1)) },
    { columns: [...columns, columns[1]], row },
    { columns, row, unitType: 'DW' },
    { columns: units.map((unit) => ({ field: field(unit, 'JYL'), title: unit })), row: Object.fromEntries(units.map((unit) => [field(unit, 'JYL'), row[field(unit)]])) }
  ]) {
    const saved = await createFormulaExport({
      context: { reportType: 'budget', extended: true, unitType: entry.unitType || 'SGS' },
      columns: entry.columns, rows: [entry.row]
    })
    const cell = saved.getWorksheet('预算执行').getCell('A2')
    if (entry.columns.length === 3) {
      assert.deepEqual(cell.value, { formula: 'SUM(B2,C2,D2)', result: 10 })
      assert.equal(saved.getWorksheet('预算执行').getColumn(4).hidden, true)
    } else assert.equal(cell.value, 10)
  }
  const saved = await createFormulaExport({ columns, rows: [{ ...row, [field(units[0])]: 0, [field(units[1])]: null }] })
  assert.equal(saved.getWorksheet('预算执行').getCell('A2').formula, 'SUM(B2,C2,D2)')
  assert.equal(saved.getWorksheet('预算执行').getCell('A2').result, 0)
})

test('tree exports sum direct children at every level and recalculate parent ratios from those sums', async () => {
  for (const reportType of ['budget', 'yap']) {
    for (const headerRows of [0, 1, 3]) {
      for (const includeFormulaExplanations of [true, false]) {
        const a1 = { id: 'a1', name: '项目一', MBZ: 50, PHMBZ: 100, WCZ: 10, WCL: 10, XMSL: 1, JYL: 1 }
        const a2 = { id: 'a2', name: '项目二', MBZ: 150, PHMBZ: 200, WCZ: 50, WCL: 25, XMSL: 4, JYL: 1 }
        const a = { id: 'a', name: '类别一', MBZ: 200, PHMBZ: 300, WCZ: 60, WCL: 20, XMSL: 5, JYL: 2, children: [a1, a2] }
        const b = { id: 'b', name: '类别二', MBZ: 300, PHMBZ: 300, WCZ: 90, WCL: 30, XMSL: 3, JYL: 4 }
        const root = { id: 'root', name: '合计', MBZ: 500, PHMBZ: 600, WCZ: 150, WCL: 25, XMSL: 8, JYL: 6, children: [a, b] }
        const saved = await createFormulaExport({
          headerRows,
          treeConfig: { lazy: true, hasChildField: 'leaf' },
          context: { reportType, extended: true, unitType: 'DW' },
          exportOptions: { includeFormulaExplanations },
          columns: ['name', 'WCL', 'WCZ', 'MBZ', 'PHMBZ', 'XMSL', 'JYL'].map((field) => ({ field, title: field })),
          rows: [root, a, a1, a2, b]
        })
        const sheet = saved.getWorksheet('预算执行')
        const first = headerRows + 1
        for (const [column, total, subtotal] of [['C', 150, 60], ['D', 500, 200], ['E', 600, 300], ['F', 8, 5]]) {
          assert.deepEqual(sheet.getCell(`${column}${first}`).value, { formula: `SUM(${column}${first + 1},${column}${first + 4})`, result: total })
          assert.deepEqual(sheet.getCell(`${column}${first + 1}`).value, { formula: `SUM(${column}${first + 2}:${column}${first + 3})`, result: subtotal })
          assert.equal(sheet.getCell(`${column}${first}`).protection?.locked ?? true, true)
          assert.equal(typeof sheet.getCell(`${column}${first + 2}`).value, 'number')
        }
        assert.equal(sheet.getCell(`B${first}`).result, reportType === 'budget' ? 30 : 25)
        assert.equal(sheet.getCell(`B${first + 1}`).result, reportType === 'budget' ? 30 : 20)
        assert.equal(sheet.getCell(`G${first}`).value, 6) // 比率即使碰巧等于子级之和，也不能用 SUM。
        assert.equal(sheet.getCell(`C${first}`).numFmt, '#,##0.0000')
        if (includeFormulaExplanations) assert.match(noteText(sheet.getCell(`B${first}`)), /150 ÷ (500|600) × 100/)
        else assert.equal(sheet.getCell(`B${first}`).note, undefined)
      }
    }
  }
})

test('isZbLine rows preserve backend totals, ratios and differences even with children and zero denominators', async () => {
  for (const reportType of ['budget', 'yap']) {
    for (const unitType of ['DW', 'SGS']) {
      for (const isZbLine of [1, '1']) {
        const units = unitType === 'DW' ? ['total', 'A', 'B'] : ['GSSX_SGS', 'GSSX_MGS', 'GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW', 'GSSX_ZGS']
        const field = (unit, code, period = '') => `ORGID_${unit};${period ? `${period};` : ''}INDICATORID_${code}`
        const fields = units.flatMap((unit) => [
          ...['', 'CURRENT', 'LAST'].flatMap((period) => ['MBZ', 'PHMBZ', 'WCZ', 'WCL', 'MBZ_NEW', 'DFJ', 'PHTZFD', 'YFJ'].map((code) => field(unit, code, period))),
          field(unit, 'TBHBJE'), field(unit, 'TBHBL')
        ])
        const row = { id: 'static', isZbLine, ...Object.fromEntries(fields.map((field) => [field,
          /_(MBZ|PHMBZ)$/.test(field) ? 0 : field.endsWith('_WCL') ? (isZbLine === 1 ? 37.25 : '37.25%') : 42.625
        ])) }
        const child = { id: 'child', isZbLine: 0, ...Object.fromEntries(fields.map((field) => [field, /_(MBZ|PHMBZ)$/.test(field) ? 100 : 25])) }
        row.children = [child]
        const original = JSON.parse(JSON.stringify(row))
        const workbook = await createFormulaExport({
          context: { reportType, unitType, extended: true }, treeConfig: { lazy: true },
          columns: fields.map((field) => ({ field })), rows: [row, child],
          exportOptions: { includeFormulaExplanations: false }
        })
        const sheet = workbook.worksheets[0]
        fields.forEach((field, index) => {
          const cell = sheet.getCell(2, index + 1)
          assert.equal(cell.formula, undefined, `${reportType}/${unitType}/${isZbLine}/${field}`)
          assert.equal(cell.value, typeof row[field] === 'string' ? '37.2500%' : row[field])
        })
        for (const code of ['WCZ', 'WCL', 'TBHBJE', 'TBHBL']) {
          assert.ok(sheet.getCell(3, fields.indexOf(field(units[0], code)) + 1).formula, `ordinary child retains ${code} formulas`)
        }
        assert.equal(sheet.rowCount, 3)
        assert.equal(sheet.getRow(2).hidden, false)
        assert.deepEqual(row, original)
      }
    }
  }
})

test('vertical sums skip isZbLine children at every level and never include them after recalculation', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  for (const useSummaryRows of [false, true]) {
    const fields = ['', 'CURRENT', 'LAST'].map((period) => `ORGID_A;${period ? `${period};` : ''}INDICATORID_WCZ`)
    const row = (id, value, extra = {}) => ({ id, ...Object.fromEntries(fields.map((field) => [field, value])), ...extra })
    const first = row('first', 10)
    const marked = row('marked', 999, { isZbLine: '1' })
    const last = row('last', 20)
    const branch = row('branch', 999, { children: [first, marked, last] })
    const root = row('root', 999, { children: [branch, row('root-marked', 888, { isZbLine: 1 })] })
    const rows = [root, branch, first, marked, last, root.children[1]]
    const context = { ...extendedBudgetContext,
      ...(useSummaryRows ? { summaryRows: new Map([['root', ['branch', 'root-marked']], ['branch', ['first', 'marked', 'last']]]) } : {})
    }
    const workbook = await createFormulaExport({ context, treeConfig: {}, columns: fields.map((field) => ({ field })), rows, exportOptions: { includeFormulaExplanations: false } })
    const sheet = workbook.worksheets[0]
    for (const column of ['A', 'B', 'C']) {
      assert.deepEqual(sheet.getCell(`${column}2`).value, { formula: `SUM(${column}3)`, result: 30 })
      assert.deepEqual(sheet.getCell(`${column}3`).value, { formula: `SUM(${column}4,${column}6)`, result: 30 })
      assert.equal(sheet.getCell(`${column}5`).value, 999)
      assert.equal(sheet.getCell(`${column}7`).value, 888)
    }
    const changed = await recalculateExport(sheet, { A4: 40, A5: 12345, A7: 67890 })
    assert.equal(changed.A2, 60)
    assert.equal(changed.A3, 60)
  }
})

test('omitted isZbLine children do not block complete sums and all-marked children preserve the parent input', async () => {
  const first = { id: 'first', WCZ: 10 }
  const marked = { id: 'marked', WCZ: 999, isZbLine: 1 }
  for (const children of [[first, marked], [marked]]) {
    const root = { id: 'root', WCZ: 50, children }
    const rows = children.includes(first) ? [root, first] : [root]
    const workbook = await createFormulaExport({ treeConfig: {}, columns: [{ field: 'WCZ' }], rows, exportOptions: { includeFormulaExplanations: false } })
    const sheet = workbook.worksheets[0]
    assert.deepEqual(sheet.getCell('A2').value, children.includes(first) ? { formula: 'SUM(A3)', result: 10 } : 50)
    assert.equal(sheet.rowCount, rows.length + 1)
  }
})

test('collapsed main rows retain working horizontal and ratio formulas before and after loading children', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  for (const reportType of ['budget', 'yap']) {
    for (const unitType of ['DW', 'SGS']) {
      for (const loaded of [false, true]) {
        const units = unitType === 'DW' ? ['total', 'A', 'B'] : ['GSSX_SGS', 'GSSX_MGS', 'GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW', 'GSSX_ZGS']
        const field = (unit, code) => `ORGID_${unit};INDICATORID_${code}`
        const fields = units.flatMap((unit) => ['WCL', 'WCZ', 'MBZ', 'PHMBZ'].map((code) => field(unit, code)))
        const row = {
          id: 'root', leaf: true,
          ...Object.fromEntries(fields.map((key) => [key, key.endsWith('_WCZ') ? 20 : key.endsWith('_PHMBZ') ? 200 : 100]))
        }
        row[field(units[0], 'WCZ')] = 999
        if (loaded) row.children = [{ ...row, id: 'hidden-child', leaf: false }]
        const original = JSON.parse(JSON.stringify(row))
        const workbook = await createFormulaExport({
          context: { reportType, unitType, extended: true },
          treeConfig: { lazy: true, hasChildField: 'leaf' },
          columns: fields.map((field) => ({ field })), rows: [row],
          exportOptions: { includeFormulaExplanations: false }
        })
        const sheet = workbook.worksheets[0]
        const cell = (unit, code) => sheet.getCell(2, fields.indexOf(field(unit, code)) + 1)
        const total = cell(units[0], 'WCZ')
        const ratio = cell(units[0], 'WCL')
        const components = unitType === 'DW' ? ['A', 'B'] : ['GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW', 'GSSX_ZGS']
        assert.equal(total.formula, `SUM(${components.map((unit) => cell(unit, 'WCZ').address).join(',')})`)
        assert.equal(total.result, 20 * components.length)
        assert.match(ratio.formula, /^IFERROR\(ROUND\(/)
        assert.equal(ratio.result, 20)
        assert.equal(cell(components[0], 'WCZ').value, 20)
        assert.equal(cell(components[0], 'WCZ').protection.locked, false)
        assert.equal(sheet.rowCount, 2)
        assert.equal(workbook.worksheets.length, 1)
        sheet.eachRow((row) => assert.equal(row.hidden, false))
        assert.deepEqual(row, original, 'export must not calculate or change page values')
        const updated = await recalculateExport(sheet, { [cell(components[0], 'WCZ').address]: 40 })
        assert.equal(updated[total.address], 20 * components.length + 20)
        assert.equal(updated[ratio.address], unitType === 'DW' ? 30 : 25)
      }
    }
  }
})

test('collapsed branches remain editable inputs while complete exported siblings roll up to their parent', async () => {
  const a = { id: 'a', MBZ: 100, leaf: true }
  const b = { id: 'b', MBZ: -20, leaf: false }
  const root = { id: 'root', MBZ: 80, children: [a, b] }
  const saved = await createFormulaExport({
    treeConfig: { lazy: true },
    columns: [{ field: 'MBZ', title: '目标值' }],
    rows: [root, a, b]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.deepEqual(sheet.getCell('A2').value, { formula: 'SUM(A3:A4)', result: 80 })
  assert.equal(sheet.getCell('A3').value, 100)
  assert.equal(sheet.getCell('A3').protection.locked, false)
})

test('incomplete tree exports and duplicate children never become partial sums', async () => {
  const a = { id: 'a', MBZ: 100 }
  const b = { id: 'b', MBZ: 0 }
  for (const [root, rows, treeConfig] of [
    [{ MBZ: 100, children: [a, b] }, [a], {}], // 被省略的子级恰好为零，也不能建立不完整的汇总。
    [{ MBZ: 100, children: [a, b] }, [a, b], undefined],
    [{ MBZ: 200, children: [a, a] }, [a], {}]
  ]) {
    const saved = await createFormulaExport({
      treeConfig,
      columns: [{ field: 'MBZ', title: '目标值' }],
      rows: [root, ...rows]
    })
    assert.equal(saved.getWorksheet('预算执行').getCell('A2').value, root.MBZ ?? 0)
  }
})

test('tree sums support custom row fields, reordered rows, dynamic units and precise negative amounts', async () => {
  const field = 'ORGID_DW_01;INDICATORID_MBZ_NEW'
  const a = { key: 'a', [field]: '0.00002' }
  const b = { key: 'b', [field]: '-0.00001' }
  const root = { key: 'root', [field]: '0.00001', nodes: [{ ...a }, { ...b }] }
  const saved = await createFormulaExport({
    headerRows: 3,
    digits: 'XSWS_0',
    treeConfig: { childrenField: 'nodes', rowField: 'key' },
    columns: [...Array.from({ length: 26 }, (_, i) => ({ field: `label${i}`, title: `列${i}` })), { field, title: '年度目标值' }],
    rows: [b, root, a]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.deepEqual(sheet.getCell('AA5').value, { formula: 'SUM(AA4,AA6)', result: 0.00001 })
  assert.equal(sheet.getCell('AA5').numFmt, '#,##0')
})

test('large tree branches compress consecutive references and respect the Excel SUM argument limit', async () => {
  const columns = [{ field: 'MBZ', title: '目标值' }]
  const leaves = Array.from({ length: 300 }, (_, id) => ({ id: String(id), MBZ: 1 }))
  const compact = await createFormulaExport({ treeConfig: {}, columns, rows: [{ MBZ: 300, children: leaves }, ...leaves] })
  assert.equal(compact.getWorksheet('预算执行').getCell('A2').formula, 'SUM(A3:A302)')
  const branches = leaves.map((leaf) => ({ id: `parent-${leaf.id}`, MBZ: 1, children: [leaf] }))
  const sparse = await createFormulaExport({
    treeConfig: {}, columns,
    rows: [{ MBZ: 300, children: branches }, ...branches.flatMap((branch) => [branch, ...branch.children])]
  })
  const formula = sparse.getWorksheet('预算执行').getCell('A2').formula
  const groups = [...formula.matchAll(/SUM\(([^)]+)\)/g)].map((match) => match[1].split(','))
  assert.equal(groups.length, 2)
  assert.ok(groups.every((refs) => refs.length <= 255))
  assert.deepEqual(groups.flat(), branches.map((_, index) => `A${3 + index * 2}`))
})

test('editing exported leaf amounts recalculates all ancestor sums and weighted ratios in the formula engine', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  const leaf = { id: 'leaf', WCZ: 10, MBZ: 100, WCL: 10 }
  const branch = { id: 'branch', WCZ: 10, MBZ: 100, WCL: 10, children: [leaf] }
  const sibling = { id: 'sibling', WCZ: 90, MBZ: 300, WCL: 30 }
  const root = { id: 'root', WCZ: 100, MBZ: 400, WCL: 25, children: [branch, sibling] }
  const saved = await createFormulaExport({
    treeConfig: {},
    exportOptions: { includeFormulaExplanations: false },
    columns: ['WCL', 'WCZ', 'MBZ'].map((field) => ({ field, title: field })),
    rows: [root, branch, leaf, sibling]
  })
  const sheet = saved.getWorksheet('预算执行')
  const unchanged = await recalculateExport(sheet)
  assert.equal(unchanged.A2, 25)
  assert.equal(unchanged.B2, 100)
  const edited = await recalculateExport(sheet, { B4: 60, C4: 200 })
  assert.equal(edited.B3, 60)
  assert.equal(edited.C3, 200)
  assert.equal(edited.A3, 30)
  assert.equal(edited.B2, 150)
  assert.equal(edited.C2, 500)
  assert.equal(edited.A2, 30)
  const zeroTarget = await recalculateExport(sheet, { C4: 0, C5: 0 })
  assert.equal(zeroTarget.C2, 0)
  assert.equal(zeroTarget.A2, '-')
})

test('formula notes preserve all four explanation sections, real references and raw input precision', async () => {
  for (const headerRows of [0, 1, 3]) {
    const saved = await createFormulaExport({
      headerRows,
      digits: 'XSWS_0',
      columns: [
        { field: 'name', title: '名称' },
        { field: 'WCL', title: '完成率' },
        { field: 'WCZ', title: '完成值' },
        { field: 'MBZ', title: '目标值' }
      ],
      rows: [{ name: '小额项目', WCL: 50, WCZ: 0.00002, MBZ: 0.00004 }]
    })
    const sheet = saved.getWorksheet('预算执行')
    const cell = sheet.getCell(`B${headerRows + 1}`)
    const text = noteText(cell)
    assert.match(text, new RegExp(`单元格：B${headerRows + 1} · 完成率`))
    assert.match(text, /业务公式\n完成率 = 完成值 ÷ 目标值 × 100/)
    assert.match(text, /计算过程\n0\.00002 ÷ 0\.00004 × 100 ≈ 50/)
    assert.match(text, /计算结果\n50\n/)
    assert.ok(text.includes(`原始公式\n=${cell.formula}\n`))
    assert.match(text, /批注不会自动更新/)
    assert.equal(sheet.getCell(`C${headerRows + 1}`).note, undefined)
    if (headerRows) assert.equal(sheet.getCell('B1').note, undefined)
  }
})

test('formula notes explain balanced targets and percentage conversion using the actual calculation context', async () => {
  const saved = await createFormulaExport({
    context: { reportType: 'yap', extended: true, unitType: 'DW' },
    columns: [
      { field: 'WCL', title: '完成率' },
      { field: 'WCZ', title: '完成值' },
      { field: 'MBZ', title: '目标值' },
      { field: 'PHMBZ', title: '平衡目标值' },
      { field: 'total_WCL', title: '合计完成率' },
      { field: 'total_WCZ', title: '合计完成值' },
      { field: 'total_MBZ', title: '合计目标值' }
    ],
    rows: [{ WCL: '25.00%', WCZ: 50, MBZ: 100, PHMBZ: 200, total_WCL: 0.25, total_WCZ: 50, total_MBZ: 100, total_PHMBZ: 200 }]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.match(noteText(sheet.getCell('A2')), /完成率 = 完成值 ÷ 平衡目标值 × 100/)
  assert.match(noteText(sheet.getCell('A2')), /25 ÷ 100，以百分比显示为 25\.0000%/)
  assert.match(noteText(sheet.getCell('A2')), /计算结果\n25\.0000%\n/)
  assert.match(noteText(sheet.getCell('E2')), /合计完成率 = 合计完成值 ÷ 合计目标值 × 100\n/)
  assert.match(noteText(sheet.getCell('E2')), /50 ÷ 100 × 100 ≈ 50/)
  assert.match(noteText(sheet.getCell('E2')), /计算结果\n50\.0000\n/)
})

test('formula notes distinguish missing inputs, zero denominators and invalid values without inventing formulas', async () => {
  const saved = await createFormulaExport({
    columns: ['WCL', 'WCZ', 'MBZ', 'B_WCL'].map((field) => ({ field, title: field })),
    rows: [
      { WCL: 0, WCZ: 1, MBZ: 0, B_WCL: 12 },
      { WCL: null, WCZ: null, MBZ: 10 },
      { WCL: 0, WCZ: null, MBZ: 10 },
      { WCL: 0, WCZ: 'invalid', MBZ: 10 }
    ]
  })
  const sheet = saved.getWorksheet('预算执行')
  assert.match(noteText(sheet.getCell('A2')), /C2）为 0，按当前公式返回 -/)
  assert.equal(sheet.getCell('A3').result, 0)
  assert.match(noteText(sheet.getCell('A3')), /0 ÷ 10 × 100 ≈ 0/)
  assert.equal(sheet.getCell('A4').result, 0)
  assert.match(noteText(sheet.getCell('A4')), /0 ÷ 10 × 100 ≈ 0/)
  assert.match(noteText(sheet.getCell('A5')), /B5=invalid/)
  assert.match(noteText(sheet.getCell('A5')), /计算结果\n-\n/)
  assert.equal(sheet.getCell('D2').value, 12)
  assert.equal(sheet.getCell('D2').note, undefined)
})

test('native notes serialize as hidden hover comments and preserve formulas and existing comments', async () => {
  const { addCalculationNote } = loadTypeScript('src/views/statistics/budgetExecutionAnalysis/calculationNotes.ts')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('计算说明尺寸')
  sheet.getCell('A2').value = { formula: 'B2/C2*100', result: 25 }
  sheet.getCell('A2').numFmt = '0.00'
  sheet.getCell('B2').value = 50
  sheet.getCell('C2').value = 200
  sheet.getCell('D2').value = '已有说明'
  sheet.getCell('D2').note = '原有批注'
  addCalculationNote(sheet.getCell('A2'), {
    title: '完成率',
    numeratorTitle: '完成值',
    denominatorTitle: '目标值',
    numerator: sheet.getCell('B2'),
    denominator: sheet.getCell('C2'),
    multiplier: 100,
    scale: 2,
    percentDivisor: 1
  })
  const buffer = await workbook.xlsx.writeBuffer()
  const readXml = await readXlsxXml(buffer)
  const vml = await readXml('xl/drawings/vmlDrawing1.vml')
  assert.match(vml, /visibility:hidden/)
  const saved = new ExcelJS.Workbook()
  await saved.xlsx.load(buffer)
  assert.deepEqual(saved.getWorksheet(1).getCell('A2').value, { formula: 'B2/C2*100', result: 25 })
  assert.match(noteText(saved.getWorksheet(1).getCell('A2')), /计算结果\n25\.00\n/)
  assert.equal(saved.getWorksheet(1).getCell('D2').note, '原有批注')
})

test('comparison modal drops backend widths and measures every column from header and current rows', () => {
  const period = (name, code) => `ORGID_DW001;${name};INDICATORID_${code}`
  const serverColumns = [
    { field: 'name', title: '名称', width: 260 },
    { title: '本期', children: ['MBZ', 'WCL'].map((code) => ({ field: period('CURRENT', code), title: code, width: 120 })) },
    { title: '上年同期', children: ['MBZ', 'WCL'].map((code) => ({ field: period('LAST', code), title: code, width: 120 })) },
    {
      title: '同比增幅',
      children: [
        { field: 'ORGID_DW001;INDICATORID_TBHBJE', title: '金额', width: 140 },
        { field: 'ORGID_DW001;INDICATORID_TBHBL', title: '比率', width: 140 }
      ]
    }
  ]
  const rows = [
    {
      name: '电网基建',
      sfjc: '1',
      [period('CURRENT', 'MBZ')]: '1234.5678',
      [period('LAST', 'MBZ')]: '1000.1111',
      [period('CURRENT', 'WCL')]: '75.1234',
      [period('LAST', 'WCL')]: '70.0000',
      'ORGID_DW001;INDICATORID_TBHBJE': '234.4567',
      'ORGID_DW001;INDICATORID_TBHBL': '5.1234'
    }
  ]
  // 后端下发的 width / minWidth 全部剔除，且不破坏其余列配置。
  const stripped = stripColumnWidths(serverColumns)
  const walk = (list) => list.flatMap((column) => [column, ...(column.children ? walk(column.children) : [])])
  assert.ok(walk(stripped).every((column) => !('width' in column) && !('minWidth' in column)))
  assert.deepEqual(
    walk(stripped).map((column) => column.title),
    walk(serverColumns).map((column) => column.title)
  )
  assert.equal(stripped[0].field, 'name')
  assert.deepEqual(
    stripped[1].children.map((column) => column.field),
    serverColumns[1].children.map((column) => column.field)
  )

  const fitted = fitNumericColumnWidths(
    decorateDynamicColumns(stripColumnWidths(serverColumns), 'XSWS_2', formatNumValue),
    rows,
    undefined,
    { fitTextColumns: true }
  )
  const leaves = getExportLeafColumns(fitted)
  // 每列都有前端测量的宽度，不会落到 VXE 的 40px 自适应宽度。
  assert.ok(leaves.every((column) => Number(column.width) >= 96))
  // 文本列按内容测量，不再沿用后端的 260。
  assert.notEqual(fitted[0].width, 260)
  assert.ok(Number(fitted[0].width) >= 96)

  // 数字列仍按格式化后的显示值测量：'-98,765.4321' 需要比表头更宽。
  const fittedNumbers = fitNumericColumnWidths(
    decorateDynamicColumns(stripColumnWidths(serverColumns), 'XSWS_4', formatNumValue),
    [{ ...rows[0], [period('LAST', 'MBZ')]: '-98765.4321' }],
    undefined,
    { fitTextColumns: true }
  )
  const lastAmount = getExportLeafColumns(fittedNumbers).find((column) => column.field === period('LAST', 'MBZ'))
  assert.ok(Number(lastAmount.width) > 96)

  // 文本列超长内容按上限收敛，避免撑爆弹窗。
  const longName = fitNumericColumnWidths(
    decorateDynamicColumns(stripColumnWidths(serverColumns), 'XSWS_2', formatNumValue),
    [{ ...rows[0], name: '超长项目名称'.repeat(20) }],
    undefined,
    { fitTextColumns: true }
  )
  assert.ok(Number(longName[0].width) <= 320)
})

test('comparison modal leaves numeric columns unwidened when text fitting is off', () => {
  const columns = [
    { field: 'name', title: '名称' },
    { field: 'MBZ', title: '目标值' }
  ]
  const fitted = fitNumericColumnWidths(decorateDynamicColumns(columns, 'XSWS_2', formatNumValue), [{ name: '明细项目' }])
  // 文本列不参与测量；数字列无数据时也不改宽度，供四个页面主表沿用后端列宽。
  assert.equal(fitted[0].width, undefined)
  assert.equal(fitted[1].width, undefined)
  const fittedWithValue = fitNumericColumnWidths(decorateDynamicColumns(columns, 'XSWS_2', formatNumValue), [
    { name: '明细项目', MBZ: '1234.5678' }
  ])
  assert.equal(fittedWithValue[0].width, undefined)
  assert.ok(Number(fittedWithValue[1].width) >= 96)
})

test('dynamic columns freeze only the first top-level column and never part of a group', () => {
  const columns = decorateDynamicColumns(
    [
      { field: 'name', title: '名称' },
      { field: 'subName', title: '承诺子项' },
      {
        title: '本期',
        children: [
          { field: 'MBZ', title: '目标值' },
          { field: 'WCL', title: '完成率' }
        ]
      }
    ],
    'XSWS_2',
    formatNumValue
  )
  assert.equal(columns[0].fixed, 'left')
  assert.equal(columns[1].fixed, undefined)
  assert.equal(columns[2].fixed, undefined)
  assert.deepEqual(
    columns[2].children.map((column) => column.fixed),
    [undefined, undefined]
  )

  // 第一列是分组时整体冻结，子列与分组保持一致（VXE 不允许只冻结分组内的子列）。
  const grouped = decorateDynamicColumns(
    [
      {
        title: '项目',
        children: [
          { field: 'name', title: '名称' },
          { field: 'subName', title: '编码' }
        ]
      },
      { field: 'MBZ', title: '目标值' }
    ],
    'XSWS_2',
    formatNumValue
  )
  assert.equal(grouped[0].fixed, 'left')
  assert.deepEqual(
    grouped[0].children.map((column) => column.fixed),
    ['left', 'left']
  )
  assert.equal(grouped[1].fixed, undefined)
  // 导出按叶子列统计冻结列数：整组冻结时冻结整组的全部列。
  assert.equal(getExportLeafColumns(grouped).filter((column) => column.fixed === 'left').length, 2)

  // 显式指定两列时保留原有冻结规则（如项目预算一览表）。
  const twoColumns = decorateDynamicColumns([{ field: 'name' }, { field: 'subName' }, { field: 'MBZ' }], 'XSWS_2', formatNumValue, 2)
  assert.deepEqual(
    twoColumns.map((column) => column.fixed),
    ['left', 'left', undefined]
  )
})


test('Excel comparison descriptions and notes use only backend group and indicator titles', async () => {
  for (const [comparison, previous] of [
    ['同比', '去年同期'],
    ['环比', '上月合计']
  ]) {
    for (const pluginColumnTree of [false, true]) {
      const columns = [
        {
          title: '本月合计',
          children: [
            { field: 'ORGID_A;CURRENT;INDICATORID_WCZ', title: '支出' },
            { field: 'ORGID_A;CURRENT;INDICATORID_WCL', title: '执行率' }
          ]
        },
        {
          title: previous,
          children: [
            { field: 'ORGID_A;LAST;INDICATORID_WCZ', title: '实际支出' },
            { field: 'ORGID_A;LAST;INDICATORID_WCL', title: '预算执行率' }
          ]
        },
        {
          title: comparison,
          children: [
            { field: 'ORGID_A;INDICATORID_TBHBJE', title: '金额' },
            { field: 'ORGID_A;INDICATORID_TBHBL', title: '比率' }
          ]
        }
      ]
      const saved = await createFormulaExport({
        columns,
        pluginColumnTree,
        rows: [
          {
            'ORGID_A;CURRENT;INDICATORID_WCZ': 50,
            'ORGID_A;CURRENT;INDICATORID_WCL': 25,
            'ORGID_A;LAST;INDICATORID_WCZ': 20,
            'ORGID_A;LAST;INDICATORID_WCL': 10,
            'ORGID_A;INDICATORID_TBHBJE': 30,
            'ORGID_A;INDICATORID_TBHBL': 15
          }
        ]
      })
      const explanations = saved.getWorksheet('计算公式说明')
      const amountFormula = `${comparison}金额 = 本月合计支出 − ${previous}实际支出`
      const rateFormula = `${comparison}比率 = 本月合计执行率 − ${previous}预算执行率`
      assert.equal(explanations.getCell('A2').value, `${comparison}金额`)
      assert.equal(explanations.getCell('B2').value, amountFormula)
      assert.equal(explanations.getCell('B3').value, rateFormula)
      const sheet = saved.getWorksheet('预算执行')
      assert.ok(noteText(sheet.getCell('E2')).includes(`业务公式\n${amountFormula}`))
      assert.ok(noteText(sheet.getCell('F2')).includes(`业务公式\n${rateFormula}`))
      assert.ok(noteText(sheet.getCell('E2')).includes('50 − 20 ≈ 30'))
      assert.equal(sheet.getCell('E2').result, 30)
      assert.equal(sheet.getCell('F2').result, 15)
    }
  }
})

test('exported comparison explanations retain captured titles and omit missing titles without changing formulas', async () => {
  const columns = [
    { title: '本月合计', children: [{ field: 'ORGID_A;CURRENT;INDICATORID_WCZ', title: '支出' }] },
    { title: '去年同期', children: [{ field: 'ORGID_A;LAST;INDICATORID_WCZ', title: '支出' }] },
    { title: '同比', children: [{ field: 'ORGID_A;INDICATORID_TBHBJE', title: '金额' }] }
  ]
  const rows = [{ 'ORGID_A;CURRENT;INDICATORID_WCZ': 50, 'ORGID_A;LAST;INDICATORID_WCZ': 20, 'ORGID_A;INDICATORID_TBHBJE': 30 }]
  const formulaTitles = createFormulaTitleMap(columns)
  columns[1].title = '重新查询后的期间'
  const captured = await createFormulaExport({ columns, rows, exportOptions: { formulaTitles } })
  assert.equal(captured.getWorksheet('计算公式说明').getCell('B2').value, '同比金额 = 本月合计支出 − 去年同期支出')
  for (const missing of [columns[1], columns[1].children[0]]) {
    const title = missing.title
    missing.title = ''
    const saved = await createFormulaExport({ columns, rows })
    assert.equal(saved.getWorksheet('计算公式说明'), undefined)
    assert.equal(saved.getWorksheet('预算执行').getCell('C2').note, undefined)
    assert.equal(saved.getWorksheet('预算执行').getCell('C2').result, 30)
    missing.title = title
  }
})

test('complete province inputs replace stale or empty aggregates and retain every ratio formula at selected precision', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  const units = ['GSSX_SGS', 'GSSX_MGS', 'GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW', 'GSSX_ZGS']
  for (const reportType of ['budget', 'yap']) {
    for (const period of ['', 'CURRENT;', 'LAST;']) {
      const field = (unit, code) => `ORGID_${unit};${period}INDICATORID_${code}`
      for (const digits of [0, 2, 4]) {
        const context = { reportType, extended: true, unitType: 'SGS' }
        const codes = ['WCL', 'LXL', 'WCZ', 'LXZ', 'MBZ']
        const columns = units.flatMap((unit) => codes.map((code) => ({ field: field(unit, code), title: code })))
        const row = Object.fromEntries(units.flatMap((unit, index) => codes.map((code) => [field(unit, code), ['WCL', 'LXL'].includes(code) ? null : code === 'MBZ' ? 300 : (index + 1) * (code === 'WCZ' ? 2 : 3)])))
        const rows = [null, '', 999].map((stale) => ({ ...row, [field('GSSX_MGS', 'WCZ')]: stale, [field('GSSX_MGS', 'LXZ')]: stale, [field('GSSX_SGS', 'WCZ')]: stale }))
        const workbook = await createFormulaExport({ context, columns, rows, digits: `XSWS_${digits}`, exportOptions: { includeFormulaExplanations: false } })
        const sheet = workbook.worksheets[0]
        const decorated = decorateDynamicColumns(columns, `XSWS_${digits}`, formatNumValue, undefined, { emptyNumericAsZero: true })
        const cell = (unit, code, rowIndex = 0) => sheet.getCell(rowIndex + 2, columns.findIndex((column) => column.field === field(unit, code)) + 1)
        for (let index = 0; index < rows.length; index++) {
          assert.match(cell('GSSX_MGS', 'WCZ', index).formula, /^SUM\(/)
          assert.equal(cell('GSSX_MGS', 'WCZ', index).result, 24)
          assert.equal(cell('GSSX_SGS', 'WCZ', index).result, 36)
          for (const code of ['WCL', 'LXL']) {
            assert.match(cell('GSSX_MGS', code, index).formula, /ROUND\(/)
            const expected = code === 'WCL' ? 24 / 900 * 100 : 36 / 900 * 100
            assert.equal(cell('GSSX_MGS', code, index).result, Number(expected.toFixed(digits)))
            const column = decorated.find((item) => item.field === field('GSSX_MGS', code))
            assert.equal(column.formatter({ cellValue: null, row: rows[index] }), formatNumValue(0, digits))
          }
        }
        const recalculated = await recalculateExport(sheet, { [cell('GSSX_JGBB', 'WCZ').address]: 15, [cell('GSSX_ZGS', 'WCZ').address]: 99 })
        assert.equal(recalculated[cell('GSSX_MGS', 'WCZ').address], 33)
        assert.equal(recalculated[cell('GSSX_SGS', 'WCZ').address], 132)
        assert.equal(recalculated[cell('GSSX_MGS', 'WCL').address], Number((33 / 900 * 100).toFixed(digits)))
        assert.equal(workbook.worksheets.length, 1)
      }
    }
  }
})

test('tree and unit totals recompute null, rounded and stale results with caches calculated in dependency order', async () => {
  for (const stale of [null, '', 999, 0.33]) {
    const leaf = { id: 'leaf', MBZ: 3, WCZ: 1, WCL: null }
    const branch = { id: 'branch', MBZ: stale, WCZ: stale, WCL: null, children: [leaf] }
    const root = { id: 'root', MBZ: stale, WCZ: stale, WCL: null, children: [branch] }
    const saved = await createFormulaExport({ treeConfig: {}, columns: ['MBZ', 'WCZ', 'WCL'].map((field) => ({ field })), rows: [root, branch, leaf] })
    const sheet = saved.worksheets[0]
    assert.equal(sheet.getCell('A2').result, 3)
    assert.equal(sheet.getCell('B2').result, 1)
    assert.equal(sheet.getCell('C2').result, 33.3333)
    assert.equal(sheet.getCell('A3').result, 3)
    const total = await createFormulaExport({ context: { ...extendedBudgetContext, unitType: 'DW' }, columns: ['total_MBZ', 'A_MBZ', 'B_MBZ'].map((field) => ({ field })), rows: [{ total_MBZ: stale, A_MBZ: 3, B_MBZ: 7 }] })
    assert.deepEqual(total.worksheets[0].getCell('A2').value, { formula: 'SUM(B2,C2)', result: 10 })
  }
})

test('rate-only exports retain returned operands as hidden columns and recalculate without explanation sheets', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  for (const digits of [0, 2, 4]) {
    const saved = await createFormulaExport({
      digits: `XSWS_${digits}`, columns: ['WCL', 'LXL'].map((field) => ({ field })),
      rows: [{ WCL: null, LXL: null, WCZ: 1, LXZ: 2, MBZ: 3 }, { WCL: null, LXL: null, WCZ: 10, LXZ: null, MBZ: 0 }],
      exportOptions: { includeFormulaExplanations: false }
    })
    const sheet = saved.worksheets[0]
    assert.equal(sheet.getCell('A2').result, Number((100 / 3).toFixed(digits)))
    assert.equal(sheet.getCell('B2').result, Number((200 / 3).toFixed(digits)))
    assert.equal(sheet.getCell('A3').result, '-')
    assert.equal(sheet.getCell('B3').result, '-')
    for (const index of [3, 4, 5]) assert.equal(sheet.getColumn(index).hidden, true)
    const updated = await recalculateExport(sheet, { C2: 3 })
    assert.equal(updated.A2, 100)
    assert.equal(saved.worksheets.length, 1)
  }
})

test('every mother-company amount is the three operating groups, including targets, pending budgets and adjustments', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  const codes = ['MBZ', 'PHMBZ', 'MBZ_NEW', 'DFJ', 'NDDFJ', 'WCZ', 'LXZ', 'YJQNWCZ', 'YJJY', 'PHTZFD', 'YFJ', 'XMSL', 'GBSL', 'YKGXMSL', 'YZTBXMSL', 'HTQDXMSL', 'ZFWHTJE', 'ZWZHTJE', 'ZFWZBJE', 'ZWZZBJE', 'YGBXMSFYS']
  const components = ['GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW']
  for (const reportType of ['budget', 'yap']) {
    for (const period of ['', 'CURRENT;', 'LAST;']) {
      const key = (unit, code) => `ORGID_${unit};${period}INDICATORID_${code}`
      const row = Object.fromEntries(['GSSX_SGS', 'GSSX_MGS', ...components, 'GSSX_ZGS'].flatMap((unit) => codes.map((code) => [key(unit, code), unit === 'GSSX_MGS' ? 999 : unit === 'GSSX_SGS' ? 9999 : unit === 'GSSX_ZGS' ? 100 : (components.indexOf(unit) + 1) * 10])))
      row[key('GSSX_MGS', 'WCL')] = null
      row[key('GSSX_MGS', 'LXL')] = null
      // 导出列把母公司排在最后，验证省公司不会读取尚未汇总的旧目标值。
      const fields = Object.keys(row).sort((a, b) => Number(a.includes('GSSX_MGS')) - Number(b.includes('GSSX_MGS')))
      const workbook = await createFormulaExport({ context: { reportType, extended: true, unitType: 'SGS' }, columns: fields.map((field) => ({ field })), rows: [row], exportOptions: { includeFormulaExplanations: false } })
      const sheet = workbook.worksheets[0]
      const cell = (unit, code) => sheet.getCell(2, fields.indexOf(key(unit, code)) + 1)
      for (const code of codes) {
        assert.equal(cell('GSSX_MGS', code).formula, `SUM(${components.map((unit) => cell(unit, code).address).join(',')})`)
        assert.equal(cell('GSSX_MGS', code).result, 60)
        assert.equal(cell('GSSX_SGS', code).result, 160)
        assert.equal(cell('GSSX_MGS', code).numFmt, '#,##0.0000')
      }
      const edited = await recalculateExport(sheet, { [cell('GSSX_JGBB', 'MBZ').address]: 40, [cell('GSSX_ZGS', 'MBZ').address]: 500 })
      assert.equal(edited[cell('GSSX_MGS', 'MBZ').address], 90)
      assert.equal(edited[cell('GSSX_SGS', 'MBZ').address], 590)
      assert.equal(edited[cell('GSSX_MGS', 'WCL').address], 66.6667)
      assert.equal(edited[cell('GSSX_MGS', 'LXL').address], 66.6667)
      const zero = await recalculateExport(sheet, Object.fromEntries(components.map((unit) => [cell(unit, 'MBZ').address, 0])))
      assert.equal(zero[cell('GSSX_MGS', 'WCL').address], '-')
      assert.equal(zero[cell('GSSX_MGS', 'LXL').address], '-')
      assert.equal(workbook.worksheets.length, 1)
    }
  }
})

test('main exports calculate across units and loaded page rows even with reordered headers', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  for (const reportType of ['budget', 'yap']) {
    for (const headerRows of [0, 1, 3]) {
      const root = { id: 'root', name: '合计', total_WCL: null, total_PHTZFD: null, A_WCZ: 999 }
      const leaves = [
        { id: 'a', name: '明细 A', A_MBZ: 100, B_MBZ: 200, A_PHMBZ: 100, B_PHMBZ: 200, A_WCZ: 30, B_WCZ: 60, A_MBZ_NEW: 120, B_MBZ_NEW: 220 },
        { id: 'b', name: '明细 B', A_MBZ: 200, B_MBZ: 300, A_PHMBZ: 200, B_PHMBZ: 300, A_WCZ: 40, B_WCZ: 70, A_MBZ_NEW: 230, B_MBZ_NEW: 330 }
      ]
      root.children = leaves
      const context = { reportType, extended: true, unitType: 'DW' }
      const workbook = await createFormulaExport({ context, headerRows, treeConfig: {}, rows: [root, ...leaves], columns: ['name', 'total_PHTZFD', 'total_WCL'].map((field) => ({ field })), exportOptions: { includeFormulaExplanations: false } })
      const sheet = workbook.worksheets[0]
      const row = headerRows + 1
      const column = (field) => {
        if (headerRows) return sheet.getRow(headerRows).values.findIndex((value) => value === field)
        // 无表头场景的列顺序：可见列、调整幅度输入、完成率输入及单位输入。
        return ['name', 'total_PHTZFD', 'total_WCL', 'total_MBZ_NEW', 'total_PHMBZ', 'total_WCZ', 'total_MBZ', 'A_MBZ_NEW', 'B_MBZ_NEW', 'A_PHMBZ', 'B_PHMBZ', 'A_WCZ', 'B_WCZ', 'A_MBZ', 'B_MBZ'].indexOf(field) + 1
      }
      assert.equal(sheet.getCell(row, 2).result, 100)
      assert.equal(sheet.getCell(row, 2).formula, `SUM(B${row + 1}:B${row + 2})`)
      assert.equal(sheet.getCell(row, 3).result, 25)
      assert.equal(sheet.getRow(row).hidden, false)
      for (const offset of [1, 2]) assert.equal(sheet.getRow(row + offset).hidden, false)
      assert.equal(sheet.getCell(row + 1, 1).value, '明细 A')
      for (let index = 4; index <= sheet.columnCount; index++) assert.equal(sheet.getColumn(index).hidden, true)
      const updates = await recalculateExport(sheet, {
        [sheet.getCell(row + 1, column('A_WCZ')).address]: 110,
        [sheet.getCell(row + 2, column('B_MBZ')).address]: 500,
        [sheet.getCell(row + 2, column('B_MBZ_NEW')).address]: 350
      })
      assert.equal(updates[sheet.getCell(row, 2).address], 120)
      assert.equal(updates[sheet.getCell(row, 3).address], 28)
      assert.equal(workbook.worksheets.length, 1)
      assert.deepEqual(root.children, leaves)
    }
  }
})

test('comparison-only exports calculate both periods using the loaded page hierarchy before subtracting', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  for (const reportType of ['budget', 'yap']) {
    const field = (unit, code, period) => `ORGID_${unit};${period ? `${period};` : ''}INDICATORID_${code}`
    const root = { id: 'root' }
    const leaves = ['a', 'b', 'c'].map((id, index) => ({ id, ...Object.fromEntries(['CURRENT', 'LAST'].flatMap((period) => ['A', 'B'].flatMap((unit) => [
      [field(unit, 'WCZ', period), (index + 1) * (period === 'CURRENT' ? 20 : 10)],
      [field(unit, 'MBZ', period), 100]
    ]))) }))
    root.children = leaves.slice(0, 2)
    const context = { reportType, extended: true, unitType: 'DW' }
    const workbook = await createFormulaExport({ context, treeConfig: {}, rows: [root, ...leaves], columns: ['TBHBL', 'TBHBJE'].map((code) => ({ field: field('total', code) })), exportOptions: { includeFormulaExplanations: false } })
    const sheet = workbook.worksheets[0]
    assert.equal(sheet.getCell('A2').result, 15)
    assert.equal(sheet.getCell('B2').result, 60)
    const inputColumn = sheet.getRow(1).values.indexOf(field('A', 'WCZ', 'CURRENT'))
    const updates = await recalculateExport(sheet, { [sheet.getCell(3, inputColumn).address]: 60 })
    assert.equal(updates.A2, 25)
    assert.equal(updates.B2, 100)
    assert.equal(sheet.rowCount, 5)
    for (const row of [3, 4, 5]) assert.equal(sheet.getRow(row).hidden, false)
  }
})

test('vertical parent formulas survive horizontal totals at every level in main and comparison exports', async () => {
  const { recalculateExport } = loadTypeScript('tests/helpers/budgetFormulaEngine.ts')
  for (const reportType of ['budget', 'yap']) {
    for (const unitType of ['DW', 'SGS']) {
      for (const period of ['', 'CURRENT', 'LAST']) {
        const units = unitType === 'DW' ? ['total', 'A', 'B'] : ['GSSX_SGS', 'GSSX_MGS', 'GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW', 'GSSX_ZGS']
        const codes = ['WCZ', 'PHMBZ', 'MBZ', 'WCL']
        const fields = units.flatMap((unit) => codes.map((code) => `ORGID_${unit};${period ? `${period};` : ''}INDICATORID_${code}`))
        const rows = ['root', 'branch', 'a', 'b'].map((id, index) => ({ id, ...Object.fromEntries(fields.map((field) => [field, index < 2 ? 999 : field.endsWith('_WCZ') ? 10 * index : 100])) }))
        const context = { reportType, unitType, extended: true, summaryRows: new Map([['root', ['branch']], ['branch', ['a', 'b']]]) }
        const workbook = await createFormulaExport({ context, columns: fields.map((field) => ({ field })), rows, exportOptions: { includeFormulaExplanations: false } })
        const sheet = workbook.worksheets[0]
        for (let column = 1; column <= fields.length; column++) {
          const parent = sheet.getCell(2, column)
          const branch = sheet.getCell(3, column)
          if (fields[column - 1].endsWith('_WCL')) {
            assert.match(parent.formula, /^IFERROR\(ROUND\(/)
          } else {
            assert.equal(parent.formula, `SUM(${branch.address})`)
            assert.equal(branch.formula, `SUM(${sheet.getCell(4, column).address}:${sheet.getCell(5, column).address})`)
            assert.equal(parent.result, branch.result)
          }
        }
        const total = sheet.getCell('A2')
        const count = unitType === 'DW' ? 2 : 4
        assert.equal(total.result, 50 * count)
        const inputColumn = fields.indexOf(`ORGID_${unitType === 'DW' ? 'A' : 'GSSX_JGBB'};${period ? `${period};` : ''}INDICATORID_WCZ`) + 1
        const updated = await recalculateExport(sheet, { [sheet.getCell(4, inputColumn).address]: 80 })
        assert.equal(updated.A2, 50 * count + 60)
        assert.equal(updated.A3, updated.A2)
      }
    }
  }
})
