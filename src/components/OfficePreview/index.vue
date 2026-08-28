<template>
  <div class="office-preview" :class="rootClass" :style="containerStyle" v-loading="loading">
    <!-- PDF：浏览器内置预览（iframe + blob URL），不引入 PDF 渲染依赖 -->
    <iframe
      v-if="pdfObjectUrl && rendererType === 'pdf'"
      :key="`pdf-${renderKey}`"
      class="office-preview__pdf"
      :src="pdfIframeSource"
      title="PDF 预览"
      @load="handlePdfRendered"
    />
    <!-- Word/Excel：@file-viewer（renderer-word / renderer-spreadsheet） -->
    <div v-show="isOfficeRenderer" ref="viewerHostRef" class="office-preview__viewer" />
    <el-empty v-if="showEmpty" key="office-preview-empty" :description="errorMessage || emptyText" />
  </div>
</template>

<script setup lang="ts" name="OfficePreview">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getOfficeFileExtension } from './fileExtension'
import { loadFileViewerModules } from './fileViewerLoader'
import type { FileViewerController, FileViewerModules, FileViewerMountOptions, FileViewerOptions, FileViewerState } from './fileViewerTypes'
import { isOleSpreadsheetExt, isOleWordExt, isSpreadsheetNativeExt, isWordNativeExt, isZipSpreadsheetExt, isZipWordExt } from './types'
import type {
  OfficeDocxOptions,
  OfficeExcelOptions,
  OfficeFileType,
  OfficePdfOptions,
  OfficePreviewSource,
  OfficeRendererType,
  OfficeToolbarOptions
} from './types'

interface LoadedSource {
  /** Word/Excel 优先保留 Blob，避免整文件再读成 ArrayBuffer 造成双份内存 */
  buffer?: ArrayBuffer
  blob?: Blob
  name?: string
  mime?: string
  byteLength: number
}

interface ActiveViewer {
  sequence: number
  controller: FileViewerController
  unsubscribe: (() => void) | null
}

// Keep this interface local: the Vue 3.1 SFC compiler used by this project
// cannot resolve an imported interface passed directly to defineProps<T>().
interface OfficePreviewComponentProps {
  src?: OfficePreviewSource
  fileType?: OfficeFileType
  fileName?: string
  height?: string | number
  emptyText?: string
  requestOptions?: RequestInit
  docxOptions?: OfficeDocxOptions
  excelOptions?: OfficeExcelOptions
  pdfOptions?: OfficePdfOptions
  toolbar?: boolean | OfficeToolbarOptions
}

// Keep emits local for the same Vue 3.1 compiler limitation as props above.
interface OfficePreviewComponentEmits {
  (event: 'loading-change', loading: boolean): void
  (event: 'rendered', type: OfficeRendererType): void
  (event: 'error', error: Error): void
}

/** 浏览器内整文件预览上限，超过则提示，避免标签页 OOM */
const MAX_PREVIEW_BYTES = 30 * 1024 * 1024

const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08]
]
const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]
const HEADER_READ_LENGTH = OLE_SIGNATURE.length

const props = withDefaults(defineProps<OfficePreviewComponentProps>(), {
  height: '100%',
  emptyText: '暂无可预览文件',
  // toolbar 允许对象值，withDefaults 对含对象的联合类型只接受工厂函数
  toolbar: () => false
})

const emit = defineEmits<OfficePreviewComponentEmits>()

const loading = ref(false)
const errorMessage = ref('')
const rendererType = ref<OfficeRendererType | null>(null)
const pdfObjectUrl = ref<string | null>(null)
const renderKey = ref(0)
const requestSequence = ref(0)
const viewerHostRef = ref<HTMLElement | null>(null)

let activeController: AbortController | null = null
let activeViewer: ActiveViewer | null = null
let lastRenderedSequence = 0

