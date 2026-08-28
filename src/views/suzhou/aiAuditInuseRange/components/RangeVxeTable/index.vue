<!-- 智能审核启用范围 - 通用 vxe-grid 表格（替代 ProTable/el-table） -->
<template>
  <div class="range-vxe-table">
    <div v-if="showOperate" class="operate">
      <div class="operate-button">
        <slot name="tableHeader" :selected-list="selectedList" :selected-list-ids="selectedListIds" :is-selected="isSelected" />
      </div>
      <div v-if="toolButton" class="operate-filter">
        <div class="header-button-ri">
          <ToolbarButtons
            v-model:search-visible="isShowSearch"
            :tool-button="toolButton"
            @setting-click="openColSetting"
            @help-click="openHelp"
          />
        </div>
      </div>
    </div>

    <SearchForm
      v-if="searchColumns.length"
      v-show="isShowSearch"
      :search="handleSearch"
      :reset="handleReset"
      :columns="searchColumns"
      :search-param="searchParam"
      :search-col="searchCol"
    />

    <div class="table-main">
      <div class="table-grid-wrap">
        <vxe-grid ref="gridRef" v-bind="gridOptions" v-on="gridEvents">
          <template v-for="name in forwardSlotNames" #[name]="scope" :key="name">
            <slot :name="name" v-bind="normalizeSlotScope(scope)" />
          </template>
        </vxe-grid>
      </div>
      <el-pagination
        v-if="pagination"
        background
        :current-page="pageable.current"
        :page-size="pageable.size"
        :page-sizes="[20, 50, 100, 200]"
        :total="pageable.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <ColSetting v-if="toolButton" ref="colRef" :grid-ref="gridRef" :col-setting="colSetting" />
    <HelpModal ref="helpModalRef" />
  </div>
</template>

<script setup lang="ts" name="RangeVxeTable">
import { computed, nextTick, onMounted, provide, reactive, ref, unref, useSlots, watch } from 'vue'
import type { VxeGridInstance, VxeGridListeners, VxeGridProps } from 'vxe-table'
import SearchForm from '@/components/SearchForm/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ColSetting from '@/components/base/vxeColSetting.vue'
import type { BreakPoint } from '@/components/Grid/interface'
import type { ColumnProps } from '@/components/ProTablePage/interface'

type RowClickMode = 'exclusive' | 'toggle' | 'none'
type ToolButtonKey = 'help' | 'setting' | 'search' | 'other'

const props = withDefaults(
  defineProps<{
    columns?: VxeGridProps['columns']
    /** ProTable 风格搜索列（复用 SearchForm） */
    searchColumns?: ColumnProps[]
    requestApi?: (params: any) => Promise<any>
    requestAuto?: boolean
    requestError?: (error: unknown) => void
    dataCallback?: (data: any) => any
    pagination?: boolean
    border?: boolean
    stripe?: boolean
    toolButton?: ToolButtonKey[] | boolean
    rowKey?: string
    searchCol?: number | Record<BreakPoint, number>
    loading?: boolean
    /** 行点击：exclusive 单选当前行；toggle 切换勾选；none 不处理 */
    rowClickMode?: RowClickMode
    /** 跨页保留勾选（弹窗回显场景） */
    reserveSelection?: boolean
    initParam?: Record<string, any>
  }>(),
  {
    columns: () => [],
    searchColumns: () => [],
    requestAuto: false,
    pagination: true,
    border: true,
    stripe: true,
    toolButton: false,
    rowKey: 'id',
    searchCol: () => ({ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }),
    loading: false,
    rowClickMode: 'exclusive',
    reserveSelection: false,
    initParam: () => ({})
  }
)

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'row-click', row: any): void
  (e: 'selection-change', rows: any[]): void
}>()

const slots = useSlots()
const gridRef = ref<VxeGridInstance>()
const colRef = ref<InstanceType<typeof ColSetting>>()
const helpModalRef = ref<InstanceType<typeof HelpModal>>()
const isShowSearch = ref(true)
const selectedList = ref<any[]>([])
const searchParam = reactive<Record<string, any>>({})
const internalLoading = ref(false)

/** SearchForm 下拉依赖 enumMap（与 ProTable 一致） */
const enumMap = ref(new Map<string, { [key: string]: any }[]>())
provide('enumMap', enumMap)

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
  for (const col of props.searchColumns) {
    await setEnumMap(col)
  }
}

const pageable = reactive({
  current: 1,
  size: 100,
  total: 0
})

const gridOptions = reactive<VxeGridProps>({
  border: props.border,
  stripe: props.stripe,
  loading: false,
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
    height: 44
  },
  checkboxConfig: {
    reserve: props.reserveSelection,
    highlight: true
  },
  columns: props.columns || [],
  data: []
})

