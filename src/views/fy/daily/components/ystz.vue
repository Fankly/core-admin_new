<template>
  <vxe-modal destroy-on-close show-zoom resize @close="closeHandle" @show="showHandle" v-model="isShowModal" v-bind="$attrs">
    <div class="operation">
      <div class="operation-left">
        <el-button v-if="props.ystzInfo.operation === 'edit'" type="primary" plain size="mini" v-debounce="[saveHandle, `click`, 500]">保 存</el-button>
        <el-button type="primary" plain size="mini" v-debounce="[exportHandle, `click`, 500]">导 出</el-button>
        <el-button type="primary" plain size="mini" @click="closeHandle">关 闭</el-button>
        <slot name="button"></slot>
      </div>
      <div class="operation-right">
        <span>{{ formValue.name }}</span>
        <el-cascader v-if="ystzMsg.flag === 'km'" @change="getYskmValueHandle" :show-all-levels="false" :props="yskmProps" v-model="formValue.yskmValue"></el-cascader>
        <vxe-select @clear="clearHandle" @change="getDwValueChangeHandle" transfer :multiple="true" clearable v-else v-model="formValue.dwValue">
          <vxe-option v-for="item in formValue.dwList" :key="item.code" :label="item.name" :value="item.code"></vxe-option>
        </vxe-select>
      </div>
    </div>
    <div class="modal-table">
      <vxe-table
        :header-cell-style="headerCellStyle"
        :row-config="tableInfo.rowConfig"
        :cell-style="cellStyle"
        :loading="tableInfo.loading"
        ref="tableRef"
        :show-overflow="true"
        :data="tableInfo.tableData"
        border
        :column-config="{ resizable: true }"
        keep-source
        :tree-config="tableInfo.treeConfig"
        :edit-config="tableInfo.editConfig"
        header-align="center"
        height="100%"
      >
        <template v-for="item in tableInfo.columns" :key="item.columnKey">
          <vxe-column
            :width="ystzMsg.flag === 'km' ? 'auto' : '174'"
            header-align="center"
            :align="item.needSum ? 'right' : 'left'"
            :formatter="({ column, cellValue }:any) => formatterData(item, column, cellValue)"
            v-if="item.eidt"
            :field="item.columnKey"
            :title="item.columnValue"
            :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
          >
            <template #edit="{ row }">
              <input v-number-input="ystzMsg.xsws" class="my-input" @focus="focusHandle(row, item.columnKey)" @change="sumhandle(row, item.columnKey)" v-model="row[item.columnKey]" maxlength="20" />
            </template>
          </vxe-column>
          <vxe-column
            :width="ystzMsg.flag === 'km' ? 'auto' : '180'"
            :tree-node="item.columnKey === 'name'"
            header-align="center"
            :align="item.needSum ? 'right' : 'left'"
            :formatter="({ column, cellValue }:any) => formatterData(item, column, cellValue)"
            v-else
            :field="item.columnKey"
            :title="item.columnValue"
          ></vxe-column>
        </template>
      </vxe-table>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "ystz"
};
</script>
<script setup lang="ts">
import { getYskmTree } from "@/api/common";
import { getDwJc } from "@/api/fy/release";
import { getGroupSummary } from "@/utils/prearranged";
import { Decimal } from "decimal.js";
import { ElMessage } from "element-plus";
import { reactive, Ref, ref, toRef } from "vue";
import { DwList, YstzInfo, Columns, TableInfo } from "./interface/ystz";
import lodash from "lodash";
import { getDwCbzxList } from "@/api/fy/daily/dept";
import { withDefaults, defineProps, defineExpose, defineEmits } from "vue";
import { formatValue } from "@/utils/utils";

interface Props {
  ystzInfo: YstzInfo;
  xsws: string;
  flag: string;
}

const props = withDefaults(defineProps<Props>(), {});

const ystzMsg: Ref<YstzInfo> = toRef(props, "ystzInfo");

const emits = defineEmits(["close", "updateValue", "exportData"]);

const tableRef = ref();

const formValue = reactive<{
  dwList: DwList[];
  name: string;
  dwValue: string;
  yskmValue: any[];
  yskmId: string;
  dwIds: string | null;
}>({
  name: "",
  dwValue: "",
  yskmValue: [],
  dwList: [],
  yskmId: "",
  dwIds: null
});