const isOfficeRenderer = computed(() => rendererType.value === 'word' || rendererType.value === 'excel')
const showEmpty = computed(() => !pdfObjectUrl.value && !isOfficeRenderer.value)

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const assertPreviewSize = (byteLength: number) => {
  if (byteLength > MAX_PREVIEW_BYTES) {
    throw new Error(`文件过大（${formatFileSize(byteLength)}），超过 ${formatFileSize(MAX_PREVIEW_BYTES)} 预览上限，请下载后本地查看`)
  }
}

const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

const rootClass = computed(() => ({
  'office-preview--pdf': rendererType.value === 'pdf',
  'office-preview--word': rendererType.value === 'word',
  'office-preview--excel': rendererType.value === 'excel'
}))

const buildPdfFragment = (options?: OfficePdfOptions) => {
  if (!options) return ''
  const params = new URLSearchParams()
  if (options.pageMode) params.set('pagemode', options.pageMode)
  if (options.zoom !== undefined) params.set('zoom', String(options.zoom))
  const fragment = params.toString()
  return fragment ? `#${fragment}` : ''
}

const pdfIframeSource = computed(() => {
  if (!pdfObjectUrl.value || rendererType.value !== 'pdf') return undefined
  return `${pdfObjectUrl.value}${buildPdfFragment(props.pdfOptions)}`
})

const startsWith = (bytes: Uint8Array, signature: number[]) => signature.every((value, index) => bytes[index] === value)
const isZip = (bytes: Uint8Array) => ZIP_SIGNATURES.some((signature) => startsWith(bytes, signature))
const isOle = (bytes: Uint8Array) => startsWith(bytes, OLE_SIGNATURE)
const isPdf = (bytes: Uint8Array) => startsWith(bytes, PDF_SIGNATURE)

/** 将 ArrayBuffer 安全转为 BlobPart，避免 ArrayBufferLike / 构造签名报错 */
const toBlobPart = (buffer: ArrayBuffer): BlobPart => new Uint8Array(buffer)

/** 从 Uint8Array 拷贝出独立 ArrayBuffer（兼容 SharedArrayBuffer / ArrayBufferLike） */
const copyUint8ArrayToArrayBuffer = (source: Uint8Array): ArrayBuffer => {
  const out = new ArrayBuffer(source.byteLength)
  new Uint8Array(out).set(source)
  return out
}

const setLoading = (value: boolean) => {
  if (loading.value === value) return
  loading.value = value
  emit('loading-change', value)
}

const toError = (error: unknown, fallback = '文件预览失败') => {
  if (error instanceof Error) return error
  const message = String(error || '').trim()
  return new Error(message || fallback)
}

const revokePdfObjectUrl = () => {
  if (!pdfObjectUrl.value) return
  URL.revokeObjectURL(pdfObjectUrl.value)
  pdfObjectUrl.value = null
}

const createPdfObjectUrlFromBlob = (blob: Blob) => {
  revokePdfObjectUrl()
  const pdfBlob = blob.type && blob.type.toLowerCase().includes('pdf') ? blob : new Blob([blob], { type: 'application/pdf' })
  pdfObjectUrl.value = URL.createObjectURL(pdfBlob)
}

const createPdfObjectUrlFromBuffer = (buffer: ArrayBuffer) => {
  createPdfObjectUrlFromBlob(new Blob([toBlobPart(buffer)], { type: 'application/pdf' }))
}

const destroyViewer = (viewer: ActiveViewer | null = activeViewer) => {
  if (!viewer) return
  viewer.unsubscribe?.()
  viewer.unsubscribe = null
  try {
    viewer.controller.destroy()
  } catch {
    // ignore destroy errors on unmount / replace
  }
  if (activeViewer === viewer) activeViewer = null
}

/**
 * 工作表切换时，spreadsheet renderer 会重新显示全屏 loading 层。
 * 该层默认覆盖底部 sheet tabs，快速切换时后续点击会落在 loading 层上。
 * 将它限制在表格区域，并关闭其命中测试，保证标签栏始终可操作。
 */
