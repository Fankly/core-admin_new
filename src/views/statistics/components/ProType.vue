<template>
  <el-select ref="selectRef" v-model="selectedValue" :placeholder="placeholder" clearable @clear="clearHandle" popper-class="tree-select">
    <el-option value="" style="height: 300px; padding: 0">
      <el-tree highlight-current ref="treeRef" :data="treeData" :props="defaultProps" node-key="id" :current-node-key="modelValue" @node-click="handleNodeClick"></el-tree>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { computed, defineProps, ref, watch, defineEmits } from "vue";

const props = defineProps({
  treeData: {
    type: Array,
    required: true
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
      label: "label"
    })
  },
  leafOnly: {
    type: Boolean,
    default: false
  },
  valueKey: {
    type: String,
    default: "id"
  }
});

const emit = defineEmits(["update:modelValue"]);

const defaultProps = computed(() => props.props);

const selectedValue = ref();
const treeRef = ref();
const selectRef = ref();

const handleNodeClick = (node: any): void => {
  if (props.leafOnly && node[props.props.children]?.length) {
    return;
  }
  selectedValue.value = node[props.props.label];
  emit("update:modelValue", node[props.valueKey]);
  selectRef.value?.blur();
};

const findNodeByValue = (data: any[], value: string | number): any => {
  for (const node of data) {
    if (node[props.valueKey] === Number(value)) {
      return node;
    }
    if (node[props.props.children]) {
      const found = findNodeByValue(node[props.props.children], value);
      if (found) return found;
    }
  }
  return null;
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      treeRef.value?.setCurrentKey(null);
      selectedValue.value = "";
    } else {
      const node = findNodeByValue(props.treeData, newValue);
      if (node) {
        selectedValue.value = node[props.props.label];
        treeRef.value?.setCurrentKey(newValue);
      }
    }
  },
  {
    immediate: true
  }
);

watch(
  () => props.treeData,
  (newTreeData) => {
    if (newTreeData && newTreeData.length > 0 && props.modelValue) {
      const node = findNodeByValue(newTreeData, props.modelValue);
      if (node) {
        selectedValue.value = node[props.props.label];
        treeRef.value?.setCurrentKey(props.modelValue);
      }
    }
  },
  {
    immediate: true
  }
);

const clearHandle = () => {
  selectedValue.value = "";
  emit("update:modelValue", "");
};
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
