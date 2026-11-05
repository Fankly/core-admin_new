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
  if (filename.endsWith('.vue')) source = compileScript(parse(source, { filename }).descriptor, { id: 'menu-editor-test' }).content
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  })
  loaded._compile(outputText, filename)
  return loaded.exports
}

const flush = async () => {
  await Vue.nextTick()
  await Vue.nextTick()
}

const row = {
  id: 12,
  name: '预算统计',
  shortName: '',
  parentName: '业务管理',
  pid: '3',
  url: 'statistics/budget',
  sort: 2,
  openStyle: 0,
  isShow: 0,
  isMainPage: 0,
  isFrame: 1,
  frameSrc: '',
  outsideMenu: '',
  type: 0,
  children: []
}

/** 菜单编辑弹窗：请求全部挂起，由用例逐条应答，便于断言 loading 的时序 */
const setupEditor = (t) => {
  const pending = []
  const get = (url) => new Promise((resolve) => pending.push({ url, resolve }))
  const errors = []
  const editor = load('src/views/sys/menu-add-or-update.vue', {
    vue: Vue,
    'element-plus': { ElMessage: { error: (message) => errors.push(message), success: () => {} } },
    vuex: { useStore: () => ({ getters: { getUserMsg: { id: 'user-1' } } }) },
    '@/service/baseService': { get, post: async () => ({ code: 0 }) }
  }).default
  const scope = Vue.effectScope()
  const page = scope.run(() => editor.setup({}, { expose() {}, emit() {} }))
  t.after(() => scope.stop())

  const take = (url, from = 'first') => {
    const matches = pending.map((request, index) => (request.url === url ? index : -1)).filter((index) => index >= 0)
    assert.ok(matches.length > 0, `missing request ${url}`)
    const [index] = from === 'last' ? matches.slice(-1) : matches
    return pending.splice(index, 1)[0]
  }
  const respond = (url, data, from) => take(url, from).resolve({ code: 0, data })

  return { page, pending, errors, respond, urls: { parent: '/sys/menu/list?type=0', config: '/sys/getUserMenuTree?userId=user-1', detail: (id) => `/sys/menu/${id}` } }
}

test('opening the editor turns on the loading mask before any request resolves', async (t) => {
  const { page, pending, respond, urls } = setupEditor(t)
  const opened = page.open({ mode: 'edit', row })

  // 同步断言：弹窗与遮罩在同一帧生效，不存在“先停顿、再 loading”的窗口
  assert.equal(page.visible.value, true)
  assert.equal(page.loading.value, true)
  // 编辑表单首帧就用行数据回填，不会先闪一屏空表单
  assert.equal(page.dataForm.value.name, '预算统计')
  assert.equal(page.dataForm.value.url, 'statistics/budget')

  await flush()
  assert.deepEqual(
    pending.map(({ url }) => url),
    [urls.parent, urls.config, urls.detail(12)]
  )
  respond(urls.parent, [{ id: '3', name: '业务管理', children: [] }])
  respond(urls.config, [])
  await flush()
  // 详情还没回来，遮罩必须一直保持
  assert.equal(page.loading.value, true)

  respond(urls.detail(12), { ...row, name: '预算统计-详情', frameSrc: 'https://example.com/report' })
  await opened
  assert.equal(page.loading.value, false)
  assert.equal(page.dataForm.value.name, '预算统计-详情')
  assert.equal(page.dataForm.value.frameSrc, 'https://example.com/report')
  assert.equal(page.dataForm.value.pid, '3')
})

test('create mode loads without waiting for a detail request and prefills the chosen parent', async (t) => {
  const { page, pending, respond, urls } = setupEditor(t)
  const opened = page.open({ mode: 'create', parent: { id: '8', name: '系统管理' } })
  assert.equal(page.loading.value, true)
  assert.equal(page.dataForm.value.pid, '8')
  assert.equal(page.dataForm.value.parentName, '系统管理')

  await flush()
  // 新增不请求详情
  assert.equal(
    pending.some(({ url }) => url.startsWith('/sys/menu/1')),
    false
  )
  respond(urls.parent, [])
  respond(urls.config, [])
  await opened
  assert.equal(page.loading.value, false)
  assert.equal(page.dataForm.value.pid, '8')
})

test('a stale detail response never overwrites the editor opened afterwards', async (t) => {
  const { page, respond, urls } = setupEditor(t)
  page.open({ mode: 'edit', row })
  await flush()
  const second = page.open({ mode: 'edit', row: { ...row, id: 99, name: '后打开的菜单' } })
  assert.equal(page.dataForm.value.name, '后打开的菜单')
  await flush()

  // 先发起的那次晚返回，应被丢弃
  respond(urls.detail(12), { ...row, name: '过期的菜单' })
  await flush()
  assert.equal(page.dataForm.value.name, '后打开的菜单')

  // 后打开的弹窗按自己的响应收尾
  respond(urls.detail(99), { ...row, id: 99, name: '后打开的菜单-详情' })
  respond(urls.parent, [], 'last')
  respond(urls.config, [], 'last')
  await second
  assert.equal(page.loading.value, false)
  assert.equal(page.dataForm.value.name, '后打开的菜单-详情')
  assert.equal(page.dataForm.value.id, '99')
})
