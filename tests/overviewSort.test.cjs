const assert = require('node:assert/strict')
const Module = require('node:module')
const path = require('node:path')
const { test } = require('node:test')
const { buildSync } = require('esbuild')

const loadTypeScript = (relativePath) => {
  const filename = path.resolve(__dirname, '..', relativePath)
  const result = buildSync({
    entryPoints: [filename],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    loader: { '.png': 'dataurl', '.less': 'text' },
    write: false
  })
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  loaded._compile(result.outputFiles[0].text, filename)
  return loaded.exports
}

const { sortOverviewRows, resolveStageSortOptions } = loadTypeScript('src/views/service/overview/data/sort.ts')
const {
  DEFAULT_CHART_SORT,
  parseAmountUnit,
  parseDefaultChartSort,
  parseStageSortOptions,
  resolveChartSort,
  resolveRatioStageIds
} = loadTypeScript('src/views/service/overview/data/overview.ts')
const { formatOverviewValue, getOverviewUnit } = loadTypeScript('src/views/service/overview/data/format.ts')
const { createOverviewChartOption } = loadTypeScript('src/views/service/overview/charts.ts')
const row = (code, value, otherValue = null) => ({ code, name: code, values: { '01': value, '02': otherValue }, total: null, ratios: {} })
const codes = (rows) => rows.map((item) => item.code)

test('stage sorting preserves differences in long decimal amounts and large counts', () => {
  for (const [lower, higher] of [
    ['100000000000000.01', '100000000000000.02'],
    ['9007199254740992', '9007199254740993'],
    ['12345678901234567890.00000000000000000001', '12345678901234567890.00000000000000000002']
  ]) {
    assert.deepEqual(codes(sortOverviewRows([row('lower', lower), row('higher', higher)], 'value-01')), ['higher', 'lower'])
  }
})

test('missing and invalid values sort last; zero, negatives and ties keep their meaning', () => {
  const rows = [
    row('missing', null),
    row('negative', '-2'),
    row('zero', 0),
    row('same-zero', '0.00'),
    row('positive', '2.5'),
    row('blank', '  '),
    row('dash', '-'),
    row('nan', 'NaN'),
    row('infinity', 'Infinity'),
    row('text', 'abc'),
    row('undefined', undefined)
  ]
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-01')), [
    'positive',
    'zero',
    'same-zero',
    'negative',
    'missing',
    'blank',
    'dash',
    'nan',
    'infinity',
    'text',
    'undefined'
  ])
})

test('sorting uses the selected stage and never mutates the API order or values', () => {
  const rows = [row('first', '1.00', 9), row('second', '3.00', 2), row('third', '3', 6)]
  const before = structuredClone(rows)
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-01')), ['second', 'third', 'first'])
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-02')), ['first', 'third', 'second'])
  assert.deepEqual(rows, before)
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-absent')), codes(rows))
})

test('default sorting uses demand pool ratios and each ratio option uses its own stage', () => {
  const rows = [
    { ...row('high-value', 900, 10), ratios: { '01': 10, '02': 90 } },
    { ...row('high-ratio', 100, 30), ratios: { '01': 80, '02': 5 } },
    { ...row('zero-ratio', 200, 20), ratios: { '01': 0, '02': 30 } },
    { ...row('missing-ratio', 500, 40), ratios: { '01': null, '02': 0 } },
    { ...row('tied-ratio', 50, 50), ratios: { '01': 80, '02': 10 } }
  ]
  const before = structuredClone(rows)
  // 默认排序键是按阶段名称生成的语义键，排序前先按当前阶段换成接口实际编码。
  assert.equal(DEFAULT_CHART_SORT, 'ratio-需求储备库')
  const defaultSort = resolveChartSort(DEFAULT_CHART_SORT, [
    { id: '01', title: '需求储备库' },
    { id: '02', title: '联合会审' }
  ])
  assert.equal(defaultSort, 'ratio-01')
  assert.deepEqual(codes(sortOverviewRows(rows, defaultSort)), ['high-ratio', 'tied-ratio', 'high-value', 'zero-ratio', 'missing-ratio'])
  assert.deepEqual(codes(sortOverviewRows(rows, 'ratio-02')), ['high-value', 'zero-ratio', 'tied-ratio', 'high-ratio', 'missing-ratio'])
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-01')), ['high-value', 'missing-ratio', 'zero-ratio', 'high-ratio', 'tied-ratio'])
  assert.deepEqual(rows, before)
})

