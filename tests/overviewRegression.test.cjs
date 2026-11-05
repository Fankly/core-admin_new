const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createHarness, flush, Vue } = require('./helpers/overviewHarness.cjs')

const roleContext = { userId: 'user', dwId: 'unit', bmId: 'dept', roleId: 'role', roleCode: 'SCWYSZZ' }
const commonProps = () => ({
  stageId: '01',
  title: '需求储备库',
  year: '2026',
  month: '',
  dimension: 'unit',
  orgType: 'province',
  roleContext: { ...roleContext },
  statMode: 'amount',
  amountUnit: '万元',
  viewMode: 'chart'
})
const stage = (amount, id = '01') => ({ jdbm: id, jdmc: `阶段${id}`, amount, amountZb: 100, num: 1, numZb: 100, sortCode: 0 })
const group = (code, amount, stageAmount = amount) => ({ code, name: code, amount, num: 1, datas: [stage(stageAmount)] })
const deferred = () => {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

test('totals fill each missing row total and preserve zero, empty values and long decimals', (t) => {
  const h = createHarness(t)
  const props = Vue.reactive({ ...commonProps(), visible: true, data: [group('A', '100'), group('B', null, '200')] })
  const chart = h.setup('components/OverviewChart.vue', props)
  assert.deepEqual(chart.totals.value, { total: '300', values: { '01': '300' }, ratios: { '01': 100 } })
  props.data = [group('A', '0', '0'), group('B', null, '200')]
  assert.equal(chart.totals.value.total, '200')
  props.data = [group('A', null, null)]
  assert.deepEqual(chart.totals.value, { total: null, values: { '01': null }, ratios: { '01': null } })
  props.data = [group('A', '12345678901234567890.01'), group('B', null, '0.02')]
  assert.equal(chart.totals.value.total, '12345678901234567890.03')
  // 行合计与阶段明细不一致时，「全部阶段合计」仍取各阶段列合计之和。
  props.data = [
    {
      code: 'A',
      name: 'A',
      amount: '999',
      num: 1,
      datas: [
        { jdbm: '01', jdmc: '阶段01', amount: '100', amountZb: 10, num: 1, numZb: 10, sortCode: 0 },
        { jdbm: '02', jdmc: '阶段02', amount: '300', amountZb: 30, num: 1, numZb: 10, sortCode: 0 }
      ]
    }
  ]
  assert.equal(chart.totals.value.total, '400')
  // 合计行占比按阶段列合计占全部阶段合计现算，不把各行接口占比相加。
  assert.deepEqual(chart.totals.value.ratios, { '01': 25, '02': 75 })
  props.data = [
    ...props.data,
    {
      code: 'B',
      name: 'B',
      amount: '400',
      num: 1,
      datas: [
        { jdbm: '01', jdmc: '阶段01', amount: '300', amountZb: 10, num: 1, numZb: 10, sortCode: 0 },
        { jdbm: '02', jdmc: '阶段02', amount: '100', amountZb: 30, num: 1, numZb: 10, sortCode: 0 }
      ]
    }
  ]
  assert.equal(chart.totals.value.total, '800')
  assert.deepEqual(chart.totals.value.ratios, { '01': 50, '02': 50 })
})

test('amount formatting rounds decimal inputs once without losing large integer or fractional digits', (t) => {
  const { formatOverviewValue } = createHarness(t).load('data/format.ts')
  for (const [input, unit, expected] of [
    ['100000000000000.01', '万元', '100000000000000.01'],
    ['9007199254740993', '万元', '9007199254740993.00'],
    ['123456789012345678901234.5678', '亿元', '12345678901234567890.12'],
    ['2.675', '万元', '2.68'],
    ['10000', '亿元', '1.00'],
    [null, '万元', '--'],
    ['invalid', '万元', 'invalid']
  ])
    assert.equal(formatOverviewValue(input, 'amount', unit), expected)
  assert.equal(formatOverviewValue('9007199254740993', 'count', '亿元'), '9007199254740993')
})

test('ranking values, bar labels and tooltips retain source amounts when chart events contain rounded numbers', (t) => {
  const h = createHarness(t)
  const detail = h.setup('components/StageDetail.vue', Vue.reactive({ ...commonProps(), year: '' }))
  const amount = '100000000000000.01'
  const rows = detail.toRows([
    { id: 'A', name: '<单位>', amount },
    { id: 'B', name: 'B', amount: null }
  ])
  assert.equal(rows[0].value, amount)
  assert.equal(rows[1].value, null)
  const { createOverviewChartOption, createRankingChartOption } = h.load('charts.ts')
  const event = { dataIndex: 0, name: '<单位>', value: Number(amount), seriesId: 'value-01', marker: '' }
  const ranking = createRankingChartOption(rows, '项目类型', 'amount', '万元')
  assert.equal(ranking.series[0].label.formatter(event), amount)
  const rankingTooltip = ranking.tooltip.formatter([event])
  // 排名提示与总览柱状图共用同一模板：标题 + 合计区 + 表格行，金额取源值。
  assert.ok(rankingTooltip.includes('<td>' + amount + '</td>'))
  assert.ok(rankingTooltip.includes('&lt;单位&gt;'))
  assert.ok(rankingTooltip.includes('项目类型'))
  const overview = createOverviewChartOption(
    [{ code: 'A', name: '<单位>', values: { '01': amount }, total: amount, ratios: { '01': 100 } }],
    'amount',
    [{ id: '01', title: '需求储备库', color: '#07978d' }]
  )
  assert.ok(overview.tooltip.formatter([event]).includes(`<td>${amount}</td>`))
})

test('ranking chart hides the bottom amount scale and keeps short lists scroll-free', (t) => {
  const h = createHarness(t)
  const { createRankingChartOption, resolveRankingChartMinHeight } = h.load('charts.ts')
  const rows = Array.from({ length: 13 }, (_, index) => ({ id: `DW${index}`, name: `市${index}`, value: 1000 - index, ratio: 1 }))
  const ranking = createRankingChartOption(rows, '全部项目类型', 'amount', '万元')
  // 底部不再绘制金额轴名、刻度数字与轴线，只保留浅色刻度线；读数由柱尾标签和悬停提示给出。
  assert.equal(ranking.xAxis.name, undefined)
  assert.equal(ranking.xAxis.axisLabel.show, false)
  assert.equal(ranking.xAxis.axisLine.show, false)
  assert.equal(ranking.xAxis.axisTick.show, false)
  assert.ok(ranking.xAxis.splitLine)
  assert.equal(ranking.series[0].label.formatter({ dataIndex: 0 }), '1000.00')
  // 13 家地市（≤15 行）无论卡片多矮都不设最小高度，图表铺满卡片、不出现滚动条。
  assert.equal(resolveRankingChartMinHeight(13, 180), 0)
  assert.equal(resolveRankingChartMinHeight(13, 0), 0)
  assert.equal(resolveRankingChartMinHeight(6, 256), 0)
  // 长名单放不下时按滚动行高绘制；卡片够高时同样铺满、不滚动。
  assert.ok(resolveRankingChartMinHeight(35, 256) > 256)
  assert.equal(resolveRankingChartMinHeight(35, 2000), 0)
  assert.equal(resolveRankingChartMinHeight(0, 300), 0)
})

test('Excel keeps ordinary amounts numeric and preserves long amounts as text after a workbook round trip', async (t) => {
  let blob
  const h = createHarness(t, {
    globals: {
      URL: {
        createObjectURL: (value) => {
          blob = value
          return 'blob:overview-test'
        },
        revokeObjectURL() {}
      },
      document: { body: { appendChild() {} }, createElement: () => ({ click() {}, remove() {} }) },
      setTimeout: (callback) => callback()
    }
  })
  await h.load('export.ts').downloadOverviewTables('test', [
    {
      name: '金额',
      columns: [{ title: '金额', amount: true, numFmt: '#,##0.00' }],
      rows: [['12345.67'], ['100000000000000.01'], ['9007199254740993.00'], [null], ['--']]
    }
  ])
  const ExcelJS = require('exceljs')
  const book = new ExcelJS.Workbook()
  await book.xlsx.load(await blob.arrayBuffer())
  const sheet = book.getWorksheet('金额')
  assert.equal(sheet.getCell('A2').value, 12345.67)
  assert.equal(sheet.getCell('A3').value, '100000000000000.01')
  assert.equal(sheet.getCell('A4').value, '9007199254740993.00')
  assert.equal(sheet.getCell('A5').value, '--')
  assert.equal(sheet.getCell('A6').value, '--')
})

test('a donut draws an empty ring for all-zero values and clears previous sectors when the metric switches', async (t) => {
  const frames = new Map()
  const h = createHarness(t, {
    realChart: true,
    globals: {
      ResizeObserver: class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
      document: { fonts: { ready: new Promise(() => {}) } }
    },
    mocks: {
      echarts: {
        init: (container) => ({
          on() {},
          dispose() {},
          dispatchAction() {},
          getZr: () => ({ flush() {} }),
          setOption: (option) =>
            frames.set(
              container.id,
              option.series[0].data.map((item) => item.value)
            )
        })
      }
    }
  })
  const props = Vue.reactive({
    title: '预算类型占比',
    nameLabel: '预算类型',
    rows: [
      { id: '2', name: '市域统筹', color: '#fd9554', value: '0', ratio: '0.00%' },
      { id: '1', name: '省级统筹', color: '#0e9f6e', value: '0', ratio: '0.00%' }
    ],
    selectedId: '',
    total: '0',
    totalCaption: '合计',
    statMode: 'amount',
    amountUnit: '万元',
    loading: false,
    loadingText: '',
    error: '',
    emptyText: '',
    chartLabel: '',
    legendLabel: '',
    legendLayout: 'rows',
    legendValue: true,
    legendHeight: 0
  })
  const donut = h.setup('components/OverviewDonutCard.vue', props)
  donut.chartRef.value = { id: 'donut', clientWidth: 200, clientHeight: 200 }
  await h.mount()
  // 全零不画等分扇区：清空数据画出空环，而不是留一块满圆。
  assert.deepEqual(frames.get('donut'), [])
  props.statMode = 'count'
  props.rows = [
    { id: '2', name: '市域统筹', color: '#fd9554', value: '3', ratio: '75.00%' },
    { id: '1', name: '省级统筹', color: '#0e9f6e', value: '1', ratio: '25.00%' }
  ]
  await flush()
  assert.deepEqual(frames.get('donut'), [3, 1])
})

test('ranking filters survive loading and failed requests, clearing only when successful data excludes the selection', async (t) => {
  const queries = [],
    pending = []
  const h = createHarness(t, {
    mocks: {
      '@/api/overview': {
        getGlDataByDw: async () => ({ success: true, data: {} }),
        getGlXmlxDataByDw: async () => ({ success: true, data: [] }),
        getGlDwpmByDw: () => {
          const request = deferred()
          pending.push(request)
          return request.promise
        },
        getGlXmlxpmByDw: async (params) => {
          queries.push(params)
          return { success: true, data: [] }
        }
      }
    }
  })
  const props = Vue.reactive(commonProps())
  const detail = h.setup('components/StageDetail.vue', props)
  const response = { success: true, data: [{ id: 'A', name: 'A', amount: '100', num: 3 }] }
  pending.shift().resolve(response)
  await flush()
  detail.selectedRankingId.value = 'A'
  await flush()
  props.statMode = 'count'
  await flush()
  assert.equal(detail.selectedRankingId.value, 'A')
  assert.equal(queries.at(-1).searchZybm, 'A')
  pending.shift().resolve({ success: false, msg: 'failed' })
  await flush()
  assert.equal(detail.selectedRankingId.value, 'A')
  const retry = detail.reloadDwRanking()
  pending.shift().resolve(response)
  await retry
  await flush()
  assert.equal(detail.selectedRankingId.value, 'A')
  const refresh = detail.reloadDwRanking()
  pending.shift().resolve({ success: true, data: [] })
  await refresh
  await flush()
  assert.equal(detail.selectedRankingId.value, '')
  assert.equal(queries.at(-1).searchZybm, undefined)
})

test('project details retain the monetary unit when entered through the count metric', (t) => {
  const detail = createHarness(t).setup(
    'components/CtDataDialog.vue',
    Vue.reactive({
      ...commonProps(),
      target: null,
      statMode: 'count',
      amountUnit: '亿元'
    })
  )
  assert.equal(detail.unit.value, '亿元')
  assert.equal(detail.formatAmountCell({ cellValue: '10000' }), '1.00')
})

for (const configFirst of [true, false]) {
  test(`default sorting applies the configured stage code whether config arrives ${configFirst ? 'before' : 'after'} data`, async (t) => {
    const data = deferred()
    const h = createHarness(t, {
      mocks: {
        '@/api/common': { getPublicCodesList: async () => ({ success: true, data: [] }) },
        '@/api/overview': {
          getOrgFlag: async () => ({ success: true, data: { orgFlag: 'PROVINCE', dwsxId: '' } }),
          getDataByDw: () => data.promise
        }
      }
    })
    const props = Vue.reactive({
      roleContext,
      filters: { year: '2026', month: '', statMode: 'amount', amountUnit: '万元' },
      dimension: 'unit',
      selectedStage: '',
      defaultSortValue: ''
    })
    const panel = h.setup('components/OverviewChartPanel.vue', props)
    await h.mount()
    // 配置值与接口阶段编码精确一致（01 对 01），不做前导零换算。
    const resolveConfig = () => (props.defaultSortValue = 'value-01')
    const resolveData = () => data.resolve({ success: true, data: [group('A', '100'), group('B', '200')] })
    ;(configFirst ? resolveConfig : resolveData)()
    await flush()
    ;(configFirst ? resolveData : resolveConfig)()
    await flush()
    assert.equal(panel.sortBy.value, 'value-01')
    assert.ok(panel.sortOptions.value.some((option) => option.id === panel.sortBy.value))
  })
}

for (const manualChoice of [false, true]) {
  test(`late invalid sort config ${manualChoice ? 'preserves a manual choice' : 'falls back to demand pool ratio'}`, async (t) => {
    const h = createHarness(t, {
      mocks: {
        '@/api/common': { getPublicCodesList: async () => ({ success: true, data: [] }) },
        '@/api/overview': {
          getOrgFlag: async () => ({ success: true, data: { orgFlag: 'PROVINCE', dwsxId: '' } }),
          getDataByDw: async () => ({ success: true, data: [group('A', '100')] })
        }
      }
    })
    const props = Vue.reactive({
      roleContext,
      filters: { year: '2026', month: '', statMode: 'amount', amountUnit: '万元' },
      dimension: 'unit',
      selectedStage: '',
      defaultSortValue: ''
    })
    const panel = h.setup('components/OverviewChartPanel.vue', props)
    await h.mount()
    if (manualChoice) {
      panel.sortBy.value = 'value-01'
      panel.toggleSortOrder()
    }
    props.defaultSortValue = 'value-99'
    await flush()
    assert.equal(panel.sortBy.value, manualChoice ? 'value-01' : 'ratio-01')
    assert.equal(panel.sortOrder.value, manualChoice ? 'asc' : 'desc')
  })
}

test('chart panel loads all public codes in one batch request', async (t) => {
  const calls = []
  const h = createHarness(t, {
    mocks: {
      '@/api/common': {
        getPublicCodesList: async (params) => {
          calls.push(params)
          return { success: true, data: [] }
        }
      },
      '@/api/overview': {
        getOrgFlag: async () => ({ success: true, data: { orgFlag: 'PROVINCE', dwsxId: '' } }),
        getDataByDw: async () => ({ success: true, data: [group('A', '100')] })
      }
    }
  })
  h.setup(
    'components/OverviewChartPanel.vue',
    Vue.reactive({
      roleContext,
      filters: { year: '2026', month: '', statMode: 'amount', amountUnit: '万元' },
      dimension: 'unit',
      selectedStage: ''
    })
  )
  await h.mount()
  // 组织类型、占比曲线默认项、排序选项与两组独立页签合并为一次请求。
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].codes, ['XMZL_SEARCH_TYPE_COM', 'XMZL_RATIO_COM', 'XMZL_STAGE_SORT_COM', 'XMZL_TAB_COM', 'XMZL_STAGE_TAB_COM'])
})