const activeCellMethod = ({ row }: any) => {
  if (ystzMsg.value.flag === "dw" || ystzMsg.value.flag === "bm") {
    return row.id && !row.leaf;
  } else {
    if (ystzMsg.value.flag === "km") {
      return !!row.dwId || !!row.cbzx;
    } else {
      return true;
    }
  }
};

const tableInfo: TableInfo = reactive({
  rowConfig: {
    height: 32
  },
  columns: [],
  sumColumns: [],
  tableData: [],
  loading: false,
  editConfig: {
    trigger: "click",
    mode: "cell",
    showStatus: true,
    enabled: true,
    beforeEditMethod: activeCellMethod
  },
  treeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod({ row }: any) {
      let params: any = {
        nd: ystzMsg.value.nd,
        xsws: ystzMsg.value.xsws,
        specialorgid: ystzMsg.value.dwId,
        kmlx: ystzMsg.value.kmlx,
        parentId: row.id,
        dwIds: formValue.dwIds
      };
      return new Promise((resolve: any) => {
        ystzMsg.value.requestApi(params).then((res) => {
          if (res.success) {
            resolve(res.data);
          } else {
            ElMessage.error(res.msg);
            resolve([]);
          }
        });
      });
    }
  }
});

const yskmProps = reactive({
  lazy: true,
  leaf: "leaf",
  value: "id",
  label: "name",
  emitPath: false,
  lazyLoad(node: any, resolve: any) {
    let id = node.level === 0 ? "-1" : node.data.id;
    getYskmTree(ystzMsg.value.kmlx, ystzMsg.value.nd, id, ystzMsg.value.xsws).then((res: any) => {
      if (res.success) {
        resolve(res.data);
      } else {
        ElMessage.error(res.msg);
        resolve([]);
      }
    });
  }
});