test('sort options match the current stages, including drill data and configuration fallback', () => {
  const stages = [{ id: '02', title: '联合会审' }]
  const config = [
    { id: '01', label: '需求储备库' },
    { id: '02', label: '会审配置名称' },
    { id: '04', label: '立项执行' }
  ]
  const options = (label) => [
    { id: 'value-total', label: '合计', metric: 'value' },
    { id: 'value-02', label, metric: 'value' },
    { id: 'ratio-02', label, metric: 'ratio' }
  ]
  assert.deepEqual(resolveStageSortOptions(config, stages), options('会审配置名称'))
  assert.deepEqual(resolveStageSortOptions([config[0]], stages), options('联合会审'))
  assert.deepEqual(resolveStageSortOptions([], stages), options('联合会审'))
  assert.deepEqual(resolveStageSortOptions(config, []), [])
})

test('each stage keeps value and ratio options and 合计 comes first', () => {
  const stages = [
    { id: '01', title: '项目需求库' },
    { id: '02', title: '联合会审' },
    { id: '03', title: '项目储备库' },
    { id: '04', title: '立项执行' }
  ]
  const expectedIds = [
    'value-total',
    'value-01',
    'ratio-01',
    'value-02',
    'ratio-02',
    'value-03',
    'ratio-03',
    'value-04',
    'ratio-04'
  ]
  for (const config of [[], [{ id: '01', label: '项目需求库配置名称' }], stages.map((stage) => ({ id: stage.id, label: stage.title }))]) {
    const options = resolveStageSortOptions(config, stages)
    assert.deepEqual(
      options.map((option) => option.id),
      expectedIds
    )
    // 每个阶段都同时提供数值与占比两项，占比共四项（合计只有数值项）。
    assert.equal(options.filter((option) => option.metric === 'ratio').length, stages.length)
    assert.equal(options.filter((option) => option.metric === 'value').length, stages.length + 1)
  }
})

test('合计 sorting uses the row total and only offers a value option', () => {
  const rows = [
    { ...row('big-total-small-stage', 1, 9), total: '900' },
    { ...row('small-total-big-stage', 8, 2), total: '100' },
    { ...row('missing-total', 5, 5), total: null }
  ]
  const codes = (items) => items.map((item) => item.code)
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-total')), ['big-total-small-stage', 'small-total-big-stage', 'missing-total'])
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-total', 'asc')), ['small-total-big-stage', 'big-total-small-stage', 'missing-total'])
  // 合计排序不受阶段数值影响：阶段值最小的行可能排第一。
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-01')), ['small-total-big-stage', 'missing-total', 'big-total-small-stage'])
  // 接口没有合计占比，配置写 ratio-total 时按阶段查询自然找不到值，全部排最后并保持接口顺序。
  assert.deepEqual(codes(sortOverviewRows(rows, 'ratio-total')), ['big-total-small-stage', 'small-total-big-stage', 'missing-total'])
  assert.deepEqual(
    resolveStageSortOptions([], [{ id: '01', title: '需求储备库' }]).filter((option) => option.metric === 'value' && option.label === '合计').length,
    1
  )
})

test('default sort parameter only accepts value-/ratio- keys with a stage code', () => {
  assert.equal(parseDefaultChartSort('ratio-01'), 'ratio-01')
  assert.equal(parseDefaultChartSort(' value-02 '), 'value-02')
  assert.equal(parseDefaultChartSort('ratio-'), null)
  assert.equal(parseDefaultChartSort('ratio'), null)
  assert.equal(parseDefaultChartSort('01'), null)
  assert.equal(parseDefaultChartSort(''), null)
  assert.equal(parseDefaultChartSort(undefined), null)
  assert.equal(parseDefaultChartSort(DEFAULT_CHART_SORT), DEFAULT_CHART_SORT)
})

