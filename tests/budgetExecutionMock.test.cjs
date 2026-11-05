const assert = require('node:assert/strict')
const { test } = require('node:test')
const Module = require('node:module')
const path = require('node:path')
const { buildSync } = require('esbuild')
const ExcelJS = require('exceljs')

const handlers = []
const mock = { mock: (url, method, handler) => handlers.push({ url, method, handler }) }
const load = (file) => {
  const filename = path.resolve(__dirname, '..', file)
  const result = buildSync({ entryPoints: [filename], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['mockjs', 'exceljs', 'lodash', 'decimal.js'] })
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  loaded.require = (id) => id === 'mockjs' ? mock : Module.prototype.require.call(loaded, id)
  loaded._compile(result.outputFiles[0].text, filename)
  return loaded.exports
}
// 复现 mock/index.ts 的首命中规则，配置模块由报表模块 import，避免两份配置状态。
load('mock/modules/budgetChanges.ts')
load('mock/modules/budgetExecutionAnalysis.ts')
const api = (url, body) => {
  const method = body === undefined ? 'get' : 'post'
  const entry = handlers.find((item) => item.method === method && item.url.test(url))
  assert.ok(entry, `No mock handler for ${method} ${url}`)
  const result = entry.handler({ url, type: method, body: body === undefined ? null : JSON.stringify(body) })
  assert.equal(result.success, true, url)
  return JSON.parse(JSON.stringify(result.data))
}
const units = [{ code: 'DW00101', nodeType: 'CITY' }, { code: 'DW00102', nodeType: 'CITY' }]
const params = (reportType = 'budget', year = '2030') => ({
  busiType: reportType === 'budget' ? 'YSZXYL' : 'YSZXYL_YAP',
  ...(reportType === 'budget' ? { startDate: `${year}-01`, endDate: `${year}-10`, parentId: year } : { ysnd: year, saveDate: '2026-10', parentId: '-1' }),
  dwId: 'DW001', dwList: units, indicators: 'MBZ,PHMBZ,MBZ_NEW,DFJ,WCZ,WCL,LXZ,LXL,PHTZFD,YFJ,XMSL,GBSL,GBL,JYL', kxpzLists: ['gkbm'], xmlbIds: ''
})
const field = (unit, code) => `ORGID_${unit};INDICATORID_${code}`
const endpoint = (type) => type === 'budget' ? '/budgetStatistics/getDataListByDw' : '/xmYapMbz/getData'
const samples = (type = 'budget', year) => {
  const query = params(type, year)
  const root = api(endpoint(type), query).find((row) => row.name === '导出与合计校验')
  assert.ok(root)
  return { query, root, rows: api(endpoint(type), { ...query, parentId: root.id }) }
}

test('all four pages have initialization mocks and the export context selects the backend extended branch', () => {
  for (const page of ['statistics/budgetExecutionAnalysis/customYapProjectExecutionByType', 'statistics/budgetExecutionAnalysis/yszxylb', 'report/proYapMbz', 'statistics/yszxylb']) {
    assert.match(api(`/sys/menu/getMenuByUrl?url=${encodeURIComponent(page)}`).outsideMenu, /^MOCK-YSZX-/)
  }
  assert.deepEqual(api('/sysParam/getParamValueMulti/', ['YSZXYL_START_YD', 'YSZXYL_START_YAP_YD']), { YSZXYL_START_YD: '2', YSZXYL_START_YAP_YD: '2' })
  const tree = api('/bizOrgTree/getBizOrgXzTree?parentId=DW001')
  assert.deepEqual(tree.map((item) => item.nodeType), ['CITY', 'CITY'])
})

test('dynamic columns match returned backend fields, optional columns, indicator selection and unit total eligibility', () => {
  const query = params()
  const columns = api('/budgetStatistics/getDynamicColumnByDw', query)
  assert.ok(columns.find((item) => item.field === 'total'))
  assert.ok(columns.find((item) => item.field === 'gkbm'))
  assert.ok(!columns.find((item) => item.field === 'cnxm'))
  const row = api(endpoint('budget'), query)[0]
  for (const group of columns.filter((item) => item.children.length)) {
    for (const column of group.children) assert.ok(Object.prototype.hasOwnProperty.call(row, column.field), column.field)
  }
  for (const dwList of [[], [units[0]], [units[0], { code: 'COUNTY_1', nodeType: 'COUNTY' }]]) {
    assert.ok(!api('/budgetStatistics/getDynamicColumnByDw', { ...query, dwList }).some((item) => item.field === 'total'))
  }
  const selected = api('/budgetStatistics/getDynamicColumnByDw', { ...query, indicators: 'WCZ,WCL' })
  assert.deepEqual(selected.find((item) => item.field === 'DW00101').children.map((item) => item.field), [field('DW00101', 'WCZ'), field('DW00101', 'WCL')])
})

