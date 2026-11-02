<template>
  <div class="tree-select">
    <el-select
      style="width: 100%"
      v-model="selectedLabel"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :filterable="filterable"
      @clear="clearSelected"
      @click="togglePopover"
      @visible-change="handleVisibleChange"
      remote
      :remote-method="remoteMethod"
      :teleported="true"
      :popper-class="['tree-select-dropdown', popperClass].join(' ')"
      ref="select"
    >
      <el-option :value="selectedValue || ''" :label="selectedLabel" class="tree-select-option">
        <div class="tree-container">
          <el-tree
            ref="tree"
            class="custom-tree"
            :data="data"
            :props="props"
            :node-key="nodeKey"
            :default-expanded-keys="defaultExpandedKeys"
            :default-expand-all="defaultExpandAll"
            :show-checkbox="multiple"
            :check-strictly="checkStrictly"
            :filter-node-method="filterNode"
            :current-node-key="selectedValue"
            @node-click="handleNodeClick"
            @check="handleCheckChange"
            :highlight-current="highlightCurrent"
          >
            <template #default="{ node, data }">
              <div
                class="custom-tree-node"
                :class="{
                  'is-checked': multiple && isNodeChecked(data)
                }"
              >
                {{ data[props.label] }}
              </div>
            </template>
          </el-tree>
        </div>
      </el-option>
    </el-select>
  </div>
</template>

