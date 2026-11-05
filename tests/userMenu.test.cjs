const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

const loadTypeScript = (relativePath) => {
  const filename = path.resolve(__dirname, '..', relativePath)
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
  })
  loaded._compile(outputText, filename)
  return loaded.exports
}

// 头像下拉「系统管理」面板的树操作；只依赖类型导入，可直接在 Node 中加载
const { buildUserMenuIndex, buildUserNavNodes, getAncestorKeys, openTrailKeys, resolveActiveKey, toggleOpenKey } =
  loadTypeScript('src/layout/header/user-menu.ts')

// level 沿用菜单树：「系统管理」是第 1 层，它的子菜单从第 2 层起
const leaf = (key, path, level = 2) => ({ key, title: key, path, menuId: key, isNewPage: false, url: path, level, children: [] })
const group = (key, children, level = 2) => ({ key, title: key, path: `/${key}`, menuId: key, isNewPage: false, url: '', level, children })

// 业务数据 > 科技部 / 安监部 > 页面；两处「帮助」指向同一路由
const tree = () => [
  group('data', [
    group('tech', [leaf('tech-v', '/tech/version', 4), leaf('tech-s', '/tech/submit', 4)], 3),
    group('safe', [leaf('safe-v', '/safe/version', 4)], 3)
  ]),
  group('dev', [leaf('board', '/dept/board', 3)], 2),
  leaf('menu-help', '/metrics/menuManagement'),
  leaf('help-center', '/metrics/menuManagement'),
  leaf('menu', '/sys/menu')
]

test('index records parents and keeps the first leaf for a duplicated path', () => {
  const index = buildUserMenuIndex(tree())
  assert.equal(index.parentOf.get('data'), '')
  assert.equal(index.parentOf.get('tech-v'), 'tech')
  assert.deepEqual(getAncestorKeys(index, 'tech-v'), ['data', 'tech'])
  assert.deepEqual(getAncestorKeys(index, 'menu'), [])
  assert.equal(index.firstByPath.get('/metrics/menuManagement').key, 'menu-help')
  // 分组的 path 不参与当前页匹配
  assert.equal(index.firstByPath.has('/data'), false)
})

test('opening a group collapses only its siblings; clicking again closes it', () => {
  const index = buildUserMenuIndex(tree())
  let open = toggleOpenKey(index, new Set(), 'data')
  open = toggleOpenKey(index, open, 'tech')
  assert.deepEqual([...open].sort(), ['data', 'tech'])
  open = toggleOpenKey(index, open, 'safe')
  assert.deepEqual([...open].sort(), ['data', 'safe'])
  open = toggleOpenKey(index, open, 'dev')
  assert.equal(open.has('data'), false)
  assert.equal(open.has('dev'), true)
  assert.equal(toggleOpenKey(index, open, 'dev').has('dev'), false)
})

test('the current page opens its whole trail and closes the siblings along it', () => {
  const index = buildUserMenuIndex(tree())
  const open = openTrailKeys(index, new Set(['dev', 'safe']), 'tech-s')
  assert.deepEqual([...open].sort(), ['data', 'tech'])
  // 不在任何分组里的页面不改动已展开的分组
  assert.deepEqual([...openTrailKeys(index, new Set(['dev']), 'menu')], ['dev'])
})

test('nav nodes keep the menu level, so system management counts as one level', () => {
  const nodes = buildUserNavNodes(tree())
  const data = nodes[0]
  // 下拉里的顶层项是「系统管理」的子菜单，因此是第 2 层，而不是第 1 层的业务域图标
  assert.equal(data.level, 2)
  assert.deepEqual(data.ancestors, [])
  const tech = data.children[0]
  assert.equal(tech.level, 3)
  assert.deepEqual(tech.ancestors, ['data'])
  const leafNode = tech.children[0]
  assert.equal(leafNode.level, 4)
  assert.deepEqual(leafNode.ancestors, ['data', 'tech'])
  // 下拉不提供收藏：节点保留 menuId，但渲染时不显示星标
  assert.equal(leafNode.menuId, 'tech-v')
  assert.equal(leafNode.isFavorite, false)
  // 层级缺失时按「系统管理的子菜单」兜底
  assert.equal(buildUserNavNodes([{ ...leaf('x', '/x'), level: undefined }])[0].level, 2)
})

test('the clicked entry wins for a duplicated route, otherwise the first one is active', () => {
  const index = buildUserMenuIndex(tree())
  assert.equal(resolveActiveKey(index, '/metrics/menuManagement', ''), 'menu-help')
  assert.equal(resolveActiveKey(index, '/metrics/menuManagement', 'help-center'), 'help-center')
  // 点过的项与当前路由不一致（从页签切走）时回到按路由匹配
  assert.equal(resolveActiveKey(index, '/sys/menu', 'help-center'), 'menu')
  // 分组永远不是当前项；不在系统管理里的页面没有当前项
  assert.equal(resolveActiveKey(index, '/data', 'data'), '')
  assert.equal(resolveActiveKey(index, '/home', ''), '')
})
