const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')
const { parse, compileScript } = require('@vue/compiler-sfc')
const Vue = require('vue')

const load = (relativePath, dependencies = {}) => {
  const filename = path.resolve(__dirname, '..', relativePath)
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  const originalRequire = loaded.require.bind(loaded)
  loaded.require = (name) => (Object.hasOwn(dependencies, name) ? dependencies[name] : originalRequire(name))
  let source = fs.readFileSync(filename, 'utf8')
  if (filename.endsWith('.vue')) source = compileScript(parse(source, { filename }).descriptor, { id: 'menu-test' }).content
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  })
  loaded._compile(outputText, filename)
  return loaded.exports
}

const helper = load('src/views/sys/menu-table.ts')
const { flattenVisibleMenuRows } = helper
const fixture = () => [
  { id: 'root', name: '业务', children: [{ id: 2, name: '预算', children: [{ id: 'leaf', name: '明细', url: 'Budget/Detail' }] }] },
  { id: 'other', name: '系统', children: [{ id: 'user', name: '用户', url: 'sys/user' }] }
]

test('collapsed branches never traverse or copy their descendants', () => {
  let reads = 0
  const root = {
    id: 'root',
    get children() {
      reads++
      throw new Error('collapsed descendants should not be read')
    }
  }
  const rows = flattenVisibleMenuRows([root], new Set())
  assert.equal(rows.length, 1)
  assert.equal(rows[0].menu, root)
  assert.equal(reads, 0)
})

test('expanded branches preserve tree order, indentation, mixed ID types and original menu objects', () => {
  const menus = fixture()
  const before = structuredClone(menus)
  const expanded = new Set(['root', '2'])
  const rows = flattenVisibleMenuRows(menus, expanded)
  assert.deepEqual(
    rows.map(({ id, level }) => [id, level]),
    [
      ['root', 0],
      ['2', 1],
      ['leaf', 2],
      ['other', 0]
    ]
  )
  assert.equal(rows[1].menu, menus[0].children[0])
  assert.equal(rows[2].menu, menus[0].children[0].children[0])
  assert.deepEqual(menus, before)
  assert.deepEqual([...expanded], ['root', '2'])
})

const flush = async () => {
  await Vue.nextTick()
  await Vue.nextTick()
}

const setupPage = async (t) => {
  const mounted = []
  const scope = Vue.effectScope()
  let response = fixture()
  const component = load('src/views/sys/menu.vue', {
    vue: { ...Vue, onMounted: (fn) => mounted.push(fn) },
    'element-plus': { ElMessage: { error: assert.fail } },
    '@/service/baseService': { get: async () => ({ code: 0, data: response }) },
    './menu-add-or-update.vue': {},
    './menu-table': helper
  }).default
  const page = scope.run(() => component.setup({}, { expose() {} }))
  t.after(() => scope.stop())
  mounted.forEach((fn) => fn())
  await flush()
  return {
    page,
    refresh: async (rows) => {
      response = rows
      await page.loadMenus()
      await flush()
    }
  }
}

test('branch toggles retain descendant expansion; expand/collapse all updates the visible list in one batch', async (t) => {
  const { page } = await setupPage(t)
  assert.equal(page.tableRows.value.length, 2)
  page.toggleMenu(page.menus.value[0])
  page.toggleMenu(page.menus.value[0].children[0])
  assert.equal(page.tableRows.value.length, 4)
  page.toggleMenu(page.menus.value[0])
  assert.equal(page.tableRows.value.length, 2)
  page.toggleMenu(page.menus.value[0])
  assert.equal(page.tableRows.value.length, 4)

  let updates = 0
  const stop = Vue.watch(page.tableRows, () => updates++, { flush: 'sync' })
  page.setAllExpanded(true)
  assert.equal(updates, 1)
  assert.equal(page.tableRows.value.length, 5)
  assert.equal(page.allExpanded.value, true)
  page.toggleExpandAll()
  assert.equal(updates, 2)
  assert.equal(page.tableRows.value.length, 2)
  assert.equal(page.expandedKeys.value.size, 0)
  stop()
})

test('search reveals matching descendants and their ancestors, handles no matches, and clears correctly', async (t) => {
  const { page } = await setupPage(t)
  page.keyword.value = '  BUDGET/DETAIL  '
  await flush()
  assert.deepEqual(
    page.tableRows.value.map(({ id }) => id),
    ['root', '2', 'leaf']
  )
  assert.equal(page.allExpanded.value, true)
  page.keyword.value = 'missing-menu'
  await flush()
  assert.deepEqual(page.tableRows.value, [])
  assert.equal(page.allExpanded.value, false)
  page.keyword.value = ''
  await flush()
  assert.deepEqual(
    page.tableRows.value.map(({ id }) => id),
    ['root', 'other']
  )
  assert.equal(page.menus.value.length, 2)
})

test('refresh retains surviving expansions and replaces row sources; filtered refresh reveals new matches', async (t) => {
  const { page, refresh } = await setupPage(t)
  page.setAllExpanded(true)
  const rows = [{ id: 'root', name: '业务', children: [{ id: 'new', name: '新增明细', url: 'budget/new' }] }]
  await refresh(rows)
  assert.deepEqual([...page.expandedKeys.value], ['root'])
  assert.equal(page.tableRows.value[1].menu, rows[0].children[0])
  page.keyword.value = 'budget/new'
  await flush()
  await refresh([{ id: 'new-root', name: '新分组', children: rows[0].children }])
  assert.deepEqual(
    page.tableRows.value.map(({ id }) => id),
    ['new-root', 'new']
  )
  assert.equal(page.allExpanded.value, true)
})