const installSpreadsheetInteractionStyle = (viewer: ActiveViewer) => {
  const container = viewer.controller.container as HTMLElement
  const styleRoot = container.shadowRoot || container
  const style = styleRoot.ownerDocument.createElement('style')
  style.dataset.officePreviewSpreadsheetFix = 'true'
  style.textContent = `
    [data-file-viewer-spreadsheet-root] > .loading {
      bottom: 44px;
      pointer-events: none;
    }
  `
  styleRoot.appendChild(style)
}

const readBlob = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result)
      else reject(new Error('文件读取失败'))
    }
    reader.onerror = () => reject(reader.error || new Error('文件读取失败'))
    reader.onabort = () => reject(new Error('文件读取已取消'))
    reader.readAsArrayBuffer(blob)
  })

const readBlobHeader = async (blob: Blob, length = HEADER_READ_LENGTH) => {
  const slice = blob.slice(0, Math.min(length, blob.size))
  const buffer = await readBlob(slice)
  return new Uint8Array(buffer)
}

const parseResponseFileName = (disposition: string | null) => {
  if (!disposition) return undefined
  const utf8Name = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const normalName = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const value = utf8Name || normalName
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const getUrlFileName = (url: string) => {
  try {
    const path = new URL(url, window.location.href).pathname
    return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1)) || undefined
  } catch {
    return url.split(/[?#]/)[0].split('/').pop() || undefined
  }
}

/**
 * 加载数据源。
 * - URL：预下载（鉴权、体积校验、类型探测）
 * - Blob/File：尽量只读文件头，正文交给渲染器消费 Blob
 * - ArrayBuffer / Uint8Array：拷贝后使用
 */
const loadSource = async (source: Exclude<OfficePreviewSource, null | undefined>): Promise<LoadedSource> => {
  if (typeof source === 'string') {
    const url = source.trim()
    if (!url) throw new Error('文件地址不能为空')

    activeController = new AbortController()
    const response = await fetch(url, {
      ...props.requestOptions,
      signal: activeController.signal
    })
    if (!response.ok) throw new Error(`文件下载失败（HTTP ${response.status}）`)

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > 0) assertPreviewSize(contentLength)

    const blob = await response.blob()
    assertPreviewSize(blob.size)
    return {
      blob,
      name: parseResponseFileName(response.headers.get('content-disposition')) || getUrlFileName(url),
      mime: response.headers.get('content-type') || blob.type || undefined,
      byteLength: blob.size
    }
  }

  if (source instanceof ArrayBuffer) {
    assertPreviewSize(source.byteLength)
    return { buffer: source.slice(0), byteLength: source.byteLength }
  }

  if (source instanceof Uint8Array) {
    assertPreviewSize(source.byteLength)
    return {
      buffer: copyUint8ArrayToArrayBuffer(source),
      byteLength: source.byteLength
    }
  }

  if (source instanceof Blob) {
    assertPreviewSize(source.size)
    const fileName = typeof File !== 'undefined' && source instanceof File ? source.name : undefined
    return {
      blob: source,
      name: fileName,
      mime: source.type || undefined,
      byteLength: source.size
    }
  }

  throw new Error('不支持的文件数据源')
}

const normalizeType = (value?: string): OfficeRendererType | null => {
  const type = value?.toLowerCase().replace(/^\./, '')
  if (type === 'pdf') return 'pdf'
  if (type === 'word' || type === 'docx' || type === 'doc') return 'word'
  // et：WPS 表格，按 Excel 渲染（OLE 走 xls 转换，ZIP 走 xlsx）
  if (type === 'excel' || type === 'xlsx' || type === 'xls' || type === 'et') return 'excel'
  return null
}

/**
 * 交给 file-viewer 的扩展名。
 * 扩展名与文件头冲突时以文件头为准：后端转换后常沿用原扩展名（.doc 里其实是 OpenXML），
 * 按名字选渲染器会用二进制 doc 解析器去读 ZIP 包而失败。
 * 另外 @file-viewer/renderer-spreadsheet 只认 xlsx/xls/csv/ods 等，不认 WPS 的 et。
 */
