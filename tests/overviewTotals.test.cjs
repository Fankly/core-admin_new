const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createHarness, Vue, flush } = require('./helpers/overviewHarness.cjs')

const propsFor = () => ({
  stageId: '01',
  title: '需求储备库',
  year: '',
  month: '',
  dimension: 'unit',
  orgType: 'province',
  roleContext: { userId: '', dwId: '', bmId: '', roleId: '', roleCode: 'SCWYSZZ' },
  statMode: 'amount',
  amountUnit: '万元',
  viewMode: 'chart'
})

test('summary arithmetic preserves precision and distinguishes zero from missing data', (t) => {
  const { sumStatisticValues, calculateStatisticRatio } = createHarness(t).load('data/totals.ts')
  assert.equal(sumStatisticValues(['12345678901234567890.01', '0.02', null, 'bad']), '12345678901234567890.03')
  assert.equal(sumStatisticValues([null, '', 'bad']), null)
  assert.equal(sumStatisticValues([0, null]), '0')
  assert.equal(calculateStatisticRatio('30', '120'), 25)
  assert.equal(calculateStatisticRatio(0, 120), 0)
  assert.equal(calculateStatisticRatio(0, 0), null)
  assert.equal(calculateStatisticRatio(null, 120), null)
})

test('drill chart keeps totals out of the chart while export still writes the total row', (t) => {
  let exported
  const h = createHarness(t, {
    mocks: {
      '../export': {
        downloadOverviewTables: (name, sheets) => {
          exported = sheets
        }
      }
    }
  })
  const props = Vue.reactive({
    ...propsFor(),
    visible: true,
    sortBy: 'value-01',
    sortOrder: 'desc',
    data: [
      {
        code: 'A',
        name: 'A',
        amount: '100',
        num: '2',
        datas: [
          { jdbm: '01', jdmc: '阶段一', amount: '20', amountZb: 20, num: '1', numZb: 50 },
          { jdbm: '02', jdmc: '阶段二', amount: '80', amountZb: 80, num: '1', numZb: 50 }
        ]
      },
      {
        code: 'B',
        name: 'B',
        amount: '300',
        num: '6',
        datas: [
          { jdbm: '01', jdmc: '阶段一', amount: '180', amountZb: 60, num: '5', numZb: 83.33 },
          { jdbm: '02', jdmc: '阶段二', amount: '120', amountZb: 40, num: '1', numZb: 16.67 }
        ]
      }
    ]
  })
  const chart = h.setup('components/OverviewChart.vue', props)
  assert.deepEqual(
    chart.chartRows.value.map((row) => row.name),
    ['B', 'A']
  )
  props.sortOrder = 'asc'
  assert.deepEqual(
    chart.chartRows.value.map((row) => row.name),
    ['A', 'B']
  )
  props.statMode = 'count'
  chart.downloadTable()
  // 图表不再绘制合计柱；Excel 合计行占比按阶段列合计占全部合计现算，各行接口占比不相加。
  assert.deepEqual(exported[0].rows[0], ['合计', '8', '6', 0.75, '2', 0.25])
})

test('ranking chart has no total bar and bars still select the right unit', (t) => {
  let chartOptions
  let sheets
  const h = createHarness(t, {
    mocks: {
      '../composables/useOverviewChart': {
        useOverviewChart: (options) => {
          chartOptions = options
          return { chartRef: Vue.ref(null), chartAvailable: Vue.ref(true) }
        }
      },
      '../export': {
        downloadOverviewTables: (name, value) => {
          sheets = value
        }
      }
    }
  })
  const props = Vue.reactive(propsFor())
  const detail = h.setup('components/StageDetail.vue', props)
  detail.dwRanking.value = [
    { id: 'A', name: '单位A', amount: '100.01', num: '1' },
    { id: 'B', name: '单位B', amount: '299.99', num: '3' }
  ]
  detail.xmlxRanking.value = [
    { id: 'X', name: '类型X', amount: '100', num: '2' },
    { id: 'Y', name: '类型Y', amount: '300', num: '6' }
  ]
  chartOptions.onClick({ dataIndex: 0 })
  assert.equal(detail.selectedRankingId.value, 'A')
  chartOptions.onClick({ dataIndex: 0 })
  assert.equal(detail.selectedRankingId.value, '')
  const option = chartOptions.option()
  assert.deepEqual(option.yAxis.data, ['单位A', '单位B'])
  assert.ok(option.tooltip.formatter({ dataIndex: 0 }).includes('25.00%'))
  props.statMode = 'count'
  assert.equal(detail.rankingRows.value[0].ratio, 25)
  detail.downloadDetailTables()
  assert.deepEqual(sheets[0].rows[0], ['合计', '4', 1])
  // 项目类型排名不展示合计行，页面与导出一致。
  assert.deepEqual(sheets[1].rows[0], [1, '类型X', '2', 0.25])
  assert.deepEqual(sheets[1].rows[1], [2, '类型Y', '6', 0.75])
})

