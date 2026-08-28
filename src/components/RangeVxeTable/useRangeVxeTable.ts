import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, unref, watch } from 'vue'
import type { Slots } from 'vue'
import type { VxeGridInstance, VxeGridListeners, VxeGridProps, VxeTableDefines } from 'vxe-table'
import type ColSetting from '@/components/base/vxeColSetting.vue'
import type HelpModal from '@/components/HelpModal/index.vue'
import type { ColumnProps } from '@/components/ProTable/interface'
import type { RangeVxeTableEmit, RangeVxeTableProps } from './interface'
import {
  clampColumnWidth,
  cloneGridColumns,
  collectLeafColumns,
  distributeAutoColumnWidths,
  resolveAutoColumnWidthConfig,
  resolveColumnBounds
} from './autoColumnWidth'

export const useRangeVxeTable = (props: Readonly<RangeVxeTableProps>, emit: RangeVxeTableEmit, slots: Slots) => {
  const gridRef = ref<VxeGridInstance>()
  const rootRef = ref<HTMLElement>()
  const colRef = ref<InstanceType<typeof ColSetting>>()
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()
  const isShowSearch = ref(true)
  const selectedList = ref<any[]>([])
  const searchParam = reactive<Record<string, any>>({})
  const internalLoading = ref(false)
  const manuallyResizedFields = new Set<string>()
  const explicitWidthFields = new Set<string>()
  const reportedAutoWidthErrors = new Set<string>()
  let columnSource = props.columns
  let autoWidthFrame = 0
  let resolveAutoWidthFrame: (() => void) | undefined
  let autoWidthRun = 0
  let observedTableWidth = 0
  let resizeObserver: ResizeObserver | undefined

  /** SearchForm 下拉依赖 enumMap（与 ProTable 一致）。 */
  const enumMap = ref(new Map<string, { [key: string]: any }[]>())
  // 预取注入：在 setup 同步阶段（早于 onMounted 的 initSearchEnums）写入 enumMap，
  // 使后续 setEnumMap 命中去重分支、跳过对应网络请求，解除字典请求与数据请求的串行。
  if (props.prefetchedEnums) {
    for (const [prop, values] of Object.entries(props.prefetchedEnums)) {
      if (prop && Array.isArray(values)) enumMap.value.set(prop, values)
    }
  }
  provide('enumMap', enumMap)

  const searchColumns = () => props.searchColumns || []

  const setEnumMap = async ({ prop, enum: enumValue }: ColumnProps) => {
    if (!enumValue || !prop) return
    if (enumMap.value.has(prop) && (typeof enumValue === 'function' || enumMap.value.get(prop) === enumValue)) return
    if (typeof enumValue !== 'function') {
      enumMap.value.set(prop, unref(enumValue as any) || [])
      return
    }
    enumMap.value.set(prop, [])
    try {
      const res = await enumValue()
      enumMap.value.set(prop, res?.data || [])
    } catch {
      enumMap.value.set(prop, [])
    }
  }

  const initSearchEnums = async () => {
    for (const column of searchColumns()) {
      await setEnumMap(column)
    }
  }

  const pageable = reactive({
    current: 1,
    size: props.pageSize || 100,
    total: 0
  })

  let requestSeq = 0

  const gridOptions = reactive<VxeGridProps>({
    border: props.border,
    stripe: props.stripe,
    loading: props.loading || false,
    loadingConfig: {
      icon: 'el-icon-loading',
      text: '正在加载中...'
    },
    height: '100%',
    autoResize: true,
    showOverflow: true,
    showHeaderOverflow: true,
    headerAlign: 'center',
    align: 'center',
    columnConfig: {
      resizable: true
    },
    rowConfig: {
      keyField: props.rowKey,
      isHover: true,
      height: 32
    },
    checkboxConfig: {
      reserve: props.reserveSelection,
      highlight: true
    },
    columns: cloneGridColumns(props.columns),
    data: [],
    // 树形配置透传：lazy 模式下 loadMethod 由组件内部包装为 requestApi 调用
    treeConfig: props.treeConfig ? { ...props.treeConfig } : undefined
  })

  const reportAutoWidthError = (message: string) => {
    if (!import.meta.env.DEV || reportedAutoWidthErrors.has(message)) return
    reportedAutoWidthErrors.add(message)
    console.error(`[RangeVxeTable] 自动列宽配置无效：${message}。请修正配置后重试。`)
  }

  const reportAutoWidthRuntimeError = (error: unknown) => {
    console.error('[RangeVxeTable] 自动列宽计算失败，表格数据已保留。请检查列配置或插槽渲染后重新加载表格。', error)
  }

  const getAutoWidthConfig = () => {
    const result = resolveAutoColumnWidthConfig(props.autoColumnWidth)
    if (result.error) reportAutoWidthError(result.error)
    return result.config
  }

  const refreshExplicitWidthFields = () => {
    explicitWidthFields.clear()
    collectLeafColumns(props.columns).forEach((column) => {
      if (column.field && column.width != null) explicitWidthFields.add(String(column.field))
    })
  }

  refreshExplicitWidthFields()

  const getRuntimeColumns = () => gridRef.value?.getTableColumn?.().visibleColumn || []

  const getInternalLeafColumnMap = () => {
    const map = new Map<string, NonNullable<VxeGridProps['columns']>[number]>()
    collectLeafColumns(gridOptions.columns).forEach((column) => {
      if (column.field) map.set(String(column.field), column)
    })
    return map
  }

  const getRenderedCellWidth = (column: VxeTableDefines.ColumnInfo<any>, measureHost: HTMLElement) => {
    const root = rootRef.value
    if (!root) return 0
    const clones: HTMLElement[] = []
    const fragment = document.createDocumentFragment()
    root.querySelectorAll<HTMLElement>('[colid]').forEach((cell) => {
      if (cell.getAttribute('colid') !== column.id) return
      const content = cell.querySelector<HTMLElement>('.vxe-cell')
      if (!content) return
      const clone = content.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.width = 'max-content'
      clone.style.minWidth = '0'
      clone.style.maxWidth = 'none'
      clone.style.overflow = 'visible'
      clone.style.whiteSpace = 'nowrap'
      clones.push(clone)
      fragment.appendChild(clone)
    })
    measureHost.appendChild(fragment)
    const maxWidth = clones.reduce((width, clone) => Math.max(width, Math.ceil(clone.getBoundingClientRect().width)), 0)
    measureHost.replaceChildren()
    return maxWidth
  }

  const getTextWidth = (column: VxeTableDefines.ColumnInfo<any>, rows: any[], sampleCell?: HTMLElement) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return 0
    const computedStyle = sampleCell ? window.getComputedStyle(sampleCell) : null
    context.font = computedStyle?.font || '13px sans-serif'
    const horizontalPadding = computedStyle
      ? Number.parseFloat(computedStyle.paddingLeft || '0') + Number.parseFloat(computedStyle.paddingRight || '0')
      : 20
    const title = column.title == null ? '' : String(column.title)
    let maxWidth = context.measureText(title).width + horizontalPadding
    rows.forEach((row) => {
      const label = gridRef.value?.getCellLabel?.(row, column)
      const text = label == null ? '' : String(label)
      maxWidth = Math.max(maxWidth, context.measureText(text).width + horizontalPadding)
    })
    return Math.ceil(maxWidth)
  }

  const runAutoColumnWidth = async (runId: number) => {
    const config = getAutoWidthConfig()
    if (!config || !gridRef.value || !rootRef.value || runId !== autoWidthRun) return
    await nextTick()
    if (runId !== autoWidthRun) return

    const runtimeColumns = getRuntimeColumns()
    const internalColumns = getInternalLeafColumnMap()
    const measureHost = document.createElement('div')
    measureHost.className = 'vxe-table vxe-table--render-default'
    measureHost.setAttribute('aria-hidden', 'true')
    measureHost.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;contain:layout style;'
    rootRef.value.appendChild(measureHost)

    try {
      const rows = Array.isArray(gridOptions.data) ? gridOptions.data : []
      const items = runtimeColumns.flatMap((runtimeColumn) => {
        const field = runtimeColumn.field ? String(runtimeColumn.field) : ''
        const sourceColumn = field ? internalColumns.get(field) : undefined
        if (!sourceColumn || !field || sourceColumn.type || explicitWidthFields.has(field) || manuallyResizedFields.has(field)) return []

        const boundsResult = resolveColumnBounds(sourceColumn, config)
        if (!boundsResult.config) {
          if (boundsResult.error) reportAutoWidthError(boundsResult.error)
          return []
        }

        const sampleCell = Array.from(rootRef.value?.querySelectorAll<HTMLElement>('[colid] .vxe-cell') || []).find(
          (cell) => cell.parentElement?.getAttribute('colid') === runtimeColumn.id
        )
        const renderedWidth = getRenderedCellWidth(runtimeColumn, measureHost)
        const textWidth = getTextWidth(runtimeColumn, rows, sampleCell)
        const width = clampColumnWidth(Math.max(renderedWidth, textWidth), boundsResult.config)
        return [{ key: field, width, ...boundsResult.config }]
      })
      if (!items.length || runId !== autoWidthRun) return

      const autoFields = new Set(items.map((item) => item.key))
      const fixedWidth = runtimeColumns.reduce((sum, column) => {
        const field = column.field ? String(column.field) : ''
        return autoFields.has(field) ? sum : sum + Math.max(0, Number(column.renderWidth) || 0)
      }, 0)
      const bodyWidth = rootRef.value.querySelector<HTMLElement>('.vxe-table--body-wrapper')?.clientWidth || rootRef.value.clientWidth
      const measuredWidth = items.reduce((sum, item) => sum + item.width, 0)
      const availableWidth = Math.max(measuredWidth, bodyWidth - fixedWidth)
      const widths = distributeAutoColumnWidths(items, availableWidth)

      widths.forEach((width, field) => {
        const sourceColumn = internalColumns.get(field)
        const runtimeColumn = gridRef.value?.getColumnByField?.(field)
        if (sourceColumn) sourceColumn.width = width
        if (runtimeColumn) {
          runtimeColumn.width = width
          runtimeColumn.resizeWidth = 0
        }
      })
      await gridRef.value.refreshColumn?.()
      await gridRef.value.recalculate?.(true)
    } finally {
      measureHost.remove()
    }
  }

  const scheduleAutoColumnWidth = async () => {
    autoWidthRun += 1
    const runId = autoWidthRun
    if (autoWidthFrame) {
      cancelAnimationFrame(autoWidthFrame)
      autoWidthFrame = 0
      resolveAutoWidthFrame?.()
      resolveAutoWidthFrame = undefined
    }
    await nextTick()
    await new Promise<void>((resolve) => {
      resolveAutoWidthFrame = resolve
      autoWidthFrame = requestAnimationFrame(() => {
        autoWidthFrame = 0
        resolveAutoWidthFrame = undefined
        runAutoColumnWidth(runId).then(resolve, (error) => {
          reportAutoWidthRuntimeError(error)
          resolve()
        })
      })
    })
  }

  const rebuildColumns = async (clearManualWidths: boolean) => {
    const manualWidths = new Map<string, number>()
    if (!clearManualWidths) {
      getRuntimeColumns().forEach((column) => {
        const field = column.field ? String(column.field) : ''
        if (field && manuallyResizedFields.has(field)) manualWidths.set(field, column.renderWidth)
      })
    }
    if (clearManualWidths) manuallyResizedFields.clear()
    reportedAutoWidthErrors.clear()
    refreshExplicitWidthFields()
    autoWidthRun += 1
    gridOptions.columns = cloneGridColumns(props.columns)
    collectLeafColumns(gridOptions.columns).forEach((column) => {
      const field = column.field ? String(column.field) : ''
      const manualWidth = manualWidths.get(field)
      if (manualWidth) column.width = manualWidth
    })
    await nextTick()
    await gridRef.value?.refreshColumn?.()
    await scheduleAutoColumnWidth()
  }

  const showOperate = computed(() => !!props.toolButton || !!slots.tableHeader || !!slots.toolButton)
  const isSelected = computed(() => selectedList.value.length > 0)
  const selectedListIds = computed(() => selectedList.value.map((row) => row?.[props.rowKey || 'id']).filter((id) => id != null && id !== ''))
  const layoutSlotNames = new Set(['tableHeader', 'toolButton', 'beforeSearch', 'beforeTable', 'default'])
  const forwardSlotNames = computed(() => Object.keys(slots).filter((name) => !layoutSlotNames.has(name)))

  const colSetting = computed(() =>
    collectLeafColumns(props.columns)
      .filter((item: any) => item.field)
      .map((item: any) => {
        const next = { ...item }
        next.prop = next.prop || next.field
        next.title = next.title || next.label
        if (typeof next.visible === 'undefined') next.visible = true
        return next
      })
  )

  const normalizeSlotScope = (scope: any) => ({
    ...scope,
    row: scope?.row,
    column: scope?.column
  })

  const syncSelectedFromGrid = () => {
    const current = gridRef.value?.getCheckboxRecords?.() || []
    const reserved = props.reserveSelection ? gridRef.value?.getCheckboxReserveRecords?.() || [] : []
    selectedList.value = [...current, ...reserved]
    emit('selection-change', selectedList.value)
  }

  const clearSelection = () => {
    gridRef.value?.clearCheckboxRow?.()
    if (props.reserveSelection) gridRef.value?.clearCheckboxReserve?.()
    selectedList.value = []
    emit('selection-change', [])
  }

  const gridEvents: VxeGridListeners = {
    checkboxChange: syncSelectedFromGrid,
    checkboxAll: syncSelectedFromGrid,
    resizableChange: ({ column }) => {
      if (column?.field) manuallyResizedFields.add(String(column.field))
    },
    cellClick: ({ row, column }) => {
      if (!row) return
      if (column?.type === 'checkbox') {
        emit('row-click', row)
        return
      }
      if (props.rowClickMode === 'none') {
        emit('row-click', row)
        return
      }
      nextTick(() => {
        if (props.rowClickMode === 'exclusive') {
          gridRef.value?.clearCheckboxRow?.()
          if (props.reserveSelection) gridRef.value?.clearCheckboxReserve?.()
          gridRef.value?.setCheckboxRow?.(row, true)
        } else if (props.rowClickMode === 'toggle') {
          gridRef.value?.toggleCheckboxRow?.(row)
        }
        syncSelectedFromGrid()
        emit('row-click', row)
      })
    }
  }

  const buildQueryParams = () => {
    const params: Record<string, any> = {
      ...props.initParam,
      ...searchParam
    }
    if (props.pagination) {
      params.page = pageable.current
      params.limit = pageable.size
    }
    return params
  }

  /**
   * 从懒加载响应中提取行数组：
   * - 数组直接返回；
   * - 对象取 records 或 data。
   */
  const resolveRows = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw
    if (!raw || typeof raw !== 'object') return []
    if (Array.isArray(raw.records)) return raw.records
    if (Array.isArray(raw.data)) return raw.data
    return []
  }

  /**
   * 树形懒加载：展开节点时调用 requestApi 拉取子节点。
   * 取参默认 { parentId: row[rowKey] }，业务页可通过 treeLoadParams 自定义（如同时带 dwId/nd 等）。
   * 业务页的 requestApi 需根据 params.parentId 区分根查询（parentId 来自 buildQueryParams）与子节点加载。
   */
  const resolveTreeLoadMethod = () => {
    if (!props.treeConfig?.lazy || !props.requestApi) return props.treeConfig?.loadMethod
    return async ({ row }: any) => {
      const rowParams = props.treeLoadParams ? props.treeLoadParams(row) : { parentId: row?.[props.rowKey || 'id'] }
      try {
        const res = await props.requestApi({ ...buildQueryParams(), ...rowParams })
        return resolveRows(props.dataCallback ? props.dataCallback(res?.data) : res?.data)
      } catch (error) {
        props.requestError?.(error)
        return []
      }
    }
  }

  // 应用/更新 treeConfig.loadMethod（lazy 模式下由组件内部包装）
  const applyTreeConfig = () => {
    if (!props.treeConfig) {
      gridOptions.treeConfig = undefined
      return
    }
    const loadMethod = resolveTreeLoadMethod()
    gridOptions.treeConfig = { ...props.treeConfig, ...(loadMethod ? { loadMethod } : {}) }
  }
  applyTreeConfig()

  const getTableList = async () => {
    if (!props.requestApi) return
    const seq = ++requestSeq
    internalLoading.value = true
    gridOptions.loading = true
    try {
      const res = await props.requestApi(buildQueryParams())
      if (seq !== requestSeq) return
      const rawData = res?.data
      if (props.pagination) {
        gridOptions.data = rawData?.records || []
        pageable.total = Number(rawData?.total || 0)
        const current = Number(rawData?.current)
        const size = Number(rawData?.size)
        if (!Number.isNaN(current) && current > 0) pageable.current = current
        if (!Number.isNaN(size) && size > 0) pageable.size = size
      } else {
        gridOptions.data = Array.isArray(rawData) ? rawData : rawData?.records || []
      }

      // 回显勾选依赖表格先写入数据。
      await nextTick()
      if (props.dataCallback) {
        const nextData = props.dataCallback(rawData)
        if (nextData && nextData !== rawData) {
          if (props.pagination) {
            gridOptions.data = nextData?.records || gridOptions.data
            if (nextData?.total != null) pageable.total = Number(nextData.total || 0)
          } else if (Array.isArray(nextData)) {
            gridOptions.data = nextData
          }
        }
      }
      await nextTick()
      await scheduleAutoColumnWidth()
      if (seq !== requestSeq) return
      if (props.reserveSelection) {
        syncSelectedFromGrid()
      } else {
        clearSelection()
      }
    } catch (error) {
      if (seq !== requestSeq) return
      gridOptions.data = []
      pageable.total = 0
      await scheduleAutoColumnWidth()
      if (seq !== requestSeq) return
      clearSelection()
      props.requestError?.(error)
    } finally {
      if (seq !== requestSeq) return
      internalLoading.value = false
      gridOptions.loading = props.loading || false
    }
  }

  const invalidateRequest = () => {
    requestSeq += 1
    autoWidthRun += 1
    internalLoading.value = false
    gridOptions.loading = props.loading || false
  }

  const resetSearchParam = () => {
    Object.keys(searchParam).forEach((key) => delete searchParam[key])
    searchColumns().forEach((column) => {
      if (column.prop) searchParam[column.prop] = column.search?.defaultValue
    })
  }

  const reset = async () => {
    resetSearchParam()
    pageable.current = 1
    clearSelection()
    // 清理 vxe-grid 树形懒加载内部状态：
    // vxe-table 4.6.x 以 rowid 缓存 treeLoaded=true 标记，重置后根节点 id 不变，
    // 旧标记会被 cacheRowMap 复用，导致再次展开不触发 loadMethod（点击无反应）。
    // clearTreeExpandLoaded 只能逐行清，故遍历当前已展开的行。
    if (props.treeConfig?.lazy) {
      const $grid = gridRef.value
      if ($grid) {
        const expandedRows = $grid.getTreeExpandRecords?.() || []
        $grid.clearTreeExpand?.()
        expandedRows.forEach((row: any) => $grid.clearTreeExpandLoaded?.(row))
      }
    }
    await getTableList()
    emit('reset')
  }

  const handleSearch = async () => {
    pageable.current = 1
    if (!props.reserveSelection) clearSelection()
    await getTableList()
    emit('search')
  }

  const handleReset = () => reset()

  const handleSizeChange = async (size: number) => {
    if (size <= 0) return
    pageable.size = size
    pageable.current = 1
    await getTableList()
  }

  const handleCurrentChange = async (current: number) => {
    if (current <= 0) return
    pageable.current = current
    await getTableList()
  }

  const handleColumnVisibilityChange = async () => scheduleAutoColumnWidth()

  const openColSetting = () => colRef.value?.openColSetting()

  const openHelp = () => {
    if (helpModalRef.value) (helpModalRef.value as any).showModal = true
  }

  const setCheckboxRow = (row: any, checked?: boolean) => {
    if (checked === undefined) {
      gridRef.value?.toggleCheckboxRow?.(row)
    } else {
      gridRef.value?.setCheckboxRow?.(row, checked)
    }
    syncSelectedFromGrid()
  }

  const toggleRowSelection = (row: any, selected?: boolean) => setCheckboxRow(row, selected)
  const doLayout = () => gridRef.value?.recalculate?.(true)

  const element = computed(() => ({
    toggleRowSelection,
    doLayout,
    clearSelection,
    setCheckboxRow,
    getCheckboxRecords: () => gridRef.value?.getCheckboxRecords?.() || [],
    getCheckboxReserveRecords: () => gridRef.value?.getCheckboxReserveRecords?.() || []
  }))

  watch(
    () => props.loading,
    (value) => {
      gridOptions.loading = value || internalLoading.value
    }
  )
  watch(
    () => props.pageSize,
    (value) => {
      if (value && value > 0) pageable.size = value
    }
  )
  watch(
    () => props.columns,
    async (columns) => {
      const sourceChanged = columns !== columnSource
      columnSource = columns
      await rebuildColumns(sourceChanged)
    },
    { deep: true }
  )
  watch(
    () => props.autoColumnWidth,
    async () => {
      await rebuildColumns(true)
    },
    { deep: true }
  )
  watch(
    () => props.border,
    (value) => {
      gridOptions.border = value
    }
  )
  watch(
    () => props.stripe,
    (value) => {
      gridOptions.stripe = value
    }
  )
  watch(
    () => props.rowKey,
    (value) => {
      if (gridOptions.rowConfig) gridOptions.rowConfig.keyField = value
    }
  )
  watch(
    () => props.reserveSelection,
    (value) => {
      if (gridOptions.checkboxConfig) gridOptions.checkboxConfig.reserve = value
    }
  )
  watch(
    () => props.treeConfig,
    () => {
      applyTreeConfig()
    },
    { deep: true }
  )
  watch(
    () => props.treeLoadParams,
    () => {
      applyTreeConfig()
    }
  )
  watch(
    () => props.searchColumns,
    async (columns = []) => {
      for (const column of columns) {
        await setEnumMap(column)
        if (column.prop && column.enum && typeof column.enum !== 'function') {
          enumMap.value.set(column.prop, unref(column.enum as any) || [])
        }
      }
    },
    { deep: true }
  )

  onMounted(async () => {
    searchColumns().forEach((column) => {
      if (column.prop && !(column.prop in searchParam)) searchParam[column.prop] = column.search?.defaultValue
    })
    // 字典枚举请求与数据请求无数据依赖，并行发起以避免串行阻塞首屏数据。
    // initSearchEnums 不再 await 阻塞 getTableList；SearchForm 下拉在字典返回前为空，不影响首屏表格数据。
    initSearchEnums()
    if (rootRef.value && typeof ResizeObserver !== 'undefined') {
      observedTableWidth = rootRef.value.clientWidth
      resizeObserver = new ResizeObserver(([entry]) => {
        const width = Math.round(entry.contentRect.width)
        if (width === observedTableWidth) return
        observedTableWidth = width
        if (!props.autoColumnWidth) return
        scheduleAutoColumnWidth()
      })
      resizeObserver.observe(rootRef.value)
    }
    if (props.requestAuto) getTableList()
    else await scheduleAutoColumnWidth()
  })

  onBeforeUnmount(() => {
    autoWidthRun += 1
    resizeObserver?.disconnect()
    if (autoWidthFrame) {
      cancelAnimationFrame(autoWidthFrame)
      resolveAutoWidthFrame?.()
    }
  })

  return {
    gridRef,
    rootRef,
    colRef,
    helpModalRef,
    isShowSearch,
    selectedList,
    searchParam,
    pageable,
    gridOptions,
    gridEvents,
    showOperate,
    isSelected,
    selectedListIds,
    forwardSlotNames,
    colSetting,
    normalizeSlotScope,
    getTableList,
    invalidateRequest,
    clearSelection,
    reset,
    handleSearch,
    handleReset,
    handleSizeChange,
    handleCurrentChange,
    handleColumnVisibilityChange,
    openColSetting,
    openHelp,
    setCheckboxRow,
    toggleRowSelection,
    doLayout,
    element,
    getCheckboxRecords: () => gridRef.value?.getCheckboxRecords?.() || []
  }
}
