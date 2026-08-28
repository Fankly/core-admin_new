<template>
  <el-select :disabled="disabled" :clearable="clearable" ref="selectRef" v-model="selectedValue" :placeholder="placeholder" @clear="clearHandle" popper-class="tree-select">
    <el-option style="height: 300px; padding: 0">
      <el-tree :lazy="lazy" :load="lazy ? loadNode : null" ref="treeRef" :data="treeData" :props="props.props" :node-key="valueKey" :expand-on-click-node="true" @node-click="handleNodeClick" :current-node-key="selectedNodeKey"> </el-tree>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ClassifyData } from "@/views/statistics/interface/CostRelatedItemsInterface";
import { defineProps, ref, watch, defineEmits } from "vue";

const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: "请选择"
  },
  modelValue: {
    type: String,
    default: ""
  },
  props: {
    type: Object,
    default: () => ({
      children: "children",
      isLeaf: "leaf",
      label: "name"
    })
  },
  leafOnly: {
    type: Boolean,
    default: false
  },
  valueKey: {
    type: String,
    default: "id"
  },
  clearable: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  lazy: {
    type: Boolean,
    default: false
  },
  loadMethod: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(["update:modelValue"]);

const selectedValue = ref();
const treeRef = ref();
const selectRef = ref();
const selectedNodeKey = ref();

const handleNodeClick = (node: any): void => {
  if (node.leaf) {
    if (props.leafOnly) {
      selectedValue.value = node[props.props.label];
      emit("update:modelValue", node[props.valueKey]);
      selectRef.value?.blur();
      selectedNodeKey.value = node[props.valueKey];
    } 
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      treeRef.value?.setCurrentKey(null);
    }
  }
);

const loadNode = async (node: any, resolve: (data: any[]) => void) => {
  if (node.level === 0) {
    resolve(props.treeData);
    return;
  }
  if (!props.loadMethod) {
    resolve([]);
    return;
  }
  try {
    const nodeData = node.data;
    const children = await props.loadMethod(nodeData);
    if (children.success) {
      const data = children.data.map((item: ClassifyData) => ({
        ...item,
        leaf: item.isleaf === 0 ? false : true
      }));
      resolve(data);
      return;
    } else {
      resolve([]);
      return;
    }
  } catch (error) {
    console.error("Failed to loaad node data:", error);
    resolve([]);
  }
};

const clearHandle = () => {
  selectedValue.value = "";
  emit("update:modelValue", "");
};
</script>

<style scoped lang="less">
.tree-select {
  cursor: pointer;
}

.tree-select .el-select-dropdown__item {
  padding: 0 !important;
  height: auto !important;
}

.tree-select .el-tree-node__content {
  height: 34px !important;
  cursor: pointer;
}

.tree-select .el-select-dropdown__item.selected {
  font-weight: normal;
  color: inherit;
}

.tree-select .el-tree-node__content.selected {
  color: red !important;
}
</style>