test('backend null, empty strings, real zeros and sub-cent amounts reach the frontend unchanged', () => {
  for (const type of ['budget', 'yap']) {
    const { rows } = samples(type)
    const byName = (text) => rows.find((row) => row.name === `导出校验：${text}`)
    assert.equal(byName('null 空值')[field('DW00101', 'MBZ')], null)
    assert.equal(byName('空字符串')[field('DW00101', 'WCZ')], '')
    assert.equal(byName('零分母')[field('DW00101', 'WCL')], 0)
    assert.equal(byName('有效零值')[field('DW00101', 'WCL')], 0)
    assert.equal(byName('空比率但引用值完整')[field('DW00101', 'WCL')], null)
    assert.equal(byName('小额有效分母')[field('DW00101', 'MBZ')], '0.00004')
    assert.equal(byName('小额有效分母')[field('DW00101', 'WCL')], type === 'budget' ? 50 : 25)
    assert.equal(byName('负数及高精度金额')[field('DW00101', 'MBZ')], '123456789.987654')
  }
})

test('indicator dependencies match DwUtil without exposing unrequested values to leaf calculations', () => {
  for (const type of ['budget', 'yap']) {
    const { query, root, rows } = samples(type)
    const total = rows.find((row) => row.name === '直属明细合计')
    const selected = { ...query, indicators: 'WCL' }
    const leaf = api(endpoint(type), { ...selected, parentId: total.id }).find((row) => row.name === '合计明细 A')
    assert.equal(leaf[field('DW00101', 'MBZ')], '100')
    assert.equal(leaf[field('DW00101', 'WCZ')], '25')
    assert.ok(!Object.prototype.hasOwnProperty.call(leaf, field('DW00101', 'PHMBZ')))
    assert.equal(leaf[field('DW00101', 'WCL')], type === 'budget' ? 25 : 0)
    const aggregate = api(endpoint(type), { ...selected, parentId: root.id }).find((row) => row.id === total.id)
    assert.equal(aggregate[field('DW00101', 'WCL')], type === 'budget' ? 41.67 : 0)
    const withBalance = api(endpoint(type), { ...selected, indicators: 'WCL,PHMBZ', parentId: total.id }).find((row) => row.id === leaf.id)
    assert.equal(withBalance[field('DW00101', 'WCL')], type === 'budget' ? 25 : 20.83)
  }
})

test('category, cross-node and unit totals follow backend weighting and adjustment rules', () => {
  for (const type of ['budget', 'yap']) {
    const { query, rows } = samples(type)
    const total = rows.find((row) => row.name === '直属明细合计')
    const cross = rows.find((row) => row.name === '跨节点合计（明细 A + B）')
    assert.equal(total[field('DW00101', 'MBZ')], '300')
    assert.equal(total[field('DW00101', 'WCL')], type === 'budget' ? 41.67 : 34.72)
    assert.equal(total[field('total', 'WCZ')], '375')
    assert.equal(total[field('total', 'PHMBZ')], '1080')
    assert.equal(total[field('total', 'WCL')], 0.35)
    assert.equal(total[field('total', 'PHTZFD')], '270')
    assert.equal(total[field('DW00101', 'PHTZFD')], '75')
    assert.equal(total[field('DW00102', 'PHTZFD')], '150')
    for (const key of Object.keys(total).filter((key) => key.startsWith('ORGID_'))) assert.equal(cross[key], total[key], key)
    const details = api(endpoint(type), { ...query, parentId: total.id })
    const bindings = api(`/budgetStatisticsConfig/getSumDetail?configId=${cross.id}`)
    assert.deepEqual(bindings.map((item) => item.tarConfigId), details.map((item) => String(item.id)))
  }
})

test('hidden nodes and category filters affect displayed rows without changing the backend statistic scope', () => {
  const { query, root, rows } = samples()
  const total = rows.find((row) => row.name === '含隐藏明细的合计')
  const details = api(endpoint('budget'), { ...query, parentId: total.id })
  assert.equal(details.length, 1)
  assert.equal(details[0][field('DW00101', 'MBZ')], '30')
  assert.equal(total[field('DW00101', 'MBZ')], '47')
  const configs = api(`/budgetStatisticsConfig/getConfigList?busiType=${query.busiType}&nd=2030&parentId=${total.id}`)
  assert.equal(configs.length, 2)
  assert.ok(configs.some((item) => item.isDisplay === '0'))
  const filtered = api(endpoint('budget'), { ...query, xmlbIds: String(details[0].id), parentId: root.id })
  assert.deepEqual(filtered.map((row) => row.id), [total.id])
  assert.equal(filtered[0][field('DW00101', 'MBZ')], '47')
  assert.notEqual(samples('budget', '2031').root.id, root.id)
  assert.deepEqual(api(endpoint('budget'), { ...query, parentId: 'invalid' }), [])
})

