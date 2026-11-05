const assert = require('node:assert/strict')
const Module = require('node:module')
const path = require('node:path')
const { test } = require('node:test')
const { buildSync } = require('esbuild')

const filename = path.resolve(__dirname, '../src/views/statistics/components/formulaHeader.ts')
const result = buildSync({
  entryPoints: [filename],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['vue', 'element-plus'],
  write: false
})
const loaded = new Module(filename, module)
loaded.filename = filename
loaded.paths = Module._nodeModulePaths(path.dirname(filename))
loaded._compile(result.outputFiles[0].text, filename)
const { applyFormulaHeaderTooltips } = loaded.exports

test('formula names come from returned titles for plain and grouped indicator fields', () => {
  for (const prefix of ['', 'DW_NORTH_01_', 'ORGID_DW_NORTH_01;INDICATORID_']) {
    const cellSlot = () => 'cell'
    const rate = { field: `${prefix}WCL`, title: '预算执行率（%）', slots: { default: cellSlot } }
    const columns = [
      { title: '比率', children: [rate] },
      {
        title: '金额',
        children: [
          { field: `${prefix}WCZ`, title: '实际完成值（目标值口径）' },
          { field: `${prefix}MBZ`, title: '年度预算' }
        ]
      }
    ]
    applyFormulaHeaderTooltips(columns)
    const tooltip = rate.slots.header()
    assert.equal(tooltip.props.content, '预算执行率（%） = 实际完成值（目标值口径） ÷ 年度预算 × 100%')
    assert.deepEqual(tooltip.children.default().children, ['预算执行率（%）'])
    assert.equal(rate.slots.default, cellSlot)
    assert.equal(columns[0].slots, undefined)
    assert.equal(columns[1].children[0].slots, undefined)
  }
})

test('each unit resolves its own titles and never borrows titles from another unit', () => {
  const a = [
    { field: 'DW_A_WCL', title: '甲单位执行率' },
    { field: 'DW_A_WCZ', title: '甲单位支出' },
    { field: 'DW_A_MBZ', title: '甲单位预算' }
  ]
  const b = [
    { field: 'DW_B_WCL', title: '乙单位执行率' },
    { field: 'DW_B_WCZ', title: '乙单位支出' },
    { field: 'DW_B_MBZ', title: '乙单位预算' }
  ]
  const c = { field: 'DW_C_WCL', title: '丙单位执行率' }
  applyFormulaHeaderTooltips([{ children: a }, { children: b }, c])
  assert.equal(a[0].slots.header().props.content, '甲单位执行率 = 甲单位支出 ÷ 甲单位预算 × 100%')
  assert.equal(b[0].slots.header().props.content, '乙单位执行率 = 乙单位支出 ÷ 乙单位预算 × 100%')
  assert.equal(c.slots, undefined)
})

test('missing titles suppress the tooltip without falling back to names or field codes', () => {
  for (const missingField of ['WCL', 'WCZ', 'MBZ']) {
    for (const missingTitle of [undefined, null, '', '   ']) {
      const columns = [
        { field: 'WCL', title: '执行率', name: '名称兜底' },
        { field: 'WCZ', title: '支出', name: '名称兜底' },
        { field: 'MBZ', title: '预算', name: '名称兜底' }
      ]
      columns.find((column) => column.field === missingField).title = missingTitle
      applyFormulaHeaderTooltips(columns)
      assert.equal(columns[0].slots, undefined)
    }
  }
  const rateOnly = { field: 'WCL', title: '执行率' }
  applyFormulaHeaderTooltips([rateOnly, { field: 'UNKNOWN', title: '其他指标' }])
  assert.equal(rateOnly.slots, undefined)
})

test('reloading columns uses the latest titles for all configured ratio formulas', () => {
  for (const [code, numerator, denominator] of [
    ['WCL', 'WCZ', 'MBZ'],
    ['LXL', 'LXZ', 'MBZ'],
    ['XMZBL', 'YZTBXMSL', 'XMSL'],
    ['XMHTQDL', 'HTQDXMSL', 'XMSL'],
    ['XMKGL', 'YKGXMSL', 'XMSL'],
    ['GBL', 'GBSL', 'XMSL']
  ]) {
    for (const version of ['原配置', '新配置']) {
      const columns = [
        { field: code, title: `${version}比率` },
        { field: numerator, title: `${version}分子` },
        { field: denominator, title: `${version}分母` }
      ]
      applyFormulaHeaderTooltips(columns)
      assert.equal(columns[0].slots.header().props.content, `${version}比率 = ${version}分子 ÷ ${version}分母 × 100%`)
    }
  }
})

test('comparison formulas use group and leaf titles for both year-on-year and month-on-month views', () => {
  for (const org of ['ORGID_DW_NORTH_01', 'DW_NORTH_01', 'ORGID_total']) {
    for (const [comparison, previous] of [
      ['同比', '去年同期'],
      ['环比', '上月合计']
    ]) {
      const amount = { field: `${org};INDICATORID_TBHBJE`, title: '金额' }
      const rate = { field: `${org};INDICATORID_TBHBL`, title: '比率' }
      applyFormulaHeaderTooltips([
        {
          title: '单位名称',
          children: [
            { title: comparison, children: [amount, rate] },
            {
              title: '本月合计',
              children: [
                { field: `${org};CURRENT;INDICATORID_WCZ`, title: '支出' },
                { field: `${org};CURRENT;INDICATORID_WCL`, title: '执行率' }
              ]
            },
            {
              title: previous,
              children: [
                { field: `${org};LAST;INDICATORID_WCZ`, title: '实际支出' },
                { field: `${org};LAST;INDICATORID_WCL`, title: '预算执行率' }
              ]
            }
          ]
        }
      ])
      assert.equal(amount.slots.header().props.content, `${comparison}金额 = 本月合计支出 − ${previous}实际支出`)
      assert.equal(rate.slots.header().props.content, `${comparison}比率 = 本月合计执行率 − ${previous}预算执行率`)
    }
  }
})

test('missing comparison group titles do not fall back to fixed period names', () => {
  for (const missingGroup of [0, 1, 2]) {
    const amount = { field: 'ORGID_A;INDICATORID_TBHBJE', title: '金额' }
    const groups = [
      { title: '同比', children: [amount] },
      { title: '本月合计', children: [{ field: 'ORGID_A;CURRENT;INDICATORID_WCZ', title: '支出' }] },
      { title: '去年同期', children: [{ field: 'ORGID_A;LAST;INDICATORID_WCZ', title: '支出' }] }
    ]
    groups[missingGroup].title = ''
    applyFormulaHeaderTooltips(groups)
    assert.equal(amount.slots, undefined)
  }
})

test('header formulas distinguish total MBZ completion from YAP balanced targets', () => {
  for (const unit of ['DW_A', 'total']) {
    const columns = ['WCL', 'LXL', 'WCZ', 'LXZ', 'MBZ', 'PHMBZ'].map((code) => ({ field: `ORGID_${unit};INDICATORID_${code}`, title: code }))
    applyFormulaHeaderTooltips(columns, { reportType: 'yap', extended: true, unitType: 'DW' })
    assert.equal(columns[0].slots.header().props.content, `WCL = WCZ ÷ ${unit === 'total' ? 'MBZ' : 'PHMBZ'} × 100%`)
    assert.equal(columns[1].slots.header().props.content, `LXL = LXZ ÷ PHMBZ${unit === 'total' ? '' : ' × 100%'}`)
  }
})
