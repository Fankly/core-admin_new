<template>
  <el-select style="width: 100%" ref="selectRef" v-model="selectedValue" :placeholder="placeholder" clearable @clear="clearHandle" popper-class="tree-select">
    <el-option value="" style="height: 300px; padding: 0">
      <el-tree lazy :load="loadData" :expand-on-click-node="false" highlight-current ref="treeRef" :props="defaultProps" node-key="id" :current-node-key="modelValue" @node-click="handleNodeClick"></el-tree>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { computed, defineProps, ref, watch, defineEmits, defineExpose } from "vue";
import { getBizOrgXzTreeExcludeBm } from "@/api/common";

const props = defineProps({
  dwId: {
    type: String,
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
      leaf: "leaf",
      value: "id",
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

const loadData = async (node: any, resolve: any) => {
  if (node.level === 0) {
    const dwListRes = await getBizOrgXzTreeExcludeBm({
      dwId: props.dwId as string,
      parentId: "-1"
    });
    if (dwListRes.success) {
      resolve(dwListRes.data);
    } else {
      resolve([]);
    }
  } else {
    const dwListRes = await getBizOrgXzTreeExcludeBm({
      dwId: props.dwId as string,
      parentId: node.data.id,
      nodeType: node.data.nodeType
    });
    if (dwListRes.success) {
      resolve(dwListRes.data);
    } else {
      resolve([]);
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

const clearHandle = () => {
  selectedValue.value = "";
  emit("update:modelValue", "");
};

defineExpose({
  clearHandle
});
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