test('province responses sum the mother company without subsidiaries and retain its separate budget source', () => {
  const components = ['GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW']
  for (const type of ['budget', 'yap']) {
    const { query, root } = samples(type)
    const request = { ...query, dwList: [], parentId: root.id }
    const rows = api(endpoint(type), request)
    const row = rows.find((item) => item.name === '直属明细合计')
    for (const code of ['WCZ', 'LXZ', 'XMSL', 'GBSL']) {
      const sum = components.reduce((total, unit) => total + Number(row[field(unit, code)]), 0)
      assert.equal(Number(row[field('GSSX_MGS', code)]), sum)
      assert.equal(Number(row[field('GSSX_SGS', code)]), sum + Number(row[field('GSSX_ZGS', code)]))
    }
    assert.equal(row[field('GSSX_MGS', 'WCZ')], '625')
    assert.equal(row[field('GSSX_SGS', 'WCZ')], '750')
    assert.equal(row[field('GSSX_MGS', 'MBZ')], '1200')
    assert.equal(components.reduce((total, unit) => total + Number(row[field(unit, 'MBZ')]), 0), 1500)
    assert.equal(row[field('GSSX_SGS', 'MBZ')], '1500')
    assert.equal(row[field('GSSX_MGS', 'WCL')], 52.08)
    assert.equal(row[field('GSSX_SGS', 'WCL')], 50)
    assert.equal(rows.find((item) => item.name === '导出校验：null 空值')[field('GSSX_MGS', 'WCZ')], null)
    assert.equal(rows.find((item) => item.name === '导出校验：空字符串')[field('GSSX_SGS', 'WCZ')], '')

    const comparison = api(type === 'budget' ? '/budgetStatics/tbhb/getDataList' : '/budgetStatics/tbhb/yap/getDataList', { ...request, searchType: '2' })
      .find((item) => item.name === row.name)
    for (const period of ['CURRENT', 'LAST']) {
      const key = (unit) => `ORGID_${unit};${period};INDICATORID_WCZ`
      const sum = components.reduce((total, unit) => total + Number(comparison[key(unit)]), 0)
      assert.equal(Number(comparison[key('GSSX_MGS')]), sum)
      assert.equal(Number(comparison[key('GSSX_SGS')]), sum + Number(comparison[key('GSSX_ZGS')]))
    }
  }
})

test('comparison columns and data use the same unit and period fields and preserve empty inputs', () => {
  const { query, root } = samples('yap')
  const request = { ...query, parentId: root.id, searchType: '2' }
  const rows = api('/budgetStatics/tbhb/yap/getDataList', request)
  const columns = api('/budgetStatics/tbhb/getDynamicColumn', request)
  const leafColumns = (list) => list.flatMap((column) => column.children?.length ? leafColumns(column.children) : [column])
  const numericFields = leafColumns(columns).map((column) => column.field).filter((key) => key.startsWith('ORGID_'))
  for (const key of numericFields) assert.ok(Object.prototype.hasOwnProperty.call(rows[0], key), key)
  const empty = rows.find((row) => row.name === '导出校验：null 空值')
  assert.equal(empty[field('DW00101', 'TBHBJE')], null)
  const total = rows.find((row) => row.name === '直属明细合计')
  assert.equal(total[field('DW00101', 'TBHBJE')], '11.25')
})

