<template>
  <el-cascader ref="myCascader" :props="{ multiple: true }" :options="projects" :show-all-levels="false" collapse-tags clearable @change="handle"></el-cascader>
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
      selectList: [],
      //不勾选默认转所有id
      allId: []
    });
  },
  created() {
    this.getProjectType();
  },

  methods: {
    clear() {
      this.$refs.myCascader.$refs.panel.checkedValue = [];
      this.$refs.myCascader.$refs.panel.activePath = [];
      this.$refs.myCascader.$refs.panel.clearCheckedNodes();
      this.handle();
    },
    //处理数据
    handle(value) {
      this.selectList = [];
      if (value) {
        value.forEach((item) => {
          let obj = "";
          item.forEach((row) => {
            obj = obj + row + ",";
          });
          this.selectList.push(obj.slice(0, obj.length - 1));
        });
      } else {
        this.selectList = [];
      }
    },

    //获取项目类型数据
    getProjectType() {
      baseService.get("/process/code/getType").then((res) => {
        if (res.success == true) {
          this.projects = process.optionHandleType(res.data);
          this.projects.forEach((item) => {
            this.allId.push(item.id);
            if (item.children) {
              item.children.forEach((e) => {
                this.allId.push(e.id);
                if (e.children) {
                  e.children.forEach((row) => {
                    this.allId.push(row.id);
                    if (row.children) {
                      row.children.forEach((val) => {
                        this.allId.push(val.id);
                      });
                    }
                  });
                }
              });
            }
          });
        } else {
          ElMessage({
            type: "error",
            message: res.msg
          });
        }
      });
    }
  }
});
</script>
<style lang="less" scoped></style>
