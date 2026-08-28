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

  methods: {
    clear() {
      this.$refs.myCascader.$refs.panel.checkedValue = [];
      this.$refs.myCascader.$refs.panel.activePath = [];
      this.$refs.myCascader.$refs.panel.clearCheckedNodes();
      this.handle();
    },
    //处理数据
    handle(value) {
      let array = [];
      if (value) {
        value.forEach((item) => {
          array.push(item[item.length - 1]);
        });
        this.selectList = array;
      } else {
        this.selectList = [];
      }
    },

    getProjectType(specialorgid) {
      baseService.get(`/process/code/getGkbm?specialorgid=${specialorgid}`).then((res) => {
        if (res.success == true) {
          this.projects = process.gkbm(res.data);
          this.projects.forEach((item) => {
            this.allId.push(item.code);
            if (item.children) {
              item.children.forEach((e) => {
                this.allId.push(e.code);
                if (e.children) {
                  e.children.forEach((row) => {
                    this.allId.push(row.code);
                    if (row.children) {
                      row.children.forEach((val) => {
                        this.allId.push(val.code);
                        if (val.children) {
                          val.children.forEach((last) => {
                            this.allId.push(last.code);
                          });
                        }
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