test('mock responses export to XLSX with backend-configured sums, dash placeholders and selected decimal places', async () => {
  const { decorateDynamicColumns, getExportLeafColumns } = load('src/views/statistics/budgetExecutionAnalysis/viewHelpers.ts')
  const { formatBudgetExecutionExportSheet } = load('src/views/statistics/budgetExecutionAnalysis/exportHelpers.ts')
  const { buildBudgetExecutionSummaryRows } = load('src/views/statistics/budgetExecutionAnalysis/summaryConfig.ts')
  const { formatNumValue } = load('src/utils/utils.ts')
  const { query, root, rows } = samples()
  const configs = []
  const collect = (parentId) => {
    const list = api(`/budgetStatisticsConfig/getConfigList?busiType=${query.busiType}&nd=2030&parentId=${parentId}`)
    for (const config of list) {
      configs.push(config)
      if (config.isleaf === '0') collect(config.configId)
      if (config.statMethod === '2') config.targetIds = api(`/budgetStatisticsConfig/getSumDetail?configId=${config.configId}`).map((item) => item.tarConfigId)
    }
  }
  collect('2030')
  const sourceRows = [root, ...rows.flatMap((row) => row.leaf === '0' ? [row, ...api(endpoint('budget'), { ...query, parentId: row.id })] : [row])]
  const sourceColumns = decorateDynamicColumns(api('/budgetStatistics/getDynamicColumnByDw', query), 'XSWS_4', formatNumValue)
  const columns = getExportLeafColumns(sourceColumns).filter((column) => column.visible !== false)
  columns.forEach((column, index) => { column.id = `col${index}` })
  const datas = sourceRows.map((row) => ({ _row: row, ...Object.fromEntries(columns.map((column) => [column.id, column.formatter({ cellValue: row[column.field] })])) }))
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Mock 导出')
  sheet.columns = columns.map((column) => ({ key: column.id }))
  sheet.addRow(columns.map((column) => column.title))
  sheet.addRows(datas)
  formatBudgetExecutionExportSheet({ options: {}, worksheet: sheet, columns, datas, $table: { props: { treeConfig: {} }, getVTRowIndex: (row) => sourceRows.indexOf(row) } },
    { reportType: 'budget', extended: true, unitType: 'DW', summaryRows: buildBudgetExecutionSummaryRows(configs) }, { sourceColumns, includeFormulaExplanations: false })
  const saved = new ExcelJS.Workbook()
  await saved.xlsx.load(await workbook.xlsx.writeBuffer())
  const cell = (name, key) => saved.worksheets[0].getCell(sourceRows.findIndex((row) => row.name === name) + 2, columns.findIndex((column) => column.field === key) + 1)
  assert.equal(cell('导出校验：null 空值', field('DW00101', 'MBZ')).value, 0)
  assert.equal(cell('导出校验：零分母', field('DW00101', 'WCL')).result, '-')
  assert.equal(cell('导出校验：小额有效分母', field('DW00101', 'MBZ')).value, 0.00004)
  assert.equal(cell('导出校验：有效零值', field('DW00101', 'WCL')).numFmt, '#,##0.0000')
  assert.match(cell('跨节点合计（明细 A + B）', field('DW00101', 'MBZ')).formula, /^SUM\(/)
  assert.equal(cell('含隐藏明细的合计', field('DW00101', 'MBZ')).value, 47)
  assert.equal(cell('直属明细合计', field('total', 'PHTZFD')).result, 270)
})

test('province stale and null aggregates are preserved on the page and recalculated only for export', () => {
  const { calculateBudgetExecutionExportValue } = load('src/views/statistics/budgetExecutionAnalysis/exportCellValues.ts')
  const { decorateDynamicColumns } = load('src/views/statistics/budgetExecutionAnalysis/viewHelpers.ts')
  const { formatNumValue } = load('src/utils/utils.ts')
  for (const type of ['budget', 'yap']) {
    const query = { ...params(type), dwList: [] }
    const root = api(endpoint(type), query).find((row) => row.name === '导出与合计校验')
    const rows = api(endpoint(type), { ...query, parentId: root.id })
    for (const [name, raw] of [['汇总返回空值', null], ['汇总返回旧值', 999]]) {
      const row = rows.find((item) => item.name === `导出校验：${name}`)
      assert.equal(row[field('GSSX_MGS', 'WCZ')], raw)
      const column = decorateDynamicColumns([{ field: field('GSSX_MGS', 'WCZ') }], 'XSWS_4', formatNumValue, undefined, { emptyNumericAsZero: true })[0]
      assert.equal(column.formatter({ cellValue: raw, row }), formatNumValue(raw ?? 0, 4))
      assert.equal(row[field('GSSX_SGS', 'WCZ')], raw)
      const context = { reportType: type, extended: true, unitType: 'SGS' }
      for (const [code, expected] of [['MBZ', 500], ['WCZ', 50], ['LXZ', 100], ['WCL', 10], ['LXL', 20]]) {
        assert.equal(calculateBudgetExecutionExportValue(field('GSSX_MGS', code), row, context, 4), expected)
      }
      assert.equal(calculateBudgetExecutionExportValue(field('GSSX_SGS', 'WCZ'), row, context, 4), 60)
      assert.equal(row[field('GSSX_MGS', 'WCZ')], raw)
    }
  }
})
