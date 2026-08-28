<script setup lang="ts">
import { getBizOrgTree } from "@/api/common";
import { ElMessage } from "element-plus";
import { reactive, ref, toRef, defineProps, defineExpose, defineEmits, watch, watchEffect } from "vue";

const props = defineProps({
  specialOrgId: String,
  deptDatas: Array
});

const emits = defineEmits(["selectData"]);

const deptSelectData = toRef(props, "deptDatas");
const deptDatas: any = toRef(props, "deptDatas");

const options = reactive({
  label: "name",
  isLeaf: "leaf"
});

const selectData = reactive<any>({
  labelArr: [],
  selectValue: "",
  params: []
});

const clearData = () => {
  selectData.labelArr.length = 0;
  selectData.selectValue = "";
  selectData.params.length = 0;
  tree.value.setCheckedKeys([]);
};

const tree = ref();

const handleCheckChange = (node: any) => {
  // 获取选中的子节点
  const curNode = tree.value.getNode(node.id);
  expandTreeNodeHandle(curNode);
  const checkChildNodes = (node: any, checked: boolean) => {
    const childNodes = node.childNodes || [];
    childNodes.forEach((childNode: any) => {
      tree.value.setChecked(childNode.data.id, checked);
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
  selectData.labelArr.length = 0;
  selectData.params.length = 0;
  selectData.selectValue = "";
  let childNodes = tree.value.getCheckedNodes(true, false);
  childNodes.forEach((item: any) => {
    if (item.leaf) {
      selectData.labelArr.push(item.name);
      selectData.params.push(item.id);
    }
  });
  selectData.selectValue = selectData.labelArr.join(",");
};

const expandTreeNodeHandle = (node: any) => {
  if (node.checked && !node.expanded && !node.isLeaf) {
    node.expand(function () {
      let childNodes = node.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        let childNode = childNodes[i];
        tree.value.setChecked(childNode.data.id, node.checked);
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
  let id = node.level === 0 ? "-1" : node.data.id;
  let res = await getBizOrgTree(id, props.specialOrgId as string);
  if (res.success) {
    resolve(res.data);
  } else {
    ElMessage.error(res.msg);
    resolve([]);
  }
};

watchEffect(() => {
  if (tree.value) {
    if (deptDatas.value && deptDatas.value.length !== 0) getCheckedDataHandle();
  }
});

defineExpose({
  selectData,
  clearData,
  handleCheckChange,
  deptSelectData
});
</script>

<template>
  <el-select v-model="selectData.selectValue">
    <el-option :value="selectData.params" style="height: auto">
      <el-tree check-strictly :default-checked-keys="deptDatas[1]" :default-expanded-keys="deptDatas[0]" :data="deptSelectData" ref="tree" node-key="id" lazy :props="options" :load="loadNode" show-checkbox @check-change="handleCheckChange"></el-tree>
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
