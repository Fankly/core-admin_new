/**
 * 动态加载 file-viewer，避免路由首屏同步拉整包。
 *
 * 类型经 tsconfig paths 映射到 src/types/file-viewer/*（TS 4.3 兼容）。
 * 运行时经 vite resolve.alias 解析到 node_modules 真包。
 */
import type { FileViewerModules, FileViewerMountViewer } from './fileViewerTypes'

let fileViewerModulesPromise: Promise<FileViewerModules> | null = null

export const loadFileViewerModules = (): Promise<FileViewerModules> => {
  if (!fileViewerModulesPromise) {
    fileViewerModulesPromise = Promise.all([
      import('@file-viewer/core/browser'),
      import('@file-viewer/renderer-word'),
      import('@file-viewer/renderer-spreadsheet')
    ])
      .then(([core, word, spreadsheet]) => {
        const mountViewer = (core as { mountViewer: FileViewerMountViewer }).mountViewer
        const wordRenderer = (word as { default: unknown }).default
        const spreadsheetRenderer = (spreadsheet as { default: unknown }).default
        if (typeof mountViewer !== 'function' || !wordRenderer || !spreadsheetRenderer) {
          throw new Error('file-viewer 模块加载失败')
        }
        return {
          mountViewer,
          wordRenderer,
          spreadsheetRenderer
        }
      })
      .catch((error: unknown) => {
        // Chunk/network failures can be transient. Do not cache a rejected promise,
        // otherwise the exposed reload() can never recover without a full refresh.
        fileViewerModulesPromise = null
        throw error
      })
  }
  return fileViewerModulesPromise
}
