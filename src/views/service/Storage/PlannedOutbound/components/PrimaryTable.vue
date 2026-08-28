<template>
  <div class="table">
    <div class="main">
      <vxe-grid ref="gridRef" v-bind="gridOptions"></vxe-grid>
    </div>
    <div class="pager">
      <el-pagination
        :current-page="tableProps.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="tableProps.limit"
        :total="parseInt(tableProps.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "PrimaryTable"
};
</script>

<script lang="ts" setup>
import { defineExpose, reactive, ref } from "vue";
import { RowVo } from "../interface/index";
import { VxeGridProps } from "vxe-table";

interface InitParams {
  columns: any;
  data: RowVo[];
  page: number;
  limit: number;
  total: number;
  getTableList?: () => void;
}

const gridRef = ref();

const tableProps = ref<InitParams>({
  columns: [],
  data: [],
  page: 1,
  limit: 20,
  total: 0
});

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  showOverflow: true,
  showHeaderOverflow: true,
  rowConfig: {
    height: 32
  },
  checkboxConfig: {
    trigger: "row",
    highlight: true,
    visibleMethod({ row }: any) {
      return row["id"];
    }
  },
  rowStyle: ({ row }: any) => {
    if (!row["id"] && row["xmbm"] === "合计") {
      return {
        fontWeight: "bold",
        color: "#303133",
        backgroundColor: "#f8f8f9"
      };
    }
  },
  height: "100%",
  columnConfig: {
    resizable: true
  }
});

const pageChangeHandle = (currentPageNum: number) => {
  tableProps.value.page = currentPageNum;
  tableProps.value.getTableList?.();
};
const limitChangeHandle = (currentLimitNum: number) => {
  tableProps.value.page = 1;
  tableProps.value.limit = currentLimitNum;
  tableProps.value.getTableList?.();
};

const acceptParams = (initParams: InitParams) => {
  tableProps.value = initParams;
  gridOptions.columns = initParams.columns.map((column: any) => {
    return {
      ...column,
      align: column.align ? column.align : "center",
      headerAlign: "center",
      width: column.width ? column.width : "160"
    };
  });

  gridOptions.data = initParams.data;
};

defineExpose({
  gridRef,
  acceptParams,
  gridOptions
});
</script>

<style scoped lang="less">
.table {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  .main {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
}
</style>
