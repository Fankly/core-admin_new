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
          value: "项目已立项",
          label: "项目已立项"
        },
        {
          value: "需求招标中",
          label: "需求招标中"
        },
        {
          value: "合同签订中",
          label: "合同签订中"
        },
        {
          value: "合同已签订",
          label: "合同已签订"
        },
        {
          value: "项目实施中",
          label: "项目实施中"
        },
        {
          value: "项目已竣工",
          label: "项目已竣工"
        },
        {
          value: "项目送审中",
          label: "项目送审中"
        },
        {
          value: "项目审计中",
          label: "项目审计中"
        },
        {
          value: "项目已审定",
          label: "项目已审定"
        },
        {
          value: "项目增资中",
          label: "项目增资中"
        },
        {
          value: "项目已关闭",
          label: "项目已关闭"
        },
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
