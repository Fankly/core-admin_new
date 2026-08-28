<template>
  <div class="markdown-viewer">
    <ViewerToolbar label="MARKDOWN" />
    <article v-if="renderedHtml" class="markdown-viewer__content" v-html="renderedHtml"></article>
    <div v-else class="markdown-viewer__content markdown-viewer__content--empty">暂无可预览内容</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import ViewerToolbar from './ViewerToolbar.vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

// 内容来自可信接口，同时支持 Markdown 与原始 HTML 预览。
const markdown = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: false
})

markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noopener noreferrer')
  return renderer.renderToken(tokens, index, options)
}

const defaultImageRenderer = markdown.renderer.rules.image
markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
  tokens[index].attrSet('loading', 'lazy')
  return defaultImageRenderer ? defaultImageRenderer(tokens, index, options, env, renderer) : renderer.renderToken(tokens, index, options)
}

// 判断单元格是否为表格对齐分隔符（:-:、:--、--:、--- 等）。
const ALIGN_CELL = /^\s*:?-{1,}:?\s*$/

// Word 导出的 Markdown 常把整张表格压成一行：表头、对齐行、数据行全部用 |
// 连在一起且没有换行，markdown-it 无法识别。这里以“连续对齐单元格段”为锚点，
// 反推列数并还原成标准多行表格；无法识别为表格时原样返回。
const expandTableLine = (line: string) => {
  if (line.indexOf('|') === -1) return line

  const cells = line.split('|')

  // 找出最长的一段连续对齐单元格（如 :-:|:-:|:-:），其长度即为列数。
  let runStart = -1
  let runEnd = -1
  let i = 0
  while (i < cells.length) {
    if (ALIGN_CELL.test(cells[i])) {
      let j = i
      while (j < cells.length && ALIGN_CELL.test(cells[j])) j++
      if (j - i > runEnd - runStart) {
        runStart = i
        runEnd = j
      }
      i = j
    } else {
      i++
    }
  }

  const cols = runEnd - runStart
  // 列数过少（<2）多为普通文本里的 - 号，跳过以免误伤；表头单元格不足也跳过。
  if (runStart === -1 || cols < 2) return line
  const headerStart = runStart - cols
  if (headerStart < 0) return line

  const buildRow = (arr: string[]) => `| ${arr.map((c) => c.trim()).join(' | ')} |`

  const out: string[] = []
  // 对齐行之前、表头之外的内容作为表格标题一行。
  const prefixText = cells
    .slice(0, headerStart)
    .map((c) => c.trim())
    .filter(Boolean)
    .join(' ')
  if (prefixText) out.push(prefixText, '') // 表格前需空行，markdown-it 才会解析为表格。

  out.push(buildRow(cells.slice(headerStart, runStart)))
  out.push(`| ${Array.from({ length: cols }, () => ':-:').join(' | ')} |`)

  const data = cells.slice(runEnd)
  for (let k = 0; k < data.length; k += cols) {
    const chunk = data.slice(k, k + cols)
    if (chunk.every((c) => c.trim() === '')) continue // 跳过整行空单元格。
    while (chunk.length < cols) chunk.push('')
    out.push(buildRow(chunk))
  }
  out.push('') // 表格后补空行。
  return out.join('\n')
}

const normalizeMarkdown = (source: string) => {
  let normalized = String(source || '').replace(/\r\n?/g, '\n')
  const trimmed = normalized.trim()

  if (!trimmed) return ''

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === 'string') normalized = parsed.replace(/\r\n?/g, '\n')
    } catch {
      // 普通 Markdown 也可能以引号开头和结尾，解析失败时按原文渲染。
    }
  }

  return normalized
    .split('\n')
    .map((line) => expandTableLine(line))
    .join('\n')
}

const renderedHtml = computed(() => {
  const source = normalizeMarkdown(props.content)
  return source ? markdown.render(source) : ''
})
</script>

<style scoped lang="less">
.markdown-viewer {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #fff;
  color: #344054;

  &__content {
    box-sizing: border-box;
    flex: 1;
    min-height: 0;
    padding: 12px 18px 24px;
    background: #fbfcfd;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
    font-size: 14px;
    line-height: 1.78;
    word-break: break-word;
  }

  &__content--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #98a2b3;
  }

  :deep(.markdown-viewer__content > :first-child) {
    margin-top: 0 !important;
  }

  :deep(.markdown-viewer__content > :last-child) {
    margin-bottom: 0 !important;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 1.35em 0 0.62em;
    color: #1d2939;
    font-weight: 650;
    line-height: 1.35;
  }

  :deep(h1) {
    padding-bottom: 10px;
    border-bottom: 1px solid #e4e7ec;
    font-size: 26px;
    letter-spacing: -0.02em;
  }

  :deep(h2) {
    padding-bottom: 7px;
    border-bottom: 1px solid #eaecf0;
    font-size: 21px;
  }

  :deep(h3) {
    font-size: 17px;
  }

  :deep(h4) {
    font-size: 15px;
  }

  :deep(h5),
  :deep(h6) {
    font-size: 14px;
  }

  :deep(p) {
    margin: 0 0 1em;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 1em;
    padding-left: 2em;
  }

  :deep(li + li) {
    margin-top: 0.28em;
  }

  :deep(li > p) {
    margin-bottom: 0.35em;
  }

  :deep(blockquote) {
    margin: 0 0 1.1em;
    padding: 10px 16px;
    border-left: 4px solid #0f766e;
    background: #f0fdfa;
    color: #475467;
  }

  :deep(blockquote > :last-child) {
    margin-bottom: 0;
  }

  :deep(a) {
    color: #00706b;
    text-decoration: none;
    text-underline-offset: 3px;

    &:hover {
      text-decoration: underline;
    }

    &:focus-visible {
      border-radius: 2px;
      outline: 2px solid #14b8a6;
      outline-offset: 2px;
    }
  }

  :deep(code) {
    padding: 2px 5px;
    border: 1px solid #dce4e7;
    border-radius: 4px;
    background: #f2f6f6;
    color: #b42318;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 0.9em;
  }

  :deep(pre) {
    margin: 0 0 1.15em;
    padding: 16px 18px;
    overflow: auto;
    border: 1px solid #27364a;
    border-radius: 6px;
    background: #111827;
    color: #e5edf5;
    line-height: 1.65;
    tab-size: 2;
  }

  :deep(pre code) {
    display: block;
    min-width: max-content;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 12px;
  }

  :deep(table) {
    width: 100%;
    margin: 0 0 1.15em;
    overflow: hidden;
    border: 1px solid #dfe5ea;
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 5px;
    background: #fff;
    font-size: 13px;
  }

  :deep(th),
  :deep(td) {
    padding: 9px 12px;
    border-right: 1px solid #e4e7ec;
    border-bottom: 1px solid #e4e7ec;
    text-align: left;
    vertical-align: top;
  }

  :deep(th) {
    background: #f2f7f7;
    color: #1d2939;
    font-weight: 650;
  }

  :deep(tr > :last-child) {
    border-right: 0;
  }

  :deep(tbody tr:last-child td) {
    border-bottom: 0;
  }

  :deep(tbody tr:nth-child(even)) {
    background: #fafcfc;
  }

  :deep(hr) {
    height: 1px;
    margin: 22px 0;
    border: 0;
    background: #e4e7ec;
  }

  :deep(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 12px auto;
    border-radius: 5px;
  }

  :deep(del) {
    color: #667085;
  }
}
</style>
