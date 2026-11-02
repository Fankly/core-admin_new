<template>
  <div class="table-box" :class="{ card: type == 'card' }" :style="{ backgroundColor: type == 'card' ? 'rgb(255 255 255 / 60%)' : ' ' }">
    <el-row type="flex" justify="space-between" align="middle" class="operator-box" v-if="hasExtend || $slots.operator">
      <div>
        <slot name="operator" />
      </div>
      <div class="extend-box" v-if="hasExtend">
        <!-- <i
          class="online-icon icon-custom-retfresh"
          style="font-size: 20px; color: #333333; cursor: pointer; margin-right: 4px"
          @click="refresh"
        /> -->
        <!-- <i
          class="online-icon icon-table-row-height"
          style="font-size: 20px; color: #333333; cursor: pointer"
          @click="onRowHeightToogle"
        /> -->
        <vxe-toolbar ref="toolbarRef" custom :refresh="{ query: refresh }"></vxe-toolbar>
      </div>
    </el-row>
    <div class="vxe-table-box" :style="{ borderRadius: type == 'card' ? '16px' : '0' }">
      <vxe-table
        :border="type == 'card' ? 'none' : null"
        auto-resize
        ref="table"
        align="center"
        :row-class-name="rowClassName"
        :show-overflow="showOverflow"
        :class="[rowHeightClass, { 'table-card-style': type === 'card' }]"
        :min-height="minHeight"
        :max-height="maxHeight"
        :height="height"
        :size="size || defaultFormItemSize"
        :key="tableKey"
        header-cell-class-name="table-header-gray"
        v-bind="$attrs"
        :row-config="{ ...$attrs.rowConfig, isHover: type !== 'card' }"
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

