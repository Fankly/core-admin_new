<template>
  <vxe-modal height="200" width="24%" v-bind="$attrs" :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" :title="modalTitle" v-model="showModal" position="center">
    <el-form>
      <el-form-item label="当前年度：">
        <el-select :disabled="true" class="nd-select" v-model="formData.sourceNd" placeholder="请选择" style="width: 100%">
          <template v-for="item in props.ndList" :key="item.yearCode">
            <el-option :label="item.yearName" :value="item.yearCode"></el-option>
          </template>
        </el-select>
      </el-form-item>
      <el-form-item label="复制年度：">
        <el-select class="nd-select" v-model="formData.targetNd" placeholder="请选择" style="width: 100%">
          <template v-for="item in props.ndList" :key="item.yearCode">
            <el-option :label="item.yearName" :value="item.yearCode"></el-option>
          </template>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="btn">
      <el-button plain size="mini" type="primary" @click="saveHandle">确 定</el-button>
      <el-button plain size="mini" type="primary" @click="cancelHandle">取 消</el-button>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "copyStatConfig"
};
</script>
<script setup lang="ts">
import { copyStatConfig } from "@/api/statistics/budgetStatisticsConfig";
import { ElMessage } from "element-plus";
import { defineProps, ref, defineEmits, defineExpose, reactive } from "vue";

interface NdList {
  yearName: string;
  yearCode: string;
}

interface Props {
  nd: string;
  ndList: NdList[];
  busiType: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["close", "copy"]);

const showModal = ref(false);
const loading = ref(false);
const modalTitle = ref("预算统计报表配置-复制");

const formData = reactive({
  sourceNd: "",
  targetNd: "",
  busiType: ""
});

const saveHandle = async () => {
  if (!formData.targetNd) {
    ElMessage.warning("请先选择复制年度进行操作！");
    return;
  }
  let res = await copyStatConfig(props.busiType || formData.busiType, formData.sourceNd, formData.targetNd);
  if (res.success) {
    ElMessage.success("复制成功！");
    cancelHandle();
  } else {
    ElMessage.error(res.msg);
  }
};

const cancelHandle = () => {
  formData.sourceNd = "";
  formData.targetNd = "";
  closeHandle();
};

const showHandle = async () => {
  formData.sourceNd = props.nd;
  formData.busiType = props.busiType;
};
const closeHandle = () => {
  showModal.value = false;
  emit("close", showModal.value);
};

defineExpose({
  showModal
});
</script>

<style scoped>
.btn {
  text-align: center;
}
</style>
