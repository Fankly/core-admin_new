<template>
  <div v-show="userMsg.isShowPage" class="container">
    <fy-header @change-xsws="changeXswsHandle" @change-nd="changeNdHandle" ref="headerRef" :dw-name="userMsg.dwName" :tool-button="['dw', 'nd', 'xsws']" />
    <el-tabs type="border-card" v-model="tabMsg.name" @tab-click="isDisabledBtn">
      <el-tab-pane label="其他运维费用-主业" name="1">
        <div class="opeartion" v-if="userMsg.isShowPage">
          <div class="opeartion-left">
            <el-button type="primary" v-permission="'CALCULATE'" :disabled="isDisableBtn" plain @click="calclateHanle">测 算</el-button>
            <el-button type="primary" v-permission="'SAVE'" :disabled="isDisableBtn" plain @click="saveHandle">保 存</el-button>
            <el-button type="primary" v-permission="'RELEASE'" :disabled="btnIsDisabled" plain @click="releaseHandle">下 达</el-button>
            <el-button type="primary" v-permission="'EXPORT'" :disabled="userMsg.loading" plain @click="exportTableDataHandle('zy')">导 出</el-button>
          </div>
          <div class="opeartion-right">
            <span>当前状态：{{ tabMsg?.dwInfo.statusInfo }}</span>
            <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table 
            :row-config="tableMsg.rowConfig"
            keep-source
            :loading="userMsg.loading"
            align="center"
            @cell-click="(tables: any) => cellClickHandle(tables, '1')"
            :cell-style="cellStyle"
            :header-cell-style="headerCellStyle"
            @header-cell-click="(tables: any) => headerCellClickHandle(tables, '1')"
            height="100%"
            ref="treeTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :tree-config="tableMsg.zyTreeConfig"
            :edit-config="tableMsg.editConfig"
            :data="tableMsg.tableData"
            show-overflow
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="item.visible"
                width="340"
                :fixed="item.fixed ? 'left' : ''"
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterData"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="item.visible"
                v-else-if="item.eidt"
                width="120"
                :fixed="item.fixed ? 'left' : ''"
                :formatter="formatterData"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input v-number-input="tableMsg.xsws" class="my-input" @change="sumhandle(row, item.columnKey)" v-if="row?.id && !row?.leaf" v-model="row[item.columnKey]" maxlength="20" />
                </template>
              </vxe-column>
              <vxe-column :visible="item.visible" v-else width="120" :fixed="item.fixed ? 'left' : ''" :formatter="formatterData" header-align="center" align="right" :field="item.columnKey" :title="item.columnValue"></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
      <el-tab-pane label="其他运维费用-农电" name="2">
        <div class="opeartion" v-if="userMsg.isShowPage">
          <div class="opeartion-left">
            <el-button type="primary" v-permission="'CALCULATE'" :disabled="isDisableBtn" plain @click="calclateHanle">测 算</el-button>
            <el-button type="primary" v-permission="'SAVE'" :disabled="isDisableBtn" plain @click="saveHandle">保 存</el-button>
            <el-button type="primary" v-permission="'RELEASE'" :disabled="btnIsDisabled" plain @click="releaseHandle">下 达</el-button>
            <el-button type="primary" v-permission="'EXPORT'" :disabled="userMsg.loading" plain @click="exportTableDataHandle('nd')">导 出</el-button>
          </div>
          <div class="opeartion-right">
            <span>当前状态：{{ tabMsg?.dwInfo.statusInfo }}</span>
            <vxe-toolbar ref="toolbarTwoRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table 
            :row-config="tableMsg.rowConfig"
            keep-source
            show-overflow
            :loading="userMsg.loading"
            @cell-click="(tables: any) => cellClickHandle(tables, '2')"
            :cell-style="cellStyle"
            :header-cell-style="headerCellStyle"
            @header-cell-click="(tables: any) => headerCellClickHandle(tables, '2')"
            height="100%"
            ref="tableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :tree-config="tableMsg.ndTreeConfig"
            :data="tableMsg.ndData"
            :edit-config="tableMsg.editConfig"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="item.visible"
                :fixed="item.fixed ? 'left' : ''"
                show-overflow
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterData"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                width="340"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="item.visible"
                v-else-if="item.eidt"
                width="120"
                :fixed="item.fixed ? 'left' : ''"
                :formatter="formatterData"
                header-align="center"
                align="right"
                :field="item.columnKey"
                :title="item.columnValue"
                :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
              >
                <template #edit="{ row }">
                  <input class="my-input" v-number-input="tableMsg.xsws" @change="sumhandle(row, item.columnKey)" v-if="row?.id && !row?.leaf" v-model="row[item.columnKey]" maxlength="20" />
                </template>
              </vxe-column>
              <vxe-column :visible="item.visible" v-else width="120" :fixed="item.fixed ? 'left' : ''" show-overflow :formatter="formatterData" header-align="center" align="right" :field="item.columnKey" :title="item.columnValue"></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
    </el-tabs>
    <dwbzView
      :xsws="tableMsg.xsws"
      busi-type="ND"
      :operation-flag="dwMsg.operationFlag"
      :toolButton="dwMsg.toolButton"
      width="90%"
      height="800"
      :tableApi="getDataByDw"
      :header-api="headerDataHandle"
      flag="ProviceRelease"
      :kmlx="userMsg.flag"
      @update-table="getTableData"
      :specialorgid="userMsg.specialorgid"
      :dw-id="dwMsg.dwId"
      :nd="tableMsg.nd"
      @close-dialog="(val: boolean) => closeModalHandle(val, 'dw')"
      :is-show-modal="dwMsg.isShowModal"
      :title="dwMsg.title"
      ref="dwbzViewRef"
      :exportApi="exportForDw"
    ></dwbzView>
    <yskmView
      :xsws="tableMsg.xsws"
      busi-type="ND"
      width="70%"
      height="800"
      title="年度下达 - 科目查看"
      :tableApi="getDataByKm"
      :header-api="getDynamicColumnByKm"
      flag="ProviceRelease"
      :kmlx="userMsg.flag"
      @update-table="getTableData"
      :specialorgid="userMsg.specialorgid"
      :km-id="kmMsg.kmId"
      :nd="tableMsg.nd"
      @close-dialog="(val: boolean) => closeModalHandle(val, 'km')"
      :is-show-modal="kmMsg.isShowModal"
      :exportApi="exportForKm"
    ></yskmView>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: "/fy/annually/release/province"
};
</script>

