import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import { getPublicData } from '@/api/common'
import { getCache, setCache } from '@/utils/cache'
import { stopAiChat, streamAiChat } from './api'
import { aiChatConfig } from './config'
import { AiChatAgentOption, AiChatMessage, AiChatSession, AiChatStreamEvent, AiChatTraceStatus, AiChatTraceStep, AiChatWorkspaceCache } from './types'

const CACHE_KEY_PREFIX = 'ai-chat-workspace'
const LEGACY_CACHE_KEY_PREFIX = 'ai-chat-session'
const MAX_SESSIONS = 20
const MAX_MESSAGES = 50
const MAX_CONTENT_LENGTH = 20000
const TRACE_DETAIL_TURNS = 10
const TRACE_DETAIL_SESSIONS = 3
const TRACE_DETAIL_BUDGET = 40000

const stageNames: Record<string, string> = {
  OTHER_COMMON: '通用处理',
  MAIN_CONVERSATION: '自主规划',
  PLANNING: '任务规划',
  SKILL_GENERATE: '技能处理',
  INTENT_RECOGNITION: '意图识别'
}

const toolNames: Record<string, string> = {
  terminal: '终端命令',
  read_file: '读取文件',
  write_file: '写入文件',
  web_search: '网络搜索',
  delegate_task: '委派任务',
  save_memory: '保存记忆',
  todo_write: '更新计划',
  skill_manage: '技能管理',
  skill_view: '查看技能',
  capabilities_list: '搜索能力',
  read_document: '读取文档',
  write_document: '生成文档',
  data_analysis: '数据分析'
}

