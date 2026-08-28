<template>
  <div class="header">
    <div v-if="isShowPage" class="left">
      <el-button plain size="mini" type="primary" @click="addOrEditDataHandle('ADD')">新 增</el-button>
      <el-button plain size="mini" type="primary" @click="addOrEditDataHandle('EDIT')">编 辑</el-button>
      <el-button plain size="mini" type="primary" @click="delDataHandle">删 除</el-button>
      <el-button plain size="mini" type="primary" @click="copyHandle">复 制</el-button>
    </div>
    <div class="right">
      <span>年度：</span>
      <el-select style="width: 110px" v-model="formData.nd" placeholder="请选择年份">
        <el-option :key="item.yearCode" v-for="item in pageInfo.ndDataList" :label="item.yearName" :value="item.yearCode"></el-option>
      </el-select>
    </div>
  </div>
  <copyStatConfig :busiType="props.busiType" ref="copyStatConfigRef" :ndList="pageInfo.ndDataList" :nd="formData.nd"></copyStatConfig>
</template>

<script lang="ts">
export default {
  name: "/ygConfigData/components/Header"
};
</script>
<script setup lang="ts">
import { onMounted, reactive, computed, ref, watch} from "vue";
import { getYearData } from "@/api/common";
import { ElMessage } from "element-plus";
import copyStatConfig from "@/views/ygConfigData/components/copyStatConfig.vue";

interface Props {
  showPage: boolean;
  busiType: string;
}

interface List {
  yearCode: string;
  yearName: string;
}
const copyStatConfigRef = ref();

const emits = defineEmits(["changeNd", "addData", "deleteData"]);

const props = defineProps<Props>();

const isShowPage = computed(() => props.showPage);

const formData = reactive({
  nd: ""
});

const pageInfo = reactive<{
  [key: string]: List[];
}>({
  ndDataList: []
});

const getYearDataList = async () => {
  let res = await getYearData();
  if (res.success) {
    pageInfo.ndDataList = res.data;
    formData.nd = new Date().getFullYear().toString();
  } else {
    ElMessage.error(res.msg);
  }
};

const copyHandle = () => {
  copyStatConfigRef.value.showModal = true;
};

const addOrEditDataHandle = (flag: string) => {
  emits("addData", flag);
};

const delDataHandle = () => {
  emits("deleteData");
};

watch(
  () => formData.nd,
  (newVal) => {
    emits("changeNd", newVal);
  }
);

const initParams = () => {
  getYearDataList();
};

defineExpose({
  pageInfo,
  formData
});

onMounted(initParams);
</script>

<style scoped lang="less">
.header {
  box-sizing: border-box;
  display: flex;
  padding-bottom: 10px;

  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
    line-height: 32px;
  }

  .right {
    width: 200px;
    text-align: right;
  }
}
</style>
