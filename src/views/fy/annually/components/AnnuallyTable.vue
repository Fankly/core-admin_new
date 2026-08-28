<template>
  <vxe-table 
    :header-cell-style="headerCellStyle"
    :row-config="tableInfo.rowConfig"
    @cell-click="(tables:any)=>cellClickHandle(tables)"
    :cell-style="cellStyle"
    keep-source
    :loading="tableInfo.loading"
    border
    :tree-config="tableInfo.treeConfig"
    :edit-config="tableInfo.editConfig"
    show-overflow
    ref="treeTableRef"
    v-bind="$attrs"
    height="100%"
    :column-config="{ resizable: true }"
    :data="props.tableData"
  >
    <template v-for="item in props.columns" :key="item.columnKey">
      <vxe-column :visible="item.visible" :tree-node="item.columnKey === 'name'" v-if="field.includes(item.columnKey)" show-overflow header-align="center" align="left" :formatter="formatterValue" :field="item.columnKey" :title="item.columnValue"></vxe-column>
      <vxe-column :visible="item.visible" :edit-render="{}" :tree-node="item.columnKey === 'name'" v-else-if="!field.includes(item.columnKey) && item.eidt" show-overflow header-align="center" align="right" :formatter="formatterValue" :field="item.columnKey" :title="item.columnValue">
        <template #edit="{ row }">
          <el-input @change="sumhandle(row, item.columnKey)" v-model="row[item.columnKey]" :maxlength="item.needSum ? 20 : 128" :oninput="(input: any) => inputSxysHandle(input,item.needSum)" />
        </template>
      </vxe-column>
      <vxe-column :visible="item.visible" v-else show-overflow header-align="center" align="right" :formatter="formatterValue" :field="item.columnKey" :title="item.columnValue"></vxe-column>
    </template>
  </vxe-table>
  <yskmView
    :xsws="props.initParams.xsws"
    busi-type="ND"
    width="32%"
    height="800"
    :title="kmInfo.title"
    :header-api="props.getDynamicColumnByKm"
    :table-api="props.getDataListByKm"
    flag="CityReView"
    :kmlx="kmInfo.kmlx"
    :specialorgid="kmInfo.dwId"
    :km-id="kmInfo.kmId"
    :nd="kmInfo.nd"
    @close-dialog="closeModalHandle"
    :is-show-modal="kmInfo.isShowModal"
    :export-api="props.exportForKm"
  ></yskmView>
</template>

<script lang="ts">
export default {
  name: "AnnuallyTable"
};
</script>

<script setup lang="ts">
import { getGroupSummary } from "@/utils/prearranged";
import { findPrevNode, formatValue } from "@/utils/utils";
import Decimal from "decimal.js";
import { ElMessage } from "element-plus";
import { reactive, withDefaults, defineProps, ref, defineExpose } from "vue";
import { TableInfo, UserInfo } from "../interface";
import yskmView from "@/views/fy/prearranged/release/components/yskmView.vue";

export interface TableProps {
  userInfo: UserInfo;
  columns: any[];
  tableData: any[];
  hasChildField: string;
  initParams: any;
  requestApi: (params: any) => Promise<any>;
  getDataListByKm: (params: any) => Promise<any>;
  getDynamicColumnByKm: (params: any) => Promise<any>;
  exportForDw: (params: any) => Promise<any>;
  exportForKm: (params: any) => Promise<any>;
}

const props = withDefaults(defineProps<TableProps>(), {});

const treeTableRef = ref();

const field = reactive(["cnx", "name", "sbDesc"]);

const kmInfo = reactive({
  title: "预算科目-查看",
  kmId: [],
  isShowModal: false,
  dwId: "",
  kmlx: "",
  xsws: "",
  nd: ""
});

const activeCellMethod = ({ row }: any) => {
  if (row.id && !row.leaf) {
    return true;
  }
  return false;
};

const tableInfo = reactive<TableInfo>({
  rowConfig: {
    height: 32
  },
  loading: false,
  treeConfig: {
    lazy: true,
    hasChildField: props.hasChildField,
    loadMethod: ({ row }) => {
      tableInfo.loading = true;
      return new Promise((resolve: any) => {
        let params = { ...props.initParams };
        params.parentId = row.id;
        props
          .requestApi({
            ...params
          })
          .then((res) => {
            if (res.success) {
              resolve(res.data);
            } else {
              ElMessage.error(res.msg);
              resolve([]);
            }
            tableInfo.loading = false;
          });
      });
    }
  },
  editConfig: {
    trigger: "click",
    mode: "cell",
    beforeEditMethod: activeCellMethod,
    enabled: true,
    showStatus: true
  }
});

const headerCellStyle = () => {
  return {
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const closeModalHandle = (val: boolean) => {
  kmInfo.isShowModal = val;
};

const cellClickHandle = async ({ row, column }: any) => {
  if (row.cnx && !row.leaf && column.field === "name") {
    kmInfo.isShowModal = true;
    kmInfo.nd = props.initParams.nd;
    kmInfo.xsws = props.initParams.xsws || "2";
    kmInfo.dwId = props.initParams.dwId;
    kmInfo.kmlx = props.initParams.kmlx;
    kmInfo.kmId = findPrevNode(props.tableData, row);
  }
};

const cellStyle = ({ row, column }: any) => {
  if (row.cnx && !row.leaf && column.field === "name") {
    return {
      cursor: "pointer",
      backgroundColor: "rgba(232, 234, 236,0.5)",
      color: "rgb(0, 112, 107)"
    };
  }
  return {
    cursor: "auto",
    backgroundColor: "rgba(232, 234, 236,0.5)",
    color: "rgb(96, 98, 102)"
  };
};

const inputSxysHandle = (event: any, isNumber: boolean) => {
  if (isNumber) {
    let maxlength = Number(props.initParams.xsws) + 10;
    let regex = new RegExp(`^[-]?\\d{0,${maxlength}}(?:\\.\\d{0,${Number(props.initParams.xsws)}})?`);
    event.target.value = "" + event.target.value;
    event.target.value =
      event.target.value
        .replace(/[^\d^.-]+/g, "") // 包括负号的匹配
        .replace(/^0+(\d)/, "$1")
        .replace(/^\./, "0.")
        .match(/regex/)[0] || "";
  }
};

const sumhandle = (row: any, key: string) => {
  row[key] = row[key] ? new Decimal(row[key]).toFixed(Number(props.initParams.xsws)) : new Decimal(0).toFixed(Number(props.initParams.xsws));
  getGroupSummary(props.tableData, tableInfo.treeConfig as any, key, Number(props.initParams.xsws), "leaf", "id");
};

const formatterValue = ({ column, cellValue }: any) => {
  if (field.includes(column.field)) {
    return cellValue;
  }
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
  return formatValue(cellValue, Number(props.initParams.xsws));
};

defineExpose({
  treeTableRef
});
</script>

<style scoped></style>
