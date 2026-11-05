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

// 侧栏搜索只依赖树结构；类型导入在转译后会被完全移除，可直接在 Node 中加载
const { buildNavNodes, getNavShortLabel, getSearchVisibleKeys, searchNavNodes } = loadTypeScript('src/layout/sidebar/sidebar-nav.ts')

const leaf = (path, title, meta = {}) => ({ path, meta: { title, ...meta } })
const group = (path, title, children) => ({ path, meta: { title }, children })

// 业务管理 > 预算管理 > 预算编制 / 预算执行分析 / 进度跟踪；业务管理 > 待办事项
// 其他业务 > 预算对比 / 帮助中心
const menus = () => [
  group('/biz', '业务管理', [
    group('/budget', '预算管理', [leaf('/budget/plan', '预算编制'), leaf('/budget/analysis', '预算执行分析'), leaf('/budget/progress', '进度跟踪')]),
    leaf('/todo', '待办事项')
  ]),
  group('/other', '其他业务', [leaf('/other/compare', '预算对比'), leaf('/other/help', '帮助中心')])
]

const nodes = () => buildNavNodes(menus())
const keyOf = (list, title) => {
  const stack = [...list]
  while (stack.length) {
    const node = stack.shift()
    if (node.title === title) return node.key
    stack.unshift(...node.children)
  }
  throw new Error(`menu not found: ${title}`)
}
const keysOf = (list, titles) => new Set(titles.map((title) => keyOf(list, title)))

/** 搜索并返回可见 / 展开 / 可展开分组三份标题集合，便于断言 */
const search = (keyword, options = {}) => {
  const tree = nodes()
  const result = searchNavNodes(tree, {
    keyword,
    favoritesOnly: !!options.favoritesOnly,
    isFavorite: options.isFavorite || (() => false)
  })
  const titles = (keys) => {
    const map = new Map()
    const walk = (list) =>
      list.forEach((node) => {
        map.set(node.key, node.title)
        walk(node.children)
      })
    walk(tree)
    return keys ? [...keys].map((key) => map.get(key)).sort() : null
  }
  return {
    tree,
    result,
    visible: result && titles(result.visible),
    open: result && titles(result.open),
    expandable: result && titles(result.expandableGroups)
  }
}

test('关键字命中叶子时只显示命中项和祖先路径，未命中的兄弟保持隐藏', () => {
  const { result, visible, open, expandable } = search('预算')
  assert.deepEqual(visible, ['业务管理', '其他业务', '预算对比', '预算编制', '预算执行分析', '预算管理'].sort())
  assert.equal(visible.includes('进度跟踪'), false)
  assert.equal(visible.includes('待办事项'), false)
  assert.equal(visible.includes('帮助中心'), false)
  // 命中叶子的祖先分组自动展开
  assert.deepEqual(open, ['业务管理', '其他业务', '预算管理'].sort())
  // 命中的是叶子，没有“仅自身命中的分组”
  assert.deepEqual(expandable, [])
  assert.equal(getSearchVisibleKeys(nodes(), result, new Set()).size > 0, true)
})

test('关键字命中上级分组时默认只显示该分组及其祖先，不展开全部下级', () => {
  const { result, visible, open, expandable } = search('预算管理')
  assert.deepEqual(visible, ['业务管理', '预算管理'].sort())
  assert.deepEqual(open, ['业务管理'])
  // 仅自身命中的分组：点击后才补全子树
  assert.deepEqual(expandable, ['预算管理'])
  // 默认展开状态来自 result.open，命中分组本身不在其中
  const defaultVisible = getSearchVisibleKeys(nodes(), result, new Set(open.map((title) => keyOf(nodes(), title))))
  assert.deepEqual([...defaultVisible].sort(), [...result.visible].sort())
  for (const title of ['预算编制', '预算执行分析', '进度跟踪', '待办事项']) {
    assert.equal(defaultVisible.has(keyOf(nodes(), title)), false, `${title} 不应默认显示`)
  }
})

test('手动展开命中的分组后才出现其下级，且不泄漏其他分支', () => {
  const { result } = search('预算管理')
  const budgetKey = keyOf(nodes(), '预算管理')
  const visible = getSearchVisibleKeys(nodes(), result, new Set([keyOf(nodes(), '业务管理'), budgetKey]))
  for (const title of ['业务管理', '预算管理', '预算编制', '预算执行分析', '进度跟踪']) {
    assert.equal(visible.has(keyOf(nodes(), title)), true, `${title} 应可见`)
  }
  for (const title of ['待办事项', '其他业务', '预算对比', '帮助中心']) {
    assert.equal(visible.has(keyOf(nodes(), title)), false, `${title} 不应可见`)
  }
})

