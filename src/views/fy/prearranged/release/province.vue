<template>
  <div v-show="userMsg.isShowPage" class="container">
    <fy-header @change-xsws="changeXswsHandle" @change-nd="changeNdHandle" ref="headerRef" :dw-name="userMsg.dwName" :tool-button="['dw', 'nd', 'xsws']" />
    <el-tabs type="border-card" v-model="tabMsg.name" @tab-click="isDisabledBtn">
      <el-tab-pane label="其他运营费用-主业" name="1">
        <div class="opeartion" v-if="userMsg.isShowPage">
          <div class="opeartion-left">
            <el-button type="primary" v-permission="'RELEASE'" :disabled="btnIsDisabled" plain @click="releaseNewHandle">下 达 </el-button>
            <el-button type="primary" v-permission="'RELEASES'" :disabled="btnIsDisabled" plain @click="releaseHandle">下 达 </el-button>
            <el-button type="primary" plain @click="expandHandle">一键展开</el-button>
            <el-button type="primary" v-permission="'EXPORT'" :disabled="userMsg.loading" plain @click="exportTableDataHandle('zy')">导 出 </el-button>
          </div>
          <div class="opeartion-right">
            <span>当前状态：{{ userInfo.statusInfo }}</span>
            <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table 
            :row-config="tableMsg.rowConfig"
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
            :data="tableMsg.tableData"
            show-overflow
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="!item.hidden"
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
              <vxe-column :visible="!item.hidden" width="120" :fixed="item.fixed ? 'left' : ''" :formatter="formatterData" header-align="center" align="right" v-else :field="item.columnKey" :title="item.columnValue"></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
      <el-tab-pane label="其他运营费用-农电" name="2">
        <div class="opeartion" v-if="userMsg.isShowPage">
          <div class="opeartion-left">
            <el-button type="primary" v-permission="'RELEASE'" :disabled="btnIsDisabled" plain @click="releaseNewHandle">下 达 </el-button>
            <el-button type="primary" v-permission="'RELEASES'" :disabled="btnIsDisabled" plain @click="releaseHandle">下 达 </el-button>
            <el-button type="primary" plain @click="expandHandle">一键展开</el-button>
            <el-button type="primary" v-permission="'EXPORT'" :disabled="userMsg.loading" plain @click="exportTableDataHandle('nd')">导 出 </el-button>
          </div>
          <div class="opeartion-right">
            <span>当前状态：{{ userInfo.statusInfo }}</span>
            <vxe-toolbar ref="toolbarTwoRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table 
            :row-config="tableMsg.rowConfig"
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
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :fixed="item.fixed ? 'left' : ''"
                :visible="!item.hidden"
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
              <vxe-column :visible="!item.hidden" width="120" :fixed="item.fixed ? 'left' : ''" show-overflow :formatter="formatterData" header-align="center" align="right" v-else :field="item.columnKey" :title="item.columnValue"></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
    </el-tabs>
    <dwbzView
      busi-type="YAP"
      :operation-flag="dwMsg.operationFlag"
      :toolButton="dwMsg.toolButton"
      width="70%"
      height="800"
      :tableApi="getDataByDw"
      :header-api="headerDataHandle"
      :templateApi="getDwImportTemplate"
      :importDataApi="importData"
      :exportApi="exportForDw"
      :saveApi="saveDataHandle"
      flag="ProviceRelease"
      :kmlx="userMsg.flag"
      @update-table="getTableData"
      :specialorgid="userMsg.specialorgid"
      :dw-id="dwMsg.dwId"
      :nd="tableMsg.nd"
      :xsws="tableMsg.xsws"
      @close-dialog="(val: boolean) => closeModalHandle(val, 'dw')"
      :is-show-modal="dwMsg.isShowModal"
      :title="dwMsg.title"
      ref="dwbzViewRef"
    ></dwbzView>
    <yskmView
      :xsws="tableMsg.xsws"
      busi-type="YAP"
      width="70%"
      height="800"
      title="预安排下达 - 科目查看"
      :tableApi="getDataByKm"
      :header-api="getDynamicColumnByKm"
      :exportApi="exportForKm"
      flag="ProviceRelease"
      :kmlx="userMsg.flag"
      @update-table="getTableData"
      :specialorgid="userMsg.specialorgid"
      :km-id="kmMsg.kmId"
      :nd="tableMsg.nd"
      @close-dialog="(val: boolean) => closeModalHandle(val, 'km')"
      :is-show-modal="kmMsg.isShowModal"
    ></yskmView>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: "/fy/prearranged/release/province"
};
</script>

