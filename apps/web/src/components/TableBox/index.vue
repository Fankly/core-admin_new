<template>
  <div class="table-box" :class="{ card: type == 'card' }" :style="{ backgroundColor: type == 'card' ? 'rgb(255 255 255 / 60%)' : ' ' }">
    <el-row justify="space-between" align="middle" class="operator-box" v-if="hasExtend || $slots.operator">
      <div>
        <slot name="operator" />
      </div>
      <div class="extend-box" v-if="hasExtend">
        <vxe-toolbar ref="toolbarRef" custom :refresh="{ queryMethod: refresh }"></vxe-toolbar>
      </div>
    </el-row>
    <div class="vxe-table-box" :style="{ borderRadius: type == 'card' ? '16px' : '0' }">
      <vxe-table
        :border="type == 'card' ? 'none' : undefined"
        auto-resize
        ref="table"
        align="center"
        :row-class-name="rowClassName"
        :show-overflow="showOverflow"
        :class="[rowHeightClass, { 'table-card-style': type === 'card' }]"
        :min-height="minHeight"
        :max-height="maxHeight"
        :height="height"
        :size="tableSize"
        :key="tableKey"
        header-cell-class-name="table-header-gray"
        v-bind="$attrs"
        :row-config="tableRowConfig"
        :checkbox-config="{ checkMethod: checkedMethod }"
        :custom-config="{ storage: true, ...customConfig }"
        :expand-config="{ ...expandConfig }"
        :row-style="type === 'card' ? cardRowStyle : rowStyle"
        @toggle-tree-expand="onTreeExpandChange"
        @checkbox-change="onCheckBoxChange"
        @checkbox-all="onCheckAllChange"
        @radio-change="onRadioSelectChange"
        @cell-click="currentChangeEvent"
      >
        <slot></slot>
        <template v-slot:empty>
          <div class="table-empty unified-font">
            <img src="@/assets/img/empty.png" alt="图片" />
            <span>暂无数据</span>
          </div>
        </template>
      </vxe-table>
    </div>
    <slot class="pagination-box" name="pagination"></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, toRefs, useAttrs, watch } from 'vue'
import type { VxeTableDefines, VxeTableInstance, VxeTablePropTypes, VxeToolbarInstance } from 'vxe-table'
import type { IObject } from '@/types/interface'
import { traverseTree } from '@/utils'

defineOptions({ name: 'table-box' })

type TableRow = IObject<unknown>
type Selection = TableRow | TableRow[] | null | undefined

interface Props {
  rowClassName?: VxeTablePropTypes.RowClassName<TableRow>
  rowStyle?: VxeTablePropTypes.RowStyle<TableRow>
  size?: VxeTablePropTypes.Size | 'default'
  value?: Selection
  hasExtend?: boolean
  height?: string | number
  minHeight?: string | number
  maxHeight?: string | number
  hasImageColumn?: boolean
  checkedMethod?: VxeTablePropTypes.CheckboxConfig<TableRow>['checkMethod']
  showOverflow?: boolean
  customConfig?: VxeTablePropTypes.CustomConfig<TableRow>
  expandConfig?: VxeTablePropTypes.ExpandConfig<TableRow>
  type?: string
}

interface TableAttrs {
  data?: TableRow[]
  rowConfig?: VxeTablePropTypes.RowConfig<TableRow>
  'row-config'?: VxeTablePropTypes.RowConfig<TableRow>
  treeConfig?: VxeTablePropTypes.TreeConfig<TableRow>
  'tree-config'?: VxeTablePropTypes.TreeConfig<TableRow>
}

const props = withDefaults(defineProps<Props>(), {
  size: null,
  hasExtend: true,
  height: 'auto',
  minHeight: 0,
  hasImageColumn: false,
  checkedMethod: () => true,
  showOverflow: true,
  customConfig: () => ({}),
  type: ''
})

const emit = defineEmits<{
  (event: 'currentChangeEvent', row: TableRow): void
  (event: 'input', rows: Selection): void
  (event: 'change', rows: Selection, multi: boolean): void
  (event: 'checkbox-select-change', rows: TableRow[]): void
  (event: 'radio-select-change', row: TableRow | null | undefined): void
  (event: 'refresh'): void
}>()

