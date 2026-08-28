<template>
  <el-select ref="selectRef" v-model="selectedValues" :placeholder="placeholder" :clearable="clearable" :disabled="disabled" multiple collapse-tags collapse-tags-tooltip @remove-tag="clearHandle" @clear="clearHandle" popper-class="tree-select">
    <el-option style="height: 300px; padding: 0">
      <el-tree ref="treeRef" :data="treeData" :props="props.props" :node-key="valueKey" :expand-on-click-node="false" show-checkbox @check="handleCheck"></el-tree>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { defineProps, ref, watch, defineEmits } from "vue";

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
  }
});

const emit = defineEmits(["update:modelValue"]);

const selectedValues = ref<any[]>([]);
const treeRef = ref();
const selectRef = ref();

const handleCheck = (data: any, { checkedNodes }: any): void => {
  if (props.leafOnly) {
    const leafNodes = checkedNodes.filter((n: any) => !n[props.props.children]?.length);
    const newValues = leafNodes.map((n: any) => n[props.valueKey]);
    const newLabels = leafNodes.map((n: any) => n[props.props.label]);
    selectedValues.value = newLabels;
    emit("update:modelValue", newValues.join(","));
  } else {
    const newValues = checkedNodes.map((n: any) => n[props.valueKey]);
    const newLabels = checkedNodes.map((n: any) => n[props.props.label]);
    selectedValues.value = newLabels;
    emit("update:modelValue", newValues.join(","));
  }
};

const findNodeByValue = (data: any[], value: string | number): any => {
  for (const node of data) {
    if (Number(node[props.valueKey]) === Number(value)) {
      return node;
    }
    if (node[props.props.children]) {
      const found = findNodeByValue(node[props.props.children], value);
      if (found) return found;
    }
  }
  return null;
};

const findNodesByValues = (data: any[], values: string | string[] | (string | number)[]): any[] => {
  const nodes: any[] = [];
  let processedValues: (string | number)[] = [];
  if (typeof values === "string") {
    processedValues = values.split(",").map((v) => v.trim());
  } else {
    processedValues = values;
  }
  processedValues.forEach((value) => {
    const node = findNodeByValue(data, value);
    if (node) nodes.push(node);
  });
  return nodes;
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (!treeRef.value) return;
    if (!newValue?.length) {
      treeRef.value?.setCheckedKeys([]);
      selectedValues.value = [];
    } else {
      const checkedKeys = Array.isArray(newValue) ? newValue : newValue.split(",");
      const nodes = findNodesByValues(props.treeData, newValue as unknown as (string | number)[]);
      selectedValues.value = nodes.map((node) => node[props.props.label]);
      treeRef.value.setCheckedKeys(checkedKeys);
    }
  },
  {
    immediate: true
  }
);

watch(
  () => props.treeData,
  (newTreeData) => {
    if (!treeRef.value) return;
    if (newTreeData?.length && props.modelValue?.length) {
      const checkedKeys = Array.isArray(props.modelValue) ? props.modelValue : props.modelValue.split(",");
      const nodes = findNodesByValues(newTreeData, props.modelValue as unknown as (string | number)[]);
      selectedValues.value = nodes.map((node) => node[props.props.label]);
      treeRef.value.setCheckedKeys(checkedKeys);
    }
  },
  {
    immediate: true
  }
);

const clearHandle = () => {
  selectedValues.value = [];
  emit("update:modelValue", []);
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
</style>
