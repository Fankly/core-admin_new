export interface ConfigItemOption {
  tag?: string
  label?: string
  slot?: boolean
  itemSlot?: string
  value?: unknown
  attrs?: Record<string, unknown> & {
    placeholder?: string
    props?: Record<string, unknown>
  }
  listeners?: Record<string, (...args: unknown[]) => unknown>
  getAttrs?: (model: unknown) => Record<string, unknown>
  [key: string]: unknown
}
export interface ResolvedOption {
  tag: string
  attrs: Record<string, unknown> & {
    placeholder?: string
  }
  listeners?: Record<string, (...args: unknown[]) => unknown>
  slot?: boolean
  itemSlot?: string
  value?: unknown
  label?: string
}