test('chart follows the sort key by hiding, not removing, the other series', (t) => {
  let chartOptions
  const h = createHarness(t, {
    mocks: {
      // 捕获图表配置，验证组件把排序键正确翻译成柱形 / 占比曲线的默认可见系列。
      '../composables/useOverviewChart': {
        useOverviewChart: (options) => {
          chartOptions = options
          return { chartRef: Vue.ref(null), chartAvailable: Vue.ref(false) }
        }
      }
    }
  })
  const props = Vue.reactive({
    visible: true,
    year: '2026',
    dimension: 'unit',
    statMode: 'amount',
    amountUnit: '万元',
    viewMode: 'chart',
    ratioStageIds: ['01'],
    sortBy: 'ratio-02',
    sortOrder: 'desc',
    data: [
      {
        code: 'A',
        name: '南京市',
        amount: '170',
        num: 3,
        datas: [
          { jdbm: '01', jdmc: '需求储备库', amount: '100', amountZb: 58.8, num: 1, numZb: 33, sortCode: 0 },
          { jdbm: '02', jdmc: '联合会审', amount: '70', amountZb: 41.2, num: 2, numZb: 67, sortCode: 1 }
        ]
      }
    ]
  })
  h.setup('components/OverviewChart.vue', props)
  const option = () => chartOptions.option()
  const allSeries = ['value-02', 'value-01', 'ratio-01', 'ratio-02']
  const allLegend = ['需求储备库', '需求储备库占比', '联合会审', '联合会审占比']
  // 占比排序：系列与图例项都在，只有其它占比曲线被图例隐藏（用户可再打开）。
  assert.deepEqual(option().series.map((item) => item.id), allSeries)
  assert.deepEqual(option().legend.data.map((item) => item.name), allLegend)
  assert.deepEqual(option().legend.selected, {
    需求储备库: true,
    需求储备库占比: false,
    联合会审: true,
    联合会审占比: true
  })
  // 数值排序：同样只改图例默认值，其它阶段柱形被隐藏而不是删除。
  props.sortBy = 'value-02'
  assert.deepEqual(option().series.map((item) => item.id), allSeries)
  assert.deepEqual(option().legend.data.map((item) => item.name), allLegend)
  assert.deepEqual(option().legend.selected, {
    需求储备库: false,
    需求储备库占比: false,
    联合会审: true,
    联合会审占比: true
  })
})

