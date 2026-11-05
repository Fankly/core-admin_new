const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')
const { parse, compileScript } = require('@vue/compiler-sfc')
const Vue = require('vue')
const ExcelJS = require('exceljs')
const Decimal = require('decimal.js')

const workspace = path.resolve(__dirname, '..')
const field = (unit, code, period) => `ORGID_${unit};${period ? `${period};` : ''}INDICATORID_${code}`
const flush = () => new Promise((resolve) => setImmediate(resolve))

// 执行真实 Vue setup、Mock 接口、配置加载和 sheetMethod；替换网络与 VXE 文件下载边界。
const createModal = (t) => {
  const handlers = [], requests = [], errors = [], exports = [], cache = new Map()
  let failConfigs = false
  const collapsedRows = Vue.reactive(new Set())
  const api = (url, body) => {
    const method = body === undefined ? 'get' : 'post'
    const entry = handlers.find((item) => item.method === method && item.url.test(url))
    assert.ok(entry, `${method} ${url}`)
    return JSON.parse(JSON.stringify(entry.handler({ url, type: method, body: body === undefined ? null : JSON.stringify(body) })))
  }
  const rows = async (source, params) => {
    requests.push({ source, params })
    return api(source === 'yap' ? '/budgetStatics/tbhb/yap/getDataList' : '/budgetStatics/tbhb/getDataList', params)
  }
  const dependencies = {
    vue: Vue,
    mockjs: { mock: (url, method, handler) => handlers.push({ url, method, handler }) },
    'element-plus': { ElTooltip: {}, ElMessage: { error: (message) => errors.push(message), warning: (message) => errors.push(message) } },
    '@/api/common': { getParamValueMulti: async (codes) => ({ success: true, data: Object.fromEntries(codes.map((code) => [code, '1'])) }) },
    '@/api/lkyptzl': { getCropLimitInfo: async () => ({ success: true, data: { cropFlag: 'PROVINCE' } }) },
    '@/api/statistics/ydxcylb': {
      getDynamicColumnByDwTbHb: async (params) => api('/budgetStatics/tbhb/getDynamicColumn', params),
      getTbHbData: (params) => rows('standard', params),
      getTbHbDataYap: (params) => rows('yap', params)
    },
    '@/api/statistics/budgetStatisticsConfig': {
      getConfigList: async (busiType, nd, parentId) => {
        requests.push({ source: 'config', busiType, nd, parentId })
        return failConfigs ? { success: false } : api(`/budgetStatisticsConfig/getConfigList?busiType=${busiType}&nd=${nd}&parentId=${parentId}`)
      },
      getSumDetail: async (id) => api(`/budgetStatisticsConfig/getSumDetail?configId=${id}`)
    }
  }
  const load = (filename) => {
    if (cache.has(filename)) return cache.get(filename).exports
    const loaded = new Module(filename, module)
    loaded.filename = filename
    loaded.paths = Module._nodeModulePaths(path.dirname(filename))
    cache.set(filename, loaded)
    loaded.require = (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name]
      if (name.startsWith('.') || name.startsWith('@/')) {
        const target = name.startsWith('@/') ? path.join(workspace, 'src', name.slice(2)) : path.resolve(path.dirname(filename), name)
        return load(path.extname(target) ? target : `${target}.ts`)
      }
      return Module.prototype.require.call(loaded, name)
    }
    let source = fs.readFileSync(filename, 'utf8')
    if (filename.endsWith('.vue')) source = compileScript(parse(source, { filename }).descriptor, { id: 'comparison-test' }).content
    loaded._compile(ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
    }).outputText, filename)
    return loaded.exports
  }
  load(path.join(workspace, 'mock/modules/budgetChanges.ts'))
  load(path.join(workspace, 'mock/modules/budgetExecutionAnalysis.ts'))
  const component = load(path.join(workspace, 'src/views/statistics/components/YszxylbTbhbModal/index.vue')).default
  const scope = Vue.effectScope()
  t.after(() => scope.stop())
  const page = scope.run(() => component.setup({}, { expose() {} }))
  const { getExportLeafColumns } = load(path.join(workspace, 'src/views/statistics/budgetExecutionAnalysis/viewHelpers.ts'))
  const flatten = (list) => list.flatMap((row) => [row, ...(collapsedRows.has(row.id) ? [] : flatten(row.children || []))])
  page.gridRef.value = {
    isTreeExpandByRow: (row) => !collapsedRows.has(row.id),
    exportData: async (options) => {
      const columns = getExportLeafColumns(page.gridOptions.columns).filter((column) => column.visible !== false)
      columns.forEach((column, index) => { column.id = `c${index}` })
      const sourceRows = flatten(page.gridOptions.data)
      const datas = sourceRows.map((row) => ({ _row: row, ...Object.fromEntries(columns.map((column) => [column.id, column.formatter({ cellValue: row[column.field], row })])) }))
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('同比环比')
      sheet.columns = columns.map((column) => ({ key: column.id }))
      for (let i = 0; i < 3; i++) sheet.addRow(columns.map((column) => column.title))
      sheet.addRows(datas)
      options.sheetMethod({ options, worksheet: sheet, columns, colgroups: [[], [], []], datas, $table: { props: page.gridOptions, getVTRowIndex: (row) => sourceRows.indexOf(row) } })
      const saved = new ExcelJS.Workbook()
      await saved.xlsx.load(await workbook.xlsx.writeBuffer())
      exports.push({
        options, workbook: saved,
        raw: (name, key) => sourceRows.find((row) => row.name === name)[key],
        display: (name, key) => {
          const row = sourceRows.find((row) => row.name === name)
          return columns.find((column) => column.field === key).formatter({ cellValue: row[key], row })
        },
        cell: (name, key) => saved.getWorksheet('同比环比').getCell(sourceRows.findIndex((row) => row.name === name) + 4, columns.findIndex((column) => column.field === key) + 1)
      })
    }
  }
  const expand = async (list) => {
    for (const row of list) {
      if (!row.leaf) continue
      row.children = await page.gridOptions.treeConfig.loadMethod({ row })
      await expand(row.children)
    }
  }
  return {
    page, requests, errors, exports, api, load,
    expand: () => expand(page.gridOptions.data),
    failConfigs: () => { failConfigs = true },
    collapse: (name) => collapsedRows.add(flatten(page.gridOptions.data).find((row) => row.name === name).id)
  }
}

