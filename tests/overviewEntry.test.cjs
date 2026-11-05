const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createHarness, flush, Vue } = require('./helpers/overviewHarness.cjs')

const roleContext = { userId: 'user', dwId: 'unit', bmId: 'dept', roleId: 'role', roleCode: 'SCWYSZZ' }
const emptyGl = { sjtcJe: 0, sjtcJeZb: 0, sjtcSl: 0, sjtcSlZb: 0, sytcJe: 0, sytcJeZb: 0, sytcSl: 0, sytcSlZb: 0, sumJe: 0, sumSl: 0 }

test('tab public codes preserve names and order, ignoring invalid or duplicate items', (t) => {
  const { parseOverviewTabs } = createHarness(t).load('data/overview.ts')
  assert.deepEqual(
    parseOverviewTabs([
      null,
      { code: '3', name: '未实现视图' },
      { code: '1', name: { text: '无效名称' } },
      { code: 2, name: ' 单位统计 ' },
      { code: '1', name: '预算概况' },
      { code: '2', name: '重复项' }
    ]),
    [
      { id: 'statistics', label: '单位统计' },
      { id: 'overview', label: '预算概况' }
    ]
  )
  for (const data of [
    undefined,
    null,
    [],
    {},
    [{ code: '1', name: '概览' }],
    [
      { code: '1', name: '概览' },
      { code: '2', name: ' ' }
    ]
  ]) {
    assert.deepEqual(parseOverviewTabs(data), [], 'missing or incomplete configuration uses the default pair')
  }
})

test('async public tab configuration renames and reorders tabs without changing the selected view', async (t) => {
  let resolveConfig
  const calls = []
  const h = createHarness(t, {
    mocks: {
      '@/api/common': {
        getPublicCodesList: (params) => {
          calls.push(params)
          return new Promise((resolve) => {
            resolveConfig = resolve
          })
        }
      }
    }
  })
  const { OVERVIEW_ENTRY_ID } = h.load('data/overview.ts')
  const props = Vue.reactive({
    selectedStage: OVERVIEW_ENTRY_ID,
    filters: { year: '', month: '', statMode: 'amount', amountUnit: '万元' },
    dimension: 'unit',
    roleContext: { dwId: '' }
  })
  const panel = h.setup('components/OverviewChartPanel.vue', props, {
    expose() {},
    emit(event) {
      if (event === 'select-overview-entry') props.selectedStage = OVERVIEW_ENTRY_ID
      else if (event === 'select-statistics') props.selectedStage = ''
    }
  })
  await h.mount()
  panel.selectTab('statistics')
  resolveConfig({
    success: true,
    data: [
      { comCode: 'XMZL_STAGE_TAB_COM', codes: [{ code: '1', name: '阶段概况' }] },
      { comCode: 'XMZL_RATIO_COM', codes: [{ code: '01', name: '需求储备库' }] },
      {
        comCode: 'XMZL_TAB_COM',
        codes: [
          { code: '1', name: '预算概况', sort: '10' },
          { code: '2', name: '单位统计', sort: '2' }
        ]
      }
    ]
  })
  await flush()
  assert.equal(calls.length, 1)
  assert.ok(calls[0].codes.includes('XMZL_TAB_COM'))
  assert.ok(calls[0].codes.includes('XMZL_STAGE_TAB_COM'))
  assert.deepEqual(
    panel.tabs.value.map((tab) => tab.label),
    ['单位统计', '预算概况']
  )
  assert.equal(panel.activeTab.value, 'statistics', 'late configuration must preserve the user selection')
  panel.selectTab(panel.tabs.value[1].id)
  assert.equal(panel.detailVisible.value, true, 'renaming overview must not change its view mapping')
  props.activeStage = { id: '01', title: '需求储备库' }
  props.selectedStage = '01'
  assert.deepEqual(panel.tabs.value, [{ id: 'overview', label: '阶段概况' }])
  props.activeStage = undefined
  props.selectedStage = OVERVIEW_ENTRY_ID
  assert.equal(panel.tabs.value.length, 2)

  const retry = panel.loadPublicCodeConfig()
  resolveConfig({ success: false, msg: '配置读取失败' })
  await retry
  assert.deepEqual(
    panel.tabs.value.map((tab) => tab.label),
    ['总体分析', '构成分析']
  )
  assert.equal(panel.activeTab.value, 'overview')
  props.activeStage = { id: '01', title: '需求储备库' }
  props.selectedStage = '01'
  assert.deepEqual(panel.tabs.value, [{ id: 'overview', label: '构成分析' }])
})

