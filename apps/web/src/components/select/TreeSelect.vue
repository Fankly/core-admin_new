<template>
  <el-select @remove-tag="selectChange" collapse-tags v-model="selectTree" placeholder="请选择" :teleported="false" multiple class="select-tree">
    <el-option :value="selectTreeValue" style="height: auto">
      <el-tree :data="data" show-checkbox :node-key="nodeKey" ref="tree" :props="defaultProps" @check="handleCheckChange"></el-tree>
    </el-option>
  </el-select>
</template>

<script setup>
import { reactive, ref, proxyRefs, useTemplateRef } from 'vue'
const componentProps = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  lazy: {
    type: Boolean,
    default: false
  },
  dataType: {
    type: String,
    default: 'id'
  },
  isChildNode: {
    type: Boolean,
    default: true
  },
  defaultProps: {
    type: Object,
    default: () => ({
      children: 'children',
      label: 'label'
    })
  },
  nodeKey: {
    type: String,
    default: 'id'
  },
  isLeaf: {
    type: Boolean,
    default: true
  },
  isAll: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits()
const treeRef = useTemplateRef('tree')
const selectTree = ref('')
const selectTreeValue = reactive([])
const setupState = proxyRefs({
  selectTreeValue,
  selectTree
})
// 清空选择
function clearSelect() {
  setupState.selectTreeValue = []
  setupState.selectTree = ''
  treeRef.value.setCheckedKeys([])
}
function selectChange(e) {
  clearSelect()
  emit('clearData')
}
function handleCheckChange() {
  let res = treeRef.value.getCheckedNodes(componentProps.isLeaf, componentProps.isChildNode) //这里两个true，1. 是否只是叶子节点 2. 是否包含半选节点（就是使得选择的时候不包含父节点）
  let arrLabel = []
  let arr = []
  let dataType = []
  res.forEach((item) => {
    arrLabel.push(item[componentProps.defaultProps.label])
    arr.push(item)
    dataType.push(item[componentProps.dataType])
  })
  setupState.selectTreeValue = arr
  setupState.selectTree = arrLabel
  if (componentProps.isAll) {
    emit('selectChange', arr)
  } else {
    emit('selectChange', dataType)
  }
}
defineExpose({
  selectTreeValue,
  selectTree,
  clearSelect,
  selectChange,
  handleCheckChange
})
</script>

<style lang="less" scoped>
.el-select {
  width: 100%;
}

:deep(.el-select-dropdown__wrap) {
  max-height: 400px;
}

.select-drop-down {
  position: relative;
}

.select-tree {
  .el-select-dropdown__item {
    padding: 0 10px;
  }

  .el-select-dropdown__item.hover,
  .el-select-dropdown__item:hover {
    background: transparent;
  }

  .el-tree-node__content {
    position: relative;
  }

  .el-tree-node__expand-icon.expanded {
    position: absolute;
    top: 0;
    right: 0;
  }

  .el-tree-node__expand-icon {
    position: absolute;
    top: 0;
    right: 0;
  }

  .el-tree-node__expand-icon.expanded {
    transform: rotate(-180deg);
  }
}
</style>
