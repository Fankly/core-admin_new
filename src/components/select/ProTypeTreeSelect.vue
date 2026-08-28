<template>
  <el-select ref="selectRef" v-model="selectedValue" :placeholder="placeholder" clearable @clear="clearHandle" popper-class="tree-select">
    <el-option value="" style="height: 300px; padding: 0">
      <el-tree :expand-on-click-node="false" highlight-current ref="treeRef" :data="treeData" :props="defaultProps" node-key="id" :current-node-key="modelValue" @node-click="handleNodeClick"></el-tree>
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
    type: Object,
    default: () => ({
      id: "",
      name: ""
    })
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
  emit("update:modelValue", {
    id: node[props.valueKey],
    name: node[props.props.label]
  });
  selectRef.value?.blur();
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      treeRef.value?.setCurrentKey(null);
    }
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
