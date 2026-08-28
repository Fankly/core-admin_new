<template>
  <el-select :disabled="disabled" @change="clearHandle" v-model="selectedData" collapse-tags placeholder="请选择" :popper-append-to-body="false" multiple class="select-tree">
    <el-option style="height: auto">
      <el-tree :default-expanded-keys="defaultExpandedKeys" node-key="id" @check="getCheckedDataHandle" ref="dwSelectRef" show-checkbox lazy :props="dwProps" :load="lazyLoad" :check-strictly="true"></el-tree>
    </el-option>
  </el-select>
</template>

<script lang="ts">
export default {
  name: "DwSelect"
};
</script>

<script setup lang="ts">
import { getBizOrgXzTree } from "@/api/common";
import { ElMessage } from "element-plus";
import { reactive, defineProps, ref, defineExpose, watch, computed, defineEmits } from "vue";

interface NodeData {
  code: string;
  id: string;
  leaf: boolean;
  leafString: string | null;
  name: string;
  nodeType: string;
  parentId: string;
}

interface Props {
  dwId: string;
  userInfo?: any;
  flag?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits(["searchTable", "clearData"]);

const selectedData = ref<any>("");

const dwSelectRef = ref();

const disabled = computed(() => props.userInfo && props.userInfo.code === "ZZ");

const selectedAllData = ref<any>({});

watch(
  () => selectedAllData.value,
  (newVal, oldVal) => {
    selectedData.value = newVal.map((item: any) => item.name);
  }
);

const dwProps = reactive({
  label: "name",
  isLeaf: "leaf"
});

const defaultExpandedKeys = reactive<any[]>([]);

const clearHandle = () => {
  selectedData.value = "";
  dwSelectRef.value.setCheckedNodes([]);
  emit("clearData");
};

const getCheckedDataHandle = (data: NodeData) => {
  let node = dwSelectRef.value.getNode(data);
  expandTreeNodeHandle(node);
};

const expandTreeNodeHandle = (node: any) => {
  if (node.expanded) {
    setCheckedValue(node);
  } else {
    if (!node.checked) {
      setCheckedValue(node);
    }
    const allSelectedNodes = dwSelectRef.value.getCheckedNodes();
    selectedAllData.value = allSelectedNodes;
  }
};

const setCheckedValue = (node: any) => {
  const selectedKeys = dwSelectRef.value.getCheckedKeys();
  let ids = [node.data.id];
  let childNodes: any[] = node.childNodes;
  let childIds = childNodes.map((item) => item.data.id);
  ids = ids.concat(childIds);
  if (node.checked) {
    ids = ids.concat(selectedKeys);
    dwSelectRef.value.setCheckedKeys(ids);
  } else {
    // 过滤数据
    let filterIds = selectedKeys.filter((item: string) => !ids.includes(item));
    dwSelectRef.value.setCheckedKeys(filterIds);
  }
  const allSelectedNodes = dwSelectRef.value.getCheckedNodes();
  selectedAllData.value = allSelectedNodes;
};

const lazyLoad = async (node: any, resolve: any) => {
  let parentId = node.level === 0 ? "-1" : node.data.id;
  let nodeType = node.level === 0 ? "" : node.data.nodeType;
  let params: any = {
    dwId: props.dwId,
    parentId: parentId
  };
  if (props.userInfo) {
    params["bmid"] = props.userInfo.specialorgid;
    params["roleCode"] = props.userInfo.code;
  }
  if (nodeType) params.nodeType = nodeType;
  let res = await getBizOrgXzTree(params);
  if (node.level === 0) {
    if (res.data && res.data.length === 1 && !res.data[0].leaf) {
      defaultExpandedKeys.push(res.data[0].id);
    }
    if (res.data && res.data.length === 1 && res.data[0].leaf) {
      selectedData.value = [res.data[0].name];
      dwSelectRef.value.setCheckedKeys([res.data[0].id]);
      emit("searchTable", res.data[0]);
    }
  }
  if (res.success) {
    if (props.flag) {
      const data = res.data.filter((item) => item.name !== "子公司");
      resolve(data);
    } else {
      resolve(res.data);
    }
  } else {
    ElMessage.error(res.msg);
    resolve([]);
  }
};

defineExpose({
  dwSelectRef,
  clearHandle
});
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
}
</style>