<script setup lang="ts">
import FyHeader from "@/views/fy/components/Header.vue";
import userDialog from "@/components/select/userDialog.vue";
import dwbzView from "@/views/fy/components/dwbzView.vue";
import yskmView from "@/views/fy/components/yskmView.vue";
import type { TableMsg } from "@/views/fy/prearranged/interface";

import { computed, onMounted, reactive, ref } from "vue";
import { getDataList, getDynamicColumn, exportForDw, exportForKm, judgeIsXd, exportData, getDataByKm, getDynamicColumnByKm, getDataByDw, getDynamicColumnByDw, csData, xdData, save } from "@/api/fy/annually/release/province";
import { getGroupSummary } from "@/utils/prearranged";
import { ElMessage, ElMessageBox } from "element-plus";
import { findPrevNode, formatValue } from "@/utils/utils";
import { Decimal } from "decimal.js";
import { VXETable } from "vxe-table";
import { Columns } from "@/views/fy/prearranged/interface";

const userDialogRef = ref();
const treeTableRef = ref();
const tableRef = ref();
const headerRef = ref();
const dwbzViewRef = ref();
const toolbarOneRef = ref();
const toolbarTwoRef = ref();

const userMsg = reactive<any>({
  userData: null,
  specialorgid: "",
  dwName: "",
  isShowPage: false,
  loading: false,
  flag: "1"
});