test('amount unit converts 万元 to 亿元 for amount only and falls back on invalid config', () => {
  assert.equal(parseAmountUnit('万元'), '万元')
  assert.equal(parseAmountUnit('亿元'), '亿元')
  assert.equal(parseAmountUnit(' 亿元 '), '亿元')
  assert.equal(parseAmountUnit('元'), null)
  assert.equal(parseAmountUnit(''), null)
  assert.equal(parseAmountUnit(undefined), null)
  assert.equal(formatOverviewValue('10000', 'amount', '亿元'), '1.00')
  assert.equal(formatOverviewValue('12345.67', 'amount', '万元'), '12345.67')
  assert.equal(formatOverviewValue('10000', 'count', '亿元'), '10000')
  assert.equal(getOverviewUnit('amount', '亿元'), '亿元')
  assert.equal(getOverviewUnit('count', '亿元'), '个')
})

test('overview chart axis and tooltip follow the selected amount unit', () => {
  const stages = [{ id: '01', title: '需求储备库', color: '#07978d' }]
  const chart = createOverviewChartOption([row('first', 20000)], 'amount', stages, { amountUnit: '亿元' })
  assert.equal(chart.yAxis[0].name, '金额（亿元）')
  assert.equal(chart.yAxis[0].axisLabel.formatter(20000), '2.00')
})

test('public sort configuration keeps the first valid label for a duplicate code', () => {
  assert.deepEqual(
    parseStageSortOptions([
      { code: ' 01 ', name: ' 需求储备库 ' },
      { code: '01', name: '重复名称' },
      { code: '', name: '无编码' },
      { code: '02', name: '' },
      null,
      { code: '02', name: '联合会审' }
    ]),
    [
      { id: '01', label: '需求储备库' },
      { id: '02', label: '联合会审' }
    ]
  )
  assert.deepEqual(parseStageSortOptions(null), [])
})

test('sorting preserves user legend choices while untouched series follow the configured defaults', () => {
  const stages = [
    { id: '01', title: '需求储备库', color: '#07978d' },
    { id: '02', title: '联合会审', color: '#fd9554' }
  ]
  const rows = [row('first', 1, 3), row('second', 2, 1)]
  const options = {
    ratioStageIds: ['01'],
    legendSelected: { 需求储备库: false, 联合会审占比: true }
  }
  const chart = createOverviewChartOption(sortOverviewRows(rows, 'value-01'), 'amount', stages, options)
  assert.deepEqual(chart.xAxis.data, ['second', 'first'])
  assert.deepEqual(chart.legend.selected, { 需求储备库: false, 需求储备库占比: true, 联合会审: true, 联合会审占比: true })
  const changedDefaults = createOverviewChartOption(rows, 'count', stages, { ...options, ratioStageIds: ['02'] })
  assert.deepEqual(changedDefaults.legend.selected, { 需求储备库: false, 需求储备库占比: false, 联合会审: true, 联合会审占比: true })
})

test('sort direction toggles between descending and ascending while missing values stay last', () => {
  const rows = [row('low', 1), row('high', 3), row('missing', null), row('mid', 2)]
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-01')), ['high', 'mid', 'low', 'missing'])
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-01', 'desc')), ['high', 'mid', 'low', 'missing'])
  assert.deepEqual(codes(sortOverviewRows(rows, 'value-01', 'asc')), ['low', 'mid', 'high', 'missing'])
  const ratioRows = [
    { ...row('ratio-low', 1), ratios: { '01': 10 } },
    { ...row('ratio-high', 2), ratios: { '01': 90 } }
  ]
  assert.deepEqual(codes(sortOverviewRows(ratioRows, 'ratio-01', 'asc')), ['ratio-low', 'ratio-high'])
})

test('ratio curve configuration falls back when codes miss real stages', () => {
  const stages = [
    { id: '01', title: '需求储备库' },
    { id: '02', title: '联合会审' }
  ]
  assert.deepEqual(resolveRatioStageIds(['02'], stages), ['02'])
  // 公共代码未配置或编码写错时仍保留需求储备库占比曲线，不再整组隐藏。
  assert.deepEqual(resolveRatioStageIds([], stages), ['01'])
  assert.deepEqual(resolveRatioStageIds(['XMZL_RATIO_COM'], stages), ['01'])
  // 编码精确比对（不做前导零换算）：配置的 01 对不上接口的 1，按「未配置」回落到需求储备库。
  assert.deepEqual(
    resolveRatioStageIds(
      ['01'],
      [
        { id: '1', title: '需求储备库' },
        { id: '2', title: '联合会审' }
      ]
    ),
    ['1']
  )
  // 连需求储备库都不存在时回落到全部占比曲线，避免曲线全部消失。
  assert.deepEqual(
    resolveRatioStageIds(
      ['99'],
      [
        { id: '03', title: '项目储备库' },
        { id: '04', title: '立项执行' }
      ]
    ),
    ['03', '04']
  )
  assert.deepEqual(resolveRatioStageIds(['02'], []), ['02'])
})

