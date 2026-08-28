<template>
  <el-select v-model="value" class="m-2" placeholder="请选择">
    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>
</template>

<script>
import { defineComponent, reactive } from "vue";
import { ElMessage } from "element-plus";
export default defineComponent({
  setup() {
    return reactive({
      value: "",
      options: [
        {
          value: "新建",
          label: "新建"
        },
        {
          value: "续建",
          label: "续建"
        },
        {
          value: "结转",
          label: "结转"
        }
      ]
    });
  },
  methods: {
    clear() {
      this.value = "";
    }
  }
});
</script>
<style lang="less" scoped></style>