const headerCellStyle = () => {
  return {
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const isShowModal = ref(false);

const exportHandle = () => {
  let params = {
    nd: ystzMsg.value.nd,
    xsws: ystzMsg.value.xsws,
    specialorgid: ystzMsg.value.dwId,
    kmlx: ystzMsg.value.kmlx,
    dwIds: formValue.dwIds,
    yskmId: formValue.yskmId,
    flag: ystzMsg.value.flag
  };
  emits("exportData", params);
};

const closeHandle = () => {
  isShowModal.value = false;
  // 清空内容
  clearValue();
  emits("close", isShowModal.value);
};

const saveHandle = () => {
  let flag = ystzMsg.value.flag;
  if (flag === "km") {
    if (props.flag === "DEPT") {
      const tableDatas = tableInfo.tableData.find((item) => item["je"]);
      if (tableDatas) {
        const sumBcxd = tableDatas["je"] || "0";
        let sumValueDec = new Decimal(sumBcxd);
        if (props.ystzInfo.yskm && props.ystzInfo.yskm.dfj) {
          const dfjValue = new Decimal(props.ystzInfo.yskm.dfj);
          const res = sumValueDec.comparedTo(dfjValue);
          if (res === 1) {
            ElMessage.warning("本次下达(万元)大于待分解(万元)");
            return;
          }
        }
      }
    } else if (props.flag === "CITY") {
      const tableDatas = tableInfo.tableData.find((item) => item["bcxd"]);
      if (tableDatas) {
        const sumBcxd = tableDatas["bcxd"] || "0";
        let sumValueDec = new Decimal(sumBcxd);
        if (props.ystzInfo.yskm && props.ystzInfo.yskm.dfj) {
          const dfjValue = new Decimal(props.ystzInfo.yskm.dfj);
          const res = sumValueDec.comparedTo(dfjValue);
          if (res === 1) {
            ElMessage.warning("本次下达(万元)大于待分解(万元)");
            return;
          }
        }
      }
    }
  }

  let params = {
    nd: ystzMsg.value.nd,
    xsws: ystzMsg.value.xsws,
    specialorgid: ystzMsg.value.dwId,
    kmlx: ystzMsg.value.kmlx,
    dwIds: formValue.dwIds,
    yskmId: formValue.yskmId,
    flag: ystzMsg.value.flag
  };
  emits("updateValue", params);
};

const clearHandle = () => {
  formValue.dwIds = null;
  getDataList();
};

const getDwValueChangeHandle = lodash.debounce(function (val: any) {
  if (val.value && Array.isArray(val.value)) {
    formValue.dwIds = val.value.join(",");
    getDataList();
  }
}, 500);

const getYskmValueHandle = (val: string) => {
  formValue.yskmId = val;
  getDataList();
};

const formatterData = (item: Columns, _column: any, cellValue: any) => {
  if (!item.needSum) return cellValue;
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
  return formatValue(cellValue, Number(ystzMsg.value.xsws));
};

const oldInputValue = ref("0");

const focusHandle = (row: any, key: string) => {
  oldInputValue.value = row[key] ? row[key] : new Decimal(0).toFixed(Number(ystzMsg.value.xsws));
};

const isClickHeader = (columns: any[], field: string) => {
  let columnIndex = columns.findIndex((item: any) => item.eidt && item.columnKey === field);
  return columnIndex > -1;
};

const cellStyle = ({ row, column }: any) => {
  if (ystzMsg.value.flag !== "km") {
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
  } else {
    let item = tableInfo.columns.find((item) => item.columnKey === column.field && item.eidt);
    if (row.dwId === null || row.cbzx === null) {
      return {
        cursor: "auto",
        backgroundColor: "rgba(232, 234, 236,0.5)"
      };
    }
    if (!item?.eidt || props.ystzInfo.operation === "view") {
      return {
        cursor: "auto",
        backgroundColor: "rgba(232, 234, 236,0.5)"
      };
    }
  }
};

const sumhandle = (row: any, key: string) => {
  let flag = ystzMsg.value.flag;
  if (props.flag !== "PROVINCE" && flag === "km") {
    let khsValue = new Decimal(0);
    if (props.flag === "DEPT") {
      khsValue = row["kyz"] ? new Decimal(row["kyz"]) : new Decimal(0);
    } else {
      khsValue = row["khs"] ? new Decimal(row["khs"]) : new Decimal(0);
    }
    const keyValue = row[key] ? new Decimal(row[key]) : new Decimal(0);
    const result1 = keyValue.comparedTo(new Decimal(0));
    const result2 = keyValue.abs().comparedTo(khsValue);
    if (result1 === -1 && result2 === 1) {
      ElMessage.warning("本次下达(万元)调减金额大于可回收金额(万元)");
      row[key] = new Decimal(oldInputValue.value).toFixed(Number(ystzMsg.value.xsws));
    }
  }
  row[key] = row[key] ? new Decimal(row[key]).toFixed(Number(ystzMsg.value.xsws)) : new Decimal(0).toFixed(Number(ystzMsg.value.xsws));
  let columnKeys = tableInfo.columns.filter((item) => item.eidt);
  let setValueKey = "";
  if (flag === "bm") {
    setValueKey = "bcFjValue";
  }
  if (flag === "dw" || flag === "km") {
    if (props.flag === "DEPT") {
      if (tableInfo.sumColumns && ystzMsg.value.isCity) columnKeys = tableInfo.sumColumns.filter((item) => item.eidt);
      setValueKey = "je";
    } else {
      if (tableInfo.sumColumns && ystzMsg.value.isCity) columnKeys = tableInfo.sumColumns.filter((item) => item.eidt);
      setValueKey = "bcxd";
    }
  }
  if (ystzMsg.value.isCity) {
    countFjValue(row, setValueKey, key, columnKeys, "dfj");
  } else {
    countFjValue(row, setValueKey, key, columnKeys);
  }
  if (flag !== "km") {
    if (props.flag === "DEPT") {
      getGroupSummary(tableInfo.tableData, tableInfo.treeConfig as any, key, Number(ystzMsg.value.xsws), "leaf", "id", columnKeys, setValueKey);
      const dfjValue = new Decimal(row["dfj"]);
      const sumValueDec = new Decimal(row[setValueKey]);
      const res = sumValueDec.comparedTo(dfjValue);
      if (res === 1) {
        row[key] = new Decimal(oldInputValue.value).toFixed(Number(ystzMsg.value.xsws));
        ElMessage.warning("本次分解(万元)大于待分解(万元)");
        row["bcFjValue"] = 0;
        getGroupSummary(tableInfo.tableData, tableInfo.treeConfig as any, key, Number(ystzMsg.value.xsws), "leaf", "id", columnKeys, setValueKey);
      }
    } else {
      getGroupSummary(tableInfo.tableData, tableInfo.treeConfig as any, key, Number(ystzMsg.value.xsws), "leaf", "id", columnKeys, setValueKey);
    }
  } else {
    if (props.flag === "DEPT") {
      getGroupSummary(tableInfo.tableData, tableInfo.treeConfig as any, key, Number(ystzMsg.value.xsws), "leaf", "cbzx", columnKeys, setValueKey);
    } else if (props.flag === "CITY") {
      getGroupSummary(tableInfo.tableData, tableInfo.treeConfig as any, key, Number(ystzMsg.value.xsws), "leaf", "dwId", columnKeys, setValueKey);
    } else {
      getGroupSummary(tableInfo.tableData, tableInfo.treeConfig as any, key, Number(ystzMsg.value.xsws), "leaf", "dwId", columnKeys, setValueKey);
    }
  }
};

const countFjValue = (row: any, setValueKey: string, inputKey: string, columnKeys: any, sumKey?: string) => {
  let sumVal = new Decimal("0");
  if (sumKey) sumVal = row[sumKey] ? new Decimal(row[sumKey]) : new Decimal("0");
  let sumValue = new Decimal("0");
  if (columnKeys) {
    for (let i = 0; i < columnKeys.length; i++) {
      const item = columnKeys[i];
      sumValue = Decimal.add(sumValue, row[item.columnKey] ? row[item.columnKey] : 0);
    }
    row[setValueKey] = sumValue.toFixed(Number(ystzMsg.value.xsws));
  }
};

const showHandle = () => {
  ystzMsg.value.xsws = props.xsws || "2";
  tableInfo.tableData.length = 0;
  tableInfo.columns.length = 0;
  if (ystzMsg.value.yskmPath) formValue.yskmValue = ystzMsg.value.yskmPath;
  if (ystzMsg.value.yskm && ystzMsg.value.yskm.id) formValue.yskmId = ystzMsg.value.yskm.id;
  tableInfo.editConfig.enabled = props.ystzInfo.operation === "edit";
  initData(ystzMsg.value.flag);
  getDataList();
};

const clearValue = () => {
  formValue.dwList = [];
  formValue.dwValue = "";
  formValue.name = "";
  formValue.yskmValue = [];
  if (formValue.dwIds) formValue.dwIds = null;
  formValue.yskmId = "";
};

const getDataList = async () => {
  tableInfo.loading = true;
  let flag = ystzMsg.value.flag;
  let params: any = {
    nd: ystzMsg.value.nd,
    xsws: ystzMsg.value.xsws,
    specialorgid: ystzMsg.value.dwId,
    kmlx: ystzMsg.value.kmlx
  };
  if (flag !== "km") {
    params.dwIds = formValue.dwIds;
    params.parentId = ystzMsg.value.nd;
  } else {
    params.yskmId = formValue.yskmId;
  }
  let tableListRes = await ystzMsg.value.requestApi(params);
  let headerRes = await ystzMsg.value.dynamicColumnApi(params);
  if (tableListRes.success && headerRes.success) {
    tableInfo.tableData = tableListRes.data;
    tableInfo.columns = headerRes.data.filter((item: Columns) => !item.hidden);
    tableInfo.sumColumns = headerRes.data;
  } else {
    ElMessage.error("请重新再试！");
  }
  tableInfo.loading = false;
};

const initData = async (flag: string) => {
  if (flag === "dw") {
    formValue.name = "单位：";
    let dwRes = await getDwJc(ystzMsg.value.dwId, "ND", ystzMsg.value.kmlx);
    if (dwRes.success) formValue.dwList = dwRes.data;
  } else if (flag === "km") {
    formValue.name = "预算科目：";
  } else {
    formValue.name = "部门：";
    let dwRes = await getDwCbzxList(ystzMsg.value.dwId, ystzMsg.value.kmlx);
    if (dwRes.success) formValue.dwList = dwRes.data;
  }
};

defineExpose({
  isShowModal,
  closeHandle,
  tableInfo,
  table: tableRef,
  getDataList
});
</script>

<style scoped lang="less">
.operation {
  display: flex;
  align-items: center;

  &-left,
  &-right {
    width: 50%;
  }
}

.modal-table {
  height: calc(100% - 44px);
}
</style>