const dwMsg = reactive<{
  isShowModal: boolean;
  dwId: string;
  title: string;
  toolButton: any;
  operationFlag: string;
}>({
  isShowModal: false,
  dwId: "",
  title: "年度下达 - 单位查看",
  toolButton: ["close", "export"],
  operationFlag: "view"
});

const tabMsg = reactive<{
  name: string;
  dwInfo: any;
}>({
  name: "1",
  dwInfo: ""
});

const isDisableBtn = computed(() => tabMsg.dwInfo.xdzt >= "4" || userMsg.loading);
const btnIsDisabled = computed(() => !(tabMsg.dwInfo.xdzt === "1") || userMsg.loading);

const kmMsg = reactive<any>({
  isShowModal: false,
  kmId: []
});

const activeCellMethod = ({ row }: any) => {
  return row.edit;
};

const tableMsg = reactive<TableMsg>({
  rowConfig: {
    height: 32
  },
  nd: "",
  xsws: "",
  tableData: [],
  ndData: [],
  columns: [],
  ndColumns: [],
  editConfig: {
    trigger: "click",
    mode: "cell",
    showStatus: true,
    enabled: true,
    beforeEditMethod: activeCellMethod
  },
  zyTreeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod({ row }: any) {
      let params = {
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        specialorgid: userMsg.specialorgid,
        kmlx: "1",
        parentId: row.id,
        busiType: "ND"
      };
      return new Promise((resolve: any) => {
        getDataList({
          ...params
        }).then((res: any) => {
          if (res.success) {
            resolve(res.data);
          } else {
            ElMessage.error(res.msg);
            resolve([]);
          }
        });
      });
    }
  },
  ndTreeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod({ row }: any) {
      let params = {
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        specialorgid: userMsg.specialorgid,
        kmlx: "2",
        parentId: row.id,
        busiType: "ND"
      };
      return new Promise((resolve: any) => {
        getDataList({
          ...params
        }).then((res: any) => {
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

const sumhandle = (row: any, key: string) => {
  let columnKeys = tableMsg.columns?.filter((item) => item.eidt);
  row[key] = row[key] ? new Decimal(row[key]).toFixed(Number(tableMsg.xsws)) : new Decimal(0).toFixed(Number(tableMsg.xsws));
  const config: any = tabMsg.name === "1" ? tableMsg.zyTreeConfig : tableMsg.ndTreeConfig;
  const tableData = Number(tabMsg.name) === 1 ? tableMsg.tableData : tableMsg.ndData;
  countYapFjValue(row, "je", columnKeys);
  getGroupSummary(tableData, config, key, Number(tableMsg.xsws), "leaf", "id", columnKeys, "je");
};

const countYapFjValue = (row: any, setValueKey: string, columnKeys: any) => {
  let sumValue: any = 0;
  if (columnKeys) {
    for (let i = 0; i < columnKeys.length; i++) {
      const item = columnKeys[i];
      sumValue = Decimal.add(sumValue, row[item.columnKey] ? row[item.columnKey] : 0);
    }
    row[setValueKey] = sumValue.toFixed(2);
  }
};

const headerDataHandle = (params: any) => {
  params.opType = "1";
  return getDynamicColumnByDw(params);
};

// 关闭modal
const closeModalHandle = (val: boolean, flag: string) => {
  flag === "dw" ? (dwMsg.isShowModal = val) : (kmMsg.isShowModal = val);
};

const saveHandle = async () => {
  const $table = tabMsg.name === "1" ? treeTableRef.value : tableRef.value;
  if ($table) {
    let resultData: any = [];
    // 获取表格录入的数据
    const records: any[] = $table.getUpdateRecords();
    const updateRecords = records.filter((item) => item.edit);
    if (updateRecords.length === 0) {
      ElMessage.warning("未进行修改操作,请修改后再进行保存！");
      return;
    }
    const type = await VXETable.modal.confirm("是否确定保存？", "提示", {
      status: "warning"
    });
    if (type === "confirm") {
      let columnKeys = tableMsg.columns?.filter((item) => item.eidt);
      updateRecords.forEach((rowData) => {
        let list: any = {
          yskmId: "",
          dwValues: {}
        };
        columnKeys?.forEach((item) => {
          if (list.yskmId !== rowData.id) {
            list.yskmId = rowData.id;
          }
          list.dwValues[item.columnKey] = rowData[item.columnKey];
        });
        resultData.push(list);
      });
      let params = {
        lists: resultData,
        nd: tableMsg.nd,
        specialorgid: userMsg.specialorgid,
        kmlx: userMsg.flag
      };
      let res = await save(params);
      if (res.success) {
        ElMessage.success("保存成功");
        initAjudgeIsXd();
        getTableData();
      } else {
        ElMessage.error(res.msg);
      }
    }
  }
};

// 测算
const calclateHanle = () => {
  ElMessageBox.confirm("是否确定测算？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "success"
  }).then(async () => {
    userMsg.loading = true;
    let res = await csData({
      nd: tableMsg.nd,
      xsws: tableMsg.xsws,
      specialorgid: userMsg.specialorgid,
      kmlx: userMsg.flag
    });
    if (res.success) {
      ElMessage.success("测算成功");
      initAjudgeIsXd();
      getTableData();
      userMsg.loading = false;
    } else {
      userMsg.loading = false;
      ElMessage.error(res.msg);
    }
  });
};

// 下达
const releaseHandle = async () => {
  ElMessageBox.confirm("确定是否下达？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "success"
  }).then(async () => {
    let res = await xdData({
      nd: tableMsg.nd,
      xsws: tableMsg.xsws,
      specialorgid: userMsg.specialorgid,
      kmlx: userMsg.flag,
      roleId: userMsg.userData.id
    });
    if (res.success) {
      ElMessage.success("下达成功");
      await initAjudgeIsXd();
      await getTableData();
    } else {
      ElMessage.error(res.msg);
    }
  });
};

// 导出
const exportTableDataHandle = (flag: string) => {
  userMsg.loading = true;
  exportData({
    busiType: "ND",
    kmlx: userMsg.flag,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    specialorgid: userMsg.specialorgid,
    parentId: "-1"
  }).then((res: any) => {
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
    userMsg.loading = false;
  });
};
// 表头点击
const headerCellClickHandle = ({ columnIndex, column }: any, flag: string) => {
  if (isClickHeader(tableMsg.columns as Columns[], column.field)) {
    dwMsg.isShowModal = true;
    dwMsg.dwId = column.field;
    userMsg.flag = flag;
  }
};

const headerCellStyle = ({ column }: any) => {
  if (isClickHeader(tableMsg.columns as Columns[], column.field)) {
    return {
      cursor: "pointer",
      color: "rgb(0, 112, 107)",
      padding: "8px 0",
      lineHeight: "16px"
    };
  }
  return {
    cursor: "auto",
    color: "#303133",
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const cellClickHandle = async ({ row, columnIndex, column }: any, flag: string) => {
  if (row.id && !row.leaf && columnIndex === 0) {
    kmMsg.isShowModal = true;
    const tableData = Number(userMsg.flag) === 1 ? tableMsg.tableData : tableMsg.ndData;
    kmMsg.kmId = findPrevNode(tableData, row);
    userMsg.flag = flag;
  }
};

const isClickHeader = (columns: Columns[], field: string) => {
  let columnIndex = columns.findIndex((item: any) => item.eidt && item.columnKey === field);
  return columnIndex > -1;
};

const cellStyle = ({ row, column, columnIndex }: any) => {
  if (row.id && !row.leaf && columnIndex === 0) {
    return {
      cursor: "pointer",
      backgroundColor: "rgba(232, 234, 236,0.5)",
      color: "rgb(0, 112, 107)"
    };
  }
  if (tableMsg.editConfig && !tableMsg.editConfig.enabled) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)",
      color: "rgb(96, 98, 102)"
    };
  }
  if (!isClickHeader(tableMsg.columns as Columns[], column.field)) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)",
      color: "rgb(96, 98, 102)"
    };
  }

  if (!row.id || row.leaf || !row.edit) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)",
      color: "rgb(96, 98, 102)"
    };
  }
};

