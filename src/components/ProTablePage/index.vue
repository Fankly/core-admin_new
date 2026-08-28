<template>
  <div class="container">
    <div class="operate" v-if="toolButton">
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
    <div class="tips" v-if="props.helpMessage" style="margin-bottom: 10px">
      <span style="color: red">{{ props.helpMessage }}</span>
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
      <el-table ref="tableRef" v-bind="$attrs" :data="processTableData" :border="border" :row-key="rowKey" @selection-change="selectionChange">
        <!-- 默认插槽 -->
        <slot />
        <template v-for="item in tableColumns" :key="item">
          <!-- selection || radio || index || expand || sort -->
          <el-table-column
            v-if="item.type && columnTypes.includes(item.type)"
            v-bind="item"
            :align="item.align ?? 'center'"
            :reserve-selection="item.type == 'selection'"
          ></el-table-column>
          <!-- other -->
          <TableColumn v-if="!item.type && item.prop && item.isShow" :column="item">
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
              <img src="@/assets/images/notData.png" alt="notData" />
              <div>暂无数据</div>
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
  <ColSetting v-if="toolButton" ref="colRef" v-model:col-setting="colSetting" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts" name="ProTablePage">
import { ref, watch, provide, onMounted, unref, computed, reactive, Ref } from 'vue'
import { ElMessageBox, ElTable } from 'element-plus'
import { useTable } from '@/hooks/useTableSize'
import { useSelection } from '@/hooks/useSelection'
import { BreakPoint } from '@/components/Grid/interface'
import { ColumnProps, TypeProps } from '@/components/ProTablePage/interface'
import { handleProp } from '@/utils'
import SearchForm from '@/components/SearchForm/index.vue'
import Pagination from './components/Pagination.vue'
import ColSetting from './components/ColSetting.vue'
import TableColumn from './components/TableColumn.vue'
import Sortable from 'sortablejs'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

type ElTableInstance = InstanceType<typeof ElTable>

export interface ProTableProps {
  columns: ColumnProps[] // 列配置项  ==> 必传
  data?: any[] // 静态 table data 数据，若存在则不会使用 requestApi 返回的 data ==> 非必传
  requestApi?: (params: any) => Promise<any> // 请求表格数据的 api ==> 非必传
  requestAuto?: boolean // 是否自动执行请求 api ==> 非必传（默认为true）
  requestError?: (params: any) => void // 表格 api 请求错误监听 ==> 非必传
  dataCallback?: (data: any) => any // 返回数据的回调函数，可以对数据进行处理 ==> 非必传
  title?: string // 表格标题 ==> 非必传
  pagination?: boolean // 是否需要分页组件 ==> 非必传（默认为true）
  initParam?: any // 初始化请求参数 ==> 非必传（默认为{}）
  border?: boolean // 是否带有纵向边框 ==> 非必传（默认为true）
  toolButton?: ('help' | 'setting' | 'search' | 'other')[] | boolean // 是否显示表格功能按钮 ==> 非必传（默认为true）
  helpMessage?: string // 表格帮助信息 ==> 非必传
  titleMsg?: string // 表格帮助信息 ==> 非必传
  rowKey?: string // 行数据的 Key，用来优化 Table 的渲染，当表格数据多选时，所指定的 id ==> 非必传（默认为 id）
  searchCol?: number | Record<BreakPoint, number> // 表格搜索项 每列占比配置 ==> 非必传 { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }
  isShowTable?: boolean // 是否显示表格 ==> 非必传（默认为true）
}

// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<ProTableProps>(), {
  columns: () => [],
  requestAuto: false,
  pagination: true,
  initParam: {},
  border: true,
  toolButton: true as any,
  rowKey: 'id',
  helpMessage: '',
  titleMsg: '',
  searchCol: () => ({ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }),
  isShowTable: true
})

// table 实例
const tableRef = ref<ElTableInstance>()
const helpModalRef = ref<InstanceType<typeof HelpModal>>()

// column 列类型
const columnTypes: TypeProps[] = ['selection', 'radio', 'index', 'expand', 'sort']
// 是否显示搜索模块
const isShowSearch = ref(true)

// 获取帮助信息
const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

// 单选值
const radio = ref('')

// 表格多选 Hooks
const { selectionChange, selectedList, selectedListIds, isSelected } = useSelection(props.rowKey, tableRef)

// 清空选中数据列表
const clearSelection = () => tableRef.value!.clearSelection()

// 表格操作 Hooks
const { tableData, pageable, searchParam, searchInitParam, getTableList, search, reset, handleSizeChange, handleCurrentChange } = useTable(
  props.requestApi,
  props.initParam,
  props.pagination,
  props.dataCallback,
  props.requestError,
  clearSelection
)

