<template>
  <vxe-modal :destroy-on-close="true" height="800" width="70%" :loading="loading" @show="showHandle" @close="closeHandle" title="调整明细详情" v-model="isShowModal" show-zoom resize position="center">
    <vxe-grid ref="gridRef" v-bind="gridOptions"></vxe-grid>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "AdjustInstructionsDetail"
};
</script>
<script setup lang="ts">
import { getTzmxctData, getTzmxctDynamicColumn, TzmxctData } from "@/api/fy/daily/tzmx";
import { formatValue } from "@/utils/utils";
import { ElMessage } from "element-plus";
import { ref, reactive, defineExpose, defineProps } from "vue";

interface Columns {
  align: null | string;
  columnKey: string;
  columnValue: string;
  dataType: string;
  detail: boolean;
  dwDetailId: null | string;
  eidt: boolean;
  fixed: boolean;
  hidden: boolean;
  needSum: boolean;
  visible: boolean;
  treeNode?: boolean;
  width: number;
  formatter: (params: any) => any;
}

interface Props {
  pch: string;
  initParams: any;
}

const props = defineProps<Props>();

const isShowModal = ref(false);
const loading = ref(false);

const gridOptions = reactive<any>({
  border: true,
  keepSource: true,
  columnConfig: {
    resizable: true
  },
  loading: false,
  headerAlign: "center",
  showOverflow: true,
  showHeaderOverflow: true,
  height: "100%",
  rowConfig: {
    height: 32
  },
  treeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod: ({ row }: any) => {
      return new Promise((resolve: any) => {
        gridOptions.loading = true;
        let api = getTzmxctData;
        if (!api) return;
        let params: TzmxctData = {
          parentId: row.id,
          xsws: props.initParams.xsws,
          pch: props.pch
        };
        api(params).then((res: any) => {
          if (res.success) {
            gridOptions.loading = false;
            resolve(res.data);
          } else {
            gridOptions.loading = false;
            ElMessage.error(res.msg);
            resolve([]);
          }
        });
      });
    }
  },
  columns: [],
  data: []
});

const getTableData = async () => {
  let params: TzmxctData = {
    parentId: -1,
    xsws: props.initParams.xsws,
    pch: props.pch
  };
  let res = await getTzmxctData(params);
  if (res.success) {
    gridOptions.data = res.data;
  } else {
    ElMessage.error(res.msg);
  }
};

const getDynamicColumn = async () => {
  let res = await getTzmxctDynamicColumn(props.pch);
  if (res.success) {
    gridOptions.columns = res.data.map((item: Columns) => {
      item.formatter = ({ cellValue }: any) => {
        if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
        return formatValue(cellValue, Number(props.initParams.xsws));
      };
      item.fixed = false;
      item.width = 180;
      if (item.needSum) item.align = "right";
      else {
        item.width = 300;
        item.treeNode = true;
      }
      return {
        headerAlign: "center",
        field: item.columnKey,
        title: item.columnValue,
        ...item
      };
    });
  } else {
    ElMessage.error(res.msg);
  }
};

const showHandle = () => {
  getDynamicColumn();
  getTableData();
};

const closeHandle = () => {
  if (gridOptions.columns) gridOptions.columns.length = 0;
  if (gridOptions.data) gridOptions.data.length = 0;
};

defineExpose({
  isShowModal
});
</script>

<style scoped></style>
