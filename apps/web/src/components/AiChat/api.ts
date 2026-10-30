import { AiChatRequest, AiChatStreamEvent } from './types'
import { aiChatConfig } from './config'

interface StreamCallbacks {
  onEvent: (event: AiChatStreamEvent) => void
}

const requestHeaders = (accept = 'application/json', json = true): HeadersInit => {
  return {
    Accept: accept,
    'X-Requested-With': 'XMLHttpRequest',
    ...(json ? { 'Content-Type': 'application/json;charset=UTF-8' } : {})
  }
}

const getErrorMessage = async (response: Response) => {
  const fallback = `请求失败（${response.status}）`
  try {
    const payload = await response.clone().json()
    return payload.errorMessage || payload.message || payload.msg || fallback
  } catch {
    const text = await response.text()
    return text || fallback
  }
}

const getString = (payload: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value) return value
  }
  return ''
}

const getPayload = (payload: Record<string, any>) => (payload.data && typeof payload.data === 'object' ? payload.data : payload)

const hasOwn = (payload: Record<string, any>, key: string) => Object.prototype.hasOwnProperty.call(payload, key)

const inferEventType = (eventName: string, payload: Record<string, any>, data: Record<string, any>) => {
  const explicitType = payload.type || payload.event || data.type || data.event
  if (explicitType) return String(explicitType).toLowerCase()

  const namedEvent = eventName.toLowerCase()
  if (namedEvent && namedEvent !== 'message') return namedEvent

  // Some deployments omit the SSE `event:` line. Match the payload shapes used by the agent platform.
  if (hasOwn(data, 'token')) return 'token'
  if (Array.isArray(data.matched)) return 'intent_result'
  if (hasOwn(data, 'exitReason') || hasOwn(data, 'apiCalls')) return 'done'
  if (hasOwn(data, 'planId') && Array.isArray(data.steps)) return 'plan_generated'
  if (hasOwn(data, 'completedSteps') || hasOwn(data, 'failedSteps')) return 'plan_completed'
  if (getString(data, ['name', 'toolName'])) {
    if (hasOwn(data, 'output') || hasOwn(data, 'error')) return 'tool_result'
    if (hasOwn(data, 'displayName') || hasOwn(data, 'display_name')) return 'tool_start'
    if (hasOwn(data, 'args')) return 'tool_args'
  }
  if (getString(data, ['sessionId', 'session_id']) && Object.keys(data).length === 1) return 'session'
  if (hasOwn(data, 'text')) return getString(data, ['stage']) && getString(data, ['model']) ? 'reasoning' : 'status'
  if (hasOwn(data, 'errorMessage') || hasOwn(data, 'message') || hasOwn(data, 'msg')) return 'server_error'
  return namedEvent
}