test('tabs follow numeric sort while equal and missing order values retain response order', (t) => {
  const { parseOverviewTabs } = createHarness(t).load('data/overview.ts')
  const source = Object.freeze([Object.freeze({ code: '1', name: '概览', sort: '10' }), Object.freeze({ code: '2', name: '统计分析', sort: ' 2 ' })])
  assert.deepEqual(
    parseOverviewTabs(source).map((tab) => tab.id),
    ['statistics', 'overview']
  )
  const responseOrder = [
    { code: '2', name: '统计分析' },
    { code: '1', name: '概览' }
  ]
  for (const sort of [undefined, null, '', ' ', 'invalid', false, Infinity, 0, '5']) {
    assert.deepEqual(
      parseOverviewTabs(responseOrder.map((tab) => ({ ...tab, sort }))).map((tab) => tab.id),
      ['statistics', 'overview']
    )
  }
})

test('public code response uses sort ahead of dispOrder and keeps the note default independent', (t) => {
  const { parseOverviewTabConfig, pickPublicCodeItems } = createHarness(t).load('data/overview.ts')
  const response = {
    data: [
      { comCode: 'XMZL_SEARCH_TYPE_COM', codes: [{ code: '1', name: '地市公司', sort: '1', note: '' }] },
      {
        comCode: 'XMZL_TAB_COM',
        codes: [
          { code: '1', name: '构成分析', sort: '10', dispOrder: 0, note: '1' },
          { code: '2', name: '总体分析', sort: '0', dispOrder: 20, note: '' }
        ]
      }
    ]
  }
  assert.deepEqual(parseOverviewTabConfig(pickPublicCodeItems(response.data, 'XMZL_TAB_COM')), {
    defaultTab: 'overview',
    tabs: [
      { id: 'statistics', label: '总体分析' },
      { id: 'overview', label: '构成分析' }
    ]
  })
  for (const sort of [undefined, null, '', 'invalid']) {
    assert.deepEqual(
      parseOverviewTabConfig([
        { code: '1', name: '构成分析', sort, dispOrder: '10' },
        { code: '2', name: '总体分析', sort, dispOrder: '2' }
      ]).tabs.map((tab) => tab.id),
      ['statistics', 'overview']
    )
  }
})

test('tab defaults use the first valid note=1 item, otherwise the first returned item before display sorting', (t) => {
  const { parseOverviewTabConfig, parseStageTabConfig } = createHarness(t).load('data/overview.ts')
  const rows = [
    { code: '2', name: '统计分析', sort: 20 },
    { code: '1', name: '概览', sort: 10 }
  ]
  assert.deepEqual(parseOverviewTabConfig(rows), {
    defaultTab: 'statistics',
    tabs: [
      { id: 'overview', label: '概览' },
      { id: 'statistics', label: '统计分析' }
    ]
  })
  for (const note of ['1', 1, ' 1 ']) {
    assert.equal(parseOverviewTabConfig([rows[0], { ...rows[1], note }]).defaultTab, 'overview')
    assert.equal(parseStageTabConfig([{ ...rows[1], note }]).defaultTab, 'overview')
  }
  for (const note of [undefined, null, '', '0', '说明', true, { value: 1 }]) {
    assert.equal(parseOverviewTabConfig([rows[0], { ...rows[1], note }]).defaultTab, 'statistics')
  }
  assert.equal(parseOverviewTabConfig(rows.map((row) => ({ ...row, note: '1' }))).defaultTab, 'statistics')
  assert.equal(
    parseOverviewTabConfig([{ code: '3', name: '未知页签', note: '1' }, { code: '1', name: '', note: '1' }, ...rows, { ...rows[1], note: '1' }])
      .defaultTab,
    'statistics',
    'invalid and duplicate rows cannot supply the default'
  )
})