const openParams = (dataSource, searchType, dwList = [], xsws = 'XSWS_4') => ({
  dataSource, xsws, title: searchType === '1' ? '同比分析' : '环比分析',
  params: {
    busiType: dataSource === 'yap' ? 'YSZXYL_YAP' : 'YSZXYL', dwId: 'DW001', dwList, indicators: 'JYL', xmlbIds: '', searchType,
    ...(dataSource === 'yap' ? { ysnd: '2030', saveDate: '2030-10', parentId: '-1' } : { startDate: '2030-01', endDate: '2030-10', parentId: '2030' })
  }
})

test('both comparison buttons export real modal data with province, unit and cross-node sums and page precision', async (t) => {
  for (const source of ['standard', 'yap']) {
    for (const searchType of ['1', '2']) {
      for (const dwList of [[], [{ code: 'DW00101', nodeType: 'CITY' }, { code: 'DW00102', nodeType: 'CITY' }]]) {
        const h = createModal(t)
        const digits = dwList.length ? 2 : searchType === '1' ? 0 : 4
        h.page.open(openParams(source, searchType, dwList, `XSWS_${digits}`))
        await flush()
        assert.equal(h.page.loading.value, false)
        assert.equal(h.page.exportFormulaContext.value.extended, true)
        assert.equal(h.page.exportFormulaContext.value.summaryQuery, undefined)
        await h.expand()
        const requestsBeforeExport = h.requests.length
        await h.page.exportDataHandle()
        assert.equal(h.requests.length, requestsBeforeExport)
        assert.deepEqual(h.errors, [])
        assert.equal(h.exports.length, 1)
        assert.equal(h.exports[0].options.mode, 'current')
        assert.equal(h.exports[0].options.isAllExpand, false)
        const { cell, display, raw, workbook } = h.exports[0]
        const { formatNumValue } = h.load(path.join(workspace, 'src/utils/utils.ts'))
        const unit = dwList.length ? 'total' : 'GSSX_MGS'
        const current = dwList.length ? 375 : 625
        const previous = current * (searchType === '1' ? 0.82 : 0.91)
        const sumName = '直属明细合计'
        const rates = []
        for (const [period, expected] of [['CURRENT', current], ['LAST', previous]]) {
          const amount = cell(sumName, field(unit, 'WCZ', period))
          assert.match(amount.formula, /^SUM\(/)
          assert.equal(amount.result, expected)
          assert.equal(amount.numFmt, digits ? `#,##0.${'0'.repeat(digits)}` : '#,##0')
          const detailUnit = dwList.length ? 'DW00101' : 'GSSX_JGBB'
          assert.equal(cell('跨节点合计（明细 A + B）', field(detailUnit, 'WCZ', period)).formula, undefined)
          const target = cell(sumName, field(unit, 'MBZ', period))
          assert.equal(target.result, dwList.length ? 900 : 1500)
          const expectedRate = Number((expected / (dwList.length ? 900 : 1500) * 100).toFixed(digits))
          rates.push(expectedRate)
          const ratio = cell(sumName, field(unit, 'WCL', period))
          assert.equal(ratio.formula, `IFERROR(ROUND(${amount.address}/${target.address}*100,${digits}),"-")`)
          assert.equal(ratio.result, expectedRate)
          assert.equal(display(sumName, field(unit, 'WCL', period)), formatNumValue(raw(sumName, field(unit, 'WCL', period)), digits))
        }
        const difference = Number((rates[0] - rates[1]).toFixed(digits))
        assert.equal(cell(sumName, field(unit, 'TBHBL')).result, difference)
        assert.equal(display(sumName, field(unit, 'TBHBL')), formatNumValue(raw(sumName, field(unit, 'TBHBL')), digits))
        assert.equal(cell(sumName, field(unit, 'TBHBJE')).result, Number((current - previous).toFixed(digits)))
        assert.match(cell(sumName, field(unit, 'TBHBJE')).formula, /ROUND\(/)
        const detailUnit = dwList.length ? 'DW00101' : 'GSSX_MGS'
        const emptyTarget = cell('导出校验：null 空值', field(detailUnit, 'MBZ', 'CURRENT'))
        assert.equal(emptyTarget.formula ? emptyTarget.result ?? 0 : emptyTarget.value, 0)
        const emptyAmount = cell('导出校验：空字符串', field(detailUnit, 'WCZ', 'LAST'))
        assert.equal(emptyAmount.formula ? emptyAmount.result ?? 0 : emptyAmount.value, 0)
        // 预安排地市接口未返回 PHMBZ 时无法判定分母，沿用后端值；已返回的零分母显示“-”。
        const zeroRatio = cell('导出校验：零分母', field(detailUnit, 'WCL', 'CURRENT'))
        assert.equal(zeroRatio.formula ? zeroRatio.result : zeroRatio.value, source === 'yap' && dwList.length ? 0 : '-')
        assert.equal(workbook.getWorksheet('计算公式说明'), undefined)
        assert.equal(workbook.worksheets.length, 1)
        workbook.getWorksheet('同比环比').eachRow((row) => row.eachCell((cell) => assert.equal(cell.note, undefined)))
        assert.ok(h.requests.some((request) => request.source === source && request.params.searchType === searchType))
        const years = new Set(h.requests.filter((request) => request.source === 'config').map((request) => request.nd))
        assert.deepEqual([...years], [])
      }
    }
  }
})

test('both comparison modes retain raw text columns and export the current sequence merges for each data source', async (t) => {
  const fields = ['subName', 'gkbm', 'ysly', 'cnxm', 'cnxmms']
  const values = ['', null, undefined, '-', ' 07 ', '0012', 0, 1234.56789]
  for (const source of ['standard', 'yap']) {
    for (const searchType of ['1', '2']) {
      const h = createModal(t)
      h.page.open(openParams(source, searchType))
      await flush()
      const child = { id: 'child', name: '子项', subName: '01', gkbm: '0012', ysly: null, cnxm: '', cnxmms: 0 }
      const parent = { id: 'parent', name: '父项', subName: '01', children: [child] }
      const next = { id: 'next', name: '相邻项', subName: '01' }
      const rows = [parent, next, ...values.map((value, index) => ({
        id: `raw${index}`, name: `原值${index}`, ...Object.fromEntries(fields.map((field) => [field, value]))
      }))]
      h.page.rawColumns.value = ['name', ...fields].map((field) => ({ field, title: field }))
      h.page.applyColumns(rows)
      h.page.gridOptions.data = rows
      const span = (row) => h.page.gridOptions.spanMethod({ row, column: { field: 'subName' } })
      const root = h.page.gridOptions.data[0]
      assert.equal(span(root).rowspan, 3)
      assert.equal(span(root.children[0]).rowspan, 0)
      assert.equal(span(h.page.gridOptions.data[1]).rowspan, 0)
      assert.equal(h.page.gridOptions.spanMethod({ row: root, column: { field: 'gkbm' } }), undefined)
      const queryCount = h.requests.length
      await h.page.exportDataHandle()
      const expanded = h.exports[0]
      assert.deepEqual(expanded.workbook.getWorksheet('同比环比').model.merges, ['B4:B6'])
      assert.equal(expanded.cell('子项', 'subName').master.address, 'B4')
      values.forEach((value, index) => fields.forEach((field) => {
        assert.equal(expanded.display(`原值${index}`, field), value)
        const cell = expanded.cell(`原值${index}`, field)
        assert.equal(cell.value, value ?? null)
        assert.equal(cell.numFmt || 'General', 'General')
      }))
      assert.equal(expanded.cell('子项', 'gkbm').value, '0012')
      assert.equal(expanded.cell('子项', 'ysly').value, null)
      assert.equal(expanded.cell('子项', 'cnxm').value, '')
      assert.equal(expanded.cell('子项', 'cnxmms').value, 0)
      h.collapse('父项')
      assert.equal(span(root).rowspan, 2)
      await h.page.exportDataHandle()
      const collapsed = h.exports[1]
      assert.deepEqual(collapsed.workbook.getWorksheet('同比环比').model.merges, ['B4:B5'])
      assert.equal(collapsed.cell('相邻项', 'subName').master.address, 'B4')
      assert.equal(h.requests.length, queryCount)
      assert.deepEqual(h.errors, [])
    }
  }
})

test('comparison export prevents duplicate clicks and works without configuration requests', async (t) => {
  const h = createModal(t)
  h.page.open(openParams('standard', '1'))
  await flush()
  h.failConfigs()
  const count = h.requests.length
  const originalExport = h.page.gridRef.value.exportData
  let release
  const gate = new Promise((resolve) => { release = resolve })
  h.page.gridRef.value.exportData = async (options) => { await gate; return originalExport(options) }
  const exporting = h.page.exportDataHandle()
  assert.equal(h.page.isExporting.value, true)
  await h.page.exportDataHandle()
  release()
  await exporting
  assert.equal(h.exports.length, 1)
  assert.equal(h.page.isExporting.value, false)
  assert.equal(h.requests.length, count)
  assert.deepEqual(h.errors, [])
  h.page.gridRef.value.exportData = async () => { throw new Error('测试导出失败') }
  await h.page.exportDataHandle()
  assert.equal(h.page.isExporting.value, false)
  assert.equal(h.errors[0], '测试导出失败')
})

test('collapsed comparisons retain horizontal, ratio and difference formulas without fetching data or adding rows', async (t) => {
  for (const source of ['standard', 'yap']) {
    for (const searchType of ['1', '2']) {
      const h = createModal(t)
      h.page.open(openParams(source, searchType))
      await flush()
      const initialRows = h.page.gridOptions.data.map((row) => ({ ...row }))
      const queryCount = h.requests.length
      await h.page.exportDataHandle()
      assert.deepEqual(h.errors, [])
      assert.deepEqual(h.page.gridOptions.data, initialRows)
      const { workbook, cell, raw } = h.exports[0]
      const sheet = workbook.getWorksheet('同比环比')
      assert.equal(sheet.rowCount, initialRows.length + 3)
      assert.equal(h.requests.length, queryCount)
      for (const row of initialRows) {
        for (const period of ['CURRENT', 'LAST']) {
          const refs = ['GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW'].map((unit) => cell(row.name, field(unit, 'WCZ', period)))
          const amount = cell(row.name, field('GSSX_MGS', 'WCZ', period))
          assert.equal(amount.formula, `SUM(${refs.map((input) => input.address).join(',')})`)
          assert.equal(amount.result, refs.reduce((sum, input) => sum.add(input.value || 0), new Decimal(0)).toNumber())
          assert.match(cell(row.name, field('GSSX_MGS', 'WCL', period)).formula, /^IFERROR\(ROUND\(/)
        }
        for (const code of ['TBHBJE', 'TBHBL']) {
          assert.match(cell(row.name, field('GSSX_MGS', code)).formula, /^IFERROR\(ROUND\(/)
        }
        assert.equal(raw(row.name, field('GSSX_MGS', 'WCZ', 'CURRENT')), row[field('GSSX_MGS', 'WCZ', 'CURRENT')])
      }
      sheet.eachRow((row) => assert.equal(row.hidden, false))
    }
  }
})

test('the actual power-grid hierarchy rolls project packages up to power-grid construction', async (t) => {
  for (const source of ['standard', 'yap']) {
    for (const searchType of ['1', '2']) {
      const h = createModal(t)
      h.page.open(openParams(source, searchType))
      await flush()
      await h.expand()
      await h.page.exportDataHandle()
      assert.deepEqual(h.errors, [])
      const { cell } = h.exports[0]
      for (const period of ['CURRENT', 'LAST']) {
        for (const unit of ['GSSX_SGS', 'GSSX_MGS', 'GSSX_JGBB']) {
          const key = field(unit, 'WCZ', period)
          const root = cell('电网基建', key)
          const pack = cell('输变电基建项目包', key)
          const first = cell('110千伏昆山变增容工程', key)
          const second = cell('220千伏吴中输变电工程', key)
          assert.equal(pack.formula, `SUM(${first.address}:${second.address})`)
          assert.ok(root.formula?.includes(pack.address), `${source}/${searchType}/${unit}/${period}: ${root.formula}`)
        }
      }
    }
  }
})

test('main exports follow only the visible power-grid hierarchy without appending other groups', async (t) => {
  for (const reportType of ['budget', 'yap']) {
    for (const dwList of [[], [{ code: 'DW00101', nodeType: 'CITY' }, { code: 'DW00102', nodeType: 'CITY' }]]) {
      const h = createModal(t)
      const query = { ...openParams(reportType === 'yap' ? 'yap' : 'standard', '1', dwList).params, indicators: 'MBZ,PHMBZ,WCZ,WCL' }
      const endpoint = reportType === 'yap' ? '/xmYapMbz/getData' : '/budgetStatistics/getDataListByDw'
      const request = (parentId) => h.api(endpoint, { ...query, parentId })
      const root = request(query.parentId).data.find((row) => row.name === '电网基建')
      const pack = request(root.id).data.find((row) => row.name === '输变电基建项目包')
      const rows = [root, pack, ...request(pack.id).data]
      assert.deepEqual(rows.slice(2).map((row) => row.name), ['110千伏昆山变增容工程', '220千伏吴中输变电工程'])
      const { formatBudgetExecutionExportSheet } = h.load(path.join(workspace, 'src/views/statistics/budgetExecutionAnalysis/exportHelpers.ts'))
      root.children = [pack]
      pack.children = rows.slice(2)
      const context = { reportType, extended: true, unitType: dwList.length ? 'DW' : 'SGS' }
      const unit = dwList.length ? 'total' : 'GSSX_MGS'
      const columns = ['name', field(unit, 'WCZ')].map((field, index) => ({ field, id: `c${index}` }))
      const datas = rows.map((row) => ({ _row: row, c0: row.name, c1: row[field(unit, 'WCZ')] }))
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('主表')
      sheet.columns = columns.map((column) => ({ key: column.id }))
      sheet.addRow(['名称', '完成值'])
      sheet.addRows(datas)
      formatBudgetExecutionExportSheet({ options: {}, worksheet: sheet, columns, datas, $table: { props: { treeConfig: { lazy: true } }, getVTRowIndex: (row) => rows.indexOf(row) } }, context, { includeFormulaExplanations: false })
      const saved = new ExcelJS.Workbook()
      await saved.xlsx.load(await workbook.xlsx.writeBuffer())
      const exported = saved.worksheets[0]
      assert.equal(exported.getCell('B3').formula, 'SUM(B4:B5)')
      assert.equal(exported.getCell('B2').formula, 'SUM(B3)')
      assert.equal(exported.getCell('B2').result, exported.getCell('B3').result)
      assert.equal(exported.rowCount, rows.length + 1)
      exported.eachRow((row) => assert.equal(row.hidden, false))
    }
  }
})

test('comparison pages preserve backend results on initial load, lazy expansion and after formula export', async (t) => {
  for (const source of ['standard', 'yap']) {
    for (const searchType of ['1', '2']) {
      const h = createModal(t)
      h.page.open(openParams(source, searchType))
      await flush()
      await h.expand()
      const endpoint = source === 'yap' ? '/budgetStatics/tbhb/yap/getDataList' : '/budgetStatics/tbhb/getDataList'
      const originals = new Map(h.requests.filter((request) => request.source === source).flatMap((request) => h.api(endpoint, request.params).data.map((row) => [String(row.id), row])))
      const { getExportLeafColumns } = h.load(path.join(workspace, 'src/views/statistics/budgetExecutionAnalysis/viewHelpers.ts'))
      const { formatNumValue } = h.load(path.join(workspace, 'src/utils/utils.ts'))
      const columns = getExportLeafColumns(h.page.gridOptions.columns).filter((column) => /^ORGID_.*;INDICATORID_(WCZ|WCL|TBHBJE|TBHBL)$/.test(column.field))
      const check = (rows) => rows.forEach((row) => {
        const original = originals.get(String(row.id))
        assert.ok(original)
        for (const [field, value] of Object.entries(original)) {
          if (field !== 'leaf') assert.deepEqual(row[field], value, `${source}/${searchType}/${row.name}/${field}`)
        }
        for (const column of columns) {
          const value = original[column.field]
          assert.equal(column.formatter({ cellValue: row[column.field], row }), formatNumValue(value == null || value === '' ? 0 : value, 4))
        }
        if (row.children) check(row.children)
      })
      check(h.page.gridOptions.data)
      await h.page.exportDataHandle()
      assert.deepEqual(h.errors, [])
      check(h.page.gridOptions.data)
    }
  }
})

test('collapsing a loaded package retains its horizontal formulas and the visible parent vertical sum without adding rows', async (t) => {
  const h = createModal(t)
  h.page.open(openParams('standard', '1'))
  await flush()
  await h.expand()
  const requests = h.requests.length
  await h.page.exportDataHandle()
  const expandedRowCount = h.exports[0].workbook.worksheets[0].rowCount
  h.collapse('输变电基建项目包')
  await h.page.exportDataHandle()
  assert.equal(h.requests.length, requests)
  const { cell, workbook } = h.exports[1]
  assert.equal(workbook.worksheets[0].rowCount, expandedRowCount - 2)
  const key = field('GSSX_MGS', 'WCZ', 'CURRENT')
  const pack = cell('输变电基建项目包', key)
  const refs = ['GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW'].map((unit) => cell('输变电基建项目包', field(unit, 'WCZ', 'CURRENT')))
  assert.equal(pack.formula, `SUM(${refs.map((input) => input.address).join(',')})`)
  assert.equal(pack.result, refs.reduce((sum, input) => sum.add(input.value), new Decimal(0)).toNumber())
  assert.equal(cell('电网基建', key).formula, `SUM(${pack.address})`)
  assert.equal(cell('电网基建', key).result, pack.result)
  workbook.worksheets[0].eachRow((row) => assert.equal(row.hidden, false))
})