const extensionForType = (type: OfficeRendererType, loaded: LoadedSource, headerBytes: Uint8Array | null) => {
  const fromName = getOfficeFileExtension(props.fileName || loaded.name) || ''

  if (type === 'pdf') return 'pdf'

  if (type === 'word') {
    if (headerBytes && isZip(headerBytes)) return isZipWordExt(fromName) ? fromName : 'docx'
    if (headerBytes && isOle(headerBytes)) return isOleWordExt(fromName) ? fromName : 'doc'
    if (isWordNativeExt(fromName)) return fromName
    return 'docx'
  }

  if (type === 'excel') {
    // et / 未知 / 与文件头不符的扩展名：按魔数映射到 spreadsheet 能识别的类型
    if (headerBytes && isZip(headerBytes)) return isZipSpreadsheetExt(fromName) ? fromName : 'xlsx'
    if (headerBytes && isOle(headerBytes)) return isOleSpreadsheetExt(fromName) ? fromName : 'xls'
    if (isSpreadsheetNativeExt(fromName)) return fromName
    // 无文件头时：et 历史形态多为 OLE，默认按 xls 尝试
    if (fromName === 'et') return 'xls'
    return 'xlsx'
  }

  return fromName || 'bin'
}

/** 让 viewer 拿到与实际渲染类型一致的扩展名（.et、或后端转换后仍沿用的旧扩展名都在这里纠正） */
const resolveViewerFilename = (displayName: string, renderExt: string) => {
  const ext = getOfficeFileExtension(displayName)
  if (ext === renderExt) return displayName
  const base = ext ? displayName.slice(0, -(ext.length + 1)) : displayName
  return `${base || 'preview'}.${renderExt}`
}

const inferType = (loaded: LoadedSource, bytes: Uint8Array | null): OfficeRendererType => {
  // 文件头优先：后端把 doc/docx 转成 PDF 后文件名与 fileType 往往仍是 .doc，
  // 只有内容能说明真实类型，否则会被送进 word 渲染器并在校验时报「不支持的类型」。
  if (bytes && isPdf(bytes)) return 'pdf'

  const explicitType = normalizeType(props.fileType)
  if (explicitType) return explicitType

  const nameType = normalizeType(getOfficeFileExtension(props.fileName || loaded.name))
  if (nameType) return nameType

  const mime = loaded.mime?.split(';')[0].trim().toLowerCase()
  if (mime === 'application/pdf') return 'pdf'
  if (mime?.includes('wordprocessingml') || mime === 'application/msword') return 'word'
  if (mime?.includes('spreadsheetml') || mime === 'application/vnd.ms-excel' || mime === 'application/vnd.ms-excel.et') {
    return 'excel'
  }

  if (bytes) {
    if (isOle(bytes)) return 'excel'
    // docx 和 xlsx 都是 ZIP 容器，仅凭文件头区分，必须由名称或 fileType 补充语义。
    if (isZip(bytes)) throw new Error('仅支持 PDF、DOC、DOCX、XLSX、XLS 和 ET,其他类型文件请下载后在本地查看！')
  }
  throw new Error('仅支持 PDF、DOC、DOCX、XLSX、XLS 和 ET,其他类型文件请下载后在本地查看！')
}

const validateFileBytes = (type: OfficeRendererType, bytes: Uint8Array, byteLength: number) => {
  if (!byteLength) throw new Error('文件内容为空')

  // 走到这里说明 fileType/文件名声明了 pdf，但内容不是 PDF（常见于后端转换失败或返回了错误页）
  if (type === 'pdf' && !isPdf(bytes)) {
    throw new Error('文件内容不是有效的 PDF，请重试或下载后在本地查看')
  }
  if (type === 'word' && !isZip(bytes) && !isOle(bytes)) {
    throw new Error('仅支持 PDF、DOC、DOCX、XLSX、XLS 和 ET,其他类型文件请下载后在本地查看！')
  }
  if (type === 'excel' && !isZip(bytes) && !isOle(bytes)) {
    throw new Error('仅支持 PDF、DOC、DOCX、XLSX、XLS 和 ET,其他类型文件请下载后在本地查看！')
  }
}

