<template>
  <div class="operation">
    <div class="operation-left">
      <slot name="opeartion"></slot>
    </div>
    <div class="operation-right">
      <template v-if="!!props.userInfo.statusInfo">
        <span>当前状态：{{ props.userInfo.statusInfo }}</span>
        <vxe-toolbar ref="toolbarRef" custom class-name="toolbar"></vxe-toolbar>
      </template>
    </div>
  </div>
  <div class="table">
    <AnnuallyTable
      ref="annallyTableRef"
      :getDynamicColumnByKm="props.getDynamicColumnByKm"
      :getDataListByKm="props.getDataListByKm"
      :initParams="props.initParams"
      :requestApi="props.requestApi"
      :hasChildField="props.hasChildField"
      :loading="tableInfo.loading"
      :columns="tableInfo.columns"
      :userInfo="props.userInfo"
      :tableData="tableInfo.tableData"
      :exportForDw="props.exportForDw"
      :exportForKm="props.exportForKm"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: "AnnuallyLayout"
};
</script>

<script setup lang="ts">
import AnnuallyTable from "@/views/fy/annually/components/AnnuallyTable.vue";
import { onMounted, reactive, defineExpose, withDefaults, defineProps, ref } from "vue";

export interface LayoutProps {
  userInfo: any;
  initParams: any;
  requestApi: (params: any) => Promise<any>;
  dynamicColumnApi: (params: any) => Promise<any>;
  getDynamicColumnByKm: (params: any) => Promise<any>;
  getDataListByKm: (params: any) => Promise<any>;
  exportForDw: (params: any) => Promise<any>;
  exportForKm: (params: any) => Promise<any>;
  hasChildField: string;
}

const props = withDefaults(defineProps<LayoutProps>(), {});

const annallyTableRef = ref();
const toolbarRef = ref();

const tableInfo = reactive({
  columns: [],
  loading: false,
  tableData: []
});

const initTableData = async () => {
  tableInfo.loading = true;
  tableInfo.tableData.length = 0;
  tableInfo.columns.length = 0;
  let requestApi = props.requestApi;
  let dynamicColumnApi = props.dynamicColumnApi;
  if (!requestApi && !dynamicColumnApi) return;
  try {
    let params = {
      ...props.initParams
    };
    let tableData = await requestApi({
      ...params
    });
    let headerData = await dynamicColumnApi(params);
    tableInfo.tableData = tableData.data;
    tableInfo.columns = headerData.data.filter((item: any) => item.visible);
    tableInfo.loading = false;
    linkTable();
  } catch (error) {
    tableInfo.loading = false;
  }
};

const linkTable = () => {
  const $table = annallyTableRef.value.treeTableRef;
  const $toolBar = toolbarRef.value;
  if ($table && $toolBar) {
    $table.connect($toolBar);
  }
};

const clearData = () => {
  tableInfo.tableData.length = 0;
  tableInfo.columns.length = 0;
};

onMounted(initTableData);

defineExpose({
  initTableData,
  clearData,
  tableInfo,
  annallyTableRef
});
</script>

<style scoped lang="less">
.operation {
  height: 32px;
  line-height: 32px;
  &-left {
    float: left;
  }

  &-right {
    float: right;
  }
}

.table {
  height: calc(100vh - 213px);
}
</style>
