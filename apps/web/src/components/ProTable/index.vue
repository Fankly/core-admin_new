<template>
  <div class="container">
    <div class="operate" v-if="toolButton || $slots.tableHeader">
      <div class="operate-button">
        <slot name="tableHeader" :selected-list="selectedList" :selected-list-ids="selectedListIds" :is-selected="isSelected" />
      </div>
      <div class="operate-filter">
        <div v-if="toolButton" class="header-button-ri">
          <slot name="toolButton">
            <ToolbarButtons
              v-model:search-visible="isShowSearch"
              :tool-button="toolButton"
              @setting-click="openColSetting"
              @help-click="getHelpMessageHandle"
            />
          </slot>
        </div>
      </div>
    </div>
    <SearchForm
      v-show="isShowSearch"
      :search="_search"
      :reset="_reset"
      :columns="searchColumns"
      :search-param="searchParam"
      :search-col="searchCol"
    />
    <!-- 提示信息 -->
    <div class="tips table-help" v-if="props.helpMessage" role="note">
      <span>{{ props.helpMessage }}</span>
    </div>
    <!-- 表格标题信息 -->
    <div class="titleMsg" v-if="props.titleMsg" style="margin-bottom: 10px">
      <span>{{ props.titleMsg }}</span>
    </div>
    <div class="headerButton">
      <slot name="headerButton" :selected-list="selectedList" :selected-list-ids="selectedListIds" :is-selected="isSelected" />
    </div>
    <!-- 表格主体 -->
    <div class="table-main" v-show="props.isShowTable">
      <!-- 表格主体 -->
      <el-table
        ref="tableRef"
        v-loading="loading"
        :aria-busy="loading"
        v-bind="$attrs"
        :data="processTableData"
        :border="border"
        :row-key="rowKey"
        @selection-change="selectionChange"
      >
        <!-- 默认插槽 -->
        <slot />
        <template v-for="(item, index) in tableColumns" :key="item.prop ?? item.type ?? index">
          <!-- selection || radio || index || expand || sort -->
          <el-table-column
            v-if="item.type && item.isShow"
            v-bind="item"
            :type="item.type === 'sort' || item.type === 'radio' ? undefined : item.type"
            :align="item.align ?? 'center'"
            :reserve-selection="item.type === 'selection'"
          >
            <template v-if="item.type === 'sort'" #default><span class="move" aria-label="拖动排序">⋮⋮</span></template>
            <template v-else-if="item.type === 'radio'" #default="scope">
              <el-radio v-model="radio" :value="String(scope.row[rowKey])" :aria-label="`选择第 ${scope.$index + 1} 行`" />
            </template>
          </el-table-column>
          <!-- other -->
          <TableColumn v-if="!item.type && (item.prop || item._children?.length) && item.isShow" :column="item">
            <template v-for="slot in Object.keys($slots)" #[slot]="scope">
              <slot :name="slot" v-bind="scope" />
            </template>
          </TableColumn>
        </template>
        <!-- 插入表格最后一行之后的插槽 -->
        <template #append>
          <slot name="append" />
        </template>
        <!-- 无数据 -->
        <template #empty>
          <div class="table-empty">
            <slot name="empty">
              <EmptyState title="暂无匹配的数据" description="调整查询条件后重试，或通过上方操作添加记录。" />
            </slot>
          </div>
        </template>
      </el-table>
      <!-- 分页组件 -->
      <slot name="pagination">
        <Pagination v-if="pagination" :pageable="pageable" :handle-size-change="handleSizeChange" :handle-current-change="handleCurrentChange" />
      </slot>
    </div>
  </div>
  <!-- 列设置 -->
  <ColSetting v-if="toolButton" ref="colRef" :col-setting="colSetting" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, nextTick, provide, ref, toRef, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import Sortable from 'sortablejs'
import { useTable } from '@/hooks/useTable'
import { useSelection } from '@/hooks/useSelection'
import { useGuide } from '@/hooks/useGuide'
import type { HelpModalInstance } from '@/components/HelpModal/useHelp'
import type { ColSettingInstance, ProTableProps } from './interface'
import { EnumMapInjectionKey } from './interface'
import { useColumns } from './useColumns'
import SearchForm from '@/components/SearchForm/index.vue'
import Pagination from './components/Pagination.vue'
import ColSetting from './components/ColSetting.vue'
import TableColumn from './components/TableColumn.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { EmptyState } from '@/design-system'
import { handleError } from '@/utils/error'

