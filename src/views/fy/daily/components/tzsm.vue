<template>
  <vxe-modal width="30%" v-model="isShowPage" @close="closeHandle" title="调整说明">
    <el-form :model="form">
      <el-form-item label="调整说明：">
        <el-input maxlength="128" v-model="form.tzsm" type="textarea" :rows="6" resize="none" />
      </el-form-item>
    </el-form>
    <div style="text-align: center">
      <el-button @click="detailHandle" type="primary" plain size="mini">确 定</el-button>
      <el-button @click="closeHandle" type="primary" plain size="mini">取 消</el-button>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "tzsm"
};
</script>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { reactive, toRef, defineExpose, withDefaults, defineEmits, defineProps } from "vue";

interface Props {
  isShow: boolean;
}

const props = withDefaults(defineProps<Props>(), {});

const emit = defineEmits(["closeModal", "release"]);

const isShowPage = toRef(props, "isShow");

const form = reactive({
  tzsm: ""
});

const detailHandle = () => {
  if (!form.tzsm) {
    ElMessage.warning("请输入调整说明！");
    return;
  }
  emit("release", form.tzsm);
};

const closeHandle = () => {
  clearValue();
  emit("closeModal", !isShowPage.value);
};

const clearValue = () => {
  form.tzsm = "";
};

defineExpose({
  clearValue
});
</script>

<style scoped lang="less">
.center {
  text-align: center;
}
</style>