const createId = (prefix = '') => `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const getCacheKey = (userCode: string) => `${CACHE_KEY_PREFIX}:${userCode}`
const getLegacyCacheKey = (userCode: string) => `${LEGACY_CACHE_KEY_PREFIX}:${userCode}`
const normalizeAgentName = (value: unknown) => (typeof value === 'string' ? value.trim().replaceAll('苏电智伴', '预算助手') : '')
const getStageName = (stage?: string) => (stage && stageNames[stage]) || '执行状态'
const getToolName = (name: string, displayName?: string) => displayName || toolNames[name] || name || '工具调用'

const toDisplayText = (value: unknown) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const createSession = (): AiChatSession => {
  const now = Date.now()
  return {
    id: createId('session-'),
    title: '新会话',
    sessionId: '',
    agentCode: '',
    agentName: '',
    messages: [],
    draft: '',
    selectedAssistantId: '',
    createdAt: now,
    updatedAt: now
  }
}

const titleFromMessages = (messages: AiChatMessage[]) => {
  const first = messages.find((message) => message.role === 'user')?.content || ''
  const compact = first.replace(/\s+/g, ' ').trim()
  return compact ? compact.slice(0, 24) : '新会话'
}

const normalizeMessages = (rawMessages: unknown): AiChatMessage[] => {
  if (!Array.isArray(rawMessages)) return []
  return rawMessages.slice(-MAX_MESSAGES).map((message) => {
    const raw = message as Partial<AiChatMessage>
    const interrupted = raw.status === 'streaming' || raw.status === 'pending'
    return {
      id: String(raw.id || createId('message-')),
      role: raw.role === 'user' ? 'user' : 'assistant',
      content: String(raw.content || '').slice(0, MAX_CONTENT_LENGTH),
      status: interrupted ? 'error' : raw.status === 'cancelled' ? 'cancelled' : raw.status || 'done',
      createdAt: Number(raw.createdAt || Date.now()),
      error: interrupted ? raw.error || '页面刷新导致回答中断，可重新生成。' : raw.error,
      stopReason: interrupted ? raw.stopReason || '页面刷新导致回答中断' : raw.stopReason,
      agentName: raw.agentName ? normalizeAgentName(raw.agentName) : undefined,
      trace: Array.isArray(raw.trace)
        ? raw.trace.map((step) => ({
            ...step,
            id: String(step.id || createId('trace-')),
            status: step.status === 'running' || step.status === 'pending' ? ('error' as const) : step.status,
            error: step.status === 'running' || step.status === 'pending' ? step.error || '页面刷新导致执行中断。' : step.error
          }))
        : undefined
    }
  })
}

const normalizeSession = (raw: Partial<AiChatSession>): AiChatSession => {
  const messages = normalizeMessages(raw.messages)
  const fallback = createSession()
  return {
    id: String(raw.id || fallback.id),
    title: String(raw.title || titleFromMessages(messages)),
    sessionId: String(raw.sessionId || ''),
    agentCode: String(raw.agentCode || ''),
    agentName: normalizeAgentName(raw.agentName),
    messages,
    draft: String(raw.draft || '').slice(0, 15000),
    selectedAssistantId: String(raw.selectedAssistantId || [...messages].reverse().find((message) => message.role === 'assistant')?.id || ''),
    createdAt: Number(raw.createdAt || fallback.createdAt),
    updatedAt: Number(raw.updatedAt || raw.createdAt || fallback.updatedAt)
  }
}

const loadWorkspace = (userCode: string): { activeSessionId: string; sessions: AiChatSession[] } => {
  if (!userCode) {
    const session = createSession()
    return { activeSessionId: session.id, sessions: [session] }
  }
  const current = getCache(getCacheKey(userCode), undefined, undefined) as Partial<AiChatWorkspaceCache> | undefined
  if (current?.version === 2 && Array.isArray(current.sessions) && current.sessions.length) {
    const sessions = current.sessions.slice(0, MAX_SESSIONS).map((session) => normalizeSession(session))
    const activeSessionId = sessions.some((session) => session.id === current.activeSessionId) ? String(current.activeSessionId) : sessions[0].id
    return { activeSessionId, sessions }
  }

  const legacy = getCache(getLegacyCacheKey(userCode), undefined, {}) as Partial<AiChatSession> & { messages?: AiChatMessage[] }
  const migrated = normalizeSession({
    id: createId('session-'),
    title: titleFromMessages(normalizeMessages(legacy.messages)),
    messages: normalizeMessages(legacy.messages),
    draft: legacy.draft
  })
  return { activeSessionId: migrated.id, sessions: [migrated] }
}

const cacheTrace = (trace: AiChatTraceStep[] = [], keepDetails: boolean) => {
  let budget = TRACE_DETAIL_BUDGET
  const consume = (value: unknown) => {
    if (!keepDetails || budget <= 0) return undefined
    const text = toDisplayText(value)
    if (!text) return undefined
    const clipped = text.slice(0, budget)
    budget -= clipped.length
    return clipped.length < text.length ? `${clipped}\n\n...（详情过长，已截断）` : clipped
  }
  return trace.map((step) => ({
    ...step,
    content: consume(step.content),
    args: consume(step.args),
    output: consume(step.output),
    error: consume(step.error)
  }))
}

const prepareSessionForCache = (session: AiChatSession, keepDetails: boolean) => {
  const assistantIds = session.messages
    .filter((message) => message.role === 'assistant')
    .slice(-TRACE_DETAIL_TURNS)
    .map((message) => message.id)
  const detailed = new Set(assistantIds)
  return {
    id: session.id,
    title: session.title.slice(0, 80),
    sessionId: session.sessionId,
    agentCode: session.agentCode,
    agentName: session.agentName,
    draft: session.draft.slice(0, 15000),
    selectedAssistantId: session.selectedAssistantId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messages: session.messages.slice(-MAX_MESSAGES).map((message) => ({
      ...message,
      content: message.content.slice(0, MAX_CONTENT_LENGTH),
      trace: message.trace ? cacheTrace(message.trace, keepDetails && detailed.has(message.id)) : undefined,
      traceDetailsExpired: Boolean(message.trace?.length && (!keepDetails || !detailed.has(message.id)))
    }))
  }
}

export const useAiChat = () => {
  const store = useStore()
  const currentUserKey = computed(() => {
    const user = store.getters.getUserMsg || {}
    return String(user.namecode || user.username || user.userCode || user.loginName || user.id || user.systemCode || '').trim()
  })
  const requestUserCode = ref('')
  const agentOptions = ref<AiChatAgentOption[]>([])
  const identityError = ref('')
  const initial = loadWorkspace(currentUserKey.value)
  const sessions = ref<AiChatSession[]>(initial.sessions)
  const activeSessionId = ref(initial.activeSessionId)
  const isStreaming = ref(false)
  const activeAssistantId = ref('')
  const scrollVersion = ref(0)
  const traceAutoOpenVersion = ref(0)
  let controller: AbortController | null = null
  let manuallyStopped = false
  let streamingSessionId = ''
  let persistTimer: number | undefined
  let quotaWarningShown = false
  let isStreamUpdating = false
  let deltaBuffer: string[] = []
  let rafId: number | undefined

  const normalizeCommonCodeValue = (item: Record<string, unknown>) => String(item.code || '').trim()
  const normalizeCommonCodeName = (item: Record<string, unknown>) => normalizeAgentName(item.name || item.note)
  const loadRequestIdentity = async () => {
    identityError.value = ''
    try {
      const [agentResponse, userResponse] = await Promise.all([
        getPublicData(aiChatConfig.agentCodeCommonCode),
        getPublicData(aiChatConfig.userCodeCommonCode)
      ])
      if (!agentResponse.success) throw new Error(agentResponse.msg || '智能体公共代码加载失败')
      if (!userResponse.success) throw new Error(userResponse.msg || '聊天用户公共代码加载失败')

      agentOptions.value = (Array.isArray(agentResponse.data) ? agentResponse.data : [])
        .map((item: Record<string, unknown>) => {
          const code = normalizeCommonCodeValue(item)
          return { code, name: normalizeCommonCodeName(item) }
        })
        .filter((item: AiChatAgentOption) => item.code && item.name)
      const userItem = Array.isArray(userResponse.data)
        ? userResponse.data.find((item: Record<string, unknown>) => normalizeCommonCodeValue(item))
        : undefined
      requestUserCode.value = userItem ? normalizeCommonCodeValue(userItem) : ''

      if (!agentOptions.value.length) throw new Error('智能体公共代码未配置有效数据')
      if (!requestUserCode.value) throw new Error('聊天用户公共代码未配置有效数据')
      const defaultAgent = agentOptions.value[0]
      sessions.value.forEach((session) => {
        session.agentCode = defaultAgent.code
        session.agentName = defaultAgent.name
      })
    } catch (error) {
      agentOptions.value = []
      requestUserCode.value = ''
      identityError.value = error instanceof Error ? error.message : '聊天公共代码加载失败'
      console.warn('[AI Chat] 公共代码不可用，聊天入口已隐藏', identityError.value)
    }
  }

  void loadRequestIdentity()

  const chatConfigured = computed(() => Boolean(agentOptions.value.length && requestUserCode.value && !identityError.value))
  const orderedSessions = computed(() => [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt))
  const activeSession = computed(() => sessions.value.find((session) => session.id === activeSessionId.value) || sessions.value[0])
  const messages = computed(() => activeSession.value?.messages || [])
  const draft = computed({
    get: () => activeSession.value?.draft || '',
    set: (value: string) => {
      if (activeSession.value) activeSession.value.draft = value.slice(0, 15000)
    }
  })
  const selectedAssistantId = computed(() => activeSession.value?.selectedAssistantId || '')
  const selectedAgentCode = computed(() => activeSession.value?.agentCode || '')
  const selectedTraceMessage = computed(
    () => messages.value.find((message) => message.id === selectedAssistantId.value && message.role === 'assistant') || null
  )
  const sessionLocked = computed(() => isStreaming.value)
  const canSend = computed(
    () =>
      Boolean(draft.value.trim()) &&
      !isStreaming.value &&
      Boolean(currentUserKey.value) &&
      Boolean(requestUserCode.value) &&
      Boolean(selectedAgentCode.value)
  )

  const persistNow = () => {
    if (!currentUserKey.value) return
    const ordered = [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS)
    const build = (detailSessionCount: number, keepSessionCount = ordered.length) => ({
      version: 2 as const,
      activeSessionId: activeSessionId.value,
      sessions: ordered.slice(0, keepSessionCount).map((session, index) => prepareSessionForCache(session, index < detailSessionCount))
    })
    try {
      setCache(getCacheKey(currentUserKey.value), build(TRACE_DETAIL_SESSIONS) as any)
      return
    } catch (error) {
      console.warn('[AI Chat] 会话缓存详情写入失败，尝试压缩', error)
    }
    try {
      setCache(getCacheKey(currentUserKey.value), build(0, 5) as any)
      return
    } catch (error) {
      console.warn('[AI Chat] 会话缓存写入失败，继续裁剪历史', error)
    }
    for (let count = Math.min(ordered.length, MAX_SESSIONS); count > 1; count--) {
      try {
        setCache(getCacheKey(currentUserKey.value), build(0, count) as any)
        if (!quotaWarningShown) {
          quotaWarningShown = true
          ElMessage.warning('本地会话空间不足，较早的会话已自动裁剪。')
        }
        return
      } catch {
        // Continue removing the oldest session until the current workspace fits.
      }
    }
    if (!quotaWarningShown) {
      quotaWarningShown = true
      ElMessage.warning('本地会话无法保存，请清理浏览器空间后重试。')
    }
  }

  const schedulePersist = () => {
    if (persistTimer) window.clearTimeout(persistTimer)
    persistTimer = window.setTimeout(() => {
      persistTimer = undefined
      persistNow()
    }, 160)
  }

  watch(
    [sessions, activeSessionId],
    () => {
      if (!isStreamUpdating) schedulePersist()
    },
    { deep: true }
  )
  watch(currentUserKey, async (nextUserCode, previousUserCode) => {
    if (!nextUserCode || nextUserCode === previousUserCode) return
    if (isStreaming.value) await stopAndNotifyBackend()
    const next = loadWorkspace(nextUserCode)
    sessions.value = next.sessions
    activeSessionId.value = next.activeSessionId
    activeAssistantId.value = ''
    streamingSessionId = ''
    scrollVersion.value++
  })

  const updateSession = (session: AiChatSession, touch = true) => {
    if (touch) session.updatedAt = Date.now()
  }
  const updateAssistant = (session: AiChatSession, id: string, patch: Partial<AiChatMessage>) => {
    const target = session.messages.find((message) => message.id === id)
    if (!target) return
    Object.assign(target, patch)
    updateSession(session)
    scrollVersion.value++
  }
  const appendDelta = (session: AiChatSession, id: string, content: string) => {
    const target = session.messages.find((message) => message.id === id)
    if (!target || !content) return
    deltaBuffer.push(content)
    target.status = 'streaming'
  }
  const flushDelta = (session: AiChatSession, id: string) => {
    if (!deltaBuffer.length) return
    const target = session.messages.find((message) => message.id === id)
    if (!target) {
      deltaBuffer = []
      return
    }
    target.content = `${target.content}${deltaBuffer.join('')}`.slice(0, MAX_CONTENT_LENGTH)
    deltaBuffer = []
    scrollVersion.value++
  }
  const scheduleFlushDelta = (session: AiChatSession, id: string) => {
    if (rafId !== undefined) return
    rafId = requestAnimationFrame(() => {
      flushDelta(session, id)
      rafId = undefined
    })
  }
  const cancelScheduledFlush = () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId)
      rafId = undefined
    }
  }
  const notifyFirstTrace = (message: AiChatMessage) => {
    if (!message.trace?.length) traceAutoOpenVersion.value++
  }
  // 步骤要按时间顺序插回正文，所以记录它开始时正文已经输出到哪个字符（含还没 flush 的增量）
  const emittedLength = (message: AiChatMessage) => message.content.length + deltaBuffer.reduce((total, chunk) => total + chunk.length, 0)
  const pushTrace = (message: AiChatMessage, step: AiChatTraceStep) => {
    notifyFirstTrace(message)
    if (!message.trace) message.trace = []
    message.trace.push({ ...step, contentIndex: emittedLength(message) })
  }
  const completeRunningTrace = (message: AiChatMessage, status: AiChatTraceStatus, error?: string) => {
    const now = Date.now()
    message.trace?.forEach((step) => {
      if (step.status !== 'running') return
      step.status = status
      step.completedAt = now
      if (error && !step.error) step.error = error
    })
  }
  const findRunningTool = (message: AiChatMessage, name?: string) => {
    const trace = message.trace || []
    return [...trace].reverse().find((step) => step.kind === 'tool' && step.status === 'running' && (!name || step.name === name))
  }

  const handleTraceEvent = (message: AiChatMessage, event: AiChatStreamEvent) => {
    const now = Date.now()
    switch (event.type) {
      case 'intent':
        pushTrace(message, {
          id: createId('trace-'),
          kind: 'intent',
          status: 'done',
          name: 'intent',
          displayName: '意图识别',
          model: event.model,
          output: event.matched.length ? toDisplayText(event.matched) : '已完成请求意图识别',
          startedAt: now,
          completedAt: now
        })
        break
      case 'reasoning': {
        const last = message.trace?.[message.trace.length - 1]
        if (last?.kind === 'reasoning' && last.stage === event.stage && last.status === 'running')
          last.content = `${last.content || ''}${event.text}`.slice(0, MAX_CONTENT_LENGTH)
        else
          pushTrace(message, {
            id: createId('trace-'),
            kind: 'reasoning',
            status: 'running',
            name: event.stage || 'reasoning',
            displayName: getStageName(event.stage),
            stage: event.stage,
            model: event.model,
            content: event.text,
            startedAt: now
          })
        break
      }
      case 'status': {
        if (!event.text || /heartbeat/i.test(event.text)) break
        const last = message.trace?.[message.trace.length - 1]
        if (last?.kind === 'status' && last.stage === event.stage) {
          last.content = event.text
          last.status = 'running'
        } else {
          if (last?.kind === 'reasoning' && last.status === 'running') {
            last.status = 'done'
            last.completedAt = now
          }
          pushTrace(message, {
            id: createId('trace-'),
            kind: 'status',
            status: 'running',
            name: event.stage || 'status',
            displayName: getStageName(event.stage),
            stage: event.stage,
            content: event.text,
            startedAt: now
          })
        }
        break
      }
      case 'tool_start': {
        const last = message.trace?.[message.trace.length - 1]
        if (last && (last.kind === 'reasoning' || last.kind === 'status') && last.status === 'running') {
          last.status = 'done'
          last.completedAt = now
        }
        pushTrace(message, {
          id: createId('trace-'),
          kind: 'tool',
          status: 'running',
          name: event.name,
          displayName: getToolName(event.name, event.displayName),
          args: event.args,
          startedAt: now
        })
        break
      }
      case 'tool_args': {
        const tool = findRunningTool(message, event.name)
        if (tool) tool.args = event.args
        break
      }
      case 'tool_result': {
        const tool = findRunningTool(message, event.name)
        if (tool) {
          tool.output = toDisplayText(event.output)
          tool.error = event.error
          tool.status = event.error ? 'error' : 'done'
          tool.completedAt = now
        }
        break
      }
      case 'plan_generated':
        event.steps.forEach((planStep, index) =>
          pushTrace(message, {
            id: String(planStep.id || createId('plan-')),
            kind: 'plan',
            status: 'pending',
            name: String(planStep.toolName || planStep.tool || ''),
            displayName: String(planStep.description || planStep.name || `步骤 ${index + 1}`),
            model: event.model,
            content: event.goal,
            startedAt: now
          })
        )
        break
      case 'plan_completed':
        message.trace?.forEach((step) => {
          if (step.kind === 'plan' && (step.status === 'pending' || step.status === 'running')) {
            step.status = event.failedSteps ? 'error' : 'done'
            step.completedAt = now
          }
        })
        break
      default:
        break
    }
  }

  const handleStreamEvent = (session: AiChatSession, assistantId: string, event: AiChatStreamEvent) => {
    const message = session.messages.find((item) => item.id === assistantId)
    if (!message) return
    if (event.type === 'session') session.sessionId = event.sessionId
    else if (event.type === 'delta') {
      appendDelta(session, assistantId, event.content)
      scheduleFlushDelta(session, assistantId)
    } else if (event.type === 'done') {
      if (event.sessionId) session.sessionId = event.sessionId
      completeRunningTrace(message, 'done')
      flushDelta(session, assistantId)
      updateAssistant(session, assistantId, { status: 'done', error: undefined })
    } else if (event.type === 'error') throw new Error(event.message || '智能体返回异常')
    else handleTraceEvent(message, event)
  }

  const createAssistantMessage = (session: AiChatSession): AiChatMessage => {
    const assistant: AiChatMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      status: 'pending',
      createdAt: Date.now(),
      agentName: session.agentName,
      trace: []
    }
    session.messages.push(assistant)
    session.selectedAssistantId = assistant.id
    activeAssistantId.value = assistant.id
    streamingSessionId = session.id
    isStreaming.value = true
    isStreamUpdating = true
    manuallyStopped = false
    controller = new AbortController()
    scrollVersion.value++
    return assistant
  }

  const executeStreamRequest = async (session: AiChatSession, assistant: AiChatMessage, prompt: string) => {
    await streamAiChat(
      {
        agentCode: session.agentCode,
        message: prompt,
        userCode: requestUserCode.value,
        sessionId: session.sessionId || undefined,
        stream: true
      },
      { onEvent: (event) => handleStreamEvent(session, assistant.id, event) },
      controller!.signal
    )
  }

  const finalizeMessage = (session: AiChatSession, assistantId: string) => {
    cancelScheduledFlush()
    flushDelta(session, assistantId)
    isStreaming.value = false
    isStreamUpdating = false
    activeAssistantId.value = ''
    streamingSessionId = ''
    controller = null
    updateSession(session)
    persistNow()
  }

  const requestAnswer = async (prompt: string, session: AiChatSession) => {
    const assistant = createAssistantMessage(session)
    try {
      await executeStreamRequest(session, assistant, prompt)
      const current = session.messages.find((message) => message.id === assistant.id)
      if (current && current.status !== 'error' && current.status !== 'cancelled') {
        completeRunningTrace(current, 'done')
        updateAssistant(session, assistant.id, { status: 'done', content: current.content || '智能体未返回内容,请稍后重试。' })
      }
    } catch (error) {
      const current = session.messages.find((message) => message.id === assistant.id)
      if (manuallyStopped || (error instanceof DOMException && error.name === 'AbortError')) {
        if (current) completeRunningTrace(current, 'cancelled')
        const stopReason = manuallyStopped ? '用户手动停止生成' : '请求被浏览器中断'
        updateAssistant(session, assistant.id, { status: 'cancelled', content: current?.content || '已停止生成。', stopReason })
      } else {
        const rawMessage = error instanceof Error ? error.message : '连接智能体失败,请稍后重试。'
        const detailedMessage = `[${new Date().toLocaleTimeString()}] ${rawMessage}`
        if (current) completeRunningTrace(current, 'error', rawMessage)
        updateAssistant(session, assistant.id, { status: 'error', error: detailedMessage, stopReason: rawMessage })
      }
    } finally {
      finalizeMessage(session, assistant.id)
    }
    return assistant.id
  }

  const MAX_AUTO_RETRIES = 2

  const requestAnswerWithRetry = async (prompt: string, session: AiChatSession) => {
    for (let attempt = 0; attempt <= MAX_AUTO_RETRIES; attempt++) {
      // 用本轮生成的消息 id 定位，不能按 role 查找（会命中历史上第一条回答）
      const assistantId = await requestAnswer(prompt, session)
      const assistant = session.messages.find((message) => message.id === assistantId)
      if (!assistant || assistant.status !== 'error') return
      if (attempt === MAX_AUTO_RETRIES) {
        ElMessage.error('自动重试多次仍失败,请手动点击重新生成。')
        return
      }
      ElMessage.info(`请求失败,${1000 * (attempt + 1)}ms 后自动重试...`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      session.messages.splice(session.messages.indexOf(assistant), 1)
    }
  }

  const send = async () => {
    const session = activeSession.value
    const prompt = draft.value.trim()
    if (!session || !prompt || !canSend.value) return
    const userMessage: AiChatMessage = { id: createId(), role: 'user', content: prompt, status: 'done', createdAt: Date.now() }
    if (session.title === '新会话' && session.messages.length === 0) session.title = titleFromMessages([userMessage])
    session.messages.push(userMessage)
    session.draft = ''
    updateSession(session)
    await nextTick()
    scrollVersion.value++
    await requestAnswerWithRetry(prompt, session)
  }
  const retry = async (assistantId: string) => {
    if (sessionLocked.value) return
    const session = activeSession.value
    if (!session) return
    const assistantIndex = session.messages.findIndex((message) => message.id === assistantId)
    if (assistantIndex < 1) return
    const userMessage = [...session.messages.slice(0, assistantIndex)].reverse().find((message) => message.role === 'user')
    if (!userMessage) return
    session.messages.splice(assistantIndex, 1)
    await requestAnswerWithRetry(userMessage.content, session)
  }
  const stop = async () => {
    if (!isStreaming.value) return
    manuallyStopped = true
    controller?.abort()
    const session = sessions.value.find((item) => item.id === streamingSessionId)
    if (session?.sessionId && requestUserCode.value) {
      try {
        await stopAiChat(session.sessionId, requestUserCode.value)
      } catch (error) {
        console.warn('[AI Chat] 停止上游会话失败', error)
      }
    }
  }
  const stopAndNotifyBackend = async () => {
    if (!isStreaming.value) return
    manuallyStopped = true
    controller?.abort()
    const session = sessions.value.find((item) => item.id === streamingSessionId)
    if (session?.sessionId && requestUserCode.value) {
      try {
        await stopAiChat(session.sessionId, requestUserCode.value)
      } catch (error) {
        console.warn('[AI Chat] 停止上游会话失败', error)
      }
    }
  }
  const clear = async () => {
    if (isStreaming.value) await stop()
    const session = activeSession.value
    if (!session) return
    session.messages = []
    session.draft = ''
    session.sessionId = ''
    session.title = '新会话'
    session.selectedAssistantId = ''
    updateSession(session)
    scrollVersion.value++
  }
  const selectAssistant = (messageId: string) => {
    if (messages.value.some((message) => message.id === messageId && message.role === 'assistant') && activeSession.value) {
      activeSession.value.selectedAssistantId = messageId
    }
  }
  const selectAgent = (agentCode: string) => {
    if (sessionLocked.value) return
    const session = activeSession.value
    const agent = agentOptions.value.find((item) => item.code === agentCode)
    if (!session || !agent || session.agentCode === agent.code) return
    session.agentCode = agent.code
    session.agentName = agent.name
    session.sessionId = ''
    updateSession(session)
  }
  const guardSessionAction = () => {
    if (!sessionLocked.value) return true
    ElMessage.info('回答生成中，请先停止生成后再切换会话。')
    return false
  }
  const newSession = async () => {
    if (!guardSessionAction()) return
    const session = createSession()
    const defaultAgent = agentOptions.value[0]
    if (defaultAgent) {
      session.agentCode = defaultAgent.code
      session.agentName = defaultAgent.name
    }
    const retained = [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS - 1)
    sessions.value = [session, ...retained]
    activeSessionId.value = session.id
    scrollVersion.value++
  }
  const selectSession = (id: string) => {
    if (id === activeSessionId.value || !guardSessionAction()) return
    const session = sessions.value.find((item) => item.id === id)
    if (!session) return
    activeSessionId.value = id
    session.selectedAssistantId =
      session.selectedAssistantId || [...session.messages].reverse().find((message) => message.role === 'assistant')?.id || ''
    scrollVersion.value++
  }
  const renameSession = (id: string, title: string) => {
    const session = sessions.value.find((item) => item.id === id)
    const nextTitle = title.replace(/\s+/g, ' ').trim().slice(0, 80)
    if (!session || !nextTitle || !guardSessionAction()) return
    session.title = nextTitle
    updateSession(session)
  }
  const deleteSession = async (id: string) => {
    if (!guardSessionAction()) return
    if (sessions.value.length === 1) {
      await clear()
      return
    }
    const index = sessions.value.findIndex((item) => item.id === id)
    if (index < 0) return
    sessions.value.splice(index, 1)
    if (id === activeSessionId.value) {
      activeSessionId.value = sessions.value[Math.max(0, index - 1)]?.id || sessions.value[0].id
      scrollVersion.value++
    }
  }

  onBeforeUnmount(() => {
    if (persistTimer) window.clearTimeout(persistTimer)
    persistNow()
    if (isStreaming.value) {
      void stopAndNotifyBackend()
    }
    controller?.abort()
  })

  return {
    sessions: orderedSessions,
    activeSessionId,
    activeSession,
    messages,
    draft,
    isStreaming,
    sessionLocked,
    activeAssistantId,
    selectedAssistantId,
    selectedTraceMessage,
    userCode: currentUserKey,
    identityError,
    chatConfigured,
    agentOptions,
    selectedAgentCode,
    canSend,
    scrollVersion,
    traceAutoOpenVersion,
    send,
    retry,
    stop,
    clear,
    selectAssistant,
    selectAgent,
    newSession,
    selectSession,
    renameSession,
    deleteSession
  }
}
