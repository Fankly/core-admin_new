const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

const loadTypeScript = (relativePath, dependencies = {}) => {
  const filename = path.resolve(__dirname, '..', relativePath)
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  const originalRequire = loaded.require.bind(loaded)
  loaded.require = (name) => (Object.hasOwn(dependencies, name) ? dependencies[name] : originalRequire(name))
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
  })
  loaded._compile(outputText, filename)
  return loaded.exports
}

const menu = loadTypeScript('src/utils/menu.ts')
// 导航筛选使用真实函数；未调用的页面组件、路由注册和外链依赖无需在 Node 中初始化。
const { toValidRoutes } = loadTypeScript('src/utils/router.ts', {
  './menu': menu,
  '@/constants/app': {},
  '@/layout/view/base-view.vue': {},
  '@/router': {},
  '@/views/iframe.vue': {},
  './utils': {}
})
const { buildSystemMenuItems, findSystemMenuRoutes, isSystemMenuRoute } = menu
const leaf = (title, url) => ({ path: `/${url}`, meta: { title, url } })
const group = (title, children = [], path = '/group') => ({ path, meta: { title }, children })

test('only the complete system-management name matches, regardless of menu URL', () => {
  assert.equal(isSystemMenuRoute(group('系统管理')), true)
  assert.equal(isSystemMenuRoute(group(' 系统管理 ')), true)
  for (const title of ['系统管理中心', '系统设置', '菜单管理', '']) {
    const route = group(title, [leaf('菜单管理', 'sys/menu')])
    assert.equal(isSystemMenuRoute(route), false)
    assert.deepEqual(findSystemMenuRoutes([route]), [])
    assert.deepEqual(buildSystemMenuItems([route]), [])
    assert.deepEqual(toValidRoutes([route]), [route])
  }
})

test('missing system management produces no dropdown source', () => {
  assert.deepEqual(findSystemMenuRoutes(), [])
  assert.deepEqual(buildSystemMenuItems(), [])
  assert.deepEqual(findSystemMenuRoutes([group('业务管理', [leaf('预算统计', 'statistics/budget')])]), [])
})

test('a matching group supplies its children and is removed from the main navigation', () => {
  const users = leaf('用户管理', 'sys/user')
  const routes = [group('系统管理', [users]), leaf('工作台', 'home')]
  assert.equal(findSystemMenuRoutes(routes).length, 1)
  assert.deepEqual(
    buildSystemMenuItems(routes).map((item) => item.path),
    ['/sys/user']
  )
  assert.deepEqual(
    toValidRoutes(routes).map((route) => route.path),
    ['/home']
  )
})

test('nested system management stays available after repeated main-navigation filtering', () => {
  const system = group('系统管理', [leaf('用户管理', 'sys/user')], '/system')
  const business = leaf('预算统计', 'statistics/budget')
  const routes = [group('管理中心', [system, business])]
  const original = structuredClone(routes)
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(toValidRoutes(routes)[0].children, [business])
    assert.deepEqual(routes, original)
    assert.deepEqual(
      buildSystemMenuItems(routes).map((item) => item.path),
      ['/sys/user']
    )
  }
})

test('all named groups are included and their internal menu hierarchy is preserved', () => {
  const routes = [
    group('系统管理', [group('权限配置', [leaf('用户管理', 'sys/user')], '/permissions')], '/system'),
    group('管理中心', [group('系统管理', [leaf('日志管理', 'sys/log')], '/system-logs')])
  ]
  const items = buildSystemMenuItems(routes)
  assert.equal(findSystemMenuRoutes(routes).length, 2)
  assert.deepEqual(
    items.map((item) => item.title),
    ['权限配置', '日志管理']
  )
  assert.equal(items[0].children[0].path, '/sys/user')
})

test('system management itself is level 1, so its entries start at level 2', () => {
  const permissions = group('权限配置', [group('用户管理', [leaf('角色授权', 'sys/role')], '/permissions/user')], '/permissions')
  const items = buildSystemMenuItems([group('系统管理', [permissions, leaf('日志管理', 'sys/log')])])
  assert.deepEqual(
    items.map((item) => item.level),
    [2, 2]
  )
  assert.equal(items[0].children[0].level, 3)
  assert.equal(items[0].children[0].children[0].level, 4)
  // 嵌套在别的分组下时沿用真实层级
  const nested = buildSystemMenuItems([group('管理中心', [group('系统管理', [leaf('用户管理', 'sys/user')], '/system')])])
  assert.equal(nested[0].level, 3)
})

test('dropdown presence follows the matching group even when it has no clickable children', () => {
  const routes = [group('系统管理')]
  assert.equal(findSystemMenuRoutes(routes).length, 1)
  assert.deepEqual(buildSystemMenuItems(routes), [])
})

test('hidden groups do not create dropdown entries', () => {
  const system = group('系统管理', [leaf('用户管理', 'sys/user')])
  system.meta.isNavigationMenu = false
  assert.deepEqual(findSystemMenuRoutes([system]), [])
  assert.deepEqual(buildSystemMenuItems([system]), [])
})