<script setup lang="ts">
import FyHeader from "@/views/fy/components/Header.vue";
import userDialog from "@/components/select/userDialog.vue";
import dwbzView from "@/views/fy/prearranged/release/components/dwbzView.vue";
import yskmView from "@/views/fy/prearranged/release/components/yskmView.vue";
import type { TableMsg } from "@/views/fy/prearranged/interface";

import { computed, onMounted, reactive, ref } from "vue";
import { saveByDw, getDataList, getDynamicColumn, importData, getDwImportTemplate, exportForDw, getCurrentPageData, releaseData, getDataByKm, getDynamicColumnByKm, getDataByDw, getDynamicColumnByDw, saveAndXd, judgeIsXdNew, exportData, exportForKm } from "@/api/fy/release";
import { ElMessage, ElMessageBox } from "element-plus";
import { findPrevNode, formatValue } from "@/utils/utils";
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
  title: "预安排下达 - 单位编制",
  toolButton: ["save", "import", "close"],
  operationFlag: "EDIT"
});

const userInfo = ref<{
  statusInfo: string;
  dwName: string;
}>({
  statusInfo: "",
  dwName: ""
});

const tabMsg = reactive({
  name: "1",
  isDisabled: ""
});

const count = ref(0);

const btnIsDisabled = computed(() => !(tabMsg.isDisabled === "1") || userMsg.loading);

const kmMsg = reactive<any>({
  isShowModal: false,
  kmId: []
});

const tableMsg = reactive<TableMsg>({
  rowConfig: {
    height: 32
  },
  xsws: "",
  nd: "",
  tableData: [],
  ndData: [],
  columns: [],
  ndColumns: [],
  zyTreeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod({ row }: any) {
      userMsg.loading = true;
      count.value++;
      let params = {
        nd: tableMsg.nd,
        specialorgid: userMsg.specialorgid,
        kmlx: "1",
        parentId: row.id,
        xsws: tableMsg.xsws
      };
      return new Promise((resolve: any) => {
        getDataList({
          ...params
        }).then((res: any) => {
          if (res.success) {
            count.value--;
            resolve(res.data);
          } else {
            ElMessage.error(res.msg);
            resolve([]);
            userMsg.loading = false;
          }
          if (!count.value) userMsg.loading = false;
        });
      });
    }
  },
  ndTreeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod({ row }: any) {
      userMsg.loading = true;
      count.value++;
      let params = {
        nd: tableMsg.nd,
        specialorgid: userMsg.specialorgid,
        kmlx: "2",
        parentId: row.id,
        xsws: tableMsg.xsws
      };
      return new Promise((resolve: any) => {
        getDataList({
          ...params
        }).then((res: any) => {
          if (res.success) {
            count.value--;
            resolve(res.data);
          } else {
            ElMessage.error(res.msg);
            userMsg.loading = false;
            resolve([]);
          }
          if (!count.value) userMsg.loading = false;
        });
      });
    }
  }
});

const headerDataHandle = (params: any) => {
  params.opType = "1";
  return getDynamicColumnByDw(params);
};

// 关闭modal
const closeModalHandle = (val: boolean, flag: string) => {
  flag === "dw" ? (dwMsg.isShowModal = val) : (kmMsg.isShowModal = val);
};

// 下达新
const releaseNewHandle = async () => {
  ElMessageBox.confirm("是否确认下达？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "success"
  }).then(async () => {
    let res = await saveAndXd("YAP", userMsg.flag, tableMsg.nd, userMsg.specialorgid, userMsg.userData.id);
    if (res.success) {
      ElMessage.success("下达成功！");
      initAjudgeIsXd();
    } else {
      ElMessage.error(res.msg);
    }
  });
};

// 下达
const releaseHandle = async () => {
  ElMessageBox.confirm("是否确认下达？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "success"
  }).then(async () => {
    let res = await releaseData("YAP", userMsg.flag, tableMsg.nd, userMsg.specialorgid, userMsg.userData.id);
    if (res.success) {
      ElMessage.success("下达成功！");
      initAjudgeIsXd();
    } else {
      ElMessage.error(res.msg);
    }
  });
};

// 展开
const expandHandle = async () => {
  const tableData = Number(userMsg.flag) === 1 ? tableMsg.tableData : tableMsg.ndData;
  const $table = Number(userMsg.flag) === 1 ? treeTableRef.value : tableRef.value;
  if ($table) {
    expandAllTree(tableData, $table);
  }
};

const expandAllTree = async (data: any[], $table: any) => {
  for (const row of data) {
    if (row.leaf) {
      await $table.setTreeExpand(row, true);
      if (row.children) {
        expandAllTree(row.children, $table);
      }
    }
  }
};