<script setup>
import { nextTick, reactive, toRef, toRefs, watch, onMounted, useTemplateRef } from 'vue'
defineOptions({
  name: 'TreeSelect'
})
const componentProps = defineProps({
  // 选中的值
  modelValue: {
    type: [String, Number, Array],
    default: ''
  },
  // 数据源
  data: {
    type: Array,
    default: () => []
  },
  // 配置项
  props: {
    type: Object,
    default: () => ({
      label: 'label',
      value: 'value',
      children: 'children'
    })
  },
  // 节点唯一标识
  nodeKey: {
    type: String,
    default: 'value'
  },
  // 占位符
  placeholder: {
    type: String,
    default: '请选择'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  highlightCurrent: {
    type: Boolean,
    default: false
  },
  // 是否可清空
  clearable: {
    type: Boolean,
    default: true
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 是否可搜索
  filterable: {
    type: Boolean,
    default: false
  },
  // 仅叶子节点可选
  onlyLeafSelectable: {
    type: Boolean,
    default: true
  },
  // 默认展开的节点
  defaultExpandedKeys: {
    type: Array,
    default: () => []
  },
  // 是否默认展开所有节点
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  // 在多选模式下，是否严格遵循父子不互相关联
  checkStrictly: {
    type: Boolean,
    default: false
  },
  // 下拉框的类名
  popperClass: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['update:modelValue', 'change', 'clear'])
const treeRef = useTemplateRef('tree')
const selectRef = useTemplateRef('select')
const componentData = reactive({
  selectedValue:
    componentProps.modelValue !== undefined && componentProps.modelValue !== null
      ? componentProps.modelValue
      : componentProps.multiple
        ? []
        : '',
  selectedLabel: '',
  isPopoverVisible: false,
  filterText: ''
})
const selectedValue = toRef(componentData, 'selectedValue')
const selectedLabel = toRef(componentData, 'selectedLabel')
const isPopoverVisible = toRef(componentData, 'isPopoverVisible')
const filterText = toRef(componentData, 'filterText')
// 检查节点是否被选中（多选模式）
function isNodeChecked(node) {
  if (!componentProps.multiple || !Array.isArray(componentData.selectedValue) || !treeRef.value) {
    return false
  }
  return componentData.selectedValue.includes(node[componentProps.nodeKey])
}
// 切换下拉框显示状态
function togglePopover() {
  componentData.isPopoverVisible = !componentData.isPopoverVisible
}
// 辅助方法：应用选中样式
function applySelectedStyle() {
  if (!treeRef.value || componentProps.multiple) return

  // 先移除所有节点的选中效果
  const allNodes = document.querySelectorAll('.custom-tree .el-tree-node__content')
  allNodes.forEach((node) => {
    node.style.backgroundColor = ''
    node.style.color = ''

    // 重置所有子元素的颜色
    const nodeLabel = node.querySelector('.el-tree-node__label')
    if (nodeLabel) nodeLabel.style.color = ''
    const customNode = node.querySelector('.custom-tree-node')
    if (customNode) customNode.style.color = ''
  })
  if (componentData.selectedValue) {
    // 为当前节点添加选中效果
    const currentNode = document.querySelector(`.custom-tree .el-tree-node.is-current > .el-tree-node__content`)
    if (currentNode) {
      currentNode.style.backgroundColor = 'var(--el-color-primary, #00706b)'
      currentNode.style.color = '#fff'

      // 为当前节点的子元素添加选中效果
      const nodeLabel = currentNode.querySelector('.el-tree-node__label')
      if (nodeLabel) nodeLabel.style.color = '#fff'
      const customNode = currentNode.querySelector('.custom-tree-node')
      if (customNode) customNode.style.color = '#fff'
    }
  }
}
// 处理下拉框显示状态变化
function handleVisibleChange(visible) {
  componentData.isPopoverVisible = visible
  if (!visible) {
    // 关闭下拉框时清空过滤文本
    componentData.filterText = ''

    // 重新应用选中样式
    nextTick(() => {
      applySelectedStyle()
    })
  }
}
// 远程搜索方法
function remoteMethod(query) {
  componentData.filterText = query
}
// 过滤节点的方法
function filterNode(value, data) {
  if (!value) return true

  // 获取节点的标签文本
  const label = data[componentProps.props.label]

  // 不区分大小写的搜索
  return label.toLowerCase().includes(value.toLowerCase())
}
// 处理节点点击事件
function handleNodeClick(data, node) {
  if (componentProps.multiple) return

  // 如果不是叶子节点且有子节点，则不选中
  if (componentProps.onlyLeafSelectable && !node.isLeaf && node.childNodes && node.childNodes.length > 0) return
  componentData.selectedValue = data[componentProps.nodeKey] || ''
  componentData.selectedLabel = data[componentProps.props.label] || ''
  componentData.filterText = '' // 清空搜索文本

  // 设置当前节点为选中状态
  if (treeRef.value) {
    treeRef.value.setCurrentKey(data[componentProps.nodeKey])

    // 手动添加选中效果
    nextTick(() => {
      applySelectedStyle()
    })
  }
  emit('update:modelValue', componentData.selectedValue)
  emit('change', data)

  // 关闭下拉框
  nextTick(() => {
    selectRef.value.blur()
  })
}
// 处理复选框选中状态变化
function handleCheckChange() {
  if (!componentProps.multiple) return
  const checkedNodes = treeRef.value.getCheckedNodes()
  const checkedKeys = checkedNodes.map((node) => node[componentProps.nodeKey])
  componentData.selectedValue = checkedKeys
  componentData.selectedLabel = checkedNodes.map((node) => node[componentProps.props.label]).join(', ')
  emit('update:modelValue', componentData.selectedValue)
  emit('change', checkedNodes)
}
// 清空选中
function clearSelected() {
  componentData.selectedValue = componentProps.multiple ? [] : ''
  componentData.selectedLabel = ''
  componentData.filterText = ''
  if (treeRef.value) {
    if (componentProps.multiple) {
      treeRef.value.setCheckedKeys([])
    } else {
      treeRef.value.setCurrentKey(null)

      // 清除选中样式
      nextTick(() => {
        applySelectedStyle()
      })
    }
  }
  emit('update:modelValue', componentData.selectedValue)
  emit('clear')
}
// 更新选中项的显示
function updateSelected() {
  if (!componentProps.data || componentProps.data.length === 0) return
  if (componentProps.multiple) {
    // 多选模式的回显逻辑
    if (Array.isArray(componentData.selectedValue) && componentData.selectedValue.length > 0) {
      nextTick(() => {
        if (treeRef.value) {
          treeRef.value.setCheckedKeys(componentData.selectedValue)
          const checkedNodes = treeRef.value.getCheckedNodes()
          componentData.selectedLabel = checkedNodes.map((node) => node[componentProps.props.label]).join(', ')
        }
      })
    } else {
      if (treeRef.value) treeRef.value.setCheckedKeys([])
      componentData.selectedLabel = ''
    }
  } else {
    // 单选模式的回显逻辑
    const findNode = (data, value) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i][componentProps.nodeKey] === value) {
          return data[i]
        }
        if (data[i][componentProps.props.children] && data[i][componentProps.props.children].length > 0) {
          const result = findNode(data[i][componentProps.props.children], value)
          if (result) return result
        }
      }
      return null
    }
    if (componentData.selectedValue) {
      const node = findNode(componentProps.data, componentData.selectedValue)
      componentData.selectedLabel = node ? node[componentProps.props.label] : ''

      // 设置当前节点为选中状态
      nextTick(() => {
        if (treeRef.value) {
          treeRef.value.setCurrentKey(componentData.selectedValue)

          // 手动添加选中效果
          nextTick(() => {
            applySelectedStyle()
          })
        }
      })
    } else {
      componentData.selectedLabel = ''
      // 清除当前选中状态
      nextTick(() => {
        if (treeRef.value) {
          treeRef.value.setCurrentKey(null)

          // 清除选中样式
          nextTick(() => {
            applySelectedStyle()
          })
        }
      })
    }
  }
}
// 获取选中的节点数据
function getCheckedNodes() {
  return treeRef.value ? treeRef.value.getCheckedNodes() : []
}
// 获取选中的节点的键值
function getCheckedKeys() {
  return treeRef.value ? treeRef.value.getCheckedKeys() : []
}
// 设置选中的节点，通过keys
function setCheckedKeys(keys) {
  if (treeRef.value) {
    treeRef.value.setCheckedKeys(keys)
    handleCheckChange()
  }
}
watch(
  () => componentProps.modelValue,
  function (val) {
    componentData.selectedValue = val !== undefined && val !== null ? val : componentProps.multiple ? [] : ''
    updateSelected()
  },
  {
    immediate: true,
    deep: true
  }
)
watch(
  () => componentProps.data,
  function () {
    nextTick(() => {
      updateSelected()
    })
  },
  {
    deep: true
  }
)
watch(
  () => componentData.filterText,
  function (val) {
    if (treeRef.value) {
      treeRef.value.filter(val)

      // 当有搜索文本时，展开所有节点以便查看搜索结果
      if (val && treeRef.value.store) {
        treeRef.value.store.defaultExpandAll = true
      }
    }
  }
)
onMounted(() => {
  nextTick(() => {
    updateSelected()
  })
})
defineExpose({
  isNodeChecked,
  togglePopover,
  applySelectedStyle,
  handleVisibleChange,
  remoteMethod,
  filterNode,
  handleNodeClick,
  handleCheckChange,
  clearSelected,
  updateSelected,
  getCheckedNodes,
  getCheckedKeys,
  setCheckedKeys,
  ...toRefs(componentData)
})
</script>