const formatterData = ({ column, cellValue }: any) => {
  if (column.field === "cnx" || column.field === "name") {
    return cellValue;
  }
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
  return formatValue(cellValue, Number(tableMsg.xsws));
};

const getRoleHandle = async () => {
  userMsg.userData = { ...userDialogRef.value.userMsg };
  userMsg.specialorgid = userMsg.userData.org_id;
  const isQuery = userDialogRef.value.isQuery;
  tableMsg.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString();
  tableMsg.xsws = headerRef.value.formParams.xsws || "2";
  if (isQuery) {
    userMsg.isShowPage = true;
    // 判断是否已经下达
    // 获取动态列和动态表头
    await initAjudgeIsXd();
    await getTableData();
    linkTable();
  }
};

const isDisabledBtn = ({ props }: any) => {
  userMsg.flag = props.name;
  initAjudgeIsXd();
  getTableData();
  linkTable();
};

const initAjudgeIsXd = async () => {
  let res = await judgeIsXd(userMsg.specialorgid, userMsg.flag, tableMsg.nd);
  if (res.success) {
    tabMsg.dwInfo = res.data;
    userMsg.dwName = tabMsg.dwInfo.dwName;
    if (tableMsg.editConfig) {
      tableMsg.editConfig.enabled = tabMsg.dwInfo.xdzt === "1" || tabMsg.dwInfo.xdzt === "2" || tabMsg.dwInfo.xdzt === "3";
    }
  }
};