const attrs = useAttrs() as TableAttrs
const table = shallowRef<VxeTableInstance<TableRow>>()
const toolbarRef = shallowRef<VxeToolbarInstance>()
const tableKey = ref(Date.now())
const rowHeightStatus = ref<'default' | 'mini'>('default')
const expandRows = ref<unknown[]>([])

// 保留原公开尺寸值，传给 VXE 时以空值使用其默认配置。
const defaultFormItemSize = computed(() => (window.innerWidth <= 1900 ? 'small' : 'default'))
const tableSize = computed(() => {
  const size = props.size || defaultFormItemSize.value
  return size === 'default' ? undefined : size
})
const rowHeightClass = computed(() => `row-height-${rowHeightStatus.value}${props.hasImageColumn ? ' row-height-image' : ''}`)
const treeRowKey = computed(() => (attrs['tree-config'] || attrs.treeConfig)?.rowField)
const tableRowConfig = computed(() => ({ ...attrs['row-config'], ...attrs.rowConfig, isHover: props.type !== 'card' }))

function currentChangeEvent({ row }: Pick<VxeTableDefines.CellClickEventParams<TableRow>, 'row'>) {
  emit('currentChangeEvent', row)
}

function clearCheckboxRow() {
  return table.value?.clearCheckboxRow()
}

function onSelectChange(rows: Selection, multi: boolean) {
  emit('input', rows)
  emit('change', rows, multi)
}

function onCheckBoxChange() {
  const instance = table.value
  const selectRows = instance ? [...instance.getCheckboxRecords(true), ...instance.getCheckboxIndeterminateRecords(true)] : []
  onSelectChange(selectRows, true)
  emit('checkbox-select-change', selectRows)
}

function onCheckAllChange() {
  onCheckBoxChange()
}

function onRadioSelectChange() {
  const instance = table.value
  const selectRow = instance?.getRadioRecord()
  if (instance) onSelectChange(selectRow, false)
  emit('radio-select-change', selectRow)
}

async function setTableSelectRow() {
  await nextTick()
  const instance = table.value
  if (!instance) return
  await instance.clearRadioRow()
  await instance.clearCheckboxRow()
  if (props.value == null) return
  if (Array.isArray(props.value)) {
    await instance.setCheckboxRow(props.value, true)
  } else {
    await instance.setRadioRow(props.value)
  }
}

function refresh() {
  emit('refresh')
}

function getTableImpl() {
  return table.value
}

function onRowHeightToogle() {
  rowHeightStatus.value = rowHeightStatus.value === 'default' ? 'mini' : 'default'
}

function onTreeExpandChange({ expanded, row }: Pick<VxeTableDefines.ToggleTreeExpandEventParams<TableRow>, 'expanded' | 'row'>) {
  if (treeRowKey.value == null) return
  const id = row[treeRowKey.value]
  if (id == null) return
  if (expanded) {
    if (!expandRows.value.includes(id)) expandRows.value.push(id)
  } else {
    expandRows.value = expandRows.value.filter((item) => item !== id)
  }
}

function cardRowStyle() {
  return { borderBottom: '1px solid #f0f0f0', transition: 'all 0.3s ease' }
}

watch(() => props.value, setTableSelectRow)
watch(
  () => attrs.data,
  async (newValue, oldValue) => {
    const key = treeRowKey.value
    if (newValue === oldValue || key == null) return
    const nodeList: TableRow[] = []
    traverseTree(newValue, (node: TableRow) => nodeList.push(node), 'children')
    const defaultExpandRows = nodeList.filter((row) => expandRows.value.includes(row[key]))
    expandRows.value = defaultExpandRows.map((row) => row[key])
    await nextTick()
    await table.value?.setTreeExpand(defaultExpandRows, true)
  },
  { immediate: true }
)

onMounted(async () => {
  await nextTick()
  if (table.value && toolbarRef.value) await table.value.connect(toolbarRef.value)
  await setTableSelectRow()
})

// Options API 的实例方法原本对父组件可见，迁移后显式保留表格与选择操作入口。
defineExpose({
  ...toRefs(props),
  tableKey,
  rowHeightStatus,
  expandRows,
  defaultFormItemSize,
  rowHeightClass,
  treeRowKey,
  currentChangeEvent,
  clearCheckboxRow,
  onSelectChange,
  onCheckBoxChange,
  onCheckAllChange,
  onRadioSelectChange,
  setTableSelectRow,
  refresh,
  getTableImpl,
  onRowHeightToogle,
  onTreeExpandChange,
  cardRowStyle
})
</script>

