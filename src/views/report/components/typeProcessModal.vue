<template>
  <vxe-modal @show="showHandle" title="进度指标" v-model="isShowModal" width="70%" height="800" position="center">
    <div class="operation" style="margin-bottom: 10px">
      <el-button type="primary" size="mini" plain @click="exportHandle">导 出</el-button>
    </div>
    <div class="table">
      <vxe-grid ref="gridRef" height="100%" v-bind="gridOptions"></vxe-grid>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineProps, reactive } from "vue";
import { getIndicatorDynamicColumn, getIndicatorsDataListByDw } from "@/api/report";

interface Props {
  clickTableData: any;
}

const props = defineProps<Props>();
const gridRef = ref();

const gridOptions = reactive<any>({
  border: true,
  stripe: true,
  loading: false,
  columnConfig: {
    resizable: true
  },
  align: "center",
  headerAlign: "center",
  showOverflow: true,
  showHeaderOverflow: true,
  rowConfig: {
    height: 32
  },
  columns: [],
  data: []
});

const exportHandle = () => {
  const $table = gridRef.value;
  if ($table) {
    $table.exportData({
      sheetName: "成本性项目三率报表-按单位-进度指标",
      type: "xlsx",
      filename: "成本性项目三率报表-按单位-进度指标",
      useStyle: true
    });
  }
};

const isShowModal = ref(false);

const showHandle = async () => {
  let indicators = "";
  if (props.clickTableData.indicators && props.clickTableData.indicators.length !== 0) {
    indicators = props.clickTableData.indicators.join(",");
  }
  const resColumn = await getIndicatorDynamicColumn({
    dwId: props.clickTableData.dwId,
    endDate: props.clickTableData.endDate,
    indicators: indicators,
    itemId: props.clickTableData.itemId,
    proType: props.clickTableData.proType,
    startDate: props.clickTableData.startDate
  });
  if (resColumn.success) {
    gridOptions.columns = resColumn.data;
  }
  const res = await getIndicatorsDataListByDw({
    dwId: props.clickTableData.dwId,
    endDate: props.clickTableData.endDate,
    indicators: indicators,
    itemId: props.clickTableData.itemId,
    proType: props.clickTableData.proType,
    startDate: props.clickTableData.startDate
  });
  if (res.success) {
    gridOptions.data = res.data;
  }
};

defineExpose({
  isShowModal
});
</script>

<style scoped>
.table {
  height: calc(100% - 40px);
  min-width: 0;
  min-height: 0;
}
</style>