test('switching the sorted stage clears that stage’s previous legend hiding', async (t) => {
  let chartOptions
  const h = createHarness(t, {
    mocks: {
      '../composables/useOverviewChart': {
        useOverviewChart: (options) => {
          chartOptions = options
          return { chartRef: Vue.ref(null), chartAvailable: Vue.ref(false), renderChart() {} }
        }
      }
    }
  })
  const props = Vue.reactive({
    visible: true,
    year: '2026',
    dimension: 'unit',
    statMode: 'amount',
    amountUnit: '万元',
    viewMode: 'chart',
    sortBy: 'ratio-01',
    sortOrder: 'desc',
    data: [
      {
        code: 'A',
        name: '南京市',
        amount: '170',
        num: 3,
        datas: [
          { jdbm: '01', jdmc: '需求储备库', amount: '100', amountZb: 58.8, num: 1, numZb: 33, sortCode: 0 },
          { jdbm: '02', jdmc: '联合会审', amount: '70', amountZb: 41.2, num: 2, numZb: 67, sortCode: 1 }
        ]
      }
    ]
  })
  const chart = h.setup('components/OverviewChart.vue', props)
  // 用户先把联合会审占比手动关掉。
  chart.handleLegendSelectChanged({ name: '联合会审占比', selected: { 联合会审占比: false } })
  await flush()
  assert.equal(chartOptions.option().legend.selected['联合会审占比'], false)
  // 排序切到该阶段后，被手动隐藏的状态被清掉，曲线重新默认显示。
  props.sortBy = 'ratio-02'
  await flush()
  assert.equal(chartOptions.option().legend.selected['联合会审占比'], true)
})