const saveDataHandle = (params: any) => {
  // 获取表格录入的数据
  const records: any[] = dwbzViewRef.value.element.getUpdateRecords();
  const updateRecords = records.filter((item) => item.id && !item.leaf);
  let mxList = updateRecords.map((item) => {
    return {
      je: item.je,
      yskmId: item.id,
      detailId: item.detailId ? item.detailId : ""
    };
  });
  params.mxList = mxList;
  initAjudgeIsXd();
  return saveByDw(params);
};

// 导出
const exportTableDataHandle = async (flag: string) => {
  userMsg.loading = true;
  exportData({
    busiType: "YAP",
    kmlx: userMsg.flag,
    nd: tableMsg.nd,
    specialorgid: userMsg.specialorgid,
    parentId: "-1",
    xsws: tableMsg.xsws
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

// 判断表头是否可以点击
const isClickHeader = (columns: Columns[], field: string) => {
  return columns.find((item: Columns) => item.eidt && item.columnKey === field);
};

// 表头点击
const headerCellClickHandle = ({ columnIndex, column }: any, flag: string) => {
  const isClick = isClickHeader(tableMsg.columns as Columns[], column.field);
  if (isClick) {
    dwMsg.isShowModal = true;
    dwMsg.dwId = column.field;
    userMsg.flag = flag;
    // dwMsg.title = tabMsg.isDisabled === "0" || tabMsg.isDisabled === "1" ? "预安排下达 - 单位编制" : "预安排下达 - 单位查看";
    // dwMsg.toolButton = tabMsg.isDisabled === "0" || tabMsg.isDisabled === "1" ? ["save", "import", "close"] : ["close"];
    // dwMsg.operationFlag = tabMsg.isDisabled === "0" || tabMsg.isDisabled === "1" ? "edit" : "view";
    dwMsg.title = tabMsg.isDisabled !== "0" ? "预安排下达 - 单位编制" : "预安排下达 - 单位查看";
    dwMsg.toolButton = tabMsg.isDisabled !== "0" ? ["save", "import", "close"] : ["close"];
    dwMsg.operationFlag = tabMsg.isDisabled !== "0" ? "edit" : "view";
  }
};

const headerCellStyle = ({ column }: any) => {
  const isClick = isClickHeader(tableMsg.columns as Columns[], column.field);
  if (isClick) {
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

const cellStyle = ({ row, column }: any) => {
  if (row.id && !row.leaf && column.field === "name") {
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

const cellClickHandle = async ({ row, column }: any, flag: string) => {
  if (row.id && !row.leaf && column.field === "name") {
    kmMsg.isShowModal = true;
    const tableData = Number(userMsg.flag) === 1 ? tableMsg.tableData : tableMsg.ndData;
    kmMsg.kmId = findPrevNode(tableData, row);
    userMsg.flag = flag;
  }
};

// 判断表头是否可以点击
const isNeedNum = (columns: any[], field: string) => {
  let findIndex = columns.findIndex((item) => item.needSum && item.columnKey === field);
  return findIndex > -1;
};

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
  if (tableMsg.columns) {
    const isNum = isNeedNum(tableMsg.columns, column.field);
    if (isNum) {
      return formatValue(cellValue, Number(tableMsg.xsws));
    }
  }
  return cellValue;
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
    initAjudgeIsXd();
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
  let users = await getCurrentPageData(userMsg.specialorgid, tableMsg.nd, userMsg.flag);
  let res = await judgeIsXdNew("YAP", userMsg.flag, tableMsg.nd);
  if (res.success && users.success) {
    userInfo.value = { ...users.data };
    tabMsg.isDisabled = res.data;
    userMsg.dwName = userInfo.value.dwName;
  }
};

const linkTable = () => {
  const $table = Number(userMsg.flag) === 1 ? treeTableRef.value : tableRef.value;
  const $toolBar = Number(userMsg.flag) === 1 ? toolbarOneRef.value : toolbarTwoRef.value;
  if ($table && $toolBar) {
    $table.connect($toolBar);
  }
};

// const initAjudgeIsXdOld = async () => {
//   let res = await judgeIsXd("YAP", userMsg.flag, tableMsg.nd);
//   if (res.success) {
//     tabMsg.isDisabled = res.data;
//   }
// };

const getTableData = async () => {
  clearTableData();
  userMsg.loading = true;
  let params = {
    nd: tableMsg.nd,
    specialorgid: userMsg.specialorgid,
    kmlx: userMsg.flag,
    parentId: "-1",
    xsws: tableMsg.xsws
  };
  let res = await Promise.all([getDynamicColumn(params), getDataList(params)]);
  if (res[0].success && res[1].success) {
    tableMsg.columns = res[0].data.filter((item: Columns) => item.visible);
    Number(userMsg.flag) === 1 ? (tableMsg.tableData = res[1].data) : (tableMsg.ndData = res[1].data);
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
      min-width: 0;
      min-height: 0;
      flex: 1;
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
