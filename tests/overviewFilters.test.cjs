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

const { DEFAULT_DIMENSION_OPTIONS, parseDimensionOptions, pickPublicCodeItems, shouldCollapseUpdateTime } = loadTypeScript(
  'src/views/service/overview/data/overview.ts'
)
// 请求参数映射在 data/query.ts：与统计口径、组织类型、阶段编码一起构成 /xmzl 的唯一参数来源。
const { toOrgFilterParams } = loadTypeScript('src/views/service/overview/data/query.ts')

test('the update time stays on the first row while the pills still fit next to it', () => {
  // 三个常规条件下仍有余量：pills 400 + gap 14 + actions 352 明显小于 1000。
  assert.equal(shouldCollapseUpdateTime(400, 352, 1000), false)
  // 刚好卡在余量边界（1000 - 8 = 992）也放得下，不收起。
  assert.equal(shouldCollapseUpdateTime(626, 352, 1000), false)
})

test('a longer pill value collapses the update time instead of wrapping it to a second row', () => {
  // 选了项目单位 / 省专业归口后胶囊变宽，一行放不下：先收起更新时间，避免操作区整体换行。
  assert.equal(shouldCollapseUpdateTime(670, 352, 1000), true)
  assert.equal(shouldCollapseUpdateTime(760, 352, 1000), true)
})

test('the safety margin keeps a borderline row stable instead of flipping on sub-pixel widths', () => {
  // 1000 - 8 = 992 是可用的判断线：626 + 14 + 352 = 992 放得下，再多半像素就收起。
  assert.equal(shouldCollapseUpdateTime(626, 352, 1000), false)
  assert.equal(shouldCollapseUpdateTime(626.5, 352, 1000), true)
})

test('an unmeasured toolbar never collapses and a single side still uses the gap correctly', () => {
  assert.equal(shouldCollapseUpdateTime(400, 352, 0), false)
  assert.equal(shouldCollapseUpdateTime(400, 352, -10), false)
  // 没有条件胶囊时不额外计入条件区与操作区之间的间距。
  assert.equal(shouldCollapseUpdateTime(0, 352, 360), false)
  assert.equal(shouldCollapseUpdateTime(0, 352, 355), true)
})

test('org filter params always send both code lists and never leak the filter arrays', () => {
  const yjdws = ['DW002']
  const zybms = ['gkbm-001', 'gkbm-002']
  const params = toOrgFilterParams({ yjdws, zybms })
  assert.deepEqual(params, { chooseYjdws: ['DW002'], chooseZybms: ['gkbm-001', 'gkbm-002'] })
  // 复制数组：调用方随后修改筛选状态不应影响已在途请求体。
  yjdws.push('DW003')
  assert.deepEqual(params.chooseYjdws, ['DW002'])
  // 未选时按接口约定传空数组，而不是 undefined。
  assert.deepEqual(toOrgFilterParams({ yjdws: [], zybms: [] }), { chooseYjdws: [], chooseZybms: [] })
  // 只传了部分字段（如独立复用的子组件）时其余按「全部」处理。
  assert.deepEqual(toOrgFilterParams({}), { chooseYjdws: [], chooseZybms: [] })
})

test('dimension switch reads both labels and their order from the public code', () => {
  // code 为统计口径码值（与 searchBy 一致），name 为按钮文案；顺序按接口返回，不固定「按单位」在前。
  assert.deepEqual(
    parseDimensionOptions([
      { code: '2', name: '按专业' },
      { code: '1', name: '按单位' }
    ]),
    [
      { value: 'specialty', label: '按专业' },
      { value: 'unit', label: '按单位' }
    ]
  )
  assert.deepEqual(
    parseDimensionOptions([
      { code: '1', name: '按单位' },
      { code: '2', name: '按专业' }
    ]),
    [
      { value: 'unit', label: '按单位' },
      { value: 'specialty', label: '按专业' }
    ]
  )
  // 兼容可读码值，避免后端只能填数字。
  assert.deepEqual(
    parseDimensionOptions([
      { code: 'unit', name: '按单位' },
      { code: 'specialty', name: '按专业' }
    ]).map((option) => option.value),
    ['unit', 'specialty']
  )
})

