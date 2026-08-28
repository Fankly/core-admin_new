<script setup lang="ts">
import { ref, toRef, defineProps, defineExpose, defineEmits, watchEffect } from "vue";

const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  },
  cnxDatas: Array,
  modelValue: {
    type: Object,
    default: ""
  },
  valueKey: {
    type: String,
    default: "id"
  },
  props: {
    type: Object,
    default: () => ({
      children: "children",
      isLeaf: "leaf",
      label: "cnxName"
    })
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
  placeholder: {
    type: String,
    default: "请选择"
  },
  loadMethod: {
    type: Function,
    default: null
  }
});

const emits = defineEmits(["update:modelValue"]);

const cnxDatas: any = toRef(props, "cnxDatas");

const selectedValues = ref<any[]>([]);

const clearHandle = () => {
  tree.value.setCheckedKeys([]);
  emits("update:modelValue", []);
};

const tree = ref();

const handleCheckChange = (node: any) => {
  // 获取选中的子节点
  const curNode = tree.value.getNode(node[props.valueKey]);
  expandTreeNodeHandle(curNode);
  const checkChildNodes = (node: any, checked: boolean) => {
    const childNodes = node.childNodes || [];
    childNodes.forEach((childNode: any) => {
      tree.value.setChecked(childNode.data[props.valueKey], checked);
      checkChildNodes(childNode, checked);
    });
  };
  if (curNode.checked) {
    checkChildNodes(curNode, true);
  } else {
    checkChildNodes(curNode, false);
  }
  getCheckedDataHandle();
};

const getCheckedDataHandle = () => {
  const selectedDatas: any[] = [];
  const selectedLabels: any[] = [];
  if (tree.value) {
    const childNodes = tree.value.getCheckedNodes(true, false);
    childNodes.forEach((item: any) => {
      if (item.leaf) {
        selectedDatas.push({
          cnx: item.cnxId,
          cnxId: item.id
        });
        selectedLabels.push(item.name);
      }
    });
    selectedValues.value = selectedLabels;
  }
  emits("update:modelValue", selectedDatas);
};

const expandTreeNodeHandle = (node: any) => {
  if (node.checked && !node.expanded && !node.isLeaf) {
    node.expand(function () {
      const childNodes = node.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        tree.value.setChecked(childNode.data[props.valueKey], node.checked);
        if (!childNode.data.leaf) {
          tree.value.$emit("check-change", childNode.data, childNode.checked, childNode.indeterminate);
        } else {
          getCheckedDataHandle();
        }
      }
    });
  }
};

const loadNode = async (node: any, resolve: any) => {
  if (!props.loadMethod) {
    resolve([]);
    return;
  }
  try {
    const nodeData = node.data;
    const children = await props.loadMethod(nodeData);
    if (children.success) {
      resolve(children.data);
      return;
    } else {
      resolve([]);
      return;
    }
  } catch (error) {
    console.error("Failed to load node data:", error);
    resolve([]);
  }
};

watchEffect(() => {
  if (tree.value) {
    if (cnxDatas && cnxDatas.length !== 0) getCheckedDataHandle();
  }
});

defineExpose({
  clearHandle,
  handleCheckChange
});
</script>

<template>
  <el-select ref="selectRef" v-model="selectedValues" :placeholder="placeholder" :clearable="clearable" :disabled="disabled" multiple collapse-tags collapse-tags-tooltip @remove-tag="clearHandle" @clear="clearHandle" popper-class="tree-select">
    <el-option style="height: auto">
      <el-tree
        check-strictly
        :data="treeData"
        :default-checked-keys="cnxDatas && cnxDatas.length !== 0 ? cnxDatas[1] : null"
        :default-expanded-keys="cnxDatas && cnxDatas.length !== 0 ? cnxDatas[0] : null"
        ref="tree"
        node-key="id"
        :props="props.props"
        :lazy="lazy"
        :load="lazy ? loadNode : null"
        show-checkbox
        :expand-on-click-node="false"
        @check-change="handleCheckChange"
      ></el-tree>
    </el-option>
  </el-select>
</template>

<style scoped lang="less">
.el-select {
  width: 100%;
}

:deep(.el-select-dropdown__wrap) {
  max-height: 400px;
}

.select-drop-down {
  position: relative;
}

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

.expanded.el-tree-node__expand-icon.el-icon-arrow-down {
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
</style>
