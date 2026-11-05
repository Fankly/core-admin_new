/**
 * OfficePreview 用到的 file-viewer 类型面。
 * 不直接 import 官方 .d.ts：@file-viewer 使用 `import { type X }`（需 TS ≥4.5），
 * 本项目 TypeScript 4.3 会在解析阶段报 TS1005。
 */

export interface FileViewerState {
  loading: boolean
  ready: boolean
  error: unknown | null
}

export type FileViewerStateListener = (state: FileViewerState) => void

export interface FileViewerDocxOptions {
  worker?: boolean
  workerUrl?: string
  [key: string]: unknown
}

export interface FileViewerSpreadsheetOptions {
  worker?: boolean | 'auto'
  workerUrl?: string
  workerAutoThreshold?: number
  textEncoding?: 'auto' | 'utf-8' | 'gbk' | 'gb18030'
  resizableColumns?: boolean
  resizableRows?: boolean
  [key: string]: unknown
}

export interface FileViewerOptions {
  theme?: string
  styleIsolation?: string
  locale?: string
  rendererMode?: string
  builtinRenderers?: string
  autoRenderers?: boolean | Record<string, unknown>
  toolbar?: boolean | Record<string, unknown>
  docx?: FileViewerDocxOptions
  spreadsheet?: FileViewerSpreadsheetOptions
  renderers?: unknown
  [key: string]: unknown
}

export type FileViewerFileRef = File | Blob | ArrayBuffer

export interface FileViewerMountOptions {
  url?: string
  file?: FileViewerFileRef
  buffer?: ArrayBuffer
  name?: string
  filename?: string
  type?: string
  size?: number
  options?: FileViewerOptions
}

export interface FileViewerCoreOptions {
  onError?: (error: unknown, source?: unknown) => void
}

export interface FileViewerController {
  readonly container: Element
  load(options: FileViewerMountOptions): Promise<void>
  update(options?: FileViewerMountOptions): Promise<void>
  reload(): Promise<void>
  destroy(): void
  getState(): FileViewerState
  subscribe(listener: FileViewerStateListener): () => void
}

export type FileViewerMountViewer = (
  container: Element,
  initialOptions?: FileViewerMountOptions,
  coreOptions?: FileViewerCoreOptions
) => FileViewerController

export interface FileViewerModules {
  mountViewer: FileViewerMountViewer
  wordRenderer: unknown
  spreadsheetRenderer: unknown
}
