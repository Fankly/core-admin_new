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

const { getDayStartTime, isBeforeDeadlineDay } = loadTypeScript('src/views/service/jointReview/utils/reviewDeadline.ts')

// 固定「今天」= 2026-11-03（本地时区），避免用例依赖真实时钟
const NOW = new Date(2026, 10, 3, 10, 12, 28)

test('截止日当天任意时刻都可保存', () => {
  assert.equal(isBeforeDeadlineDay('2026-11-03', NOW), true)
  assert.equal(isBeforeDeadlineDay('2026-11-03 00:00:00', NOW), true)
  assert.equal(isBeforeDeadlineDay('2026-11-03 23:59:59', NOW), true)
  assert.equal(isBeforeDeadlineDay('2026-11-03T00:00:00+08:00', NOW), true)
  // 当天 23:59 这一天本身也满足「截止日当天可保存」
  assert.equal(isBeforeDeadlineDay('2026-11-03', new Date(2026, 10, 3, 23, 59, 59)), true)
})

test('截止日之前可保存，之后不可保存', () => {
  assert.equal(isBeforeDeadlineDay('2026-11-04', NOW), true)
  assert.equal(isBeforeDeadlineDay('2026-12-31', NOW), true)
  assert.equal(isBeforeDeadlineDay('2026-11-02', NOW), false)
  assert.equal(isBeforeDeadlineDay('2026-10-31 23:59:59', NOW), false)
})

test('不再校验开始时间：开始日之前也可保存', () => {
  // 本次需求：取消区间校验，只看截止日；即使「今天」早于开始日，只要未过截止日即可保存
  const beforeStart = new Date(2026, 10, 1, 8, 0, 0)
  assert.equal(isBeforeDeadlineDay('2026-11-10', beforeStart), true)
})

test('日期格式兼容：斜杠、单位数月日、带时分秒、ISO', () => {
  assert.equal(isBeforeDeadlineDay('2026/11/03', NOW), true)
  assert.equal(isBeforeDeadlineDay('2026/11/2', NOW), false)
  assert.equal(isBeforeDeadlineDay('2026-11-3 18:30:00', NOW), true)
  assert.equal(isBeforeDeadlineDay('2026-11-03T18:30:00.000Z', NOW), true)
})

test('截止日缺失或无法解析时不可保存', () => {
  assert.equal(isBeforeDeadlineDay(null, NOW), false)
  assert.equal(isBeforeDeadlineDay(undefined, NOW), false)
  assert.equal(isBeforeDeadlineDay('', NOW), false)
  assert.equal(isBeforeDeadlineDay('   ', NOW), false)
  assert.equal(isBeforeDeadlineDay('abc', NOW), false)
  assert.equal(isBeforeDeadlineDay('2026-02-30', NOW), false)
})

test('getDayStartTime 归一化到本地 0 点，非法值返回 0 哨兵', () => {
  assert.equal(getDayStartTime('2026-11-03 18:30:00'), new Date(2026, 10, 3).getTime())
  assert.equal(getDayStartTime(new Date(2026, 10, 3, 18, 30)), new Date(2026, 10, 3).getTime())
  assert.equal(getDayStartTime(''), 0)
  assert.equal(getDayStartTime(null), 0)
  assert.equal(getDayStartTime('abc'), 0)
})