test('sort dropdown offers 合计 first and sizes itself to the longest option label', async (t) => {
  const h = createHarness(t, {
    mocks: {
      '@/api/common': {
        getPublicCodesList: async () => ({ success: true, data: [] })
      },
      '@/api/overview': {
        getOrgFlag: async () => ({ success: true, data: { orgFlag: 'PROVINCE', dwsxId: '' } }),
        getDataByDw: async () => ({
          success: true,
          data: [
            {
              code: 'A',
              name: 'A',
              amount: '100',
              num: 1,
              datas: [
                { jdbm: '01', jdmc: '需求储备库', amount: '100', amountZb: 100, num: 1, numZb: 100, sortCode: 0 },
                { jdbm: '02', jdmc: '联合会审', amount: '0', amountZb: 0, num: 0, numZb: 0, sortCode: 1 }
              ]
            }
          ]
        })
      }
    }
  })
  const panel = h.setup(
    'components/OverviewChartPanel.vue',
    Vue.reactive({
      roleContext,
      filters: { year: '2026', month: '', statMode: 'amount', amountUnit: '万元' },
      dimension: 'unit',
      selectedStage: ''
    })
  )
  await h.mount()
  // 合计固定排在首位，其后每个阶段各有数值与占比两项。
  assert.equal(panel.sortOptions.value[0].id, 'value-total')
  assert.equal(panel.sortOptions.value[0].label, '合计')
  assert.deepEqual(
    panel.sortOptions.value.map((option) => option.id),
    ['value-total', 'value-01', 'ratio-01', 'value-02', 'ratio-02']
  )
  // 宽度按最长选项（「需求储备库占比」7em）计算，比固定 178px 窄，且比文字宽出少量留白。
  assert.equal(panel.sortFieldWidth.value, '128px')
  // 选中合计时按行合计排序，且不改变图表默认显示的系列。
  panel.sortBy.value = 'value-total'
  await flush()
  assert.ok(panel.sortDescription.value.includes('按合计'))
})

