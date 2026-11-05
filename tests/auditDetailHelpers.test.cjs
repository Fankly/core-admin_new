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
    external: ['markdown-it', 'mockjs'],
    write: false
  })
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  loaded._compile(result.outputFiles[0].text, filename)
  return loaded.exports
}

const helpers = loadTypeScript('src/views/ai/smartTaskAudit/components/auditDetailHelpers.ts')
const { MARKDOWN_FORMULA_SAMPLE } = loadTypeScript('mock/fixtures/aiSmartTaskAudit/markdownFormulaSamples.ts')
const { MARKDOWN_TABLE_SAMPLE, WIDE_MARKDOWN_TABLE_SAMPLE } = loadTypeScript('mock/fixtures/aiSmartTaskAudit/markdownTableSamples.ts')
const expectedBenefitReview = require('../mock/fixtures/aiSmartTaskAudit/expectedBenefitReview.json')
const materialNewestPriceReview = require('../mock/fixtures/aiSmartTaskAudit/materialNewestPriceReview.json')
const gwPriceReview = require('../mock/fixtures/aiSmartTaskAudit/gwPriceReview.json')
const suppliedReviews = [expectedBenefitReview, materialNewestPriceReview, gwPriceReview]

const render = (source) => {
  const normalized = helpers.normalizeAuditRichText(source)
  const html = helpers.looksLikeMarkdown(normalized)
    ? helpers.getMarkdownRenderer().render(helpers.normalizeAuditMarkdown(normalized)).trim()
    : normalized
  return helpers.convertAuditHtmlLineBreaks(html)
}
const strongLabels = (html) => [...html.matchAll(/<strong>(.*?)<\/strong>/g)].map((match) => match[1])

test('expected benefit review emphasizes only its three labels, not the quoted evidence', () => {
  const html = render(expectedBenefitReview.reviewProcess)
  assert.deepEqual(strongLabels(html), ['项目必要性：', '项目方案：', '推理过程与结论：'])
  assert.ok(!html.includes('**'))
  assert.ok(html.includes('&quot;2026年3月19日'))
  assert.ok(html.includes('缺乏对效益程度的量化说明，故判定为待复核。'))
})

for (const [review, priceClass] of [
  [materialNewestPriceReview, 'materialNewestPriceView'],
  [gwPriceReview, 'gwPriceView']
]) {
  test(`${priceClass}: Markdown after HTML is parsed and the original price action is preserved`, () => {
    const html = render(review.reviewProcess)
    assert.deepEqual(strongLabels(html), ['推理过程与结论：'])
    assert.ok(!html.includes('**'))
    assert.ok(html.startsWith(review.reviewProcess.split('\n')[0]))
    assert.ok(html.includes(`id="${priceClass}" class="${priceClass}"`))
    assert.ok(html.includes(review.reviewConclude))
  })
}

test('valid emphasis pairs cannot become the opening delimiter of the next label', () => {
  assert.deepEqual(strongLabels(render('**第一项：**"引用"；**第二项：**正文')), ['第一项：', '第二项：'])
  assert.deepEqual(strongLabels(render('**第一项**：正文；**第二项：**正文')), ['第一项', '第二项：'])
  assert.equal(render('**标签：**取值'), '<p><strong>标签：</strong>取值</p>')
  assert.equal(render('**含 *嵌套* 的说明**'), '<p><strong>含 <em>嵌套</em> 的说明</strong></p>')
})

test('Markdown headings, lists, and tables after an HTML paragraph remain structured', () => {
  for (const [text, expectedTag] of [
    ['### 审核结论', '<h3>审核结论</h3>'],
    ['- 第一项\n- 第二项', '<ul>'],
    ['1. 第一项\n2. 第二项', '<ol>'],
    [MARKDOWN_TABLE_SAMPLE, '<div class="markdown-table-wrap"><table>']
  ]) {
    assert.ok(render(`<p>依据</p>\n${text}`).includes(expectedTag))
  }
})

test('normalization does not rewrite fenced code, HTML pre/code, inline code, or tag attributes', () => {
  for (const source of [
    '```html\n<p>example</p>\n**标签：**正文\n```',
    '~~~html\n<p>example</p>\n**标签：**正文\n~~~',
    '<pre><code><p>example</p>\n**标签：**\n</code></pre>',
    '`**标签：**正文`',
    '<span title="**标签：**正文">text</span>'
  ]) {
    assert.equal(helpers.normalizeAuditMarkdown(source), source)
  }
})

