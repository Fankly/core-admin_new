/** 当前支持的文件类型；word/excel 是便于业务侧使用的分组别名。 */
export type OfficeFileType = 'pdf' | 'word' | 'excel' | 'docx' | 'xlsx' | 'xls' | 'et' | 'doc'

/** 组件最终使用的渲染器类型。 */
export type OfficeRendererType = 'pdf' | 'word' | 'excel'

/**
 * 可预览的数据源。
 *
 * 鉴权下载接口建议先按 Blob 请求，再把 Blob 传给组件；公开地址可直接传 URL。
 * Word/Excel 由 @file-viewer 渲染；PDF 走浏览器 iframe。
 */
export type OfficePreviewSource = string | File | Blob | ArrayBuffer | Uint8Array | null | undefined

/** 浏览器内置 PDF 查看器的初始视图参数。未传入时保留浏览器默认行为。 */
export interface OfficePdfOptions {
  pageMode?: 'none' | 'thumbs' | 'bookmarks' | 'attachments' | 'fullscreen'
  zoom?: number | 'auto' | 'page-fit' | 'page-width' | 'page-height'
}

/** @file-viewer 工具栏配置；可按业务场景仅开放需要的操作。 */
export interface OfficeToolbarOptions {
  download?: boolean
  print?: boolean
  exportHtml?: boolean
  zoom?: boolean
  search?: boolean
  theme?: boolean
  position?: 'auto' | 'top' | 'top-center' | 'bottom-right'
  /** 允许透传引擎新增的工具栏字段，同时满足 file-viewer 的 Record<string, unknown> 约束 */
  [key: string]: unknown
}

/** 透传给 file-viewer docx 选项（@file-viewer/renderer-word）。 */
export type OfficeDocxOptions = Record<string, unknown>

/**
 * 透传给 file-viewer spreadsheet 选项（@file-viewer/renderer-spreadsheet）。
 */
export interface OfficeExcelOptions {
  worker?: boolean | 'auto'
  workerUrl?: string
  workerAutoThreshold?: number
  textEncoding?: 'auto' | 'utf-8' | 'gbk' | 'gb18030'
  resizableColumns?: boolean
  resizableRows?: boolean
  [key: string]: unknown
}

export interface OfficePreviewProps {
  /** URL、File、Blob、ArrayBuffer 或 Uint8Array。 */
  src?: OfficePreviewSource
  /** 无扩展名 URL 或 Blob 建议显式传入；支持 word/excel 分组别名。 */
  fileType?: OfficeFileType
  /** 用于推断文件类型，优先级低于 fileType。 */
  fileName?: string
  /** 组件容器高度；父容器没有明确高度时可直接传 px。 */
  height?: string | number
  emptyText?: string
  /** src 为 URL 时透传给 fetch，例如 headers、credentials。 */
  requestOptions?: RequestInit
  /** 透传给 file-viewer docx 选项（worker 默认关闭，免拷贝静态资源）。 */
  docxOptions?: OfficeDocxOptions
  /** 透传给 file-viewer spreadsheet 选项。 */
  excelOptions?: OfficeExcelOptions
  /** 浏览器内置 PDF 查看器的初始视图参数。 */
  pdfOptions?: OfficePdfOptions
  /** file-viewer 工具栏开关或操作配置；默认关闭，贴近嵌入式预览。 */
  toolbar?: boolean | OfficeToolbarOptions
}

export interface OfficePreviewEmits {
  (event: 'loading-change', loading: boolean): void
  (event: 'rendered', type: OfficeRendererType): void
  (event: 'error', error: Error): void
}

export interface OfficePreviewInstance {
  reload: () => Promise<void>
}

/** spreadsheet 引擎原生可识别的表格扩展名（不含 WPS .et）。 */
export const SPREADSHEET_NATIVE_EXTS = ['xlsx', 'xls', 'xlsm', 'xlsb', 'xltx', 'xlt', 'xltm', 'csv', 'tsv', 'ods', 'fods', 'numbers'] as const

export type SpreadsheetNativeExt = (typeof SPREADSHEET_NATIVE_EXTS)[number]

export const isSpreadsheetNativeExt = (ext?: string): ext is SpreadsheetNativeExt =>
  !!ext && (SPREADSHEET_NATIVE_EXTS as readonly string[]).includes(ext)

/** Word 相关扩展名（含旧版二进制与模板）。 */
export const WORD_NATIVE_EXTS = ['doc', 'docx', 'docm', 'dot', 'dotx'] as const

export type WordNativeExt = (typeof WORD_NATIVE_EXTS)[number]

export const isWordNativeExt = (ext?: string): ext is WordNativeExt => !!ext && (WORD_NATIVE_EXTS as readonly string[]).includes(ext)

/**
 * 按存储容器划分扩展名。
 * 后端做格式转换时常沿用原扩展名（例如把 doc 转成 docx / pdf 后文件名仍是 .doc），
 * 组件需要用文件头容器纠正扩展名，否则会用错渲染器。
 */
export const ZIP_WORD_EXTS = ['docx', 'docm', 'dotx'] as const
export const OLE_WORD_EXTS = ['doc', 'dot'] as const
export const ZIP_SPREADSHEET_EXTS = ['xlsx', 'xlsm', 'xlsb', 'xltx', 'xltm', 'ods'] as const
export const OLE_SPREADSHEET_EXTS = ['xls', 'xlt'] as const

const includesExt = (list: readonly string[], ext?: string) => !!ext && list.includes(ext)

/** OpenXML（ZIP 容器）Word 扩展名 */
export const isZipWordExt = (ext?: string) => includesExt(ZIP_WORD_EXTS, ext)
/** 旧版二进制（OLE 容器）Word 扩展名 */
export const isOleWordExt = (ext?: string) => includesExt(OLE_WORD_EXTS, ext)
/** OpenXML / ODF（ZIP 容器）表格扩展名 */
export const isZipSpreadsheetExt = (ext?: string) => includesExt(ZIP_SPREADSHEET_EXTS, ext)
/** 旧版二进制（OLE 容器）表格扩展名 */
export const isOleSpreadsheetExt = (ext?: string) => includesExt(OLE_SPREADSHEET_EXTS, ext)