test('public code defaults initialize the main view and are restored when returning from a stage', async (t) => {
  for (const marked of [true, false]) {
    await t.test(marked ? 'note=1 selects statistics' : 'no marker selects the first returned tab', async (t) => {
      const rows = marked
        ? [
            { code: '1', name: '概览', sort: 1 },
            { code: '2', name: '统计分析', sort: 2, note: '1' }
          ]
        : [
            { code: '2', name: '统计分析', sort: 2 },
            { code: '1', name: '概览', sort: 1 }
          ]
      const h = createHarness(t, {
        mocks: {
          vuex: { useStore: () => ({ getters: {} }) },
          '@/components/select/userDialog.vue': {},
          '@/api/common': {
            getPublicCodesList: async () => ({
              success: true,
              data: [
                { comCode: 'XMZL_TAB_COM', codes: rows },
                { comCode: 'XMZL_STAGE_TAB_COM', codes: [{ code: '1', name: '阶段概览', note: '1' }] }
              ]
            })
          }
        }
      })
      const page = h.setup('index.vue', {})
      const props = Vue.reactive({
        get selectedStage() {
          return page.selectedStage.value
        },
        get activeStage() {
          return page.activeStage.value
        },
        filters: page.filters.value,
        dimension: 'unit',
        roleContext: page.roleContext.value
      })
      const panel = h.setup('components/OverviewChartPanel.vue', props, {
        expose() {},
        emit(event, tab) {
          if (event === 'default-tab-change') page.applyDefaultTab(tab)
          else if (event === 'select-overview-entry') page.selectOverviewEntry()
          else if (event === 'select-statistics') page.selectStatistics()
        }
      })
      await panel.loadPublicCodeConfig()
      assert.equal(page.selectedStage.value, '')
      assert.equal(panel.activeTab.value, 'statistics')
      assert.equal(panel.detailVisible.value, false)
      page.summary.value = { childJd: [{ jdbm: '01', jdmc: '需求储备库', amount: 100 }] }
      await flush()
      page.selectStage('01')
      assert.equal(panel.activeTab.value, 'overview')
      assert.equal(panel.tabs.value[0].label, '阶段概览')
      page.selectStage('01')
      assert.equal(panel.activeTab.value, 'statistics')
      panel.selectTab('overview')
      assert.equal(panel.activeTab.value, 'overview')
      page.selectOverview()
      assert.equal(panel.activeTab.value, 'statistics')
    })
  }
})

test('late default configuration preserves an explicit tab or stage selection', async (t) => {
  for (const selection of ['overview', 'statistics', 'stage']) {
    await t.test(selection, async (t) => {
      let resolveConfig
      const h = createHarness(t, {
        mocks: {
          vuex: { useStore: () => ({ getters: {} }) },
          '@/components/select/userDialog.vue': {},
          '@/api/common': {
            getPublicCodesList: () =>
              new Promise((resolve) => {
                resolveConfig = resolve
              })
          }
        }
      })
      const page = h.setup('index.vue', {})
      page.summary.value = { childJd: [{ jdbm: '01', jdmc: '需求储备库', amount: 100 }] }
      await flush()
      const props = Vue.reactive({
        get selectedStage() {
          return page.selectedStage.value
        },
        get activeStage() {
          return page.activeStage.value
        },
        filters: page.filters.value,
        dimension: 'unit',
        roleContext: page.roleContext.value
      })
      const panel = h.setup('components/OverviewChartPanel.vue', props, {
        expose() {},
        emit(event, tab) {
          if (event === 'default-tab-change') page.applyDefaultTab(tab)
          else if (event === 'select-overview-entry') page.selectOverviewEntry()
          else if (event === 'select-statistics') page.selectStatistics()
        }
      })
      const pending = panel.loadPublicCodeConfig()
      if (selection === 'stage') page.selectStage('01')
      else panel.selectTab(selection)
      const selected = page.selectedStage.value
      resolveConfig({
        success: true,
        data: [
          {
            comCode: 'XMZL_TAB_COM',
            codes: [
              { code: '1', name: '概览', note: selection === 'statistics' ? '1' : '' },
              { code: '2', name: '统计分析', note: selection !== 'statistics' ? '1' : '' }
            ]
          }
        ]
      })
      await pending
      assert.equal(page.selectedStage.value, selected)
      if (selection === 'stage') {
        page.selectOverview()
        assert.equal(panel.activeTab.value, 'statistics')
      }
    })
  }
})

