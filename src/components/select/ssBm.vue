<template>
  <el-select v-model="value" placeholder="请选择" clearable filterable @change="changeParams">
    <el-option v-for="item in projects" :key="item.code" :label="item.name" :value="item.code"> </el-option>
  </el-select>
</template>

<script>
import { defineComponent, reactive } from "vue";
import { ElMessage } from "element-plus";
import process from "@/views/budget-process/js/process-data";
import baseService from "@/service/baseService";
export default defineComponent({
  setup() {
    return reactive({
      projects: [],
      //选中数据 页面直接调用即可
      value: "",
      list: []
    });
  },
  created() {
    this.loadData();
  },
  methods: {
    loadData() {
      baseService.get(`/commonCode/getData?code=GKBM`).then((res) => {
        if (res.success == true) {
          this.projects = res.data;
        } else {
          ElMessage({
            type: "error",
            message: res.msg
          });
        }
      });
    },
    changeParams() {
      this.list = [];
      this.list.push(this.value);
    },
    clear() {
      this.value = "";
      this.list = [];
    }
  }
});
</script>
<style lang="less" scoped></style>