// 初始化表格数据 && 拖拽排序
onMounted(() => {
  dragSort()
  props.requestAuto && getTableList()
  props.data && (pageable.value.total = props.data.length)
})

// 处理表格数据
const processTableData = computed(() => {
  if (!props.data) return tableData.value
  if (!props.pagination) return props.data
  return props.data.slice((pageable.value.current - 1) * pageable.value.size, pageable.value.size * pageable.value.current)
})

// 监听页面 initParam 改化，重新获取表格数据
watch(() => props.initParam, getTableList, { deep: true })

// 接收 columns 并设置为响应式
const tableColumns = reactive<ColumnProps[]>(props.columns)

// 扁平化 columns
const flatColumns = computed(() => flatColumnsFunc(tableColumns))

// 定义 enumMap 存储 enum 值（避免异步请求无法格式化单元格内容 || 无法填充搜索下拉选择）
const enumMap = ref(new Map<string, { [key: string]: any }[]>())
const setEnumMap = async ({ prop, enum: enumValue }: ColumnProps) => {
  if (!enumValue) return

  // 如果当前 enumMap 存在相同的值 return
  if (enumMap.value.has(prop!) && (typeof enumValue === 'function' || enumMap.value.get(prop!) === enumValue)) return

  // 当前 enum 为静态数据，则直接存储到 enumMap
  if (typeof enumValue !== 'function') return enumMap.value.set(prop!, unref(enumValue!))

  // 为了防止接口执行慢，而存储慢，导致重复请求，所以预先存储为[]，接口返回后再二次存储
  enumMap.value.set(prop!, [])

  // 当前 enum 为后台数据需要请求数据，则调用该请求接口，并存储到 enumMap
  const { data } = await enumValue()
  enumMap.value.set(prop!, data)
}

// 注入 enumMap
provide('enumMap', enumMap)

// 扁平化 columns 的方法
const flatColumnsFunc = (columns: ColumnProps[], flatArr: ColumnProps[] = []) => {
  columns.forEach(async (col) => {
    if (col._children?.length) flatArr.push(...flatColumnsFunc(col._children))
    flatArr.push(col)

    col.isHide = col.isHide ?? false

    // column 添加默认 isShow && isFilterEnum 属性值
    col.isShow = col.isShow ?? true
    col.isFilterEnum = col.isFilterEnum ?? true

    // 设置 enumMap
    await setEnumMap(col)
  })
  return flatArr.filter((item) => !item._children?.length)
}

// 过滤需要搜索的配置项 && 排序
const searchColumns = computed(() => {
  return flatColumns.value?.filter((item) => item.search?.el || item.search?.render).sort((a, b) => a.search!.order! - b.search!.order!)
})

// 设置 搜索表单默认排序 && 搜索表单项的默认值
searchColumns.value?.forEach((column, index) => {
  column.search!.order = column.search?.order ?? index + 2
  const key = column.search?.key ?? handleProp(column.prop!)
  const defaultValue = column.search?.defaultValue
  if (defaultValue !== undefined && defaultValue !== null) {
    searchInitParam.value[key] = defaultValue
    searchParam.value[key] = defaultValue
  }
})

// 列设置 ==> 需要过滤掉不需要设置的列
const colRef = ref()
const colSetting = tableColumns!.filter((item: any) => {
  const { type, prop, isShow, isHide } = item
  if (isHide) {
    return !columnTypes.includes(type!) && prop !== 'operation'
  } else {
    return !columnTypes.includes(type!) && prop !== 'operation' && isShow
  }
})
const openColSetting = () => colRef.value.openColSetting()

// 定义 emit 事件
const emit = defineEmits<{
  search: []
  reset: []
  dargSort: [{ newIndex?: number; oldIndex?: number }]
}>()

const _search = () => {
  search()
  // @ts-ignore
  emit('search')
}

const _reset = () => {
  reset()
  // @ts-ignore
  emit('reset')
}

// 拖拽排序
const dragSort = () => {
  const tbody = document.querySelector('.el-table__body-wrapper tbody') as HTMLElement
  Sortable.create(tbody, {
    handle: '.move',
    animation: 300,
    onEnd({ newIndex, oldIndex }) {
      const [removedItem] = processTableData.value.splice(oldIndex!, 1)
      processTableData.value.splice(newIndex!, 0, removedItem)

      // @ts-ignore
      emit('dargSort', { newIndex, oldIndex })
    }
  })
}

// 暴露给父组件的参数和方法 (外部需要什么，都可以从这里暴露出去)
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
  selectedListIds
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
      width: 140px;
      text-align: right;
    }
  }
}
</style>
