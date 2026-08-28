<template>
  <vxe-modal v-bind="$attrs" :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" :title="props.title" v-model="showModal" show-zoom resize position="center">
    <div class="operation">
      <div class="operation-btn">
        <el-button size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
        <el-button size="mini" type="primary" plain @click="closeHandle">关 闭</el-button>
      </div>
      <div class="operation-form">
        <span>预算科目：</span>
        <el-cascader @change="getTableDataHandle" :show-all-levels="false" :props="yskmProps" v-model="kmMsg.kmId"></el-cascader>
      </div>
    </div>
    <div class="standrand-table">
      <vxe-table  :header-cell-style="headerCellStyle" :row-config="tableMsg.rowConfig" height="100%" ref="treeTableRef" :border="true" :column-config="{ resizable: true }" :data="tableMsg.tableData">
        <template :key="item.columnKey" v-for="item in tableMsg.columns">
          <vxe-column show-overflow :formatter="formatterData" header-align="center" align="center" v-if="item.columnKey === 'dwName'" win-width="180px" :field="item.columnKey" :title="item.columnValue"></vxe-column>
          <vxe-column show-overflow :formatter="formatterData" header-align="center" align="right" v-else win-width="180px" :field="item.columnKey" :title="item.columnValue"></vxe-column>
        </template>
      </vxe-table>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "dwbzView"
};
</script>
<script setup lang="ts">
import { reactive, ref, withDefaults, defineProps, defineEmits, toRef } from "vue";
import { ElMessage } from "element-plus";
import { getKmsxTree } from "@/api/common";
import { KmDataMsg, TableMsg } from "../prearranged/interface";
import { formatValue } from "@/utils/utils";

export interface ModalProps {
  isShowModal: boolean;
  kmId: number[];
  nd: string;
  xsws: string;
  specialorgid: string;
  kmlx: string;
  flag: string;
  tableApi: (params: any) => Promise<any>;
  headerApi: (params: any) => Promise<any>;
  exportApi?: (params: any) => Promise<any>;
  title: string;
  busiType: string;
}

const treeTableRef = ref();

const props = withDefaults(defineProps<ModalProps>(), {
  isShowModal: false,
  specialorgid: ""
});

const showModal = toRef(props, "isShowModal");

const emit = defineEmits(["closeDialog", "updateTable"]);

const loading = ref(false);

const kmMsg = reactive<KmDataMsg>({
  kmId: [],
  kmList: []
});

const yskmProps = reactive({
  lazy: true,
  leaf: "leaf",
  value: "id",
  label: "name",
  async lazyLoad(node: any, resolve: any) {
    const nd = tableMsg.nd ? tableMsg.nd : props.nd;
    let id = node.level === 0 ? "-1" : node.data.id;
    let res = await getKmsxTree(props.kmlx, nd, id);
    if (res.success) {
      resolve(res.data);
    } else {
      ElMessage.error(res.msg);
      resolve([]);
    }
  }
});

const getTableDataHandle = (val: any[]) => {
  if (val && val.length !== 0) {
    changeDwHandle(val);
  }
};

const tableMsg = reactive<TableMsg>({
  tableData: [],
  nd: "",
  xsws: "",
  columns: [],
  rowConfig: {
    height: 32
  }
});

const headerCellStyle = () => {
  return {
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const formatterData = ({ column, cellValue }: any) => {
  const fields = ["cbzxName", "dwName", "yj", "js"];
  if (fields.includes(column.field)) return cellValue;
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
  return formatValue(cellValue, Number(tableMsg.xsws));
};

const showHandle = () => {
  kmMsg.kmId = props.kmId;
  tableMsg.nd = props.nd;
  tableMsg.xsws = props.xsws;
  initTableData();
};

const changeDwHandle = async (val: any) => {
  kmMsg.kmId = val;
  initTableData();
};

const initTableData = async () => {
  loading.value = true;
  let kmId = kmMsg.kmId[kmMsg.kmId.length - 1];
  let api = props.tableApi;
  let headerApi = props.headerApi;
  if (!api && !headerApi) return;
  try {
    let params = {
      kmId: kmId,
      kmlx: props.kmlx,
      nd: tableMsg.nd,
      xsws: tableMsg.xsws,
      specialorgid: props.specialorgid,
      busiType: props.busiType
    };
    let tableData = await api(params);
    let headerData = await headerApi(params);
    tableMsg.tableData = tableData.data;
    tableMsg.columns = headerData.data.filter((item: any) => !item.hidden);
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

// 导出
const exportHandle = async () => {
  loading.value = true;
  let kmId = kmMsg.kmId[kmMsg.kmId.length - 1];
  let api = props.exportApi;
  if (!api) return;
  let params = {
    kmId: kmId,
    kmlx: props.kmlx,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    specialorgid: props.specialorgid,
    dwId: props.specialorgid,
    busiType: props.busiType
  };
  api(params).then((res: any) => {
    const blob = res;
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

const closeHandle = () => {
  // 重置数据
  if (tableMsg.tableData) tableMsg.tableData.length = 0;
  emit("closeDialog", !props.isShowModal);
};
</script>

<style lang="less" scoped>
.vxe-modal--content {
  padding: 10px;

  .standrand-table {
    margin-top: 10px;
    height: calc(100% - 44px);
  }
}

.operation {
  display: flex;

  &-btn,
  &-form {
    width: 50%;
  }

  &-form {
    text-align: right;

    .el-form--inline {
      height: 34px;

      .el-form-item {
        margin: 0;
      }
    }
  }
}
</style>