test('budget and project type totals follow the interface total and unrounded sums', (t) => {
  const h = createHarness(t)
  const props = Vue.reactive({
    ...propsFor(),
    loading: false,
    categoryLoading: false,
    error: '',
    selectedCategory: '',
    selectedYslx: '',
    glData: { sytcJe: '100', sjtcJe: '200', sumJe: '400', sytcSl: '1', sjtcSl: '3', sumSl: '4' },
    xmlxList: [
      { xmlxId: 'X', xmlxName: 'X', amount: '12345678901234567890.01', num: '1' },
      { xmlxId: 'Y', xmlxName: 'Y', amount: '0.02', num: '3' }
    ]
  })
  const budget = h.setup('components/BudgetBreakdown.vue', props)
  // 预算类型合计取接口总额 sumJe / sumSl，不在前端把两个分类相加。
  assert.equal(budget.total.value, '400')
  // 项目类型合计按未舍入原值相加，长金额不丢精度；占比以该合计为分母现算。
  assert.equal(budget.categoryTotal.value, '12345678901234567890.03')
  assert.deepEqual(
    budget.categoryRows.value.map((row) => row.ratio),
    ['100.00%', '0.00%']
  )
  props.statMode = 'count'
  assert.equal(budget.total.value, '4')
  assert.equal(budget.categoryTotal.value, '4')
  assert.deepEqual(
    budget.categoryRows.value.map((row) => row.ratio),
    ['25.00%', '75.00%']
  )
  // 分母为零时占比留空，不显示 0% 或 Infinity。
  props.xmlxList = [{ xmlxId: 'X', xmlxName: 'X', num: '0' }]
  assert.equal(budget.categoryTotal.value, '0')
  assert.deepEqual(
    budget.categoryRows.value.map((row) => row.ratio),
    ['--']
  )
})

test('stage wide table total comes from the stage summary and drives row ratios', async (t) => {
  const h = createHarness(t, {
    mocks: {
      '@/api/overview': {
        getGlkbByDw: async () => ({
          success: true,
          data: {
            total: 2,
            records: [
              { dw: 'A', dwName: '南京', xmlx: 'X', xmlxName: '基建', yslx: '1', yslxName: '省级', amount: '100', num: '1' },
              { dw: 'B', dwName: '苏州', xmlx: 'Y', xmlxName: '运维', yslx: '2', yslxName: '市域', amount: '300', num: '3' }
            ]
          }
        }),
        getGlDataByDw: async () => ({ success: true, data: { sumJe: '400', sumSl: '4' } })
      }
    }
  })
  const props = Vue.reactive({
    ...propsFor(),
    year: '2026',
    viewMode: 'table',
    roleContext: { userId: 'u', dwId: 'd', bmId: 'b', roleId: 'r', roleCode: 'c' }
  })
  const table = h.setup('components/StageWideTable.vue', props)
  await flush()
  assert.equal(table.rows.value.length, 2)
  assert.equal(table.summaryValue.value, '400')
  assert.equal(table.formatRatio('100'), '25.00%')
  assert.equal(table.totalRatio.value, '100.00%')
  // 统计口径只换取值列，合计与占比复用同次响应。
  props.statMode = 'count'
  assert.equal(table.summaryValue.value, '4')
  assert.equal(table.formatRatio('1'), '25.00%')
})
