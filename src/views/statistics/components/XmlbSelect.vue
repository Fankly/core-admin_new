<template>
  <el-select @clear="clearHandle" ref="selectRef" v-model="selectedValues" :placeholder="placeholder" clearable multiple collapse-tags collapse-tags-tooltip @remove-tag="clearHandle" popper-class="tree-select">
    <el-option value="" style="height: 300px; padding: 0">
      <el-tree ref="treeRef" :data="treeData" :props="defaultProps" node-key="id" show-checkbox :default-checked-keys="defaultCheckedKeys" @check="handleCheck"></el-tree>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { computed, defineProps, ref, watch, defineEmits, PropType } from 'vue'

const emit = defineEmits(['update:modelValue'])
const selectRef = ref()
const treeRef = ref()
const selectedValues = ref<string[]>([])

interface TreeNode {
  [key: string]: any
  children?: TreeNode[]
}

const props = defineProps({
  treeData: {
    type: Array as PropType<TreeNode[]>,
    required: true
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  modelValue: {
    type: String,
    default: ''
  },
  props: {
    type: Object,
    default: () => ({
      children: 'children',
      label: 'name'
    })
  },
  leafOnly: {
    type: Boolean,
    default: false
  },
  valueKey: {
    type: String,
    default: 'id'
  }
})

const defaultProps = computed(() => props.props)

const defaultCheckedKeys = computed(() => {
  return props.modelValue ? props.modelValue.split(',') : []
})

const findNodeByValue = (data: any[], value: string | number): TreeNode | null => {
  for (const node of data) {
    if (node[props.valueKey] === value) {
      return node
    }
    if (node[props.props.children]) {
      const found = findNodeByValue(node[props.props.children], value)
      if (found) return found
    }
  }
  return null
}

const findNodesByValues = (data: TreeNode[], values: (string | number)[]): TreeNode[] => {
  const nodes: TreeNode[] = []
  values.forEach((value) => {
    const node = findNodeByValue(data, value)
    if (node) {
      nodes.push(node)
    }
  })
  return nodes
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      treeRef.value?.setCheckedKeys([])
      selectedValues.value = []
    } else {
      const valueArray = newValue.split(',')
      const nodes = findNodesByValues(props.treeData, valueArray)
      selectedValues.value = nodes.map((node) => node[props.props.label])
      treeRef.value?.setCheckedKeys(valueArray)
    }
  },
  {
    immediate: true
  }
)

watch(
  () => props.treeData,
  (newTreeData) => {
    if (newTreeData?.length && props.modelValue?.length) {
      const nodes = findNodesByValues(newTreeData, props.modelValue.split(','))
      selectedValues.value = nodes.map((node) => node[props.props.label])
      treeRef.value?.setCheckedKeys(props.modelValue.split(','))
    }
  },
  {
    immediate: true
  }
)

const handleCheck = () => {
  if (props.leafOnly) {
    const checkedNodes = treeRef.value.getCheckedNodes(false, true)
    const values = checkedNodes.map((node: any) => node[props.valueKey])
    const labels = checkedNodes.map((node: any) => node[props.props.label])
    selectedValues.value = labels
    emit('update:modelValue', values.join(','))
  } else {
    const values = treeRef.value.getCheckedKeys()
    const nodes = findNodesByValues(props.treeData, values)
    selectedValues.value = nodes.map((node) => node[props.props.label])
    emit('update:modelValue', values.join(','))
  }
}

const clearHandle = () => {
  selectedValues.value = []
  emit('update:modelValue', '')
  treeRef.value?.setCheckedKeys([])
}

defineExpose({
  clearHandle
})
</script>

<style scoped lang="less">
.tree-select .el-select-dropdown__item {
  padding: 0 !important;
  height: auto !important;
}

.tree-select .el-tree-node__content {
  height: 34px !important;
}

.tree-select .el-select-dropdown__item.selected {
  font-weight: normal;
  color: inherit;
}
</style>