test('tabs without a valid order follow configured entries and duplicate codes keep their first valid value', (t) => {
  const { parseOverviewTabs } = createHarness(t).load('data/overview.ts')
  for (const sort of [undefined, null, '', ' ', 'invalid', false, Infinity]) {
    assert.deepEqual(
      parseOverviewTabs([
        { code: '1', name: '概览', sort },
        { code: '2', name: '统计分析', sort: 0 },
        { code: '1', name: '重复名称', sort: -1 }
      ]),
      [
        { id: 'statistics', label: '统计分析' },
        { id: 'overview', label: '概览' }
      ]
    )
  }
})

test('stage tab configuration accepts its own overview name and ignores statistics', (t) => {
  const { parseStageTabs } = createHarness(t).load('data/overview.ts')
  assert.deepEqual(
    parseStageTabs([
      { code: '2', name: '统计分析' },
      { code: '1', name: ' 阶段分析 ' },
      { code: '1', name: '重复项' }
    ]),
    [{ id: 'overview', label: '阶段分析' }]
  )
  for (const data of [undefined, [], {}, [{ code: '2', name: '统计分析' }], [{ code: '1', name: ' ' }]]) {
    assert.deepEqual(parseStageTabs(data), [])
  }
})

test('missing or invalid main and stage tab configuration falls back independently', async (t) => {
  let data = []
  const h = createHarness(t, {
    mocks: { '@/api/common': { getPublicCodesList: async () => ({ success: true, data }) } }
  })
  const { OVERVIEW_ENTRY_ID } = h.load('data/overview.ts')
  const props = Vue.reactive({
    selectedStage: OVERVIEW_ENTRY_ID,
    filters: { year: '', month: '', statMode: 'amount', amountUnit: '万元' },
    dimension: 'unit',
    roleContext: { dwId: '' }
  })
  const panel = h.setup('components/OverviewChartPanel.vue', props)
  const main = {
    comCode: 'XMZL_TAB_COM',
    codes: [
      { code: '1', name: '总页面概况' },
      { code: '2', name: '单位统计' }
    ]
  }
  const stage = { comCode: 'XMZL_STAGE_TAB_COM', codes: [{ code: '1', name: '阶段概况' }] }
  for (const [config, expectedMain, expectedStage] of [
    [[main], ['总页面概况', '单位统计'], '构成分析'],
    [[stage], ['总体分析', '构成分析'], '阶段概况'],
    [[main, { ...stage, codes: [{ code: '2', name: '不支持的页签' }] }], ['总页面概况', '单位统计'], '构成分析'],
    [[{ ...main, codes: [{ code: '1', name: '不完整配置' }] }, stage], ['总体分析', '构成分析'], '阶段概况']
  ]) {
    data = config
    await panel.loadPublicCodeConfig()
    props.activeStage = undefined
    props.selectedStage = OVERVIEW_ENTRY_ID
    assert.deepEqual(
      panel.tabs.value.map((tab) => tab.label),
      expectedMain
    )
    props.activeStage = { id: '01', title: '需求储备库' }
    props.selectedStage = '01'
    assert.deepEqual(
      panel.tabs.value.map((tab) => tab.label),
      [expectedStage]
    )
  }
})

test('overview entry id is reserved and never collides with interface stage codes', (t) => {
  const { OVERVIEW_ENTRY_ID } = createHarness(t).load('data/overview.ts')
  assert.equal(OVERVIEW_ENTRY_ID, '__overview__')
})

