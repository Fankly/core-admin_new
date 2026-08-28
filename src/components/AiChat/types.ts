export type AiChatRole = 'user' | 'assistant'

export type AiChatMessageStatus = 'pending' | 'streaming' | 'done' | 'error' | 'cancelled'
export type AiChatTraceStatus = 'pending' | 'running' | 'done' | 'error' | 'cancelled'
export type AiChatTraceKind = 'intent' | 'reasoning' | 'status' | 'plan' | 'tool'

export interface AiChatTraceStep {
  id: string
  kind: AiChatTraceKind
  status: AiChatTraceStatus
  name: string
  displayName: string
  stage?: string
  model?: string
  content?: string
  args?: unknown
  output?: string
  error?: string
  startedAt: number
  completedAt?: number
  /** 步骤开始时已输出的正文长度，用来把步骤按时间顺序插回聊天流；旧缓存没有该字段时按 0 处理 */
  contentIndex?: number
}

export interface AiChatMessage {
  id: string
  role: AiChatRole
  content: string
  status: AiChatMessageStatus
  createdAt: number
  error?: string
  stopReason?: string
  agentName?: string
  trace?: AiChatTraceStep[]
  traceDetailsExpired?: boolean
}

export interface AiChatSession {
  id: string
  title: string
  sessionId: string
  agentCode: string
  agentName: string
  messages: AiChatMessage[]
  draft: string
  selectedAssistantId: string
  createdAt: number
  updatedAt: number
}

export interface AiChatAgentOption {
  code: string
  name: string
}

export type AiChatStreamEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'delta'; content: string }
  | { type: 'done'; sessionId?: string; model?: string }
  | { type: 'error'; message: string }
  | { type: 'intent'; matched: unknown[]; model?: string }
  | { type: 'reasoning'; text: string; stage?: string; model?: string }
  | { type: 'status'; text: string; stage?: string }
  | { type: 'tool_start'; name: string; displayName?: string; args?: unknown; index?: number }
  | { type: 'tool_args'; name: string; args: unknown }
  | { type: 'tool_result'; name?: string; output?: unknown; error?: string }
  | { type: 'plan_generated'; planId?: string; goal?: string; steps: Array<Record<string, any>>; model?: string }
  | { type: 'plan_completed'; status?: string; completedSteps?: number; failedSteps?: number }

export interface AiChatRequest {
  agentCode: string
  message: string
  userCode: string
  sessionId?: string
  stream: true
}

export interface AiChatWorkspaceCache {
  version: 2
  activeSessionId: string
  sessions: AiChatSession[]
}

export interface AiChatPanelGeometry {
  x: number
  y: number
  width: number
  height: number
}
