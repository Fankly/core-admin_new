<!-- ProTable 风格的通用 vxe-grid 表格 -->
<template>
  <div ref="rootRef" class="range-vxe-table">
    <div v-if="showOperate" class="operate">
      <div class="operate-button">
        <slot name="tableHeader" :selected-list="selectedList" :selected-list-ids="selectedListIds" :is-selected="isSelected" />
      </div>
      <div v-if="toolButton || $slots.toolButton" class="operate-filter">
        <div class="header-button-ri">
          <slot name="toolButton">
            <ToolbarButtons v-model:search-visible="isShowSearch" :tool-button="toolButton" @setting-click="openColSetting" @help-click="openHelp" />
          </slot>
        </div>
      </div>
    </div>

    <div v-if="$slots.beforeSearch" v-show="isShowSearch" class="range-vxe-before-search">
      <slot name="beforeSearch" />
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

    <div v-if="$slots.beforeTable" class="range-vxe-before-table">
      <slot name="beforeTable" />
    </div>

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
        :page-sizes="pageSizes"
        :total="pageable.total"
        :pager-count="5"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <ColSetting
      v-if="columnSetting || toolButton"
      ref="colRef"
      :grid-ref="gridRef"
      :col-setting="colSetting"
      @column-visibility-change="handleColumnVisibilityChange"
    />
    <HelpModal ref="helpModalRef" />
  </div>
</template>

<script setup lang="ts" name="RangeVxeTableStyle">
import { useSlots } from 'vue'
import type { VxeGridProps } from 'vxe-table'
import SearchForm from '@/components/SearchForm/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ColSetting from '@/components/base/vxeColSetting.vue'
import type { BreakPoint } from '@/components/Grid/interface'
import type { ColumnProps } from '@/components/ProTable/interface'
import type { RangeVxeTableAutoColumnWidthOptions, RangeVxeTableRowClickMode, RangeVxeTableToolButton } from './interface'
import { useRangeVxeTable } from './useRangeVxeTable'

const props = withDefaults(
  defineProps<{
    columns?: VxeGridProps['columns']
    /** 根据当前页展示内容计算列宽；显式 width 的列不参与。 */
    autoColumnWidth?: boolean | RangeVxeTableAutoColumnWidthOptions
    /** ProTable 风格搜索列（复用 SearchForm）。 */
    searchColumns?: ColumnProps[]
    requestApi?: (params: any) => Promise<any>
    requestAuto?: boolean
    requestError?: (error: unknown) => void
    dataCallback?: (data: any) => any
    pagination?: boolean
    pageSize?: number
    pageSizes?: number[]
    border?: boolean
    stripe?: boolean
    toolButton?: RangeVxeTableToolButton[] | boolean
    /** 外部工具栏触发列设置时，仅挂载列设置弹窗，不渲染内置工具栏。 */
    columnSetting?: boolean
    rowKey?: string
    searchCol?: number | Record<BreakPoint, number>
    loading?: boolean
    /** 行点击：exclusive 单选当前行；toggle 切换勾选；none 不处理。 */
    rowClickMode?: RangeVxeTableRowClickMode
    /** 跨页保留勾选（弹窗回显场景）。 */
    reserveSelection?: boolean
    initParam?: Record<string, any>
    /** 透传 vxe-grid cell-style。 */
    cellStyle?: VxeGridProps['cellStyle']
  }>(),
  {
    columns: () => [],
    autoColumnWidth: false,
    searchColumns: () => [],
    requestAuto: false,
    pagination: true,
    pageSize: 100,
    pageSizes: () => [20, 50, 100, 200],
    border: true,
    stripe: true,
    toolButton: false,
    columnSetting: false,
    rowKey: 'id',
    searchCol: () => ({ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }),
    loading: false,
    rowClickMode: 'exclusive',
    reserveSelection: false,
    initParam: () => ({})
  }
)

const emit = defineEmits<{
  (event: 'search'): void
  (event: 'reset'): void
  (event: 'row-click', row: any): void
  (event: 'selection-change', rows: any[]): void
  (event: 'cell-click', params: { row: any; column: any }): void
}>()

const table = useRangeVxeTable(props, emit, useSlots())
const {
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
  getCheckboxRecords
} = table

defineExpose({
  getTableList,
  invalidateRequest,
  clearSelection,
  reset,
  searchParam,
  selectedList,
  selectedListIds,
  isSelected,
  pageable,
  element,
  gridRef,
  getCheckboxRecords,
  clearCheckboxRow: clearSelection,
  setCheckboxRow,
  openColSetting,
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

.range-vxe-before-search,
.range-vxe-before-table {
  flex-shrink: 0;
  min-width: 0;
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

:deep(.el-pagination) {
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: 4px;
  padding: 8px 12px;
}

:deep(.table-search) {
  flex-shrink: 0;
}
</style>
