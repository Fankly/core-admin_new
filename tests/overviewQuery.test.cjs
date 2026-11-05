const assert = require('node:assert/strict')
const { test } = require('node:test')
const { createHarness, Vue } = require('./helpers/overviewHarness.cjs')

const roleContext = { userId: 'user', dwId: 'unit', bmId: 'dept', roleId: 'role', roleCode: 'SCWYSZZ' }

test('base params assemble role context, month split, org filters and searchBy in one place', (t) => {
  const query = createHarness(t).load('data/query.ts')
  const yjdws = ['DW001']
  const params = query.buildOverviewBaseParams({ roleContext, dimension: 'unit', year: '2026', month: '2026-03', yjdws, zybms: [] })
  assert.deepEqual(params, {
    ...roleContext,
    chooseYjdws: ['DW001'],
    chooseZybms: [],
    jhssnd: '2026',
    nd: '2026',
    yd: 3,
    searchBy: 1
  })
  // 复制筛选数组：调用方随后修改筛选状态不应影响已在途请求的请求体。
  yjdws.push('DW002')
  assert.deepEqual(params.chooseYjdws, ['DW001'])
  // 按专业切换统计口径，其余字段与按单位一致。
  assert.equal(query.buildOverviewBaseParams({ roleContext, dimension: 'specialty', year: '2026', month: '' }).searchBy, 2)
  // 未传两个多选条件时按「全部」处理，不抛错也不省略字段。
  assert.deepEqual(query.buildOverviewBaseParams({ roleContext, dimension: 'unit', year: '2026', month: '' }).chooseYjdws, [])
})

test('month parsing accepts padded and single-digit months and falls back to all months without throwing', (t) => {
  const { toMonthParams } = createHarness(t).load('data/query.ts')
  assert.deepEqual(toMonthParams('2026-03'), { nd: '2026', yd: 3 })
  assert.deepEqual(toMonthParams('2026-3'), { nd: '2026', yd: 3 })
  assert.deepEqual(toMonthParams('2026-12'), { nd: '2026', yd: 12 })
  // 清空、格式非法、越界月份都按「全部月份」处理：这些值会出现在 computed / 渲染路径上，不能抛错。
  for (const month of ['', null, undefined, '2026', '2026-13', '2026-00', '2026-03-01', '202603']) {
    assert.deepEqual(toMonthParams(month), { nd: '', yd: '' })
  }
})

test('org searchType is limited to the unit dimension and stage code is optional', (t) => {
  const { withOrgSearchType, withStage, buildOverviewBaseParams } = createHarness(t).load('data/query.ts')
  const base = buildOverviewBaseParams({ roleContext, dimension: 'unit', year: '2026', month: '' })
  assert.equal(withOrgSearchType(base, { dimension: 'unit', orgType: 'province' }).searchType, '')
  assert.equal(withOrgSearchType(base, { dimension: 'unit', orgType: 'city' }).searchType, 1)
  assert.equal(withOrgSearchType(base, { dimension: 'unit', orgType: 'direct' }).searchType, 2)
  // 按专业沿用 getDataByZybm 的口径，不携带 searchType。
  assert.equal(withOrgSearchType(base, { dimension: 'specialty', orgType: 'city' }).searchType, undefined)
  // 未传 orgType 时原样返回，便于不关心组织类型的接口复用同一个参数对象。
  assert.equal(withOrgSearchType(base, { dimension: 'unit' }).searchType, undefined)
  // 阶段编码只在阶段详情 / 宽表这类按阶段统计的接口上追加，合计与一级统计不传。
  assert.equal(withStage(base, '01').jdbm, '01')
  assert.equal(withStage(base, '').jdbm, undefined)
})

