/**
 * TypeScript 4.3 类型入口（仅类型检查用）。
 * 运行时由 vite.config.ts resolve.alias 指向 node_modules 真包。
 * 官方 d.ts 含 `import { type X }`（需 TS≥4.5），不可直接引用。
 */
import type {
  FileViewerController,
  FileViewerCoreOptions,
  FileViewerDocxOptions,
  FileViewerFileRef,
  FileViewerMountOptions,
  FileViewerMountViewer,
  FileViewerOptions,
  FileViewerSpreadsheetOptions,
  FileViewerState,
  FileViewerStateListener
} from '@/components/OfficePreview/fileViewerTypes'

export type ViewerController = FileViewerController
export type ViewerCoreOptions = FileViewerCoreOptions
export type ViewerDocxOptions = FileViewerDocxOptions
export type FileRef = FileViewerFileRef
export type ViewerMountOptions = FileViewerMountOptions
export type ViewerOptions = FileViewerOptions
export type ViewerSpreadsheetOptions = FileViewerSpreadsheetOptions
export type ViewerState = FileViewerState
export type ViewerStateListener = FileViewerStateListener
export type { FileViewerMountViewer }

/** 值导出占位，满足 import { mountViewer } 的类型；运行时被 Vite alias 替换 */
export declare const mountViewer: FileViewerMountViewer