const resetRenderer = () => {
  destroyViewer()
  rendererType.value = null
  revokePdfObjectUrl()
}

const fail = (error: unknown) => {
  const normalizedError = toError(error)
  resetRenderer()
  errorMessage.value = normalizedError.message
  setLoading(false)
  emit('error', normalizedError)
}

const buildViewerOptions = (modules: FileViewerModules): FileViewerOptions => ({
  locale: 'zh-CN',
  theme: 'light',
  styleIsolation: 'shadow',
  toolbar: props.toolbar,
  rendererMode: 'replace',
  builtinRenderers: 'none',
  autoRenderers: false,
  // 主线程渲染，避免部署 vendor worker；需要时可经 docxOptions/excelOptions 覆盖
  docx: {
    worker: false,
    ...(props.docxOptions || {})
  },
  spreadsheet: {
    worker: false,
    ...(props.excelOptions || {})
  },
  renderers: [modules.wordRenderer, modules.spreadsheetRenderer]
})

const toNamedFile = (blob: Blob, fileName: string): File | Blob => {
  if (typeof File !== 'undefined' && blob instanceof File && blob.name) return blob
  try {
    return new File([blob], fileName, { type: blob.type || undefined })
  } catch {
    // 极老环境无 File 构造时回退 Blob（依赖 filename 字段）
    return blob
  }
}

const isCurrentViewer = (viewer: ActiveViewer) => activeViewer === viewer && !isStale(viewer.sequence)

const bindViewerReady = (viewer: ActiveViewer, type: OfficeRendererType) => {
  const state = viewer.controller.getState() as FileViewerState | null
  if (state?.error) {
    throw toError(state.error, '文件渲染失败')
  }
  if (state?.ready) {
    handleRendered(type, viewer.sequence)
    return
  }
  // 部分渲染器在 load resolve 后仍异步就绪，再订阅一次
  let unsubscribe: (() => void) | null = null
  let shouldUnsubscribe = false
  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    } else {
      shouldUnsubscribe = true
    }
    if (activeViewer === viewer) viewer.unsubscribe = null
  }
  const listener = (next: FileViewerState) => {
    if (!isCurrentViewer(viewer)) {
      stopListening()
      return
    }
    if (next.error) {
      stopListening()
      fail(next.error)
      return
    }
    if (next.ready) {
      stopListening()
      handleRendered(type, viewer.sequence)
    }
  }
  unsubscribe = viewer.controller.subscribe(listener)
  if (shouldUnsubscribe || !isCurrentViewer(viewer)) {
    unsubscribe()
    unsubscribe = null
  } else {
    viewer.unsubscribe = unsubscribe
  }
}

const mountOfficeViewer = async (loaded: LoadedSource, type: OfficeRendererType, headerBytes: Uint8Array | null, sequence: number) => {
  const modules = await loadFileViewerModules()
  if (isStale(sequence)) return
  await nextTick()
  if (isStale(sequence)) return
  const host = viewerHostRef.value
  if (!host) throw new Error('预览容器未就绪')

  destroyViewer()
  host.innerHTML = ''

  const renderExt = extensionForType(type, loaded, headerBytes)
  const displayName = props.fileName || loaded.name || `preview.${renderExt}`
  // file-viewer 按 extension 选渲染器；et 必须映射为 xls/xlsx 才能命中 spreadsheet
  const filename = resolveViewerFilename(displayName, renderExt)
  const mountOptions: FileViewerMountOptions = {
    filename,
    name: filename,
    type: renderExt,
    size: loaded.byteLength,
    options: buildViewerOptions(modules)
  }

  if (loaded.blob) {
    mountOptions.file = toNamedFile(loaded.blob, filename)
  } else if (loaded.buffer) {
    mountOptions.buffer = loaded.buffer
  } else {
    throw new Error('文件读取失败')
  }

  // Pass only viewer options to mountViewer. Passing the source here starts an
  // implicit load; loading it again below creates a race and can leave a blank
  // renderer when the first request is aborted by the second one.
  const controller = modules.mountViewer(host, { options: mountOptions.options })
  const viewer: ActiveViewer = { sequence, controller, unsubscribe: null }
  activeViewer = viewer
  try {
    await controller.load(mountOptions)
  } catch (error) {
    if (!isCurrentViewer(viewer)) destroyViewer(viewer)
    throw error
  }
  if (!isCurrentViewer(viewer)) {
    destroyViewer(viewer)
    return
  }
  if (type === 'excel') installSpreadsheetInteractionStyle(viewer)
  bindViewerReady(viewer, type)
}

