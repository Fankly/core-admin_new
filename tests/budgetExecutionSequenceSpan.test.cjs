const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const { test } = require('node:test')
const { buildSync } = require('esbuild')
const { reactive, ref } = require('vue')
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc')

const filename = path.resolve(__dirname, '../src/views/statistics/budgetExecutionAnalysis/sequenceSpan.ts')
const loaded = new Module(filename, module)
loaded.filename = filename
loaded.paths = Module._nodeModulePaths(path.dirname(filename))
loaded._compile(buildSync({ entryPoints: [filename], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['vue'] }).outputFiles[0].text, filename)
const { buildSequenceSpans, useSequenceSpan } = loaded.exports
const column = { field: 'subName' }
const rowspans = (rows, spans) => rows.map((row) => spans.get(row)?.rowspan)

test('only consecutive nonempty sequence values merge; numeric zero and text codes stay intact', () => {
  const rows = ['1', 1, '2', '1', '', '', null, undefined, '-', '-', ' ', '0', 0, '01', '1'].map((subName) => ({ subName }))
  assert.deepEqual(rowspans(rows, buildSequenceSpans(rows, () => false)), [2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 1, 1])
})

test('visible depth-first order prevents merging across an intervening expanded child', () => {
  const child = { subName: 'child' }
  const rows = [{ subName: '1', children: [child] }, { subName: '1' }]
  assert.deepEqual(rowspans(rows, buildSequenceSpans(rows, () => false)), [2, 0])
  assert.deepEqual(rowspans([rows[0], child, rows[1]], buildSequenceSpans(rows, () => true)), [1, 1, 1])
  child.subName = '1'
  assert.deepEqual(rowspans([rows[0], child, rows[1]], buildSequenceSpans(rows, () => true)), [3, 0, 0])
})

test('cached spans follow lazy loading, collapse, batch expansion, edits, and query replacement', () => {
  const rows = ref([{ id: 'a', subName: '1' }, { id: 'b', subName: '1' }])
  const expanded = reactive(new Set())
  const span = useSequenceSpan(() => rows.value, () => ({ isTreeExpandByRow: (row) => expanded.has(row.id) }))
  const read = (row) => span({ row, column }).rowspan
  assert.equal(read(rows.value[0]), 2)
  rows.value[0].children = [{ id: 'child', subName: '2' }]
  expanded.add('a')
  assert.deepEqual(rows.value.map(read), [1, 1])
  assert.equal(read(rows.value[0].children[0]), 1)
  expanded.clear()
  assert.deepEqual(rows.value.map(read), [2, 0])
  expanded.add('a')
  rows.value[0].children[0].subName = '1'
  assert.equal(read(rows.value[0]), 3)
  rows.value = [{ id: 'new', subName: '1' }]
  assert.equal(read(rows.value[0]), 1)
  rows.value = []
  assert.equal(span({ row: { subName: '1' }, column }), undefined)
})

test('50,000 rows are scanned once and repeated fixed-column renders do not reread sequences', () => {
  let reads = 0
  const rows = Array.from({ length: 50000 }, (_, index) => ({
    id: String(index),
    get subName() { reads += 1; return String(Math.floor(index / 5)) }
  }))
  const state = reactive({ rows, amount: 0 })
  const span = useSequenceSpan(() => state.rows, () => undefined)
  assert.equal(span({ row: state.rows[0], column: { field: 'amount' } }), undefined)
  assert.equal(reads, 0)
  assert.equal(span({ row: state.rows[0], column }).rowspan, 5)
  assert.equal(reads, rows.length)
  state.amount = 1
  for (let pass = 0; pass < 3; pass += 1) {
    for (const row of state.rows) assert.ok(span({ row, column }))
  }
  assert.equal(reads, rows.length)
})

test('deep visible trees do not overflow the call stack', () => {
  const root = { subName: '1' }
  let row = root
  for (let index = 1; index < 15000; index += 1) {
    row.children = [{ subName: '1' }]
    row = row.children[0]
  }
  const spans = buildSequenceSpans([root], () => true)
  assert.equal(spans.get(root).rowspan, 15000)
  assert.equal(spans.get(row).rowspan, 0)
})

test('all report components and the comparison modal compile and use the shared span method without disabling scrolling', () => {
  for (const relativePath of [
    'statistics/budgetExecutionAnalysis/customYapProjectExecutionByType.vue',
    'statistics/budgetExecutionAnalysis/yszxylb.vue',
    'report/proYapMbz.vue',
    'statistics/yszxylb.vue',
    'statistics/components/YszxylbTbhbModal/index.vue'
  ]) {
    const filename = path.resolve(__dirname, '../src/views', relativePath)
    const source = fs.readFileSync(filename, 'utf8')
    const { descriptor, errors } = parse(source, { filename })
    assert.deepEqual(errors, [])
    assert.ok(compileScript(descriptor, { id: relativePath }).content)
    assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename, id: relativePath }).errors, [])
    assert.match(source, /spanMethod: sequenceSpanMethod/)
    assert.match(source, /mergeSequenceCells: true/)
    assert.doesNotMatch(source, /scroll[XY]:\s*\{\s*enabled:\s*false/)
  }
})
