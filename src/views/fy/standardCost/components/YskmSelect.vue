<template>
  <el-select @change="clearHandle" v-model="selectedAllData" collapse-tags placeholder="请选择" :popper-append-to-body="false" multiple class="select-tree">
    <el-option style="height: auto">
      <el-tree node-key="id" @check-change="getCheckedDataHandle" ref="yskmSelectRef" show-checkbox lazy :props="dwProps" :load="lazyLoad"></el-tree>
    </el-option>
  </el-select>
</template>

<script lang="ts">
export default {
  name: "YskmSelect"
};
</script>

<script setup lang="ts">
import { getDataList } from "@/api/fy/searchConfig";
import { ElMessage } from "element-plus";
import { reactive, defineProps, ref, defineExpose, computed } from "vue";

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
  nd: string;
}

const props = defineProps<Props>();

const yskmSelectRef = ref();

const selectedAllData = computed(() => yskmSelectRef.value?.getCheckedNodes().map((item: any) => item.name));

const dwProps = reactive({
  label: "name",
  isLeaf: "leaf"
});

const clearHandle = () => {
  yskmSelectRef.value.setCheckedNodes([]);
};

const getCheckedDataHandle = (data: NodeData) => {
  let node = yskmSelectRef.value.getNode(data);
  expandTreeNodeHandle(node);
};

const expandTreeNodeHandle = (node: any) => {
  if (node.checked && !node.expanded && !node.isLeaf) {
    node.expand(function () {
      let childNodes = node.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        let childNode = childNodes[i];
        if (!childNode.data.leaf) {
          yskmSelectRef.value.$emit("check-change", childNode.data, childNode.checked, childNode.indeterminate);
        }
      }
    });
  }
};

const lazyLoad = async (node: any, resolve: any) => {
  let parentId = node.level === 0 ? "-1" : node.data.id;
  let params = {
    nd: props.nd,
    pid: parentId,
    templateCode: ""
  };
  let res = await getDataList(params);
  if (res.success) {
    const nodes = res.data.map((item: any) => {
      return {
        id: item.id,
        name: item.name,
        leaf: !item.isleaf,
        pid: item.pid
      };
    });
    resolve(nodes);
  } else {
    ElMessage.error(res.msg);
    resolve([]);
  }
};

defineExpose({
  yskmSelectRef,
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