for (const [name, flag, expectedOptions, expectedSearchType] of [
  ['province', { orgFlag: 'PROVINCE', dwsxId: '' }, ['province', 'city', 'direct'], ''],
  ['city', { orgFlag: 'CITY', dwsxId: 'GSSX_GDGS' }, ['city'], 1],
  ['department', { orgFlag: 'CITY', dwsxId: 'GSSX_JGBB' }, ['direct'], 2],
  ['direct', { orgFlag: 'CITY', dwsxId: 'GSSX_ZSDW' }, ['direct'], 2],
  // 字段缺失或码值未知时回落到全部，避免权限标识异常时切换组为空。
  ['unknown', { orgFlag: 'CITY', dwsxId: 'GSSX_UNKNOWN' }, ['province', 'city', 'direct'], '']
]) {
  test(`org flag limits org type switch and searchType: ${name}`, async (t) => {
    const scope = deferred()
    const unitCalls = []
    const h = createHarness(t, {
      mocks: {
        '@/api/common': {
          getPublicCodesList: async () => ({
            success: true,
            data: [
              {
                comCode: 'XMZL_SEARCH_TYPE_COM',
                codes: [
                  { code: '', name: '全省' },
                  { code: '1', name: '地市公司' },
                  { code: '2', name: '直属单位' }
                ]
              }
            ]
          })
        },
        '@/api/overview': {
          getOrgFlag: () => scope.promise,
          getDataByDw: (params) => {
            unitCalls.push(params)
            return Promise.resolve({ success: true, data: [group('A', '100')] })
          }
        }
      }
    })
    const panel = h.setup(
      'components/OverviewChartPanel.vue',
      Vue.reactive({
        roleContext,
        filters: { year: '2026', month: '', statMode: 'amount', amountUnit: '万元' },
        dimension: 'unit',
        selectedStage: ''
      })
    )
    await h.mount()
    // 权限返回前保持加载态，不先用「全省」查询一次。
    assert.equal(unitCalls.length, 0)
    scope.resolve({ success: true, data: flag })
    await flush()
    assert.deepEqual(
      panel.orgTypeOptions.value.map((option) => option.value),
      expectedOptions
    )
    assert.equal(panel.orgType.value, expectedOptions[0])
    assert.ok(unitCalls.length > 0)
    assert.ok(unitCalls.every((params) => params.searchType === expectedSearchType))
  })
}