test('搜索只在命中路径上显示，帮助中心不会带出预算对比', () => {
  const { visible, open, expandable } = search('帮助')
  assert.deepEqual(visible, ['其他业务', '帮助中心'].sort())
  assert.deepEqual(open, ['其他业务'])
  assert.deepEqual(expandable, [])
})

test('收藏模式无关键字时只显示收藏叶子及其祖先分组', () => {
  const favoriteTitles = ['预算编制', '帮助中心']
  const isFavorite = (node) => favoriteTitles.includes(node.title)
  const { visible, open } = search('', { favoritesOnly: true, isFavorite })
  assert.deepEqual(visible, ['业务管理', '其他业务', '帮助中心', '预算编制', '预算管理'].sort())
  for (const title of ['预算执行分析', '进度跟踪', '待办事项', '预算对比']) {
    assert.equal(visible.includes(title), false, `${title} 未收藏不应显示`)
  }
  assert.deepEqual(open, ['业务管理', '其他业务', '预算管理'].sort())
})

test('收藏模式叠加关键字时，分组名命中不会带出未收藏的下级', () => {
  const favoriteTitles = ['预算编制']
  const isFavorite = (node) => favoriteTitles.includes(node.title)
  const { visible, expandable } = search('预算', { favoritesOnly: true, isFavorite })
  // 只保留标题命中「预算」的收藏叶子：预算编制；预算对比未收藏被过滤
  assert.deepEqual(visible, ['业务管理', '预算编制', '预算管理'].sort())
  // 分组自身命中在收藏模式下不构成结果，也不会变成可展开分组
  assert.deepEqual(expandable, [])
})

test('关键字为空且不在收藏模式时不过滤，返回 null', () => {
  assert.equal(searchNavNodes(nodes(), { keyword: '', favoritesOnly: false, isFavorite: () => false }), null)
  assert.equal(searchNavNodes(nodes(), { keyword: '   ', favoritesOnly: false, isFavorite: () => false }), null)
  assert.equal(getSearchVisibleKeys(nodes(), null, new Set(['0'])), null)
})

test('没有任何命中时可见集合为空', () => {
  const { result, visible, open, expandable } = search('不存在的菜单')
  assert.deepEqual(visible, [])
  assert.deepEqual(open, [])
  assert.deepEqual(expandable, [])
  assert.equal(result.visible.size, 0)
  assert.equal(getSearchVisibleKeys(nodes(), result, new Set()).size, 0)
})

test('标题匹配忽略大小写与首尾空白', () => {
  const routes = [{ path: '/a', meta: { title: 'Budget Plan' }, children: [] }]
  const tree = buildNavNodes(routes)
  const result = searchNavNodes(tree, { keyword: '  budget  ', favoritesOnly: false, isFavorite: () => false })
  assert.deepEqual([...result.visible], ['0'])
  assert.equal(keysOf(tree, ['Budget Plan']).has('0'), true)
})

test('收缩态简称：优先用 shortName，未配置时回退标题前两个字', () => {
  const tree = buildNavNodes([
    { path: '/a', meta: { title: '预算管理', shortName: '预算' } },
    { path: '/b', meta: { title: '业务管理' } },
    { path: '/c', meta: { title: '进度' } },
    { path: '/d', meta: { title: '待办事项', shortName: '  待办  ' } }
  ])
  assert.deepEqual(
    tree.map((node) => getNavShortLabel(node)),
    ['预算', '业务', '进度', '待办']
  )
})

test('收缩态简称：空白 shortName 视为未配置，单字标题不补位', () => {
  assert.equal(getNavShortLabel({ shortName: '   ', title: '预算管理' }), '预算')
  assert.equal(getNavShortLabel({ shortName: '', title: '预' }), '预')
  assert.equal(getNavShortLabel({ shortName: '', title: '' }), '')
})

test('收缩态简称按码点切分，不会截断代理对字符', () => {
  assert.equal(getNavShortLabel({ shortName: '', title: '📊预算执行' }), '📊预')
})