test('original text still renders project headings; null review fields stay empty', () => {
  const html = render(expectedBenefitReview.originalText)
  assert.ok(html.includes('<h3>项目基本信息</h3>'))
  assert.ok(html.includes('<h4>项目必要性</h4>'))
  assert.ok(html.includes('<h5>技术实施方案</h5>'))
  for (const review of suppliedReviews) {
    assert.deepEqual(helpers.normalizeReviewTables(review.reviewTable), [])
  }
  assert.equal(helpers.convertAuditHtmlLineBreaks(null), '')
})

test('existing arithmetic and wide Markdown table samples still render', () => {
  const formulaHtml = render(MARKDOWN_FORMULA_SAMPLE)
  assert.deepEqual(
    [...formulaHtml.matchAll(/<em>(.*?)<\/em>/g)].map((match) => match[1]),
    ['金额按实际计入比例折算。']
  )
  for (const formula of ['(5000*10)*100%', '5000*10*100%', '5000 *10* 100%', '（5000*10）*100％', '(5000.5*10)*100%', '(5000*-10)*100%']) {
    assert.ok(formulaHtml.includes(formula), `Arithmetic was altered: ${formula}`)
  }
  for (const source of [MARKDOWN_TABLE_SAMPLE, WIDE_MARKDOWN_TABLE_SAMPLE]) {
    const html = render(source)
    assert.ok(html.includes('<div class="markdown-table-wrap"><table>'))
    assert.ok(html.includes('<thead>') && html.includes('<tbody>'))
  }
  assert.ok(render('**公式：**(5000*10)*100%').includes('<strong>公式：</strong>(5000*10)*100%'))
})

test('escaped and malformed table markup keeps the existing normalization behavior', () => {
  const source = '<tablestyle="width:100%"><tr><td>value</td></tr></table>'
  assert.equal(render(JSON.stringify(source)), '<table style="width:100%"><tr><td>value</td></tr></table>')
})

test('registered mock routes expose both categories and return all three unmodified point responses', () => {
  const Mock = require('mockjs')
  loadTypeScript('mock/modules/aiSmartTaskAudit.ts')
  const request = (endpoint, type, body) => {
    const url = `/ai-audit-task-manage/${endpoint}`
    const route = Object.values(Mock._mocked).find((entry) => entry.rtype === type && entry.rurl.test(url))
    assert.ok(route, `Missing route: ${type} ${url}`)
    return route.template({ url, type, body: body ? JSON.stringify(body) : null })
  }
  const categories = request('listCategoryRuleReview', 'post', { taskId: 'mock-task-001' }).data
  for (const categoryRuleId of new Set(suppliedReviews.map((review) => review.categoryRuleId))) {
    assert.equal(categories.filter((rule) => rule.categoryRuleId === categoryRuleId).length, 1)
    const points = request('listRuleReview', 'post', { categoryRuleId, taskId: 'mock-task-001' }).data
    const expected = suppliedReviews.filter((review) => review.categoryRuleId === categoryRuleId)
    assert.deepEqual(
      points.map((point) => point.detailId),
      expected.map((review) => review.detailId)
    )
    assert.deepEqual(
      points.map((point) => point.ruleId),
      expected.map((review) => review.ruleId)
    )
  }
  for (const review of suppliedReviews) {
    const endpoint = `getRuleReview?detailId=${review.detailId}&_t=1`
    assert.deepEqual(request(endpoint, 'get').data, review)
    assert.equal(request(`redoAuditRule?detailId=${review.detailId}`, 'post').success, true)
    assert.deepEqual(request(endpoint, 'get').data, review)
    const points = request('listRuleReview', 'post', { categoryRuleId: review.categoryRuleId }).data
    assert.equal(points.find((point) => point.detailId === review.detailId).reviewOpinion, review.reviewOpinion)
  }
  const existing = require('../mock/fixtures/aiSmartTaskAudit/attachmentIntegrityReview.json')
  assert.deepEqual(request(`getRuleReview?detailId=${existing.data.detailId}`, 'get'), existing)
  assert.equal(request('getRuleReview?detailId=missing', 'get').success, false)
})