test('stage detail in overview mode calls every getGl interface without jdbm', async (t) => {
  const calls = []
  const record = (name, data) => async (params) => {
    calls.push([name, params])
    return { success: true, data }
  }
  const h = createHarness(t, {
    mocks: {
      '@/api/overview': {
        getGlDataByDw: record('getGlDataByDw', emptyGl),
        getGlXmlxDataByDw: record('getGlXmlxDataByDw', []),
        getGlDwpmByDw: record('getGlDwpmByDw', []),
        getGlXmlxpmByDw: record('getGlXmlxpmByDw', [])
      }
    }
  })
  h.setup(
    'components/StageDetail.vue',
    Vue.reactive({
      stageId: '',
      title: '全部阶段',
      year: '2026',
      month: '',
      yjdws: [],
      zybms: [],
      statMode: 'amount',
      amountUnit: '万元',
      viewMode: 'chart',
      orgType: 'province',
      dimension: 'unit',
      roleContext: { ...roleContext }
    })
  )
  await flush()
  assert.equal(calls.length, 4)
  for (const [name, params] of calls) {
    // 概览只去掉阶段编码，其余角色 / 年度 / 组织类型参数与阶段详情完全一致。
    assert.equal('jdbm' in params, false, `${name} 不应携带 jdbm`)
    assert.equal(params.jhssnd, '2026')
    assert.equal(params.dwId, 'unit')
    assert.equal(params.searchType, '')
  }
})

test('overview wide table omits jdbm on page, summary and export requests', async (t) => {
  const calls = []
  const h = createHarness(t, {
    mocks: {
      '@/utils/export': {
        apiExportHandle: async (params) => {
          calls.push(['export', params])
        }
      },
      '@/api/overview': {
        getGlkbByDw: async (params) => {
          calls.push(['page', params])
          return { success: true, data: { records: [], total: 0 } }
        },
        getGlDataByDw: async (params) => {
          calls.push(['summary', params])
          return { success: true, data: emptyGl }
        }
      }
    }
  })
  const table = h.setup(
    'components/StageWideTable.vue',
    Vue.reactive({
      stageId: '',
      title: '全部阶段',
      year: '2026',
      month: '',
      yjdws: [],
      zybms: [],
      statMode: 'amount',
      amountUnit: '万元',
      orgType: 'province',
      dimension: 'unit',
      roleContext: { ...roleContext }
    })
  )
  await flush()
  assert.deepEqual(
    calls.map(([name]) => name),
    ['summary', 'page']
  )
  for (const [, params] of calls) assert.equal('jdbm' in params, false)
  await table.exportTable('全部阶段明细表')
  const exported = calls.at(-1)
  assert.equal(exported[0], 'export')
  assert.equal('jdbm' in exported[1], false)
})

test('overview entry opens the shared detail area with the stage id cleared', async (t) => {
  const h = createHarness(t, {
    mocks: {
      '@/api/common': { getPublicCodesList: async () => ({ success: true, data: [] }) },
      '@/api/overview': {
        getOrgFlag: async () => ({ success: true, data: { orgFlag: 'PROVINCE', dwsxId: '' } }),
        getDataByDw: async () => ({ success: true, data: [] })
      }
    }
  })
  const { OVERVIEW_ENTRY_ID } = h.load('data/overview.ts')
  const props = Vue.reactive({
    roleContext: { ...roleContext },
    filters: { year: '2026', month: '', statMode: 'amount', amountUnit: '万元' },
    dimension: 'unit',
    selectedStage: '',
    defaultSortValue: ''
  })
  const panel = h.setup('components/OverviewChartPanel.vue', props)
  await h.mount()
  assert.equal(panel.detailVisible.value, false)
  props.selectedStage = OVERVIEW_ENTRY_ID
  await flush()
  // 概览与阶段详情共用同一块区域：stage-id 为空（不传 jdbm），标题为「全部阶段」。
  assert.equal(panel.detailVisible.value, true)
  assert.equal(panel.detailStageId.value, '')
  assert.equal(panel.detailTitle.value, '全部阶段')
  assert.equal(panel.isChartView.value, false)
  // 点其它阶段卡片即退出概览，回到该阶段详情。
  props.activeStage = { id: '01', title: '需求储备库', color: '#0e9f6e', icon: '' }
  props.selectedStage = '01'
  await flush()
  assert.equal(panel.detailStageId.value, '01')
  assert.equal(panel.detailTitle.value, '需求储备库')
})