const showOperate = computed(() => !!props.toolButton || !!slots.tableHeader)
const isSelected = computed(() => selectedList.value.length > 0)
const selectedListIds = computed(() =>
  selectedList.value.map((row) => row?.[props.rowKey]).filter((id) => id != null && id !== '')
)
const forwardSlotNames = computed(() => Object.keys(slots).filter((name) => name !== 'tableHeader' && name !== 'default'))

const colSetting = computed(() => {
  return (props.columns || [])
    .filter((item: any) => item.field)
    .map((item: any) => {
      const next = { ...item }
      next.prop = next.prop || next.field
      next.title = next.title || next.label
      if (typeof next.visible === 'undefined') next.visible = true
      return next
    })
})

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

const gridEvents: VxeGridListeners = {
  checkboxChange: () => {
    syncSelectedFromGrid()
  },
  checkboxAll: () => {
    syncSelectedFromGrid()
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

const getTableList = async () => {
  if (!props.requestApi) return
  internalLoading.value = true
  gridOptions.loading = true
  try {
    const res = await props.requestApi(buildQueryParams())
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
    // 先写入数据，再回调（回显勾选依赖表格已有行）
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
    if (!props.reserveSelection) {
      clearSelection()
    } else {
      syncSelectedFromGrid()
    }
  } catch (error) {
    props.requestError?.(error)
  } finally {
    internalLoading.value = false
    gridOptions.loading = props.loading || false
  }
}

const clearSelection = () => {
  gridRef.value?.clearCheckboxRow?.()
  if (props.reserveSelection) gridRef.value?.clearCheckboxReserve?.()
  selectedList.value = []
  emit('selection-change', [])
}

const resetSearchParam = () => {
  Object.keys(searchParam).forEach((key) => {
    delete searchParam[key]
  })
  props.searchColumns.forEach((col) => {
    if (!col.prop) return
    searchParam[col.prop] = col.search?.defaultValue
  })
}

const reset = async () => {
  resetSearchParam()
  pageable.current = 1
  clearSelection()
  await getTableList()
  emit('reset')
}

const handleSearch = async () => {
  pageable.current = 1
  if (!props.reserveSelection) clearSelection()
  await getTableList()
  emit('search')
}

const handleReset = async () => {
  await reset()
}

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

const openColSetting = () => {
  colRef.value?.openColSetting()
}

const openHelp = () => {
  if (helpModalRef.value) {
    ;(helpModalRef.value as any).showModal = true
  }
}

const setCheckboxRow = (row: any, checked?: boolean) => {
  if (checked === undefined) {
    gridRef.value?.toggleCheckboxRow?.(row)
  } else {
    gridRef.value?.setCheckboxRow?.(row, checked)
  }
  syncSelectedFromGrid()
}

const toggleRowSelection = (row: any, selected?: boolean) => {
  setCheckboxRow(row, selected)
}

const doLayout = () => {
  gridRef.value?.recalculate?.(true)
}

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
  (val) => {
    gridOptions.loading = val || internalLoading.value
  }
)

watch(
  () => props.columns,
  (cols) => {
    gridOptions.columns = cols || []
    nextTick(() => gridRef.value?.refreshColumn?.())
  },
  { deep: true }
)

watch(
  () => props.border,
  (val) => {
    gridOptions.border = val
  }
)

watch(
  () => props.stripe,
  (val) => {
    gridOptions.stripe = val
  }
)

watch(
  () => props.rowKey,
  (val) => {
    if (gridOptions.rowConfig) gridOptions.rowConfig.keyField = val
  }
)

watch(
  () => props.reserveSelection,
  (val) => {
    if (gridOptions.checkboxConfig) gridOptions.checkboxConfig.reserve = val
  }
)

watch(
  () => props.searchColumns,
  async (cols) => {
    for (const col of cols) {
      await setEnumMap(col)
      // 静态 enum 引用变化时（如级联小类）强制刷新
      if (col.prop && col.enum && typeof col.enum !== 'function') {
        enumMap.value.set(col.prop, unref(col.enum as any) || [])
      }
    }
  },
  { deep: true }
)

onMounted(async () => {
  props.searchColumns.forEach((col) => {
    if (col.prop && !(col.prop in searchParam)) {
      searchParam[col.prop] = col.search?.defaultValue
    }
  })
  await initSearchEnums()
  if (props.requestAuto) {
    getTableList()
  }
})

defineExpose({
  getTableList,
  clearSelection,
  reset,
  searchParam,
  selectedList,
  selectedListIds,
  isSelected,
  pageable,
  element,
  gridRef,
  setCheckboxRow,
  toggleRowSelection,
  doLayout
})
</script>

<style scoped lang="less">
.range-vxe-table {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.operate {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.table-main {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-grid-wrap {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

:deep(.table-search) {
  flex-shrink: 0;
}
</style>

