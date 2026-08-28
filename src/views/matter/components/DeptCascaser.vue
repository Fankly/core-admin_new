<template>
  <el-cascader :clearable="true" :props="deptProps" :show-all-levels="false" style="width: 100%" v-model="deptData"> </el-cascader>
</template>

<script lang="ts">
export default {
  name: "DeptCascaser"
};
</script>
<script setup lang="ts">
import { getBizOrgTree } from "@/api/common";
import { ElMessage } from "element-plus";
import { reactive, ref, defineProps, defineExpose } from "vue";

interface Props {
  specialOrgId: string;
}

const deptData = ref();

const props = defineProps<Props>();

const deptProps = reactive({
  value: "id",
  label: "name",
  lazy: true,
  emitPath: false,
  lazyLoad: (node: any, resolve: any) => {
    let id = node.level === 0 ? "-1" : node.data.id;
    getBizOrgTree(id, props.specialOrgId).then((res: any) => {
      if (res.success) {
        resolve(res.data);
      } else {
        ElMessage.error(res.msg);
        resolve([]);
      }
    });
  }
});

defineExpose({
  deptData
});
</script>

<style scoped></style>
