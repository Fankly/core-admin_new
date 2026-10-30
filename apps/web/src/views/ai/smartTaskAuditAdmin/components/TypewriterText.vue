<template>
  <component
    :is="tag"
    class="typewriter"
    :class="{ 'typewriter--typing': typing, 'typewriter--markdown': isMarkdown }"
    v-html="display"
    @click="onHtmlClick"
    @keydown.enter.prevent="onHtmlKeyActivate"
    @keydown.space.prevent="onHtmlKeyActivate"
  ></component>
</template>

<script lang="ts">
interface TypewriterProgress {
  raw: string
  revealed: number
  completed: boolean
  updatedAt: number
}

const typewriterProgressCache = new Map<string, TypewriterProgress>()
const TYPEWRITER_CACHE_MAX_ENTRIES = 200
const TYPEWRITER_CACHE_TTL_MS = 30 * 60 * 1000

const pruneTypewriterProgressCache = (now = Date.now()) => {
  typewriterProgressCache.forEach((progress, key) => {
    if (now - progress.updatedAt > TYPEWRITER_CACHE_TTL_MS) {
      typewriterProgressCache.delete(key)
    }
  })

  while (typewriterProgressCache.size > TYPEWRITER_CACHE_MAX_ENTRIES) {
    const oldestKey = typewriterProgressCache.keys().next().value
    if (oldestKey === undefined) break
    typewriterProgressCache.delete(oldestKey)
  }
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { getMarkdownRenderer, handleAuditHtmlActionClick, looksLikeMarkdown, normalizeAuditMarkdown } from './auditDetailHelpers'
import type { AuditAttachViewPayload, AuditReviewTablePayload } from './auditDetailHelpers'

const props = defineProps<{
  text?: string | null
  tag?: 'span' | 'div'
  speed?: number
  startDelay?: number
  persistKey?: string | number
  // 是否播放打字机动画；为 true 时会按 persistKey 记录进度，切换 tab 后继续播放
  animate?: boolean
}>()

const tag = props.tag || 'span'

const emit = defineEmits<{
  /** 点击后端下发的 .attachView，透传 data-attach-id / data-attach-name */
  (event: 'attach-preview', payload: AuditAttachViewPayload): void
  /** 点击后端下发的 table.reviewTable，透传其在富文本中的顺序 */
  (event: 'review-table-open', payload: AuditReviewTablePayload): void
  (event: 'typing-progress'): void
  (event: 'typing-complete'): void
}>()

const display = ref('')
const typing = ref(false)
const isMarkdown = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let cacheKey = ''
let rawText = ''
let tokens: string[] = []
let revealed = 0

// 标签感知切片：把 HTML 标签与实体作为整体保留，避免打字机切到标签中间产生残缺 HTML
const tokenize = (html: string): string[] => {
  const tokens: string[] = []
  const re = /<[^>]+>|&[a-zA-Z#0-9]+;/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    for (const ch of html.slice(lastIndex, match.index)) tokens.push(ch)
    tokens.push(match[0])
    lastIndex = re.lastIndex
  }
  for (const ch of html.slice(lastIndex)) tokens.push(ch)
  return tokens
}

const isTag = (token: string) => token.startsWith('<') || (token.startsWith('&') && token.endsWith(';'))

const clear = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  typing.value = false
}

const hashText = (value: string) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

const getCacheKey = (raw: string) => {
  if (props.persistKey !== undefined && props.persistKey !== null) return String(props.persistKey)
  return `${raw.length}:${hashText(raw)}`
}

const advanceTokens = (start: number, visibleCount: number) => {
  let next = start
  let added = 0
  while (next < tokens.length) {
    if (!isTag(tokens[next])) {
      if (added >= visibleCount) break
      added += 1
    }
    next += 1
  }
  return next
}

const saveProgress = () => {
  if (!cacheKey) return
  const now = Date.now()
  typewriterProgressCache.delete(cacheKey)
  typewriterProgressCache.set(cacheKey, {
    raw: rawText,
    revealed,
    completed: revealed >= tokens.length,
    updatedAt: now
  })
  pruneTypewriterProgressCache(now)
}

const start = (source: string) => {
  saveProgress()
  clear()
  display.value = ''
  cacheKey = ''
  rawText = ''
  tokens = []
  revealed = 0
  isMarkdown.value = false
  if (typeof source !== 'string' || !source) {
    emit('typing-complete')
    return
  }

  // 智能识别 Markdown；HTML 内容由调用方保证可信，组件按原文渲染。
  const useMarkdown = looksLikeMarkdown(source)
  isMarkdown.value = useMarkdown
  const markdownSource = useMarkdown ? normalizeAuditMarkdown(source) : source
  rawText = useMarkdown ? getMarkdownRenderer().render(markdownSource) : source

  // 明确关闭动画时直接整段渲染，不写入进度，避免污染后续继续播放状态
  if (props.animate === false) {
    display.value = rawText
    emit('typing-complete')
    return
  }

  cacheKey = getCacheKey(rawText)
  tokens = tokenize(rawText)
  const visibleCount = tokens.reduce((sum, token) => sum + (isTag(token) ? 0 : 1), 0)

  // 对齐 reserveApprovalDetail 的打字机节奏：每帧 100ms，按内容长度分档批量吐字
  const speed = Math.max(16, props.speed ?? 100)
  const charsPerTick = visibleCount > 500 ? 15 : visibleCount > 200 ? 8 : 3
  pruneTypewriterProgressCache()
  const cachedProgress = typewriterProgressCache.get(cacheKey)
  if (cachedProgress?.raw === rawText) {
    revealed = Math.min(cachedProgress.revealed, tokens.length)
    if (!cachedProgress.completed && revealed < tokens.length) {
      const elapsedTicks = Math.floor(Math.max(0, Date.now() - cachedProgress.updatedAt) / speed)
      revealed = advanceTokens(revealed, elapsedTicks * charsPerTick)
    }
    display.value = revealed >= tokens.length ? rawText : tokens.slice(0, revealed).join('')
    saveProgress()
    if (revealed >= tokens.length) {
      typing.value = false
      emit('typing-complete')
      return
    }
  } else {
    revealed = 0
  }

  const startDelay = revealed > 0 ? 0 : Math.max(0, props.startDelay ?? 0)

  const type = () => {
    typing.value = true
    const next = advanceTokens(revealed, charsPerTick)
    display.value += tokens.slice(revealed, next).join('')
    revealed = next
    saveProgress()
    emit('typing-progress')

    if (revealed < tokens.length) {
      timer = setTimeout(type, speed)
    } else {
      timer = null
      typing.value = false
      emit('typing-complete')
    }
  }

  if (startDelay > 0) {
    timer = setTimeout(type, startDelay)
    return
  }

  type()
}

/** 委托点击 v-html 内：同源目录 / 附件预览 / 结构化评审表 */
const onHtmlClick = (event: MouseEvent) => {
  handleAuditHtmlActionClick(event, {
    onAttachPreview: (payload) => emit('attach-preview', payload),
    onReviewTableOpen: (payload) => emit('review-table-open', payload)
  })
}

/** 键盘激活（Enter / Space）同源目录或附件预览节点 */
const onHtmlKeyActivate = (event: KeyboardEvent) => {
  handleAuditHtmlActionClick(event, {
    onAttachPreview: (payload) => emit('attach-preview', payload),
    onReviewTableOpen: (payload) => emit('review-table-open', payload)
  })
}

watch(
  () => props.text,
  (value) => start(value || ''),
  { immediate: true }
)

onBeforeUnmount(() => {
  saveProgress()
  clear()
})
</script>
