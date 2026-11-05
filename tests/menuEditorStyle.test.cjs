const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')

const root = path.resolve(__dirname, '..')
const less = require(path.join(root, 'node_modules/less'))

/** 取出菜单弹窗的 less 段落（vxe-modal / popper 都 teleport 到 body，样式写在全局块里） */
const editorLess = () => {
  const source = fs.readFileSync(path.join(root, 'src/views/sys/menu-add-or-update.vue'), 'utf8')
  const block = source.match(/<style lang="less">([\s\S]*?)<\/style>/)
  assert.ok(block, 'menu-add-or-update.vue 应有 less 样式段')
  return block[1]
}

const renderEditorCss = async () => (await less.render(editorLess(), { paths: [path.join(root, 'src/views/sys')] })).css

/** 展开成 [{ selector, declarations }]，够用于断言选中态这一条规则 */
const parseRules = (css) => {
  const normalized = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  const pattern = /([^{}]+)\{([^{}]*)\}/g
  let match
  while ((match = pattern.exec(normalized))) {
    const selectors = match[1]
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean)
    rules.push({ selectors, body: match[2], declarations: declarations(match[2]) })
  }
  return rules
}

const declarations = (body) =>
  body
    .split(';')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf(':')
      return {
        prop: line.slice(0, index).trim(),
        value: line.slice(index + 1).trim(),
        important: /!important$/.test(line)
      }
    })

const CURRENT = '.menu-editor__parent-tree.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content'

test('the selected parent node keeps readable text/icons on its own background', async () => {
  const rules = parseRules(await renderEditorCss())
  const rule = rules.find(({ selectors }) => selectors.includes(CURRENT))
  assert.ok(rule, `缺少选中态规则 ${CURRENT}`)

  const color = rule.declarations.find(({ prop }) => prop === 'color')
  const background = rule.declarations.find(({ prop }) => prop === 'background-color')
  assert.ok(color && background, '选中态需同时声明文字色与背景色')

  // 来源色与底色必须不同，否则就是这次“文字被背景吃掉”的回归
  assert.notEqual(background.value, color.value)
  assert.notEqual(background.value, 'var(--menu-picker-accent)')
})

test('the selected-state background beats the global app.less !important rule', async () => {
  // src/assets/css/app.less 里 .el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content
  // 用 !important 把选中行刷成主色实心底，本地不加 !important 就会被压掉，主色文字压在主色底上不可见
  const globalLess = fs.readFileSync(path.join(root, 'src/assets/css/app.less'), 'utf8')
  const globalRule = globalLess.match(/\.el-tree--highlight-current[^{]*is-current[^{]*\{[^}]*\}/)
  assert.ok(globalRule, '应能找到全局选中节点规则')
  assert.match(globalRule[0], /background-color:[^;]*!important/, '全局规则的背景是 !important，本地必须同样加 !important')

  const rules = parseRules(await renderEditorCss())
  const rule = rules.find(({ selectors }) => selectors.includes(CURRENT))
  const background = rule.declarations.find(({ prop }) => prop === 'background-color')
  assert.equal(background.important, true, '选中态背景需要 !important 才能覆盖全局主色实心底')
})

test('icons and check mark inside the selected node follow the accent color', async () => {
  const rules = parseRules(await renderEditorCss())
  const iconRule = rules.find(({ selectors }) => selectors.includes(`${CURRENT} .menu-editor__node-icon`))
  assert.ok(iconRule, '选中节点的图标需要单独着色，否则保持灰色，在选中底色上几乎看不见')
  const color = iconRule.declarations.find(({ prop }) => prop === 'color')
  assert.equal(color.value, 'var(--menu-picker-accent)')
  assert.ok(rules.some(({ selectors }) => selectors.includes(`${CURRENT} .menu-editor__node-check`)), '选中勾选图标同样需要着色')
})
