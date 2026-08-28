<script lang="ts">
export default {
  name: "/statistics/components/MainTable"
};
</script>

<script setup lang="ts">
import { defineProps, onMounted, reactive, ref, defineExpose } from "vue";
import { InitParams } from "@/views/metrics/configData/budgetStatisticsConfig.vue";
import { VxeColumnPropTypes } from "vxe-table";
import { getPublicData } from "@/api/common";
import { ElMessage } from "element-plus";

interface Props {
  mainTableData: any[];
  initParams: InitParams;
}

const props = defineProps<Props>();

const publicList = ref([]);
const mainTableRef = ref();
const mainLoading = ref(false);

const statusList = reactive([
  { label: "是", value: "1" },
  { label: "否", value: "0" }
]);

const recList = reactive([
  { label: "启用", value: "1" },
  { label: "停用", value: "0" }
]);

const formatterStatus: VxeColumnPropTypes.Formatter<any> = ({ cellValue }) => {
  const item = statusList.find((item: any) => item.value === cellValue);
  return item ? item.label : cellValue;
};

const formatterRrc: VxeColumnPropTypes.Formatter<any> = ({ cellValue }) => {
  const item = recList.find((item: any) => item.value === cellValue);
  return item ? item.label : cellValue;
};

const formatterStatMethod: VxeColumnPropTypes.Formatter<any> = ({ cellValue }) => {
  const item: any = publicList.value.find((item: any) => item.code === cellValue);
  return item ? item.name : cellValue;
};

const getPublicDataList = async (code: string) => {
  let res = await getPublicData(code);
  if (res.success && res.data) {
    publicList.value = res.data;
  } else {
    ElMessage.error(res.msg);
  }
};

const initParams = () => {
  getPublicDataList("YSTJPZ_TJFS");
};

onMounted(() => {
  initParams();
});

defineExpose({
  mainTableRef,
  mainLoading
});
</script>

<template>
  <div class="table-box">
    <vxe-table  :loading="mainLoading" ref="mainTableRef" :show-overflow="true" :row-config="{ height: 32, isCurrent: false }" :data="props.mainTableData" align="center" height="100%" border resizable>
      <vxe-column width="80" type="checkbox"></vxe-column>
      <vxe-column width="80" title="序号" field="dispOrder"></vxe-column>
      <vxe-column title="名称" field="configName"></vxe-column>
      <vxe-column  :formatter="formatterStatMethod" title="统计方式" field="statMethod"></vxe-column>
      <vxe-column width="100" :formatter="formatterRrc" title="状态" field="recState"></vxe-column>
      <vxe-column width="100" title="是否显示" field="isDisplay" :formatter="formatterStatus"></vxe-column>
      <vxe-column width="100" :formatter="formatterStatus" title="是否末级节点" field="isleaf"></vxe-column>
      <vxe-column  :formatter="formatterStatus" title="是否纳入单位统计" field="isDwStat"></vxe-column>
      <vxe-column width="100" title="年度" field="nd"></vxe-column>
    </vxe-table>
  </div>
</template>

<style scoped lang="less">
.table-box {
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
}
</style>