test('main page starts with overall analysis and stage cards return to that default view', async (t) => {
  const h = createHarness(t, {
    mocks: {
      vuex: { useStore: () => ({ getters: {} }) },
      '@/components/select/userDialog.vue': {}
    }
  })
  const page = h.setup('index.vue', {})
  const { OVERVIEW_ENTRY_ID } = h.load('data/overview.ts')
  const props = Vue.reactive({
    get selectedStage() {
      return page.selectedStage.value
    },
    get activeStage() {
      return page.activeStage.value
    },
    filters: page.filters.value,
    dimension: 'unit',
    roleContext: page.roleContext.value,
    stageDetailsEnabled: true
  })
  const panel = h.setup('components/OverviewChartPanel.vue', props, {
    expose() {},
    emit(event) {
      if (event === 'select-overview-entry') page.selectOverviewEntry()
      if (event === 'select-statistics') page.selectStatistics()
    }
  })
  assert.equal(page.selectedStage.value, '')
  assert.equal(panel.activeTab.value, 'statistics')
  assert.deepEqual(
    panel.tabs.value.map((tab) => tab.label),
    ['总体分析', '构成分析']
  )
  assert.equal(panel.detailStageId.value, '')
  panel.selectTab('statistics')
  assert.equal(panel.detailVisible.value, false, 'reselecting the default must keep overall analysis')
  panel.selectTab('overview')
  assert.equal(page.selectedStage.value, OVERVIEW_ENTRY_ID)
  panel.selectTab('overview')
  assert.equal(panel.detailVisible.value, true, 'reselecting overview must not return to statistics')

  panel.selectTab('statistics')
  assert.equal(panel.detailVisible.value, false)
  assert.equal(panel.isChartView.value, true)
  panel.sortOrder.value = 'asc'
  panel.viewMode.value = 'table'
  const downloads = []
  panel.overviewChartRef.value = { downloadTable: () => downloads.push('statistics') }
  panel.stageDetailRef.value = { downloadTable: () => downloads.push('overview') }
  await panel.downloadCurrentView()
  panel.selectTab('overview')
  await panel.downloadCurrentView()
  assert.deepEqual(downloads, ['statistics', 'overview'], 'downloads follow the selected tab')
  panel.selectTab('statistics')
  assert.equal(panel.sortOrder.value, 'asc')
  assert.equal(panel.viewMode.value, 'table')

  page.summary.value = { childJd: [{ jdbm: '01', jdmc: '需求储备库', amount: 100 }] }
  await flush()
  assert.equal(panel.activeTab.value, 'statistics', 'refresh keeps the selected main page tab')
  page.selectStage('01')
  assert.equal(panel.detailStageId.value, '01')
  assert.equal(panel.detailTitle.value, '需求储备库')
  assert.deepEqual(
    panel.tabs.value.map((tab) => tab.id),
    ['overview']
  )
  page.selectStage('01')
  assert.equal(panel.detailStageId.value, '')
  assert.equal(panel.detailVisible.value, false)
  assert.equal(page.selectedStage.value, '')
  page.selectStage('01')
  page.selectOverview()
  assert.equal(page.selectedStage.value, '')
  assert.equal(panel.tabs.value.length, 2)
})

test('tab keyboard navigation switches the panel and moves focus with arrow, Home and End keys', (t) => {
  const focused = []
  const h = createHarness(t, {
    globals: { document: { getElementById: (id) => ({ focus: () => focused.push(id) }) } }
  })
  const { OVERVIEW_ENTRY_ID } = h.load('data/overview.ts')
  const props = Vue.reactive({
    selectedStage: OVERVIEW_ENTRY_ID,
    filters: { year: '', month: '', statMode: 'amount', amountUnit: '万元' },
    dimension: 'unit',
    roleContext: { dwId: '' }
  })
  const panel = h.setup('components/OverviewChartPanel.vue', props, {
    expose() {},
    emit(event) {
      if (event === 'select-overview-entry') props.selectedStage = OVERVIEW_ENTRY_ID
      else if (event === 'select-statistics') props.selectedStage = ''
    }
  })
  for (const [key, index, selected] of [
    ['ArrowRight', 0, 'overview'],
    ['ArrowRight', 1, 'statistics'],
    ['End', 0, 'overview'],
    ['Home', 1, 'statistics'],
    ['ArrowLeft', 0, 'overview']
  ]) {
    let prevented = false
    panel.navigateTab(
      {
        key,
        preventDefault: () => {
          prevented = true
        }
      },
      index
    )
    assert.equal(prevented, true)
    assert.equal(panel.activeTab.value, selected)
    assert.equal(focused.at(-1), `overview-tab-${selected}`)
  }
})