export type { ProTableProps } from './interface'
defineOptions({ name: 'ProTable', inheritAttrs: false })
const props = withDefaults(defineProps<ProTableProps>(), {
  columns: () => [],
  requestAuto: false,
  pagination: true,
  initParam: () => ({}),
  border: true,
  toolButton: () => true,
  rowKey: 'id',
  helpMessage: '',
  titleMsg: '',
  searchCol: () => ({ md: 2, lg: 3, xl: 4 }),
  isShowTable: true,
  guideModuleKey: '',
  guideTitle: '功能帮助',
  guideMessage: '点击此图标可以获取当前页面的帮助信息和使用说明'
})
const emit = defineEmits<{ search: []; reset: []; dargSort: [{ newIndex?: number; oldIndex?: number }] }>()
const tableRef = ref<TableInstance>()
const colRef = ref<ColSettingInstance | null>(null)
const helpModalRef = ref<HelpModalInstance | null>(null)
const isShowSearch = ref(true)
const radio = ref('')
const { selectionChange, selectedList, selectedListIds, isSelected } = useSelection(toRef(props, 'rowKey'), tableRef)
const clearSelection = () => {
  tableRef.value?.clearSelection()
  selectionChange([])
}
const {
  tableData,
  loading,
  pageable,
  searchParam,
  searchInitParam,
  getTableList: requestTableList,
  search,
  reset,
  handleSizeChange,
  handleCurrentChange
} = useTable(
  computed(() => (props.data === undefined ? props.requestApi : undefined)),
  toRef(props, 'initParam'),
  toRef(props, 'pagination'),
  (data) => (props.dataCallback ? props.dataCallback(data) : data),
  (error) => {
    if (props.requestError) props.requestError(error)
    else handleError(error, '获取表格数据失败')
  },
  clearSelection
)
const { tableColumns, searchColumns, colSetting, enumMap } = useColumns(() => props.columns, searchParam, searchInitParam)
provide(
  EnumMapInjectionKey,
  computed(() => enumMap)
)
const processTableData = computed(() => {
  const rows = props.data ?? tableData.value
  if (props.data === undefined || !props.pagination) return rows
  const start = (pageable.value.current - 1) * pageable.value.size
  return rows.slice(start, start + pageable.value.size)
})
const getTableList = () => (props.data === undefined ? requestTableList() : Promise.resolve())
watch(
  () => props.initParam,
  () => {
    void getTableList()
  },
  { deep: true }
)
watch(
  () => props.data?.length,
  (total) => {
    if (total === undefined) return
    pageable.value.total = total
    pageable.value.current = Math.min(pageable.value.current, Math.max(1, Math.ceil(total / pageable.value.size)))
  },
  { immediate: true }
)

const {
  startGuide,
  showGuideManual: showGuidemanual,
  hideGuide,
  destroyGuide
} = useGuide({
  moduleKey: props.guideModuleKey,
  title: props.guideTitle,
  message: props.guideMessage,
  tragetSelector: '.toolbar-guide-icon'
})
const hasToolButton = (key: 'help' | 'setting' | 'search') => (Array.isArray(props.toolButton) ? props.toolButton.includes(key) : props.toolButton)
const openColSetting = () => colRef.value?.openColSetting()
const getHelpMessageHandle = () => helpModalRef.value?.open()
const _search = () => {
  void search()
  emit('search')
}
const _reset = () => {
  void reset()
  emit('reset')
}
let guideTimer: ReturnType<typeof setTimeout> | undefined
let sortable: Sortable | undefined
const dragSort = () => {
  sortable?.destroy()
  sortable = undefined
  if (!tableColumns.value.some((column) => column.type === 'sort')) return
  const root = tableRef.value?.$el as HTMLElement | undefined
  const tbody = root?.querySelector<HTMLElement>('.el-table__body-wrapper tbody')
  if (!tbody) return
  sortable = Sortable.create(tbody, {
    handle: '.move',
    animation: 300,
    onEnd({ newIndex, oldIndex }) {
      if (newIndex === undefined || oldIndex === undefined || newIndex === oldIndex) return
      if (oldIndex < 0 || newIndex < 0 || oldIndex >= processTableData.value.length || newIndex >= processTableData.value.length) return
      // 静态分页展示的是 slice，排序必须写回源数组的实际页偏移。
      const rows = props.data ?? tableData.value
      const offset = props.data !== undefined && props.pagination ? (pageable.value.current - 1) * pageable.value.size : 0
      const [row] = rows.splice(offset + oldIndex, 1)
      rows.splice(offset + newIndex, 0, row)
      emit('dargSort', { newIndex, oldIndex })
    }
  })
}
watch(tableColumns, () => {
  void nextTick(dragSort)
})
onMounted(() => {
  dragSort()
  if (props.requestAuto) void getTableList()
  if (props.guideModuleKey && hasToolButton('help'))
    guideTimer = setTimeout(() => {
      void startGuide()
    }, 1000)
})
onBeforeUnmount(() => {
  clearTimeout(guideTimer)
  sortable?.destroy()
  destroyGuide()
})
defineExpose({
  element: tableRef,
  tableData: processTableData,
  radio,
  pageable,
  searchParam,
  searchInitParam,
  getTableList,
  search,
  reset,
  handleSizeChange,
  handleCurrentChange,
  clearSelection,
  enumMap,
  isSelected,
  selectedList,
  selectedListIds,
  startGuide,
  showGuidemanual,
  hideGuide,
  destroyGuide
})
</script>

<style lang="less" scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  .titleMsg {
    font-weight: bold;
    font-size: 16px;
  }

  .operate {
    display: flex;
    width: 100%;
    height: 28px;
    align-items: center;
    margin-bottom: 10px;
    min-width: 0;
    min-height: 0;

    &-button {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }

    &-filter {
      width: 100px;
      text-align: right;
    }
  }
}

.table-help {
  padding: 10px 12px;
  margin-bottom: 12px;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-md);
  background: var(--ds-surface-subtle);
  border-radius: var(--ds-radius-sm);
}
</style>
