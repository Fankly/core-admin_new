<template>
  <vxe-modal @show="modalShowCloseHandle" v-bind="$attrs" :destroy-on-close="true" v-model="isShowModal" @close="modalCloseHandle">
    <div class="opeartion">
      <div class="opeartion-left">
        <slot name="opTypeLeft"></slot>
      </div>
      <div class="opeartion-right">
        <slot name="opTypeRight"></slot>
      </div>
    </div>
    <div class="table">
      <vxe-table 
        :header-cell-style="headerCellStyle"
        :row-config="tableInfo.rowConfig"
        :cell-style="cellStyle"
        :loading="tableInfo.loading"
        keep-source
        :edit-config="tableInfo.editConfig"
        :tree-config="tableInfo.treeConfig"
        height="100%"
        ref="treeTableRef"
        :border="true"
        :column-config="{ resizable: true }"
        :data="tableInfo.tableData"
      >
        <template v-for="item in tableInfo.columns" :key="item.columnKey">
          <vxe-column show-overflow :tree-node="item.columnKey === 'name'" :formatter="formatterData" header-align="center" align="left" v-if="['name', 'cnx', 'sbsm'].includes(item.columnKey)" min-width="200px" :field="item.columnKey" :title="item.columnValue"></vxe-column>
          <vxe-column :formatter="formatterData" show-overflow header-align="center" align="right" v-else-if="item.eidt" min-width="160px" :field="item.columnKey" :title="item.columnValue" :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }">
            <template #edit="{ row }">
              <input v-number-input="props.userInfo.xsws" class="my-input" @focus="focusHandle(row, item.columnKey)" v-if="row?.id && !row?.leaf && item.eidt" @change="sumhandle(row, item.columnKey)" v-model="row[item.columnKey]" maxlength="20" />
            </template>
          </vxe-column>
          <vxe-column show-overflow :formatter="formatterData" header-align="center" align="right" v-else min-width="160px" :field="item.columnKey" :title="item.columnValue"></vxe-column>
        </template>
      </vxe-table>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "unitDec"
};
</script>
<script setup lang="ts">
import { getGroupSummary } from "@/utils/prearranged";
import { formatValue } from "@/utils/utils";
import { Decimal } from "decimal.js";
import { ElMessage } from "element-plus";
import { reactive, defineEmits, defineProps, defineExpose, ref, toRef } from "vue";
import { TableMsg } from "../interface";

interface UserInfo {
  busiType: string;
  dwId: string;
  kmlx: string;
  nd: string;
  xsws: string;
}

interface Props {
  opeartionFlag: string;
  isShowDec: boolean;
  requestApi: (params: any) => Promise<any>;
  dynamicColumnApi: (params: any) => Promise<any>;
  userInfo: UserInfo;
  hasChildField: string;
  flag: string;
}

const emit = defineEmits(["modalClose", "modalShow"]);

const props = defineProps<Props>();

const isShowModal = toRef(props, "isShowDec");

const treeTableRef = ref();

const modalInfo = reactive({
  isShowModal: false
});

const activeCellMethod = ({ row }: any) => {
  if (row.id && !row.leaf) {
    return true;
  }
  return false;
};

