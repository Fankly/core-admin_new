import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { loadFileViewerModules } from './fileViewerLoader'
import { loadSource, readBlobHeader, HEADER_READ_LENGTH } from './source'
import type { LoadedSource } from './source'
import { extensionForType, inferType, resolveViewerFilename, validateFileBytes } from './detection'
import type { FileViewerController, FileViewerModules, FileViewerMountOptions, FileViewerOptions, FileViewerState } from './fileViewerTypes'
import type { OfficePreviewProps, OfficePreviewEmits, OfficePdfOptions, OfficeRendererType } from './types'

interface ActiveViewer {
  sequence: number
  controller: FileViewerController
  unsubscribe: (() => void) | null
}

export const useOfficePreview = (props: Readonly<OfficePreviewProps>, emit: OfficePreviewEmits) => {
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

  const containerStyle = computed(() => ({
    height: typeof props.height === 'number' ? `${String(props.height)}px` : props.height
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

  const setLoading = (value: boolean) => {
    if (loading.value === value) return
    loading.value = value
    emit('loading-change', value)
  }

  const toError = (error: unknown, fallback = '文件预览失败') => {
    if (error instanceof Error) return error
    const message = typeof error === 'string' ? error.trim() : ''
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
    createPdfObjectUrlFromBlob(new Blob([buffer], { type: 'application/pdf' }))
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
    const container = viewer.controller.container
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
    if (typeof File !== 'undefined' && blob instanceof File && blob.name === fileName) return blob
    try {
      return new File([blob], fileName, { type: blob.type || undefined })
    } catch {
      // 极老环境无 File 构造时回退 Blob（依赖 filename 字段）
      return blob
    }
  }

  const isCurrentViewer = (viewer: ActiveViewer) => activeViewer === viewer && !isStale(viewer.sequence)

  const bindViewerReady = (viewer: ActiveViewer, type: OfficeRendererType) => {
    const state = viewer.controller.getState()
    if (state.error) {
      throw toError(state.error, '文件渲染失败')
    }
    if (state.ready) {
      handleRendered(type, viewer.sequence)
      return
    }
    // 部分渲染器在 load resolve 后仍异步就绪，再订阅一次
    let unsubscribe: (() => void) | null = null
    const pending = { shouldUnsubscribe: false }
    const stopListening = () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      } else {
        pending.shouldUnsubscribe = true
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
    if (pending.shouldUnsubscribe || !isCurrentViewer(viewer)) {
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

    const renderExt = extensionForType(type, loaded, headerBytes, props.fileName)
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
      activeController = new AbortController()
      const loaded = await loadSource(source, props.requestOptions, activeController.signal)
      if (isStale(sequence)) return

      let headerBytes: Uint8Array | null = null
      if (loaded.buffer) {
        headerBytes = new Uint8Array(loaded.buffer, 0, Math.min(loaded.buffer.byteLength, HEADER_READ_LENGTH))
      } else if (loaded.blob) {
        headerBytes = await readBlobHeader(loaded.blob, activeController.signal)
        if (isStale(sequence)) return
      }

      const type = inferType(loaded, headerBytes, props.fileType, props.fileName)
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

  return {
    loading,
    errorMessage,
    rendererType,
    pdfObjectUrl,
    renderKey,
    viewerHostRef,
    isOfficeRenderer,
    showEmpty,
    containerStyle,
    rootClass,
    pdfIframeSource,
    handlePdfRendered,
    reload
  }
}