test('summary pie highlights the selected stage card and toggles it on sector click', async (t) => {
  const frames = []
  const actions = []
  const h = createHarness(t, {
    realChart: true,
    globals: {
      ResizeObserver: class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
      document: { fonts: { ready: new Promise(() => {}) } }
    },
    mocks: {
      echarts: {
        init: () => ({
          on() {},
          dispose() {},
          resize() {},
          getZr: () => ({ flush() {} }),
          getDataURL: () => '',
          setOption: (option) => frames.push(option.series[0].data),
          dispatchAction: (action) => actions.push(action)
        })
      }
    }
  })
  const props = Vue.reactive({
    summary: {
      sumAmount: '100',
      sumNum: 10,
      childJd: [
        { jdbm: '01', jdmc: '需求储备库', amount: '40', amountZb: 40, num: 4, numZb: 40 },
        // 占比为 0 的阶段没有扇区，选中它不应突出任何扇区。
        { jdbm: '02', jdmc: '联合会审', amount: '0', amountZb: 0, num: 0, numZb: 0 },
        { jdbm: '03', jdmc: '项目储备库', amount: '60', amountZb: 60, num: 6, numZb: 60 }
      ]
    },
    stages: [
      { id: '01', title: '需求储备库', color: '#0e9f6e' },
      { id: '02', title: '联合会审', color: '#fd9554' },
      { id: '03', title: '项目储备库', color: '#1cced1' }
    ],
    statMode: 'amount',
    amountUnit: '万元',
    loading: false,
    error: '',
    stageDetailsEnabled: true,
    selectedStage: ''
  })
  const emitted = []
  const summary = h.setup('components/OverviewSummary.vue', props, { expose() {}, emit: (name, ...args) => emitted.push([name, ...args]) })
  summary.chartRef.value = { id: 'summary', clientWidth: 320, clientHeight: 200 }
  await h.mount()

  // 未选中时所有扇区都是实色，也不派发持续高亮。
  assert.equal(summary.selectedPieIndex.value, -1)
  assert.ok(frames.at(-1).every((item) => item.itemStyle.opacity === undefined))
  assert.equal(actions.filter((action) => action.type === 'highlight').length, 0)

  // 选中「需求储备库」：该扇区保持实色（外弹由独立高亮键给出），另一个扇区淡出。
  props.selectedStage = '01'
  await flush()
  assert.equal(summary.selectedStageIndex.value, 0)
  assert.equal(summary.selectedPieIndex.value, 0)
  assert.deepEqual(
    frames.at(-1).map((item) => item.itemStyle.opacity),
    [undefined, 0.4]
  )
  // 淡出的扇区悬停时恢复实色，避免提示读数看不清。
  assert.equal(frames.at(-1)[1].emphasis.itemStyle.opacity, 1)
  const highlight = actions.filter((action) => action.type === 'highlight')
  assert.deepEqual(highlight.at(-1), { type: 'highlight', seriesIndex: 0, highlightKey: 'overview-selection', dataIndex: 0 })

  // 占比为 0 的阶段没有扇区：不淡出其它扇区，也不派发高亮。
  props.selectedStage = '02'
  await flush()
  assert.equal(summary.selectedPieIndex.value, -1)
  assert.ok(frames.at(-1).every((item) => item.itemStyle.opacity === undefined))
  assert.deepEqual(actions.at(-1), { type: 'downplay', seriesIndex: 0, highlightKey: 'overview-selection' })

  // 点扇区与点阶段卡片走同一个入口：选中即切换下方阶段详情，再点一次返回总览。
  props.selectedStage = ''
  await flush()
  emitted.length = 0
  summary.selectPieStage(1)
  assert.deepEqual(emitted, [['select-stage', '03']])
  summary.selectPieStage(0)
  assert.deepEqual(emitted, [
    ['select-stage', '03'],
    ['select-stage', '01']
  ])
  // 阶段详情关闭时扇区不再是入口。
  props.stageDetailsEnabled = false
  emitted.length = 0
  summary.selectPieStage(0)
  assert.deepEqual(emitted, [])
})
