<template>
  <vxe-modal :loading="loading" @show="showHandle" height="820" width="70%" v-model="isShowModal" show-zoom resize position="center" title="预算事项明细清单">
    <div class="container">
      <div class="operation">
        <el-button plain size="mini" type="primary" @click="exportHandle">导 出</el-button>
      </div>
      <div class="table">
        <vxe-table  @cell-click="handleRowDblclick" :highlight-current-row="true" :row-style="rowStyle" :row-config="{ height: 36 }" resizable align="center" border stripe :show-overflow="true" :data="tableData" height="100%">
          <vxe-column width="60" type="seq" title="序号"></vxe-column>
          <vxe-column :formatter="item.formatter" :align="item.align" :width="item.width" v-for="item in columns" :key="item.field" :field="item.field" :title="item.title"></vxe-column>
        </vxe-table>
      </div>
      <div class="page">
        <el-pagination :current-page="page.page" background :page-sizes="[10, 20, 50, 100, 500]" :page-size="page.limit" :total="parseInt(page.total + '')" layout="total, sizes, prev, pager, next, jumper" @size-change="limitChangeHandle" @current-change="pageChangeHandle"></el-pagination>
      </div>
    </div>
    <TableDetail ref="tableDetailRef" :detailParams="detailTableParams"></TableDetail>
  </vxe-modal>
</template>

<script setup lang="ts">
import TableDetail from "@/views/statistics/components/TableDetail.vue";
import { BmDetail, getBmDetail, exportData } from "@/api/statistics/yssxtjfx";
import { formatNumValue } from "@/utils/utils";
import { ref, defineExpose, defineProps, reactive } from "vue";
import { VxeTableDefines } from "vxe-table";
import { DetailParams, RowVo } from "../interface";

interface Props {
  detailParams: DetailParams;
}

const isShowModal = ref(false);
const loading = ref(false);

const props = defineProps<Props>();

const tableData = ref<RowVo[]>();

const detailTableParams = ref();
const tableDetailRef = ref();

const columns = reactive<VxeTableDefines.ColumnOptions[]>([
  {
    title: "事项编码",
    field: "yssxbm",
    width: 160
  },
  {
    title: "事项名称",
    field: "yssxmc",
    width: 160
  },
  {
    title: "重点投向",
    field: "yslxctName",
    width: 160
  },
  {
    title: "项目类型",
    field: "xmlxName",
    width: 160
  },
  {
    title: "资金来源",
    field: "zjlyName",
    width: 160
  },
  {
    title: "项目包编码",
    field: "xmbbm",
    width: 160
  },
  {
    title: "项目包名称",
    field: "xmbmc",
    width: 260
  },
  {
    title: "是否预安排",
    field: "isYapName",
    width: 160
  },
  {
    title: "是否规模化",
    field: "sfbmdName",
    width: 160
  },
  {
    title: "一级单位",
    field: "yjdwName",
    width: 160
  },
  {
    title: "二级单位",
    field: "ejdwName",
    width: 160
  },
  {
    title: "归口部门",
    field: "gkbmmc",
    width: 160
  },
  {
    title: "处室",
    field: "csmc",
    width: 160
  },
  {
    title: "年度",
    field: "nd",
    width: 120
  },
  {
    title: "事项预算（万元）",
    field: "sxys",
    width: 160,
    align: "right",
    formatter: function ({ cellValue }) {
      if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
      return formatNumValue(cellValue.toString(), 6);
    }
  },
  {
    title: "已分解金额（万元）",
    field: "yfjys",
    width: 160,
    align: "right",
    formatter: function ({ cellValue }) {
      if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
      return formatNumValue(cellValue.toString(), 6);
    }
  },
  {
    title: "备注",
    field: "remark",
    width: 160
  },
  {
    title: "状态",
    field: "ztName",
    width: 120
  },
  {
    title: "删除标识",
    field: "zscflag",
    width: 80
  },
  {
    title: "创建时间",
    field: "ztimestamp",
    width: 160
  },
  {
    title: "创建人",
    field: "cjrName",
    width: 160
  },
  {
    title: "最后更改日期",
    field: "zhggrq",
    width: 160
  },
  {
    title: "最后更改人",
    field: "zhggrName",
    width: 160
  },
  {
    title: "出库时间",
    field: "cksj",
    width: 160
  },
  {
    title: "续建结转标识",
    field: "xjjzbs",
    width: 120
  }
]);

const page = reactive({
  total: 0,
  limit: 20,
  page: 1,
  current: "1"
});

const showHandle = () => {
  getTableData();
};

const getTableData = async () => {
  loading.value = true;
  let params: BmDetail = {
    bmId: props.detailParams.bmid,
    nd: props.detailParams.nd,
    limit: page.limit,
    dwId: props.detailParams.dwId,
    tjfs: props.detailParams.tjfs,
    page: page.page
  };
  const res = await getBmDetail(params);
  if (res.success && res.data) {
    tableData.value = res.data.records;
    page.total = res.data.total;
  }
  loading.value = false;
};

const rowStyle = () => {
  return {
    cursor: "pointer"
  };
};

const exportHandle = () => {
  loading.value = true;
  exportData({
    bmId: props.detailParams.bmid,
    nd: props.detailParams.nd,
    limit: page.limit,
    dwId: props.detailParams.dwId,
    tjfs: props.detailParams.tjfs,
    page: page.page
  }).then((res) => {
    const blob: any = res;
    let dom = document.createElement("a");
    let url = window.URL.createObjectURL(blob);
    dom.href = url;
    // 获取文件名
    let filename = res.headers["content-disposition"].split(";")[1].split("=")[1];
    dom.download = `${decodeURI(decodeURI(filename))}`;
    document.body.appendChild(dom);
    dom.click();
    document.body.removeChild(dom);
    window.URL.revokeObjectURL(url);
    loading.value = false;
  });
};

const handleRowDblclick = ({ row }: VxeTableDefines.CellDblclickParams<RowVo>) => {
  let isCity = row.id !== row.yssxId;
  detailTableParams.value = {
    ...row,
    isCity,
    ...props.detailParams
  };
  tableDetailRef.value.isShowModal = true;
};

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum;
  getTableData();
};
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1;
  page.limit = currentLimitNum;
  getTableData();
};

defineExpose({
  isShowModal
});
</script>

<style scoped lang="less">
.container {
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  .operation {
    padding-bottom: 10px;
  }
  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