<style lang="less" scoped>
.table-box {
  background-color: white;
  display: flex;
  flex-direction: column;
  flex: 1;
  &.card {
    .vxe-table-box {
      border-radius: 10px !important;
      overflow: hidden !important;
    }
    .operator-box {
      margin-bottom: 5px;
    }
    :deep(.vxe-header--column) {
      background: rgba(0, 168, 150, 0.08) !important;
    }
  }
  .vxe-table-box {
    height: 200px;
    flex-grow: 1;
    flex-shrink: 1;
  }
  .vxe-toolbar {
    background: transparent !important;
  }
  .operator-box {
    // margin-bottom: 16px;
    margin-bottom: 0px;
    flex-grow: 0;
  }
  .extend-box {
    display: flex;
    justify-content: flex-end;
  }
  .pagination-box {
    flex-grow: 0;
  }
  :deep(button) {
    .operator-box {
      padding: 8px 25px;
    }
  }
}
</style>

<style scoped lang="less">
.table-box {
  padding: 0 16px 24px;
}
.table-box :deep(.vxe-body--column) {
  padding: 0px !important;
}
.row-height-mini.row-height-image :deep(.vxe-body--column) {
  height: 70px !important;
}
.row-height-default.row-height-image :deep(.vxe-body--column) {
  height: 80px !important;
}
.row-height-mini :deep(.vxe-body--column) {
  height: 35px !important;
}
.row-height-default :deep(.vxe-body--column) {
  height: 50px !important;
}

/* 卡片样式 */
.table-card-style {
  background: transparent !important;
  border: none !important;

  :deep(.vxe-table--body) {
    border-collapse: separate !important;
    border-spacing: 0 6px !important; /* 第一个参数是左右间距，第二个是行与行的上下间距 */
    background-color: transparent !important;
  }

  /* 2. 移除背景，让底层容器的背景透过间隙露出来 */
  :deep(.vxe-table--body-wrapper) {
    background-color: transparent !important;
  }

  :deep(.vxe-table--layout-wrapper) {
    background-color: transparent !important;
  }

  :deep(.vxe-body--row) {
    background: #ffffff !important;
    border-radius: 12px !important; // 稍微加大圆角更具玻璃感
    // margin-bottom: 12px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important; // 使用平滑的贝塞尔曲线
    position: relative;
    border: 1px solid transparent !important; // 预留边框位置防止抖动
    td:first-child {
      border-radius: 8px 0 0 8px;
    }
    td:last-child {
      border-radius: 0 8px 8px 0;
    }
    // --- 核心：玻璃高亮 Hover 效果 ---
    &:hover {
      z-index: 1;
      transform: translateY(-4px) scale(1.005) !important; // 向上浮动并微扩

      /* 1. 玻璃背景：结合你的主题色 #0e8b8d */
      background: rgba(255, 255, 255, 0.7) !important;

      /* 2. 毛玻璃模糊效果 (部分浏览器需要开启) */
      // backdrop-filter: blur(8px) saturate(180%);
      // -webkit-backdrop-filter: blur(8px) saturate(180%);

      background-image:
        radial-gradient(circle at 10% 50%, rgba(14, 139, 141, 0.02), transparent 40%),
        radial-gradient(circle at 90% 100%, rgba(14, 139, 141, 0.08), transparent 40%) !important;
      border: 1px solid rgba(14, 139, 141, 0.2) !important;
      box-shadow:
        0 12px 24px rgba(14, 139, 141, 0.05),
        0 4px 8px rgba(0, 0, 0, 0.05) !important;

      /* 让里面的单元格背景透明，否则会遮挡玻璃效果 */
      .vxe-body--column {
        background-color: transparent !important;
      }
    }
  }

  /* 解决边框冲突：vxe-table 默认会有一些内边线，在卡片模式下需要彻底去掉 */
  :deep(.vxe-table--body-wrapper) {
    // padding: 10px; // 给卡片留出浮动空间
    overflow: visible;
  }

  :deep(.vxe-body--column) {
    border: none !important;
    border: none !important;
    padding: 6px 0 !important;
  }
}
</style>