const normalizeEvent = (eventName: string, rawData: string): AiChatStreamEvent[] => {
  const name = eventName.toLowerCase()
  if (rawData === '[DONE]') return [{ type: 'done' }]

  let payload: Record<string, any> | null = null
  try {
    const parsed = JSON.parse(rawData)
    payload = typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    payload = null
  }

  if (!payload) return rawData && name === 'message' ? [{ type: 'delta', content: rawData }] : []

  const data = getPayload(payload)
  const type = inferEventType(name, payload, data)
  const sessionId = getString(data, ['sessionId', 'session_id']) || getString(payload, ['sessionId', 'session_id'])

  switch (type) {
    case 'token':
      return getString(data, ['token']) ? [{ type: 'delta', content: getString(data, ['token']) }] : []
    case 'delta':
    case 'content':
      return getString(data, ['delta', 'content', 'answer', 'output', 'text'])
        ? [{ type: 'delta', content: getString(data, ['delta', 'content', 'answer', 'output', 'text']) }]
        : []
    case 'intent_result':
      return [{ type: 'intent', matched: Array.isArray(data.matched) ? data.matched : [], model: getString(data, ['model']) }]
    case 'reasoning':
      return [{ type: 'reasoning', text: getString(data, ['text', 'content']), stage: getString(data, ['stage']), model: getString(data, ['model']) }]
    case 'status':
      return [{ type: 'status', text: getString(data, ['text', 'status']), stage: getString(data, ['stage']) }]
    case 'tool_start':
      return [
        {
          type: 'tool_start',
          name: getString(data, ['name', 'toolName']),
          displayName: getString(data, ['displayName', 'display_name']),
          args: data.args,
          index: typeof data.idx === 'number' ? data.idx : typeof data._idx === 'number' ? data._idx : undefined
        }
      ]
    case 'tool_args':
      return [{ type: 'tool_args', name: getString(data, ['name', 'toolName']), args: data.args }]
    case 'tool_result':
      return [
        {
          type: 'tool_result',
          name: getString(data, ['name', 'toolName']),
          output: data.output,
          error: getString(data, ['error', 'errorMessage', 'message'])
        }
      ]
    case 'plan_generated':
      return [
        {
          type: 'plan_generated',
          planId: getString(data, ['planId', 'plan_id']),
          goal: getString(data, ['goal']),
          steps: Array.isArray(data.steps) ? data.steps : [],
          model: getString(data, ['model'])
        }
      ]
    case 'plan_completed':
      return [
        {
          type: 'plan_completed',
          status: getString(data, ['status']),
          completedSteps: Number(data.completedSteps || 0),
          failedSteps: Number(data.failedSteps || 0)
        }
      ]
    case 'session':
      return sessionId ? [{ type: 'session', sessionId }] : []
    case 'done':
    case 'finish':
    case 'finished':
    case 'end':
      return [{ type: 'done', sessionId: sessionId || undefined, model: getString(data, ['model']) || undefined }]
    case 'server_error':
    case 'error':
      return [{ type: 'error', message: getString(data, ['errorMessage', 'error', 'message', 'msg']) || '智能体返回异常' }]
    case 'heartbeat':
      return []
    default:
      break
  }

  const events: AiChatStreamEvent[] = []
  if (sessionId) events.push({ type: 'session', sessionId })
  const content = getString(data, ['delta', 'content', 'answer', 'output'])
  if (content) events.push({ type: 'delta', content })
  if (payload.done === true || data.done === true) events.push({ type: 'done', sessionId: sessionId || undefined })
  return events
}

const consumeEventBlock = (block: string, callback: StreamCallbacks['onEvent']) => {
  if (!block.trim()) return
  let eventName = 'message'
  const data: string[] = []
  block.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
  })
  normalizeEvent(eventName, data.join('\n')).forEach(callback)
}

export const streamAiChat = async (request: AiChatRequest, callbacks: StreamCallbacks, signal: AbortSignal) => {
  const response = await fetch(aiChatConfig.streamUrl, {
    method: 'POST',
    headers: requestHeaders('text/event-stream'),
    body: JSON.stringify(request),
    signal
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  if (!response.body) throw new Error('浏览器未收到可读取的流式响应')

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  // 只包裹 reader.read()：事件消费（onEvent）抛出的是业务异常（如服务端 error 事件），
  // 不能被包装成“流式读取中断”，否则真实原因会被掩盖。
  const readChunk = async () => {
    try {
      return await reader.read()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      const detail = error instanceof Error ? error.message : String(error)
      throw new Error(`流式读取中断: ${detail}`)
    }
  }

  try {
    while (true) {
      const { value, done } = await readChunk()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() || ''
      blocks.forEach((block) => consumeEventBlock(block, callbacks.onEvent))
      if (done) break
    }
    if (buffer.trim()) consumeEventBlock(buffer, callbacks.onEvent)
  } catch (error) {
    // 提前退出时释放响应体，避免连接与上游定时器悬挂
    reader.cancel().catch(() => undefined)
    throw error
  }
}

export const stopAiChat = async (sessionId: string, userCode: string) => {
  const response = await fetch(aiChatConfig.stopUrl, {
    method: 'POST',
    headers: requestHeaders(),
    body: JSON.stringify({ sessionId, userCode })
  })
  if (!response.ok) throw new Error(await getErrorMessage(response))
}
