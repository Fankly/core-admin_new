<template>
  <div v-loading="loading">
    <div class="searchBox">
      <el-input placeholder="输入关搜索内容" v-model="filterText" suffix-icon="el-icon-search"> </el-input>
    </div>
    <div class="sonTtreeBox">
      <el-tree ref="tree" class="filter-tree" show-checkbox node-key="id" :data="treeData" :props="defaultProps" :filter-node-method="filterNode" :check-strictly="true" @check="treeCheck">
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <img style="margin-right: 5px" v-if="data.leaf === '0'" src="@/assets/comprehensive/tree1.png" alt="" />
            <img style="margin-right: 5px" v-else src="@/assets/comprehensive/tree2.png" alt="" />
            <span>{{ node.label }}</span>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script>
import { defineComponent, reactive } from "vue";
import baseService from "@/service/baseService";
import { ElMessage } from "element-plus";
export default defineComponent({
  name: "/budget-process/process-33",

  setup() {
    return reactive({
      loading: true,
      data: [],
      treeData: [],
      treeId: "",
      projectName: "",
      filterText: "",
      defaultProps: {
        children: "child",
        label: "name"
      }
    });
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    }
  },
  created() {
    this.getTreeData("0");
  },
  methods: {
    getTreeData(val, data) {
      const params = {
        parentId: val
      };
      baseService.post("/xmsxwh/getProTypeTreeAll", params).then((res) => {
        if (res.success) {
          this.treeData = res.data;
          this.loading = false;
        } else {
          ElMessage({
            type: "error",
            message: "项目类别树数据获取失败"
          });
          this.loading = false;
        }
      });
    },
    treeCheck(node, list) {
      if (list.checkedKeys.length == 2) {
        this.$refs.tree.setCheckedKeys([node.id]);
        this.treeId = node.id;
        this.$emit("getName", node.name);
      }
      this.treeId = node.id;
      this.$emit("getName", node.name);
    },

    filterNode(value, data) {
      if (!value) return true;
      return data.name.indexOf(value) !== -1;
    }
  }
});
</script>

<style lang="less" scoped>
.sonTtreeBox {
  width: 100%;
  height: 500px;
}
</style>