test('sort option labels match configuration only on exact stage codes', () => {
  const stages = [
    { id: '1', title: '需求储备库' },
    { id: '02', title: '联合会审' }
  ]
  // 配置编码 01 与接口编码 1 不同，不做前导零换算：配置项被忽略，名称回落到接口阶段名。
  const ignored = resolveStageSortOptions([{ id: '01', label: '配置名称' }], stages)
  assert.deepEqual(
    ignored.map((option) => option.id),
    ['value-total', 'value-1', 'ratio-1', 'value-02', 'ratio-02']
  )
  assert.equal(ignored[1].label, '需求储备库')
  // 编码完全一致时才采用配置名称。
  const matched = resolveStageSortOptions([{ id: '1', label: '配置名称' }], stages)
  assert.equal(matched[1].label, '配置名称')
  assert.equal(matched[2].label, '配置名称')
})

test('sort keys compare stage codes exactly and resolve semantic names to real codes', () => {
  const stages = [
    { id: '1', title: '需求储备库' },
    { id: '02', title: '联合会审' }
  ]
  // 编码不做前导零 / 大小写换算：写 01 对不上接口的 1，键原样返回。
  assert.equal(resolveChartSort('ratio-01', stages), 'ratio-01')
  assert.equal(resolveChartSort('value-02', stages), 'value-02')
  // 语义键（阶段名称）才做一次名称到编码的映射，别名同样生效。
  assert.equal(resolveChartSort('ratio-需求储备库', stages), 'ratio-1')
  assert.equal(resolveChartSort('value-项目需求库', stages), 'value-1')
  // 前缀必须合法；未知名称与空阶段列表都原样返回。
  assert.equal(resolveChartSort('ratio-XMZL_01', stages), 'ratio-XMZL_01')
  assert.equal(resolveChartSort('ratio-需求储备库', []), 'ratio-需求储备库')
})

test('the sorted stage only changes legend defaults: other series stay available and toggleable', () => {
  const stages = [
    { id: '01', title: '需求储备库', color: '#07978d' },
    { id: '02', title: '联合会审', color: '#fd9554' }
  ]
  const rows = [row('first', 1, 3), row('second', 2, 1)]
  const allSeries = ['value-02', 'value-01', 'ratio-01', 'ratio-02']
  const allLegend = ['需求储备库', '需求储备库占比', '联合会审', '联合会审占比']
  // 数值排序：默认只显示该阶段柱形，但全部系列与图例项仍在，只是通过 legend.selected 隐藏。
  const valueSort = createOverviewChartOption(rows, 'amount', stages, { barStageId: '02', ratioStageId: '02', ratioStageIds: ['01'] })
  assert.deepEqual(valueSort.series.map((item) => item.id), allSeries)
  assert.deepEqual(valueSort.legend.data.map((item) => item.name), allLegend)
  assert.deepEqual(valueSort.legend.selected, {
    需求储备库: false,
    需求储备库占比: false,
    联合会审: true,
    联合会审占比: true
  })
  // 占比排序：默认显示全部柱形，只显示所选阶段的占比曲线，其余占比曲线仍可切回。
  const ratioSort = createOverviewChartOption(rows, 'amount', stages, { ratioStageId: '02', ratioStageIds: ['01'] })
  assert.deepEqual(ratioSort.series.map((item) => item.id), allSeries)
  assert.deepEqual(ratioSort.legend.data.map((item) => item.name), allLegend)
  assert.deepEqual(ratioSort.legend.selected, {
    需求储备库: true,
    需求储备库占比: false,
    联合会审: true,
    联合会审占比: true
  })
  // 用户手动打开的系列优先于排序默认值（隐藏 != 删除，可恢复显示）。
  const reopened = createOverviewChartOption(rows, 'amount', stages, {
    ratioStageId: '02',
    legendSelected: { 需求储备库占比: true }
  })
  assert.equal(reopened.legend.selected['需求储备库占比'], true)
  // 未提供排序阶段时按公共代码配置（占比曲线未配置时显示需求储备库）。
  const configured = createOverviewChartOption(rows, 'amount', stages, { ratioStageIds: ['01'] })
  assert.deepEqual(configured.legend.selected, {
    需求储备库: true,
    需求储备库占比: true,
    联合会审: true,
    联合会审占比: false
  })
  // 排序阶段不在当前数据中时不隐藏任何系列，避免空图。
  const missing = createOverviewChartOption(rows, 'amount', stages, { barStageId: '99', ratioStageId: '99' })
  assert.equal(missing.series.length, allSeries.length)
  assert.deepEqual(missing.legend.selected, { 需求储备库: true, 需求储备库占比: true, 联合会审: true, 联合会审占比: true })
})