test('query guards require a year, optionally a stage, and a unit only for the unit dimension', (t) => {
  const { canQueryOverview } = createHarness(t).load('data/query.ts')
  const input = (overrides) => ({ roleContext, dimension: 'unit', year: '2026', month: '', ...overrides })
  assert.equal(canQueryOverview(input({})), true)
  assert.equal(canQueryOverview(input({ year: '' })), false)
  // 按单位必须有角色单位，按专业不依赖 dwId。
  assert.equal(canQueryOverview(input({ roleContext: { ...roleContext, dwId: '' } })), false)
  assert.equal(canQueryOverview(input({ dimension: 'specialty', roleContext: { ...roleContext, dwId: '' } })), true)
  // 阶段类查询额外要求阶段编码。
  assert.equal(canQueryOverview(input({ stageId: '' }), { requireStage: true }), false)
  assert.equal(canQueryOverview(input({ stageId: '01' }), { requireStage: true }), true)
})

test('page items keep the first and last page and clamp an out-of-range page', (t) => {
  const { buildPageItems } = createHarness(t).load('data/pagination.ts')
  assert.deepEqual(buildPageItems(1, 1), [1])
  assert.deepEqual(buildPageItems(3, 5), [1, 2, 3, 4, 5])
  assert.deepEqual(buildPageItems(1, 20), [1, 2, '...', 20])
  assert.deepEqual(buildPageItems(10, 20), [1, '...', 9, 10, 11, '...', 20])
  assert.deepEqual(buildPageItems(20, 20), [1, '...', 19, 20])
  // 越界页码先夹到有效区间，避免请求失败后画出空条。
  assert.deepEqual(buildPageItems(0, 2), [1, 2])
  assert.deepEqual(buildPageItems(99, 20), [1, '...', 19, 20])
})

test('paged results accept both the page object and the bare array payloads', (t) => {
  const { normalizePagedResult } = createHarness(t).load('data/pagination.ts')
  assert.deepEqual(normalizePagedResult([{ id: 'a' }]), { rows: [{ id: 'a' }], total: null })
  assert.deepEqual(normalizePagedResult({ records: [{ id: 'b' }], total: '42' }), { rows: [{ id: 'b' }], total: 42 })
  // 兼容 totalCount / count / list / rows 等常见命名。
  assert.deepEqual(normalizePagedResult({ list: [], totalCount: 0 }), { rows: [], total: 0 })
  assert.deepEqual(normalizePagedResult({ rows: [], count: 3 }), { rows: [], total: 3 })
  // 没有总条数时不补造 0，交给调用方退回「只有当前页」。
  assert.deepEqual(normalizePagedResult({ records: [] }), { rows: [], total: null })
  assert.deepEqual(normalizePagedResult(null), { rows: [], total: null })
})

test('async task keeps only the latest response, reports a retryable error and resets', async (t) => {
  const { useAsyncTask } = createHarness(t).load('composables/useAsyncTask.ts')
  const scope = Vue.effectScope()
  t.after(() => scope.stop())
  const task = scope.run(() => useAsyncTask(() => []))

  let resolveFirst
  const first = task.run(() => new Promise((resolve) => (resolveFirst = resolve)), '加载失败，请重试')
  const second = task.run(async () => ['new'], '加载失败，请重试')
  // 先发出的请求后返回：结果被丢弃，不覆盖新数据。
  resolveFirst(['old'])
  await Promise.all([first, second])
  assert.deepEqual(task.data.value, ['new'])
  assert.equal(task.loading.value, false)
  assert.equal(task.error.value, '')

  // 没有错误消息时使用调用方给的兜底文案。
  await task.run(async () => {
    throw new Error('')
  }, '加载失败，请重试')
  assert.equal(task.error.value, '加载失败，请重试')
  assert.equal(task.loading.value, false)

  // reset 回到初始值，并让在途请求的结果失效。
  let resolvePending
  const pending = task.run(() => new Promise((resolve) => (resolvePending = resolve)), '加载失败，请重试')
  task.reset()
  resolvePending(['late'])
  await pending
  assert.deepEqual(task.data.value, [])
  assert.equal(task.loading.value, false)
  assert.equal(task.error.value, '')
})