const isStale = (sequence: number) => sequence !== requestSequence.value

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

const reload = async () => {
  const sequence = ++requestSequence.value
  activeController?.abort()
  activeController = null
  errorMessage.value = ''
  resetRenderer()

  const source = props.src
  if (source === null || source === undefined || (typeof source === 'string' && !source.trim())) {
    setLoading(false)
    return
  }

  setLoading(true)
  try {
    const loaded = await loadSource(source)
    if (isStale(sequence)) return

    let headerBytes: Uint8Array | null = null
    if (loaded.buffer) {
      headerBytes = new Uint8Array(loaded.buffer, 0, Math.min(loaded.buffer.byteLength, HEADER_READ_LENGTH))
    } else if (loaded.blob) {
      headerBytes = await readBlobHeader(loaded.blob, HEADER_READ_LENGTH)
      if (isStale(sequence)) return
    }

    const type = inferType(loaded, headerBytes)
    if (headerBytes) {
      validateFileBytes(type, headerBytes, loaded.byteLength)
    } else if (!loaded.byteLength) {
      throw new Error('文件内容为空')
    }

    rendererType.value = type
    renderKey.value += 1

    if (type === 'pdf') {
      // 浏览器内置 PDF 查看器通过 blob URL 打开；不安装 PDF.js / renderer-pdf
      if (loaded.blob) {
        createPdfObjectUrlFromBlob(loaded.blob)
      } else if (loaded.buffer) {
        createPdfObjectUrlFromBuffer(loaded.buffer)
      } else {
        throw new Error('PDF 数据为空')
      }
      // iframe @load 会 handleRendered；若已缓存也可能立刻完成，兜底关 loading
      return
    }

    await mountOfficeViewer(loaded, type, headerBytes, sequence)
  } catch (error) {
    if (isStale(sequence) || isAbortError(error)) return
    fail(error)
  }
}

const handleRendered = (type: OfficeRendererType, sequence: number) => {
  if (sequence !== requestSequence.value || rendererType.value !== type || lastRenderedSequence === sequence) return
  lastRenderedSequence = sequence
  errorMessage.value = ''
  setLoading(false)
  emit('rendered', type)
}

const handlePdfRendered = () => {
  if (rendererType.value === 'pdf') handleRendered('pdf', requestSequence.value)
}

// 仅监听稳定的预览输入；不要监听 docxOptions/excelOptions 对象引用（父组件内联对象会导致反复 reload）
watch(
  () => [props.src, props.fileType, props.fileName, props.toolbar] as const,
  () => {
    void reload()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  requestSequence.value += 1
  activeController?.abort()
  destroyViewer()
  revokePdfObjectUrl()
})

defineExpose({ reload })
</script>

<style scoped lang="less">
.office-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;

  &__pdf {
    display: block;
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    min-height: 0;
    border: 0;
  }

  &__viewer {
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  &--pdf {
    overflow: hidden;
    background: #475569;
  }

  &--excel,
  &--word {
    overflow: hidden;
  }

  :deep(.el-empty) {
    margin: auto;
  }
}
</style>