test('tooltip rows follow the sort: one stage for value sorts, every stage for ratio sorts', () => {
  const stages = [
    { id: '01', title: '需求储备库', color: '#07978d' },
    { id: '02', title: '联合会审', color: '#fd9554' },
    { id: '03', title: '项目储备库', color: '#1cced1' }
  ]
  const row = {
    code: 'A',
    name: '南京市',
    values: { '01': '100', '02': '50', '03': '20' },
    total: '170',
    ratios: { '01': 58.82, '02': 29.41, '03': 11.77 }
  }
  const params = stages.map((stage) => ({ dataIndex: 0, name: '南京市', seriesId: `value-${stage.id}`, marker: '' }))
  const rowCount = (html) => (html.match(/<tbody>.*?<\/tbody>/s)[0].match(/<tr>/g) || []).length
  // 选中某个金额/数量排序：提示只列该阶段一行（数值与占比都给出）。
  const valueSort = createOverviewChartOption([row], 'amount', stages, { barStageId: '02', ratioStageId: '02' })
  const single = valueSort.tooltip.formatter(params)
  assert.equal(rowCount(single), 1)
  assert.ok(single.includes('联合会审'))
  assert.ok(!single.includes('需求储备库'))
  assert.ok(single.includes('<td>50.00</td>'))
  assert.ok(single.includes('29.41%'))
  // 选中「xxxx占比」：列出全部阶段，四条占比一次读全（即使图例只显示一条曲线）。
  const ratioSort = createOverviewChartOption([row], 'amount', stages, { ratioStageId: '03', ratioStageIds: ['01'] })
  const all = ratioSort.tooltip.formatter(params)
  assert.equal(rowCount(all), stages.length)
  for (const ratio of ['58.82%', '29.41%', '11.77%']) assert.ok(all.includes(ratio))
  for (const name of ['需求储备库', '联合会审', '项目储备库']) assert.ok(all.includes(name))
  // 选中「合计」（不属于任何阶段）：同样列出全部阶段，与图表里全部柱形可见一致。
  const totalSort = createOverviewChartOption([row], 'amount', stages, {})
  assert.equal(rowCount(totalSort.tooltip.formatter(params)), stages.length)
  // 缺失值仍显示 --，不补造零值。
  const sparse = createOverviewChartOption(
    [{ code: 'B', name: 'B', values: { '01': '100', '02': null, '03': null }, total: '100', ratios: { '01': 100, '02': null, '03': null } }],
    'amount',
    stages,
    { ratioStageId: '01' }
  )
  assert.ok(sparse.tooltip.formatter([{ dataIndex: 0, name: 'B', seriesId: 'value-01', marker: '' }]).includes('--'))
})

test('chart legend defaults follow the configured ratio curve codes exactly', () => {
  const stages = [
    { id: '1', title: '需求储备库', color: '#07978d' },
    { id: '02', title: '联合会审', color: '#fd9554' }
  ]
  // 配置编码与接口编码精确一致：只默认显示该阶段占比曲线，其余占比曲线仍保留在图例里。
  const exact = createOverviewChartOption([row('first', 1)], 'amount', stages, { ratioStageIds: ['02'] })
  assert.deepEqual(exact.legend.selected, {
    需求储备库: true,
    需求储备库占比: false,
    联合会审: true,
    联合会审占比: true
  })
  // 编码对不上（01 vs 1）时不命中任何阶段，只有调用方的 resolveRatioStageIds 兜底才会回到需求储备库。
  const mismatched = createOverviewChartOption([row('first', 1)], 'amount', stages, { ratioStageIds: ['01'] })
  assert.equal(mismatched.legend.selected['需求储备库占比'], false)
  assert.equal(mismatched.legend.selected['联合会审占比'], false)
})
