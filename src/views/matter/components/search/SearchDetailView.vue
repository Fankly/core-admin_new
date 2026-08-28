<template>
  <vxe-modal @show="showHandle" height="800" width="70%" :destroy-on-close="true" @close="closeHandle" title="项目明细" v-model="isShowModal" show-zoom resize position="center">
    <vxe-grid v-bind="gripOptions">
      <template #pager>
        <el-pagination :current-page="page.page" background align="center" :page-sizes="[10, 20, 50, 100, 500]" :page-size="page.limit" :total="parseInt(page.total + '')" layout="total, sizes, prev, pager, next, jumper" @size-change="limitChangeHandle" @current-change="pageChangeHandle"></el-pagination>
      </template>
    </vxe-grid>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "SearchDetailView"
};
</script>

<script setup lang="ts">
import { getDetail } from "@/api/matter/search";
import { ElMessage } from "element-plus";
import { reactive, ref, defineExpose, defineProps } from "vue";
import { VxeGridProps } from "vxe-table";

interface RowVO {
  xmmc: string;
  ejdw: string;
  ejfl: string;
  gkbm: string;
  gwxmbm: string;
  protypeName: string;
  saptime: string;
  sjfl: string;
  sxGkbm: string;
  xmbName: string;
  xmbType: string;
  yjdw: string;
  yjfl: string;
  yssxName: string;
  zdtx: string;
}

interface Props {
  params: any;
}

const props = defineProps<Props>();

const isShowModal = ref(false);

const page = reactive({
  total: 0,
  limit: 10,
  page: 1,
  current: "1"
});

const gripOptions = reactive<VxeGridProps<RowVO>>({
  border: true,
  columnConfig: {
    resizable: true
  },
  loading: false,
  headerAlign: "center",
  align: "center",
  showOverflow: true,
  height: "100%",
  rowConfig: {
    height: 32
  },
  columns: [
    {
      field: "xmmc",
      title: "项目名称",
      width: 320
    },
    {
      field: "gwxmbm",
      title: "国网项目编码",
      width: 220
    },
    {
      field: "protypeName",
      title: "项目类型",
      width: 220
    },
    {
      field: "xmbName",
      title: "项目包名称",
      width: 220
    },
    {
      field: "xmbType",
      title: "项目包类型",
      width: 220
    },
    {
      field: "zdtx",
      title: "重点投向",
      width: 220
    },
    {
      field: "yssxName",
      title: "预算事项",
      width: 220
    },
    {
      field: "sxGkbm",
      title: "事项归口部门",
      width: 220
    },
    {
      field: "gkbm",
      title: "归口部门",
      width: 220
    },
    {
      field: "yjdw",
      title: "一级单位",
      width: 220
    },
    {
      field: "ejdw",
      title: "二级单位",
      width: 220
    },
    {
      field: "saptime",
      title: "立项时间",
      width: 220
    },
    {
      field: "yjfl",
      title: "一级分类",
      width: 220
    },
    {
      field: "ejfl",
      title: "二级分类",
      width: 220
    },
    {
      field: "sjfl",
      title: "三级分类",
      width: 220
    }
  ]
});

const closeHandle = () => {
  isShowModal.value = false;
};

const showHandle = () => {
  searchHandle();
};

const searchHandle = async () => {
  gripOptions.loading = true;
  let res = await getDetail({
    ...props.params,
    ...page
  });
  if (res.success) {
    gripOptions.data = res.data.records;
    page.total = res.data.total;
    gripOptions.loading = false;
  } else {
    gripOptions.loading = false;
    ElMessage({
      type: "error",
      message: res.msg
    });
  }
};

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum;
  searchHandle();
};
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1;
  page.limit = currentLimitNum;
  searchHandle();
};

defineExpose({
  isShowModal
});
</script>

<style scoped lang="less">
:deep(.el-icon-arrow-left),
:deep(.el-icon-arrow-right) {
  margin: 0 auto;
}

:deep(.vxe-grid--pager-wrapper) {
  padding-top: 10px;
  height: 38px;
}
:deep(.el-pagination) {
  margin: 0 !important;
}
</style>
