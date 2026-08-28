<template>
  <el-select @remove-tag="selectChange" collapse-tags v-model="selectTree" placeholder="请选择"
    :popper-append-to-body="false" multiple class="select-tree">
    <el-option :value="selectTreeValue" style="height: auto">
      <el-tree  :check-strictly="checkStrictly" :data="data" show-checkbox :node-key="nodeKey"
        ref="tree" :lazy="lazy" :load="loadNode" :props="defaultProps" :default-expand-all="defaultExpandAll" @check="handleCheckChange"></el-tree>
    </el-option>
  </el-select>
</template>

<script>
import { reactive, ref } from "vue";
import { getSubProtypeTree, getPublicData,getBizOrgTreeNoPermission } from "@/api/common"; //公共代码


export default {
  props: {
    data: {
      type: Array,
      default: () => []
    },
    lazy: {
      type: Boolean,
      default: false
    },
    dataType: {
      type: String,
      default: "id"
    },
    isChildNode: {
      type: Boolean,
      default: true
    },
    defaultProps: {
      type: Object,
      default: () => ({
        children: "children",
        label: "label"
      })
    },
    checkStrictly: { //严格检查模式
      type: Boolean,
      default: false
    },
    nodeKey: {
      type: String,
      default: "id"
    },
    isLeaf: {
      type: Boolean,
      default: true
    },
    isAll: {
      type: Boolean,
      default: false
    },
    defaultExpandAll: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const selectTree = ref("");
    const selectTreeValue = reactive([]);
    return {
      selectTreeValue,
      selectTree
    };
  },
  methods: {
    // 清空选择
    clearSelect() {
      this.selectTreeValue = [];
      this.selectTree = "";
      this.$refs.tree.setCheckedKeys([]);
    },
    selectChange(e) {
      this.clearSelect();
      this.$emit("clearData");
    },
    async loadNode (node, resolve)  {
      if(!this.lazy){return}
      if(node.leaf){
        return resolve([]);
      }
      try {
        const nodeData = node.data.id;
        const children = await getBizOrgTreeNoPermission(nodeData);
        if (children.success) {
          // children.data.forEach(item=>{
          //   item.children=[]
          // })
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
    },
    handleCheckChange() {
      let res = this.$refs.tree.getCheckedNodes(this.isLeaf, this.isChildNode); //这里两个true，1. 是否只是叶子节点 2. 是否包含半选节点（就是使得选择的时候不包含父节点）
      let arrLabel = [];
      let arr = [];
      let dataType = [];
      res.forEach((item) => {
        arrLabel.push(item[this.defaultProps.label]);
        arr.push(item);
        dataType.push(item[this.dataType]);
      });
      this.selectTreeValue = arr;
      this.selectTree = arrLabel;
      if (this.isAll) {
        this.$emit("selectChange", arr);
      } else {
        this.$emit("selectChange", dataType);
      }
    }
  }
};
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