test('a half-configured dimension public code falls back to the built-in pair instead of hiding a mode', () => {
  // 只配了一个维度时不能生效：否则另一个维度从界面上消失，用户再也切不回去。
  assert.deepEqual(parseDimensionOptions([{ code: '1', name: '按单位' }]), [])
  // 码值未知、名称缺失、重复码值的配置项忽略；剩下的一维仍不满足「两个都要」，整体回落。
  assert.deepEqual(
    parseDimensionOptions([
      { code: '9', name: '按单位' },
      { code: '1', name: '   ' }
    ]),
    []
  )
  assert.deepEqual(
    parseDimensionOptions([
      { code: '1', name: '按单位' },
      { code: '1', name: '单位' }
    ]),
    []
  )
  assert.deepEqual(parseDimensionOptions([]), [])
  assert.deepEqual(parseDimensionOptions(null), [])
  assert.deepEqual(parseDimensionOptions(undefined), [])
  // 接口返回非数组（如异常对象）时同样回落。
  assert.deepEqual(parseDimensionOptions({ codes: [{ code: '1', name: '按单位' }] }), [])
})

test('the page picks the dimension config out of the batch public code response before parsing it', () => {
  // 与 index.vue 的真实链路一致：批量响应按 comCode 取值，再交给 parseDimensionOptions。
  const response = [
    {
      comCode: 'XMZL_DIMENSION_COM',
      codes: [
        { code: '2', name: '按专业' },
        { code: '1', name: '按单位' }
      ]
    },
    { comCode: 'XMZL_RATIO_COM', codes: [{ code: '01', name: '需求储备库' }] }
  ]
  assert.deepEqual(parseDimensionOptions(pickPublicCodeItems(response, 'XMZL_DIMENSION_COM')), [
    { value: 'specialty', label: '按专业' },
    { value: 'unit', label: '按单位' }
  ])
  // 后端未返回该 code 时 pickPublicCodeItems 给空数组，页面因此回落到内置两项。
  assert.deepEqual(parseDimensionOptions(pickPublicCodeItems(response, 'XMZL_DIMENSION_COM_MISSING')), [])
})

test('a note on the dimension public code becomes the button tooltip text', () => {
  const options = parseDimensionOptions([
    { code: '1', name: '按单位', note: '按一级单位汇总需求储备与立项数据' },
    { code: '2', name: '按专业', note: '  按省专业归口汇总数据  ' }
  ])
  // note 去掉首尾空白后原样保留，交给按钮的悬浮提示展示。
  assert.deepEqual(options, [
    { value: 'unit', label: '按单位', note: '按一级单位汇总需求储备与立项数据' },
    { value: 'specialty', label: '按专业', note: '按省专业归口汇总数据' }
  ])
})

test('a missing, blank or non-string note leaves the button without a tooltip', () => {
  const options = parseDimensionOptions([
    { code: '1', name: '按单位' },
    { code: '2', name: '按专业', note: '   ' }
  ])
  // 空 note 不写该字段（而不是写成空字符串），按钮因此不挂悬浮提示。
  assert.deepEqual(options, [
    { value: 'unit', label: '按单位' },
    { value: 'specialty', label: '按专业' }
  ])
  // note 为 null / 数字 / 对象时按「没有提示」处理，不影响按钮本身。
  const nonString = parseDimensionOptions([
    { code: '1', name: '按单位', note: null },
    { code: '2', name: '按专业', note: { text: 'x' } }
  ])
  assert.deepEqual(nonString, [
    { value: 'unit', label: '按单位' },
    { value: 'specialty', label: '按专业' }
  ])
  // 只有带 note 的那个按钮有提示，另一个不受影响。
  const mixed = parseDimensionOptions([
    { code: '1', name: '按单位', note: '只看一级单位' },
    { code: '2', name: '按专业' }
  ])
  assert.equal(mixed[0].note, '只看一级单位')
  assert.equal(mixed[1].note, undefined)
})

test('the built-in dimension options carry no note so no tooltip appears without configuration', () => {
  assert.deepEqual(DEFAULT_DIMENSION_OPTIONS, [
    { value: 'unit', label: '按单位' },
    { value: 'specialty', label: '按专业' }
  ])
})