const tableInfo = reactive<TableMsg>({
  rowConfig: {
    height: 32
  },
  editConfig: {
    trigger: "click",
    mode: "cell",
    beforeEditMethod: activeCellMethod,
    enabled: true,
    showStatus: true
  },
  treeConfig: {
    lazy: true,
    hasChildField: props.hasChildField,
    loadMethod: ({ row }) => {
      tableInfo.loading = true;
      return new Promise((resolve: any) => {
        let params: any = { ...props.userInfo };
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
  loading: false,
  columns: [],
  tableData: []
});

const headerCellStyle = () => {
  return {
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const modalCloseHandle = () => {
  emit("modalClose", !isShowModal.value);
};

const modalShowCloseHandle = () => {
  if (props.flag === "view") tableInfo.editConfig.enabled = false;
  else tableInfo.editConfig.enabled = true;
  initTableData();
  emit("modalShow");
};

const initTableData = async () => {
  tableInfo.loading = true;
  let api = props.requestApi;
  let headerApi = props.dynamicColumnApi;
  if (!api && !headerApi) return;
  try {
    let params = {
      busiType: props.userInfo.busiType,
      dwId: props.userInfo.dwId,
      kmlx: props.userInfo.kmlx
    };
    let tableData = await api({
      ...params,
      parentId: props.userInfo.nd,
      nd: props.userInfo.nd,
      xsws: props.userInfo.xsws
    });
    let headerData = await headerApi(params);
    tableInfo.tableData = tableData.data;
    tableInfo.columns = headerData.data.filter((item: any) => !item.hidden);
    tableInfo.loading = false;
  } catch (error) {
    tableInfo.loading = false;
  }
};

const formatterData = ({ column, cellValue }: any) => {
  const keys = ["name", "cnx", "sbsm", "sbDesc"];
  if (keys.includes(column.field)) return cellValue;
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
  return formatValue(cellValue, Number(props.userInfo.xsws));
};

const oldInputValue = ref("0");

const focusHandle = (row: any, key: string) => {
  oldInputValue.value = row[key] ? row[key] : new Decimal(0).toFixed(Number(props.userInfo.xsws));
};

const sumhandle = (row: any, key: string) => {
  let columnKeys = tableInfo.columns?.filter((item) => item.eidt);
  row[key] = row[key] ? new Decimal(row[key]).toFixed(Number(props.userInfo.xsws)) : new Decimal(0).toFixed(Number(props.userInfo.xsws));
  countYapFjValue(row, "ndFjValue", key, columnKeys);
  getGroupSummary(tableInfo.tableData, tableInfo.treeConfig as any, key, Number(props.userInfo.xsws), "leaf", "id", columnKeys, "ndFjValue");
};

const countYapFjValue = (row: any, setValueKey: string, inputKey: string, columnKeys: any) => {
  let sumValue = new Decimal("0");
  let sumDfjValue = new Decimal("0");
  if (props.opeartionFlag === "dept") {
    sumDfjValue = row.sumDfjValue ? new Decimal(row.kyValue) : new Decimal("0");
  } else {
    sumDfjValue = row.sumDfjValue ? new Decimal(row.sumDfjValue) : new Decimal("0");
  }
  if (columnKeys) {
    for (let i = 0; i < columnKeys.length; i++) {
      const item = columnKeys[i];
      sumValue = Decimal.add(sumValue, row[item.columnKey] ? row[item.columnKey] : 0);
    }
    if (sumValue.comparedTo(sumDfjValue) > 0) {
      ElMessage.error("本次分解合计应小于等于待分解！");
      sumValue = Decimal.sub(sumValue, row[inputKey] ? row[inputKey] : 0);
      sumValue = Decimal.add(sumValue, oldInputValue.value ? oldInputValue.value : 0);
      row[inputKey] = new Decimal(oldInputValue.value).toFixed(2);
    }
    row[setValueKey] = sumValue.toFixed(2);
  }
};

const isClickHeader = (columns: any, field: string) => {
  let columnsData = columns.filter((item: any) => item.eidt);
  let column = columnsData.find((item: any) => item.columnKey === field);
  if (column) return true;
  return false;
};

const cellStyle = ({ row, column }: any) => {
  if (tableInfo.editConfig && !tableInfo.editConfig.enabled) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)"
    };
  }
  if (!isClickHeader(tableInfo.columns, column.field)) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)"
    };
  }

  if (!row.id || row.leaf) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)"
    };
  }
};

const openLoading = () => {
  tableInfo.loading = true;
};

defineExpose({
  isShowModal,
  modalInfo,
  tableInfo,
  openLoading,
  modalCloseHandle,
  initTableData,
  treeTableRef
});
</script>

<style scoped lang="less">
.opeartion {
  display: flex;

  &-left,
  &-right {
    width: 50%;
  }

  &-right {
    text-align: right;
  }
}

.table {
  height: calc(100% - 50px);
}
</style>