<style>
/* 全局样式，确保能够覆盖 Element Plus 的默认样式 */
/* 移除全局样式，改为使用手动 DOM 操作来设置样式 */
</style>

<style scoped>
.tree-select {
  width: 100%;
}

.tree-select-option {
  height: auto;
  padding: 0;
  overflow: visible;
}

.tree-container {
  width: 100%;
}

/* 自定义树节点样式 */
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

/* 多选模式下选中状态样式 */
.custom-tree-node.is-checked {
  color: var(--color-primary, #409eff);
  font-weight: bold;
}

/* 下拉选项样式 */
.tree-select :deep(.el-select-dropdown__item) {
  height: auto;
  padding: 0;
  overflow: visible;
  font-weight: normal !important;
}

/* 确保选中状态下字体也不会变粗 */
.tree-select :deep(.el-select-dropdown__item.selected) {
  font-weight: normal !important;
}

/* 确保悬停状态下字体也不会变粗 */
.tree-select :deep(.el-select-dropdown__item:hover) {
  font-weight: normal !important;
}

/* 树组件样式 */
.tree-select :deep(.el-tree) {
  min-width: 250px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 5px 0;
}

/* 树节点容器 */
:deep(.el-tree-node) {
  font-weight: normal !important;
  width: 100%;
}

/* 树节点内容 */
.tree-select :deep(.el-tree-node__content) {
  height: 34px;
  padding-right: 20px;
}

/* 当前选中节点样式 - 使用更直接的选择器 - 移除这些样式，改为使用手动 DOM 操作 */
/* :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-color-primary, #00706b) !important;
  color: #fff !important;
}

:deep(.el-tree-node.is-current > .el-tree-node__content .el-tree-node__label),
:deep(.el-tree-node.is-current > .el-tree-node__content .custom-tree-node) {
  color: #fff !important;
}

:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-color-primary, #00706b) !important;
  color: #fff !important;
} 

/* 悬停状态的树节点 */
.tree-select :deep(.el-tree-node__content:hover) {
  background-color: var(--el-select-option-hover-background, #f5f7fa) !important;
}

/* 下拉框样式 */
:deep(.tree-select-dropdown) {
  min-width: 250px !important;
  max-height: none !important;
  overflow: visible !important;
}

:deep(.tree-select-dropdown .el-select-dropdown__wrap) {
  max-height: none !important;
}

:deep(.tree-select-dropdown .el-scrollbar__view) {
  overflow: visible !important;
}

/* 隐藏空标签 */
:deep(.el-tree-node__label:empty) {
  display: none;
}

/* 确保选择器输入框中的文字也不会变粗 */
.tree-select :deep(.el-select__input) {
  font-weight: normal !important;
}

/* 确保选择器显示框中的文字也不会变粗 */
.tree-select :deep(.el-select__tags-text) {
  font-weight: normal !important;
}

/* 确保选择器中的所有文字都不会变粗 */
.tree-select :deep(.el-select) {
  font-weight: normal !important;
}

/* 确保下拉框中的所有文字都不会变粗 */
:deep(.el-select-dropdown) {
  font-weight: normal !important;
}

/* 确保下拉框中的所有选项文字都不会变粗 */
:deep(.el-select-dropdown__item) {
  font-weight: normal !important;
}

/* 选中节点的复选框样式 */
.tree-select :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--el-color-primary, #00706b) !important;
  border-color: var(--el-color-primary, #00706b) !important;
}

/* 选中节点的复选框文本样式 */
.tree-select :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: var(--el-color-primary, #00706b) !important;
}

/* 调整树节点的缩进 */
.tree-select :deep(.el-tree-node__children) {
  padding-left: 16px;
}

/* 调整展开箭头的位置 */
.tree-select :deep(.el-tree-node__expand-icon) {
  padding: 8px;
}
</style>