const linkTable = () => {
  const $table = Number(userMsg.flag) === 1 ? treeTableRef.value : tableRef.value;
  const $toolBar = Number(userMsg.flag) === 1 ? toolbarOneRef.value : toolbarTwoRef.value;
  if ($table && $toolBar) {
    $table.connect($toolBar);
  }
};

const getTableData = async () => {
  clearTableData();
  userMsg.loading = true;
  let params = {
    busiType: "ND",
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    specialorgid: userMsg.specialorgid,
    kmlx: userMsg.flag,
    parentId: "-1"
  };
  let res = await Promise.all([getDynamicColumn(tableMsg.nd, userMsg.specialorgid, userMsg.flag), getDataList(params)]);
  if (res[0].success && res[1].success) {
    tableMsg.columns = res[0].data.filter((item: Columns) => item.visible);
    Number(userMsg.flag) === 1 ? (tableMsg.tableData = res[1].data) : (tableMsg.ndData = res[1].data);
    // compTableWidth();
  } else {
    ElMessage.error("请刷新页面进行重试！");
  }
  userMsg.loading = false;
};

const initData = async () => {
  // 调用角色modal
  userDialogRef.value.getUser();
};

const changeNdHandle = (val: string) => {
  tableMsg.nd = val;
  initAjudgeIsXd();
  getTableData();
};

const changeXswsHandle = (val: string) => {
  tableMsg.xsws = val;
  initAjudgeIsXd();
  getTableData();
};

const clearTableData = () => {
  if (tableMsg.columns) tableMsg.columns.length = 0;
  if (tableMsg.tableData) tableMsg.tableData.length = 0;
  if (tableMsg.ndData) tableMsg.ndData.length = 0;
};

onMounted(initData);
</script>

<style scoped lang="less">
.container {
  height: 100%;
  position: relative;

  .el-tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      padding: 10px;
      height: calc(100% - 39px);
    }

    .el-tab-pane {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .opeartion {
      display: flex;
      margin-bottom: 10px;
      align-items: center;

      &-left,
      &-right {
        width: 50%;
      }

      &-right {
        text-align: right;
      }
    }

    .standrand-table {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
}
.opeartion-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .toolbar {
    margin-left: 10px;
  }
}
</style>
