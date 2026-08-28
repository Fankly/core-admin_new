<template>
  <vxe-modal height="800" width="70%" v-bind="$attrs" :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" title="调整明细" v-model="showModal" show-zoom resize position="center">
    <div class="operation">
      <div class="left">
        <el-button plain size="mini" @click="closeHandle" type="primary">关 闭</el-button>
      </div>
      <div class="right">
        <span>预算科目：{{ name }}</span>
        <span style="margin-left: 30px">编制单位：{{ bzdwName }}</span>
        <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
      </div>
    </div>
    <div class="table">
      <vxe-table 
        @cell-click="cellClickHandle"
        :row-style="rowStyle"
        highlight-current-row
        :row-config="rowConfig"
        :header-cell-style="headerCellStyle"
        :data="tableInfo.data"
        ref="tableRef"
        :show-overflow="true"
        border
        :column-config="{ resizable: true }"
        header-align="center"
        height="100%"
        :loading="tableInfo.loading"
      >
        <vxe-column align="center" :visible="item.visiable" v-for="item in tableInfo.columns" :key="item.columnKey" :title="item.columnName" :field="item.columnKey"></vxe-column>
      </vxe-table>
    </div>
    <el-pagination
      class="pageTotal"
      :current-page="page.page"
      background
      align="center"
      :page-sizes="[10, 20, 50, 100, 500]"
      :page-size="page.limit"
      :total="parseInt(page.total + '')"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="limitChangeHandle"
      @current-change="pageChangeHandle"
    ></el-pagination>
  </vxe-modal>
  <AdjustInstructionsDetail :initParams="props.initParams" ref="adjustInstructionsDetailRef" :pch="pch" />
</template>
<script lang="ts">
export default {
  name: "DetailView"
};
</script>

<script setup lang="ts">
import AdjustInstructionsDetail from "./AdjustInstructionsDetail.vue";
import { getTzDetail } from "@/api/fy/daily/common";
import { ElMessage } from "element-plus";
import { defineProps, defineExpose, ref, toRef, reactive } from "vue";
import { VxeTableDefines } from "vxe-table";
interface Props {
  yskmName: string;
  bzdw: string;
  initParams: any;
  ystzInfo: any;
  tzType: string;
}

const props = defineProps<Props>();

const toolbarOneRef = ref();
const tableRef = ref();

const showModal = ref(false);
const loading = ref(false);

const name = toRef(props, "yskmName");
const bzdwName = toRef(props, "bzdw");
const pch = ref("");
const adjustInstructionsDetailRef = ref();

const page = reactive({
  total: 0,
  limit: 10,
  page: 1,
  current: "1"
});

const rowConfig = reactive({
  height: 32
});

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum;
  showHandle();
};
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1;
  page.limit = currentLimitNum;
  showHandle();
};

const showHandle = async () => {
  tableInfo.data.length = 0;
  const yskmId: string = props.ystzInfo.yskm.id;
  const specialorgid: string = props.initParams.dwId;
  const nd: string = props.initParams.nd;
  const xsws: string = props.initParams.xsws;
  const kmlx: string = props.initParams.kmlx;
  let res = await getTzDetail({
    nd: nd,
    xsws: xsws,
    specialorgid: specialorgid,
    yskmId: yskmId,
    kmlx: kmlx,
    tzType: props.tzType,
    ...page
  });
  if (res.success) {
    tableInfo.data = res.data.records;
    page.total = res.data.total;
    await linkTable();
  } else {
    ElMessage.error(res.msg);
  }
};

const linkTable = async () => {
  const $table = tableRef.value;
  const $toolBar = toolbarOneRef.value;
  if ($table && $toolBar) {
    await $table.connect($toolBar);
  }
};

const headerCellStyle = () => {
  return {
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const rowStyle = () => {
  return {
    cursor: "pointer"
  };
};

const cellClickHandle = ({ row }: VxeTableDefines.CellClickParams) => {
  pch.value = row["pch"];
  adjustInstructionsDetailRef.value.isShowModal = true;
};

const closeHandle = () => {
  showModal.value = false;
  page.total = 0;
  page.limit = 10;
  page.page = 1;
  page.current = "1";
};

const tableInfo = reactive({
  loading: false,
  data: [],
  columns: [
    {
      columnKey: "pch",
      columnName: "批次号",
      visiable: false
    },
    {
      columnKey: "tzTime",
      columnName: "调整日期",
      visiable: true
    },
    {
      columnKey: "tzje",
      columnName: "调整金额",
      visiable: true
    },
    {
      columnKey: "tzr",
      columnName: "调整人",
      visiable: true
    },
    {
      columnKey: "tzsm",
      columnName: "调整说明",
      visiable: true
    }
  ]
});

defineExpose({
  showModal
});
</script>

<style scoped lang="less">
.operation {
  height: 28px;
  display: flex;
  align-items: center;
  .left {
    width: 300px;
  }
  .right {
    flex: 1;
    min-width: 0;
    min-height: 0;
    text-align: right;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    .toolbar {
      margin-left: 10px;
    }
  }
}

.table {
  margin-top: 10px;
  height: calc(100% - 80px);
}

.el-popper {
  z-index: 3010 !important;
}
</style>
