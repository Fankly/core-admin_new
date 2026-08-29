import Mock from 'mockjs'
import aiChatResponse from '../fixtures/ai-chat-response.sse?raw'

interface AiChatMockRequest {
  agentCode?: string
  message?: string
  userCode?: string
  sessionId?: string
  stream?: boolean
}

interface ActiveSession {
  stop: () => void
}

// 与 src/components/AiChat/config.ts 的 agentCodeCommonCode / userCodeCommonCode 保持一致，
// 否则下面的 commonCode/getData 正则匹配不上，chatConfigured 为 false，聊天入口不会渲染
const AGENT_CODE_COMMON_CODE = 'AI_AGENT_CODE'
const USER_CODE_COMMON_CODE = 'AI_USER_CODE'
const STREAM_PATH = /\/ai\/agent\/zban\/chat\/stream\/?$/
const STOP_PATH = /\/ai\/agent\/zban\/chat\/stop\/?$/
const encoder = new TextEncoder()
const activeSessions = new Map<string, ActiveSession>()
const nativeFetch = window.fetch.bind(window)

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
  })

const parseRequestBody = async (input: RequestInfo, init?: RequestInit): Promise<Record<string, any>> => {
  const rawBody = init?.body
  if (input instanceof Request && rawBody === undefined) return input.clone().json()
  if (typeof rawBody !== 'string') return {}
  return JSON.parse(rawBody) as Record<string, any>
}

const createSessionId = () => `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const sseEvent = (payload: unknown) => `data:${JSON.stringify(payload)}\n\n`

const donePayload = (sessionId: string) => ({
  model: 'Mock-Agent',
  apiCalls: 1,
  exitReason: 'stream_completed',
  sessionId
})

const fixturePayloads = aiChatResponse
  .split(/\r?\n\r?\n/)
  .map((block) => block.match(/^data:\s*(.+)$/m)?.[1])
  .filter((data): data is string => Boolean(data))
  .map((data) => JSON.parse(data) as Record<string, any>)

const prepareFixturePayloads = (message: string, sessionId: string) => {
  const withoutTrace = /无步骤|纯文本|no trace/i.test(message)
  const toolFailed = /工具失败|tool fail/i.test(message)
  let failedToolInjected = false

  return fixturePayloads
    .filter((payload) => !withoutTrace || 'sessionId' in payload || 'token' in payload || 'exitReason' in payload)
    .map((payload) => {
      const current = payload.sessionId ? { ...payload, sessionId } : { ...payload }
      if (toolFailed && !failedToolInjected && current.name && ('output' in current || 'error' in current)) {
        failedToolInjected = true
        return { ...current, output: '', error: '模拟工具连接失败，请稍后重试。' }
      }
      return current
    })
}

const createStreamResponse = (request: Required<AiChatMockRequest>, signal?: AbortSignal) => {
  const sessionId = request.sessionId || createSessionId()
  const shouldFail = /模拟错误|接口异常|stream error/i.test(request.message)
  const shouldReturnEmpty = /空响应|empty response/i.test(request.message)
  const delayMultiplier = /慢速|slow/i.test(request.message) ? 5 : 1
  const payloads = shouldReturnEmpty ? [{ sessionId }, donePayload(sessionId)] : prepareFixturePayloads(request.message, sessionId)
  if (shouldFail) payloads.splice(2, 0, { message: '模拟服务异常，请点击“重新生成”重试。' })
  let timer: number | undefined
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = () => {
        if (timer !== undefined) window.clearTimeout(timer)
        activeSessions.delete(sessionId)
        signal?.removeEventListener('abort', abort)
      }
      const close = () => {
        if (closed) return
        closed = true
        cleanup()
        controller.close()
      }
      const abort = () => {
        if (closed) return
        closed = true
        cleanup()
        controller.error(new DOMException('The operation was aborted.', 'AbortError'))
      }
      const enqueue = (event: string, payload: unknown) => {
        if (!closed) controller.enqueue(encoder.encode(sseEvent(payload)))
      }

      activeSessions.set(sessionId, {
        stop: () => {
          enqueue('done', donePayload(sessionId))
          close()
        }
      })
      signal?.addEventListener('abort', abort, { once: true })
      let index = 0
      const batchSize = 32
      const pushNext = () => {
        if (closed) return
        const next = payloads.slice(index, index + batchSize)
        if (!next.length) return close()
        index += next.length
        next.forEach((payload) => enqueue('', payload))
        if (shouldFail && index >= 3) return close()
        timer = window.setTimeout(pushNext, 12 * delayMultiplier)
      }
      pushNext()
    },
    cancel() {
      if (timer !== undefined) window.clearTimeout(timer)
      activeSessions.delete(sessionId)
      closed = true
    }
  })

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream;charset=UTF-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Ai-Chat-Mock': 'true' }
  })
}

const handleStream = async (input: RequestInfo, init?: RequestInit) => {
  let request: AiChatMockRequest
  try {
    request = (await parseRequestBody(input, init)) as AiChatMockRequest
  } catch {
    return jsonResponse({ message: '请求体不是有效的 JSON' }, 400)
  }
  const missing = ['agentCode', 'message', 'userCode'].filter((key) => !String(request[key as keyof AiChatMockRequest] || '').trim())
  if (missing.length) return jsonResponse({ message: `缺少必填参数：${missing.join('、')}` }, 400)
  if (request.stream !== true) return jsonResponse({ message: 'stream 必须为 true' }, 400)
  if (init?.signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError')
  return createStreamResponse(request as Required<AiChatMockRequest>, init?.signal || undefined)
}

const handleStop = async (input: RequestInfo, init?: RequestInit) => {
  let request: Record<string, any>
  try {
    request = await parseRequestBody(input, init)
  } catch {
    return jsonResponse({ message: '请求体不是有效的 JSON' }, 400)
  }
  const sessionId = String(request.sessionId || '').trim()
  const userCode = String(request.userCode || '').trim()
  if (!sessionId || !userCode) return jsonResponse({ message: 'sessionId 和 userCode 不能为空' }, 400)
  activeSessions.get(sessionId)?.stop()
  return jsonResponse({ code: 0, success: true, message: '会话已停止', data: { sessionId } })
}

Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${AGENT_CODE_COMMON_CODE}(?:&|$)`), 'get', () => ({
  code: 0,
  success: true,
  msg: 'success',
  data: [
    { code: 'MOCK_SU_DIAN_ZHI_BAN', name: '预算助手' },
    { code: 'MOCK_BUDGET_ASSISTANT', name: '预算助手' },
    { code: 'MOCK_AUDIT_ASSISTANT', name: '审核助手' }
  ]
}))
Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${USER_CODE_COMMON_CODE}(?:&|$)`), 'get', () => ({
  code: 0,
  success: true,
  msg: 'success',
  data: [{ code: 'MOCK_AI_CHAT_USER', name: '智伴公共用户' }]
}))

window.fetch = async (input: RequestInfo, init?: RequestInit) => {
  const requestUrl = input instanceof Request ? input.url : String(input)
  const { pathname } = new URL(requestUrl, window.location.href)
  const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
  if (method === 'POST' && STREAM_PATH.test(pathname)) return handleStream(input, init)
  if (method === 'POST' && STOP_PATH.test(pathname)) return handleStop(input, init)
  return nativeFetch(input, init)
}

export {}