<script setup>
import { traverseTree } from '@/utils'
import { nextTick, reactive, toRef, toRefs, computed, watch, onMounted, useAttrs, getCurrentInstance, useTemplateRef } from 'vue'
defineOptions({
  name: 'table-box'
})
const componentProps = defineProps({
  rowClassName: {
    type: Function,
    default: () => undefined
  },
  rowStyle: {
    type: Function,
    default: () => undefined
  },
  size: {
    type: String,
    default: null
  },
  value: {
    type: [Object, Array]
  },
  hasExtend: {
    type: Boolean,
    default: true
  },
  height: {
    type: [String, Number],
    default: 'auto'
  },
  minHeight: {
    type: [String, Number],
    default: 0
  },
  maxHeight: {
    type: [String, Number]
  },
  hasImageColumn: {
    type: Boolean,
    default: false
  },
  checkedMethod: {
    type: Function,
    default: () => {
      return true
    }
  },
  showOverflow: {
    type: Boolean,
    default: true
  },
  customConfig: {
    type: Object,
    default: () => ({})
  },
  expandConfig: {
    type: Object,
    default: () => undefined
  },
  type: {
    type: String,
    default: ''
  }
})
const emit = defineEmits()
const attrs = useAttrs()
const componentInstance = getCurrentInstance().proxy
const tableRef = useTemplateRef('table')
const toolbarRefRef = useTemplateRef('toolbarRef')
const componentData = reactive({
  tableKey: new Date().getTime(),
  rowHeightStatus: 'default',
  expandRows: []
})
const tableKey = toRef(componentData, 'tableKey')
const rowHeightStatus = toRef(componentData, 'rowHeightStatus')
const expandRows = toRef(componentData, 'expandRows')
function currentChangeEvent({ row }) {
  emit('currentChangeEvent', row)
}
function clearCheckboxRow() {
  tableRef.value.clearCheckboxRow()
}
function onSelectChange(rows, multi) {
  emit('input', rows)
  emit('change', rows, multi)
}
function onCheckBoxChange(data) {
  let selectRows = []
  if (tableRef.value) {
    selectRows = tableRef.value.getCheckboxRecords(true)
    selectRows = selectRows.concat(tableRef.value.getCheckboxIndeterminateRecords(true))
  }
  onSelectChange(selectRows, true)
  emit('checkbox-select-change', selectRows)
}
function onCheckAllChange(data) {
  let selectRows = []
  if (tableRef.value) {
    selectRows = tableRef.value.getCheckboxRecords(true)
    selectRows = selectRows.concat(tableRef.value.getCheckboxIndeterminateRecords(true))
  }
  onSelectChange(selectRows, true)
  emit('checkbox-select-change', selectRows)
}
function onRadioSelectChange(data) {
  let selectRow
  if (tableRef.value) {
    selectRow = tableRef.value.getRadioRecord()
    onSelectChange(selectRow, false)
  }
  emit('radio-select-change', selectRow)
}
function setTableSelectRow() {
  if (tableRef.value) {
    nextTick(() => {
      tableRef.value.clearRadioRow()
      tableRef.value.clearCheckboxRow()
      if (componentProps.value == null) return
      if (Array.isArray(componentProps.value)) {
        // 多选
        tableRef.value.setCheckboxRow(componentProps.value)
      } else {
        // 单选
        tableRef.value.setRadioRow(componentInstance.valye)
      }
    })
  }
}
function refresh() {
  emit('refresh')
}
function getTableImpl() {
  return tableRef.value
}
function onRowHeightToogle() {
  if (componentData.rowHeightStatus === 'default') {
    componentData.rowHeightStatus = 'mini'
  } else {
    componentData.rowHeightStatus = 'default'
  }
}
function onTreeExpandChange({ expanded, row }) {
  if (treeRowKey.value != null) {
    let id = row[treeRowKey.value]
    if (id == null) return
    if (expanded) {
      if (componentData.expandRows.indexOf(id) === -1) componentData.expandRows.push(id)
    } else {
      componentData.expandRows = componentData.expandRows.filter((item) => item !== id)
    }
  }
}
function cardRowStyle({ row, rowIndex }) {
  return {
    borderBottom: '1px solid #f0f0f0',
    transition: 'all 0.3s ease'
  }
}
const rowHeightClass = computed(() => {
  return 'row-height-' + componentData.rowHeightStatus + (componentProps.hasImageColumn ? ' row-height-image' : '')
})
const treeRowKey = computed(() => {
  return attrs['tree-config'] ? attrs['tree-config'].rowField : undefined
})
watch(
  () => componentProps.value,
  function () {
    setTableSelectRow()
  },
  {
    immediate: true
  }
)
watch(
  () => attrs.data,
  function (newValue, oldValue) {
    if (newValue === oldValue) return
    if (treeRowKey.value != null) {
      let nodeList = []
      traverseTree(attrs.data, (node) => nodeList.push(node), 'children')
      let defaultExpandRows = nodeList.filter((row) => {
        return componentData.expandRows.indexOf(row[treeRowKey.value]) !== -1
      })
      componentData.expandRows = defaultExpandRows.map((item) => item[treeRowKey.value])
      if (tableRef.value) {
        nextTick(() => {
          tableRef.value.setTreeExpand(defaultExpandRows, true)
        })
      }
    }
  },
  {
    immediate: true
  }
)
onMounted(() => {
  nextTick(() => {
    const $table = tableRef.value
    const $toolbar = toolbarRefRef.value
    if ($table && $toolbar) {
      $table.connect($toolbar)
    }
  })
})
defineExpose({
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
  cardRowStyle,
  ...toRefs(componentData),
  rowHeightClass,
  treeRowKey
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

      background-image: radial-gradient(circle at 10% 50%, rgba(14, 139, 141, 0.02), transparent 40%),
        radial-gradient(circle at 90% 100%, rgba(14, 139, 141, 0.08), transparent 40%) !important;
      border: 1px solid rgba(14, 139, 141, 0.2) !important;
      box-shadow: 0 12px 24px rgba(14, 139, 141, 0.05), 0 4px 8px rgba(0, 0, 0, 0.05) !important;

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
